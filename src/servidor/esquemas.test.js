import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esquemaCancelacion, esquemaPago, leerCuerpo } from './esquemas.js';
import { ErrorHttp } from './respuestas.js';

const pedido = (cuerpo) => new Request('http://x/', { method: 'POST', body: cuerpo });
const ID = '7f9c2b1e-4a3d-4c5e-9f1a-2b3c4d5e6f70';

test('acepta un id de reserva válido', async () => {
  assert.deepEqual(await leerCuerpo(pedido(JSON.stringify({ reservaId: ID })), esquemaPago), { reservaId: ID });
});

test('rechaza con 400 un id que no es UUID', async () => {
  await assert.rejects(leerCuerpo(pedido(JSON.stringify({ reservaId: '1' })), esquemaPago),
    (e) => e instanceof ErrorHttp && e.status === 400);
});

test('rechaza con 400 un cuerpo que no es JSON', async () => {
  await assert.rejects(leerCuerpo(pedido('{nope'), esquemaPago),
    (e) => e instanceof ErrorHttp && e.status === 400);
});

test('un cuerpo vacío vale como {} (el cliente cancela sin motivo)', async () => {
  assert.deepEqual(await leerCuerpo(pedido(''), esquemaCancelacion), {});
});

test('el motivo se recorta y tiene hasta 120 caracteres', async () => {
  assert.deepEqual(await leerCuerpo(pedido(JSON.stringify({ motivo: '  No hay lugar ' })), esquemaCancelacion),
    { motivo: 'No hay lugar' });
  await assert.rejects(leerCuerpo(pedido(JSON.stringify({ motivo: 'x'.repeat(121) })), esquemaCancelacion),
    (e) => e.status === 400);
});
