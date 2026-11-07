// A dónde se vuelve después de ingresar (el ?volver= de /ingresar). Solo
// rutas de este mismo sitio: un ?volver=https://otro-sitio no se sigue.
//
// No alcanza con mirar que empiece con "/" y no con "//": el navegador (y el
// router de Next) lee "/\otro-sitio.com" como "//otro-sitio.com", y también
// descarta tabs y saltos de línea. Por eso se resuelve con URL, que normaliza
// igual que el navegador, y se acepta solo si el origen sigue siendo el propio.

export const DESTINO_POR_DEFECTO = '/mis-reservas';

const ORIGEN_PROPIO = 'https://la-posta.invalid';

export function destinoSeguro(volver) {
  if (typeof volver !== 'string' || !volver.startsWith('/')) return DESTINO_POR_DEFECTO;
  try {
    const url = new URL(volver, ORIGEN_PROPIO);
    if (url.origin !== ORIGEN_PROPIO) return DESTINO_POR_DEFECTO;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DESTINO_POR_DEFECTO;
  }
}
