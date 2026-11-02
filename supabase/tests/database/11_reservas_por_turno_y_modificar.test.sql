-- Una reserva por turno y modificar_reserva (migración 20261102120000).
begin;
select plan(13);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.com', '{"full_name":"Beto"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- ---------- Una por turno ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
          'parrilla', current_date + 10, '12:30', 4, 'Ana', '2944111111')
$$, 'Ana reserva para almorzar');

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
          'parrilla', current_date + 10, '20:30', 4, 'Ana', '2944111111')
$$, 'y para cenar el mismo día');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '21:00', 2, 'Ana', '2944111111')
$$, '23505', null, 'pero no dos veces en el mismo turno');

-- Las dos quedan confirmadas, como si se hubiera pagado la seña
reset role;
update public.reservas set estado = 'confirmada'
  where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono, estado)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 12, '20:00', 2, 'Ana', '2944111111', 'confirmada');
-- Una que empieza en 30 minutos (se fuerza la fecha saltando el trigger)
alter table public.reservas disable trigger validar_reserva;
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono, estado)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
        'restaurante',
        (now() at time zone 'America/Argentina/Buenos_Aires' + interval '30 minutes')::date,
        (now() at time zone 'America/Argentina/Buenos_Aires' + interval '30 minutes')::time,
        2, 'Ana', '2944111111', 'confirmada');
alter table public.reservas enable trigger validar_reserva;

-- ---------- Modificar ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok($$ select public.modificar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc', current_date + 13, '12:15', 5::smallint) $$,
  'el cliente modifica fecha, hora y personas');
select results_eq(
  $$ select fecha - current_date, hora, personas, estado::text, modificada_por from public.reservas where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  $$ values (13, time '12:15', 5::smallint, 'confirmada', 'cliente') $$,
  'queda con los datos nuevos, confirmada, y se sabe que la cambió el cliente');

select throws_ok($$ select public.modificar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc', current_date + 13, '12:15', 7::smallint) $$,
  '23514', null, 'no más de 6 personas');
select throws_ok($$ select public.modificar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc', current_date + 13, '15:00', 2::smallint) $$,
  'P0001', 'La hora elegida no es un horario de reserva de ese local.', 'el horario nuevo tiene que ser una franja');
select throws_ok($$ select public.modificar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc', current_date + 10, '12:45', 2::smallint) $$,
  '23505', null, 'no puede caer en un turno donde ya tiene otra reserva');
select throws_ok($$ select public.modificar_reserva('dddddddd-dddd-dddd-dddd-dddddddddddd', current_date + 20, '20:00', 2::smallint) $$,
  'P0001', 'Falta menos de 1 hora para tu reserva: para cambiarla escribinos por WhatsApp.', 'con menos de 1 hora no se modifica');

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok($$ select public.modificar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc', current_date + 14, '20:00', 2::smallint) $$,
  'P0001', 'No encontramos esa reserva.', 'nadie modifica la reserva de otro');

reset role;
set local role anon;
select throws_ok($$ select public.modificar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc', current_date + 14, '20:00', 2::smallint) $$,
  '42501', null, 'sin sesión, tampoco');

-- Una cancelada no se modifica
reset role;
update public.reservas set estado = 'cancelada', cancelada_por = 'cliente' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$ select public.modificar_reserva('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', current_date + 15, '20:00', 2::smallint) $$,
  'P0001', 'Solo se puede modificar una reserva confirmada.', 'una reserva cancelada no se modifica');

-- Si la mueve el admin, queda registrado
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
update public.reservas set hora = '12:30' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
reset role;
select is((select modificada_por from public.reservas where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'admin', 'si la mueve el admin, modificada_por es admin');

select * from finish();
rollback;
