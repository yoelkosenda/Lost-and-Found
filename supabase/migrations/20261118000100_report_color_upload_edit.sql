begin;

alter table public.reports
  add column if not exists color text not null default '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report-images',
  'report-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'report images are publicly readable'
  ) then
    execute 'create policy "report images are publicly readable" on storage.objects for select to anon, authenticated using (bucket_id = ''report-images'')';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'report images can be uploaded'
  ) then
    execute 'create policy "report images can be uploaded" on storage.objects for insert to anon, authenticated with check (bucket_id = ''report-images'' and name like ''reports/%'')';
  end if;
end
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
    'owner_name', u.name
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

create or replace function public.api_public_reports()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'reports',
    coalesce(
      jsonb_agg(jsonb_build_object(
        'id', recent.id,
        'type', recent.type,
        'title', recent.title,
        'category', recent.category,
        'color', coalesce(recent.color, ''),
        'location', recent.location,
        'description', recent.description,
        'status', recent.status,
        'reported_at', recent.reported_at,
        'image_url', recent.image_url
      ) order by recent.reported_at desc, recent.id desc),
      '[]'::jsonb
    )
  )
  from (
    select r.id, r.type, r.title, r.category, r.color, r.location, r.description,
           r.status, r.reported_at, r.image_url
    from public.reports r
    order by r.reported_at desc, r.id desc
    limit 4
  ) recent;
$$;

create or replace function public.api_update_report(
  p_token text,
  p_report_id bigint,
  p_title text,
  p_category text,
  p_color text,
  p_location text,
  p_description text,
  p_image_url text
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

  update public.reports
  set title = btrim(p_title),
      category = btrim(p_category),
      color = btrim(p_color),
      location = btrim(p_location),
      description = btrim(p_description),
      image_url = nullif(btrim(p_image_url), '')
  where id = p_report_id and owner_id = v_user_id
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

revoke all on function public.api_create_report(text, text, text, text, text, text, text, text, text, double precision, double precision) from public;
revoke all on function public.api_reports(text) from public;
revoke all on function public.api_my_reports(text) from public;
revoke all on function public.api_report_detail(text, bigint) from public;
revoke all on function public.api_public_reports() from public;
revoke all on function public.api_update_report(text, bigint, text, text, text, text, text, text) from public;
grant execute on function public.api_create_report(text, text, text, text, text, text, text, text, text, double precision, double precision) to anon, authenticated;
grant execute on function public.api_reports(text) to anon, authenticated;
grant execute on function public.api_my_reports(text) to anon, authenticated;
grant execute on function public.api_report_detail(text, bigint) to anon, authenticated;
grant execute on function public.api_public_reports() to anon, authenticated;
grant execute on function public.api_update_report(text, bigint, text, text, text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
