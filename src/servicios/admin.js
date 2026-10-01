// Panel de administración. Para un usuario que no es admin, estas llamadas
// fallan o devuelven vacío: lo garantiza la RLS de la base, no esta capa.

import { supabase, resultado } from './supabase.js';

const COLUMNAS =
  'id, usuario_id, local_id, fecha, hora, personas, nombre, telefono, comentarios, estado, cancelada_por, creada_en, notas_reserva(nota)';

// filtros: { fecha?, idLocal?, estado? }
export async function listarReservas({ fecha, idLocal, estado } = {}) {
  let consulta = supabase.from('reservas').select(COLUMNAS).order('fecha').order('hora');
  if (fecha) consulta = consulta.eq('fecha', fecha);
  if (idLocal) consulta = consulta.eq('local_id', idLocal);
  if (estado) consulta = consulta.eq('estado', estado);
  const filas = resultado(await consulta);
  // notas_reserva llega como objeto o null: la relación es uno a uno
  return filas.map(({ notas_reserva: nota, ...reserva }) => ({ ...reserva, nota: nota?.nota ?? '' }));
}

export async function contarPendientes() {
  const { count, error } = await supabase
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente');
  if (error) throw error;
  return count ?? 0;
}

export const cambiarEstado = async (id, estado) =>
  resultado(await supabase.from('reservas').update({ estado }).eq('id', id));

export const moverReserva = async (id, { fecha, hora }) =>
  resultado(await supabase.from('reservas').update({ fecha, hora }).eq('id', id));

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
      .select('id, fecha, local_id, motivo')
      .gte('fecha', desde)
      .order('fecha')
  );

export const bloquearDia = async ({ fecha, idLocal, motivo }) =>
  resultado(
    await supabase
      .from('dias_bloqueados')
      .insert({ fecha, local_id: idLocal || null, motivo: motivo?.trim() || null })
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
