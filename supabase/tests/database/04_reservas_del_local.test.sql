-- Reservas cargadas por el admin desde el panel (migración 20261008130000):
-- sin cuenta de cliente, confirmadas, hasta 40 personas, mail opcional.
-- Y el plazo para cancelar desde la web, que pasó de 2 horas a 1.
-- Corre con: npx supabase test db
begin;
select plan(19);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

insert into public.dias_bloqueados (fecha, local_id, motivo)
  values (current_date + 20, 'parrilla', 'Evento privado');

-- Una reserva de Ana dentro de 90 minutos: con el plazo viejo (2 horas) no se
-- podía cancelar desde la web; con el nuevo (1 hora), sí.
create temp table en_90_minutos as
  select (ahora + interval '90 minutes')::date as fecha,
         date_trunc('minute', (ahora + interval '90 minutes'))::time as hora
  from (select now() at time zone 'America/Argentina/Buenos_Aires' as ahora) a;
insert into public.franjas_reserva (local_id, hora) select 'restaurante', hora from en_90_minutos
  on conflict do nothing;
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  select 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
         'restaurante', fecha, hora, 2, 'Ana', '2944111111' from en_90_minutos;

-- ---------- Como admin ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select lives_ok($$
  insert into public.reservas (id, usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono, mail)
  values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', null, 'local', 'confirmada',
          'parrilla', current_date + 10, '20:30', 12, 'Carlos', '2944222222', 'carlos@test.com')
$$, 'el admin carga una reserva del local, sin cuenta, para 12 personas');

select is(
  (select estado::text || '/' || origen || '/' || coalesce(usuario_id::text, 'sin cuenta')
   from public.reservas where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
  'confirmada/local/sin cuenta', 'queda confirmada, del local y sin cuenta');

select lives_ok($$
  insert into public.reservas (usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
  values (null, 'local', 'confirmada', 'parrilla', current_date + 10, '21:00', 4, 'Dora', '2944333333')
$$, 'puede cargar otra el mismo día y en el mismo local, y sin mail');

select throws_ok($$
  insert into public.reservas (usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
  values (null, 'local', 'confirmada', 'parrilla', current_date + 10, '20:00', 41, 'Eva', '2944444444')
$$, '23514', null, 'una reserva del local tiene hasta 40 personas');

select throws_ok($$
  insert into public.reservas (usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
  values (null, 'local', 'confirmada', 'parrilla', current_date + 20, '20:30', 4, 'Eva', '2944444444')
$$, 'P0001', 'Ese día no tomamos reservas en ese local.', 'tampoco el admin carga en un día bloqueado');

select throws_ok($$
  insert into public.reservas (usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
  values (null, 'local', 'confirmada', 'parrilla', current_date + 10, '17:00', 4, 'Eva', '2944444444')
$$, 'P0001', 'La hora elegida no es un horario de reserva de ese local.', 'ni fuera de las franjas');

select throws_ok($$
  insert into public.reservas (usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono, mail)
  values (null, 'local', 'confirmada', 'parrilla', current_date + 11, '20:30', 4, 'Eva', '2944444444', 'eva@')
$$, 'P0001', 'Ese mail no parece válido.', 'rechaza un mail sin formato de mail');

select throws_ok($$
  insert into public.reservas (usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'local', 'confirmada', 'parrilla', current_date + 11, '20:30', 4, 'Eva', '2944444444')
$$, '23514', null, 'una reserva del local no puede tener cuenta');

select throws_ok($$
  insert into public.reservas (usuario_id, origen, local_id, fecha, hora, personas, nombre, telefono)
  values (null, 'web', 'parrilla', current_date + 11, '20:30', 4, 'Eva', '2944444444')
$$, '23514', null, 'una reserva de la web tiene que tener cuenta');

-- ---------- Como Ana ----------
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::int from public.reservas where origen = 'local'), 0,
  'un cliente no ve las reservas del local');

-- Una reserva sin cuenta no es de nadie: comparar su usuario_id (null) con el
-- del cliente no puede dejarlo pasar
select throws_ok($$
  select public.cancelar_reserva('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
$$, 'P0001', 'No encontramos esa reserva.', 'un cliente no puede cancelar una reserva del local');

select throws_ok($$
  insert into public.reservas (usuario_id, origen, estado, local_id, fecha, hora, personas, nombre, telefono)
  values (null, 'local', 'confirmada', 'parrilla', current_date + 12, '20:30', 4, 'Ana', '2944111111')
$$, '42501', null, 'un cliente no puede cargar una reserva del local');

select throws_ok($$
  insert into public.reservas (usuario_id, origen, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'local', 'parrilla', current_date + 12, '20:30', 4, 'Ana', '2944111111')
$$, '42501', null, 'ni siquiera a su nombre');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 12, '20:30', 7, 'Ana', '2944111111')
$$, '23514', null, 'desde la web siguen siendo hasta 6 personas');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono, mail)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 12, '20:30', 2, 'Ana', '2944111111', 'ana@test.com')
$$, '23514', null, 'una reserva de la web no lleva mail: el de la cuenta ya está en Auth');

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111',
          'parrilla', current_date + 12, '20:30', 2, 'Ana', '2944111111')
$$, 'un cliente sigue reservando como antes');

select is(
  (select origen from public.reservas where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  'web', 'sin decir nada, una reserva es de la web');

select lives_ok($$
  select public.cancelar_reserva('dddddddd-dddd-dddd-dddd-dddddddddddd')
$$, 'cancela desde la web con 90 minutos de anticipación (más de 1 hora)');

select is(
  (select estado::text from public.reservas where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
  'cancelada', 'queda cancelada');

select * from finish();
rollback;
