import { test } from 'node:test';
import assert from 'node:assert/strict';
import { procesarAvisoDePago } from './avisos.js';

const ID_PAGO = '7f9c2b1e-4a3d-4c5e-9f1a-2b3c4d5e6f70';

function falsos({ pagoMp, estadoFinal = 'aprobado', existe = true, falla = null }) {
  const llamadas = [];
  return {
    llamadas,
    mp: {
      obtenerPago: async () => { if (falla) throw falla; return pagoMp; },
      reintegrar: async (...args) => llamadas.push(['reintegrar', ...args]),
    },
    base: {
      leerPago: async () => (existe ? { id: ID_PAGO } : null),
      acreditarPago: async (...args) => { llamadas.push(['acreditar', ...args]); return estadoFinal; },
      marcarReintegrado: async (id) => llamadas.push(['marcarReintegrado', id]),
    },
  };
}

test('acredita con el estado real que devuelve Mercado Pago', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'approved', external_reference: ID_PAGO } });
  assert.equal(await procesarAvisoDePago('555', deps), 'aprobado');
  assert.deepEqual(deps.llamadas, [['acreditar', ID_PAGO, '555', 'approved']]);
});

test('un pago tardío queda reintegrado en el momento', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'approved', external_reference: ID_PAGO }, estadoFinal: 'reintegro_pendiente' });
  assert.equal(await procesarAvisoDePago('555', deps), 'reintegrado');
  assert.deepEqual(deps.llamadas.slice(1), [['reintegrar', '555', 'reintegro-555'], ['marcarReintegrado', ID_PAGO]]);
});

test('un pago que no salió de este sitio se ignora (sin 500, para que no reintente)', async () => {
  for (const external_reference of [undefined, '', 'pedido-42']) {
    const deps = falsos({ pagoMp: { id: 1, status: 'approved', external_reference } });
    assert.equal(await procesarAvisoDePago('1', deps), 'ignorado');
    assert.equal(deps.llamadas.length, 0);
  }
  const desconocido = falsos({ pagoMp: { id: 1, status: 'approved', external_reference: ID_PAGO }, existe: false });
  assert.equal(await procesarAvisoDePago('1', desconocido), 'ignorado');
});

test('un segundo pago aprobado sobre la misma preferencia se reintegra por su propio id', async (t) => {
  const aviso = t.mock.method(console, 'warn', () => {});
  const deps = falsos({ pagoMp: { id: 777, status: 'approved', external_reference: ID_PAGO }, estadoFinal: 'duplicado' });
  assert.equal(await procesarAvisoDePago('777', deps), 'duplicado_reintegrado');
  assert.deepEqual(deps.llamadas.slice(1), [['reintegrar', '777', 'reintegro-777']]);
  assert.equal(aviso.mock.callCount(), 1);
});

test('un aviso no aprobado sobre un pago en reintegro_pendiente no reintegra nada', async () => {
  for (const status of ['pending', 'in_process', 'rejected', 'cancelled']) {
    const deps = falsos({ pagoMp: { id: 888, status, external_reference: ID_PAGO }, estadoFinal: 'reintegro_pendiente' });
    assert.equal(await procesarAvisoDePago('888', deps), 'reintegro_pendiente');
    assert.deepEqual(deps.llamadas, [['acreditar', ID_PAGO, '888', status]]);
  }
});

test('un 404 de Mercado Pago al leer el pago se ignora (sin 500)', async () => {
  const deps = falsos({ falla: Object.assign(new Error('Payment not found'), { status: 404 }) });
  assert.equal(await procesarAvisoDePago('999', deps), 'ignorado');
  assert.equal(deps.llamadas.length, 0);
});

test('otro error de Mercado Pago al leer el pago sigue siendo un error (para que reintente)', async () => {
  const deps = falsos({ falla: Object.assign(new Error('Caído'), { status: 500 }) });
  await assert.rejects(procesarAvisoDePago('999', deps), /Caído/);
});
