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
  email_provider_disabled: 'Por ahora solo se puede crear la cuenta con Google.',
  email_address_invalid: 'Ese mail no parece válido. Ejemplo: nombre@gmail.com',
  provider_disabled: 'El ingreso con Google no está disponible en este momento.',
};

for (const [code, mensaje] of Object.entries(casos)) {
  test(`traduce el error de Auth ${code}`, () => {
    assert.equal(mensajeDeError({ code }), mensaje);
  });
}
