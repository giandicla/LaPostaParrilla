-- Reembolso de la seña (migración 20261104120000): la cancele el cliente o el
-- local, la seña cobrada queda a devolver (el servidor pide el reembolso y el
-- webhook la confirma). La marca manual de la migración 20261101120000 ya no existe.
begin;
select plan(3);
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
  'reintegro_pendiente', 'si cancela el cliente, la seña queda a devolver');

-- ---------- Cancela el local ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select public.cancelar_reserva('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cerramos por un corte de luz');
reset role;
select is((select estado from public.pagos where id = 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0'),
  'reintegro_pendiente', 'si cancela el local, la seña queda a devolver');

-- ---------- Ya no hay marca manual ----------
select hasnt_function('public', 'marcar_sena_devuelta', array['uuid'], 'la seña devuelta no se marca a mano');

select * from finish();
rollback;
