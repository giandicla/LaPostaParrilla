-- Bloqueos por rango (migración 20261110120000): de una fecha a otra y,
-- si hace falta, entre dos horas.
begin;
select plan(16);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}');

-- Vacaciones en la parrilla: tres días enteros
insert into public.dias_bloqueados (fecha, fecha_hasta, local_id, motivo)
values (current_date + 30, current_date + 32, 'parrilla', 'Vacaciones');

-- En los dos locales, diez días sin las primeras reservas de la noche
insert into public.dias_bloqueados (fecha, fecha_hasta, local_id, hora_desde, hora_hasta, motivo)
values (current_date + 40, current_date + 49, null, '20:00', '20:30', 'Evento');

-- ---------- Lo que completa la base ----------
insert into public.dias_bloqueados (fecha, local_id) values (current_date + 60, 'parrilla');
select is(
  (select fecha_hasta from public.dias_bloqueados where fecha = current_date + 60),
  current_date + 60, 'sin fecha_hasta, el bloqueo es de un solo día');

insert into public.dias_bloqueados (fecha, local_id, turno) values (current_date + 61, 'parrilla', 'noche');
select is(
  (select hora_desde::text || ' a ' || hora_hasta::text || ' ' || coalesce(turno, 'sin turno')
   from public.dias_bloqueados where fecha = current_date + 61),
  '17:00:00 a 23:59:00 sin turno', 'un turno (front anterior) se guarda como su rango de horas');

-- ---------- Lo que la base no acepta ----------
select throws_ok($$
  insert into public.dias_bloqueados (fecha, fecha_hasta, local_id) values (current_date + 70, current_date + 69, null)
$$, '23514', null, 'la fecha hasta no puede ser anterior a la fecha desde');

select throws_ok($$
  insert into public.dias_bloqueados (fecha, local_id, hora_desde, hora_hasta) values (current_date + 70, null, '21:00', '20:00')
$$, '23514', null, 'la hora hasta no puede ser anterior a la hora desde');

select throws_ok($$
  insert into public.dias_bloqueados (fecha, local_id, hora_desde) values (current_date + 70, null, '20:00')
$$, '23514', null, 'las horas van las dos o ninguna');

select lives_ok($$
  insert into public.dias_bloqueados (fecha, fecha_hasta, local_id, hora_desde, hora_hasta)
  values (current_date + 40, current_date + 49, null, '12:00', '12:15')
$$, 'el mismo rango de fechas admite otro rango de horas');

select throws_ok($$
  insert into public.dias_bloqueados (fecha, fecha_hasta, local_id, hora_desde, hora_hasta)
  values (current_date + 40, current_date + 49, null, '12:00', '12:15')
$$, '23505', null, 'el mismo bloqueo exacto no se carga dos veces');

-- ---------- Reservas ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 30, '20:30', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese día no tomamos reservas en ese local.', 'el primer día del rango está bloqueado');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 31, '12:30', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese día no tomamos reservas en ese local.', 'un día del medio también');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 32, '21:00', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese día no tomamos reservas en ese local.', 'y el último, inclusive');

select lives_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 33, '20:30', 2, 'Ana', '2944111111')
$$, 'el día siguiente al rango se puede reservar');

select lives_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'restaurante', current_date + 31, '20:30', 2, 'Ana', '2944111111')
$$, 'el otro local no está bloqueado');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'restaurante', current_date + 45, '20:15', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese horario no está disponible para reservar.', 'una hora dentro del rango bloqueado no se puede reservar');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 45, '20:30', 2, 'Ana', '2944111111')
$$, 'P0001', 'Ese horario no está disponible para reservar.', 'la hora hasta es inclusive');

select lives_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 45, '20:45', 2, 'Ana', '2944111111')
$$, 'una hora fuera del rango, el mismo día, sí');

select lives_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'restaurante', current_date + 45, '12:30', 2, 'Ana', '2944111111')
$$, 'y el otro turno también');

select * from finish();
rollback;
