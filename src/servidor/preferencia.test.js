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
  assert.equal(item.title, 'Seña reserva La Posta Parrilla · 18 de octubre 20:30');
});

test('external_reference es el id del pago', () => {
  assert.equal(armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' }).external_reference, 'p-1');
});

test('con URL pública: auto_return, webhook y vuelta a /reservas/pago', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' });
  assert.equal(p.auto_return, 'approved');
  assert.equal(p.notification_url, 'https://x.vercel.app/api/webhooks/mercadopago?source_news=webhooks');
  assert.equal(p.back_urls.success, 'https://x.vercel.app/reservas/pago?reserva=r-1');
});

test('una barra final en APP_URL no duplica la barra en las URLs', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app/' });
  assert.equal(p.back_urls.success, 'https://x.vercel.app/reservas/pago?reserva=r-1');
  assert.equal(p.notification_url, 'https://x.vercel.app/api/webhooks/mercadopago?source_news=webhooks');
});

test('solo medios que acreditan al instante: sin efectivo ni cajero (la reserva dura 15 minutos)', () => {
  const p = armarPreferencia({ ...datos, appUrl: 'https://x.vercel.app' });
  assert.equal(p.binary_mode, true);
  assert.deepEqual(p.payment_methods.excluded_payment_types, [{ id: 'ticket' }, { id: 'atm' }]);
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

test('esUrlPublica: la máquina propia en IPv6 y la red local no son públicas', () => {
  for (const url of [
    'https://[::1]:3000', 'https://127.0.0.2', 'https://0.0.0.0', 'https://192.168.0.10:3000',
    'https://10.0.0.5', 'https://172.16.4.1', 'https://172.31.255.1', 'https://169.254.1.1',
    'https://mi-pc.local', 'https://app.localhost', 'https://[fd12:3456::1]', 'https://[fe80::1]',
  ]) {
    assert.equal(esUrlPublica(url), false, url);
  }
});

test('esUrlPublica: dominios e IPs públicas sí lo son, aunque se parezcan a una local', () => {
  for (const url of ['https://172.32.0.1', 'https://8.8.8.8', 'https://local-posta.vercel.app', 'https://10x.com.ar']) {
    assert.equal(esUrlPublica(url), true, url);
  }
});
