// Cancelar una reserva (cliente o admin) y reintegrar la seña. La cancelación
// la hace la base con la sesión del que llama, así siguen valiendo sus reglas
// (1 hora, permisos, motivo del admin). El trigger marcar_reintegro deja el
// pago para reintegrar; acá se hace el reembolso.

import { ErrorHttp } from './respuestas.js';
import { reintegrarPago } from './reintegros.js';

const ACTIVAS = ['esperando_pago', 'pendiente', 'confirmada'];

export async function cancelarReserva({ reservaId, motivo }, { usuario, base, mp }) {
  const reserva = await usuario.leerReserva(reservaId);
  if (!reserva) throw new ErrorHttp(404, 'No encontramos esa reserva.');

  // Ya cancelada: solo se reintenta el reintegro (botón del panel)
  if (ACTIVAS.includes(reserva.estado)) await usuario.cancelar(reservaId, motivo);

  const pago = await base.pagoAReintegrar(reservaId);
  if (!pago) return { reintegro: 'no_corresponde' };

  try {
    await reintegrarPago(pago, { base, mp });
    return { reintegro: 'hecho' };
  } catch (error) {
    // La cancelación ya quedó hecha; el panel muestra el reintegro pendiente
    console.error('Falló el reintegro de la seña', pago.id, error);
    return { reintegro: 'pendiente' };
  }
}
