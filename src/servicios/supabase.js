// El único lugar del sitio que crea el cliente de Supabase. Los componentes
// nunca lo importan: usan las funciones de auth.js, reservas.js y admin.js.
//
// Si faltan las variables de entorno, `supabase` es null y el resto del sitio
// sigue funcionando: las pantallas de cuenta y reservas avisan que no están
// disponibles (ver `backendDisponible`).

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && clave ? createClient(url, clave) : null;

export { backendDisponible } from './config.js';

const ERRORES_AUTH = {
  provider_disabled: 'El ingreso con Google no está disponible en este momento.',
};

// Traduce los errores de Postgres y de Auth a mensajes para el usuario.
// Los que lanza la base con `raise exception` (código P0001) ya vienen en castellano.
export function mensajeDeError(error) {
  if (!error) return null;
  if (error.code === '23505') return 'Ya tenés una reserva en ese turno, ese día y en ese local.';
  if (error.code === '23514') return 'Revisá los datos: algún valor no es válido.';
  if (error.code === '42501') return 'No tenés permiso para hacer eso.';
  if (error.code === 'P0001') return error.message;
  if (ERRORES_AUTH[error.code]) return ERRORES_AUTH[error.code];

  console.error(error);
  return 'Algo salió mal. Probá de nuevo en un momento.';
}

// Envuelve las respuestas de supabase-js: { data, error } → data, o lanza
// un Error con el mensaje ya traducido.
export function resultado({ data, error }) {
  if (error) throw new Error(mensajeDeError(error));
  return data;
}
