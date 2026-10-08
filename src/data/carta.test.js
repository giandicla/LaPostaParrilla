// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCarta } from './carta.js';
import { LOCALES } from './locales.js';

const ids = (carta) => carta.secciones.map((seccion) => seccion.id);

test('la carta de vinos es la misma en los dos locales', () => {
  const [primero, ...resto] = LOCALES.map((local) => getCarta(local.id));
  const vinos = (carta) => carta.secciones.filter((s) => s.grupo === 'Vinos' || s.id === 'copas-y-descorche');
  assert.ok(vinos(primero).length > 0);
  for (const carta of resto) assert.deepEqual(vinos(carta), vinos(primero));
});

test('La Posta II Restaurante tiene vinos y copas', () => {
  const secciones = ids(getCarta('restaurante'));
  assert.ok(secciones.includes('vinos-malbec'));
  assert.ok(secciones.includes('copas-y-descorche'));
});

test('ninguna carta repite una sección', () => {
  for (const local of LOCALES) {
    const secciones = ids(getCarta(local.id));
    assert.equal(new Set(secciones).size, secciones.length, local.id);
  }
});

test('los vinos van al final, después de la comida y las bebidas', () => {
  const secciones = getCarta('restaurante').secciones;
  const primerVino = secciones.findIndex((s) => s.grupo === 'Vinos');
  assert.ok(secciones.slice(primerVino).every((s) => s.grupo === 'Vinos' || s.id === 'copas-y-descorche'));
});

test('un local sin carta cargada devuelve null', () => {
  assert.equal(getCarta('otro'), null);
});
