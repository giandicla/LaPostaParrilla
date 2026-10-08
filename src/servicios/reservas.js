// Reservas del cliente: crear, listar las propias, cancelar.
// Las reglas (franjas, 6 personas, 1 hora para cancelar, una por día) las hace cumplir
// la base; acá solo se piden los datos y se traducen los errores.

import { supabase, resultado } from './supabase.js';

const COLUMNAS =
  'id, local_id, fecha, hora, personas, nombre, telefono, comentarios, estado, cancelada_por, creada_en';

// Horarios reservables de un local, como 'HH:MM'
export async function obtenerFranjas(idLocal) {
  const filas = resultado(
    await supabase.from('franjas_reserva').select('hora').eq('local_id', idLocal).order('hora')
  );
  return filas.map((fila) => fila.hora.slice(0, 5));
}

// Días bloqueados desde una fecha: [{ fecha, local_id (null = los dos), motivo }]
export const obtenerDiasBloqueados = async (desde) =>
  resultado(
    await supabase.from('dias_bloqueados').select('fecha, local_id, motivo').gte('fecha', desde)
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

export const cancelarReserva = async (id) =>
  resultado(await supabase.rpc('cancelar_reserva', { p_id: id }));

// ---------- Fechas y horas, siempre en hora de Argentina ----------

const ZONA = 'America/Argentina/Buenos_Aires';

// 'AAAA-MM-DD' de hoy en Argentina, sin depender de la zona del navegador
export const hoyEnArgentina = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());

// Milisegundos que faltan para una reserva. Argentina es UTC-3 todo el año.
export const faltaParaReserva = ({ fecha, hora }) =>
  new Date(`${fecha}T${hora.slice(0, 5)}:00-03:00`).getTime() - Date.now();

export const UNA_HORA = 60 * 60 * 1000;

export const esActiva = (reserva) => ['pendiente', 'confirmada'].includes(reserva.estado);

// Misma regla que cancelar_reserva() en la base; acá solo decide qué botón mostrar
export const sePuedeCancelar = (reserva) =>
  esActiva(reserva) && faltaParaReserva(reserva) >= UNA_HORA;

export const formatearFecha = (fecha) =>
  new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${fecha}T00:00:00Z`));

export const ESTADOS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};
