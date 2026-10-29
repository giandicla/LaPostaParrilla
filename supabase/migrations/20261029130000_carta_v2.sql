-- Editor de la carta v2 (sesión 06): ubicar un ítem o una bodega en una
-- posición (lo usa el arrastre del panel), y que cambiar un ítem de categoría o
-- de bodega lo deje al final del destino. La migración anterior ya está en
-- producción: acá solo se agrega o se reemplaza.

-- =====================================================================
-- Renumerar una sección: 1..n sin huecos. En vinos, bodega por bodega (cada
-- bodega va donde está su primer vino); en el resto hay un solo bloque.
-- =====================================================================
create function public.renumerar_seccion_carta(p_seccion_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.carta_items c set orden = n.nuevo
  from (
    select id, row_number() over (order by primero, orden) as nuevo
    from (
      select id, orden, min(orden) over (partition by bodega) as primero
      from public.carta_items where seccion_id = p_seccion_id
    ) b
  ) n
  where c.id = n.id and c.orden <> n.nuevo;
end;
$$;

-- =====================================================================
-- El trigger de reglas, con el cambio de categoría o de bodega: el ítem va al
-- final del destino (al final de su bodega si ya está en la sección) y toma la
-- región de esa bodega si no se cargó otra.
-- =====================================================================
create or replace function public.validar_item_carta()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  seccion public.carta_secciones;
  ultimo_de_bodega int;
  ubicar boolean;
begin
  select * into seccion from public.carta_secciones where id = new.seccion_id;

  new.nombre := btrim(new.nombre);
  new.descripcion := nullif(btrim(new.descripcion), '');
  new.traduccion := nullif(btrim(new.traduccion), '');
  new.detalle := nullif(btrim(new.detalle), '');
  new.bodega := nullif(btrim(new.bodega), '');
  new.region := nullif(btrim(new.region), '');

  if new.nombre is null or new.nombre = '' then
    raise exception 'Escribí el nombre.';
  end if;
  if num_nonnulls(new.precio, new.precios) <> 1 then
    raise exception 'Cargá un precio o un precio por tamaño, no los dos.';
  end if;
  if new.precios is not null and seccion.tamanos is null then
    raise exception 'Esta sección no tiene tamaños: cargá un solo precio.';
  end if;
  if seccion.tamanos is not null
     and coalesce(array_length(new.precios, 1), 0) <> array_length(seccion.tamanos, 1) then
    raise exception 'Cargá un precio por tamaño.';
  end if;
  if seccion.grupo = 'Vinos' and new.bodega is null then
    raise exception 'Indicá la bodega del vino.';
  end if;
  if seccion.grupo is distinct from 'Vinos' and new.bodega is not null then
    raise exception 'Solo los vinos llevan bodega.';
  end if;

  ubicar := (tg_op = 'INSERT' and new.orden is null)
    or (tg_op = 'UPDATE' and (new.seccion_id <> old.seccion_id or new.bodega is distinct from old.bodega));
  if not ubicar then
    return new;
  end if;

  -- Un vino de una bodega que ya está en la sección va al final de SU bodega
  if new.bodega is not null then
    select max(orden) into ultimo_de_bodega
    from public.carta_items
    where seccion_id = new.seccion_id and bodega = new.bodega and id <> new.id;
    if ultimo_de_bodega is not null then
      update public.carta_items set orden = orden + 1
      where seccion_id = new.seccion_id and orden > ultimo_de_bodega and id <> new.id;
      new.orden := ultimo_de_bodega + 1;
      if new.region is null or (tg_op = 'UPDATE' and new.region is not distinct from old.region) then
        select region into new.region from public.carta_items
        where seccion_id = new.seccion_id and bodega = new.bodega and id <> new.id and region is not null limit 1;
      end if;
      return new;
    end if;
  end if;

  select coalesce(max(orden), 0) + 1 into new.orden
  from public.carta_items where seccion_id = new.seccion_id and id <> new.id;
  return new;
end;
$$;

-- Después de mover un ítem de categoría o de bodega, las dos secciones quedan 1..n
create function public.renumerar_tras_mover_carta()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.renumerar_seccion_carta(old.seccion_id);
  if new.seccion_id <> old.seccion_id then
    perform public.renumerar_seccion_carta(new.seccion_id);
  end if;
  return null;
end;
$$;

create trigger renumerar_tras_mover_carta
  after update on public.carta_items
  for each row
  when (new.seccion_id is distinct from old.seccion_id or new.bodega is distinct from old.bodega)
  execute function public.renumerar_tras_mover_carta();

-- =====================================================================
-- Ubicar un ítem en una posición (1 = primero) dentro de su grupo: en vinos,
-- su bodega; si no, la sección. Fuera de rango se acota. Bloquea la sección
-- para que dos arrastres seguidos no dejen órdenes repetidos.
-- =====================================================================
create function public.ubicar_item_carta(p_id uuid, p_posicion int)
returns void
language plpgsql
set search_path = ''
as $$
declare
  item public.carta_items;
  otros uuid[];
  lugares int[];
  posicion int;
  nuevos uuid[];
begin
  perform public.exigir_admin_carta();
  select * into item from public.carta_items where id = p_id;
  if not found then
    raise exception 'No encontramos ese ítem.';
  end if;
  perform 1 from public.carta_items where seccion_id = item.seccion_id for update;

  -- El grupo sin el ítem, y los lugares (órdenes) que ocupa el grupo entero
  select coalesce(array_agg(id order by orden), '{}') into otros
  from public.carta_items
  where seccion_id = item.seccion_id and bodega is not distinct from item.bodega and id <> p_id;
  select array_agg(orden order by orden) into lugares
  from public.carta_items
  where seccion_id = item.seccion_id and bodega is not distinct from item.bodega;

  posicion := least(greatest(p_posicion, 1), coalesce(array_length(otros, 1), 0) + 1);
  nuevos := otros[1:posicion - 1] || p_id || otros[posicion:];

  -- El grupo se reordena dentro de los mismos lugares: no se mueve de bloque
  update public.carta_items c set orden = lugares[array_position(nuevos, c.id)]
  where c.id = any (nuevos);
  perform public.renumerar_seccion_carta(item.seccion_id);
end;
$$;

-- Ubicar una bodega entera en una posición dentro de su sección
create function public.ubicar_bodega_carta(p_seccion_id uuid, p_bodega text, p_posicion int)
returns void
language plpgsql
set search_path = ''
as $$
declare
  otras text[];
  posicion int;
  nuevas text[];
begin
  perform public.exigir_admin_carta();
  perform 1 from public.carta_items where seccion_id = p_seccion_id for update;
  if not exists (select 1 from public.carta_items where seccion_id = p_seccion_id and bodega = p_bodega) then
    raise exception 'No encontramos esa bodega.';
  end if;

  select coalesce(array_agg(bodega order by primero), '{}') into otras
  from (select bodega, min(orden) as primero from public.carta_items
        where seccion_id = p_seccion_id and bodega <> p_bodega group by bodega) b;
  posicion := least(greatest(p_posicion, 1), coalesce(array_length(otras, 1), 0) + 1);
  nuevas := otras[1:posicion - 1] || p_bodega || otras[posicion:];

  update public.carta_items c set orden = n.nuevo
  from (
    select id, row_number() over (order by array_position(nuevas, bodega), orden) as nuevo
    from public.carta_items where seccion_id = p_seccion_id
  ) n
  where c.id = n.id;
end;
$$;

revoke execute on function public.ubicar_item_carta(uuid, int), public.ubicar_bodega_carta(uuid, text, int),
  public.renumerar_seccion_carta(uuid) from public, anon;
grant execute on function public.ubicar_item_carta(uuid, int), public.ubicar_bodega_carta(uuid, text, int)
  to authenticated;
