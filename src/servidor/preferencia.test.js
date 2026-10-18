import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarPreferencia, esUrlPublica, venceLaReserva } from './preferencia.js';

const datos = {
  pago: { id: 'p-1', monto: '10000.00' },
  reserva: { id: 'r-1', fecha: '2026-10-18', hora: '20:30:00', creada_en: '2026-10-15T20:00:00.000Z' },
  nombreLocal: 'La Posta Parrilla',
};

test('el monto sale del pago (de la base) y es un número', () => {
  const [item] = armarPreferencia({ ...datos, appUrl: 'https://lapostaparrilla.vercel.app' }).items;
  assert.equal(item.unit_price, 10000);
  assert.equal(item.quantity, 1);
  assert.equal(item.currency_id, 'ARS');
  assert.equal(item.title, 'Seña reserva La Posta Parrilla · 18/10 20:30');
});

test('external_reference es el id del pago', () => {
  assert.equal(armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' }).external_reference, 'p-1');
});

test('con URL pública: auto_return, webhook y vuelta a /reservas/pago', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' });
  assert.equal(p.auto_return, 'approved');
  assert.equal(p.notification_url, 'https://x.vercel.app/api/webhooks/mercadopago');
  assert.equal(p.back_urls.success, 'https://x.vercel.app/reservas/pago?reserva=r-1');
});

test('en localhost: sin auto_return ni notification_url (Mercado Pago los rechaza)', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'http://localhost:3000' });
  assert.equal('auto_return' in p, false);
  assert.equal('notification_url' in p, false);
  assert.equal(p.back_urls.failure, 'http://localhost:3000/reservas/pago?reserva=r-1');
});

test('la preferencia vence junto con la reserva, a los 15 minutos', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' });
  assert.equal(p.expires, true);
  assert.equal(p.expiration_date_to, '2026-10-15T20:15:00.000Z');
  assert.equal(venceLaReserva('2026-10-15T20:00:00.000Z').toISOString(), '2026-10-15T20:15:00.000Z');
});

test('URL pública: HTTPS y no local', () => {
  assert.equal(esUrlPublica('https://lapostaparrilla.vercel.app'), true);
  assert.equal(esUrlPublica('http://lapostaparrilla.vercel.app'), false);
  assert.equal(esUrlPublica('https://localhost:3000'), false);
  assert.equal(esUrlPublica(undefined), false);
});
