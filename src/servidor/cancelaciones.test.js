import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancelarReserva } from './cancelaciones.js';
import { ErrorHttp } from './respuestas.js';

function falsos({ reserva = { id: 'r-1', estado: 'confirmada' }, pago = { id: 'p-1', mp_payment_id: '555' }, fallaMp = false } = {}) {
  const llamadas = [];
  return {
    llamadas,
    usuario: {
      leerReserva: async () => reserva,
      cancelar: async (...args) => llamadas.push(['cancelar', ...args]),
    },
    base: {
      pagoAReintegrar: async () => pago,
      marcarReintegrado: async (id) => llamadas.push(['marcarReintegrado', id]),
    },
    mp: {
      reintegrar: async (...args) => {
        if (fallaMp) throw new Error('MP caído');
        llamadas.push(['reintegrar', ...args]);
      },
    },
  };
}

test('cancela y reintegra la seña', async () => {
  const deps = falsos();
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1', motivo: 'No hay lugar' }, deps), { reintegro: 'hecho' });
  assert.deepEqual(deps.llamadas, [
    ['cancelar', 'r-1', 'No hay lugar'], ['reintegrar', '555', 'reintegro-p-1'], ['marcarReintegrado', 'p-1'],
  ]);
});

test('sin seña cobrada no hay reintegro', async () => {
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, falsos({ pago: null })), { reintegro: 'no_corresponde' });
});

test('si el reembolso falla, la cancelación queda hecha y el reintegro pendiente', async (t) => {
  t.mock.method(console, 'error', () => {});
  const deps = falsos({ fallaMp: true });
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, deps), { reintegro: 'pendiente' });
  assert.deepEqual(deps.llamadas, [['cancelar', 'r-1', undefined]]);
});

test('una reserva ya cancelada con reintegro pendiente solo reintenta el reembolso', async () => {
  const deps = falsos({ reserva: { id: 'r-1', estado: 'cancelada' } });
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, deps), { reintegro: 'hecho' });
  assert.equal(deps.llamadas.some(([nombre]) => nombre === 'cancelar'), false);
});

test('una reserva que el usuario no ve es un 404', async () => {
  await assert.rejects(cancelarReserva({ reservaId: 'r-1' }, falsos({ reserva: null })),
    (e) => e instanceof ErrorHttp && e.status === 404);
});
