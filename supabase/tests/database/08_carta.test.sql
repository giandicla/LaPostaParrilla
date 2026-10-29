-- La carta en la base: carga inicial, quién escribe, reglas de precios y
-- bodegas, y el orden (mover ítems y bodegas).
-- Corre con: npx supabase test db
begin;
select plan(36);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

-- Atajos para las pruebas (como superusuario, antes de cambiar de rol)
create temp table ids as select
  (select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas') as entradas,
  (select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-clasicas') as pizzas,
  (select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec') as malbec;
grant select on ids to anon, authenticated;

-- El orden de una sección como texto, para comparar antes y después
create function pg_temp.orden_de(p_seccion uuid) returns text language sql as $$
  select string_agg(nombre, '|' order by orden) from public.carta_items where seccion_id = p_seccion
$$;
create function pg_temp.bodegas_de(p_seccion uuid) returns text language sql as $$
  select string_agg(bodega, '|' order by primero) from (
    select bodega, min(orden) as primero from public.carta_items where seccion_id = p_seccion group by bodega
  ) b
$$;
grant execute on function pg_temp.orden_de(uuid), pg_temp.bodegas_de(uuid) to anon, authenticated;

-- ---------- Carga inicial ----------
select is((select count(*)::int from public.carta_secciones where local_id = 'parrilla'), 11, 'la parrilla tiene 11 secciones');
select is((select count(*)::int from public.carta_secciones where local_id = 'restaurante'), 14, 'el restaurante tiene 14 secciones');
select is((select count(*)::int from public.carta_secciones where local_id is null), 11, 'vinos y copas: 11 secciones compartidas');
select is((select count(*)::int from public.carta_items), 278, 'están los 278 ítems de los JSON');
select is((select cubierto from public.locales where id = 'parrilla'), 1500, 'cubierto de la parrilla');
select is((select cubierto from public.locales where id = 'restaurante'), 2000, 'cubierto del restaurante');

-- ---------- Anónimo ----------
set local role anon;
select ok((select count(*) from public.carta_items) > 0, 'un anónimo lee la carta');
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precio) select entradas, 'Pirata', 100 from ids
$$, '42501', null, 'un anónimo no escribe la carta');
reset role;

-- ---------- Ana, cliente ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precio) select entradas, 'Pirata', 100 from ids
$$, '42501', null, 'un cliente no escribe la carta');
select throws_ok($$
  select public.mover_item_carta((select id from public.carta_items limit 1), 1)
$$, 'P0001', 'Solo el admin puede editar la carta.', 'un cliente no mueve ítems');
select throws_ok($$
  select public.cambiar_cubierto('parrilla', 1)
$$, 'P0001', 'Solo el admin puede editar la carta.', 'un cliente no cambia el cubierto');
reset role;

-- ---------- Admin ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

select lives_ok($$
  insert into public.carta_items (seccion_id, nombre, precio) select entradas, '  Matambre  ', 9000 from ids
$$, 'el admin agrega un plato');
select is(
  (select orden from public.carta_items where nombre = 'Matambre'),
  (select max(orden) from public.carta_items, ids where seccion_id = ids.entradas),
  'el plato nuevo va al final de su sección, con el nombre recortado');

select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precio, precios) select pizzas, 'X', 1, '{1,2}' from ids
$$, 'P0001', 'Cargá un precio o un precio por tamaño, no los dos.', 'precio y precios juntos no');
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre) select entradas, 'X' from ids
$$, 'P0001', 'Cargá un precio o un precio por tamaño, no los dos.', 'sin precio no');
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precio) select entradas, 'X', -1 from ids
$$, '23514', null, 'precio negativo no');
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precios) select pizzas, 'X', '{21000}' from ids
$$, 'P0001', 'Cargá un precio por tamaño.', 'una pizza necesita un precio por tamaño');
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precios) select entradas, 'X', '{1,2}' from ids
$$, 'P0001', 'Esta sección no tiene tamaños: cargá un solo precio.', 'precios en una sección sin tamaños no');
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precio) select malbec, 'X', 1 from ids
$$, 'P0001', 'Indicá la bodega del vino.', 'un vino necesita bodega');
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precio, bodega) select entradas, 'X', 1, 'Catena' from ids
$$, 'P0001', 'Solo los vinos llevan bodega.', 'un plato no lleva bodega');
select throws_ok($$
  insert into public.carta_items (seccion_id, nombre, precio) select entradas, '   ', 1 from ids
$$, 'P0001', 'Escribí el nombre.', 'el nombre no puede estar vacío');

-- Mover ítems
create temp table antes as select pg_temp.orden_de(entradas) as entradas, pg_temp.orden_de(malbec) as malbec,
  pg_temp.bodegas_de(malbec) as bodegas from ids;
select lives_ok($$
  select public.mover_item_carta((select id from public.carta_items, ids where seccion_id = ids.entradas order by orden limit 1), -1)
$$, 'subir el primero no falla');
select is((select pg_temp.orden_de(entradas) from ids), (select entradas from antes), 'subir el primero no cambia nada');

select public.mover_item_carta((select id from public.carta_items, ids where seccion_id = ids.entradas order by orden limit 1), 1);
select is(
  (select split_part(pg_temp.orden_de(entradas), '|', 1) from ids),
  (select split_part(entradas, '|', 2) from antes),
  'bajar el primero lo cambia con el segundo');

-- En vinos, un ítem no salta de bodega: el primero de la segunda bodega no sube
select public.mover_item_carta((
  select id from public.carta_items i, ids where i.seccion_id = ids.malbec
    and i.bodega = split_part((select bodegas from antes), '|', 2)
  order by orden limit 1), -1);
select is((select pg_temp.orden_de(malbec) from ids), (select malbec from antes), 'un vino no sube a la bodega de arriba');

-- Mover bodegas
select public.mover_bodega_carta((select malbec from ids), split_part((select bodegas from antes), '|', 1), -1);
select is((select pg_temp.bodegas_de(malbec) from ids), (select bodegas from antes), 'subir la primera bodega no cambia nada');

select public.mover_bodega_carta((select malbec from ids), split_part((select bodegas from antes), '|', 2), -1);
select is(
  (select split_part(pg_temp.bodegas_de(malbec), '|', 1) from ids),
  split_part((select bodegas from antes), '|', 2),
  'subir la segunda bodega la pone primera');
select is(
  (select count(*)::int from (
    select bodega, max(orden) - min(orden) + 1 as largo, count(*) as cant
    from public.carta_items, ids where seccion_id = ids.malbec group by bodega
  ) b where largo <> cant),
  0, 'los vinos de cada bodega quedan juntos');

-- Región de la bodega
select public.cambiar_region_bodega((select malbec from ids), 'Catena Zapata', 'Mendoza');
select ok(
  (select bool_and(region = 'Mendoza') from public.carta_items, ids where seccion_id = ids.malbec and bodega = 'Catena Zapata'),
  'la región cambia en todos los vinos de la bodega');
select ok(
  coalesce((select bool_and(region is distinct from 'Mendoza') from public.carta_items, ids
    where seccion_id <> ids.malbec and bodega = 'Catena Zapata'), true),
  'pero no en otras secciones');

-- Un vino nuevo de una bodega que ya está va al final de SU bodega, con su región
create temp table lugar as select array_position(string_to_array(pg_temp.bodegas_de(malbec), '|'), 'Aleanna') as antes from ids;
insert into public.carta_items (seccion_id, nombre, precio, bodega) select malbec, 'Vino nuevo', 30000, 'Aleanna' from ids;
select is(
  (select region from public.carta_items where nombre = 'Vino nuevo'),
  (select region from public.carta_items, ids where seccion_id = ids.malbec and bodega = 'Aleanna' and nombre <> 'Vino nuevo' limit 1),
  'el vino nuevo hereda la región de su bodega');
select is(
  (select count(*)::int from (
    select bodega, max(orden) - min(orden) + 1 as largo, count(*) as cant
    from public.carta_items, ids where seccion_id = ids.malbec group by bodega
  ) b where largo <> cant),
  0, 'el vino nuevo queda junto a los de su bodega');
select is(
  (select nombre from public.carta_items, ids where seccion_id = ids.malbec and bodega = 'Aleanna' order by orden desc limit 1),
  'Vino nuevo', 'y va último dentro de su bodega');
-- Si después se borra el vino viejo, la bodega no se mueve de lugar
delete from public.carta_items using ids where seccion_id = ids.malbec and bodega = 'Aleanna' and nombre <> 'Vino nuevo';
select is(
  (select array_position(string_to_array(pg_temp.bodegas_de(malbec), '|'), 'Aleanna') from ids),
  (select antes from lugar),
  'borrar el vino viejo no cambia el lugar de la bodega');

select lives_ok($$ select public.cambiar_cubierto('parrilla', 1800) $$, 'el admin cambia el cubierto');
reset role;
select is((select cubierto from public.locales where id = 'parrilla'), 1800, 'el cubierto quedó cambiado');

select * from finish();
rollback;
