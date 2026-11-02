import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancelarReserva } from './cancelaciones.js';
import { ErrorHttp } from './respuestas.js';

function falsos({ reserva = { id: 'r-1', estado: 'confirmada' }, sena = null } = {}) {
  const llamadas = [];
  return {
    llamadas,
    usuario: {
      leerReserva: async () => reserva,
      cancelar: async (...args) => llamadas.push(['cancelar', ...args]),
    },
    base: { estadoDeLaSena: async () => sena },
  };
}

test('cancela con la sesión del que llama y pasa el motivo', async () => {
  const deps = falsos();
  await cancelarReserva({ reservaId: 'r-1', motivo: 'No hay lugar' }, deps);
  assert.deepEqual(deps.llamadas, [['cancelar', 'r-1', 'No hay lugar']]);
});

test('si cancela el cliente, la seña cobrada queda retenida', async () => {
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, falsos({ sena: 'aprobado' })), { sena: 'retenida' });
});

test('si cancela el local, la seña queda a devolver', async () => {
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1', motivo: 'Cerramos' }, falsos({ sena: 'reintegro_pendiente' })),
    { sena: 'a_devolver' });
});

test('sin seña cobrada no hay nada que hacer con la plata', async () => {
  assert.deepEqual(await cancelarReserva({ reservaId: 'r-1' }, falsos()), { sena: 'no_corresponde' });
});

test('una reserva que ya no está activa es un 409 y no se toca', async () => {
  const deps = falsos({ reserva: { id: 'r-1', estado: 'cancelada' } });
  await assert.rejects(cancelarReserva({ reservaId: 'r-1' }, deps), (e) => e instanceof ErrorHttp && e.status === 409);
  assert.deepEqual(deps.llamadas, []);
});

test('una reserva que el usuario no ve es un 404', async () => {
  await assert.rejects(cancelarReserva({ reservaId: 'r-1' }, falsos({ reserva: null })),
    (e) => e instanceof ErrorHttp && e.status === 404);
});
