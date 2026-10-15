-- Seña de la reserva con Mercado Pago (parte de la base).
-- Spec: docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md
--
-- Una reserva de la web nace esperando el pago; el webhook la confirma. Ya no
-- pasa por "pendiente": el admin no acepta reservas, solo puede cancelarlas,
-- con motivo. pendiente y rechazada quedan en el enum por las reservas viejas.

-- =====================================================================
-- Reserva esperando el pago
-- =====================================================================
alter table public.reservas alter column estado set default 'esperando_pago';

alter table public.reservas
  add column motivo_cancelacion text
    check (motivo_cancelacion is null or char_length(motivo_cancelacion) <= 120),
  -- Las reservas del local no pagan seña
  add constraint reservas_sena_solo_web
    check (origen = 'web' or estado <> 'esperando_pago');

-- Esperando el pago también ocupa el lugar del día
drop index public.reservas_una_activa_por_dia;
create unique index reservas_una_activa_por_dia
  on public.reservas (usuario_id, local_id, fecha)
  where estado in ('esperando_pago', 'pendiente', 'confirmada');

drop policy "reservas: crear a nombre propio y pendiente" on public.reservas;
create policy "reservas: crear a nombre propio esperando el pago" on public.reservas
  for insert to authenticated
  with check (
    (usuario_id = auth.uid() and origen = 'web' and estado = 'esperando_pago'
      and cancelada_por is null and motivo_cancelacion is null)
    or public.es_admin()
  );

-- =====================================================================
-- Cancelar: el cliente y el admin pasan por acá. El admin explica el motivo
-- (le llega al cliente). Una reserva sin pagar se cancela cuando sea.
-- =====================================================================
drop function public.cancelar_reserva(uuid);

create function public.cancelar_reserva(p_id uuid, p_motivo text default null)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reservas;
  admin boolean := public.es_admin();
begin
  select * into r from public.reservas where id = p_id;

  if not found or (r.usuario_id is distinct from auth.uid() and not admin) then
    raise exception 'No encontramos esa reserva.';
  end if;

  if r.estado not in ('esperando_pago', 'pendiente', 'confirmada') then
    raise exception 'Esa reserva ya no está activa.';
  end if;

  if not admin and r.estado <> 'esperando_pago'
     and public.inicio_reserva(r.fecha, r.hora) - now() < interval '1 hour' then
    raise exception 'Falta menos de 1 hora para tu reserva: para cancelarla escribinos por WhatsApp.';
  end if;

  update public.reservas
    set estado = 'cancelada', motivo_cancelacion = nullif(trim(p_motivo), '')
    where id = p_id
    returning * into r;
  return r;
end;
$$;

revoke execute on function public.cancelar_reserva(uuid, text) from anon, public;
grant execute on function public.cancelar_reserva(uuid, text) to authenticated;

-- El motivo del admin se exige en un trigger y no en la función: el admin
-- también puede cancelar con un update directo (política "el admin edita").
create function public.validar_cancelacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado = 'cancelada' and old.estado <> 'cancelada' and public.es_admin()
     and nullif(trim(new.motivo_cancelacion), '') is null then
    raise exception 'Escribí el motivo de la cancelación: se lo mandamos al cliente.';
  end if;
  return new;
end;
$$;

create trigger validar_cancelacion
  before update of estado on public.reservas
  for each row execute function public.validar_cancelacion();
