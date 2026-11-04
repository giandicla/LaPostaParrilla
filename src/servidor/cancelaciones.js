// Cancelar una reserva (cliente o admin) y pedir el reembolso de la seña. La
// cancelación la hace la base con la sesión del que llama, así siguen valiendo
// sus reglas (1 hora, permisos, motivo del admin). El trigger marcar_reintegro
// deja la seña cobrada en reintegro_pendiente; acá se le pide el reembolso a
// Mercado Pago, y el webhook la marca devuelta cuando se confirma.

import { ErrorHttp } from './respuestas.js';
import { pedirReintegro } from './reintegros.js';

const ACTIVAS = ['esperando_pago', 'pendiente', 'confirmada'];

// reintegro: 'pedido' (en curso, se confirma por webhook), 'fallo' (queda
// para reintentar desde el panel) o 'no_corresponde' (no había seña cobrada)
export async function cancelarReserva({ reservaId, motivo }, { usuario, base, mp }) {
  const reserva = await usuario.leerReserva(reservaId);
  if (!reserva) throw new ErrorHttp(404, 'No encontramos esa reserva.');

  // Ya cancelada: solo se reintenta el reembolso (botón del panel)
  if (ACTIVAS.includes(reserva.estado)) await usuario.cancelar(reservaId, motivo);

  const pagos = await base.pagosAReintegrar(reservaId);
  if (pagos.length === 0) {
    if (!ACTIVAS.includes(reserva.estado)) throw new ErrorHttp(409, 'Esa reserva ya no está activa.');
    return { reintegro: 'no_corresponde' };
  }

  // Cada pago por separado: que falle uno no deja sin pedir los demás
  let fallo = false;
  for (const pago of pagos) {
    try {
      await pedirReintegro(pago.mp_payment_id, { mp });
    } catch (error) {
      // La cancelación ya quedó hecha; el panel muestra la devolución pendiente
      console.error('Falló el pedido de reembolso de la seña', pago.id, error);
      fallo = true;
    }
  }
  return { reintegro: fallo ? 'fallo' : 'pedido' };
}
