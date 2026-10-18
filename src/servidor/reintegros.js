// Reembolso total de una seña en Mercado Pago. La clave de idempotencia es el
// id del pago de Mercado Pago: si se reintenta, no devuelve dos veces, y un
// cobro duplicado de la misma preferencia tiene su propia clave.
export const claveDeReintegro = (idPagoMp) => `reintegro-${idPagoMp}`;

export async function reintegrarEnMp(idPagoMp, { mp }) {
  await mp.reintegrar(String(idPagoMp), claveDeReintegro(idPagoMp));
}

export async function reintegrarPago(pago, { base, mp }) {
  await reintegrarEnMp(pago.mp_payment_id, { mp });
  await base.marcarReintegrado(pago.id);
}
