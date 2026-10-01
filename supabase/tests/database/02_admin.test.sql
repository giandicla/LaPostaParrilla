-- Reglas de la parte 2: días bloqueados y notas internas.
begin;
select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- ---------- Admin ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select lives_ok($$
  insert into public.dias_bloqueados (fecha, local_id, motivo)
  values (current_date + 20, 'parrilla', 'Evento privado')
$$, 'el admin bloquea un día de un local');

select lives_ok($$
  insert into public.dias_bloqueados (fecha, local_id, motivo)
  values (current_date + 21, null, 'Cerrado por vacaciones')
$$, 'el admin bloquea un día de los dos locales');

-- ---------- Ana ----------
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is((select count(*)::int from public.dias_bloqueados), 2,
  'un cliente ve los días bloqueados (el formulario los necesita)');

select throws_ok($$
  insert into public.dias_bloqueados (fecha, local_id) values (current_date + 22, null)
$$, '42501', null, 'un cliente no puede bloquear días');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 20, '20:30', 2, 'Ana', '1')
$$, 'P0001', 'Ese día no tomamos reservas en ese local.', 'no se puede reservar un día bloqueado');

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
          'restaurante', current_date + 20, '20:30', 2, 'Ana', '1')
$$, 'el bloqueo de un local no afecta al otro');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'restaurante', current_date + 21, '20:30', 2, 'Ana', '1')
$$, 'P0001', 'Ese día no tomamos reservas en ese local.', 'un bloqueo sin local cierra los dos');

-- ---------- Admin: nota interna ----------
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select lives_ok($$
  insert into public.notas_reserva (reserva_id, nota)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mesa junto al fogón')
$$, 'el admin anota una nota interna');

-- ---------- Ana no ve ni escribe notas ----------
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.notas_reserva), 0,
  'un cliente no ve las notas internas, ni siquiera de su reserva');

select throws_ok($$
  insert into public.notas_reserva (reserva_id, nota)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'hola')
$$, '42501', null, 'un cliente no puede escribir notas internas');

select * from finish();
rollback;
