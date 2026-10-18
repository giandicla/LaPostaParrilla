// Aviso de pago de Mercado Pago, con la firma ya validada. El cuerpo del
// aviso no se usa: el estado real sale de GET /v1/payments/:id (clase 11).

import { reintegrarPago } from './reintegros.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function procesarAvisoDePago(idPagoMp, { base, mp }) {
  const pagoMp = await mp.obtenerPago(idPagoMp);
  const idPago = pagoMp.external_reference;

  // Pagos que no salieron de este sitio: se responde 200 igual, para que
  // Mercado Pago no los reintente durante horas
  if (!idPago || !UUID.test(idPago) || !(await base.leerPago(idPago))) return 'ignorado';

  const estado = await base.acreditarPago(idPago, String(pagoMp.id), pagoMp.status);
  if (estado !== 'reintegro_pendiente') return estado;

  await reintegrarPago({ id: idPago, mp_payment_id: String(pagoMp.id) }, { base, mp });
  return 'reintegrado';
}
