-- Reglas de la parte 1: lo que un cliente puede y no puede hacer.
-- Corre con: npx supabase test db
begin;
select plan(23);

-- ---------- Datos de prueba (como superusuario) ----------
-- Dos clientes y un admin. El trigger de auth.users les crea el perfil.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.com', '{"full_name":"Beto"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

select is(
  (select nombre from public.perfiles where id = '11111111-1111-1111-1111-111111111111'),
  'Ana', 'al registrarse se crea el perfil con el nombre de la cuenta');

-- Una franja dentro de una hora, para probar el límite de 2 horas
create temp table pronto as
  select (ahora + interval '1 hour')::date as fecha,
         date_trunc('minute', (ahora + interval '1 hour'))::time as hora
  from (select now() at time zone 'America/Argentina/Buenos_Aires' as ahora) a;
insert into public.franjas_reserva (local_id, hora) select 'restaurante', hora from pronto
  on conflict do nothing;
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  select 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
         'restaurante', fecha, hora, 2, 'Ana', '111' from pronto;

-- ---------- Actuar como Ana ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
          'parrilla', current_date + 10, '20:30', 4, 'Ana', '111')
$$, 'un cliente reserva a su nombre');

select is(
  (select estado::text from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'pendiente', 'la reserva nueva queda pendiente');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '21:00', 2, 'Ana', '111')
$$, '23505', null, 'una sola reserva activa por usuario, local y día');

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
          'restaurante', current_date + 10, '13:00', 2, 'Ana', '111')
$$, 'el mismo día puede reservar en el otro local');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('22222222-2222-2222-2222-222222222222', 'parrilla', current_date + 11, '20:30', 2, 'Ana', '111')
$$, '42501', null, 'no puede reservar a nombre de otro usuario');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono, estado)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 12, '20:30', 2, 'Ana', '111', 'confirmada')
$$, '42501', null, 'no puede crear una reserva ya confirmada');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 13, '20:30', 7, 'Ana', '111')
$$, '23514', null, 'no se puede reservar para más de 6 personas');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 14, '17:00', 2, 'Ana', '111')
$$, 'P0001', 'La hora elegida no es un horario de reserva de ese local.',
  'la hora tiene que ser una franja del local');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date - 1, '20:30', 2, 'Ana', '111')
$$, 'P0001', 'No se puede reservar para una fecha u hora que ya pasó.',
  'no se puede reservar en el pasado');

-- Un cliente no puede editar reservas: el update no afecta ninguna fila
update public.reservas set estado = 'confirmada' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
select is(
  (select estado::text from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'pendiente', 'un cliente no puede confirmar su reserva');

select throws_ok($$
  update public.perfiles set rol = 'admin' where id = '11111111-1111-1111-1111-111111111111'
$$, '42501', null, 'un cliente no puede cambiar su rol');

select lives_ok($$
  update public.perfiles set telefono = '2944000000' where id = '11111111-1111-1111-1111-111111111111'
$$, 'un cliente puede guardar su teléfono');

select lives_ok($$
  select public.cancelar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
$$, 'un cliente cancela su reserva con más de 2 horas de anticipación');

select is(
  (select estado::text || '/' || cancelada_por from public.reservas
   where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'cancelada/cliente', 'queda cancelada, y registrado que la canceló el cliente');

select throws_ok($$
  select public.cancelar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc')
$$, 'P0001', 'Faltan menos de 2 horas para tu reserva: para cancelarla escribinos por WhatsApp.',
  'no puede cancelar desde la web con menos de 2 horas');

-- ---------- Actuar como Beto ----------
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is((select count(*)::int from public.reservas), 0, 'un cliente no ve reservas ajenas');

select throws_ok($$
  select public.cancelar_reserva('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
$$, 'P0001', 'No encontramos esa reserva.', 'un cliente no puede cancelar reservas ajenas');

select is(
  (select count(*)::int from public.perfiles), 1, 'un cliente solo ve su propio perfil');

-- ---------- Actuar como admin ----------
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select is((select count(*)::int from public.reservas), 3, 'el admin ve todas las reservas');

select lives_ok($$
  update public.reservas set estado = 'confirmada' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
$$, 'el admin confirma una reserva');

select lives_ok($$
  select public.cancelar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc')
$$, 'el admin puede cancelar aunque falten menos de 2 horas');

-- ---------- Visitante sin sesión ----------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';
select is((select count(*)::int from public.reservas), 0, 'un visitante sin sesión no ve reservas');

select * from finish();
rollback;
