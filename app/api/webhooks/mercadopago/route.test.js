import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ID, leer, pedido } from '../../_pruebas.js';

const SECRETO = 'secreto-del-webhook';
const ID_PAGO_MP = '1354726481';

// pagoMp: lo que devuelve GET /v1/payments/:id. pagoLocal: si existe la fila en pagos.
const estado = vi.hoisted(() => ({ pagoMp: null, pagoLocal: null, acreditado: 'confirmada', llamadas: [] }));

vi.mock('../../../../src/servidor/base.js', () => ({
  crearBase: () => ({
    leerPago: async () => estado.pagoLocal,
    acreditarPago: async (...args) => {
      estado.llamadas.push(['acreditarPago', ...args]);
      return estado.acreditado;
    },
    confirmarReintegro: async (...args) => estado.llamadas.push(['confirmarReintegro', ...args]),
  }),
}));
vi.mock('../../../../src/servidor/mercadopago.js', () => ({
  crearMercadoPago: () => ({
    obtenerPago: async (id) => {
      estado.llamadas.push(['obtenerPago', id]);
      if (!estado.pagoMp) throw Object.assign(new Error('not found'), { status: 404 });
      return estado.pagoMp;
    },
    reintegrar: async (...args) => estado.llamadas.push(['reintegrar', ...args]),
  }),
}));

const { POST } = await import('./route.js');

// Un aviso firmado como lo firma Mercado Pago (ver src/servidor/firma.js)
function aviso({ idDato = ID_PAGO_MP, tipo = 'payment', secreto = SECRETO, idPedido = 'req-1' } = {}) {
  const ts = '1730800000';
  const v1 = createHmac('sha256', secreto).update(`id:${idDato};request-id:${idPedido};ts:${ts};`).digest('hex');
  return pedido(`/api/webhooks/mercadopago?data.id=${idDato}&type=${tipo}`, {
    metodo: 'POST',
    cuerpo: { action: 'payment.updated', data: { id: idDato } },
    headers: { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': idPedido },
  });
}

beforeEach(() => {
  vi.stubEnv('MP_WEBHOOK_SECRET', SECRETO);
  estado.pagoMp = { id: Number(ID_PAGO_MP), external_reference: ID, status: 'approved' };
  estado.pagoLocal = { id: ID };
  estado.acreditado = 'confirmada';
  estado.llamadas = [];
});

describe('POST /api/webhooks/mercadopago', () => {
  test('un pago aprobado se concilia con el estado real que da Mercado Pago', async () => {
    const { status, cuerpo } = await leer(await POST(aviso()));
    expect(status).toBe(200);
    expect(cuerpo).toEqual({ ok: true, estado: 'confirmada' });
    expect(estado.llamadas).toEqual([
      ['obtenerPago', ID_PAGO_MP],
      ['acreditarPago', ID, ID_PAGO_MP, 'approved'],
    ]);
  });

  test('con la firma hecha con otro secreto responde 401 y no consulta nada', async () => {
    const { status, cuerpo } = await leer(await POST(aviso({ secreto: 'otro' })));
    expect(status).toBe(401);
    expect(cuerpo).toEqual({ error: 'Firma inválida' });
    expect(estado.llamadas).toEqual([]);
  });

  test('sin x-signature responde 401', async () => {
    const sinFirma = pedido(`/api/webhooks/mercadopago?data.id=${ID_PAGO_MP}&type=payment`, { metodo: 'POST', cuerpo: {} });
    expect((await POST(sinFirma)).status).toBe(401);
  });

  test('si no está cargado el secreto, ningún aviso pasa', async () => {
    vi.stubEnv('MP_WEBHOOK_SECRET', '');
    expect((await POST(aviso())).status).toBe(401);
  });

  test('una firma válida para otro data.id no sirve', async () => {
    const firmado = aviso({ idDato: '999' });
    const cambiado = new Request(firmado.url.replace('data.id=999', `data.id=${ID_PAGO_MP}`), firmado);
    expect((await POST(cambiado)).status).toBe(401);
  });

  test('un aviso que no es de un pago se responde 200 sin tocar la base', async () => {
    const { status, cuerpo } = await leer(await POST(aviso({ tipo: 'merchant_order' })));
    expect(status).toBe(200);
    expect(cuerpo.estado).toBe('ignorado');
    expect(estado.llamadas).toEqual([]);
  });

  test('un pago que no salió de este sitio se ignora con 200, para que no se reintente', async () => {
    estado.pagoLocal = null;
    const { status, cuerpo } = await leer(await POST(aviso()));
    expect(status).toBe(200);
    expect(cuerpo.estado).toBe('ignorado');
  });

  test('un pago que Mercado Pago no encuentra se ignora con 200', async () => {
    estado.pagoMp = null;
    expect((await leer(await POST(aviso()))).cuerpo.estado).toBe('ignorado');
  });

  test('el aviso de un reembolso marca la seña como devuelta', async () => {
    estado.pagoMp.status = 'refunded';
    const { cuerpo } = await leer(await POST(aviso()));
    expect(cuerpo.estado).toBe('reintegrado');
    expect(estado.llamadas).toContainEqual(['confirmarReintegro', ID, ID_PAGO_MP]);
  });

  test('un pago aprobado que llegó tarde se reembolsa', async () => {
    estado.acreditado = 'reintegro_pendiente';
    const { cuerpo } = await leer(await POST(aviso()));
    expect(cuerpo.estado).toBe('reintegro_pedido');
    expect(estado.llamadas).toContainEqual(['reintegrar', ID_PAGO_MP, `reintegro-${ID_PAGO_MP}`]);
  });

  test('si la base falla responde 500, así Mercado Pago reintenta', async () => {
    estado.acreditado = Promise.reject(new Error('conexión caída'));
    estado.acreditado.catch(() => {});
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await POST(aviso())).status).toBe(500);
    consola.mockRestore();
  });
});
