// POST /api/v1/reservas/:id/cancelacion — { motivo? } → 200 { sena }
// La usan el cliente (Mis reservas) y el admin (panel, con motivo).
// sena: 'retenida' (canceló el cliente), 'a_devolver' (canceló el local) o
// 'no_corresponde' (no había seña cobrada).
import { ErrorHttp, json, manejar } from '../../../../../../src/servidor/respuestas.js';
import { esquemaCancelacion, esquemaId, leerCuerpo } from '../../../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../../../src/servidor/supabase.js';
import { crearBase } from '../../../../../../src/servidor/base.js';
import { cancelarReserva } from '../../../../../../src/servidor/cancelaciones.js';

export const POST = manejar(async (pedido, { params }) => {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) throw new ErrorHttp(400, 'Ese id de reserva no es válido.');
  const usuario = await usuarioDelPedido(pedido);
  const { motivo } = await leerCuerpo(pedido, esquemaCancelacion);
  const resultado = await cancelarReserva({ reservaId: id, motivo }, { usuario, base: crearBase() });
  return json(resultado);
});
