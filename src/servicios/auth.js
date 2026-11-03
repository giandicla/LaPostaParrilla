// Cuenta del usuario: con Google o con mail y contraseña. Salir y perfil.
// Los mails de confirmación y de contraseña nueva los manda Supabase Auth
// (en producción, por el SMTP de Brevo).

import { supabase, resultado } from './supabase.js';
import { normalizarMail } from '../validacion/cuenta.js';

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

// Un mail que ya tenía cuenta no es un error para la pantalla: dice lo mismo
// que con una cuenta nueva, para no revelar qué mails existen. Supabase lo
// avisa de dos formas según la configuración: un usuario sin identidades, o
// el error user_already_exists. cuentaNueva queda solo para las pruebas.
export function resultadoDeRegistro({ data, error }) {
  if (error?.code === 'user_already_exists') return { cuentaNueva: false };
  const datos = resultado({ data, error });
  return { cuentaNueva: (datos.user?.identities?.length ?? 0) > 0 };
}

// La cuenta queda sin confirmar hasta que se toca el link del mail
export async function crearCuenta({ nombre, mail, contrasena }, volverA) {
  return resultadoDeRegistro(
    await supabase.auth.signUp({
      email: normalizarMail(mail),
      password: contrasena,
      // crear_perfil() lee "nombre" de los metadatos
      options: { data: { nombre: nombre.trim() }, emailRedirectTo: urlDeVuelta(volverA) },
    })
  );
}

export const ingresarConMail = async ({ mail, contrasena }) =>
  resultado(await supabase.auth.signInWithPassword({ email: normalizarMail(mail), password: contrasena })).session;

// Responde igual exista o no la cuenta
export async function pedirNuevaContrasena(mail) {
  resultado(
    await supabase.auth.resetPasswordForEmail(normalizarMail(mail), {
      redirectTo: urlDeVuelta('/ingresar/contrasena'),
    })
  );
}

// Con la sesión que abre el link del mail de "Olvidé mi contraseña"
export async function cambiarContrasena(contrasena) {
  resultado(await supabase.auth.updateUser({ password: contrasena }));
}

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

// Al reservar: guarda el teléfono para la próxima. Es comodidad, así que un
// error acá no corta la reserva ni el pago. Devuelve si se guardó.
export async function guardarTelefonoDelPerfil(idUsuario, datos) {
  try {
    await actualizarPerfil(idUsuario, datos);
    return true;
  } catch (e) {
    console.error('No se pudo guardar el teléfono en el perfil', e);
    return false;
  }
}
