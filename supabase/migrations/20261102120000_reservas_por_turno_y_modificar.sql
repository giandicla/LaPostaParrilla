-- Pedidos del usuario (2026-11-01):
-- 1. Un cliente puede reservar almuerzo y cena el mismo día: una reserva activa
--    por turno, no por día.
-- 2. El cliente puede modificar su reserva (fecha, hora y personas, mismo local)
--    hasta 1 hora antes. La seña pagada sigue valiendo.

-- =====================================================================
-- 1. Una reserva activa por usuario, local, día y turno
-- =====================================================================
drop index public.reservas_una_activa_por_dia;
create unique index reservas_una_activa_por_turno
  on public.reservas (usuario_id, local_id, fecha, public.turno_de(hora))
  where estado in ('esperando_pago', 'pendiente', 'confirmada');

-- =====================================================================
-- 2. Quién cambió la fecha o la hora por última vez: el mail de aviso es
--    distinto si la movió el local o el cliente.
-- =====================================================================
alter table public.reservas
  add column modificada_por text check (modificada_por in ('cliente', 'admin'));

create function public.registrar_modificacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.fecha is distinct from old.fecha or new.hora is distinct from old.hora then
    new.modificada_por := case when public.es_admin() then 'admin' else 'cliente' end;
  end if;
  return new;
end;
$$;

create trigger registrar_modificacion
  before update of fecha, hora on public.reservas
  for each row execute function public.registrar_modificacion();

-- =====================================================================
-- 3. Modificar: el cliente no puede editar reservas (solo el admin, por RLS),
--    así que pasa por acá. Las reglas del lugar nuevo (franjas, fecha pasada,
--    días bloqueados, una por turno) las sigue poniendo validar_reserva().
-- =====================================================================
create function public.modificar_reserva(p_id uuid, p_fecha date, p_hora time, p_personas smallint)
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

  update public.reservas
    set fecha = p_fecha, hora = p_hora, personas = p_personas
    where id = p_id
    returning * into r;
  return r;
end;
$$;

revoke execute on function public.modificar_reserva(uuid, date, time, smallint) from anon, public;
grant execute on function public.modificar_reserva(uuid, date, time, smallint) to authenticated;
