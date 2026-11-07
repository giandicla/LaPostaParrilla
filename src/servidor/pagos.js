// Inicio del pago de la seña: valida la reserva, crea el pago y la
// preferencia. Recibe la base y Mercado Pago por parámetro (ver base.js y
// mercadopago.js), así se testea sin red.

import { ErrorHttp } from './respuestas.js';
import { armarPreferencia, venceLaReserva } from './preferencia.js';

export const MAX_PAGOS_POR_RESERVA = 5;

export async function iniciarPagoDeSena({ reservaId, usuarioId }, { base, mp, appUrl, ahora = new Date() }) {
  const reserva = await base.leerReserva(reservaId);
  if (!reserva || reserva.usuario_id !== usuarioId) {
    throw new ErrorHttp(404, 'No encontramos esa reserva.');
  }
  if (reserva.estado !== 'esperando_pago') {
    throw new ErrorHttp(409, 'Esa reserva ya no está esperando el pago.');
  }
  if (venceLaReserva(reserva.creada_en) <= ahora) {
    throw new ErrorHttp(409, 'Se venció el plazo para pagar la seña. Hacé la reserva de nuevo.');
  }

  // Cada intento crea una fila y una preferencia de Mercado Pago: con 5 alcanza
  // de sobra (la base tiene el mismo tope, por las dudas)
  if ((await base.contarPagos(reservaId)) >= MAX_PAGOS_POR_RESERVA) {
    throw new ErrorHttp(429, 'Hubo demasiados intentos de pago para esta reserva. Hacé la reserva de nuevo.');
  }

  // El monto sale de la base, nunca del navegador
  const pago = await base.crearPago({ reservaId, monto: reserva.locales.sena });
  const preferencia = await mp.crearPreferencia(
    armarPreferencia({ pago, reserva, nombreLocal: reserva.locales.nombre, appUrl })
  );
  await base.guardarPreferencia(pago.id, preferencia.id);
  return { initPoint: preferencia.init_point };
}
