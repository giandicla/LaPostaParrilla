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

// { cubierto, secciones } — la forma está documentada en src/servidor/carta.js.
// `fresca`: sin el caché de un minuto (el panel, después de guardar).
export const leerCarta = (idLocal, { fresca = false } = {}) =>
  pedir(`/api/v1/carta?local=${encodeURIComponent(idLocal)}${fresca ? '&fresca=1' : ''}`);

// La carta de vinos y copas, compartida por los dos locales
export const leerVinos = ({ fresca = false } = {}) => pedir(`/api/v1/carta/vinos${fresca ? '?fresca=1' : ''}`);

// ---------- Edición (solo admin) ----------
// El servidor sabe quién llama por el token de la sesión de Supabase.

async function escribir(ruta, metodo, cuerpo) {
  // Solo las escrituras del admin necesitan el token: el cliente se importa acá
  // para que leer la carta en /carta no cargue supabase-js
  const { supabase } = await import('./supabase.js');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Ingresá con tu cuenta para continuar.');
  return pedir(ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
}

// datos: { seccionId, nombre, precio | precios, descripcion?, traduccion?, detalle?, bodega?, region? }
// (los arma datosDeLaCaja, en src/data/editorCarta.js)
export const crearItem = (datos) => escribir('/api/v1/carta/items', 'POST', datos);

// cambios: los mismos campos, más seccionId (cambia de categoría) o region (de su bodega)
export const editarItem = (id, cambios) => escribir(`/api/v1/carta/items/${id}`, 'PATCH', cambios);

export const borrarItem = (id) => escribir(`/api/v1/carta/items/${id}`, 'DELETE');

// posicion: desde 1, dentro de su categoría (en vinos, de su bodega)
export const ubicarItem = (id, posicion) => escribir(`/api/v1/carta/items/${id}`, 'PATCH', { posicion });

// Ubica la bodega entera en una posición dentro de su tipo de vino
export const ubicarBodega = (idSeccion, bodega, posicion) =>
  escribir(`/api/v1/carta/secciones/${idSeccion}/bodegas`, 'PATCH', { bodega, posicion });

export const cambiarCubierto = (idLocal, cubierto) =>
  escribir(`/api/v1/carta/locales/${idLocal}`, 'PATCH', { cubierto });
