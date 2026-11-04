// Aviso de pago de Mercado Pago, con la firma ya validada. El cuerpo del
// aviso no se usa: el estado real sale de GET /v1/payments/:id (clase 11).
// También llegan por acá los avisos de reembolso: el pago vuelve con status
// 'refunded' y recién ahí la seña queda devuelta.

import { pedirReintegro } from './reintegros.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Los errores del SDK traen el código HTTP en `status`
async function leerPagoMp(idPagoMp, mp) {
  try {
    return await mp.obtenerPago(idPagoMp);
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function procesarAvisoDePago(idPagoMp, { base, mp }) {
  const pagoMp = await leerPagoMp(idPagoMp, mp);
  // Un pago que no existe (p. ej. un aviso de otra cuenta) no se reintenta
  if (!pagoMp) return 'ignorado';
  const idPago = pagoMp.external_reference;

  // Pagos que no salieron de este sitio: se responde 200 igual, para que
  // Mercado Pago no los reintente durante horas
  if (!idPago || !UUID.test(idPago) || !(await base.leerPago(idPago))) return 'ignorado';

  // Confirmación del reembolso que pidió la app
  if (pagoMp.status === 'refunded') {
    await base.confirmarReintegro(idPago, String(pagoMp.id));
    return 'reintegrado';
  }

  const estado = await base.acreditarPago(idPago, String(pagoMp.id), pagoMp.status);

  // Otro cobro aprobado sobre la misma preferencia: no tiene fila propia, se
  // devuelve por su propio id
  if (estado === 'duplicado') {
    console.warn('Cobro duplicado de la seña, se reembolsa', idPago, pagoMp.id);
    await pedirReintegro(pagoMp.id, { mp });
    return 'duplicado_reintegro_pedido';
  }

  // Pago aprobado que llegó tarde (la reserva venció o se canceló): se devuelve.
  // Si Mercado Pago falla, el error da 500 y el aviso se reintenta.
  if (estado === 'reintegro_pendiente' && pagoMp.status === 'approved') {
    await pedirReintegro(pagoMp.id, { mp });
    return 'reintegro_pedido';
  }
  return estado;
}
