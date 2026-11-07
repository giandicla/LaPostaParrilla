import { test } from 'node:test';
import assert from 'node:assert/strict';
import { destinoSeguro, DESTINO_POR_DEFECTO } from './destino.js';

test('una ruta interna se respeta, con su query y su ancla', () => {
  assert.equal(destinoSeguro('/reservas'), '/reservas');
  assert.equal(destinoSeguro('/reservas?local=parrilla#form'), '/reservas?local=parrilla#form');
});

test('sin volver, o con algo que no es una ruta, va a Mis reservas', () => {
  for (const volver of [null, undefined, '', 'reservas', 'https://otro.com', 'javascript:alert(1)']) {
    assert.equal(destinoSeguro(volver), DESTINO_POR_DEFECTO, String(volver));
  }
});

test('las formas de salir a otro sitio no se siguen', () => {
  for (const volver of ['//otro.com', '/\\otro.com', '/\\/otro.com', '/\t/otro.com', '/\n/otro.com', '\\\\otro.com']) {
    assert.equal(destinoSeguro(volver), DESTINO_POR_DEFECTO, JSON.stringify(volver));
  }
});
