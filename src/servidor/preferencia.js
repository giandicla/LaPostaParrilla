// Cuerpo de la preferencia de Checkout Pro para la seña (clase 11: items,
// back_urls, external_reference). Función pura: no habla con Mercado Pago.

export const MINUTOS_PARA_PAGAR = 15;

export const venceLaReserva = (creadaEn) =>
  new Date(new Date(creadaEn).getTime() + MINUTOS_PARA_PAGAR * 60 * 1000);

// Mercado Pago rechaza auto_return y notification_url con URLs locales
export function esUrlPublica(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
  } catch {
    return false;
  }
}

// "2026-10-18" + "20:30:00" → "18/10 20:30"
const cuando = (fecha, hora) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)} ${hora.slice(0, 5)}`;

export function armarPreferencia({ pago, reserva, nombreLocal, appUrl }) {
  const vuelta = `${appUrl}/reservas/pago?reserva=${reserva.id}`;
  const publica = esUrlPublica(appUrl);
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
    ...(publica ? { auto_return: 'approved', notification_url: `${appUrl}/api/webhooks/mercadopago` } : {}),
    expires: true,
    expiration_date_to: venceLaReserva(reserva.creada_en).toISOString(),
    statement_descriptor: 'LA POSTA',
  };
}
