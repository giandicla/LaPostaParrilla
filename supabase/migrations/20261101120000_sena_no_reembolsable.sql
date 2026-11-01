-- La seña no se devuelve cuando cancela el cliente (decisión del usuario,
-- 2026-11-01). Mercado Pago no deja reembolsar en modo de prueba, así que la
-- app ya no le pide reembolsos: cuando corresponde devolver (cancela el local,
-- o el pago llegó tarde) la seña queda "a devolver" (reintegro_pendiente), el
-- local la devuelve a mano desde Mercado Pago y la marca desde el panel.

-- =====================================================================
-- 1. Solo la cancelación del local deja la seña para devolver. cancelada_por
--    lo completa el trigger before de reservas, así que acá ya está.
-- =====================================================================
drop trigger marcar_reintegro on public.reservas;

create trigger marcar_reintegro
  after update of estado on public.reservas
  for each row
  when (new.estado = 'cancelada' and old.estado <> 'cancelada' and new.cancelada_por = 'admin')
  execute function public.marcar_reintegro();

-- =====================================================================
-- 2. El admin marca una seña como devuelta después de devolverla a mano.
-- =====================================================================
create function public.marcar_sena_devuelta(p_pago_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el admin puede marcar una seña como devuelta.' using errcode = '42501';
  end if;

  update public.pagos
    set estado = 'reintegrado', actualizado_en = now()
    where id = p_pago_id and estado = 'reintegro_pendiente';
  if not found then
    raise exception 'Esa seña no está para devolver.';
  end if;
end;
$$;

revoke execute on function public.marcar_sena_devuelta(uuid) from public, anon;
grant execute on function public.marcar_sena_devuelta(uuid) to authenticated;
