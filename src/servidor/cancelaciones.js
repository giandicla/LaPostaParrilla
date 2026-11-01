// Cancelar una reserva (cliente o admin). La cancelación la hace la base con
// la sesión del que llama, así siguen valiendo sus reglas (1 hora, permisos,
// motivo del admin). La seña no se reembolsa por Mercado Pago (no se puede en
// modo de prueba): si cancela el cliente queda cobrada; si cancela el local, el
// trigger marcar_reintegro la deja "a devolver" y el local la devuelve a mano.

import { ErrorHttp } from './respuestas.js';

const ACTIVAS = ['esperando_pago', 'pendiente', 'confirmada'];

const SENA = { aprobado: 'retenida', reintegro_pendiente: 'a_devolver' };

export async function cancelarReserva({ reservaId, motivo }, { usuario, base }) {
  const reserva = await usuario.leerReserva(reservaId);
  if (!reserva) throw new ErrorHttp(404, 'No encontramos esa reserva.');
  if (!ACTIVAS.includes(reserva.estado)) throw new ErrorHttp(409, 'Esa reserva ya no está activa.');

  await usuario.cancelar(reservaId, motivo);
  return { sena: SENA[await base.estadoDeLaSena(reservaId)] ?? 'no_corresponde' };
}
