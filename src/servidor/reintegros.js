// Reembolso total de una seña en Mercado Pago (PaymentRefund). La clave de
// idempotencia es el id del pago de Mercado Pago: si se reintenta, no devuelve
// dos veces, y un cobro duplicado de la misma preferencia tiene su propia clave.
// El reembolso no se da por hecho al pedirlo: el pago queda reintegro_pendiente
// hasta que llega el webhook con el pago reembolsado (ver avisos.js).
export const claveDeReintegro = (idPagoMp) => `reintegro-${idPagoMp}`;

export async function pedirReintegro(idPagoMp, { mp }) {
  await mp.reintegrar(String(idPagoMp), claveDeReintegro(idPagoMp));
}
