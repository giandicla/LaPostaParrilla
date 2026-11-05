import { beforeEach, describe, expect, test, vi } from 'vitest';
import { leer, pedido } from '../../_pruebas.js';

const estado = vi.hoisted(() => ({ filas: null, filasVinos: null, llamadas: [], clientes: [] }));

vi.mock('../../../../src/servidor/supabase.js', () => ({
  clientePublico: () => {
    estado.clientes.push('publico');
    return 'cliente-publico';
  },
}));
vi.mock('../../../../src/servidor/carta-base.js', async () => {
  const { baseCartaFalsa } = await import('../../_pruebas.js');
  return { crearBaseCarta: baseCartaFalsa(estado) };
});

const { GET } = await import('./route.js');
const { GET: GET_VINOS } = await import('./vinos/route.js');

const S1 = '11111111-1111-4111-8111-111111111111';
const S2 = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
  estado.llamadas = [];
  estado.clientes = [];
  // Desordenadas a propósito: la ruta las devuelve por `orden`
  estado.filas = {
    cubierto: 3000,
    secciones: [
      { id: S2, slug: 'parrilla-carnes', local_id: 'parrilla', titulo: 'Carnes', orden: 2 },
      { id: S1, slug: 'parrilla-entradas', local_id: 'parrilla', titulo: 'Entradas', orden: 1 },
    ],
    items: [
      { id: 'i-2', seccion_id: S1, nombre: 'Provoleta', precio: 9000, orden: 2 },
      { id: 'i-1', seccion_id: S1, nombre: 'Empanada', precio: 3500, descripcion: null, orden: 1 },
      { id: 'i-3', seccion_id: S2, nombre: 'Vacío', precio: 25000, orden: 1 },
    ],
  };
  estado.filasVinos = {
    cubierto: null,
    secciones: [{ id: S1, slug: 'vinos-tintos', local_id: null, titulo: 'Tintos', grupo: 'Vinos', orden: 1 }],
    items: [
      { id: 'v-2', seccion_id: S1, nombre: 'Malbec Reserva', bodega: 'Chacra', region: 'Río Negro', precio: 60000, orden: 2 },
      { id: 'v-1', seccion_id: S1, nombre: 'Pinot Noir', bodega: 'Chacra', region: 'Río Negro', precio: 50000, orden: 1 },
    ],
  };
});

describe('GET /api/v1/carta', () => {
  test('arma la carta del local en orden, con el cliente público', async () => {
    const respuesta = await GET(pedido('/api/v1/carta?local=parrilla'));
    const { status, cuerpo } = await leer(respuesta);
    expect(status).toBe(200);
    expect(estado.clientes).toEqual(['publico']);
    expect(cuerpo.cubierto).toBe(3000);
    expect(cuerpo.secciones.map((s) => s.id)).toEqual(['parrilla-entradas', 'parrilla-carnes']);
    expect(cuerpo.secciones[0].items).toEqual([
      { id: 'i-1', nombre: 'Empanada', precio: 3500 },
      { id: 'i-2', nombre: 'Provoleta', precio: 9000 },
    ]);
  });

  test('se cachea en Vercel un minuto', async () => {
    const respuesta = await GET(pedido('/api/v1/carta?local=parrilla'));
    expect(respuesta.headers.get('cache-control')).toBe('public, s-maxage=60, stale-while-revalidate=300');
  });

  test('con ?fresca=1 (el panel) no se cachea', async () => {
    const respuesta = await GET(pedido('/api/v1/carta?local=parrilla&fresca=1'));
    expect(respuesta.headers.get('cache-control')).toBe('no-store');
  });

  test('sin local es un 400', async () => {
    const { status, cuerpo } = await leer(await GET(pedido('/api/v1/carta')));
    expect(status).toBe(400);
    expect(cuerpo.error).toBe('Falta el local.');
  });

  test('un local con caracteres raros es un 404 sin consultar la base', async () => {
    const { status } = await leer(await GET(pedido('/api/v1/carta?local=../admin')));
    expect(status).toBe(404);
    expect(estado.clientes).toEqual([]);
  });

  test('un local que no existe es un 404', async () => {
    estado.filas = null;
    const { status, cuerpo } = await leer(await GET(pedido('/api/v1/carta?local=heladeria')));
    expect(status).toBe(404);
    expect(cuerpo.error).toBe('No encontramos ese local.');
  });
});

describe('GET /api/v1/carta/vinos', () => {
  test('agrupa los vinos por bodega, en orden, y marca la sección como compartida', async () => {
    const { status, cuerpo } = await leer(await GET_VINOS(pedido('/api/v1/carta/vinos')));
    expect(status).toBe(200);
    expect(cuerpo.cubierto).toBe(null);
    expect(cuerpo.secciones[0]).toMatchObject({ id: 'vinos-tintos', grupo: 'Vinos', compartida: true });
    expect(cuerpo.secciones[0].bodegas).toEqual([
      {
        bodega: 'Chacra', region: 'Río Negro',
        vinos: [{ id: 'v-1', nombre: 'Pinot Noir', precio: 50000 }, { id: 'v-2', nombre: 'Malbec Reserva', precio: 60000 }],
      },
    ]);
  });

  test('mismo caché que la carta de un local, y sin caché con ?fresca=1', async () => {
    expect((await GET_VINOS(pedido('/api/v1/carta/vinos'))).headers.get('cache-control')).toMatch(/s-maxage=60/);
    expect((await GET_VINOS(pedido('/api/v1/carta/vinos?fresca=1'))).headers.get('cache-control')).toBe('no-store');
  });
});
