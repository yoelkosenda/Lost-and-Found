-- =====================================================================================
-- Lost & Found UNKLAB — Notifikasi, Profil Mahasiswa, dan Smart Matching
-- Supabase project: mirytmehqvibgbfczmzc
--
-- Cara menjalankan: Supabase Dashboard → SQL Editor → tempel seluruh file → Run.
-- Aman dijalankan ulang (idempotent).
--
-- Model keamanan (sama seperti RPC yang sudah ada):
--   * Frontend memakai kunci publishable (role `anon`) dan token sesi buatan sendiri,
--     bukan Supabase Auth, sehingga auth.uid() tidak dipakai.
--   * Tabel `notifications` memakai RLS tanpa policy apa pun = tertutup untuk anon/authenticated.
--     Akses hanya lewat fungsi SECURITY DEFINER `api_*` yang memvalidasi token.
--   * Kolom `users.phone` bersifat privat: hanya dikembalikan oleh api_profile untuk pemiliknya.
--     Fungsi laporan publik (api_reports, api_report_detail, api_public_reports, api_activities)
--     tidak diubah dan tidak boleh menyertakan kolom ini.
-- =====================================================================================

begin;

-- -------------------------------------------------------------------------------------
-- 1. Kolom nomor telepon privat
-- -------------------------------------------------------------------------------------
alter table public.users add column if not exists phone text default '';

-- -------------------------------------------------------------------------------------
-- 2. Tabel notifikasi (RLS aktif, tanpa policy → hanya bisa diakses lewat RPC)
-- -------------------------------------------------------------------------------------
create table if not exists public.notifications (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references public.users (id) on delete cascade,
  kind       text not null default 'system'
             check (kind in ('system', 'claim', 'claim_status', 'match', 'report')),
  title      text not null check (char_length(title) between 1 and 200),
  body       text not null default '',
  -- Hanya rute internal aplikasi (mis. /app/matching?report=3), bukan URL eksternal.
  link_path  text check (link_path is null or link_path ~ '^/app(/|\?|$)'),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc, id desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where not is_read;

alter table public.notifications enable row level security;
revoke all on table public.notifications from anon, authenticated;

-- -------------------------------------------------------------------------------------
-- 3. Helper internal
-- -------------------------------------------------------------------------------------

-- Ambil id mahasiswa dari token sesi dengan memakai ulang api_me, sehingga aturan
-- validasi/kedaluwarsa sesi tetap di satu tempat. Melempar error yang sama bila token tidak sah.
create or replace function public.lf_session_user_id(p_token text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint;
begin
  v_user_id := ((public.api_me(p_token))::jsonb -> 'user' ->> 'id')::bigint;
  if v_user_id is null then
    raise exception 'Sesi Anda telah berakhir. Silakan masuk kembali.';
  end if;
  return v_user_id;
end;
$$;

-- Kata kunci bermakna dari teks laporan: huruf kecil, dipecah per non-alfanumerik,
-- minimal 3 karakter, tanpa kata umum bahasa Indonesia/kata generik laporan.
create or replace function public.lf_keywords(p_text text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(distinct w order by w), '{}'::text[])
  from regexp_split_to_table(lower(coalesce(p_text, '')), '[^a-z0-9]+') as w
  where char_length(w) >= 3
    and not (w = any (array[
      'yang', 'dan', 'atau', 'di', 'ke', 'dari', 'dengan', 'untuk', 'pada', 'ini', 'itu', 'ada',
      'dalam', 'juga', 'karena', 'oleh', 'saat', 'sudah', 'masih', 'belum', 'tidak', 'bisa',
      'akan', 'saya', 'kami', 'kita', 'anda', 'nya', 'para', 'sebuah', 'satu', 'dua', 'tiga',
      'beberapa', 'bagian', 'sekitar', 'dekat', 'area', 'lantai', 'ruang', 'ruangan', 'meja',
      'kursi', 'depan', 'belakang', 'samping', 'sebelah', 'kanan', 'kiri', 'atas', 'bawah',
      'terakhir', 'terlihat', 'ditemukan', 'temukan', 'menemukan', 'hilang', 'kehilangan',
      'tertinggal', 'ketinggalan', 'berisi', 'warna', 'barang', 'tolong', 'mohon', 'tadi',
      'pagi', 'siang', 'sore', 'malam', 'hari', 'kemarin', 'sama', 'lain', 'buah', 'tanpa',
      'sedang', 'setelah', 'sebelum', 'ketika', 'kampus', 'unklab', 'the', 'and',
      -- deskriptor umum yang membuat barang berbeda tampak mirip
      'kecil', 'besar', 'ukuran', 'tua', 'muda', 'polos', 'beserta', 'nama', 'berwarna',
      'merek', 'jenis', 'tipe', 'model', 'baru', 'lama', 'milik', 'punya'
    ]))
$$;

-- Skor relevansi 0–100 antara dua laporan + alasan yang bisa dibaca mahasiswa.
--   Kategori sama .................................. +35
--   Lokasi sama ..................................... +25
--   (atau) titik lokasi berjarak ≤ 150 m ............ +12
--   Kata kunci judul yang sama ...................... +15 per kata
--   Kata kunci deskripsi lain yang sama ............. +5 per kata   (total kata kunci maks. 40)
-- Tingkat: Tinggi ≥ 65, Sedang ≥ 40, selain itu Rendah.
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

-- Status laporan yang sudah selesai: tidak ikut dicocokkan dan tidak memicu notifikasi.
create or replace function public.lf_is_closed_status(p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_status, '') in ('Sudah ditemukan', 'Sudah dikembalikan', 'Dibatalkan / Ditutup')
$$;

-- -------------------------------------------------------------------------------------
-- 4. RPC Profil
-- -------------------------------------------------------------------------------------
create or replace function public.api_profile(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_profile jsonb;
begin
  select jsonb_build_object(
           'id', u.id,
           'name', u.name,
           'email', u.email,
           'role', u.role,
           'phone', coalesce(u.phone, ''),
           'created_at', to_jsonb(u) -> 'created_at'
         )
    into v_profile
  from public.users u
  where u.id = v_user_id;

  if v_profile is null then
    raise exception 'Sesi Anda telah berakhir. Silakan masuk kembali.';
  end if;

  return jsonb_build_object(
    'profile', v_profile,
    'unread_notifications', (
      select count(*) from public.notifications n where n.user_id = v_user_id and not n.is_read
    )
  );
end;
$$;

create or replace function public.api_update_profile(p_token text, p_name text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_name    text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_phone   text := regexp_replace(coalesce(p_phone, ''), '[\s().-]', '', 'g');
  v_old     text;
begin
  if char_length(v_name) < 3 or char_length(v_name) > 80 then
    raise exception 'Nama wajib diisi (3–80 karakter).';
  end if;

  if v_phone <> '' then
    if v_phone !~ '^(\+62|62|0)8[0-9]{7,12}$' then
      raise exception 'Nomor telepon tidak valid. Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx.';
    end if;
    -- Simpan dalam satu format baku: +628xxxxxxxxxx
    v_phone := '+62' || regexp_replace(v_phone, '^(\+62|62|0)', '');
  end if;

  select coalesce(phone, '') into v_old from public.users where id = v_user_id for update;

  update public.users set name = v_name, phone = v_phone where id = v_user_id;

  if v_old is distinct from v_phone then
    insert into public.notifications (user_id, kind, title, body, link_path)
    values (
      v_user_id,
      'system',
      case when v_phone = '' then 'Nomor telepon privat dihapus' else 'Nomor telepon privat diperbarui' end,
      'Nomor ini hanya terlihat oleh Anda dan tidak pernah ditampilkan di laporan publik. Jika Anda tidak melakukan perubahan ini, segera ganti password Anda.',
      '/app/profile'
    );
  end if;

  return public.api_profile(p_token);
end;
$$;

-- -------------------------------------------------------------------------------------
-- 5. RPC Notifikasi
-- -------------------------------------------------------------------------------------
create or replace function public.api_notifications(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
begin
  return jsonb_build_object(
    'notifications', coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'id', n.id, 'kind', n.kind, 'title', n.title, 'body', n.body,
                 'link_path', n.link_path, 'is_read', n.is_read, 'created_at', n.created_at
               )
               order by n.created_at desc, n.id desc
             )
      from (
        select * from public.notifications
        where user_id = v_user_id
        order by created_at desc, id desc
        limit 50
      ) n
    ), '[]'::jsonb),
    'unread_count', (
      select count(*) from public.notifications where user_id = v_user_id and not is_read
    )
  );
end;
$$;

create or replace function public.api_mark_notifications_read(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id bigint := public.lf_session_user_id(p_token);
  v_updated int;
begin
  update public.notifications set is_read = true where user_id = v_user_id and not is_read;
  get diagnostics v_updated = row_count;
  return jsonb_build_object('updated', v_updated, 'unread_count', 0);
end;
$$;

-- -------------------------------------------------------------------------------------
-- 6. RPC Smart Matching
-- -------------------------------------------------------------------------------------
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
  select * into v_report from public.reports where id = p_report_id;
  if not found then
    raise exception 'Laporan tidak ditemukan.';
  end if;
  if v_report.owner_id <> v_user_id then
    raise exception 'Anda hanya dapat mencocokkan laporan milik Anda sendiri.';
  end if;

  return jsonb_build_object(
    'report', jsonb_build_object(
      'id', v_report.id, 'type', v_report.type, 'title', v_report.title,
      'category', v_report.category, 'location', v_report.location,
      'status', v_report.status, 'reported_at', v_report.reported_at
    ),
    'matches', coalesce((
      select jsonb_agg(m.item order by m.score desc, m.reported_at desc)
      from (
        select x.item, (x.item ->> 'score')::int as score, x.reported_at
        from (
          -- Hanya kolom publik laporan kandidat; tanpa data kontak pemilik.
          select jsonb_build_object(
                   'id', c.id, 'type', c.type, 'title', c.title, 'category', c.category,
                   'location', c.location, 'description', c.description, 'status', c.status,
                   'reported_at', c.reported_at, 'image_url', c.image_url
                 ) || public.lf_match_score(v_report, c) as item,
                 c.reported_at
          from public.reports c
          where c.type <> v_report.type
            and c.owner_id <> v_user_id
            and not public.lf_is_closed_status(c.status)
        ) x
        where (x.item ->> 'score')::int >= 15
        order by (x.item ->> 'score')::int desc, x.reported_at desc
        limit 20
      ) m
    ), '[]'::jsonb),
    'generated_at', now()
  );
end;
$$;

-- -------------------------------------------------------------------------------------
-- 7. Trigger pembuat notifikasi
--    Setiap trigger dibungkus EXCEPTION agar kegagalan notifikasi tidak pernah
--    menggagalkan aksi utama (membuat laporan / klaim).
-- -------------------------------------------------------------------------------------

-- Laporan baru → beri tahu pemilik laporan pasangan (Lost ↔ Found) yang relevansinya Tinggi,
-- dan beri tahu pembuat laporan berapa kandidat kuat yang sudah ada.
create or replace function public.lf_notify_report_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate record;
  v_count     int := 0;
begin
  begin
    if public.lf_is_closed_status(new.status) then
      return null;
    end if;

    for v_candidate in
      select c.id, c.owner_id, c.title, (public.lf_match_score(new, c) ->> 'score')::int as score
      from public.reports c
      where c.type <> new.type
        and c.owner_id <> new.owner_id
        and not public.lf_is_closed_status(c.status)
      order by score desc
      limit 5
    loop
      exit when v_candidate.score < 65;
      v_count := v_count + 1;
      insert into public.notifications (user_id, kind, title, body, link_path)
      values (
        v_candidate.owner_id,
        'match',
        'Ada laporan yang mungkin cocok dengan "' || v_candidate.title || '"',
        'Laporan ' || case when new.type = 'Found' then 'barang ditemukan' else 'barang hilang' end
          || ' baru "' || new.title || '" di ' || new.location
          || ' memiliki relevansi Tinggi (' || v_candidate.score || '%).',
        '/app/matching?report=' || v_candidate.id
      );
    end loop;

    if v_count > 0 then
      insert into public.notifications (user_id, kind, title, body, link_path)
      values (
        new.owner_id,
        'match',
        'Laporan "' || new.title || '" punya ' || v_count || ' kandidat cocok',
        'Smart Matching menemukan laporan pasangan dengan relevansi Tinggi. Periksa kandidatnya sekarang.',
        '/app/matching?report=' || new.id
      );
    end if;
  exception when others then
    raise warning 'lf_notify_report_matches gagal: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists lf_reports_notify_matches on public.reports;
create trigger lf_reports_notify_matches
  after insert on public.reports
  for each row execute function public.lf_notify_report_matches();

-- Klaim baru → beri tahu pemilik laporan. Bukti kepemilikan & identitas pengklaim tidak disertakan.
create or replace function public.lf_notify_claim_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report record;
begin
  begin
    select id, owner_id, title into v_report from public.reports where id = new.report_id;
    if found then
      insert into public.notifications (user_id, kind, title, body, link_path)
      values (
        v_report.owner_id,
        'claim',
        'Klaim baru untuk "' || v_report.title || '"',
        'Seorang mahasiswa mengajukan klaim kepemilikan atas barang temuan Anda. Periksa bukti kepemilikan sebelum menyerahkan barang.',
        '/app/my-reports'
      );
    end if;
  exception when others then
    raise warning 'lf_notify_claim_created gagal: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists lf_claims_notify_created on public.claims;
create trigger lf_claims_notify_created
  after insert on public.claims
  for each row execute function public.lf_notify_claim_created();

-- Status klaim berubah (diterima / ditolak) → beri tahu pengklaim.
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
    if new.status is distinct from old.status and new.status in ('approved', 'accepted', 'rejected') then
      select title into v_title from public.reports where id = new.report_id;
      insert into public.notifications (user_id, kind, title, body, link_path)
      values (
        new.claimant_id,
        'claim_status',
        case when new.status = 'rejected'
             then 'Klaim Anda untuk "' || coalesce(v_title, 'barang') || '" ditolak'
             else 'Klaim Anda untuk "' || coalesce(v_title, 'barang') || '" diterima' end,
        case when new.status = 'rejected'
             then 'Bukti kepemilikan belum cocok dengan barang ini. Anda dapat mengajukan klaim baru dengan ciri yang lebih spesifik.'
             else 'Bukti kepemilikan Anda cocok. Silakan atur pengambilan barang di titik layanan kampus.' end,
        '/app/my-claims'
      );
    end if;
  exception when others then
    raise warning 'lf_notify_claim_status gagal: %', sqlerrm;
  end;
  return null;
end;
$$;

drop trigger if exists lf_claims_notify_status on public.claims;
create trigger lf_claims_notify_status
  after update of status on public.claims
  for each row execute function public.lf_notify_claim_status();

-- -------------------------------------------------------------------------------------
-- 8. Hak akses fungsi
--    Supabase memberi EXECUTE ke anon/authenticated secara default; cabut untuk helper
--    internal, lalu berikan hanya untuk RPC publik api_*.
-- -------------------------------------------------------------------------------------
revoke all on function public.lf_session_user_id(text) from public, anon, authenticated;
revoke all on function public.lf_keywords(text) from public, anon, authenticated;
revoke all on function public.lf_match_score(public.reports, public.reports) from public, anon, authenticated;
revoke all on function public.lf_is_closed_status(text) from public, anon, authenticated;
revoke all on function public.lf_notify_report_matches() from public, anon, authenticated;
revoke all on function public.lf_notify_claim_created() from public, anon, authenticated;
revoke all on function public.lf_notify_claim_status() from public, anon, authenticated;

revoke all on function public.api_profile(text) from public;
revoke all on function public.api_update_profile(text, text, text) from public;
revoke all on function public.api_notifications(text) from public;
revoke all on function public.api_mark_notifications_read(text) from public;
revoke all on function public.api_smart_matches(text, bigint) from public;

grant execute on function public.api_profile(text) to anon, authenticated;
grant execute on function public.api_update_profile(text, text, text) to anon, authenticated;
grant execute on function public.api_notifications(text) to anon, authenticated;
grant execute on function public.api_mark_notifications_read(text) to anon, authenticated;
grant execute on function public.api_smart_matches(text, bigint) to anon, authenticated;

-- -------------------------------------------------------------------------------------
-- 9. Data awal notifikasi (sekali saja per mahasiswa)
-- -------------------------------------------------------------------------------------
insert into public.notifications (user_id, kind, title, body, link_path)
select u.id,
       'system',
       'Selamat datang di Notifikasi',
       'Di sini Anda akan menerima kabar klaim baru, status klaim, dan laporan yang mungkin cocok dengan barang Anda. Lengkapi nomor telepon privat di Profil untuk mempermudah verifikasi.',
       '/app/profile'
from public.users u
where not exists (select 1 from public.notifications n where n.user_id = u.id);

-- Ringkasan kandidat kuat untuk laporan yang sudah ada sebelum fitur ini aktif.
insert into public.notifications (user_id, kind, title, body, link_path)
select r.owner_id,
       'match',
       'Laporan "' || r.title || '" punya ' || s.strong || ' kandidat cocok',
       'Smart Matching menemukan laporan pasangan dengan relevansi Tinggi. Periksa kandidatnya sekarang.',
       '/app/matching?report=' || r.id
from public.reports r
cross join lateral (
  select count(*) as strong
  from public.reports c
  where c.type <> r.type
    and c.owner_id <> r.owner_id
    and not public.lf_is_closed_status(c.status)
    and (public.lf_match_score(r, c) ->> 'score')::int >= 65
) s
where not public.lf_is_closed_status(r.status)
  and s.strong > 0
  and not exists (
    select 1 from public.notifications n
    where n.user_id = r.owner_id and n.link_path = '/app/matching?report=' || r.id
  );

commit;

-- Muat ulang cache skema PostgREST agar RPC baru langsung bisa dipanggil.
notify pgrst, 'reload schema';
