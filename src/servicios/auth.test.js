import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resultadoDeRegistro } from './auth.js';

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
