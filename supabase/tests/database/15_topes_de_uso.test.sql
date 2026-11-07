-- Topes de uso (migración 20261106120000): reservas de la web por cliente,
-- cambios del cliente por reserva y pagos por reserva.
begin;
select plan(12);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.com', '{"full_name":"Beto"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- ---------- Crear y cancelar en bucle ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok($$
  do $do$
  declare
    id_reserva uuid;
  begin
    for i in 1..10 loop
      insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
      values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '20:30', 2, 'Ana', '2944111111')
      returning id into id_reserva;
      perform public.cancelar_reserva(id_reserva);
    end loop;
  end
  $do$
$$, 'diez vueltas de crear y cancelar pasan');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '20:30', 2, 'Ana', '2944111111')
$$, 'P0001', 'Hiciste muchas reservas en las últimas 24 horas. Para otra, escribinos por WhatsApp.',
  'la reserva once en 24 horas se frena');

reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono, modificada_por, modificaciones)
  values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
          'parrilla', current_date + 10, '20:30', 2, 'Beto', '2944222222', 'admin', -5)
$$, 'el tope es por cliente: Beto reserva igual');

reset role;
select results_eq(
  $$ select modificada_por, modificaciones from public.reservas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  $$ values (null::text, 0::smallint) $$,
  'una reserva nueva no trae modificada_por ni un contador propio');

-- Las de más de 24 horas ya no cuentan
update public.reservas set creada_en = now() - interval '25 hours'
  where usuario_id = '11111111-1111-1111-1111-111111111111';
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
          'parrilla', current_date + 10, '20:30', 2, 'Ana', '2944111111')
$$, 'pasadas las 24 horas, Ana vuelve a reservar');

-- El local no tiene tope
reset role;
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select lives_ok($$
  insert into public.reservas (usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
  select null, 'local', 'confirmada', 'parrilla', current_date + 10, '20:30', 2, 'Cliente ' || i, '2944333333'
  from generate_series(1, 12) as i
$$, 'el local carga todas las que quiera');

-- ---------- Hasta 3 cambios del cliente ----------
reset role;
update public.reservas set estado = 'confirmada' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok($$
  select public.modificar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 10, '20:30', 3::smallint);
  select public.modificar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 10, '20:30', 4::smallint);
  select public.modificar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 10, '20:30', 5::smallint);
$$, 'tres cambios pasan');

select lives_ok($$
  select public.modificar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 10, '20:30', 5::smallint)
$$, 'pedir lo mismo que ya tiene no es un cambio');

select throws_ok($$
  select public.modificar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', current_date + 10, '20:30', 6::smallint)
$$, 'P0001', 'Ya cambiaste esta reserva 3 veces. Para otro cambio, escribinos por WhatsApp.',
  'el cuarto cambio se frena');

reset role;
select is((select personas from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  5::smallint, 'la reserva quedó con el tercer cambio');

-- ---------- Hasta 5 pagos por reserva ----------
select lives_ok($$
  insert into public.pagos (reserva_id, monto)
  select 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000 from generate_series(1, 5)
$$, 'cinco pagos para una reserva pasan');

select throws_ok($$
  insert into public.pagos (reserva_id, monto) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000)
$$, 'P0001', 'Hubo demasiados intentos de pago para esta reserva. Hacé la reserva de nuevo.',
  'el sexto se frena');

select * from finish();
rollback;
