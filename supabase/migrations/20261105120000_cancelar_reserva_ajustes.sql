-- Dos menores de la revisión de la seña (docs/PENDIENTES.md):
--
-- 1. cancelar_reserva leía la reserva sin bloquearla. Un webhook (acreditar_pago)
--    o el vencimiento de pg_cron podían cambiarla entre el chequeo y el update.
--    Ahora la lee con `for update`, igual que acreditar_pago: el que llega
--    segundo espera y ve el estado nuevo.
-- 2. Un motivo de más de 120 caracteres daba el error crudo del check (23514).
--    Ahora la función lo rechaza antes, con un mensaje en castellano. El sitio ya
--    lo limita a 120 (formulario y API); esto cubre a quien llame a la función
--    directo.
--
-- Misma firma que antes: `create or replace` conserva los permisos.

create or replace function public.cancelar_reserva(p_id uuid, p_motivo text default null)
returns public.reservas
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reservas;
  admin boolean := public.es_admin();
begin
  select * into r from public.reservas where id = p_id for update;

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

  if char_length(trim(p_motivo)) > 120 then
    raise exception 'El motivo puede tener hasta 120 caracteres.';
  end if;

  update public.reservas
    set estado = 'cancelada', motivo_cancelacion = nullif(trim(p_motivo), '')
    where id = p_id
    returning * into r;
  return r;
end;
$$;
