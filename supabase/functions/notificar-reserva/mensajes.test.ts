// deno test supabase/functions/notificar-reserva/mensajes.test.ts
import { assertEquals } from 'jsr:@std/assert@1';
import { armarMensajes, formatearCuando, type Reserva } from './mensajes.ts';

const base: Reserva = {
  id: 'x', usuario_id: 'u', local_id: 'parrilla', fecha: '2026-10-09', hora: '20:30:00',
  personas: 4, nombre: 'Ana <b>', telefono: '111', comentarios: null,
  estado: 'pendiente', cancelada_por: null,
};
const sitio = 'https://ejemplo.com';
const destinos = (m: { para: string }[]) => m.map((x) => x.para);

Deno.test('formatea fecha y hora en castellano', () => {
  assertEquals(formatearCuando('2026-10-09', '20:30:00'), 'viernes 9 de octubre, 20:30');
});

Deno.test('reserva nueva: avisa al admin', () => {
  assertEquals(destinos(armarMensajes({ tipo: 'INSERT', reserva: base, anterior: null }, sitio)), ['admin']);
});

Deno.test('confirmada o rechazada: avisa al cliente', () => {
  for (const estado of ['confirmada', 'rechazada'] as const) {
    const m = armarMensajes({ tipo: 'UPDATE', reserva: { ...base, estado }, anterior: base }, sitio);
    assertEquals(destinos(m), ['cliente']);
  }
});

Deno.test('cancelada: avisa al que no canceló', () => {
  const porCliente = { ...base, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  const porAdmin = { ...base, estado: 'cancelada' as const, cancelada_por: 'admin' as const };
  assertEquals(destinos(armarMensajes({ tipo: 'UPDATE', reserva: porCliente, anterior: base }, sitio)), ['admin']);
  assertEquals(destinos(armarMensajes({ tipo: 'UPDATE', reserva: porAdmin, anterior: base }, sitio)), ['cliente']);
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
  const [m] = armarMensajes({ tipo: 'INSERT', reserva: base, anterior: null }, sitio);
  assertEquals(m.html.includes('Ana &lt;b&gt;'), true);
});
