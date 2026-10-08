// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITES,
  validarNombre,
  validarTelefono,
  limpiarTelefono,
  validarFecha,
  validarHora,
  validarPersonas,
  esGrupo,
  validarMail,
  validarComentarios,
  validarMotivo,
  validarReserva,
  hayErrores,
} from './reservas.js';

test('nombre: obligatorio y hasta 80; una sola letra alcanza', () => {
  assert.ok(validarNombre(''));
  assert.ok(validarNombre('   '));
  assert.equal(validarNombre('A'), '');
  assert.ok(validarNombre('a'.repeat(LIMITES.nombre.max + 1)));
  assert.equal(validarNombre('Ana'), '');
  assert.equal(validarNombre('  Ana  '), '');
});

test('nombre: acepta tildes, ñ, apóstrofo, guion y punto; rechaza números y símbolos', () => {
  for (const valido of ['María José', 'Ñandú', "O'Brien", 'Juan-Pablo', 'J. Pérez']) {
    assert.equal(validarNombre(valido), '', valido);
  }
  for (const invalido of ['Ana2', 'Ana <b>', '@ana', '- Ana']) {
    assert.ok(validarNombre(invalido), invalido);
  }
});

test('teléfono: obligatorio, solo dígitos y + - ( ) espacios, entre 8 y 15 dígitos', () => {
  assert.ok(validarTelefono(''));
  assert.ok(validarTelefono('111'));
  assert.ok(validarTelefono('abc12345678'));
  assert.ok(validarTelefono('1234567890123456'));
  assert.ok(validarTelefono('+54 9 2944 / 00'));
  assert.equal(validarTelefono('+54 9 2944 96-6199'), '');
  assert.equal(validarTelefono('(02944) 49-4000'), '');
  assert.equal(validarTelefono('29441234'), '');
});

test('limpiarTelefono: descarta letras y símbolos, deja dígitos, espacios y + - ( )', () => {
  assert.equal(limpiarTelefono('abc'), '');
  assert.equal(limpiarTelefono('+54 9 2944 96-6199'), '+54 9 2944 96-6199');
  assert.equal(limpiarTelefono('(02944) 49-4000'), '(02944) 49-4000');
  assert.equal(limpiarTelefono('tel: 2944.111.111 llamame'), ' 2944111111 ');
  assert.equal(limpiarTelefono('2944ñ1é1#1'), '2944111');
});

test('fecha: obligatoria, desde hoy, no bloqueada', () => {
  const hoy = '2026-10-08';
  assert.ok(validarFecha('', { hoy }));
  assert.ok(validarFecha('2026-10-07', { hoy }));
  assert.ok(validarFecha('fecha', { hoy }));
  assert.equal(validarFecha('2026-10-08', { hoy }), '');
  assert.equal(validarFecha('2026-12-24', { hoy }), '');
  const bloqueo = { fecha: '2026-12-24', motivo: 'Nochebuena' };
  assert.match(validarFecha('2026-12-24', { hoy, bloqueo, nombreLocal: 'La Posta' }), /Nochebuena/);
});

test('hora: obligatoria y dentro de las franjas que quedan', () => {
  const franjas = ['20:00', '20:15'];
  assert.ok(validarHora('', { franjas }));
  assert.ok(validarHora('21:00', { franjas }));
  assert.equal(validarHora('20:15', { franjas }), '');
});

test('hora: si no quedan franjas ese día, lo dice', () => {
  assert.match(validarHora('', { franjas: [] }), /no quedan/i);
});

test('personas: entero entre 1 y 6', () => {
  assert.ok(validarPersonas(0));
  assert.ok(validarPersonas(7));
  assert.ok(validarPersonas(2.5));
  assert.ok(validarPersonas(Number('x')));
  assert.equal(validarPersonas(1), '');
  assert.equal(validarPersonas('6'), '');
});

test('personas: con el máximo del local (admin), acepta hasta 40', () => {
  const max = LIMITES.personas.maxLocal;
  assert.equal(max, 40);
  assert.equal(validarPersonas(12, { max }), '');
  assert.equal(validarPersonas(40, { max }), '');
  assert.ok(validarPersonas(41, { max }));
  assert.ok(validarPersonas(0, { max }));
});

test('esGrupo: más de 6 personas se reserva por WhatsApp', () => {
  assert.equal(esGrupo(6), false);
  assert.equal(esGrupo('2'), false);
  assert.equal(esGrupo(7), true);
  assert.equal(esGrupo('12'), true);
});

test('mail: opcional; si está, con formato de mail y hasta 254 caracteres', () => {
  assert.equal(validarMail(''), '');
  assert.equal(validarMail(undefined), '');
  assert.equal(validarMail('ana@test.com'), '');
  assert.equal(validarMail('  ana.perez@mail.com.ar '), '');
  for (const invalido of ['ana', 'ana@', '@test.com', 'ana test@test.com', 'ana@test']) {
    assert.ok(validarMail(invalido), invalido);
  }
  assert.ok(validarMail(`${'a'.repeat(250)}@x.com`));
});

test('comentarios y motivo: opcionales, con máximo', () => {
  assert.equal(validarComentarios(''), '');
  assert.equal(validarComentarios(undefined), '');
  assert.ok(validarComentarios('x'.repeat(LIMITES.comentarios + 1)));
  assert.equal(LIMITES.comentarios, 100);
  assert.equal(validarComentarios('x'.repeat(100)), '');
  assert.ok(validarComentarios('x'.repeat(101)));
  assert.equal(validarMotivo(''), '');
  assert.ok(validarMotivo('x'.repeat(LIMITES.motivo + 1)));
});

test('validarReserva devuelve solo los campos con error', () => {
  const contexto = { hoy: '2026-10-08', franjas: ['20:00'] };
  const valida = {
    nombre: 'Ana',
    telefono: '+54 9 2944 96-6199',
    fecha: '2026-10-09',
    hora: '20:00',
    personas: '2',
    comentarios: '',
  };
  assert.deepEqual(validarReserva(valida, contexto), {});
  assert.equal(hayErrores(validarReserva(valida, contexto)), false);

  const errores = validarReserva({ ...valida, nombre: '', telefono: '12' }, contexto);
  assert.deepEqual(Object.keys(errores), ['nombre', 'telefono']);
  assert.equal(hayErrores(errores), true);
});

test('validarReserva: maxPersonas y mail del contexto del admin', () => {
  const contexto = { hoy: '2026-10-08', franjas: ['20:00'], maxPersonas: 40 };
  const valida = {
    nombre: 'Ana',
    telefono: '+54 9 2944 96-6199',
    fecha: '2026-10-09',
    hora: '20:00',
    personas: '12',
    comentarios: '',
    mail: '',
  };
  assert.deepEqual(validarReserva(valida, contexto), {});
  assert.deepEqual(Object.keys(validarReserva({ ...valida, mail: 'ana@' }, contexto)), ['mail']);
  // Sin maxPersonas, vale el máximo de la web
  assert.deepEqual(Object.keys(validarReserva(valida, { ...contexto, maxPersonas: undefined })), ['personas']);
});
