-- Ajustes de la revisión final (migración 20261018120000): creada_en lo fija
-- la base y un segundo cobro aprobado sobre la misma preferencia es 'duplicado'.
begin;
select plan(5);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}');

-- ---------- creada_en ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono, creada_en)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 10, '20:30', 2, 'Ana', '2944111111', now() + interval '1 year');

select ok(
  (select creada_en <= now() from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'un cliente no puede elegir creada_en: la fija la base');

-- ---------- Cobro doble ----------
reset role;
insert into public.pagos (id, reserva_id, monto)
values ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10000);

set local role service_role;
select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '111', 'approved'),
  'aprobado', 'el primer pago aprobado acredita');
select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '111', 'approved'),
  'aprobado', 'el mismo pago repetido sigue siendo aprobado');
select is(public.acreditar_pago('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', '222', 'approved'),
  'duplicado', 'otro pago aprobado sobre la misma preferencia es un duplicado');
reset role;
select is((select mp_payment_id from public.pagos where id = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0'),
  '111', 'el pago guardado no cambia');

select * from finish();
rollback;
