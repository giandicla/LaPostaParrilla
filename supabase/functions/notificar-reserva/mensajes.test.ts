// deno test supabase/functions/notificar-reserva/mensajes.test.ts
import { assertEquals } from 'jsr:@std/assert@1';
import { armarMensajes, formatearCuando, type Reserva } from './mensajes.ts';

const base: Reserva = {
  id: 'x', usuario_id: 'u', local_id: 'parrilla', fecha: '2026-10-09', hora: '20:30:00',
  personas: 4, nombre: 'Ana <b>', telefono: '111', comentarios: null,
  estado: 'esperando_pago', cancelada_por: null, motivo_cancelacion: null, origen: 'web', mail: null,
};
// Cargada por el admin desde el panel: sin cuenta, confirmada, con o sin mail
const delLocal: Reserva = {
  ...base, usuario_id: null, origen: 'local', estado: 'confirmada', mail: 'ana@test.com',
};
const sitio = 'https://ejemplo.com';
const destinos = (m: { para: string }[]) => m.map((x) => x.para);

Deno.test('formatea fecha y hora en castellano', () => {
  assertEquals(formatearCuando('2026-10-09', '20:30:00'), 'viernes 9 de octubre, 20:30');
});

const confirmada: Reserva = { ...base, estado: 'confirmada' };

Deno.test('reserva nueva de la web (esperando el pago): no manda nada', () => {
  assertEquals(armarMensajes({ tipo: 'INSERT', reserva: base, anterior: null }, sitio).length, 0);
});

Deno.test('pago acreditado: le confirma al cliente y avisa al admin', () => {
  const m = armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio);
  assertEquals(destinos(m).sort(), ['admin', 'cliente']);
});

Deno.test('vencida o abandonada sin pagar: no manda nada', () => {
  const vencida = { ...base, estado: 'vencida' as const };
  const abandonada = { ...base, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  assertEquals(armarMensajes({ tipo: 'UPDATE', reserva: vencida, anterior: base }, sitio).length, 0);
  assertEquals(armarMensajes({ tipo: 'UPDATE', reserva: abandonada, anterior: base }, sitio).length, 0);
});

Deno.test('cancelada: avisa al que no canceló', () => {
  const porCliente = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  const porAdmin = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'admin' as const,
    motivo_cancelacion: 'No hay lugar' };
  assertEquals(destinos(armarMensajes({ tipo: 'UPDATE', reserva: porCliente, anterior: confirmada }, sitio)), ['admin']);
  assertEquals(destinos(armarMensajes({ tipo: 'UPDATE', reserva: porAdmin, anterior: confirmada }, sitio)), ['cliente']);
});

Deno.test('cancelada por el admin: el mail lleva el motivo y avisa el reintegro', () => {
  const porAdmin = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'admin' as const,
    motivo_cancelacion: 'No hay <lugar>' };
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: porAdmin, anterior: confirmada }, sitio);
  assertEquals(m.html.includes('No hay &lt;lugar&gt;'), true);
  assertEquals(m.html.includes('reintegramos la seña'), true);
});

Deno.test('movida de horario: avisa al cliente', () => {
  const m = armarMensajes({ tipo: 'UPDATE', reserva: { ...base, hora: '21:00:00' }, anterior: base }, sitio);
  assertEquals(destinos(m), ['cliente']);
});

Deno.test('otro cambio: no manda nada', () => {
  const m = armarMensajes({ tipo: 'UPDATE', reserva: { ...base, telefono: '222' }, anterior: base }, sitio);
  assertEquals(m.length, 0);
});

Deno.test('escapa el HTML de lo que escribe el cliente', () => {
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio);
  assertEquals(m.html.includes('Ana &lt;b&gt;'), true);
});

Deno.test('reserva del local nueva con mail: le confirma al cliente y no avisa al admin', () => {
  const m = armarMensajes({ tipo: 'INSERT', reserva: delLocal, anterior: null }, sitio);
  assertEquals(destinos(m), ['cliente']);
  assertEquals(m[0].asunto, 'Tu reserva en La Posta está confirmada');
});

Deno.test('reserva del local sin mail: no manda nada', () => {
  const sinMail = { ...delLocal, mail: null };
  assertEquals(armarMensajes({ tipo: 'INSERT', reserva: sinMail, anterior: null }, sitio).length, 0);
  const movida = { ...sinMail, hora: '21:00:00' };
  assertEquals(armarMensajes({ tipo: 'UPDATE', reserva: movida, anterior: sinMail }, sitio).length, 0);
});

Deno.test('reserva del local: los cambios le llegan al cliente, nunca al admin', () => {
  const cancelada = { ...delLocal, estado: 'cancelada' as const, cancelada_por: 'admin' as const,
    motivo_cancelacion: 'Evento privado' };
  assertEquals(destinos(armarMensajes({ tipo: 'UPDATE', reserva: cancelada, anterior: delLocal }, sitio)), ['cliente']);
  const movida = { ...delLocal, hora: '21:00:00' };
  assertEquals(destinos(armarMensajes({ tipo: 'UPDATE', reserva: movida, anterior: delLocal }, sitio)), ['cliente']);
});

Deno.test('reserva del local: el mail no manda a "Mis reservas" (no hay cuenta)', () => {
  const [m] = armarMensajes({ tipo: 'INSERT', reserva: delLocal, anterior: null }, sitio);
  assertEquals(m.html.includes('/mis-reservas'), false);
  assertEquals(m.html.includes('WhatsApp'), true);
});
