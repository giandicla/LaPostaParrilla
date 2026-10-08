-- Validación de los datos de contacto (migración 20261008120000).
-- Corre con: npx supabase test db
begin;
select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- ---------- Como Ana ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '20:30', 2, 'A', '2944111111')
$$, 'P0001', 'El nombre tiene que tener entre 2 y 80 caracteres.', 'rechaza un nombre de una letra');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '20:30', 2, repeat('a', 81), '2944111111')
$$, 'P0001', 'El nombre tiene que tener entre 2 y 80 caracteres.', 'rechaza un nombre de más de 80');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '20:30', 2, 'Ana', '111')
$$, 'P0001', 'Ese teléfono no parece válido: tiene que tener entre 8 y 15 dígitos.', 'rechaza un teléfono con pocos dígitos');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '20:30', 2, 'Ana', 'llamame 29441111')
$$, 'P0001', 'Ese teléfono no parece válido: tiene que tener entre 8 y 15 dígitos.', 'rechaza un teléfono con letras');

select throws_ok($$
  insert into public.reservas (usuario_id, local_id, fecha, hora, personas, nombre, telefono, comentarios)
  values ('11111111-1111-1111-1111-111111111111', 'parrilla', current_date + 10, '20:30', 2, 'Ana', '2944111111', repeat('x', 501))
$$, 'P0001', 'Los comentarios pueden tener hasta 500 caracteres.', 'rechaza comentarios de más de 500');

select lives_ok($$
  insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
          'parrilla', current_date + 10, '20:30', 2, 'María José', '+54 9 2944 96-6199')
$$, 'acepta un nombre con tilde y un teléfono con formato');

-- ---------- Una reserva vieja, de antes de esta regla ----------
reset role;
alter table public.reservas disable trigger validar_contacto;
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
        'restaurante', current_date + 11, '20:30', 2, 'Ana', '111');
alter table public.reservas enable trigger validar_contacto;

-- ---------- Como admin ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select lives_ok($$
  update public.reservas set estado = 'confirmada' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
$$, 'una reserva vieja con teléfono corto se puede seguir confirmando');

select throws_ok($$
  update public.reservas set telefono = '12' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
$$, 'P0001', 'Ese teléfono no parece válido: tiene que tener entre 8 y 15 dígitos.', 'cambiar el teléfono sí lo valida');

select throws_ok($$
  insert into public.dias_bloqueados (fecha, local_id, motivo) values (current_date + 30, null, repeat('x', 121))
$$, '23514', null, 'el motivo de un bloqueo tiene hasta 120 caracteres');

select lives_ok($$
  insert into public.dias_bloqueados (fecha, local_id, motivo) values (current_date + 30, null, 'Evento privado')
$$, 'un motivo corto se acepta');

select * from finish();
rollback;
