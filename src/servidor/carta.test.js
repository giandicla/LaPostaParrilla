import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarCarta } from './carta.js';

const seccion = (id, slug, local_id, orden, extra = {}) => ({
  id, slug, local_id, orden, titulo: slug, grupo: null, nota: null, tamanos: null, ...extra,
});
const item = (seccion_id, nombre, orden, extra = {}) => ({
  id: `i-${nombre}`, seccion_id, nombre, orden, descripcion: null, traduccion: null, detalle: null,
  bodega: null, region: null, precio: 1000, precios: null, ...extra,
});
const vino = (nombre, bodega, orden) => item('s-v', nombre, orden, { bodega, region: 'Mendoza' });

test('las secciones del local van antes que las compartidas', () => {
  const carta = armarCarta({
    cubierto: 1500,
    secciones: [seccion('s-v', 'vinos-x', null, 1), seccion('s-b', 'b', 'parrilla', 2), seccion('s-a', 'a', 'parrilla', 1)],
    items: [],
  });
  assert.deepEqual(carta.secciones.map((s) => s.id), ['a', 'b', 'vinos-x']);
  assert.equal(carta.secciones[0].idSeccion, 's-a');
  assert.equal(carta.cubierto, 1500);
});

const vinos = (extra = []) =>
  armarCarta({
    cubierto: null,
    secciones: [seccion('s-v', 'vinos-malbec', null, 1, { grupo: 'Vinos' })],
    items: [vino('Uno', 'Zuccardi', 1), vino('Dos', 'Catena', 2), vino('Tres', 'Zuccardi', 3), ...extra],
  }).secciones[0];

test('agrupa los vinos por bodega en el orden de su primer vino', () => {
  const seccionVinos = vinos();
  assert.equal(seccionVinos.items, undefined);
  assert.deepEqual(seccionVinos.bodegas.map((b) => b.bodega), ['Zuccardi', 'Catena']);
  assert.deepEqual(seccionVinos.bodegas[0].vinos.map((v) => v.nombre), ['Uno', 'Tres']);
  assert.equal(seccionVinos.bodegas[0].region, 'Mendoza');
});

test('un vino nuevo de una bodega existente queda dentro de su bodega', () => {
  const seccionVinos = vinos([vino('Nuevo', 'Catena', 9)]);
  assert.deepEqual(seccionVinos.bodegas.map((b) => b.bodega), ['Zuccardi', 'Catena']);
  assert.deepEqual(seccionVinos.bodegas[1].vinos.map((v) => v.nombre), ['Dos', 'Nuevo']);
});

test('omite los campos nulos', () => {
  const carta = armarCarta({
    cubierto: null,
    secciones: [seccion('s-a', 'a', 'parrilla', 1)],
    items: [item('s-a', 'Chorizo', 1, { traduccion: 'Sausage' })],
  });
  const [chorizo] = carta.secciones[0].items;
  assert.deepEqual(chorizo, { id: 'i-Chorizo', nombre: 'Chorizo', traduccion: 'Sausage', precio: 1000 });
  assert.equal('nota' in carta.secciones[0], false);
});

test('los precios por tamaño pasan como precios', () => {
  const carta = armarCarta({
    cubierto: null,
    secciones: [seccion('s-p', 'pizzas', 'restaurante', 1, { tamanos: ['Chica', 'Grande'] })],
    items: [item('s-p', 'Muzzarella', 1, { precio: null, precios: [21000, 30000] })],
  });
  const [pizza] = carta.secciones[0].items;
  assert.deepEqual(pizza.precios, [21000, 30000]);
  assert.equal('precio' in pizza, false);
  assert.deepEqual(carta.secciones[0].tamanos, ['Chica', 'Grande']);
});

test('los ítems van por su orden', () => {
  const carta = armarCarta({
    cubierto: null,
    secciones: [seccion('s-a', 'a', 'parrilla', 1)],
    items: [item('s-a', 'Segundo', 2), item('s-a', 'Primero', 1)],
  });
  assert.deepEqual(carta.secciones[0].items.map((i) => i.nombre), ['Primero', 'Segundo']);
});
