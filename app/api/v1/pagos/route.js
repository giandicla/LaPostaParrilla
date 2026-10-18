// POST /api/v1/pagos — { reservaId } → 201 { initPoint }
// Crea la preferencia de Checkout Pro para la seña de una reserva propia.
import { json, manejar } from '../../../../src/servidor/respuestas.js';
import { esquemaPago, leerCuerpo } from '../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../src/servidor/supabase.js';
import { crearBase } from '../../../../src/servidor/base.js';
import { crearMercadoPago } from '../../../../src/servidor/mercadopago.js';
import { iniciarPagoDeSena } from '../../../../src/servidor/pagos.js';

export const POST = manejar(async (pedido) => {
  const usuario = await usuarioDelPedido(pedido);
  const { reservaId } = await leerCuerpo(pedido, esquemaPago);
  const resultado = await iniciarPagoDeSena(
    { reservaId, usuarioId: usuario.id },
    { base: crearBase(), mp: crearMercadoPago(), appUrl: process.env.APP_URL }
  );
  return json(resultado, 201);
});
