// PATCH /api/v1/carta/secciones/:id/bodegas — { bodega, region?, mover? } → 200 { ok }
// Solo el admin. Cambia la región de todos los vinos de la bodega en esa
// sección, o sube/baja la bodega entera.
import { ErrorHttp, json, manejar } from '../../../../../../../src/servidor/respuestas.js';
import { esquemaBodega, esquemaId, leerCuerpo } from '../../../../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../../../../src/servidor/supabase.js';
import { crearBaseCarta } from '../../../../../../../src/servidor/carta-base.js';
import { editarBodega } from '../../../../../../../src/servidor/carta.js';

export const PATCH = manejar(async (pedido, { params }) => {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) throw new ErrorHttp(400, 'Ese id de sección no es válido.');
  const usuario = await usuarioDelPedido(pedido);
  const datos = await leerCuerpo(pedido, esquemaBodega);
  await editarBodega(id, datos, { base: crearBaseCarta(usuario.cliente) });
  return json({ ok: true });
});
