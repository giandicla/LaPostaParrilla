// Reembolso total de una seña en Mercado Pago. La clave de idempotencia es el
// id del pago: si se reintenta, Mercado Pago no devuelve dos veces.
export async function reintegrarPago(pago, { base, mp }) {
  await mp.reintegrar(pago.mp_payment_id, `reintegro-${pago.id}`);
  await base.marcarReintegrado(pago.id);
}
