-- Registro con mail y contraseña: crearCuenta() manda el nombre en los
-- metadatos como "nombre", y el trigger crear_perfil() arma el perfil con eso.
begin;
select plan(3);

insert into auth.users (id, email, raw_user_meta_data) values
  ('44444444-4444-4444-4444-444444444444', 'ana@hotmail.com', '{"nombre":"Ana López"}');

select is((select nombre from public.perfiles where id = '44444444-4444-4444-4444-444444444444'),
  'Ana López', 'el perfil toma el nombre que se cargó al crear la cuenta');
select is((select rol from public.perfiles where id = '44444444-4444-4444-4444-444444444444'),
  'cliente', 'una cuenta nueva es de cliente');
select is((select telefono from public.perfiles where id = '44444444-4444-4444-4444-444444444444'),
  null, 'el teléfono no se pide al crear la cuenta: se guarda al reservar');

select * from finish();
rollback;
