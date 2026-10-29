-- La carta pasa a la base (sesión 06): secciones fijas por local o compartidas
-- (vinos y copas), ítems editables por el admin, y el cubierto de cada local.
-- La carga inicial está en la migración siguiente, generada desde los JSON.

-- =====================================================================
-- Secciones: fijas desde el panel. local_id nulo = compartida.
-- El slug es el id de antes (y el ancla pública): se repite entre locales.
-- =====================================================================
create table public.carta_secciones (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  local_id text references public.locales (id) on delete cascade,
  titulo text not null,
  grupo text,
  nota text,
  tamanos text[],
  orden int not null
);

create unique index carta_secciones_slug on public.carta_secciones (coalesce(local_id, ''), slug);

-- =====================================================================
-- Ítems: platos, bebidas y vinos. Los vinos se agrupan por bodega al mostrarlos.
-- =====================================================================
create table public.carta_items (
  id uuid primary key default gen_random_uuid(),
  seccion_id uuid not null references public.carta_secciones (id) on delete cascade,
  nombre text not null check (char_length(nombre) <= 120),
  descripcion text check (char_length(descripcion) <= 300),
  traduccion text check (char_length(traduccion) <= 300),
  detalle text check (char_length(detalle) <= 300),
  bodega text check (char_length(bodega) <= 80),
  region text check (char_length(region) <= 80),
  precio int check (precio > 0),
  precios int[] check (0 < all (precios)),
  orden int not null
);

create index carta_items_seccion on public.carta_items (seccion_id, orden);

alter table public.locales add column cubierto int check (cubierto > 0);

-- Reglas de un ítem, con mensajes para el panel. Los textos se recortan y los
-- vacíos pasan a null; un ítem sin orden va al final de su sección.
create function public.validar_item_carta()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  seccion public.carta_secciones;
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

  if new.orden is null then
    select coalesce(max(orden), 0) + 1 into new.orden
    from public.carta_items where seccion_id = new.seccion_id;
  end if;
  return new;
end;
$$;

create trigger validar_item_carta
  before insert or update on public.carta_items
  for each row execute function public.validar_item_carta();

-- =====================================================================
-- Orden: subir y bajar ítems (en vinos, dentro de su bodega) y bodegas.
-- p_sentido: -1 sube, 1 baja. En el borde no hace nada.
-- =====================================================================
create function public.exigir_admin_carta()
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el admin puede editar la carta.';
  end if;
end;
$$;

create function public.mover_item_carta(p_id uuid, p_sentido int)
returns void
language plpgsql
set search_path = ''
as $$
declare
  item public.carta_items;
  vecino public.carta_items;
begin
  perform public.exigir_admin_carta();
  select * into item from public.carta_items where id = p_id;
  if not found then
    raise exception 'No encontramos ese ítem.';
  end if;

  select * into vecino from public.carta_items
  where seccion_id = item.seccion_id
    and bodega is not distinct from item.bodega
    and case when p_sentido < 0 then orden < item.orden else orden > item.orden end
  order by case when p_sentido < 0 then -orden else orden end
  limit 1;
  if not found then
    return;
  end if;

  update public.carta_items set orden = vecino.orden where id = item.id;
  update public.carta_items set orden = item.orden where id = vecino.id;
end;
$$;

create function public.mover_bodega_carta(p_seccion_id uuid, p_bodega text, p_sentido int)
returns void
language plpgsql
set search_path = ''
as $$
declare
  bodegas text[];
  i int;
begin
  perform public.exigir_admin_carta();
  -- Las bodegas en el orden en que se ven: por su primer vino
  select array_agg(bodega order by primero) into bodegas
  from (select bodega, min(orden) as primero from public.carta_items
        where seccion_id = p_seccion_id group by bodega) b;

  i := array_position(bodegas, p_bodega);
  if i is null or i + sign(p_sentido)::int < 1 or i + sign(p_sentido)::int > array_length(bodegas, 1) then
    return;
  end if;
  bodegas[i] := bodegas[i + sign(p_sentido)::int];
  bodegas[i + sign(p_sentido)::int] := p_bodega;

  -- Renumera la sección: bodega por bodega, cada una con su orden interno
  update public.carta_items c set orden = n.nuevo
  from (
    select id, row_number() over (order by array_position(bodegas, bodega), orden) as nuevo
    from public.carta_items where seccion_id = p_seccion_id
  ) n
  where c.id = n.id;
end;
$$;

create function public.cambiar_region_bodega(p_seccion_id uuid, p_bodega text, p_region text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform public.exigir_admin_carta();
  update public.carta_items set region = p_region
  where seccion_id = p_seccion_id and bodega = p_bodega;
end;
$$;

-- locales no tiene política de update (la seña no se toca desde la API): el
-- cubierto se cambia solo por acá.
create function public.cambiar_cubierto(p_local_id text, p_cubierto int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.exigir_admin_carta();
  update public.locales set cubierto = p_cubierto where id = p_local_id;
  if not found then
    raise exception 'No encontramos ese local.';
  end if;
end;
$$;

-- =====================================================================
-- Seguridad: lectura pública, escritura del admin
-- =====================================================================
alter table public.carta_secciones enable row level security;
alter table public.carta_items enable row level security;

create policy "carta_secciones: lectura pública" on public.carta_secciones
  for select to anon, authenticated using (true);

create policy "carta_items: lectura pública" on public.carta_items
  for select to anon, authenticated using (true);
create policy "carta_items: el admin la edita" on public.carta_items
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

revoke execute on function public.mover_item_carta(uuid, int), public.mover_bodega_carta(uuid, text, int),
  public.cambiar_region_bodega(uuid, text, text), public.cambiar_cubierto(text, int) from public, anon;
grant execute on function public.mover_item_carta(uuid, int), public.mover_bodega_carta(uuid, text, int),
  public.cambiar_region_bodega(uuid, text, text), public.cambiar_cubierto(text, int) to authenticated;
