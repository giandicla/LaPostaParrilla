// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sePuedeCancelar } from './reservas.js';

// Fecha y hora de Argentina (UTC-3) dentro de `minutos`, como las guarda la base
function dentroDe(minutos) {
  const momento = new Date(Date.now() + minutos * 60 * 1000 - 3 * 60 * 60 * 1000);
  const [fecha, resto] = momento.toISOString().split('T');
  return { fecha, hora: resto.slice(0, 5), estado: 'confirmada' };
}

test('cancelar desde la web: se puede hasta 1 hora antes', () => {
  assert.equal(sePuedeCancelar(dentroDe(90)), true);
  assert.equal(sePuedeCancelar(dentroDe(62)), true);
  assert.equal(sePuedeCancelar(dentroDe(30)), false);
});

test('cancelar desde la web: solo reservas activas', () => {
  assert.equal(sePuedeCancelar({ ...dentroDe(600), estado: 'cancelada' }), false);
});
