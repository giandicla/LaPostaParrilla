// Validación de la firma de los webhooks de Mercado Pago (clase 11: sin esto,
// cualquiera podría mandar avisos falsos y confirmar reservas sin pagar).
//
// x-signature trae "ts=<timestamp>,v1=<hmac>". El HMAC-SHA256, con la clave
// secreta del panel, es del manifiesto "id:<data.id>;request-id:<x-request-id>;ts:<ts>;".

import { createHmac, timingSafeEqual } from 'node:crypto';

export function validarFirma({ firma, idPedido, idDato, secreto }) {
  if (!firma || !idPedido || !idDato || !secreto) return false;

  const partes = Object.fromEntries(
    firma.split(',').map((parte) => parte.split('=').map((texto) => texto.trim()))
  );
  const { ts, v1 } = partes;
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;

  // Si el id es alfanumérico, Mercado Pago lo firma en minúsculas
  const manifiesto = `id:${String(idDato).toLowerCase()};request-id:${idPedido};ts:${ts};`;
  const esperada = createHmac('sha256', secreto).update(manifiesto).digest();
  return timingSafeEqual(esperada, Buffer.from(v1, 'hex'));
}
