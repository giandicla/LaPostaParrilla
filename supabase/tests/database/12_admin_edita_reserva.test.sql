-- El admin edita los datos de una reserva desde el panel: nombre, teléfono,
-- personas, comentarios y, en las del local, el mail. No hay migración nueva:
-- lo permite la política "reservas: el admin edita" y lo validan los checks y
-- triggers que ya estaban. Este test lo deja fijado.
begin;
select plan(12);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- Una de la web (de Ana) y una cargada en el local
insert into public.reservas (id, usuario_id, local_id, fecha, hora, personas, nombre, telefono, estado)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
        'parrilla', current_date + 10, '20:00', 2, 'Ana', '2944111111', 'confirmada');
insert into public.reservas (id, usuario_id, origen, local_id, fecha, hora, personas, nombre, telefono, estado)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'local',
        'parrilla', current_date + 10, '21:00', 12, 'Familia Pérez', '2944222222', 'confirmada');

-- ---------- Como admin ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select lives_ok($$
  update public.reservas
    set nombre = 'Ana López', telefono = '+54 9 2944 33-3333', personas = 4, comentarios = 'Cumpleaños'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
$$, 'el admin corrige nombre, teléfono, personas y comentarios de una reserva de la web');

select results_eq($$
  select nombre, telefono, personas::int, comentarios from public.reservas
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
$$, $$ values ('Ana López', '+54 9 2944 33-3333', 4, 'Cumpleaños') $$, 'y queda guardado');

select is((select modificada_por from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  null, 'sin cambiar fecha ni hora no cuenta como movida (no sale el mail de "te movimos la reserva")');

select throws_ok($$
  update public.reservas set personas = 7 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
$$, '23514', null, 'una de la web sigue con el tope de 6 personas');

select throws_ok($$
  update public.reservas set mail = 'ana@otro.com' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
$$, '23514', null, 'una de la web no lleva mail: es el de la cuenta');

select throws_ok($$
  update public.reservas set telefono = '12' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
$$, 'P0001', null, 'un teléfono inválido se rechaza');

select throws_ok($$
  update public.reservas set nombre = '  ' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
$$, '23514', null, 'el nombre no puede quedar vacío');

select lives_ok($$
  update public.reservas set personas = 20, mail = 'perez@mail.com'
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
$$, 'una del local acepta hasta 40 personas y se le puede cargar el mail');

select throws_ok($$
  update public.reservas set mail = 'perez arroba mail' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
$$, 'P0001', null, 'un mail inválido se rechaza');

select throws_ok($$
  update public.reservas set personas = 41 where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
$$, '23514', null, 'y no más de 40');

-- ---------- Como cliente: no edita directo (para fecha, hora y personas usa modificar_reserva) ----------
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

update public.reservas set nombre = 'Otra', personas = 6 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

reset role;
select results_eq($$
  select nombre, personas::int from public.reservas where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
$$, $$ values ('Ana López', 4) $$, 'el cliente no puede cambiar los datos con un update directo');

select is((select mail from public.reservas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'perez@mail.com', 'el mail cargado por el admin quedó');

select * from finish();
rollback;
