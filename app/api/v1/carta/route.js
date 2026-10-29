// GET /api/v1/carta?local=<id> → 200 { cubierto, secciones }
// Pública: la carta de un local, con sus secciones y las compartidas (vinos).
// Se cachea un minuto en Vercel: un cambio del admin tarda eso en verse.
import { ErrorHttp, json, manejar } from '../../../../src/servidor/respuestas.js';
import { esquemaLocal } from '../../../../src/servidor/esquemas.js';
import { clientePublico } from '../../../../src/servidor/supabase.js';
import { crearBaseCarta } from '../../../../src/servidor/carta-base.js';
import { leerCarta } from '../../../../src/servidor/carta.js';

const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };

export const GET = manejar(async (pedido) => {
  const idLocal = new URL(pedido.url).searchParams.get('local');
  if (!idLocal) throw new ErrorHttp(400, 'Falta el local.');
  if (!esquemaLocal.safeParse(idLocal).success) throw new ErrorHttp(404, 'No encontramos ese local.');
  const carta = await leerCarta(idLocal, { base: crearBaseCarta(clientePublico()) });
  return json(carta, 200, CACHE);
});
