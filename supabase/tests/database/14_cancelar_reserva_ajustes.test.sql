-- Menores de la seña (migración 20261105120000) y los casos de borde que no
-- tenían test: motivo largo, cancelación directa del admin sin motivo,
-- bloqueo de un turno en los dos locales y el corte de las 17:00.
begin;
select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   'parrilla', current_date + 10, '20:30', 2, 'Ana', '2944111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
   'restaurante', current_date + 11, '20:30', 2, 'Ana', '2944111111');

-- ---------- El corte de turnos ----------
select is(public.turno_de('16:59'), 'mediodia', 'a las 16:59 todavía es mediodía');
select is(public.turno_de('17:00'), 'noche', 'a las 17:00 ya es noche');

-- ---------- Motivo largo y cancelación directa, como admin ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select throws_ok(
  format('select public.cancelar_reserva(%L, %L)', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', repeat('x', 121)),
  'P0001', 'El motivo puede tener hasta 120 caracteres.',
  'un motivo de 121 caracteres da un mensaje en castellano, no el 23514 del check');

select is(
  (select estado::text from public.cancelar_reserva('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '  ' || repeat('x', 120) || '  ')),
  'cancelada', 'con 120 caracteres (y espacios alrededor) cancela');

select throws_ok($$
  update public.reservas set estado = 'cancelada' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
$$, 'P0001', 'Escribí el motivo de la cancelación: se lo mandamos al cliente.',
  'el admin tampoco cancela sin motivo con un update directo');

select lives_ok($$
  update public.reservas set estado = 'cancelada', motivo_cancelacion = 'Cierre'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
$$, 'con motivo, el update directo del admin cancela');

reset role;
select is((select cancelada_por::text from public.reservas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'admin', 'la cancelación directa queda a nombre del admin');

-- ---------- Un turno bloqueado en los dos locales (local_id null) ----------
insert into public.dias_bloqueados (fecha, local_id, turno, motivo)
values (current_date + 20, null, 'noche', 'Evento');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 20, '20:00', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese turno ya está completo.', 'el bloqueo de los dos locales frena la noche de la parrilla');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'restaurante', current_date + 20, '21:00', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese turno ya está completo.', 'y la del restaurante');

select lives_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'restaurante', current_date + 20, '12:30', 2, 'Ana', '2944111111')
$$, 'el mediodía de ese día sigue abierto');

select * from finish();
rollback;
