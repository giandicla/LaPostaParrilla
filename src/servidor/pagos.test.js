import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarPagoDeSena } from './pagos.js';

const AHORA = new Date('2026-10-15T20:05:00.000Z');
const reserva = {
  id: 'r-1', usuario_id: 'u-1', estado: 'esperando_pago', fecha: '2026-10-18', hora: '20:30:00',
  creada_en: '2026-10-15T20:00:00.000Z', locales: { nombre: 'La Posta Parrilla', sena: '10000.00' },
};

function falsos(cambios = {}, pagosPrevios = 0) {
  const llamadas = [];
  const base = {
    leerReserva: async () => ({ ...reserva, ...cambios }),
    contarPagos: async () => pagosPrevios,
    crearPago: async (datos) => { llamadas.push(['crearPago', datos]); return { id: 'p-1', monto: datos.monto }; },
    guardarPreferencia: async (...args) => llamadas.push(['guardarPreferencia', ...args]),
  };
  const mp = {
    crearPreferencia: async (body) => { llamadas.push(['crearPreferencia', body]); return { id: 'pref-1', init_point: 'https://mp/pagar' }; },
  };
  return { base, mp, llamadas, appUrl: 'https://x.vercel.app', ahora: AHORA };
}

test('crea el pago con el monto de la base y devuelve el init_point', async () => {
  const deps = falsos();
  assert.deepEqual(await iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'u-1' }, deps), { initPoint: 'https://mp/pagar' });
  assert.deepEqual(deps.llamadas[0], ['crearPago', { reservaId: 'r-1', monto: '10000.00' }]);
  assert.equal(deps.llamadas[1][1].external_reference, 'p-1');
  assert.deepEqual(deps.llamadas[2], ['guardarPreferencia', 'p-1', 'pref-1']);
});

test('una reserva ajena es un 404', async () => {
  await assert.rejects(iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'otro' }, falsos()), (e) => e.status === 404);
});

test('una reserva que no espera el pago es un 409', async () => {
  await assert.rejects(iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'u-1' }, falsos({ estado: 'confirmada' })),
    (e) => e.status === 409);
});

test('con 5 intentos de pago ya hechos es un 429 y no se crea nada', async () => {
  const deps = falsos({}, 5);
  await assert.rejects(iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'u-1' }, deps), (e) => e.status === 429);
  assert.deepEqual(deps.llamadas, []);
});

test('con 4 intentos previos todavía se puede pagar', async () => {
  const deps = falsos({}, 4);
  assert.deepEqual(await iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'u-1' }, deps), { initPoint: 'https://mp/pagar' });
});

test('pasados los 15 minutos es un 409, aunque pg_cron todavía no la haya vencido', async () => {
  const deps = { ...falsos(), ahora: new Date('2026-10-15T20:15:01.000Z') };
  await assert.rejects(iniciarPagoDeSena({ reservaId: 'r-1', usuarioId: 'u-1' }, deps), (e) => e.status === 409);
});
