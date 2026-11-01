-- Seña no reembolsable (migración 20261101120000): si cancela el cliente la
-- seña queda cobrada; si cancela el local queda a devolver, y el admin la marca
-- como devuelta cuando la devolvió a mano.
begin;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- Dos reservas de Ana, las dos con la seña pagada
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'parrilla', current_date + 10, '20:30', 2, 'Ana', '2944111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
   'parrilla', current_date + 11, '20:30', 2, 'Ana', '2944111111');
insert into public.pagos (id, reserva_id, monto) values
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10000),
  ('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000);
select public.acreditar_pago('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', '111', 'approved');
select public.acreditar_pago('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0', '222', 'approved');

-- ---------- Cancela el cliente ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select public.cancelar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
reset role;
select is((select estado from public.pagos where id = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0'),
  'aprobado', 'si cancela el cliente, la seña no se devuelve');

-- ---------- Cancela el local ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select public.cancelar_reserva('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cerramos por un corte de luz');
reset role;
select is((select estado from public.pagos where id = 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0'),
  'reintegro_pendiente', 'si cancela el local, la seña queda a devolver');

-- ---------- Marcar la seña como devuelta ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$ select public.marcar_sena_devuelta('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0') $$,
  '42501', null, 'un cliente no puede marcar una seña como devuelta');

reset role;
set local role anon;
select throws_ok($$ select public.marcar_sena_devuelta('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0') $$,
  '42501', null, 'sin sesión tampoco');

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select throws_ok($$ select public.marcar_sena_devuelta('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0') $$,
  'P0001', 'Esa seña no está para devolver.', 'una seña cobrada que no está a devolver no se marca');
select lives_ok($$ select public.marcar_sena_devuelta('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0') $$,
  'el admin marca devuelta la seña a devolver');
reset role;
select is((select estado from public.pagos where id = 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0'),
  'reintegrado', 'y queda devuelta');

set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select throws_ok($$ select public.marcar_sena_devuelta('b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0') $$,
  'P0001', 'Esa seña no está para devolver.', 'marcarla dos veces da error');
reset role;

select * from finish();
rollback;
