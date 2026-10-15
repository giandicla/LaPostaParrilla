-- Seña de la reserva (migraciones 20261015110000 y 20261015120000).
-- Corre con: npx supabase test db
begin;
select plan(9);

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

select * from finish();
rollback;
