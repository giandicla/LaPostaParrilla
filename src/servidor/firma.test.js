import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { validarFirma } from './firma.js';

const SECRETO = 'secreto-de-prueba';
// Como firma Mercado Pago: HMAC-SHA256 de "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
const firmar = ({ idDato, idPedido, ts }, secreto = SECRETO) =>
  `ts=${ts},v1=${createHmac('sha256', secreto).update(`id:${idDato};request-id:${idPedido};ts:${ts};`).digest('hex')}`;

const aviso = { idDato: '123456789', idPedido: 'req-1', ts: '1760550000' };

test('acepta una firma válida', () => {
  assert.equal(validarFirma({ firma: firmar(aviso), idPedido: aviso.idPedido, idDato: aviso.idDato, secreto: SECRETO }), true);
});

test('rechaza si cambió el id del pago', () => {
  assert.equal(validarFirma({ firma: firmar(aviso), idPedido: aviso.idPedido, idDato: '999', secreto: SECRETO }), false);
});

test('rechaza una firma hecha con otro secreto', () => {
  assert.equal(validarFirma({ firma: firmar(aviso, 'otro'), idPedido: aviso.idPedido, idDato: aviso.idDato, secreto: SECRETO }), false);
});

test('rechaza cabeceras faltantes o mal formadas', () => {
  for (const firma of [null, '', 'v1=abc', 'ts=1,v1=no-es-hex']) {
    assert.equal(validarFirma({ firma, idPedido: aviso.idPedido, idDato: aviso.idDato, secreto: SECRETO }), false);
  }
  assert.equal(validarFirma({ firma: firmar(aviso), idPedido: aviso.idPedido, idDato: aviso.idDato, secreto: '' }), false);
});

test('un id alfanumérico se firma en minúsculas', () => {
  const conLetras = { ...aviso, idDato: 'abc123' };
  assert.equal(validarFirma({ firma: firmar(conLetras), idPedido: aviso.idPedido, idDato: 'ABC123', secreto: SECRETO }), true);
});
