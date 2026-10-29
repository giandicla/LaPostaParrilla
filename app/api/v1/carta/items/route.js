// POST /api/v1/carta/items — { seccionId, nombre, precio | precios, … } → 201 ítem
// Solo el admin. El ítem va al final de su sección.
import { json, manejar } from '../../../../../src/servidor/respuestas.js';
import { esquemaItemNuevo, leerCuerpo } from '../../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../../src/servidor/supabase.js';
import { crearBaseCarta } from '../../../../../src/servidor/carta-base.js';
import { crearItem } from '../../../../../src/servidor/carta.js';

export const POST = manejar(async (pedido) => {
  const usuario = await usuarioDelPedido(pedido);
  const datos = await leerCuerpo(pedido, esquemaItemNuevo);
  return json(await crearItem(datos, { base: crearBaseCarta(usuario.cliente) }), 201);
});
