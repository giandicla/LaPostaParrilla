// Qué mail corresponde a cada cambio de una reserva. Funciones puras, sin red:
// se pueden testear solas (mensajes.test.ts).

export type Reserva = {
  id: string;
  // null en las reservas que carga el admin desde el panel (origen 'local')
  usuario_id: string | null;
  local_id: string;
  fecha: string; // AAAA-MM-DD
  hora: string; // HH:MM:SS
  personas: number;
  nombre: string;
  telefono: string;
  comentarios: string | null;
  estado: 'esperando_pago' | 'pendiente' | 'confirmada' | 'rechazada' | 'cancelada' | 'vencida';
  cancelada_por: 'cliente' | 'admin' | null;
  // Quién cambió la fecha o la hora por última vez (el cliente, desde "Mis reservas")
  modificada_por?: 'cliente' | 'admin' | null;
  // Lo escribe el admin al cancelar; le llega al cliente
  motivo_cancelacion: string | null;
  origen: 'web' | 'local';
  // Solo en las del local: el mail que cargó el admin, si el cliente lo dio
  mail: string | null;
};

export type Aviso = {
  tipo: 'INSERT' | 'UPDATE';
  reserva: Reserva;
  anterior: Reserva | null;
};

// Todos los mails van al cliente. El local no recibe mails: se entera por el
// panel, en tiempo real (pedido del usuario, 2026-11-03).
export type Mensaje = {
  asunto: string;
  html: string;
};

// Copia de lo que necesitan los mails de src/data/locales.js (la función corre
// en Deno, aparte del sitio). Si cambia un teléfono, cambia en los dos lados.
type Local = { nombre: string; telefono: string; whatsapp: string };
const LOCALES: Record<string, Local> = {
  parrilla: { nombre: 'La Posta Parrilla', telefono: '+54 9 2944 96-6199', whatsapp: '5492944966199' },
  restaurante: { nombre: 'La Posta II Restaurante', telefono: '+54 9 2944 86-1339', whatsapp: '5492944861339' },
};
const DIRECCION = 'Av. Arrayanes 263, Villa La Angostura, Neuquén';
const nombreLocal = (r: Reserva) => LOCALES[r.local_id]?.nombre ?? 'La Posta';

// Paleta del manual de marca (src/styles/tokens.css). Los mails no leen CSS
// externo: todo va en línea.
const C = {
  bordo: '#600003', arena: '#CBC1B1', arena100: '#EDE7DD', crema: '#F6F2EC',
  oliva: '#757036', carbon: '#1C1512', gris: '#5A524C', blanco: '#FFFFFF',
};
const TITULO = "Baskerville,'Libre Baskerville',Georgia,'Times New Roman',serif";
const TEXTO = "'Gill Sans','Gill Sans MT',Calibri,'Trebuchet MS',Arial,sans-serif";

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

// "viernes 10 de octubre, 20:30". Se arma a mano para no depender del
// soporte de idiomas del runtime.
export function formatearCuando(fecha: string, hora: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return `${DIAS[dia]} ${d} de ${MESES[m - 1]}, ${hora.slice(0, 5)}`;
}

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const enlace = (href: string, texto: string) =>
  `<a href="${href}" style="color:${C.bordo};text-decoration:underline">${texto}</a>`;

const boton = (href: string, texto: string) =>
  `<a href="${href}" style="display:inline-block;background:${C.bordo};color:${C.blanco};font-family:${TEXTO};font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:12px 22px;border-radius:4px">${texto}</a>`;

const fila = (etiqueta: string, valor: string, tachado = false) => `
  <tr>
    <td style="padding:8px 12px 8px 0;border-bottom:1px solid ${C.arena100};font-family:${TEXTO};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${C.gris};width:36%;vertical-align:top">${etiqueta}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${C.arena100};font-family:${TEXTO};font-size:15px;color:${tachado ? C.gris : C.carbon};${tachado ? 'text-decoration:line-through;' : ''}">${valor}</td>
  </tr>`;

const parrafo = (html: string) =>
  `<p style="margin:0 0 16px;font-family:${TEXTO};font-size:15px;line-height:1.55;color:${C.carbon}">${html}</p>`;

// Un aviso destacado (motivo, seña): franja oliva a la izquierda
const nota = (html: string) =>
  `<p style="margin:0 0 16px;padding:12px 16px;background:${C.arena100};border-left:4px solid ${C.oliva};font-family:${TEXTO};font-size:14px;line-height:1.5;color:${C.carbon}">${html}</p>`;

// Los datos de la reserva, en una tabla (sin el teléfono del cliente: no le
// sirve ver el suyo). Con `antes`, muestra el horario viejo tachado y el nuevo.
function detalle(r: Reserva, { antes }: { antes?: Reserva | null } = {}): string {
  const filas = [fila('Local', escapar(nombreLocal(r)))];
  if (antes) {
    filas.push(fila('Antes', formatearCuando(antes.fecha, antes.hora), true));
    filas.push(fila('Ahora', `<strong>${formatearCuando(r.fecha, r.hora)}</strong>`));
  } else {
    const [dia, hora] = formatearCuando(r.fecha, r.hora).split(', ');
    filas.push(fila('Día', dia), fila('Hora', `${hora} h`));
  }
  filas.push(fila('Personas', String(r.personas)), fila('A nombre de', escapar(r.nombre)));
  if (r.comentarios) filas.push(fila('Comentarios', `<em>${escapar(r.comentarios)}</em>`));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px">${filas.join('')}</table>`;
}

// Contacto del local de la reserva, al pie de los mails al cliente
function contacto(r: Reserva): string {
  const local = LOCALES[r.local_id];
  if (!local) return '';
  return `<p style="margin:8px 0 0;padding-top:16px;border-top:1px solid ${C.arena};font-family:${TEXTO};font-size:14px;line-height:1.6;color:${C.carbon}">
    Consultas por ${enlace(`https://wa.me/${local.whatsapp}`, `WhatsApp al ${local.telefono}`)}<br>
    <span style="color:${C.gris};font-size:13px">${escapar(local.nombre)} · ${DIRECCION}</span></p>`;
}

function plantilla({ titulo, cuerpo, accion, pie, sitio }: {
  titulo: string; cuerpo: string; accion?: string; pie?: string; sitio: string;
}): string {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:${C.arena100}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.arena100}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-collapse:collapse">
    <tr><td align="center" style="background:${C.bordo};padding:26px 24px">
      <img src="${sitio}/logo/logo-mail-blanco.png" width="160" alt="La Posta" style="display:block;width:160px;max-width:55%;height:auto;border:0">
    </td></tr>
    <tr><td style="height:4px;background:${C.oliva};font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="background:${C.crema};padding:32px 28px 24px">
      <h1 style="margin:0 0 18px;font-family:${TITULO};font-weight:normal;font-size:22px;letter-spacing:2px;text-transform:uppercase;color:${C.bordo}">${titulo}</h1>
      ${cuerpo}
      ${accion ? `<p style="margin:4px 0 20px">${accion}</p>` : ''}
      ${pie ?? ''}
    </td></tr>
    <tr><td align="center" style="background:${C.arena};padding:14px 24px;font-family:${TEXTO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.carbon}">
      La Posta · Villa La Angostura
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export function armarMensajes(aviso: Aviso, sitio: string): Mensaje[] {
  const { reserva: r } = aviso;
  if (r.origen !== 'local') return mensajesWeb(aviso, sitio);

  // Reserva cargada por el admin: solo si el cliente dejó un mail
  if (!r.mail) return [];
  if (aviso.tipo === 'INSERT') return [confirmacion(r, sitio, true)];
  return mensajesWeb(aviso, sitio, true);
}

// Los mails al cliente van en tercera persona ("Tu reserva fue cancelada"),
// no en primera del local ("Cancelamos tu reserva"): pedido del usuario.
function confirmacion(r: Reserva, sitio: string, delLocal: boolean): Mensaje {
  return {
    asunto: `Reserva confirmada en ${nombreLocal(r)}`,
    html: plantilla({
      sitio,
      titulo: 'Tu reserva está confirmada',
      cuerpo: `${parrafo(`La mesa queda reservada a nombre de ${escapar(r.nombre)}.`)}${detalle(r)}${
        delLocal ? '' : nota('La seña está acreditada. La reserva se puede modificar o cancelar desde la web hasta 1 hora antes; si se cancela, la seña se reintegra en el mismo medio de pago.')}`,
      accion: delLocal ? undefined : boton(`${sitio}/mis-reservas`, 'Ver mis reservas'),
      pie: contacto(r),
    }),
  };
}

function mensajesWeb(aviso: Aviso, sitio: string, delLocal = false): Mensaje[] {
  const { tipo, reserva: r, anterior: a } = aviso;
  const misReservas = delLocal ? undefined : boton(`${sitio}/mis-reservas`, 'Ver mis reservas');

  // Una reserva de la web nace esperando el pago: nadie se entera hasta que se paga
  if (tipo === 'INSERT' || !a) return [];

  if (r.estado !== a.estado) {
    // Vencida o abandonada antes de pagar: no hubo reserva de verdad
    if (r.estado === 'vencida' || (a.estado === 'esperando_pago' && r.estado === 'cancelada')) return [];

    if (r.estado === 'confirmada') return [confirmacion(r, sitio, delLocal)];
    if (r.estado === 'rechazada') {
      return [{ asunto: 'Tu reserva no pudo confirmarse',
        html: plantilla({
          sitio,
          titulo: 'Tu reserva no pudo confirmarse',
          cuerpo: `${detalle(r)}${parrafo('Por WhatsApp se puede buscar otro horario.')}`,
          pie: contacto(r),
        }) }];
    }
    if (r.estado === 'cancelada') {
      // Solo una reserva web confirmada tenía la seña cobrada. Las 'pendiente'
      // son de antes de la seña (o del local): no hay nada que devolver.
      const conSena = r.origen === 'web' && a.estado === 'confirmada';
      if (r.cancelada_por === 'cliente') {
        return [{ asunto: 'Tu reserva fue cancelada',
          html: plantilla({
            sitio,
            titulo: 'Tu reserva fue cancelada',
            cuerpo: `${parrafo('La reserva se canceló desde "Mis reservas".')}${detalle(r)}${
              conSena ? nota('La seña se reintegra en el mismo medio de pago.') : ''}`,
            accion: delLocal ? undefined : boton(`${sitio}/reservas`, 'Hacer otra reserva'),
            pie: contacto(r),
          }) }];
      }
      const motivo = r.motivo_cancelacion ? nota(`<strong>Motivo:</strong> ${escapar(r.motivo_cancelacion)}`) : '';
      const sena = conSena
        ? nota('La seña se reintegra en los próximos días, en el mismo medio de pago.') : '';
      return [{ asunto: 'Tu reserva fue cancelada',
        html: plantilla({
          sitio,
          titulo: 'Tu reserva fue cancelada',
          cuerpo: `${parrafo(`${escapar(nombreLocal(r))} canceló la reserva.`)}${detalle(r)}${motivo}${sena}`,
          pie: contacto(r),
        }) }];
    }
    return [];
  }

  if (r.fecha !== a.fecha || r.hora !== a.hora) {
    if (r.modificada_por === 'cliente') {
      return [{ asunto: 'Tu reserva fue modificada',
        html: plantilla({
          sitio,
          titulo: 'Tu reserva fue modificada',
          cuerpo: `${parrafo('Los cambios hechos desde "Mis reservas" quedaron guardados. La seña sigue valiendo.')}${detalle(r, { antes: a })}`,
          accion: misReservas,
          pie: contacto(r),
        }) }];
    }
    return [{ asunto: 'Tu reserva fue modificada',
      html: plantilla({
        sitio,
        titulo: 'Tu reserva fue modificada',
        cuerpo: `${parrafo(`${escapar(nombreLocal(r))} cambió el día o el horario de la reserva.`)}${detalle(r, { antes: a })}`,
        accion: misReservas,
        pie: contacto(r),
      }) }];
  }

  return [];
}
