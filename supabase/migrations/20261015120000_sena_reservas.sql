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

-- =====================================================================
-- Monto de la seña: fijo por reserva, por local. Se cambia acá, no en el código.
-- =====================================================================
alter table public.locales
  add column sena numeric(12,2) not null default 10000 check (sena > 0);

-- =====================================================================
-- Pagos: uno por intento de pago (preferencia). El id va a Mercado Pago como
-- external_reference y vuelve en el webhook: es el puente con la reserva.
-- Solo los escribe el servidor (clave secreta, que se saltea la RLS).
-- =====================================================================
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas (id) on delete cascade,
  monto numeric(12,2) not null check (monto > 0),
  estado text not null default 'iniciado'
    check (estado in ('iniciado', 'aprobado', 'rechazado', 'reintegro_pendiente', 'reintegrado')),
  mp_preference_id text,
  mp_payment_id text unique,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index pagos_por_reserva on public.pagos (reserva_id);

-- Nunca dos señas aprobadas para la misma reserva: la segunda que se cobra
-- queda reintegro_pendiente (ver acreditar_pago)
create unique index pagos_uno_aprobado_por_reserva on public.pagos (reserva_id)
  where estado = 'aprobado';

alter table public.pagos enable row level security;

create policy "pagos: ver los de mis reservas o ser admin" on public.pagos
  for select to authenticated
  using (
    public.es_admin()
    or exists (select 1 from public.reservas r where r.id = reserva_id and r.usuario_id = auth.uid())
  );

revoke insert, update, delete on public.pagos from anon, authenticated;

-- =====================================================================
-- Acreditar un pago: la llama el webhook con el estado real que devolvió
-- GET /v1/payments/:id. Idempotente: Mercado Pago repite los avisos.
-- Devuelve el estado final del pago; si es reintegro_pendiente, el servidor
-- hace el reembolso.
-- =====================================================================
create function public.acreditar_pago(p_pago_id uuid, p_mp_payment_id text, p_estado_mp text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.pagos;
  r public.reservas;
begin
  select * into p from public.pagos where id = p_pago_id for update;
  if not found then
    raise exception 'No existe el pago %', p_pago_id;
  end if;

  -- Ya resuelto: un aviso repetido no cambia nada
  if p.estado in ('aprobado', 'reintegro_pendiente', 'reintegrado') then
    return p.estado;
  end if;

  select * into r from public.reservas where id = p.reserva_id for update;

  if p_estado_mp = 'approved' then
    if r.estado = 'esperando_pago' then
      update public.pagos
        set estado = 'aprobado', mp_payment_id = p_mp_payment_id, actualizado_en = now()
        where id = p.id;
      update public.reservas set estado = 'confirmada' where id = r.id;
      return 'aprobado';
    end if;
    -- La reserva venció, se canceló o ya tenía otra seña: se devuelve
    update public.pagos
      set estado = 'reintegro_pendiente', mp_payment_id = p_mp_payment_id, actualizado_en = now()
      where id = p.id;
    return 'reintegro_pendiente';
  end if;

  if p_estado_mp in ('rejected', 'cancelled') then
    update public.pagos
      set estado = 'rechazado', mp_payment_id = p_mp_payment_id, actualizado_en = now()
      where id = p.id;
    return 'rechazado';
  end if;

  return p.estado;  -- pending, in_process: todavía no hay nada que hacer
end;
$$;

revoke execute on function public.acreditar_pago(uuid, text, text) from public, anon, authenticated;
grant execute on function public.acreditar_pago(uuid, text, text) to service_role;

-- =====================================================================
-- Cancelar una reserva pagada deja la seña para reintegrar, la cancele quien
-- la cancele. El reembolso lo hace el servidor; si falla, el panel lo muestra.
-- =====================================================================
create function public.marcar_reintegro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.pagos
    set estado = 'reintegro_pendiente', actualizado_en = now()
    where reserva_id = new.id and estado = 'aprobado';
  return new;
end;
$$;

create trigger marcar_reintegro
  after update of estado on public.reservas
  for each row
  when (new.estado = 'cancelada' and old.estado <> 'cancelada')
  execute function public.marcar_reintegro();

-- =====================================================================
-- Vencimiento: 15 minutos para pagar. pg_cron lo corre cada minuto.
-- =====================================================================
create function public.vencer_reservas_sin_pagar()
returns integer
language sql
security definer
set search_path = ''
as $$
  with vencidas as (
    update public.reservas set estado = 'vencida'
    where estado = 'esperando_pago' and creada_en < now() - interval '15 minutes'
    returning 1
  )
  select count(*)::int from vencidas;
$$;

revoke execute on function public.vencer_reservas_sin_pagar() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('vencer-reservas-sin-pagar', '* * * * *', 'select public.vencer_reservas_sin_pagar()');
