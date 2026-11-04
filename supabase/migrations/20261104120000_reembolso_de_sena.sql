-- La seña vuelve a reembolsarse por Mercado Pago (decisión del usuario,
-- 2026-11-04). Con las credenciales de prueba de la aplicación (TEST-) la API
-- de reembolsos funciona; con las del vendedor de prueba respondía 401
-- (hallazgos.md 1.18) y por eso la migración 20261101120000 la había sacado.
-- Ahora toda cancelación de una reserva con la seña cobrada (la haga el cliente
-- hasta 1 hora antes o el local) la deja reintegro_pendiente; el servidor pide
-- el reembolso y el webhook la pasa a reintegrado cuando Mercado Pago lo confirma.

-- =====================================================================
-- 1. Cualquier cancelación deja la seña para devolver.
-- =====================================================================
drop trigger marcar_reintegro on public.reservas;

create trigger marcar_reintegro
  after update of estado on public.reservas
  for each row
  when (new.estado = 'cancelada' and old.estado <> 'cancelada')
  execute function public.marcar_reintegro();

-- =====================================================================
-- 2. Ya no se marca a mano: la confirmación la trae el webhook.
-- =====================================================================
drop function public.marcar_sena_devuelta(uuid);
