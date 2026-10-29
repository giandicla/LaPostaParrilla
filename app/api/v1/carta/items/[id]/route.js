// PATCH  /api/v1/carta/items/:id — { campos…, mover? } → 200 ítem
// DELETE /api/v1/carta/items/:id → 204
// Solo el admin. `mover` ('arriba' | 'abajo') lo cambia de lugar en su sección.
import { ErrorHttp, json, manejar } from '../../../../../../src/servidor/respuestas.js';
import { esquemaId, esquemaItemCambios, leerCuerpo } from '../../../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../../../src/servidor/supabase.js';
import { crearBaseCarta } from '../../../../../../src/servidor/carta-base.js';
import { borrarItem, editarItem } from '../../../../../../src/servidor/carta.js';

async function idDelItem(params) {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) throw new ErrorHttp(400, 'Ese id de ítem no es válido.');
  return id;
}

export const PATCH = manejar(async (pedido, { params }) => {
  const id = await idDelItem(params);
  const usuario = await usuarioDelPedido(pedido);
  const cambios = await leerCuerpo(pedido, esquemaItemCambios);
  return json(await editarItem(id, cambios, { base: crearBaseCarta(usuario.cliente) }));
});

export const DELETE = manejar(async (pedido, { params }) => {
  const id = await idDelItem(params);
  const usuario = await usuarioDelPedido(pedido);
  await borrarItem(id, { base: crearBaseCarta(usuario.cliente) });
  return new Response(null, { status: 204 });
});
