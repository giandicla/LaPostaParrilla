import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traducir } from './carta-base.js';

test('una categoría que no existe (clave foránea, 23503) es un 404 con aviso, no un 500', () => {
  const error = traducir({ code: '23503', message: 'insert or update on table "carta_items" violates foreign key constraint' });
  assert.equal(error.status, 404);
  assert.equal(error.message, 'No encontramos esa categoría.');
});

test('las reglas de la base (P0001) llegan como 400 con su mensaje', () => {
  const error = traducir({ code: 'P0001', message: 'Indicá la bodega del vino.' });
  assert.equal(error.status, 400);
  assert.equal(error.message, 'Indicá la bodega del vino.');
});

test('sin permiso (42501) es un 403; un error desconocido no lleva status (500 genérico)', () => {
  assert.equal(traducir({ code: '42501' }).status, 403);
  assert.equal(traducir({ code: 'XX000', message: 'algo' }).status, undefined);
});
