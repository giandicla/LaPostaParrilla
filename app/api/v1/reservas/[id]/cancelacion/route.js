// POST /api/v1/reservas/:id/cancelacion — { motivo? } → 200 { reintegro }
// La usan el cliente (Mis reservas) y el admin (panel, con motivo). También
// reintenta un reintegro pendiente de una reserva ya cancelada.
import { ErrorHttp, json, manejar } from '../../../../../../src/servidor/respuestas.js';
import { esquemaCancelacion, esquemaId, leerCuerpo } from '../../../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../../../src/servidor/supabase.js';
import { crearBase } from '../../../../../../src/servidor/base.js';
import { crearMercadoPago } from '../../../../../../src/servidor/mercadopago.js';
import { cancelarReserva } from '../../../../../../src/servidor/cancelaciones.js';

export const POST = manejar(async (pedido, { params }) => {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) throw new ErrorHttp(400, 'Ese id de reserva no es válido.');
  const usuario = await usuarioDelPedido(pedido);
  const { motivo } = await leerCuerpo(pedido, esquemaCancelacion);
  const resultado = await cancelarReserva({ reservaId: id, motivo }, { usuario, base: crearBase(), mp: crearMercadoPago() });
  return json(resultado);
});
