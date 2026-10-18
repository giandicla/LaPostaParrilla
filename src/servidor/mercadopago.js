// SDK oficial de Mercado Pago. Con credenciales de PRUEBA (vendedor de prueba):
// no hay sandbox, la API es la real y lo que cambia son las credenciales.

import { MercadoPagoConfig, Payment, PaymentRefund, Preference } from 'mercadopago';

export function crearMercadoPago(accessToken = process.env.MP_ACCESS_TOKEN) {
  if (!accessToken) throw new Error('Falta MP_ACCESS_TOKEN');
  const cliente = new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
  return {
    crearPreferencia: (body) => new Preference(cliente).create({ body }),
    obtenerPago: (id) => new Payment(cliente).get({ id }),
    reintegrar: (idPagoMp, claveIdempotencia) =>
      new PaymentRefund(cliente).create({
        payment_id: idPagoMp,
        body: {},
        requestOptions: { idempotencyKey: claveIdempotencia },
      }),
  };
}
