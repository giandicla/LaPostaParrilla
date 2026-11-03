// Validación de los formularios de cuenta (ingresar, crear cuenta, olvidé mi
// contraseña, contraseña nueva). Funciones puras, como las de reservas: cada
// una devuelve el mensaje de error, o '' si el valor está bien. Supabase Auth
// vuelve a controlar el largo de la contraseña.

import { LIMITES, MAIL, validarNombre } from './reservas.js';

// 72: el máximo que acepta Supabase Auth (bcrypt)
export const LIMITES_CUENTA = { contrasena: { min: 8, max: 72 } };

// Supabase distingue mayúsculas: "Ana@" y "ana@" serían dos cuentas
export const normalizarMail = (valor) => String(valor ?? '').trim().toLowerCase();

export function validarMailCuenta(valor) {
  const mail = normalizarMail(valor);
  if (!mail) return 'Escribí tu mail.';
  if (mail.length > LIMITES.mail || !MAIL.test(mail)) {
    return 'Ese mail no parece válido. Ejemplo: nombre@gmail.com';
  }
  return '';
}

export function validarContrasena(valor) {
  const contrasena = String(valor ?? '');
  const { min, max } = LIMITES_CUENTA.contrasena;
  if (contrasena.length < min) return `La contraseña tiene que tener al menos ${min} caracteres.`;
  if (contrasena.length > max) return `La contraseña puede tener hasta ${max} caracteres.`;
  return '';
}

export const validarRepeticion = (contrasena, repetida) =>
  contrasena === repetida ? '' : 'Las contraseñas no coinciden.';

// modo: 'ingresar' | 'crear' | 'olvide' | 'nueva'.
// Devuelve { campo: mensaje } solo con los campos que tienen error.
export function validarCuenta(datos, { modo }) {
  const errores = {
    ingresar: () => ({
      mail: validarMailCuenta(datos.mail),
      // Al ingresar no se exige el largo: alcanza con que haya contraseña
      contrasena: datos.contrasena ? '' : 'Escribí tu contraseña.',
    }),
    crear: () => ({
      nombre: validarNombre(datos.nombre),
      mail: validarMailCuenta(datos.mail),
      contrasena: validarContrasena(datos.contrasena),
    }),
    olvide: () => ({ mail: validarMailCuenta(datos.mail) }),
    nueva: () => {
      const largo = validarContrasena(datos.contrasena);
      return { contrasena: largo, repetida: largo ? '' : validarRepeticion(datos.contrasena, datos.repetida) };
    },
  }[modo]();
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje));
}

// El mismo aviso haya o no una cuenta con ese mail: la pantalla no revela qué
// mails están registrados
export const mensajeTrasCrear = (mail) =>
  `Te mandamos un mail a ${normalizarMail(mail)} para confirmar la cuenta. Si no lo ves, revisá la carpeta de spam.`;
