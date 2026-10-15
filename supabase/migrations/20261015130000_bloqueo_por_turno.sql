-- Bloqueo por turno: cuando un turno se llena, el admin frena las reservas
-- nuevas de ese turno sin tocar las ya hechas. turno null = todo el día.
-- Spec: docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md

-- Las franjas de reserva son 12 a 13 y 20 a 21: antes de las 17, mediodía.
create function public.turno_de(p_hora time)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_hora < time '17:00' then 'mediodia' else 'noche' end;
$$;

alter table public.dias_bloqueados
  add column turno text check (turno in ('mediodia', 'noche'));

alter table public.dias_bloqueados drop constraint dias_bloqueados_fecha_local_id_key;
alter table public.dias_bloqueados
  add constraint dias_bloqueados_fecha_local_turno_key unique nulls not distinct (fecha, local_id, turno);

create or replace function public.validar_reserva()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
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
      where fecha = new.fecha and (local_id is null or local_id = new.local_id) and turno is null
    ) then
      raise exception 'Ese día no tomamos reservas en ese local.';
    end if;

    if exists (
      select 1 from public.dias_bloqueados
      where fecha = new.fecha and (local_id is null or local_id = new.local_id)
        and turno = public.turno_de(new.hora)
    ) then
      raise exception 'Ese turno ya está completo.';
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
