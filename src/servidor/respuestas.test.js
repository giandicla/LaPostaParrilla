// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErrorHttp, manejar } from './respuestas.js';

test('un ErrorHttp se responde con su código y su mensaje', async () => {
  const handler = manejar(async () => {
    throw new ErrorHttp(409, 'Esa reserva ya no está esperando el pago.');
  });
  const respuesta = await handler(new Request('http://x/'));
  assert.equal(respuesta.status, 409);
  assert.deepEqual(await respuesta.json(), { error: 'Esa reserva ya no está esperando el pago.' });
});

test('cualquier otro error es un 500 que no muestra detalles internos', async (t) => {
  t.mock.method(console, 'error', () => {});
  const handler = manejar(async () => {
    throw new Error('relation "pagos" does not exist');
  });
  const respuesta = await handler(new Request('http://x/'));
  assert.equal(respuesta.status, 500);
  const { error } = await respuesta.json();
  assert.equal(error.includes('pagos'), false);
});
