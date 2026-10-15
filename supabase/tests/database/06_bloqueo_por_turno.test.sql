-- Bloqueo por turno (migración 20261015130000): frena las reservas nuevas de
-- un turno lleno y no toca las que ya estaban.
begin;
select plan(6);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('22222222-2222-2222-2222-222222222222', 'beto@test.com', '{"full_name":"Beto"}');

-- Beto ya tenía reserva para la noche antes del bloqueo
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
        'parrilla', current_date + 20, '20:30', 2, 'Beto', '2944222222');

insert into public.dias_bloqueados (fecha, local_id, turno, motivo)
values (current_date + 20, 'parrilla', 'noche', 'Completo');

select is(public.turno_de('12:30'), 'mediodia', 'antes de las 17 es mediodía');
select is(public.turno_de('20:00'), 'noche', 'desde las 17 es noche');

set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 20, '21:00', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese turno ya está completo.', 'no se puede reservar en un turno bloqueado');

select lives_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 20, '12:30', 2, 'Ana', '2944111111')
$$, 'el otro turno del mismo día sigue abierto');

reset role;
select is((select estado::text from public.reservas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'esperando_pago', 'la reserva que ya existía no se toca');

select lives_ok($$
  insert into public.dias_bloqueados (fecha, local_id, turno) values (current_date + 20, 'parrilla', 'mediodia')
$$, 'se puede bloquear también el otro turno del mismo día');

select * from finish();
rollback;
