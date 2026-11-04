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
const asuntos = (m: { asunto: string }[]) => m.map((x) => x.asunto);

Deno.test('formatea fecha y hora en castellano', () => {
  assertEquals(formatearCuando('2026-10-09', '20:30:00'), 'viernes 9 de octubre, 20:30');
});

const confirmada: Reserva = { ...base, estado: 'confirmada' };

Deno.test('reserva nueva de la web (esperando el pago): no manda nada', () => {
  assertEquals(armarMensajes({ tipo: 'INSERT', reserva: base, anterior: null }, sitio).length, 0);
});

Deno.test('pago acreditado: le confirma al cliente', () => {
  const m = armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio);
  assertEquals(asuntos(m), ['Reserva confirmada en La Posta Parrilla']);
});

Deno.test('vencida o abandonada sin pagar: no manda nada', () => {
  const vencida = { ...base, estado: 'vencida' as const };
  const abandonada = { ...base, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  assertEquals(armarMensajes({ tipo: 'UPDATE', reserva: vencida, anterior: base }, sitio).length, 0);
  assertEquals(armarMensajes({ tipo: 'UPDATE', reserva: abandonada, anterior: base }, sitio).length, 0);
});

Deno.test('cancelada: un solo mail, al cliente, cancele quien cancele', () => {
  const porCliente = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  const porAdmin = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'admin' as const,
    motivo_cancelacion: 'No hay lugar' };
  assertEquals(asuntos(armarMensajes({ tipo: 'UPDATE', reserva: porCliente, anterior: confirmada }, sitio)), ['Tu reserva fue cancelada']);
  assertEquals(asuntos(armarMensajes({ tipo: 'UPDATE', reserva: porAdmin, anterior: confirmada }, sitio)), ['Tu reserva fue cancelada']);
});

Deno.test('cancelada por el cliente: el mail avisa que la seña se reintegra', () => {
  const porCliente = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: porCliente, anterior: confirmada }, sitio);
  assertEquals(m.html.includes('La seña se reintegra'), true);
  assertEquals(m.html.includes('no se reintegra'), false);
});

Deno.test('cancelada por el admin: el mail lleva el motivo y avisa que la seña se reintegra', () => {
  const porAdmin = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'admin' as const,
    motivo_cancelacion: 'No hay <lugar>' };
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: porAdmin, anterior: confirmada }, sitio);
  assertEquals(m.html.includes('No hay &lt;lugar&gt;'), true);
  assertEquals(m.html.includes('La seña se reintegra'), true);
});

Deno.test('movida de horario: avisa al cliente', () => {
  const m = armarMensajes({ tipo: 'UPDATE', reserva: { ...base, hora: '21:00:00' }, anterior: base }, sitio);
  assertEquals(asuntos(m), ['Tu reserva fue modificada']);
});

Deno.test('la cambió el cliente: le confirma a él', () => {
  const m = armarMensajes({ tipo: 'UPDATE', reserva: { ...base, estado: 'confirmada', hora: '21:00:00', modificada_por: 'cliente' },
    anterior: { ...base, estado: 'confirmada' } }, sitio);
  assertEquals(asuntos(m), ['Tu reserva fue modificada']);
});

Deno.test('el local nunca recibe mails: ninguno lleva al panel', () => {
  const porCliente = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'cliente' as const };
  const movida = { ...confirmada, hora: '21:00:00', modificada_por: 'cliente' as const };
  const mails = [
    ...armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio),
    ...armarMensajes({ tipo: 'UPDATE', reserva: porCliente, anterior: confirmada }, sitio),
    ...armarMensajes({ tipo: 'UPDATE', reserva: movida, anterior: confirmada }, sitio),
  ];
  assertEquals(mails.length, 3);
  for (const m of mails) assertEquals(m.html.includes('/admin'), false, m.asunto);
});

Deno.test('otro cambio: no manda nada', () => {
  const m = armarMensajes({ tipo: 'UPDATE', reserva: { ...base, telefono: '222' }, anterior: base }, sitio);
  assertEquals(m.length, 0);
});

Deno.test('escapa el HTML de lo que escribe el cliente', () => {
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio);
  assertEquals(m.html.includes('Ana &lt;b&gt;'), true);
});

Deno.test('reserva del local nueva con mail: le confirma al cliente', () => {
  const m = armarMensajes({ tipo: 'INSERT', reserva: delLocal, anterior: null }, sitio);
  assertEquals(asuntos(m), ['Reserva confirmada en La Posta Parrilla']);
});

Deno.test('reserva del local sin mail: no manda nada', () => {
  const sinMail = { ...delLocal, mail: null };
  assertEquals(armarMensajes({ tipo: 'INSERT', reserva: sinMail, anterior: null }, sitio).length, 0);
  const movida = { ...sinMail, hora: '21:00:00' };
  assertEquals(armarMensajes({ tipo: 'UPDATE', reserva: movida, anterior: sinMail }, sitio).length, 0);
});

Deno.test('reserva del local: los cambios le llegan al cliente', () => {
  const cancelada = { ...delLocal, estado: 'cancelada' as const, cancelada_por: 'admin' as const,
    motivo_cancelacion: 'Evento privado' };
  assertEquals(asuntos(armarMensajes({ tipo: 'UPDATE', reserva: cancelada, anterior: delLocal }, sitio)), ['Tu reserva fue cancelada']);
  const movida = { ...delLocal, hora: '21:00:00' };
  assertEquals(asuntos(armarMensajes({ tipo: 'UPDATE', reserva: movida, anterior: delLocal }, sitio)), ['Tu reserva fue modificada']);
});

Deno.test('reserva del local: el mail no manda a "Mis reservas" (no hay cuenta)', () => {
  const [m] = armarMensajes({ tipo: 'INSERT', reserva: delLocal, anterior: null }, sitio);
  assertEquals(m.html.includes('/mis-reservas'), false);
  assertEquals(m.html.includes('WhatsApp'), true);
});

Deno.test('los mails al cliente van en tercera persona', () => {
  const porAdmin = { ...confirmada, estado: 'cancelada' as const, cancelada_por: 'admin' as const, motivo_cancelacion: 'Cierre' };
  const movida = { ...confirmada, hora: '21:00:00' };
  const mails = [
    ...armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio),
    ...armarMensajes({ tipo: 'UPDATE', reserva: porAdmin, anterior: confirmada }, sitio),
    ...armarMensajes({ tipo: 'UPDATE', reserva: movida, anterior: confirmada }, sitio),
  ];
  for (const m of mails) {
    for (const primera of ['Cancelamos', 'Cambiamos', 'escribinos', 'Te esperamos', 'reintegramos']) {
      assertEquals(m.html.includes(primera), false, `${m.asunto}: "${primera}"`);
    }
  }
  assertEquals(mails.map((m) => m.asunto),
    ['Reserva confirmada en La Posta Parrilla', 'Tu reserva fue cancelada', 'Tu reserva fue modificada']);
});

Deno.test('el mail no muestra el teléfono del cliente, sí el contacto del local', () => {
  const conTelefono = { ...confirmada, telefono: '2944 11-1111' };
  const [cliente] = armarMensajes({ tipo: 'UPDATE', reserva: conTelefono, anterior: { ...conTelefono, estado: 'esperando_pago' } }, sitio);
  assertEquals(cliente.html.includes('2944 11-1111'), false);
  assertEquals(cliente.html.includes('https://wa.me/5492944966199'), true);
});

Deno.test('el cambio de horario muestra el anterior y el nuevo', () => {
  const movida = { ...confirmada, hora: '21:00:00' };
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: movida, anterior: confirmada }, sitio);
  assertEquals(m.html.includes('viernes 9 de octubre, 20:30'), true);
  assertEquals(m.html.includes('viernes 9 de octubre, 21:00'), true);
});

Deno.test('lleva el logo del sitio en PNG', () => {
  const [m] = armarMensajes({ tipo: 'UPDATE', reserva: confirmada, anterior: base }, sitio);
  assertEquals(m.html.includes(`${sitio}/logo/logo-mail-blanco.png`), true);
});
