-- Bloqueos por rango: de una fecha a otra y, si hace falta, entre dos horas.
-- Pedido del usuario (2026-11-10): cerrar por vacaciones, o dejar de tomar
-- reservas en ciertos horarios durante un mes, sin cargar un bloqueo por día.
--
--   fecha        primer día del bloqueo (ya existía)
--   fecha_hasta  último día, inclusive (un solo día: igual a fecha)
--   hora_desde / hora_hasta  inclusive; las dos nulas = todo el día
--
-- Se puede aplicar antes de publicar el front nuevo: el front viejo sigue
-- leyendo y cargando por turno, y este trigger lo traduce.

alter table public.dias_bloqueados
  add column fecha_hasta date,
  add column hora_desde time,
  add column hora_hasta time;

-- Antes había un bloqueo por (fecha, local, turno). Se saca primero: al pasar
-- el turno a horas, mediodía y noche del mismo día quedarían "repetidos".
alter table public.dias_bloqueados drop constraint dias_bloqueados_fecha_local_turno_key;

-- Los bloqueos que ya estaban: un día cada uno; el turno pasa a ser un rango
-- de horas, con el mismo corte que turno_de() (antes de las 17, mediodía).
update public.dias_bloqueados
set fecha_hasta = fecha,
    hora_desde = case turno when 'mediodia' then time '00:00' when 'noche' then time '17:00' end,
    hora_hasta = case turno when 'mediodia' then time '16:59' when 'noche' then time '23:59' end,
    turno = null;

-- Completa lo que no venga: sin fecha_hasta es un solo día; un turno (lo manda
-- el front anterior a esta migración) se guarda como su rango de horas.
create function public.completar_bloqueo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fecha_hasta := coalesce(new.fecha_hasta, new.fecha);
  if new.turno is not null then
    new.hora_desde := case new.turno when 'mediodia' then time '00:00' else time '17:00' end;
    new.hora_hasta := case new.turno when 'mediodia' then time '16:59' else time '23:59' end;
    new.turno := null;
  end if;
  return new;
end;
$$;

create trigger completar_bloqueo
  before insert or update on public.dias_bloqueados
  for each row execute function public.completar_bloqueo();

alter table public.dias_bloqueados
  alter column fecha_hasta set not null,
  add constraint dias_bloqueados_fechas_en_orden check (fecha_hasta >= fecha),
  add constraint dias_bloqueados_horas_en_orden check (
    (hora_desde is null and hora_hasta is null)
    or (hora_desde is not null and hora_hasta is not null and hora_hasta >= hora_desde)
  );

-- Ahora puede haber varios rangos de horas el mismo día; lo que no se repite es
-- el mismo bloqueo exacto.
alter table public.dias_bloqueados
  add constraint dias_bloqueados_sin_repetir
  unique nulls not distinct (fecha, fecha_hasta, local_id, hora_desde, hora_hasta);

-- La validación de reservas: mismo cuerpo que en 20261018120000_sena_ajustes,
-- con el chequeo de bloqueos por rango de fechas y de horas.
create or replace function public.validar_reserva()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.creada_en := now();
  end if;

  if tg_op = 'INSERT'
     or new.fecha is distinct from old.fecha
     or new.hora is distinct from old.hora
     or new.local_id is distinct from old.local_id then

    if not exists (
      select 1 from public.franjas_reserva
      where local_id = new.local_id and hora = new.hora
    ) then
      raise exception 'La hora elegida no es un horario de reserva de ese local.';
    end if;

    if public.inicio_reserva(new.fecha, new.hora) <= now() then
      raise exception 'No se puede reservar para una fecha u hora que ya pasó.';
    end if;

    if exists (
      select 1 from public.dias_bloqueados
      where new.fecha between fecha and fecha_hasta
        and (local_id is null or local_id = new.local_id)
        and hora_desde is null
    ) then
      raise exception 'Ese día no tomamos reservas en ese local.';
    end if;

    if exists (
      select 1 from public.dias_bloqueados
      where new.fecha between fecha and fecha_hasta
        and (local_id is null or local_id = new.local_id)
        and new.hora between hora_desde and hora_hasta
    ) then
      raise exception 'Ese horario no está disponible para reservar.';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.estado = 'cancelada' and old.estado <> 'cancelada' then
    new.cancelada_por := case when public.es_admin() then 'admin' else 'cliente' end;
  end if;

  if tg_op = 'UPDATE' then
    new.actualizada_en := now();
  end if;

  return new;
end;
$$;
