// Panel de administración. Para un usuario que no es admin, estas llamadas
// fallan o devuelven vacío: lo garantiza la RLS de la base, no esta capa.

import { supabase, resultado } from './supabase.js';
import { hoyEnArgentina } from './reservas.js';

const COLUMNAS =
  'id, usuario_id, origen, mail, local_id, fecha, hora, personas, nombre, telefono, comentarios, estado, cancelada_por, motivo_cancelacion, creada_en, notas_reserva(nota), pagos(estado)';

// PostgREST devuelve como mucho max_rows filas por pedido (1000): se piden
// de a páginas hasta traer todas. Con el orden por id, ninguna se repite ni
// se saltea entre páginas.
const POR_PAGINA = 1000;

async function todasLasFilas(armarConsulta) {
  const filas = [];
  for (let desde = 0; ; desde += POR_PAGINA) {
    const pagina = resultado(await armarConsulta().range(desde, desde + POR_PAGINA - 1));
    filas.push(...pagina);
    if (pagina.length < POR_PAGINA) return filas;
  }
}

// filtros: { fecha?, idLocal?, estado?, estados? }. 'terminada' y 'confirmada'
// se separan por fecha (ver estadoVisible). estados: lista de estados de la
// base (la lista del día pide solo confirmadas y pendientes).
export async function listarReservas({ fecha, idLocal, estado, estados } = {}) {
  const armarConsulta = () => {
    let consulta = supabase.from('reservas').select(COLUMNAS).order('fecha').order('hora').order('id');
    if (fecha) consulta = consulta.eq('fecha', fecha);
    if (idLocal) consulta = consulta.eq('local_id', idLocal);
    if (estados?.length) consulta = consulta.in('estado', estados);
    if (estado === 'terminada') consulta = consulta.eq('estado', 'confirmada').lt('fecha', hoyEnArgentina());
    else if (estado === 'confirmada') consulta = consulta.eq('estado', 'confirmada').gte('fecha', hoyEnArgentina());
    else if (estado) consulta = consulta.eq('estado', estado);
    return consulta;
  };
  const filas = await todasLasFilas(armarConsulta);
  // notas_reserva llega como objeto o null: la relación es uno a uno
  return filas.map(({ notas_reserva: nota, ...reserva }) => ({ ...reserva, nota: nota?.nota ?? '' }));
}

// Una reserva que toma el local (por teléfono, WhatsApp o en la puerta): sin
// cuenta de cliente y ya confirmada. reserva: { local_id, fecha, hora,
// personas, nombre, telefono, mail?, comentarios? }
export const crearReservaLocal = async (reserva) =>
  resultado(
    await supabase
      .from('reservas')
      .insert({ ...reserva, usuario_id: null, origen: 'local', estado: 'confirmada' })
      .select('id')
      .single()
  );

// datos: { fecha, hora, personas, nombre, telefono, comentarios, mail? }. El
// mail va solo en las del local: las de la web usan el de la cuenta. Las
// reglas (franjas, topes de personas, contacto) las vuelve a poner la base.
export const editarReserva = async (id, datos) =>
  resultado(await supabase.from('reservas').update(datos).eq('id', id));

// Una nota vacía borra la nota
export async function guardarNota(idReserva, nota) {
  if (!nota.trim()) {
    return resultado(await supabase.from('notas_reserva').delete().eq('reserva_id', idReserva));
  }
  return resultado(
    await supabase
      .from('notas_reserva')
      .upsert({ reserva_id: idReserva, nota: nota.trim(), actualizada_en: new Date().toISOString() })
  );
}

export const listarBloqueos = async (desde) =>
  resultado(
    await supabase
      .from('dias_bloqueados')
      .select('id, fecha, fecha_hasta, local_id, hora_desde, hora_hasta, motivo')
      .gte('fecha_hasta', desde)
      .order('fecha')
      .order('hora_desde', { nullsFirst: true })
  );

// bloqueo: { fecha, fecha_hasta, local_id (null = los dos), hora_desde,
// hora_hasta (las dos null = todo el día), motivo }
export const bloquear = async ({ fecha, fecha_hasta, local_id, hora_desde, hora_hasta, motivo }) =>
  resultado(
    await supabase.from('dias_bloqueados').insert({
      fecha,
      fecha_hasta,
      local_id: local_id || null,
      hora_desde: hora_desde || null,
      hora_hasta: hora_hasta || null,
      motivo: motivo?.trim() || null,
    })
  );

// Señas con la devolución pedida a Mercado Pago y todavía sin confirmar por el
// webhook (o que falló al pedirla): el panel las muestra con "Reintentar"
export const listarSenasADevolver = async () =>
  resultado(
    await supabase
      .from('pagos')
      .select('id, monto, mp_payment_id, reserva_id, reservas(nombre, fecha, hora, local_id)')
      .eq('estado', 'reintegro_pendiente')
      .order('actualizado_en')
  );

export const desbloquearDia = async (id) =>
  resultado(await supabase.from('dias_bloqueados').delete().eq('id', id));

// Avisa de cualquier cambio en reservas (tiempo real).
// Devuelve la función para dejar de escuchar.
export function escucharReservas(callback) {
  const canal = supabase
    .channel('admin-reservas')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, callback)
    .subscribe();
  return () => supabase.removeChannel(canal);
}
