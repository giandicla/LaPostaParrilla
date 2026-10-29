// GET /api/v1/carta/vinos → 200 { cubierto: null, secciones }
// Pública: la carta de vinos y copas, la misma en los dos locales. Mismo caché
// que la carta de un local; `?fresca=1` sin caché (el panel).
import { json, manejar } from '../../../../../src/servidor/respuestas.js';
import { clientePublico } from '../../../../../src/servidor/supabase.js';
import { crearBaseCarta } from '../../../../../src/servidor/carta-base.js';
import { leerVinos } from '../../../../../src/servidor/carta.js';

const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };
const SIN_CACHE = { 'Cache-Control': 'no-store' };

export const GET = manejar(async (pedido) => {
  const carta = await leerVinos({ base: crearBaseCarta(clientePublico()) });
  return json(carta, 200, new URL(pedido.url).searchParams.has('fresca') ? SIN_CACHE : CACHE);
});
