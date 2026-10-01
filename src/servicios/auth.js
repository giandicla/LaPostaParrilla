// Cuenta del usuario: ingresar, registrarse, salir y su perfil.

import { supabase, resultado } from './supabase.js';

// A dónde vuelve el usuario después de Google o de los links de los mails
const urlDeVuelta = (ruta = '/') =>
  typeof window === 'undefined' ? undefined : `${window.location.origin}${ruta}`;

export const ingresarConGoogle = async (volverA) =>
  resultado(
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: urlDeVuelta(volverA) },
    })
  );

export const ingresarConEmail = async (email, clave) =>
  resultado(await supabase.auth.signInWithPassword({ email, password: clave }));

// Devuelve { necesitaConfirmar }: si el proyecto pide confirmar el mail,
// no hay sesión hasta que el usuario toque el link que le llega.
export async function registrarse({ email, clave, nombre }) {
  const datos = resultado(
    await supabase.auth.signUp({
      email,
      password: clave,
      options: { data: { nombre }, emailRedirectTo: urlDeVuelta('/reservas') },
    })
  );
  return { necesitaConfirmar: !datos.session };
}

export const pedirNuevaClave = async (email) =>
  resultado(
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: urlDeVuelta('/ingresar?modo=nueva-clave'),
    })
  );

export const cambiarClave = async (clave) =>
  resultado(await supabase.auth.updateUser({ password: clave }));

export const salir = async () => resultado(await supabase.auth.signOut());

export const obtenerSesion = async () => resultado(await supabase.auth.getSession()).session;

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
