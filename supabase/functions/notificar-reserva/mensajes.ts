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
  estado: 'pendiente' | 'confirmada' | 'rechazada' | 'cancelada';
  cancelada_por: 'cliente' | 'admin' | null;
  origen: 'web' | 'local';
  // Solo en las del local: el mail que cargó el admin, si el cliente lo dio
  mail: string | null;
};

export type Aviso = {
  tipo: 'INSERT' | 'UPDATE';
  reserva: Reserva;
  anterior: Reserva | null;
};

export type Mensaje = {
  para: 'cliente' | 'admin';
  asunto: string;
  html: string;
};

const NOMBRES_LOCALES: Record<string, string> = {
  parrilla: 'La Posta Parrilla',
  restaurante: 'La Posta II Restaurante',
};

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

function detalle(r: Reserva): string {
  const local = NOMBRES_LOCALES[r.local_id] ?? r.local_id;
  return `
    <p><strong>${escapar(local)}</strong><br>
    ${formatearCuando(r.fecha, r.hora)} · ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'}<br>
    A nombre de ${escapar(r.nombre)} · ${escapar(r.telefono)}</p>
    ${r.comentarios ? `<p><em>${escapar(r.comentarios)}</em></p>` : ''}`;
}

// Una reserva del local no tiene cuenta detrás: en vez del link a "Mis
// reservas", se la manda a WhatsApp para cualquier cambio.
function plantilla(titulo: string, cuerpo: string, sitio: string, delLocal = false): string {
  const pie = delLocal
    ? '<p>Para cualquier cambio, escribinos por WhatsApp.</p>'
    : `<p><a href="${sitio}/mis-reservas" style="color:#600003">Ver mis reservas</a></p>`;
  return `<div style="font-family:Georgia,serif;max-width:520px;margin:auto;color:#1C1512">
    <div style="background:#600003;color:#fff;padding:16px 24px;font-size:20px;letter-spacing:2px">LA POSTA</div>
    <div style="padding:24px;background:#F6F2EC">
      <h2 style="color:#600003;font-weight:normal">${titulo}</h2>
      ${cuerpo}
      ${pie}
    </div></div>`;
}

export function armarMensajes(aviso: Aviso, sitio: string): Mensaje[] {
  const { reserva: r } = aviso;
  if (r.origen !== 'local') return mensajesWeb(aviso, sitio);

  // Reserva cargada por el admin: él ya sabe lo que hizo, así que los avisos
  // son solo para el cliente, y solo si dejó un mail.
  if (!r.mail) return [];
  if (aviso.tipo === 'INSERT') {
    return [{ para: 'cliente', asunto: 'Tu reserva en La Posta está confirmada',
      html: plantilla('¡Te esperamos!', detalle(r), sitio, true) }];
  }
  return mensajesWeb(aviso, sitio, true).filter((m) => m.para === 'cliente');
}

function mensajesWeb(aviso: Aviso, sitio: string, delLocal = false): Mensaje[] {
  const { tipo, reserva: r, anterior: a } = aviso;
  const pagina = (titulo: string, cuerpo: string) => plantilla(titulo, cuerpo, sitio, delLocal);

  if (tipo === 'INSERT') {
    return [{
      para: 'admin',
      asunto: `Nueva reserva pendiente — ${formatearCuando(r.fecha, r.hora)}`,
      html: pagina('Entró una reserva nueva', `${detalle(r)}
        <p>Confirmala o rechazala desde el <a href="${sitio}/admin">panel</a>.</p>`),
    }];
  }

  if (!a) return [];

  if (r.estado !== a.estado) {
    if (r.estado === 'confirmada') {
      return [{ para: 'cliente', asunto: 'Tu reserva en La Posta está confirmada',
        html: pagina('¡Te esperamos!', detalle(r)) }];
    }
    if (r.estado === 'rechazada') {
      return [{ para: 'cliente', asunto: 'No pudimos confirmar tu reserva',
        html: pagina('No pudimos confirmar tu reserva',
          `${detalle(r)}<p>Escribinos por WhatsApp y buscamos otro horario.</p>`) }];
    }
    if (r.estado === 'cancelada') {
      return r.cancelada_por === 'cliente'
        ? [{ para: 'admin', asunto: `Un cliente canceló — ${formatearCuando(r.fecha, r.hora)}`,
            html: pagina('Se canceló una reserva', detalle(r)) }]
        : [{ para: 'cliente', asunto: 'Tu reserva en La Posta fue cancelada',
            html: pagina('Cancelamos tu reserva',
              `${detalle(r)}<p>Si tenés dudas, escribinos por WhatsApp.</p>`) }];
    }
    return [];
  }

  if (r.fecha !== a.fecha || r.hora !== a.hora) {
    return [{ para: 'cliente', asunto: 'Cambiamos el horario de tu reserva',
      html: pagina('Tu reserva tiene un nuevo horario',
        `${detalle(r)}<p>Antes era el ${formatearCuando(a.fecha, a.hora)}.</p>`) }];
  }

  return [];
}
