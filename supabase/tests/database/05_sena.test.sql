-- Seña de la reserva (migraciones 20261015110000 y 20261015120000).
-- Corre con: npx supabase test db
begin;
select plan(24);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- ---------- Como Ana ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
          'parrilla', current_date + 10, '20:30', 4, 'Ana', '2944111111')
$$, 'un cliente reserva');

select is(
  (select estado::text from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'esperando_pago', 'la reserva nueva queda esperando el pago');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '21:00', 2, 'Ana', '2944111111')
$$, '23505', null, 'una reserva esperando el pago ocupa el lugar del día');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono, estado)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 11, '20:30', 2, 'Ana', '2944111111', 'pendiente')
$$, '42501', null, 'un cliente ya no crea reservas pendientes');

select lives_ok($$
  select public.cancelar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
$$, 'el cliente cancela una reserva sin pagar, sin motivo');

select is(
  (select estado::text || '/' || cancelada_por from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'cancelada/cliente', 'queda cancelada por el cliente');

-- ---------- Como admin ----------
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

insert into public.reservas (id, usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'local', 'confirmada',
        'parrilla', current_date + 12, '20:30', 4, 'Carlos', '2944222222');

select throws_ok($$
  select public.cancelar_reserva('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
$$, 'P0001', 'Escribí el motivo de la cancelación: se lo mandamos al cliente.',
  'el admin no cancela sin motivo');

select lives_ok($$
  select public.cancelar_reserva('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'No hay lugar')
$$, 'el admin cancela con motivo');

select is(
  (select motivo_cancelacion from public.reservas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'No hay lugar', 'el motivo queda guardado');

-- ---------- Pagos ----------
reset role;
-- Reserva de Ana esperando el pago, y un pago iniciado (lo crea el servidor)
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 15, '20:30', 2, 'Ana', '2944111111');
insert into public.pagos (id, reserva_id, monto)
values ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10000);

select is((select sena from public.locales where id = 'parrilla'), 10000.00::numeric,
  'la seña de la parrilla es de $10.000');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is((select count(*)::int from public.pagos), 1, 'el cliente ve el pago de su reserva');

select throws_ok($$
  insert into public.pagos (reserva_id, monto) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 1)
$$, '42501', null, 'el navegador no crea pagos');

select throws_ok($$
  select public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '999', 'approved')
$$, '42501', null, 'el navegador no acredita pagos');

-- ---------- Como el servidor ----------
set local role service_role;

select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '111', 'rejected'),
  'rechazado', 'un pago rechazado queda rechazado');
select is((select estado::text from public.reservas where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'esperando_pago', 'y la reserva sigue esperando el pago (puede reintentar)');

select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '222', 'approved'),
  'aprobado', 'el segundo intento, aprobado, aprueba el mismo pago');
select is((select estado::text from public.reservas where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'confirmada', 'y la reserva queda confirmada');

select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '222', 'approved'),
  'aprobado', 'un aviso repetido no cambia nada');

-- Una segunda preferencia de la misma reserva, también pagada: se devuelve
reset role;
insert into public.pagos (id, reserva_id, monto)
values ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10000);
set local role service_role;
select is(public.acreditar_pago('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '333', 'approved'),
  'reintegro_pendiente', 'una segunda seña cobrada para la misma reserva queda para reintegrar');

-- ---------- Cancelar una reserva pagada ----------
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok($$ select public.cancelar_reserva('cccccccc-cccc-cccc-cccc-cccccccccccc') $$,
  'el cliente cancela su reserva pagada con tiempo');
reset role;
select is((select estado from public.pagos where id = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0'),
  'reintegro_pendiente', 'al cancelar, la seña aprobada queda para reintegrar');

-- ---------- Vencimiento ----------
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono, creada_en)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 16, '20:30', 2, 'Ana', '2944111111', now() - interval '16 minutes'),
       ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 17, '20:30', 2, 'Ana', '2944111111', now() - interval '5 minutes');
select public.vencer_reservas_sin_pagar();
select is((select estado::text from public.reservas where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'vencida', 'a los 15 minutos sin pagar, la reserva vence');
select is((select estado::text from public.reservas where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  'esperando_pago', 'antes de los 15 minutos, no');

-- Un pago que llega tarde sobre una reserva vencida se devuelve
insert into public.pagos (id, reserva_id, monto)
values ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 10000);
set local role service_role;
select is(public.acreditar_pago('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0', '444', 'approved'),
  'reintegro_pendiente', 'un pago aprobado sobre una reserva vencida queda para reintegrar');
reset role;

select * from finish();
rollback;
