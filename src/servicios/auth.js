// Cuenta del usuario: se ingresa solo con Google. Salir y perfil.

import { supabase, resultado } from './supabase.js';

// A dónde vuelve el usuario después de pasar por Google
const urlDeVuelta = (ruta = '/') =>
  typeof window === 'undefined' ? undefined : `${window.location.origin}${ruta}`;

export const ingresarConGoogle = async (volverA) =>
  resultado(
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: urlDeVuelta(volverA) },
    })
  );

export const salir = async () => resultado(await supabase.auth.signOut());

// callback(evento, sesion). Devuelve la función para dejar de escuchar.
export function escucharSesion(callback) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export const obtenerPerfil = async (idUsuario) =>
  resultado(
    await supabase.from('perfiles').select('id, nombre, telefono, rol').eq('id', idUsuario).single()
  );

export const actualizarPerfil = async (idUsuario, { nombre, telefono }) =>
  resultado(await supabase.from('perfiles').update({ nombre, telefono }).eq('id', idUsuario));
