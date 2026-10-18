// Reservas del cliente: crear, listar las propias, seña y turnos (cancelar está en pagos.js).
// Las reglas (franjas, 6 personas, 1 hora para cancelar, una por día) las hace cumplir
// la base; acá solo se piden los datos y se traducen los errores.

import { supabase, resultado } from './supabase.js';

const COLUMNAS =
  'id, local_id, fecha, hora, personas, nombre, telefono, comentarios, estado, cancelada_por, motivo_cancelacion, creada_en, pagos(estado)';

// Horarios reservables de un local, como 'HH:MM'
export async function obtenerFranjas(idLocal) {
  const filas = resultado(
    await supabase.from('franjas_reserva').select('hora').eq('local_id', idLocal).order('hora')
  );
  return filas.map((fila) => fila.hora.slice(0, 5));
}

// Días bloqueados desde una fecha:
// [{ fecha, local_id (null = los dos), turno (null = todo el día), motivo }]
export const obtenerDiasBloqueados = async (desde) =>
  resultado(
    await supabase.from('dias_bloqueados').select('fecha, local_id, turno, motivo').gte('fecha', desde)
  );

export const crearReserva = async (idUsuario, reserva) =>
  resultado(
    await supabase
      .from('reservas')
      .insert({ ...reserva, usuario_id: idUsuario })
      .select(COLUMNAS)
      .single()
  );

// Filtra por usuario aunque la RLS ya lo haga para un cliente: a un admin la
// RLS le deja ver todas, y "mis reservas" son solo las suyas.
export const obtenerMisReservas = async (idUsuario) =>
  resultado(
    await supabase
      .from('reservas')
      .select(COLUMNAS)
      .eq('usuario_id', idUsuario)
      .order('fecha', { ascending: false })
      .order('hora')
  );

// ---------- Fechas y horas, siempre en hora de Argentina ----------

const ZONA = 'America/Argentina/Buenos_Aires';

// 'AAAA-MM-DD' de hoy en Argentina, sin depender de la zona del navegador
export const hoyEnArgentina = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());

// Milisegundos que faltan para una reserva. Argentina es UTC-3 todo el año.
export const faltaParaReserva = ({ fecha, hora }) =>
  new Date(`${fecha}T${hora.slice(0, 5)}:00-03:00`).getTime() - Date.now();

export const UNA_HORA = 60 * 60 * 1000;

export const esActiva = (reserva) => ['esperando_pago', 'pendiente', 'confirmada'].includes(reserva.estado);

// Misma regla que cancelar_reserva() en la base: sin pagar, siempre; pagada,
// hasta 1 hora antes. Acá solo decide qué botón mostrar.
export const sePuedeCancelar = (reserva) =>
  esActiva(reserva) && (reserva.estado === 'esperando_pago' || faltaParaReserva(reserva) >= UNA_HORA);

// ---------- Seña ----------

// Mismo plazo que vencer_reservas_sin_pagar() y la preferencia de Mercado Pago
export const MINUTOS_PARA_PAGAR = 15;

export const venceElPago = (reserva) =>
  new Date(new Date(reserva.creada_en).getTime() + MINUTOS_PARA_PAGAR * 60 * 1000);

export const puedePagar = (reserva, ahora = Date.now()) =>
  reserva.estado === 'esperando_pago' && venceElPago(reserva).getTime() > ahora;

// De varios pagos de una reserva cuenta el más avanzado, de mayor a menor.
// El embed de Supabase no trae orden, así que se rankea acá.
const ORDEN_DE_PAGOS = ['aprobado', 'reintegro_pendiente', 'reintegrado', 'rechazado', 'iniciado'];

export const estadoDelPago = (reserva) =>
  (reserva.pagos ?? [])
    .map((pago) => pago.estado)
    .filter((estado) => ORDEN_DE_PAGOS.includes(estado))
    .sort((a, b) => ORDEN_DE_PAGOS.indexOf(a) - ORDEN_DE_PAGOS.indexOf(b))[0] ?? null;

// La seña es el pago cobrado (aprobado, a reintegrar o reintegrado), si hay
const COBRADOS = ['aprobado', 'reintegro_pendiente', 'reintegrado'];
export const estadoSena = (reserva) => {
  const estado = estadoDelPago(reserva);
  return COBRADOS.includes(estado) ? estado : null;
};

export const ETIQUETAS_SENA = {
  aprobado: 'Seña pagada',
  reintegro_pendiente: 'Reintegro de la seña en proceso',
  reintegrado: 'Seña reintegrada',
};

export const formatearMonto = (monto) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto);

export async function obtenerSena(idLocal) {
  const fila = resultado(await supabase.from('locales').select('sena').eq('id', idLocal).single());
  return Number(fila.sena);
}

export const obtenerReserva = async (id) =>
  resultado(await supabase.from('reservas').select(COLUMNAS).eq('id', id).maybeSingle());

// Avisa cuando cambia una reserva (tiempo real; la RLS deja ver solo las propias)
export function escucharReserva(id, callback) {
  const canal = supabase
    .channel(`reserva-${id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reservas', filter: `id=eq.${id}` }, callback)
    .subscribe();
  return () => supabase.removeChannel(canal);
}

// ---------- Turnos (mismo corte que turno_de() en la base) ----------

export const turnoDe = (hora) => (hora.slice(0, 5) < '17:00' ? 'mediodia' : 'noche');

export const TURNOS = { mediodia: 'Mediodía', noche: 'Noche' };

export const formatearFecha = (fecha) =>
  new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${fecha}T00:00:00Z`));

export const ESTADOS = {
  esperando_pago: 'Esperando pago',
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
};
