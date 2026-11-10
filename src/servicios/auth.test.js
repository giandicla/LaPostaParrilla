import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esEsperaDeLaCuenta, guardarTelefonoDelPerfil, opcionesDeGoogle, resultadoDeRegistro } from './auth.js';

test('ingresar con Google pide siempre el selector de cuentas', () => {
  // Sin esto, con una sola cuenta abierta Google entra directo y no deja elegir otra
  assert.deepEqual(opcionesDeGoogle('/admin').queryParams, { prompt: 'select_account' });
});

test('si guardar el teléfono falla, no corta la reserva: devuelve false sin lanzar', async () => {
  // En los tests no hay cliente de Supabase: la llamada falla adentro
  assert.equal(await guardarTelefonoDelPerfil('u', { nombre: 'Ana', telefono: '2944111111' }), false);
});

test('una cuenta nueva trae identidades', () => {
  assert.deepEqual(resultadoDeRegistro({ data: { user: { identities: [{ id: 'x' }] } }, error: null }), { cuentaNueva: true });
});

test('un mail ya registrado no es un error para la pantalla (no se revela que existe)', () => {
  // Supabase lo avisa de dos formas, según la configuración: sin identidades o con user_already_exists
  assert.deepEqual(resultadoDeRegistro({ data: { user: { identities: [] } }, error: null }), { cuentaNueva: false });
  assert.deepEqual(resultadoDeRegistro({ data: null, error: { code: 'user_already_exists' } }), { cuentaNueva: false });
});

test('otros errores se lanzan con el mensaje traducido', () => {
  assert.throws(() => resultadoDeRegistro({ data: null, error: { code: 'weak_password' } }),
    { message: 'La contraseña tiene que tener al menos 8 caracteres.' });
});

// Textos reales de Supabase Auth: el límite por cuenta y el general del sitio
const ESPERA_DE_LA_CUENTA = { code: 'over_email_send_rate_limit', message: 'For security purposes, you can only request this after 42 seconds.' };
const LIMITE_DEL_SITIO = { code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' };

test('la espera de un minuto por cuenta se reconoce; el límite general del sitio, no', () => {
  assert.equal(esEsperaDeLaCuenta(ESPERA_DE_LA_CUENTA), true);
  assert.equal(esEsperaDeLaCuenta({ ...ESPERA_DE_LA_CUENTA, message: 'For security purposes, you can only request this after 1 second.' }), true);
  assert.equal(esEsperaDeLaCuenta(LIMITE_DEL_SITIO), false);
  assert.equal(esEsperaDeLaCuenta(null), false);
});

test('crear una cuenta con un mail que ya la tiene y choca con la espera no lo revela', () => {
  assert.deepEqual(resultadoDeRegistro({ data: null, error: ESPERA_DE_LA_CUENTA }), { cuentaNueva: false });
});

test('el límite general del sitio sí se avisa: no dice nada de ninguna cuenta', () => {
  assert.throws(() => resultadoDeRegistro({ data: null, error: LIMITE_DEL_SITIO }),
    { message: 'Mandamos demasiados mails seguidos. Probá de nuevo en unos minutos.' });
});
