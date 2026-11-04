import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancelarReserva } from './cancelaciones.js';
import { ErrorHttp } from './respuestas.js';

function falsos({ reserva = { id: 'r-1', estado: 'confirmada' }, pagos = [{ id: 'p-1', mp_payment_id: '555' }], fallaPara = null } = {}) {
  const llamadas = [];
  return {
    llamadas,
    usuario: {
      leerReserva: async () => reserva,
      cancelar: async (...args) => llamadas.push(['cancelar', ...args]),
    },
    base: { pagosAReintegrar: async () => pagos },
    mp: {
      reintegrar: async (...args) => {
        if (args[0] === fallaPara) throw new Error('MP caído');
        llamadas.push(['reintegrar', ...args]);
      },
    },
  };
}

test('cancela y pide el reembolso de la seña', async () => {
  const deps = falsos();
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1', motivo: 'No hay lugar' }, deps), { reintegro: 'pedido' });
  assert.deepEqual(deps.llamadas, [['cancelar', 'r-1', 'No hay lugar'], ['reintegrar', '555', 'reintegro-555']]);
});

test('sin seña cobrada no hay reembolso', async () => {
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, falsos({ pagos: [] })), { reintegro: 'no_corresponde' });
});

test('si Mercado Pago falla, la cancelación queda hecha y el reembolso para reintentar', async (t) => {
  t.mock.method(console, 'error', () => {});
  const deps = falsos({ fallaPara: '555' });
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, deps), { reintegro: 'fallo' });
  assert.deepEqual(deps.llamadas, [['cancelar', 'r-1', undefined]]);
});

test('una reserva ya cancelada con la seña a devolver solo reintenta el reembolso', async () => {
  const deps = falsos({ reserva: { id: 'r-1', estado: 'cancelada' } });
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, deps), { reintegro: 'pedido' });
  assert.deepEqual(deps.llamadas, [['reintegrar', '555', 'reintegro-555']]);
});

test('con dos pagos a devolver, si falla el primero igual se pide el segundo', async (t) => {
  t.mock.method(console, 'error', () => {});
  const deps = falsos({ pagos: [{ id: 'p-1', mp_payment_id: '555' }, { id: 'p-2', mp_payment_id: '666' }], fallaPara: '555' });
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, deps), { reintegro: 'fallo' });
  assert.deepEqual(deps.llamadas, [['cancelar', 'r-1', undefined], ['reintegrar', '666', 'reintegro-666']]);
});

test('una reserva que ya no está activa y no tiene nada para devolver es un 409', async () => {
  const deps = falsos({ reserva: { id: 'r-1', estado: 'cancelada' }, pagos: [] });
  await assert.rejects(cancelarReserva({ reservaId: 'r-1' }, deps), (e) => e instanceof ErrorHttp && e.status === 409);
  assert.deepEqual(deps.llamadas, []);
});

test('una reserva que el usuario no ve es un 404', async () => {
  await assert.rejects(cancelarReserva({ reservaId: 'r-1' }, falsos({ reserva: null })),
    (e) => e instanceof ErrorHttp && e.status === 404);
});
