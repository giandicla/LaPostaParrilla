// Cancelar una reserva (cliente o admin) y reintegrar la seña. La cancelación
// la hace la base con la sesión del que llama, así siguen valiendo sus reglas
// (1 hora, permisos, motivo del admin). El trigger marcar_reintegro deja el
// pago para reintegrar; acá se hace el reembolso de cada uno (puede haber más
// de uno si hubo un cobro doble).

import { ErrorHttp } from './respuestas.js';
import { reintegrarPago } from './reintegros.js';

const ACTIVAS = ['esperando_pago', 'pendiente', 'confirmada'];

export async function cancelarReserva({ reservaId, motivo }, { usuario, base, mp }) {
  const reserva = await usuario.leerReserva(reservaId);
  if (!reserva) throw new ErrorHttp(404, 'No encontramos esa reserva.');

  // Ya cancelada: solo se reintenta el reintegro (botón del panel)
  if (ACTIVAS.includes(reserva.estado)) await usuario.cancelar(reservaId, motivo);

  const pagos = await base.pagosAReintegrar(reservaId);
  if (pagos.length === 0) return { reintegro: 'no_corresponde' };

  // Cada pago por separado: que falle uno no deja sin reintegrar a los demás
  let pendiente = false;
  for (const pago of pagos) {
    try {
      await reintegrarPago(pago, { base, mp });
    } catch (error) {
      // La cancelación ya quedó hecha; el panel muestra el reintegro pendiente
      console.error('Falló el reintegro de la seña', pago.id, error);
      pendiente = true;
    }
  }
  return { reintegro: pendiente ? 'pendiente' : 'hecho' };
}
