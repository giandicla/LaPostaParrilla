-- Editor v2: ubicar ítems y bodegas en una posición (arrastrar), y cambiar
-- un ítem de categoría o de bodega.
-- Corre con: npx supabase test db
begin;
select plan(17);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'ana@test.com', '{"full_name":"Ana"}'),
  ('33333333-3333-3333-3333-333333333333', 'admin@test.com', '{"full_name":"Admin"}');
update public.perfiles set rol = 'admin' where id = '33333333-3333-3333-3333-333333333333';

create temp table ids as select
  (select id from public.carta_secciones where local_id = 'parrilla' and slug = 'entradas') as entradas,
  (select id from public.carta_secciones where local_id = 'parrilla' and slug = 'ensaladas') as ensaladas,
  (select id from public.carta_secciones where local_id = 'restaurante' and slug = 'pizzas-clasicas') as pizzas,
  (select id from public.carta_secciones where local_id = 'restaurante' and slug = 'entradas') as entradas_rest,
  (select id from public.carta_secciones where local_id is null and slug = 'vinos-malbec') as malbec;
grant select on ids to authenticated;

create function pg_temp.nombres(p_seccion uuid) returns text[] language sql as $$
  select array_agg(nombre order by orden) from public.carta_items where seccion_id = p_seccion
$$;
create function pg_temp.ordenes_ok(p_seccion uuid) returns boolean language sql as $$
  select bool_and(orden = n) from (
    select orden, row_number() over (order by orden) as n from public.carta_items where seccion_id = p_seccion
  ) o
$$;
create function pg_temp.bodegas(p_seccion uuid) returns text[] language sql as $$
  select array_agg(bodega order by primero) from (
    select bodega, min(orden) as primero from public.carta_items where seccion_id = p_seccion group by bodega
  ) b
$$;
create function pg_temp.bodegas_contiguas(p_seccion uuid) returns boolean language sql as $$
  select bool_and(max - min + 1 = cant) from (
    select max(orden) as max, min(orden) as min, count(*) as cant
    from public.carta_items where seccion_id = p_seccion group by bodega
  ) b
$$;
grant execute on function pg_temp.nombres(uuid), pg_temp.ordenes_ok(uuid), pg_temp.bodegas(uuid),
  pg_temp.bodegas_contiguas(uuid) to authenticated;

create temp table antes as select
  pg_temp.nombres(entradas) as entradas, pg_temp.nombres(ensaladas) as ensaladas,
  pg_temp.bodegas(malbec) as bodegas from ids;
grant select on antes to authenticated;

-- ---------- Cliente ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select throws_ok($$
  select public.ubicar_item_carta((select id from public.carta_items limit 1), 1)
$$, 'P0001', 'Solo el admin puede editar la carta.', 'un cliente no ubica ítems');
reset role;

-- ---------- Admin ----------
set local role authenticated;
set local request.jwt.claims to '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

-- Ubicar un ítem
select public.ubicar_item_carta(
  (select id from public.carta_items, ids where seccion_id = ids.entradas and nombre = (select entradas[3] from antes)), 1);
select is((select (pg_temp.nombres(entradas))[1] from ids), (select entradas[3] from antes), 'el tercero pasa a ser primero');
select ok((select pg_temp.ordenes_ok(entradas) from ids), 'la sección queda numerada 1..n');

select public.ubicar_item_carta(
  (select id from public.carta_items, ids where seccion_id = ids.entradas and nombre = (select entradas[1] from antes)), 99);
select is((select (pg_temp.nombres(entradas))[array_length(pg_temp.nombres(entradas), 1)] from ids),
  (select entradas[1] from antes), 'una posición fuera de rango lo deja último');

select public.ubicar_item_carta(
  (select id from public.carta_items, ids where seccion_id = ids.entradas and nombre = (select entradas[2] from antes)), 0);
select is((select (pg_temp.nombres(entradas))[1] from ids), (select entradas[2] from antes), 'la posición 0 lo deja primero');

-- En vinos, dentro de su bodega
create temp table catena as select bodegas from antes;
select public.ubicar_item_carta(
  (select id from public.carta_items, ids where seccion_id = ids.malbec and bodega = 'Catena Zapata' order by orden offset 1 limit 1), 1);
select is(
  (select nombre from public.carta_items, ids where seccion_id = ids.malbec and bodega = 'Catena Zapata' order by orden limit 1),
  'SAINT FELICIEN MALBEC', 'un vino se ubica primero dentro de su bodega');
select is((select pg_temp.bodegas(malbec) from ids), (select bodegas from antes), 'las bodegas no cambian de lugar');
select ok((select pg_temp.bodegas_contiguas(malbec) from ids), 'los vinos de cada bodega siguen juntos');

-- Ubicar una bodega
select public.ubicar_bodega_carta((select malbec from ids), (select bodegas[3] from antes), 1);
select is((select (pg_temp.bodegas(malbec))[1] from ids), (select bodegas[3] from antes), 'la tercera bodega pasa a ser primera');
select ok((select pg_temp.bodegas_contiguas(malbec) and pg_temp.ordenes_ok(malbec) from ids), 'y la sección queda 1..n con bodegas juntas');

-- Cambiar de categoría
update public.carta_items set seccion_id = (select ensaladas from ids)
  where id = (select id from public.carta_items, ids where seccion_id = ids.entradas order by orden limit 1);
select is(array_length((select pg_temp.nombres(ensaladas) from ids), 1), array_length((select ensaladas from antes), 1) + 1,
  'el ítem pasa a ensaladas');
select ok((select pg_temp.ordenes_ok(entradas) and pg_temp.ordenes_ok(ensaladas) from ids), 'origen y destino quedan 1..n');

select lives_ok($$
  update public.carta_items set seccion_id = (select entradas_rest from ids), precio = 9000, precios = null
  where id = (select id from public.carta_items, ids where seccion_id = ids.pizzas order by orden limit 1)
$$, 'una pizza pasa a entradas con un solo precio');
select is((select nombre from public.carta_items, ids where seccion_id = ids.entradas_rest order by orden desc limit 1),
  'MUZZARELLA', 'y queda última en entradas');
select throws_ok($$
  update public.carta_items set seccion_id = (select entradas_rest from ids)
  where id = (select id from public.carta_items, ids where seccion_id = ids.pizzas order by orden limit 1)
$$, 'P0001', 'Esta sección no tiene tamaños: cargá un solo precio.', 'sin cambiar los precios, no');

-- Cambiar de bodega
update public.carta_items set bodega = 'Catena Zapata', region = null
  where id = (select id from public.carta_items, ids where seccion_id = ids.malbec and bodega = 'Aleanna' limit 1);
select is(
  (select nombre from public.carta_items, ids where seccion_id = ids.malbec and bodega = 'Catena Zapata' order by orden desc limit 1),
  'EL ENEMIGO', 'un vino que cambia de bodega queda último en la nueva');
select is(
  (select region from public.carta_items, ids where seccion_id = ids.malbec and nombre = 'EL ENEMIGO'),
  (select region from public.carta_items, ids where seccion_id = ids.malbec and bodega = 'Catena Zapata' and nombre <> 'EL ENEMIGO' limit 1),
  'y toma la región de la bodega');
reset role;

select * from finish();
rollback;
