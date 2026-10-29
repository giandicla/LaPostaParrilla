// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscarEnCarta, datosDeLaCaja, posicionTrasArrastre } from './editorCarta.js';

const carta = {
  cubierto: 1500,
  secciones: [
    { id: 'ensaladas', idSeccion: 's-e', titulo: 'Ensaladas', items: [
      { id: 'i-1', nombre: 'RÚCULA Y PARMESANO', precio: 16000 },
      { id: 'i-2', nombre: 'ENSALADA MIXTA', precio: 12500 },
    ] },
    { id: 'vinos-malbec', idSeccion: 's-m', titulo: 'Malbec', grupo: 'Vinos', bodegas: [
      { bodega: 'Aleanna', region: 'Valle de Uco', vinos: [{ id: 'v-1', nombre: 'EL ENEMIGO', precio: 46000 }] },
    ] },
  ],
};

test('busca sin mayúsculas ni tildes', () => {
  const [encontrado] = buscarEnCarta(carta, 'rucula');
  assert.equal(encontrado.item.nombre, 'RÚCULA Y PARMESANO');
  assert.equal(encontrado.seccion.idSeccion, 's-e');
});

test('busca también en los vinos, con su bodega', () => {
  const [encontrado] = buscarEnCarta(carta, 'enemigo');
  assert.equal(encontrado.item.id, 'v-1');
  assert.equal(encontrado.bodega.bodega, 'Aleanna');
});

test('con menos de dos letras no busca', () => {
  assert.deepEqual(buscarEnCarta(carta, 'r'), []);
  assert.deepEqual(buscarEnCarta(carta, '  '), []);
});

test('al soltar sobre una fila, el arrastrado toma su lugar', () => {
  // Bajando, queda después del destino: [b, c, a, d]
  assert.equal(posicionTrasArrastre(['a', 'b', 'c', 'd'], 'a', 'c'), 3);
  // Subiendo, queda antes: [d, a, b, c]
  assert.equal(posicionTrasArrastre(['a', 'b', 'c', 'd'], 'd', 'a'), 1);
  assert.equal(posicionTrasArrastre(['a', 'b', 'c', 'd'], 'b', 'd'), 4);
  assert.equal(posicionTrasArrastre(['a', 'b', 'c', 'd'], 'c', 'b'), 2);
});

const pizzas = { idSeccion: 's-p', tamanos: ['Chica', 'Grande'] };
const entradas = { idSeccion: 's-n' };
const pizza = { id: 'p-1', nombre: 'MUZZARELLA', precios: [21000, 30000], traduccion: 'Tomato sauce' };
const valores = (extra = {}) => ({
  nombre: 'MUZZARELLA', precio: '', precios: ['21000', '30000'], descripcion: '', traduccion: 'Tomato sauce',
  detalle: '', bodega: '', region: '', ...extra,
});

test('una pizza que pasa a una categoría sin tamaños manda un solo precio', () => {
  const datos = datosDeLaCaja(valores({ precio: '9.000' }), entradas, pizza, pizzas);
  assert.deepEqual(datos, { seccionId: 's-n', precio: 9000, precios: null });
});

test('sin cambios no manda nada', () => {
  assert.deepEqual(datosDeLaCaja(valores(), pizzas, pizza, pizzas), {});
});

test('un texto vaciado se borra', () => {
  assert.deepEqual(datosDeLaCaja(valores({ traduccion: '  ' }), pizzas, pizza, pizzas), { traduccion: null });
});

test('al agregar manda todo, con la categoría', () => {
  const datos = datosDeLaCaja(valores({ nombre: 'Provoleta', precios: [], precio: '$ 18.000' }), entradas, null, null);
  assert.deepEqual(datos, { seccionId: 's-n', nombre: 'Provoleta', precio: 18000, traduccion: 'Tomato sauce' });
});
