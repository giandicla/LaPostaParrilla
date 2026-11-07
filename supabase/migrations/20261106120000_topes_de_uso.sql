-- Topes de uso (auditoría de seguridad del 2026-11-06). Nada de esto cambia el
-- uso normal; corta a quien repite una acción cientos de veces:
--
-- 1. Reservas desde la web: hasta 10 por cliente cada 24 horas, en cualquier
--    estado. Antes se podía crear y cancelar en bucle (una reserva esperando el
--    pago se cancela al instante) y cada vuelta dejaba una fila para siempre.
--    Miles de filas en un día podían dejar reservas reales fuera de la lista del
--    panel, que PostgREST corta en max_rows (1000).
-- 2. modificar_reserva: hasta 3 cambios por reserva hechos por el cliente. Cada
--    cambio manda un mail por Brevo y no había límite. Un cambio que no cambia
--    nada no cuenta ni manda mail. El local (admin) no tiene tope.
-- 3. pagos: hasta 5 por reserva. Cada POST /api/v1/pagos crea una fila y una
--    preferencia de Mercado Pago; la ruta corta antes con un 429 y esto es el
--    respaldo de la base.
--
-- De paso, una reserva nueva no puede traer modificada_por ni un contador
-- propio: los pone la base.

-- =====================================================================
-- 1. Hasta 10 reservas de la web por cliente cada 24 horas
-- =====================================================================
create index reservas_por_usuario_y_creacion on public.reservas (usuario_id, creada_en);

alter table public.reservas
  add column modificaciones smallint not null default 0 check (modificaciones >= 0);

create function public.limitar_reservas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.modificada_por := null;
  new.modificaciones := 0;

  if new.origen = 'web' and (
    select count(*) from public.reservas
    where usuario_id = new.usuario_id and origen = 'web'
      and creada_en > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'Hiciste muchas reservas en las últimas 24 horas. Para otra, escribinos por WhatsApp.';
  end if;

  return new;
end;
$$;

create trigger limitar_reservas
  before insert on public.reservas
  for each row execute function public.limitar_reservas();

revoke execute on function public.limitar_reservas() from anon, authenticated, public;

-- =====================================================================
-- 2. Hasta 3 cambios del cliente por reserva
-- =====================================================================
create or replace function public.modificar_reserva(p_id uuid, p_fecha date, p_hora time, p_personas smallint)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reservas;
begin
  select * into r from public.reservas where id = p_id for update;

  if not found or r.usuario_id is distinct from auth.uid() then
    raise exception 'No encontramos esa reserva.';
  end if;

  if r.estado not in ('pendiente', 'confirmada') then
    raise exception 'Solo se puede modificar una reserva confirmada.';
  end if;

  if public.inicio_reserva(r.fecha, r.hora) - now() < interval '1 hour' then
    raise exception 'Falta menos de 1 hora para tu reserva: para cambiarla escribinos por WhatsApp.';
  end if;

  -- Sin cambios: no se toca la fila (no hay mail ni cuenta como cambio)
  if r.fecha = p_fecha and r.hora = p_hora and r.personas = p_personas then
    return r;
  end if;

  if r.modificaciones >= 3 then
    raise exception 'Ya cambiaste esta reserva 3 veces. Para otro cambio, escribinos por WhatsApp.';
  end if;

  update public.reservas
    set fecha = p_fecha, hora = p_hora, personas = p_personas, modificaciones = r.modificaciones + 1
    where id = p_id
    returning * into r;
  return r;
end;
$$;

-- =====================================================================
-- 3. Hasta 5 pagos por reserva
-- =====================================================================
create function public.limitar_pagos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.pagos where reserva_id = new.reserva_id) >= 5 then
    raise exception 'Hubo demasiados intentos de pago para esta reserva. Hacé la reserva de nuevo.';
  end if;
  return new;
end;
$$;

create trigger limitar_pagos
  before insert on public.pagos
  for each row execute function public.limitar_pagos();

revoke execute on function public.limitar_pagos() from anon, authenticated, public;
