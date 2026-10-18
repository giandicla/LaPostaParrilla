// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoSena, puedePagar, sePuedeCancelar, turnoDe } from './reservas.js';

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

test('una reserva sin pagar se puede cancelar siempre', () => {
  assert.equal(sePuedeCancelar({ ...dentroDe(30), estado: 'esperando_pago' }), true);
});

test('turno: antes de las 17 es mediodía', () => {
  assert.equal(turnoDe('12:45'), 'mediodia');
  assert.equal(turnoDe('16:59:00'), 'mediodia');
  assert.equal(turnoDe('17:00'), 'noche');
  assert.equal(turnoDe('20:30:00'), 'noche');
});

test('se puede pagar la seña durante 15 minutos', () => {
  const creada = '2026-10-15T20:00:00.000Z';
  const reserva = { estado: 'esperando_pago', creada_en: creada };
  assert.equal(puedePagar(reserva, Date.parse('2026-10-15T20:14:00.000Z')), true);
  assert.equal(puedePagar(reserva, Date.parse('2026-10-15T20:15:00.000Z')), false);
  assert.equal(puedePagar({ ...reserva, estado: 'confirmada' }, Date.parse(creada)), false);
});

test('estado de la seña: el pago cobrado, si hay', () => {
  assert.equal(estadoSena({ pagos: [{ estado: 'rechazado' }, { estado: 'aprobado' }] }), 'aprobado');
  assert.equal(estadoSena({ pagos: [{ estado: 'reintegrado' }] }), 'reintegrado');
  assert.equal(estadoSena({ pagos: [{ estado: 'iniciado' }] }), null);
  assert.equal(estadoSena({}), null);
});
