// POST /api/webhooks/mercadopago — avisos de Mercado Pago (clase 11):
// 1. valida la firma, 2. consulta el pago real, 3. concilia en la base.
// Responde 200 si se procesó (o no era un pago) y 401 si la firma no vale.
// Un 500 hace que Mercado Pago reintente más tarde.
import { json, manejar } from '../../../../src/servidor/respuestas.js';
import { validarFirma } from '../../../../src/servidor/firma.js';
import { crearBase } from '../../../../src/servidor/base.js';
import { crearMercadoPago } from '../../../../src/servidor/mercadopago.js';
import { procesarAvisoDePago } from '../../../../src/servidor/avisos.js';

export const POST = manejar(async (pedido) => {
  const parametros = new URL(pedido.url).searchParams;
  const idDato = parametros.get('data.id');
  const tipo = parametros.get('type') ?? parametros.get('topic');

  const firmaValida = validarFirma({
    firma: pedido.headers.get('x-signature'),
    idPedido: pedido.headers.get('x-request-id'),
    idDato,
    secreto: process.env.MP_WEBHOOK_SECRET,
  });
  if (!firmaValida) return json({ error: 'Firma inválida' }, 401);

  if (tipo !== 'payment') return json({ ok: true, estado: 'ignorado' });

  const estado = await procesarAvisoDePago(idDato, { base: crearBase(), mp: crearMercadoPago() });
  return json({ ok: true, estado });
});
