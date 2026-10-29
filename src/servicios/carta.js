// La carta: se pide a la API propia (app/api/v1/carta), no a Supabase directo.
// Leerla es público; editarla, solo del admin (con el token de la sesión).

import { supabase } from './supabase.js';

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

// ---------- Edición (solo admin) ----------
// El servidor sabe quién llama por el token de la sesión de Supabase.

async function escribir(ruta, metodo, cuerpo) {
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
export const crearItem = (datos) => escribir('/api/v1/carta/items', 'POST', datos);

export const editarItem = (id, cambios) => escribir(`/api/v1/carta/items/${id}`, 'PATCH', cambios);

export const borrarItem = (id) => escribir(`/api/v1/carta/items/${id}`, 'DELETE');

// sentido: 'arriba' | 'abajo'
export const moverItem = (id, sentido) => escribir(`/api/v1/carta/items/${id}`, 'PATCH', { mover: sentido });

// { bodega, region?, mover? }: cambia la región de la bodega o la mueve entera
export const editarBodega = (idSeccion, datos) =>
  escribir(`/api/v1/carta/secciones/${idSeccion}/bodegas`, 'PATCH', datos);

export const cambiarCubierto = (idLocal, cubierto) =>
  escribir(`/api/v1/carta/locales/${idLocal}`, 'PATCH', { cubierto });
