import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mensajeDeError } from './supabase.js';

const casos = {
  invalid_credentials: 'El mail o la contraseña no son correctos.',
  email_not_confirmed: 'Todavía no confirmaste tu cuenta: revisá tu mail (y la carpeta de spam).',
  over_email_send_rate_limit: 'Mandamos demasiados mails seguidos. Probá de nuevo en unos minutos.',
  weak_password: 'La contraseña tiene que tener al menos 8 caracteres.',
  same_password: 'La contraseña nueva tiene que ser distinta de la anterior.',
  signup_disabled: 'Por ahora solo se puede crear la cuenta con Google.',
  // Con el proveedor de mail apagado tampoco se puede ingresar con contraseña
  email_provider_disabled: 'Por ahora solo se puede ingresar con Google.',
  email_address_invalid: 'Ese mail no parece válido. Ejemplo: nombre@gmail.com',
  provider_disabled: 'El ingreso con Google no está disponible en este momento.',
  over_request_rate_limit: 'Hubo demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.',
  user_banned: 'Esta cuenta está suspendida. Escribinos por WhatsApp para resolverlo.',
  otp_expired: 'El link venció o ya se usó. Pedí uno nuevo.',
  session_not_found: 'Tu sesión venció. Ingresá de nuevo.',
  bad_jwt: 'Tu sesión venció. Ingresá de nuevo.',
  validation_failed: 'Revisá los datos: algún valor no es válido.',
};

for (const [code, mensaje] of Object.entries(casos)) {
  test(`traduce el error de Auth ${code}`, () => {
    assert.equal(mensajeDeError({ code }), mensaje);
  });
}

test('sin conexión (error de red de supabase-js, sin código) lo dice', () => {
  assert.equal(mensajeDeError({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' }),
    'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
});

test('un error de Auth desconocido da el mensaje genérico, nunca el texto en inglés', (t) => {
  t.mock.method(console, 'error', () => {});
  assert.equal(mensajeDeError({ code: 'algo_nuevo', message: 'Something new' }), 'Algo salió mal. Probá de nuevo en un momento.');
});
