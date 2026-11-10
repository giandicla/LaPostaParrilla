// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoSena, estadoVisible, formatearFecha, horaDeVencimiento, puedePagar, sePuedeCancelar, sePuedeModificar, sigueMirandoElPago, turnoDe } from './reservas.js';

test('la fecha se escribe con el día de la semana; el año, solo si se pide', () => {
  assert.equal(formatearFecha('2027-03-10'), 'miércoles, 10 de marzo');
  assert.equal(formatearFecha('2027-03-10', { conAnio: true }), 'miércoles, 10 de marzo de 2027');
});

test('la hora en que vence el pago va en 24 horas, hora de Argentina, sin "a. m."', () => {
  // 03:42 UTC + 15 minutos = 00:57 en Argentina
  assert.equal(horaDeVencimiento({ creada_en: '2026-11-10T03:42:00.000Z' }), '00:57');
  assert.equal(horaDeVencimiento({ creada_en: '2026-11-10T23:30:00.000Z' }), '20:45');
});

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

test('modificar desde la web: confirmada y hasta 1 hora antes', () => {
  assert.equal(sePuedeModificar(dentroDe(90)), true);
  assert.equal(sePuedeModificar(dentroDe(30)), false);
  assert.equal(sePuedeModificar({ ...dentroDe(600), estado: 'esperando_pago' }), false);
  assert.equal(sePuedeModificar({ ...dentroDe(600), estado: 'cancelada' }), false);
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

test('estado de la seña: con varios pagos cobrados gana el aprobado', () => {
  assert.equal(estadoSena({ pagos: [{ estado: 'reintegrado' }, { estado: 'aprobado' }] }), 'aprobado');
  assert.equal(estadoSena({ pagos: [{ estado: 'reintegro_pendiente' }, { estado: 'reintegrado' }] }), 'reintegro_pendiente');
});

test('una confirmada de un día anterior se ve como terminada', () => {
  assert.equal(estadoVisible({ estado: 'confirmada', fecha: '2020-01-01' }), 'terminada');
  assert.equal(estadoVisible({ estado: 'confirmada', fecha: '2999-01-01' }), 'confirmada');
  assert.equal(estadoVisible({ estado: 'cancelada', fecha: '2020-01-01' }), 'cancelada');
  assert.equal(estadoVisible({ estado: 'vencida', fecha: '2020-01-01' }), 'vencida');
});

test('la pantalla de pago sigue mirando 10 minutos después de vencer, por si el pago llega tarde', () => {
  const creada = '2026-10-15T20:00:00.000Z'; // vence 20:15
  const a = (hora) => Date.parse(`2026-10-15T${hora}:00.000Z`);
  const vencida = { estado: 'vencida', creada_en: creada, pagos: [] };
  assert.equal(sigueMirandoElPago({ ...vencida, estado: 'esperando_pago' }, a('20:40')), true);
  assert.equal(sigueMirandoElPago(vencida, a('20:20')), true);
  assert.equal(sigueMirandoElPago(vencida, a('20:25')), false);
  // Llegó tarde y se está devolviendo: se sigue mirando hasta ver la seña devuelta
  assert.equal(sigueMirandoElPago({ ...vencida, pagos: [{ estado: 'reintegro_pendiente' }] }, a('20:20')), true);
  assert.equal(sigueMirandoElPago({ ...vencida, pagos: [{ estado: 'reintegrado' }] }, a('20:16')), false);
  assert.equal(sigueMirandoElPago({ ...vencida, estado: 'confirmada' }, a('20:05')), false);
});
