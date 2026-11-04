// SDK oficial de Mercado Pago, solo con credenciales de PRUEBA. Con las TEST-
// de la aplicación (modo sandbox) el checkout se abre en sandbox_init_point y
// se pueden pedir reembolsos; con las del vendedor de prueba Mercado Pago
// rechaza los reembolsos (401 "live credentials", hallazgos.md 1.18).

import { MercadoPagoConfig, Payment, PaymentRefund, Preference } from 'mercadopago';

export function crearMercadoPago(accessToken = process.env.MP_ACCESS_TOKEN) {
  if (!accessToken) throw new Error('Falta MP_ACCESS_TOKEN');
  const cliente = new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
  const sandbox = accessToken.startsWith('TEST-');
  return {
    crearPreferencia: async (body) => {
      const preferencia = await new Preference(cliente).create({ body });
      return { id: preferencia.id, init_point: sandbox ? preferencia.sandbox_init_point : preferencia.init_point };
    },
    obtenerPago: (id) => new Payment(cliente).get({ id }),
    reintegrar: (idPagoMp, claveIdempotencia) =>
      new PaymentRefund(cliente).create({
        payment_id: idPagoMp,
        body: {},
        requestOptions: { idempotencyKey: claveIdempotencia },
      }),
  };
}
