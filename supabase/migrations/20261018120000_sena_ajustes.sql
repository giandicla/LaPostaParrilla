-- Ajustes de la revisión final de la seña.
-- Spec: docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md

-- =====================================================================
-- 1. creada_en lo fija la base al insertar: si el cliente pudiera elegirla,
--    correría el plazo de 15 minutos para pagar.
-- =====================================================================
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

-- =====================================================================
-- 2. acreditar_pago: un segundo pago aprobado (otro id de Mercado Pago) sobre
--    una preferencia ya resuelta devuelve 'duplicado' sin tocar la fila; el
--    servidor reintegra ese pago por su id.
-- =====================================================================
create or replace function public.acreditar_pago(p_pago_id uuid, p_mp_payment_id text, p_estado_mp text)
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

  -- Ya resuelto: un aviso repetido no cambia nada. Si llega otro pago
  -- aprobado distinto sobre la misma preferencia, es un cobro doble.
  if p.estado in ('aprobado', 'reintegro_pendiente', 'reintegrado') then
    if p_estado_mp = 'approved' and p_mp_payment_id is distinct from p.mp_payment_id then
      return 'duplicado';
    end if;
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
