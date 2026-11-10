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
const ACTIVAS = '(esperando_pago,pendiente,confirmada)';

// Próximas: todas las activas desde hoy (las de hoy que ya pasaron las separa
// la página con faltaParaReserva)
export const obtenerMisProximas = async (idUsuario) =>
  resultado(
    await supabase
      .from('reservas')
      .select(COLUMNAS)
      .eq('usuario_id', idUsuario)
      .in('estado', ['esperando_pago', 'pendiente', 'confirmada'])
      .gte('fecha', hoyEnArgentina())
      .order('fecha')
      .order('hora')
  );

// Anteriores y canceladas, de a `cantidad`, de la más reciente a la más vieja
export const POR_PAGINA = 5;
export const obtenerMisAnteriores = async (idUsuario, desde = 0, cantidad = POR_PAGINA) =>
  resultado(
    await supabase
      .from('reservas')
      .select(COLUMNAS)
      .eq('usuario_id', idUsuario)
      .or(`fecha.lt.${hoyEnArgentina()},estado.not.in.${ACTIVAS}`)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .range(desde, desde + cantidad - 1)
  );

// Fecha, hora y personas, mismo local, hasta 1 hora antes (modificar_reserva)
export const modificarReserva = async (id, { fecha, hora, personas }) =>
  resultado(
    await supabase.rpc('modificar_reserva', { p_id: id, p_fecha: fecha, p_hora: hora, p_personas: Number(personas) })
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

// Misma regla que modificar_reserva(): confirmada y hasta 1 hora antes
export const sePuedeModificar = (reserva) =>
  ['pendiente', 'confirmada'].includes(reserva.estado) && faltaParaReserva(reserva) >= UNA_HORA;

// ---------- Seña ----------

// Mismo plazo que vencer_reservas_sin_pagar() y la preferencia de Mercado Pago
export const MINUTOS_PARA_PAGAR = 15;

export const venceElPago = (reserva) =>
  new Date(new Date(reserva.creada_en).getTime() + MINUTOS_PARA_PAGAR * 60 * 1000);

// "00:57": en 24 horas y sin "a. m." (el formato de 12 horas de es-AR termina en
// punto y la oración quedaba "hasta las 12:57 a. m..")
export const horaDeVencimiento = (reserva) =>
  new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires',
  }).format(venceElPago(reserva));

export const puedePagar = (reserva, ahora = Date.now()) =>
  reserva.estado === 'esperando_pago' && venceElPago(reserva).getTime() > ahora;

// La pantalla de vuelta de Mercado Pago sigue mirando la reserva mientras
// puede cambiar. Un pago hecho en el último minuto puede avisar después de que
// venció la reserva: por eso sigue 10 minutos más, hasta ver "Llegó tarde el
// pago" o la seña devuelta. Confirmada, o con la seña ya devuelta, no cambia más.
export const MINUTOS_DE_GRACIA = 10;
export const sigueMirandoElPago = (reserva, ahora = Date.now()) => {
  if (reserva.estado === 'esperando_pago') return true;
  if (reserva.estado === 'confirmada' || estadoSena(reserva) === 'reintegrado') return false;
  return venceElPago(reserva).getTime() + MINUTOS_DE_GRACIA * 60 * 1000 > ahora;
};

// De varios pagos de una reserva cuenta el más avanzado, de mayor a menor.
// El embed de Supabase no trae orden, así que se rankea acá.
const ORDEN_DE_PAGOS = ['aprobado', 'reintegro_pendiente', 'reintegrado', 'rechazado', 'iniciado'];

export const estadoDelPago = (reserva) =>
  (reserva.pagos ?? [])
    .map((pago) => pago.estado)
    .filter((estado) => ORDEN_DE_PAGOS.includes(estado))
    .sort((a, b) => ORDEN_DE_PAGOS.indexOf(a) - ORDEN_DE_PAGOS.indexOf(b))[0] ?? null;

// La seña es el pago cobrado (aprobado, en devolución o devuelto), si hay
const COBRADOS = ['aprobado', 'reintegro_pendiente', 'reintegrado'];
export const estadoSena = (reserva) => {
  const estado = estadoDelPago(reserva);
  return COBRADOS.includes(estado) ? estado : null;
};

export const ETIQUETAS_SENA = {
  aprobado: 'Seña pagada',
  reintegro_pendiente: 'Devolución de la seña en curso',
  reintegrado: 'Seña devuelta',
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

// "2027-03-10" → "miércoles, 10 de marzo"; con conAnio, "… de 2027" (los días
// bloqueados se cargan con meses de anticipación)
export const formatearFecha = (fecha, { conAnio = false } = {}) =>
  new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(conAnio && { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(new Date(`${fecha}T00:00:00Z`));

// Los que se ven. 'terminada' no existe en la base: es una confirmada de un
// día que ya pasó (ver estadoVisible). 'pendiente' y 'rechazada' siguen en la
// base, de antes de la seña, pero ya nada las crea.
export const ESTADOS = {
  esperando_pago: 'Esperando pago',
  confirmada: 'Confirmada',
  terminada: 'Terminada',
  cancelada: 'Cancelada',
  vencida: 'Vencida',
};

export const estadoVisible = (reserva) =>
  reserva.estado === 'confirmada' && reserva.fecha < hoyEnArgentina() ? 'terminada' : reserva.estado;
