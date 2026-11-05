import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ID, TOKEN, leer, pedido } from '../../_pruebas.js';

// Lo que devuelven los adaptadores falsos; cada test lo ajusta
const estado = vi.hoisted(() => ({ reserva: null, llamadas: [] }));

vi.mock('../../../../src/servidor/supabase.js', async () => {
  const { usuarioFalso: falso } = await import('../../_pruebas.js');
  return { usuarioDelPedido: async (p) => falso(p, { id: 'u-1' }) };
});
vi.mock('../../../../src/servidor/base.js', () => ({
  crearBase: () => ({
    leerReserva: async () => estado.reserva,
    crearPago: async (datos) => {
      estado.llamadas.push(['crearPago', datos]);
      return { id: 'p-1', monto: datos.monto };
    },
    guardarPreferencia: async (...args) => estado.llamadas.push(['guardarPreferencia', ...args]),
  }),
}));
vi.mock('../../../../src/servidor/mercadopago.js', () => ({
  crearMercadoPago: () => ({
    crearPreferencia: async (cuerpo) => {
      estado.llamadas.push(['crearPreferencia', cuerpo]);
      return { id: 'pref-1', init_point: 'https://mercadopago.test/pagar' };
    },
  }),
}));

const { POST } = await import('./route.js');

// Reserva recién creada: el plazo de 15 minutos todavía corre
const reservaPropia = () => ({
  id: ID, usuario_id: 'u-1', estado: 'esperando_pago', fecha: '2026-12-20', hora: '20:30:00',
  creada_en: new Date().toISOString(), locales: { nombre: 'La Posta Parrilla', sena: '10000.00' },
});

beforeEach(() => {
  estado.reserva = reservaPropia();
  estado.llamadas = [];
  vi.stubEnv('APP_URL', 'https://la-posta.test');
});

describe('POST /api/v1/pagos', () => {
  test('crea la preferencia con el monto de la base y responde 201 con el link de pago', async () => {
    const { status, cuerpo } = await leer(await POST(pedido('/api/v1/pagos', { metodo: 'POST', token: TOKEN, cuerpo: { reservaId: ID } })));
    expect(status).toBe(201);
    expect(cuerpo).toEqual({ initPoint: 'https://mercadopago.test/pagar' });
    expect(estado.llamadas[0]).toEqual(['crearPago', { reservaId: ID, monto: '10000.00' }]);
    const preferencia = estado.llamadas[1][1];
    expect(preferencia.external_reference).toBe('p-1');
    expect(preferencia.notification_url).toMatch(/^https:\/\/la-posta\.test\/api\/webhooks\/mercadopago/);
    expect(estado.llamadas[2]).toEqual(['guardarPreferencia', 'p-1', 'pref-1']);
  });

  test('el monto que manda el navegador se ignora', async () => {
    await POST(pedido('/api/v1/pagos', { metodo: 'POST', token: TOKEN, cuerpo: { reservaId: ID, monto: 1 } }));
    expect(estado.llamadas[0][1].monto).toBe('10000.00');
  });

  test('sin sesión responde 401 y no crea nada', async () => {
    const { status, cuerpo } = await leer(await POST(pedido('/api/v1/pagos', { metodo: 'POST', cuerpo: { reservaId: ID } })));
    expect(status).toBe(401);
    expect(cuerpo.error).toMatch(/Ingresá/);
    expect(estado.llamadas).toEqual([]);
  });

  test('con una sesión vencida responde 401', async () => {
    const { status } = await leer(await POST(pedido('/api/v1/pagos', { metodo: 'POST', token: 'otro', cuerpo: { reservaId: ID } })));
    expect(status).toBe(401);
  });

  test('un reservaId que no es un uuid es un 400', async () => {
    const { status, cuerpo } = await leer(await POST(pedido('/api/v1/pagos', { metodo: 'POST', token: TOKEN, cuerpo: { reservaId: '12' } })));
    expect(status).toBe(400);
    expect(cuerpo.error).toBe('Datos inválidos: reservaId.');
  });

  test('un cuerpo que no es JSON es un 400', async () => {
    const { status, cuerpo } = await leer(await POST(pedido('/api/v1/pagos', { metodo: 'POST', token: TOKEN, cuerpo: '{roto' })));
    expect(status).toBe(400);
    expect(cuerpo.error).toMatch(/JSON/);
  });

  test('la reserva de otro usuario es un 404', async () => {
    estado.reserva = { ...reservaPropia(), usuario_id: 'u-2' };
    const { status } = await leer(await POST(pedido('/api/v1/pagos', { metodo: 'POST', token: TOKEN, cuerpo: { reservaId: ID } })));
    expect(status).toBe(404);
  });

  test('una reserva que ya no espera el pago es un 409', async () => {
    estado.reserva = { ...reservaPropia(), estado: 'confirmada' };
    const { status } = await leer(await POST(pedido('/api/v1/pagos', { metodo: 'POST', token: TOKEN, cuerpo: { reservaId: ID } })));
    expect(status).toBe(409);
  });

  test('si Mercado Pago o la base fallan responde 500 sin detalles internos', async () => {
    estado.reserva = { ...reservaPropia(), locales: null }; // rompe al leer la seña
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { status, cuerpo } = await leer(await POST(pedido('/api/v1/pagos', { metodo: 'POST', token: TOKEN, cuerpo: { reservaId: ID } })));
    expect(status).toBe(500);
    expect(cuerpo).toEqual({ error: 'Algo salió mal. Probá de nuevo en un momento.' });
    expect(consola).toHaveBeenCalled();
    consola.mockRestore();
  });
});
