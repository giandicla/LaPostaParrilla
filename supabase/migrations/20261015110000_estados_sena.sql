-- Estados nuevos de la reserva para la seña. Van en una migración propia
-- porque Postgres no deja usar un valor nuevo de enum en la misma transacción
-- en que se agrega. Spec: docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md
alter type public.estado_reserva add value if not exists 'esperando_pago' before 'pendiente';
alter type public.estado_reserva add value if not exists 'vencida';
