CREATE OR REPLACE FUNCTION public.api_register(
  p_name text,
  p_email text,
  p_password text,
  p_phone text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_password text := coalesce(p_password, '');
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[\s().-]', '', 'g');
  v_user RECORD;
  v_token text;
BEGIN
  IF char_length(v_name) < 3 OR char_length(v_name) > 80 THEN
    RAISE EXCEPTION 'Nama lengkap wajib diisi (3–80 karakter).' USING ERRCODE = 'P0001';
  END IF;

  IF v_email = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Format email mahasiswa tidak valid.' USING ERRCODE = 'P0001';
  END IF;

  IF char_length(v_password) < 6 THEN
    RAISE EXCEPTION 'Password minimal terdiri dari 6 karakter.' USING ERRCODE = 'P0001';
  END IF;

  IF v_phone <> '' THEN
    IF v_phone !~ '^(\+62|62|0)8[0-9]{7,12}$' THEN
      RAISE EXCEPTION 'Nomor telepon tidak valid. Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx.' USING ERRCODE = 'P0001';
    END IF;
    v_phone := '+62' || regexp_replace(v_phone, '^(\+62|62|0)', '');
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.users (name, email, password_hash, role, phone)
  VALUES (
    v_name,
    v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    'student',
    v_phone
  )
  RETURNING id, name, email, role INTO v_user;

  INSERT INTO public.notifications (user_id, kind, title, body, link_path)
  VALUES (
    v_user.id,
    'system',
    'Selamat datang di Lost & Found UNKLAB!',
    'Akun mahasiswa Anda telah aktif. Anda kini dapat melaporkan barang hilang/temuan, mencocokkan laporan dengan AI, dan mengajukan klaim.',
    '/app'
  );

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.sessions (token, user_id, expires_at)
  VALUES (v_token, v_user.id, NOW() + INTERVAL '8 hours');

  RETURN jsonb_build_object(
    'token', v_token,
    'user', jsonb_build_object(
      'id', v_user.id,
      'name', v_user.name,
      'email', v_user.email,
      'role', v_user.role
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.api_register(text, text, text, text) TO anon, authenticated;
