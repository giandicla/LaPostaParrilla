import { test } from 'node:test';
import assert from 'node:assert/strict';
import { procesarAvisoDePago } from './avisos.js';

const ID_PAGO = '7f9c2b1e-4a3d-4c5e-9f1a-2b3c4d5e6f70';

function falsos({ pagoMp, estadoFinal = 'aprobado', existe = true, falla = null }) {
  const llamadas = [];
  return {
    llamadas,
    mp: {
      // Mercado Pago informa lo cobrado en transaction_amount: la seña, salvo que el test diga otra cosa
      obtenerPago: async () => { if (falla) throw falla; return { transaction_amount: 10000, ...pagoMp }; },
      reintegrar: async (...args) => llamadas.push(['reintegrar', ...args]),
    },
    base: {
      leerPago: async () => (existe ? { id: ID_PAGO, monto: '10000.00' } : null),
      acreditarPago: async (...args) => { llamadas.push(['acreditar', ...args]); return estadoFinal; },
      confirmarReintegro: async (...args) => llamadas.push(['confirmar', ...args]),
    },
  };
}

test('acredita con el estado real que devuelve Mercado Pago', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'approved', external_reference: ID_PAGO } });
  assert.equal(await procesarAvisoDePago('555', deps), 'aprobado');
  assert.deepEqual(deps.llamadas, [['acreditar', ID_PAGO, '555', 'approved']]);
});

test('un pago tardío pide el reembolso, sin darlo por devuelto', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'approved', external_reference: ID_PAGO }, estadoFinal: 'reintegro_pendiente' });
  assert.equal(await procesarAvisoDePago('555', deps), 'reintegro_pedido');
  assert.deepEqual(deps.llamadas, [['acreditar', ID_PAGO, '555', 'approved'], ['reintegrar', '555', 'reintegro-555']]);
});

test('un aviso no aprobado sobre una seña a devolver no pide nada', async () => {
  for (const status of ['pending', 'in_process', 'rejected', 'cancelled']) {
    const deps = falsos({ pagoMp: { id: 888, status, external_reference: ID_PAGO }, estadoFinal: 'reintegro_pendiente' });
    assert.equal(await procesarAvisoDePago('888', deps), 'reintegro_pendiente');
    assert.deepEqual(deps.llamadas, [['acreditar', ID_PAGO, '888', status]]);
  }
});

test('el aviso del pago reembolsado confirma la devolución', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'refunded', external_reference: ID_PAGO } });
  assert.equal(await procesarAvisoDePago('555', deps), 'reintegrado');
  assert.deepEqual(deps.llamadas, [['confirmar', ID_PAGO, '555']]);
});

test('si Mercado Pago falla al reembolsar un pago tardío, el error sube (para que reintente)', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'approved', external_reference: ID_PAGO }, estadoFinal: 'reintegro_pendiente' });
  deps.mp.reintegrar = async () => { throw new Error('MP caído'); };
  await assert.rejects(procesarAvisoDePago('555', deps), /MP caído/);
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

test('un segundo pago aprobado sobre la misma preferencia se reembolsa por su propio id', async (t) => {
  const aviso = t.mock.method(console, 'warn', () => {});
  const deps = falsos({ pagoMp: { id: 777, status: 'approved', external_reference: ID_PAGO }, estadoFinal: 'duplicado' });
  assert.equal(await procesarAvisoDePago('777', deps), 'duplicado_reintegro_pedido');
  assert.deepEqual(deps.llamadas, [['acreditar', ID_PAGO, '777', 'approved'], ['reintegrar', '777', 'reintegro-777']]);
  assert.equal(aviso.mock.callCount(), 1);
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

test('un pago aprobado por otro monto no confirma la reserva: se devuelve', async (t) => {
  t.mock.method(console, 'error', () => {});
  const deps = falsos({ pagoMp: { id: 777, status: 'approved', external_reference: ID_PAGO, transaction_amount: 100 } });
  assert.equal(await procesarAvisoDePago('777', deps), 'monto_distinto_reintegro_pedido');
  assert.deepEqual(deps.llamadas, [['reintegrar', '777', 'reintegro-777']]);
});

test('el monto se compara como número: 10000 cobrado es la seña de "10000.00"', async () => {
  const deps = falsos({ pagoMp: { id: 555, status: 'approved', external_reference: ID_PAGO, transaction_amount: 10000.0 } });
  assert.equal(await procesarAvisoDePago('555', deps), 'aprobado');
});

test('un pago rechazado por otro monto no se reembolsa (no se cobró nada)', async () => {
  const deps = falsos({ pagoMp: { id: 778, status: 'rejected', external_reference: ID_PAGO, transaction_amount: 100 }, estadoFinal: 'rechazado' });
  assert.equal(await procesarAvisoDePago('778', deps), 'rechazado');
  assert.deepEqual(deps.llamadas, [['acreditar', ID_PAGO, '778', 'rejected']]);
});
