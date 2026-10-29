// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aEntero, validarNombreItem, validarPrecio, validarPrecios, validarTexto } from './carta.js';

test('el precio es obligatorio', () => {
  assert.equal(validarPrecio(''), 'Escribí el precio.');
});

test('el precio tiene que ser mayor que cero', () => {
  assert.equal(validarPrecio('0'), 'El precio tiene que ser mayor que cero.');
  assert.equal(validarPrecio('-5'), 'El precio tiene que ser mayor que cero.');
});

test('el precio va sin centavos', () => {
  assert.equal(validarPrecio('12,5'), 'El precio va en pesos enteros, sin centavos.');
});

test('acepta el precio con puntos de miles o con signo', () => {
  assert.equal(validarPrecio('6000'), '');
  assert.equal(validarPrecio('6.000'), '');
  assert.equal(validarPrecio('$ 6.000'), '');
  assert.equal(aEntero('6.000'), 6000);
  assert.equal(aEntero('$ 6.000'), 6000);
  assert.equal(aEntero('abc'), null);
});

test('un precio por tamaño', () => {
  assert.equal(validarPrecios(['21000'], ['Chica', 'Grande']), 'Cargá un precio por tamaño.');
  assert.equal(validarPrecios(['21000', ''], ['Chica', 'Grande']), 'Cargá un precio por tamaño.');
  assert.equal(validarPrecios(['21000', '0'], ['Chica', 'Grande']), 'El precio tiene que ser mayor que cero.');
  assert.equal(validarPrecios(['21.000', '30.000'], ['Chica', 'Grande']), '');
});

test('el nombre es obligatorio y tiene un límite', () => {
  assert.equal(validarNombreItem('  '), 'Escribí el nombre.');
  assert.equal(validarNombreItem('x'.repeat(121)), 'Hasta 120 caracteres.');
  assert.equal(validarNombreItem('Chorizo'), '');
});

test('los textos opcionales tienen un límite', () => {
  assert.equal(validarTexto('', 300), '');
  assert.equal(validarTexto('x'.repeat(301), 300), 'Hasta 300 caracteres.');
});
