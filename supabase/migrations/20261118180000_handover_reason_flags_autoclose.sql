-- =====================================================================================
-- Lost & Found UNKLAB — Tahap Serah Terima Klaim, Alasan Penutupan, Validasi Batas Peta,
--                       Aduan Komunitas (Tanpa Admin), dan Auto-Close Semester (90 Hari)
-- =====================================================================================

begin;

create or replace function public.lf_is_within_campus(
  p_lat double precision,
  p_lng double precision
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_lat is null or p_lng is null then true
    else (
      6371000 * 2 * asin(
        sqrt(
          power(sin(radians(p_lat - 1.4175) / 2), 2) +
          cos(radians(1.4175)) * cos(radians(p_lat)) *
          power(sin(radians(p_lng - 124.9840) / 2), 2)
        )
      )
    ) <= 600
  end
$$;

create or replace function public.lf_is_closed_status(p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_status, '') in ('Sudah ditemukan', 'Sudah dikembalikan', 'Dibatalkan / Ditutup')
$$;

create or replace function public.lf_auto_close_expired_reports()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
  v_count int := 0;
begin
  for v_rec in
    select id, owner_id, title
    from public.reports
    where not public.lf_is_closed_status(status)
      and reported_at < now() - interval '90 days'
  loop
    update public.reports
    set status = 'Dibatalkan / Ditutup'
    where id = v_rec.id;

    update public.report_status_history
    set note = 'Ditutup otomatis oleh sistem (melewati masa aktif semester 90 hari)',
        changed_by = null
    where id = (
      select h.id
      from public.report_status_history h
      where h.report_id = v_rec.id
      order by h.created_at desc, h.id desc
      limit 1
    );

    v_count := v_count + 1;
  end loop;
  return v_count;
exception when others then
  return 0;
end;
$$;

create table if not exists public.report_flags (
  id          bigint generated always as identity primary key,
  report_id   bigint not null references public.reports(id) on delete cascade,
  reporter_id bigint not null references public.users(id) on delete cascade,
  reason      text not null check (char_length(btrim(reason)) between 3 and 120),
  note        text not null default '' check (char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  unique (report_id, reporter_id)
);

create index if not exists report_flags_report_idx on public.report_flags (report_id);

alter table public.report_flags enable row level security;
revoke all on table public.report_flags from anon, authenticated;

create or replace function public.api_flag_report(
  p_token text,
  p_report_id bigint,
  p_reason text,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_report  public.reports%rowtype;
  v_reason  text := btrim(coalesce(p_reason, ''));
  v_note    text := btrim(coalesce(p_note, ''));
  v_count   int;
  v_closed  boolean := false;
begin
  if char_length(v_reason) < 3 then
    raise exception 'Pilih alasan pelaporan terlebih dahulu.';
  end if;

  select * into v_report from public.reports where id = p_report_id;
  if not found then
    raise exception 'Laporan tidak ditemukan.';
  end if;
  if v_report.owner_id = v_user_id then
    raise exception 'Anda tidak dapat melaporkan kiriman Anda sendiri.';
  end if;

  insert into public.report_flags (report_id, reporter_id, reason, note)
  values (p_report_id, v_user_id, v_reason, v_note)
  on conflict (report_id, reporter_id)
  do update set reason = excluded.reason, note = excluded.note, created_at = now();

  select count(*) into v_count from public.report_flags where report_id = p_report_id;

  if v_count >= 3 and not public.lf_is_closed_status(v_report.status) then
    update public.reports
    set status = 'Dibatalkan / Ditutup'
    where id = p_report_id;

    update public.report_status_history
    set note = 'Ditutup otomatis oleh moderasi komunitas (3+ aduan mahasiswa: ' || v_reason || ')',
        changed_by = null
    where id = (
      select h.id
      from public.report_status_history h
      where h.report_id = p_report_id
      order by h.created_at desc, h.id desc
      limit 1
    );

    insert into public.notifications (user_id, kind, title, body, link_path)
    values (
      v_report.owner_id,
      'report',
      'Laporan "' || v_report.title || '" ditutup oleh moderasi komunitas',
      'Laporan ini menerima beberapa aduan komunitas (' || v_reason || ') sehingga statusnya diubah menjadi Dibatalkan / Ditutup.',
      '/app/my-reports'
    );
    v_closed := true;
  end if;

  return jsonb_build_object(
    'report_id', p_report_id,
    'flag_count', v_count,
    'auto_closed', v_closed,
    'reason', v_reason
  );
end;
$$;

create or replace function public.api_decide_claim(
  p_token text,
  p_claim_id bigint,
  p_decision text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id       bigint := public.lf_session_user_id(p_token);
  v_claim         public.claims%rowtype;
  v_report        public.reports%rowtype;
  v_status        text;
  v_history_note  text;
  v_other_approved int;
  v_other_pending  int;
begin
  if p_decision is null or p_decision not in ('approved', 'rejected', 'completed') then
    raise exception 'Keputusan klaim tidak valid.';
  end if;

  select c.* into v_claim
  from public.claims c
  join public.reports r on r.id = c.report_id
  where c.id = p_claim_id and r.owner_id = v_user_id
  for update of c;

  if not found then
    raise exception 'Klaim tidak ditemukan atau Anda bukan pemilik laporan.';
  end if;

  select * into v_report from public.reports where id = v_claim.report_id for update;

  if p_decision = 'approved' then
    if v_claim.status <> 'pending' then
      raise exception 'Hanya klaim berstatus menunggu verifikasi yang dapat disetujui.';
    end if;

    update public.claims set status = 'approved' where id = p_claim_id;

    update public.claims
    set status = 'rejected'
    where report_id = v_claim.report_id
      and id <> p_claim_id
      and status = 'pending';

    v_status := 'Dalam verifikasi';
    v_history_note := 'Bukti klaim disetujui — menunggu serah terima barang di kampus';

  elsif p_decision = 'completed' then
    if v_claim.status not in ('approved', 'accepted') then
      raise exception 'Klaim harus disetujui terlebih dahulu sebelum konfirmasi serah terima.';
    end if;

    update public.claims set status = 'completed' where id = p_claim_id;
    v_status := case when v_report.type = 'Lost' then 'Sudah ditemukan' else 'Sudah dikembalikan' end;
    v_history_note := 'Serah terima selesai — barang telah dikembalikan kepada pemilik sah';

  elsif p_decision = 'rejected' then
    if v_claim.status not in ('pending', 'approved', 'accepted') then
      raise exception 'Klaim ini sudah selesai dan tidak dapat ditolak.';
    end if;

    update public.claims set status = 'rejected' where id = p_claim_id;

    select count(*) into v_other_approved
    from public.claims
    where report_id = v_claim.report_id and id <> p_claim_id and status in ('approved', 'accepted');

    select count(*) into v_other_pending
    from public.claims
    where report_id = v_claim.report_id and id <> p_claim_id and status = 'pending';

    if v_other_approved > 0 then
      v_status := 'Dalam verifikasi';
      v_history_note := 'Satu klaim ditolak — masih ada klaim lain dalam tahap serah terima';
    elsif v_other_pending > 0 then
      v_status := 'Sedang diklaim';
      v_history_note := 'Satu klaim ditolak — masih ada klaim lain yang menunggu verifikasi';
    else
      v_status := case when v_report.type = 'Lost' then 'Masih dicari' else 'Menunggu pemilik' end;
      v_history_note := 'Klaim ditolak — laporan kembali dibuka untuk publik';
    end if;
  end if;

  if v_report.status is distinct from v_status then
    update public.reports set status = v_status where id = v_claim.report_id;
    update public.report_status_history
    set note = v_history_note,
        changed_by = v_user_id
    where id = (
      select h.id
      from public.report_status_history h
      where h.report_id = v_claim.report_id
      order by h.created_at desc, h.id desc
      limit 1
    );
  else
    insert into public.report_status_history (report_id, status, note, changed_by, created_at)
    values (v_claim.report_id, v_status, v_history_note, v_user_id, now());
  end if;

  return jsonb_build_object(
    'claim_id', p_claim_id,
    'status', p_decision,
    'report_status', v_status
  );
end;
$$;

create or replace function public.lf_notify_claim_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  begin
    if new.status is distinct from old.status and new.status in ('approved', 'accepted', 'rejected', 'completed') then
      select title into v_title from public.reports where id = new.report_id;
      insert into public.notifications (user_id, kind, title, body, link_path)
      values (
        new.claimant_id,
        'claim_status',
        case
          when new.status = 'rejected' then 'Klaim Anda untuk "' || coalesce(v_title, 'barang') || '" ditolak'
          when new.status = 'completed' then 'Serah terima "' || coalesce(v_title, 'barang') || '" selesai'
          else 'Klaim Anda untuk "' || coalesce(v_title, 'barang') || '" disetujui (Tahap Serah Terima)'
        end,
        case
          when new.status = 'rejected' then 'Bukti kepemilikan belum cocok. Anda dapat memeriksa ruang klaim atau mengajukan bukti yang lebih spesifik.'
          when new.status = 'completed' then 'Penemu telah mengonfirmasi bahwa barang sudah diserahkan kepada Anda. Terima kasih!'
          else 'Bukti kepemilikan cocok! Gunakan ruang chat klaim untuk menyepakati waktu dan lokasi serah terima di kampus.'
        end,
        '/app/claims/' || new.id
      );
    end if;
  exception when others then
    raise warning 'lf_notify_claim_status gagal: %', sqlerrm;
  end;
  return null;
end;
$$;

create or replace function public.lf_notify_claim_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim       record;
  v_target_user bigint;
  v_sender_name text;
begin
  begin
    select c.id, c.claimant_id, r.owner_id, r.title
      into v_claim
    from public.claims c
    join public.reports r on r.id = c.report_id
    where c.id = new.claim_id;

    if found then
      v_target_user := case when new.sender_id = v_claim.claimant_id then v_claim.owner_id else v_claim.claimant_id end;
      select name into v_sender_name from public.users where id = new.sender_id;

      insert into public.notifications (user_id, kind, title, body, link_path)
      values (
        v_target_user,
        'claim',
        'Pesan baru pada klaim "' || coalesce(v_claim.title, 'barang') || '"',
        coalesce(v_sender_name, 'Mahasiswa') || ': "' || left(new.message, 120) || '"',
        '/app/claims/' || new.claim_id
      );
    end if;
  exception when others then
    raise warning 'lf_notify_claim_message gagal: %', sqlerrm;
  end;
  return null;
end;
$$;

create or replace trigger lf_claim_messages_notify
  after insert on public.claim_messages
  for each row execute function public.lf_notify_claim_message();

create or replace function public.api_update_report_status(
  p_token text,
  p_report_id bigint,
  p_status text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id bigint := public._require_session(p_token);
  v_status  text := btrim(COALESCE(p_status, ''));
  v_reason  text := btrim(COALESCE(p_reason, ''));
  v_old_status text;
  v_owner_id bigint;
  v_updated jsonb;
begin
  if v_status = '' then
    raise exception 'Status wajib diisi.' using errcode = 'P0001';
  end if;

  select owner_id, status into v_owner_id, v_old_status
  from public.reports
  where id = p_report_id
  for update;

  if v_owner_id is null then
    raise exception 'Laporan tidak ditemukan.' using errcode = 'P0001';
  end if;
  if v_owner_id <> v_user_id then
    raise exception 'Anda tidak memiliki izin mengubah laporan ini.' using errcode = 'P0001';
  end if;

  update public.reports
  set status = v_status
  where id = p_report_id and owner_id = v_user_id
  returning jsonb_build_object(
    'id', id,
    'type', type,
    'title', title,
    'category', category,
    'color', coalesce(color, ''),
    'location', location,
    'description', description,
    'status', status,
    'reported_at', reported_at,
    'image_url', image_url,
    'latitude', latitude,
    'longitude', longitude
  ) into v_updated;

  if v_reason <> '' then
    if v_old_status is distinct from v_status then
      update public.report_status_history
      set note = 'Status diperbarui dari "' || coalesce(v_old_status, '') || '" menjadi "' || v_status || '" — Alasan: ' || v_reason,
          changed_by = v_user_id
      where id = (
        select h.id
        from public.report_status_history h
        where h.report_id = p_report_id
        order by h.created_at desc, h.id desc
        limit 1
      );
    else
      insert into public.report_status_history (report_id, status, note, changed_by, created_at)
      values (p_report_id, v_status, 'Catatan status: ' || v_reason, v_user_id, now());
    end if;
  end if;

  return jsonb_build_object('report', v_updated);
end;
$$;

create or replace function public.api_create_report(
  p_token text,
  p_type text,
  p_title text,
  p_category text,
  p_location text,
  p_description text,
  p_color text,
  p_reported_at text,
  p_image_url text,
  p_latitude double precision,
  p_longitude double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_report public.reports%rowtype;
begin
  if p_type not in ('Lost', 'Found') then
    raise exception 'Tipe laporan tidak valid.';
  end if;
  if nullif(btrim(p_title), '') is null
     or nullif(btrim(p_category), '') is null
     or nullif(btrim(p_location), '') is null
     or nullif(btrim(p_description), '') is null
     or nullif(btrim(p_color), '') is null then
    raise exception 'Nama, kategori, lokasi, deskripsi, dan warna barang wajib diisi.';
  end if;
  if not public.lf_is_within_campus(p_latitude, p_longitude) then
    raise exception 'Titik pin peta berada di luar batas area Kampus UNKLAB.';
  end if;

  insert into public.reports (
    owner_id, type, title, category, color, location, description, status,
    reported_at, image_url, latitude, longitude
  )
  values (
    v_user_id, p_type, btrim(p_title), btrim(p_category), btrim(p_color),
    btrim(p_location), btrim(p_description),
    case when p_type = 'Lost' then 'Masih dicari' else 'Menunggu pemilik' end,
    coalesce(nullif(p_reported_at, '')::timestamptz, now()),
    nullif(btrim(p_image_url), ''),
    p_latitude,
    p_longitude
  )
  returning * into v_report;

  return jsonb_build_object('report', jsonb_build_object(
    'id', v_report.id,
    'owner_id', v_report.owner_id,
    'type', v_report.type,
    'title', v_report.title,
    'category', v_report.category,
    'color', v_report.color,
    'location', v_report.location,
    'description', v_report.description,
    'status', v_report.status,
    'reported_at', v_report.reported_at,
    'image_url', v_report.image_url,
    'latitude', v_report.latitude,
    'longitude', v_report.longitude
  ));
end;
$$;

create or replace function public.api_reports(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_reports jsonb;
begin
  perform public.lf_auto_close_expired_reports();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'owner_id', r.owner_id, 'type', r.type, 'title', r.title,
    'category', r.category, 'color', coalesce(r.color, ''), 'location', r.location,
    'description', r.description, 'status', r.status, 'reported_at', r.reported_at,
    'image_url', r.image_url, 'latitude', r.latitude, 'longitude', r.longitude,
    'owner_name', u.name
  ) order by r.reported_at desc, r.id desc), '[]'::jsonb)
  into v_reports
  from public.reports r
  join public.users u on u.id = r.owner_id;

  return jsonb_build_object('reports', v_reports);
end;
$$;

create or replace function public.api_my_reports(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_reports jsonb;
begin
  perform public.lf_auto_close_expired_reports();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'owner_id', r.owner_id, 'type', r.type, 'title', r.title,
    'category', r.category, 'color', coalesce(r.color, ''), 'location', r.location,
    'description', r.description, 'status', r.status, 'reported_at', r.reported_at,
    'image_url', r.image_url, 'latitude', r.latitude, 'longitude', r.longitude
  ) order by r.reported_at desc, r.id desc), '[]'::jsonb)
  into v_reports
  from public.reports r
  where r.owner_id = v_user_id;

  return jsonb_build_object('reports', v_reports);
end;
$$;

create or replace function public.api_report_detail(p_token text, p_report_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_report jsonb;
begin
  select jsonb_build_object(
    'id', r.id, 'owner_id', r.owner_id, 'type', r.type, 'title', r.title,
    'category', r.category, 'color', coalesce(r.color, ''), 'location', r.location,
    'description', r.description, 'status', r.status, 'reported_at', r.reported_at,
    'image_url', r.image_url, 'latitude', r.latitude, 'longitude', r.longitude,
    'owner_name', u.name,
    'flag_count', (select count(*) from public.report_flags f where f.report_id = r.id),
    'my_flag_reason', (select f.reason from public.report_flags f where f.report_id = r.id and f.reporter_id = v_user_id)
  )
  into v_report
  from public.reports r
  join public.users u on u.id = r.owner_id
  where r.id = p_report_id;

  if v_report is null then
    raise exception 'Laporan tidak ditemukan.';
  end if;
  return jsonb_build_object('report', v_report);
end;
$$;

alter table public.reports
  add column if not exists is_deleted boolean not null default false;

create or replace function public.api_delete_report(
  p_token text,
  p_report_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_owner_id bigint;
begin
  select owner_id into v_owner_id
  from public.reports
  where id = p_report_id and not coalesce(is_deleted, false);

  if v_owner_id is null then
    raise exception 'Laporan tidak ditemukan.';
  end if;
  if v_owner_id <> v_user_id then
    raise exception 'Anda hanya dapat menghapus laporan milik Anda sendiri.';
  end if;

  update public.reports
  set is_deleted = true,
      status = 'Dibatalkan / Ditutup'
  where id = p_report_id and owner_id = v_user_id;

  return jsonb_build_object('deleted_id', p_report_id);
end;
$$;

create or replace function public.api_update_report(
  p_token text,
  p_report_id bigint,
  p_title text,
  p_category text,
  p_color text,
  p_location text,
  p_description text,
  p_image_url text,
  p_latitude double precision,
  p_longitude double precision
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_report public.reports%rowtype;
begin
  if nullif(btrim(p_title), '') is null
     or nullif(btrim(p_category), '') is null
     or nullif(btrim(p_color), '') is null
     or nullif(btrim(p_location), '') is null
     or nullif(btrim(p_description), '') is null then
    raise exception 'Nama, kategori, warna, lokasi, dan deskripsi wajib diisi.';
  end if;
  if not public.lf_is_within_campus(p_latitude, p_longitude) then
    raise exception 'Titik pin peta berada di luar batas area Kampus UNKLAB.';
  end if;

  update public.reports
  set title = btrim(p_title),
      category = btrim(p_category),
      color = btrim(p_color),
      location = btrim(p_location),
      description = btrim(p_description),
      image_url = nullif(btrim(p_image_url), ''),
      latitude = coalesce(p_latitude, latitude),
      longitude = coalesce(p_longitude, longitude)
  where id = p_report_id and owner_id = v_user_id and not coalesce(is_deleted, false)
  returning * into v_report;

  if not found then
    raise exception 'Laporan tidak ditemukan atau Anda tidak memiliki izin mengubah laporan ini.';
  end if;

  return jsonb_build_object('report', jsonb_build_object(
    'id', v_report.id,
    'owner_id', v_report.owner_id,
    'type', v_report.type,
    'title', v_report.title,
    'category', v_report.category,
    'color', v_report.color,
    'location', v_report.location,
    'description', v_report.description,
    'status', v_report.status,
    'reported_at', v_report.reported_at,
    'image_url', v_report.image_url,
    'latitude', v_report.latitude,
    'longitude', v_report.longitude
  ));
end;
$$;

create or replace function public.lf_match_score(a public.reports, b public.reports)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_score        int := 0;
  v_reasons      text[] := '{}';
  v_title_shared text[];
  v_other_shared text[];
  v_color_shared text[];
  v_keywords     text[];
  v_distance     double precision;
begin
  if lower(btrim(a.category)) = lower(btrim(b.category)) then
    v_score := v_score + 35;
    v_reasons := v_reasons || ('Kategori sama: ' || b.category);
  end if;

  if lower(btrim(a.location)) = lower(btrim(b.location)) then
    v_score := v_score + 25;
    v_reasons := v_reasons || ('Lokasi kampus sama: ' || b.location);
  elsif a.latitude is not null and a.longitude is not null
        and b.latitude is not null and b.longitude is not null then
    v_distance := 111320 * sqrt(
      power((a.latitude - b.latitude)::double precision, 2) +
      power(((a.longitude - b.longitude) * cos(radians(a.latitude::double precision)))::double precision, 2)
    );
    if v_distance <= 150 then
      v_score := v_score + 12;
      v_reasons := v_reasons || ('Lokasi berdekatan: ' || b.location || ' (±' || round(v_distance::numeric) || ' m)');
    end if;
  end if;

  if nullif(btrim(coalesce(a.color, '')), '') is not null
     and nullif(btrim(coalesce(b.color, '')), '') is not null then
    select coalesce(array_agg(w order by w), '{}') into v_color_shared
    from unnest(public.lf_keywords(a.color)) as w
    where w = any (public.lf_keywords(b.color));

    if lower(btrim(a.color)) = lower(btrim(b.color)) or cardinality(v_color_shared) > 0 then
      v_score := v_score + 15;
      v_reasons := v_reasons || ('Warna serupa: ' || b.color);
    end if;
  end if;

  select coalesce(array_agg(w order by w), '{}') into v_title_shared
  from unnest(public.lf_keywords(a.title)) as w
  where w = any (public.lf_keywords(b.title));

  select coalesce(array_agg(w order by w), '{}') into v_other_shared
  from unnest(public.lf_keywords(a.title || ' ' || coalesce(a.description, ''))) as w
  where w = any (public.lf_keywords(b.title || ' ' || coalesce(b.description, '')))
    and not (w = any (v_title_shared));

  v_keywords := v_title_shared || v_other_shared;
  if cardinality(v_keywords) > 0 then
    v_score := v_score + least(40, 15 * cardinality(v_title_shared) + 5 * cardinality(v_other_shared));
    v_reasons := v_reasons || ('Kata kunci cocok: ' || array_to_string(v_keywords[1:6], ', '));
  end if;

  v_score := least(100, v_score);

  return jsonb_build_object(
    'score', v_score,
    'level', case when v_score >= 65 then 'Tinggi' when v_score >= 40 then 'Sedang' else 'Rendah' end,
    'reasons', to_jsonb(v_reasons),
    'keywords', to_jsonb(v_keywords)
  );
end;
$$;

create or replace function public.api_smart_matches(p_token text, p_report_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_report  public.reports;
begin
  select * into v_report
  from public.reports
  where id = p_report_id and not coalesce(is_deleted, false);

  if not found then
    raise exception 'Laporan tidak ditemukan.';
  end if;
  if v_report.owner_id <> v_user_id then
    raise exception 'Anda hanya dapat mencocokkan laporan milik Anda sendiri.';
  end if;

  return jsonb_build_object(
    'report', jsonb_build_object(
      'id', v_report.id,
      'type', v_report.type,
      'title', v_report.title,
      'category', v_report.category,
      'color', coalesce(v_report.color, ''),
      'location', v_report.location,
      'description', coalesce(v_report.description, ''),
      'status', v_report.status,
      'reported_at', v_report.reported_at
    ),
    'matches', coalesce((
      select jsonb_agg(m.item order by m.score desc, m.reported_at desc)
      from (
        select x.item, (x.item ->> 'score')::int as score, x.reported_at
        from (
          select jsonb_build_object(
                   'id', c.id,
                   'type', c.type,
                   'title', c.title,
                   'category', c.category,
                   'color', coalesce(c.color, ''),
                   'location', c.location,
                   'description', c.description,
                   'status', c.status,
                   'reported_at', c.reported_at,
                   'image_url', c.image_url
                 ) || public.lf_match_score(v_report, c) as item,
                 c.reported_at
          from public.reports c
          where c.type <> v_report.type
            and c.owner_id <> v_user_id
            and not coalesce(c.is_deleted, false)
            and not public.lf_is_closed_status(c.status)
        ) x
        where (x.item ->> 'score')::int >= 15
        order by (x.item ->> 'score')::int desc, x.reported_at desc
        limit 20
      ) m
    ), '[]'::jsonb),
    'candidates', coalesce((
      select jsonb_agg(c_pool.item order by c_pool.base_score desc, c_pool.reported_at desc)
      from (
        select (
          jsonb_build_object(
            'id', c.id,
            'type', c.type,
            'title', c.title,
            'category', c.category,
            'color', coalesce(c.color, ''),
            'location', c.location,
            'description', coalesce(c.description, ''),
            'status', c.status,
            'reported_at', c.reported_at,
            'image_url', c.image_url
          ) || public.lf_match_score(v_report, c)
        ) as item,
        (public.lf_match_score(v_report, c) ->> 'score')::int as base_score,
        c.reported_at
        from public.reports c
        where c.type <> v_report.type
          and c.owner_id <> v_user_id
          and not coalesce(c.is_deleted, false)
          and not public.lf_is_closed_status(c.status)
        order by base_score desc, c.reported_at desc
        limit 25
      ) c_pool
    ), '[]'::jsonb),
    'generated_at', now()
  );
end;
$$;

revoke all on function public.lf_is_within_campus(double precision, double precision) from public, anon, authenticated;
revoke all on function public.lf_auto_close_expired_reports() from public, anon, authenticated;
revoke all on function public.lf_notify_claim_message() from public, anon, authenticated;
revoke all on function public.lf_match_score(public.reports, public.reports) from public, anon, authenticated;

revoke all on function public.api_update_report_status(text, bigint, text, text) from public;
revoke all on function public.api_flag_report(text, bigint, text, text) from public;
revoke all on function public.api_delete_report(text, bigint) from public;
revoke all on function public.api_update_report(text, bigint, text, text, text, text, text, text, double precision, double precision) from public;
revoke all on function public.api_smart_matches(text, bigint) from public;

grant execute on function public.api_update_report_status(text, bigint, text, text) to anon, authenticated;
grant execute on function public.api_flag_report(text, bigint, text, text) to anon, authenticated;
grant execute on function public.api_delete_report(text, bigint) to anon, authenticated;
grant execute on function public.api_update_report(text, bigint, text, text, text, text, text, text, double precision, double precision) to anon, authenticated;
grant execute on function public.api_smart_matches(text, bigint) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
