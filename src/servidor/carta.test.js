import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarCarta, borrarItem, cambiarCubierto, crearItem, editarBodega, editarItem, leerCarta } from './carta.js';
import { ErrorHttp } from './respuestas.js';

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

test('marca las secciones compartidas por los dos locales', () => {
  const carta = armarCarta({
    cubierto: null,
    secciones: [seccion('s-v', 'vinos-x', null, 1), seccion('s-a', 'a', 'parrilla', 1)],
    items: [],
  });
  assert.deepEqual(carta.secciones.map((s) => s.compartida), [undefined, true]);
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

// ---------- Casos de uso ----------
function baseFalsa({ admin = true, existe = true } = {}) {
  const llamadas = [];
  const anotar = (nombre, resultado) => async (...args) => { llamadas.push([nombre, ...args]); return resultado; };
  return {
    llamadas,
    esAdmin: async () => admin,
    leerFilas: async () => (existe ? { cubierto: 1500, secciones: [], items: [] } : null),
    crearItem: anotar('crearItem', { id: 'nuevo' }),
    editarItem: anotar('editarItem', existe ? { id: 'i-1' } : null),
    borrarItem: anotar('borrarItem', existe),
    moverItem: anotar('moverItem', existe),
    editarBodega: anotar('editarBodega'),
    moverBodega: anotar('moverBodega'),
    cambiarCubierto: anotar('cambiarCubierto'),
  };
}
const con = (status) => (e) => e instanceof ErrorHttp && e.status === status;

test('un no admin no puede editar la carta', async () => {
  const base = baseFalsa({ admin: false });
  await assert.rejects(crearItem({ seccionId: 's', nombre: 'X', precio: 1 }, { base }), con(403));
  await assert.rejects(editarItem('i-1', { precio: 1 }, { base }), con(403));
  await assert.rejects(borrarItem('i-1', { base }), con(403));
  await assert.rejects(editarBodega('s', { bodega: 'Catena', region: 'Mendoza' }, { base }), con(403));
  await assert.rejects(cambiarCubierto('parrilla', 1800, { base }), con(403));
  assert.deepEqual(base.llamadas, []);
});

test('editar con mover sube o baja el ítem', async () => {
  const base = baseFalsa();
  await editarItem('i-1', { mover: 'arriba' }, { base });
  await editarItem('i-1', { mover: 'abajo', precio: 7000 }, { base });
  assert.deepEqual(base.llamadas, [['moverItem', 'i-1', -1], ['moverItem', 'i-1', 1], ['editarItem', 'i-1', { precio: 7000 }]]);
});

test('borrar o editar un ítem que no existe da 404', async () => {
  const base = baseFalsa({ existe: false });
  await assert.rejects(borrarItem('i-1', { base }), con(404));
  await assert.rejects(editarItem('i-1', { precio: 1 }, { base }), con(404));
  await assert.rejects(editarItem('i-1', { mover: 'arriba' }, { base }), con(404));
});

test('leer un local inexistente da 404', async () => {
  await assert.rejects(leerCarta('otro', { base: baseFalsa({ existe: false }) }), con(404));
});

test('una bodega se mueve entera o cambia de región', async () => {
  const base = baseFalsa();
  await editarBodega('s', { bodega: 'Catena', mover: 'abajo' }, { base });
  await editarBodega('s', { bodega: 'Catena', region: 'Mendoza' }, { base });
  assert.deepEqual(base.llamadas, [['moverBodega', 's', 'Catena', 1], ['editarBodega', 's', 'Catena', { region: 'Mendoza' }]]);
});
