// GET /api/v1/carta?local=<id> → 200 { cubierto, secciones }
// Pública: la carta de un local (sin los vinos, que están en /api/v1/carta/vinos).
// Se cachea un minuto en Vercel: un cambio del admin tarda eso en verse en la
// web. El panel pide `&fresca=1` para leer sin caché lo que acaba de guardar.
import { ErrorHttp, json, manejar } from '../../../../src/servidor/respuestas.js';
import { esquemaLocal } from '../../../../src/servidor/esquemas.js';
import { clientePublico } from '../../../../src/servidor/supabase.js';
import { crearBaseCarta } from '../../../../src/servidor/carta-base.js';
import { leerCarta } from '../../../../src/servidor/carta.js';

const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };
const SIN_CACHE = { 'Cache-Control': 'no-store' };

export const GET = manejar(async (pedido) => {
  const parametros = new URL(pedido.url).searchParams;
  const idLocal = parametros.get('local');
  if (!idLocal) throw new ErrorHttp(400, 'Falta el local.');
  if (!esquemaLocal.safeParse(idLocal).success) throw new ErrorHttp(404, 'No encontramos ese local.');
  const carta = await leerCarta(idLocal, { base: crearBaseCarta(clientePublico()) });
  return json(carta, 200, parametros.has('fresca') ? SIN_CACHE : CACHE);
});
