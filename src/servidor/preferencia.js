// Cuerpo de la preferencia de Checkout Pro para la seña (clase 11: items,
// back_urls, external_reference). Función pura: no habla con Mercado Pago.

export const MINUTOS_PARA_PAGAR = 15;

export const venceLaReserva = (creadaEn) =>
  new Date(new Date(creadaEn).getTime() + MINUTOS_PARA_PAGAR * 60 * 1000);

// Direcciones que Mercado Pago no alcanza: la propia máquina (también en IPv6,
// que URL devuelve entre corchetes), la red local y los nombres .local
const LOCAL = [
  /^localhost$/, /\.localhost$/, /\.local$/, /^0\.0\.0\.0$/,
  /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./,
  /^\[::1?\]$/, /^\[f[cd][0-9a-f]{2}:/i, /^\[fe80:/i,
];

// Mercado Pago rechaza auto_return y notification_url con URLs locales
export function esUrlPublica(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && !LOCAL.some((patron) => patron.test(hostname));
  } catch {
    return false;
  }
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "2026-10-18" + "20:30:00" → "18 de octubre 20:30". Sin barra: Mercado Pago la
// saca del concepto y "20/11" se leía "2011".
const cuando = (fecha, hora) =>
  `${Number(fecha.slice(8, 10))} de ${MESES[Number(fecha.slice(5, 7)) - 1]} ${hora.slice(0, 5)}`;

export function armarPreferencia({ pago, reserva, nombreLocal, appUrl }) {
  const base = String(appUrl ?? '').replace(/\/+$/, '');
  const vuelta = `${base}/reservas/pago?reserva=${reserva.id}`;
  const publica = esUrlPublica(base);
  return {
    items: [{
      id: `sena-${reserva.id}`,
      title: `Seña reserva ${nombreLocal} · ${cuando(reserva.fecha, reserva.hora)}`,
      quantity: 1,
      unit_price: Number(pago.monto),
      currency_id: 'ARS',
    }],
    external_reference: pago.id,
    back_urls: { success: vuelta, pending: vuelta, failure: vuelta },
    ...(publica ? { auto_return: 'approved', notification_url: `${base}/api/webhooks/mercadopago?source_news=webhooks` } : {}),
    // La reserva espera 15 minutos: sin efectivo ni cajero (el cupón tarda días)
    // y sin pagos pendientes, que no confirman en el momento
    binary_mode: true,
    payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }] },
    expires: true,
    expiration_date_to: venceLaReserva(reserva.creada_en).toISOString(),
    statement_descriptor: 'LA POSTA',
  };
}
