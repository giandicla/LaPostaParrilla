import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bloqueosDelDia, cierreDelDia, horaBloqueada, horasDelBloqueo, mismoBloqueo, textoDeHoras, validarBloqueo,
} from './bloqueos.js';

const FRANJAS = ['12:00', '12:15', '12:30', '12:45', '13:00', '20:00', '20:15', '20:30', '20:45', '21:00'];

const vacaciones = { fecha: '2027-03-01', fecha_hasta: '2027-03-10', local_id: 'parrilla', hora_desde: null, hora_hasta: null, motivo: 'Vacaciones' };
const sinPrimeraNoche = { fecha: '2027-03-01', fecha_hasta: '2027-03-31', local_id: null, hora_desde: '20:00:00', hora_hasta: '20:30:00', motivo: null };

test('un bloqueo alcanza a todos los días de su rango, con los dos extremos', () => {
  const bloqueos = [vacaciones];
  assert.equal(bloqueosDelDia(bloqueos, '2027-02-28', 'parrilla').length, 0);
  assert.equal(bloqueosDelDia(bloqueos, '2027-03-01', 'parrilla').length, 1);
  assert.equal(bloqueosDelDia(bloqueos, '2027-03-05', 'parrilla').length, 1);
  assert.equal(bloqueosDelDia(bloqueos, '2027-03-10', 'parrilla').length, 1);
  assert.equal(bloqueosDelDia(bloqueos, '2027-03-11', 'parrilla').length, 0);
});

test('un bloqueo de un local no alcanza al otro; uno sin local alcanza a los dos', () => {
  assert.equal(bloqueosDelDia([vacaciones], '2027-03-05', 'restaurante').length, 0);
  assert.equal(bloqueosDelDia([sinPrimeraNoche], '2027-03-05', 'restaurante').length, 1);
  assert.equal(bloqueosDelDia([sinPrimeraNoche], '2027-03-05', 'parrilla').length, 1);
});

test('un bloqueo sin fecha_hasta (dato viejo) vale por un solo día', () => {
  const viejo = { fecha: '2027-03-01', local_id: null };
  assert.equal(bloqueosDelDia([viejo], '2027-03-01', 'parrilla').length, 1);
  assert.equal(bloqueosDelDia([viejo], '2027-03-02', 'parrilla').length, 0);
});

test('con horas, bloquea solo ese rango, con los dos extremos', () => {
  const delDia = [sinPrimeraNoche];
  assert.equal(horaBloqueada(delDia, '12:30'), false);
  assert.equal(horaBloqueada(delDia, '20:00'), true);
  assert.equal(horaBloqueada(delDia, '20:15'), true);
  assert.equal(horaBloqueada(delDia, '20:30'), true);
  assert.equal(horaBloqueada(delDia, '20:45'), false);
});

test('sin horas, bloquea todo el día', () => {
  assert.equal(horaBloqueada([vacaciones], '12:00'), true);
  assert.equal(horaBloqueada([vacaciones], '21:00'), true);
  assert.equal(horaBloqueada([], '21:00'), false);
});

test('el día queda cerrado con un bloqueo entero o si entre varios tapan todos los horarios', () => {
  assert.equal(cierreDelDia([vacaciones], FRANJAS), vacaciones);
  assert.equal(cierreDelDia([sinPrimeraNoche], FRANJAS), undefined);
  const mediodia = { ...sinPrimeraNoche, hora_desde: '12:00', hora_hasta: '13:00', motivo: 'Evento' };
  const noche = { ...sinPrimeraNoche, hora_desde: '20:00', hora_hasta: '21:00' };
  assert.equal(cierreDelDia([mediodia, noche], FRANJAS), mediodia);
  assert.equal(cierreDelDia([], FRANJAS), undefined);
  // Sin franjas cargadas todavía no se puede decir que esté cerrado
  assert.equal(cierreDelDia([sinPrimeraNoche], []), undefined);
});

test('el formulario: fecha desde obligatoria y rangos en orden', () => {
  const hoy = '2026-11-10';
  const bien = { desde: '2027-03-01', hasta: '2027-03-31', horaDesde: '12:00', horaHasta: '21:00', motivo: '' };
  assert.equal(validarBloqueo(bien, { hoy }), null);
  assert.equal(validarBloqueo({ ...bien, hasta: '' }, { hoy }), null);
  assert.equal(validarBloqueo({ ...bien, hasta: bien.desde, horaHasta: bien.horaDesde }, { hoy }), null);
  assert.equal(validarBloqueo({ ...bien, desde: '' }, { hoy }).campo, 'desde');
  assert.deepEqual(validarBloqueo({ ...bien, hasta: '2027-02-28' }, { hoy }),
    { campo: 'hasta', mensaje: 'La fecha hasta no puede ser anterior a la fecha desde.' });
  assert.deepEqual(validarBloqueo({ ...bien, horaDesde: '20:30', horaHasta: '20:00' }, { hoy }),
    { campo: 'horaHasta', mensaje: 'La hora hasta no puede ser anterior a la hora desde.' });
  assert.equal(validarBloqueo({ ...bien, motivo: 'x'.repeat(121) }, { hoy }).campo, 'motivo');
});

test('del primer horario al último se guarda como todo el día', () => {
  assert.deepEqual(horasDelBloqueo({ horaDesde: '12:00', horaHasta: '21:00' }, FRANJAS), { hora_desde: null, hora_hasta: null });
  assert.deepEqual(horasDelBloqueo({ horaDesde: '20:00', horaHasta: '21:00' }, FRANJAS), { hora_desde: '20:00', hora_hasta: '21:00' });
});

test('dos bloqueos son el mismo si coinciden fechas, local y horas', () => {
  assert.equal(mismoBloqueo(sinPrimeraNoche, { ...sinPrimeraNoche, hora_desde: '20:00', hora_hasta: '20:30', motivo: 'otro' }), true);
  assert.equal(mismoBloqueo(sinPrimeraNoche, { ...sinPrimeraNoche, hora_hasta: '20:45' }), false);
  assert.equal(mismoBloqueo(vacaciones, { ...vacaciones, local_id: null }), false);
});

test('las horas se escriben como rango, o "todo el día"', () => {
  assert.equal(textoDeHoras(vacaciones), 'todo el día');
  assert.equal(textoDeHoras(sinPrimeraNoche), 'de 20:00 a 20:30');
});
