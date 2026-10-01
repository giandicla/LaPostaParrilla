-- Datos SOLO para desarrollo local (npx supabase db reset). No se sube al
-- proyecto remoto: ahí los usuarios se registran solos y el admin se nombra a mano.
--
--   admin@laposta.test   / laposta123  → rol admin
--   cliente@laposta.test / laposta123  → rol cliente

create function pg_temp.crear_usuario(p_id uuid, p_email text, p_nombre text)
returns void language sql as $$
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt('laposta123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('nombre', p_nombre),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email), 'email', now(), now(), now());
$$;

select pg_temp.crear_usuario('a0000000-0000-0000-0000-000000000001', 'admin@laposta.test', 'Admin La Posta');
select pg_temp.crear_usuario('c0000000-0000-0000-0000-000000000001', 'cliente@laposta.test', 'Cliente de Prueba');

update public.perfiles set rol = 'admin', telefono = '2944966199'
  where id = 'a0000000-0000-0000-0000-000000000001';
update public.perfiles set telefono = '2944000000'
  where id = 'c0000000-0000-0000-0000-000000000001';

-- Avisos por mail en local: el trigger llama a la Edge Function servida por la
-- CLI. El secreto tiene que coincidir con supabase/functions/.env.
select vault.create_secret(
  'http://host.docker.internal:54321/functions/v1/notificar-reserva', 'notificaciones_url');
select vault.create_secret('secreto-local-de-prueba', 'notificaciones_secreto');
