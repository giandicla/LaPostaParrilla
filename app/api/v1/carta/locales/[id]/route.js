// PATCH /api/v1/carta/locales/:id — { cubierto } → 200 { cubierto }
// Solo el admin.
import { ErrorHttp, json, manejar } from '../../../../../../src/servidor/respuestas.js';
import { esquemaCubierto, esquemaLocal, leerCuerpo } from '../../../../../../src/servidor/esquemas.js';
import { usuarioDelPedido } from '../../../../../../src/servidor/supabase.js';
import { crearBaseCarta } from '../../../../../../src/servidor/carta-base.js';
import { cambiarCubierto } from '../../../../../../src/servidor/carta.js';

export const PATCH = manejar(async (pedido, { params }) => {
  const { id } = await params;
  if (!esquemaLocal.safeParse(id).success) throw new ErrorHttp(404, 'No encontramos ese local.');
  const usuario = await usuarioDelPedido(pedido);
  const { cubierto } = await leerCuerpo(pedido, esquemaCubierto);
  return json(await cambiarCubierto(id, cubierto, { base: crearBaseCarta(usuario.cliente) }));
});
