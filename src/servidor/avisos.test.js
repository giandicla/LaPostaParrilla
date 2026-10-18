import { test } from 'node:test';
import assert from 'node:assert/strict';
import { procesarAvisoDePago } from './avisos.js';

const ID_PAGO = '7f9c2b1e-4a3d-4c5e-9f1a-2b3c4d5e6f70';

function falsos({ pagoMp, estadoFinal = 'aprobado', existe = true }) {
  const llamadas = [];
  return {
    llamadas,
    mp: {
      obtenerPago: async () => pagoMp,
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
  assert.deepEqual(deps.llamadas.slice(1), [['reintegrar', '555', `reintegro-${ID_PAGO}`], ['marcarReintegrado', ID_PAGO]]);
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
