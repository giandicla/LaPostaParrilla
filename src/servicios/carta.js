// La carta: se pide a la API propia (app/api/v1/carta), no a Supabase directo.
// Leerla es público; editarla, solo del admin (con el token de la sesión).

const ERROR_GENERICO = 'Algo salió mal. Probá de nuevo en un momento.';

async function pedir(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(ruta, opciones);
  } catch {
    throw new Error('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
  }
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error ?? ERROR_GENERICO);
  return datos;
}

// { cubierto, secciones } — la forma está documentada en src/servidor/carta.js
export const leerCarta = (idLocal) => pedir(`/api/v1/carta?local=${encodeURIComponent(idLocal)}`);
