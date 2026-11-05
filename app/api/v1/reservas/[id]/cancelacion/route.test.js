import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ErrorHttp } from '../../../../../../src/servidor/respuestas.js';
import { ID, TOKEN, contexto, leer, pedido } from '../../../../_pruebas.js';

// reserva: la que ve el usuario bajo la RLS. errorCancelar: lo que tira la base al cancelar.
const estado = vi.hoisted(() => ({ reserva: null, pagos: [], errorCancelar: null, falloMp: false, llamadas: [] }));

vi.mock('../../../../../../src/servidor/supabase.js', async () => {
  const { usuarioFalso } = await import('../../../../_pruebas.js');
  return {
    usuarioDelPedido: async (p) => usuarioFalso(p, {
      id: 'u-1',
      leerReserva: async () => estado.reserva,
      cancelar: async (...args) => {
        if (estado.errorCancelar) throw estado.errorCancelar;
        estado.llamadas.push(['cancelar', ...args]);
      },
    }),
  };
});
vi.mock('../../../../../../src/servidor/base.js', () => ({
  crearBase: () => ({ pagosAReintegrar: async () => estado.pagos }),
}));
vi.mock('../../../../../../src/servidor/mercadopago.js', () => ({
  crearMercadoPago: () => ({
    reintegrar: async (...args) => {
      if (estado.falloMp) throw new Error('Mercado Pago no responde');
      estado.llamadas.push(['reintegrar', ...args]);
    },
  }),
}));

const { POST } = await import('./route.js');

const cancelar = (cuerpo, { id = ID, token = TOKEN } = {}) =>
  POST(pedido(`/api/v1/reservas/${id}/cancelacion`, { metodo: 'POST', token, cuerpo }), contexto({ id }));

beforeEach(() => {
  estado.reserva = { id: ID, estado: 'confirmada' };
  estado.pagos = [{ id: 'p-1', mp_payment_id: '555' }];
  estado.errorCancelar = null;
  estado.falloMp = false;
  estado.llamadas = [];
});

describe('POST /api/v1/reservas/:id/cancelacion', () => {
  test('cancela y pide el reembolso de la seña', async () => {
    const { status, cuerpo } = await leer(await cancelar({ motivo: 'Cerramos por lluvia' }));
    expect(status).toBe(200);
    expect(cuerpo).toEqual({ reintegro: 'pedido' });
    expect(estado.llamadas).toEqual([
      ['cancelar', ID, 'Cerramos por lluvia'],
      ['reintegrar', '555', 'reintegro-555'],
    ]);
  });

  test('sin cuerpo cancela sin motivo (el cliente desde Mis reservas)', async () => {
    estado.pagos = [];
    const { status, cuerpo } = await leer(await cancelar(undefined));
    expect(status).toBe(200);
    expect(cuerpo).toEqual({ reintegro: 'no_corresponde' });
    expect(estado.llamadas).toEqual([['cancelar', ID, undefined]]);
  });

  test('si Mercado Pago falla la reserva queda cancelada y avisa "fallo"', async () => {
    estado.falloMp = true;
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { status, cuerpo } = await leer(await cancelar({}));
    expect(status).toBe(200);
    expect(cuerpo).toEqual({ reintegro: 'fallo' });
    expect(estado.llamadas).toEqual([['cancelar', ID, undefined]]);
    consola.mockRestore();
  });

  test('sobre una reserva ya cancelada solo reintenta el reembolso', async () => {
    estado.reserva.estado = 'cancelada';
    const { cuerpo } = await leer(await cancelar({}));
    expect(cuerpo).toEqual({ reintegro: 'pedido' });
    expect(estado.llamadas).toEqual([['reintegrar', '555', 'reintegro-555']]);
  });

  test('una reserva cancelada sin nada que devolver es un 409', async () => {
    estado.reserva.estado = 'cancelada';
    estado.pagos = [];
    expect((await cancelar({})).status).toBe(409);
  });

  test('una regla de la base (menos de 1 hora) llega como 409 con su mensaje', async () => {
    estado.errorCancelar = new ErrorHttp(409, 'Solo se puede cancelar hasta 1 hora antes.');
    const { status, cuerpo } = await leer(await cancelar({}));
    expect(status).toBe(409);
    expect(cuerpo.error).toBe('Solo se puede cancelar hasta 1 hora antes.');
  });

  test('una reserva que el usuario no ve es un 404', async () => {
    estado.reserva = null;
    expect((await cancelar({})).status).toBe(404);
  });

  test('un id que no es uuid es un 400, antes de mirar la sesión', async () => {
    const { status, cuerpo } = await leer(await cancelar({}, { id: 'abc', token: null }));
    expect(status).toBe(400);
    expect(cuerpo.error).toBe('Ese id de reserva no es válido.');
  });

  test('un motivo de más de 120 caracteres es un 400', async () => {
    const { status, cuerpo } = await leer(await cancelar({ motivo: 'x'.repeat(121) }));
    expect(status).toBe(400);
    expect(cuerpo.error).toBe('Datos inválidos: motivo.');
  });

  test('sin sesión es un 401', async () => {
    expect((await cancelar({}, { token: null })).status).toBe(401);
  });
});
