import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mensajeTrasCrear,
  normalizarMail,
  validarContrasena,
  validarCuenta,
  validarMailCuenta,
  validarRepeticion,
} from './cuenta.js';

test('el mail se recorta y va en minúsculas', () => {
  assert.equal(normalizarMail('  Ana@Hotmail.com '), 'ana@hotmail.com');
});

test('el mail de la cuenta es obligatorio y tiene que tener forma de mail', () => {
  assert.equal(validarMailCuenta(''), 'Escribí tu mail.');
  assert.equal(validarMailCuenta('ana@'), 'Ese mail no parece válido. Ejemplo: nombre@gmail.com');
  assert.equal(validarMailCuenta(' Ana@Hotmail.com '), '');
});

test('la contraseña va de 8 a 72 caracteres', () => {
  assert.equal(validarContrasena('1234567'), 'La contraseña tiene que tener al menos 8 caracteres.');
  assert.equal(validarContrasena('a'.repeat(73)), 'La contraseña puede tener hasta 72 caracteres.');
  assert.equal(validarContrasena('12345678'), '');
});

test('las dos contraseñas tienen que coincidir', () => {
  assert.equal(validarRepeticion('abcdefgh', 'abcdefgi'), 'Las contraseñas no coinciden.');
  assert.equal(validarRepeticion('abcdefgh', 'abcdefgh'), '');
});

test('crear cuenta pide nombre, mail y contraseña', () => {
  const errores = validarCuenta({ nombre: '', mail: 'x', contrasena: '1' }, { modo: 'crear' });
  assert.deepEqual(Object.keys(errores), ['nombre', 'mail', 'contrasena']);
});

test('olvidé mi contraseña pide solo el mail', () => {
  assert.deepEqual(Object.keys(validarCuenta({ mail: 'x' }, { modo: 'olvide' })), ['mail']);
});

test('al ingresar no se exige el largo, solo que haya contraseña', () => {
  assert.deepEqual(validarCuenta({ mail: 'ana@hotmail.com', contrasena: 'abc' }, { modo: 'ingresar' }), {});
  assert.equal(validarCuenta({ mail: 'ana@hotmail.com', contrasena: '' }, { modo: 'ingresar' }).contrasena,
    'Escribí tu contraseña.');
});

test('contraseña nueva: largo y repetición', () => {
  assert.deepEqual(Object.keys(validarCuenta({ contrasena: '1234567', repetida: '1234567' }, { modo: 'nueva' })), ['contrasena']);
  assert.deepEqual(Object.keys(validarCuenta({ contrasena: '12345678', repetida: '12345679' }, { modo: 'nueva' })), ['repetida']);
});

test('después de crear la cuenta el aviso no dice si el mail ya existía', () => {
  assert.equal(
    mensajeTrasCrear('ana@hotmail.com'),
    'Te mandamos un mail a ana@hotmail.com para confirmar la cuenta. Si no lo ves, revisá la carpeta de spam.'
  );
});
