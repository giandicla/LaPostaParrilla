// Las rutas con que el panel edita la carta: ítems, bodegas y cubierto.
// Todas piden sesión y que la cuenta sea admin.
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ID, TOKEN, contexto, leer, pedido } from '../../_pruebas.js';

const estado = vi.hoisted(() => ({ esAdmin: true, item: null, llamadas: [] }));

vi.mock('../../../../src/servidor/supabase.js', async () => {
  const { usuarioFalso, usuarioCarta } = await import('../../_pruebas.js');
  return { usuarioDelPedido: async (p) => usuarioFalso(p, usuarioCarta) };
});
vi.mock('../../../../src/servidor/carta-base.js', async () => {
  const { baseCartaFalsa } = await import('../../_pruebas.js');
  return { crearBaseCarta: baseCartaFalsa(estado) };
});

const { POST: crear } = await import('./items/route.js');
const { PATCH: editar, DELETE: borrar } = await import('./items/[id]/route.js');
const { PATCH: bodega } = await import('./secciones/[id]/bodegas/route.js');
const { PATCH: cubierto } = await import('./locales/[id]/route.js');

const SECCION = '33333333-3333-4333-8333-333333333333';
const vino = { id: ID, seccion_id: SECCION, nombre: 'Malbec', bodega: 'Chacra', precio: 60000 };
const enviar = (metodo, ruta, cuerpo, { token = TOKEN } = {}) => pedido(ruta, { metodo, token, cuerpo });

beforeEach(() => {
  estado.esAdmin = true;
  estado.item = { ...vino };
  estado.llamadas = [];
});

describe('POST /api/v1/carta/items', () => {
  test('crea el ítem y responde 201', async () => {
    const { status, cuerpo } = await leer(await crear(enviar('POST', '/api/v1/carta/items', { seccionId: SECCION, nombre: ' Malbec ', precio: 60000 })));
    expect(status).toBe(201);
    expect(cuerpo).toEqual(vino);
    // Zod recorta los espacios antes de llegar a la base
    expect(estado.llamadas[0]).toEqual(['crearItem', { seccionId: SECCION, nombre: 'Malbec', precio: 60000 }]);
  });

  test('un vino nuevo con región cambia la de toda su bodega', async () => {
    await crear(enviar('POST', '/api/v1/carta/items', { seccionId: SECCION, nombre: 'Malbec', precio: 60000, bodega: 'Chacra', region: 'Patagonia' }));
    expect(estado.llamadas).toContainEqual(['editarBodega', SECCION, 'Chacra', { region: 'Patagonia' }]);
  });

  test('sin precio ni precios es un 400', async () => {
    const { status, cuerpo } = await leer(await crear(enviar('POST', '/api/v1/carta/items', { seccionId: SECCION, nombre: 'Malbec' })));
    expect(status).toBe(400);
    expect(cuerpo.error).toBe('Datos inválidos: precio.');
  });

  test('un precio negativo o con decimales es un 400', async () => {
    for (const precio of [-1, 10.5, '1000']) {
      expect((await crear(enviar('POST', '/api/v1/carta/items', { seccionId: SECCION, nombre: 'Malbec', precio }))).status).toBe(400);
    }
    expect(estado.llamadas).toEqual([]);
  });

  test('una cuenta que no es admin recibe 403 y no se escribe nada', async () => {
    estado.esAdmin = false;
    const { status, cuerpo } = await leer(await crear(enviar('POST', '/api/v1/carta/items', { seccionId: SECCION, nombre: 'Malbec', precio: 1 })));
    expect(status).toBe(403);
    expect(cuerpo.error).toBe('Solo el admin puede editar la carta.');
    expect(estado.llamadas).toEqual([]);
  });

  test('sin sesión es un 401', async () => {
    expect((await crear(enviar('POST', '/api/v1/carta/items', { seccionId: SECCION, nombre: 'Malbec', precio: 1 }, { token: null }))).status).toBe(401);
  });
});

describe('PATCH y DELETE /api/v1/carta/items/:id', () => {
  test('edita los campos y responde el ítem', async () => {
    const { status, cuerpo } = await leer(await editar(enviar('PATCH', `/api/v1/carta/items/${ID}`, { precio: 65000 }), contexto({ id: ID })));
    expect(status).toBe(200);
    expect(cuerpo.id).toBe(ID);
    expect(estado.llamadas[0]).toEqual(['editarItem', ID, { precio: 65000 }]);
  });

  test('solo mover (arrastrar) ubica el ítem sin editarlo', async () => {
    const { cuerpo } = await leer(await editar(enviar('PATCH', `/api/v1/carta/items/${ID}`, { posicion: 2 }), contexto({ id: ID })));
    expect(cuerpo).toEqual({ id: ID });
    expect(estado.llamadas).toEqual([['ubicarItem', ID, 2]]);
  });

  test('una clave desconocida es un 400 (el esquema es estricto)', async () => {
    const { status } = await leer(await editar(enviar('PATCH', `/api/v1/carta/items/${ID}`, { mover: 'arriba' }), contexto({ id: ID })));
    expect(status).toBe(400);
  });

  test('un cuerpo vacío es un 400', async () => {
    expect((await editar(enviar('PATCH', `/api/v1/carta/items/${ID}`, {}), contexto({ id: ID }))).status).toBe(400);
  });

  test('un ítem que no existe es un 404', async () => {
    estado.item = null;
    const { status, cuerpo } = await leer(await editar(enviar('PATCH', `/api/v1/carta/items/${ID}`, { precio: 1 }), contexto({ id: ID })));
    expect(status).toBe(404);
    expect(cuerpo.error).toBe('No encontramos ese ítem.');
  });

  test('un id que no es uuid es un 400', async () => {
    expect((await editar(enviar('PATCH', '/api/v1/carta/items/12', { precio: 1 }), contexto({ id: '12' }))).status).toBe(400);
  });

  test('borrar responde 204 sin cuerpo', async () => {
    const respuesta = await borrar(enviar('DELETE', `/api/v1/carta/items/${ID}`), contexto({ id: ID }));
    expect(respuesta.status).toBe(204);
    expect(await respuesta.text()).toBe('');
    expect(estado.llamadas).toEqual([['borrarItem', ID]]);
  });

  test('borrar un ítem que no existe es un 404', async () => {
    estado.item = null;
    expect((await borrar(enviar('DELETE', `/api/v1/carta/items/${ID}`), contexto({ id: ID }))).status).toBe(404);
  });

  test('borrar sin ser admin es un 403', async () => {
    estado.esAdmin = false;
    expect((await borrar(enviar('DELETE', `/api/v1/carta/items/${ID}`), contexto({ id: ID }))).status).toBe(403);
  });
});

describe('PATCH /api/v1/carta/secciones/:id/bodegas', () => {
  test('cambia la región y ubica la bodega', async () => {
    const { status, cuerpo } = await leer(await bodega(
      enviar('PATCH', `/api/v1/carta/secciones/${SECCION}/bodegas`, { bodega: 'Chacra', region: 'Patagonia', posicion: 1 }),
      contexto({ id: SECCION })
    ));
    expect(status).toBe(200);
    expect(cuerpo).toEqual({ ok: true });
    expect(estado.llamadas).toEqual([
      ['ubicarBodega', SECCION, 'Chacra', 1],
      ['editarBodega', SECCION, 'Chacra', { region: 'Patagonia' }],
    ]);
  });

  test('sin región ni posición no hay nada que hacer: 400', async () => {
    const respuesta = await bodega(enviar('PATCH', `/api/v1/carta/secciones/${SECCION}/bodegas`, { bodega: 'Chacra' }), contexto({ id: SECCION }));
    expect(respuesta.status).toBe(400);
  });
});

describe('PATCH /api/v1/carta/locales/:id', () => {
  test('cambia el cubierto', async () => {
    const { status, cuerpo } = await leer(await cubierto(enviar('PATCH', '/api/v1/carta/locales/parrilla', { cubierto: 3500 }), contexto({ id: 'parrilla' })));
    expect(status).toBe(200);
    expect(cuerpo).toEqual({ cubierto: 3500 });
    expect(estado.llamadas).toEqual([['cambiarCubierto', 'parrilla', 3500]]);
  });

  test('un cubierto de cero es un 400', async () => {
    expect((await cubierto(enviar('PATCH', '/api/v1/carta/locales/parrilla', { cubierto: 0 }), contexto({ id: 'parrilla' }))).status).toBe(400);
  });

  test('un local con caracteres raros es un 404', async () => {
    expect((await cubierto(enviar('PATCH', '/api/v1/carta/locales/PARRILLA', { cubierto: 1 }), contexto({ id: 'PARRILLA' }))).status).toBe(404);
  });
});
