// La base vista desde la lógica de pagos (pagos.js, avisos.js,
// cancelaciones.js). Usa la clave secreta: la tabla pagos no se escribe
// desde el navegador.

import { clienteSecreto } from './supabase.js';

const dato = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};
const ahora = () => new Date().toISOString();

export function crearBase(cliente = clienteSecreto()) {
  return {
    leerReserva: async (id) =>
      dato(await cliente.from('reservas')
        .select('id, usuario_id, estado, fecha, hora, creada_en, locales(nombre, sena)')
        .eq('id', id).maybeSingle()),
    crearPago: async ({ reservaId, monto }) =>
      dato(await cliente.from('pagos').insert({ reserva_id: reservaId, monto }).select('id, monto').single()),
    guardarPreferencia: async (idPago, idPreferencia) =>
      dato(await cliente.from('pagos').update({ mp_preference_id: idPreferencia, actualizado_en: ahora() }).eq('id', idPago)),
    leerPago: async (id) =>
      dato(await cliente.from('pagos').select('id').eq('id', id).maybeSingle()),
    acreditarPago: async (idPago, idPagoMp, estadoMp) =>
      dato(await cliente.rpc('acreditar_pago', { p_pago_id: idPago, p_mp_payment_id: idPagoMp, p_estado_mp: estadoMp })),
    // Puede haber más de uno (p. ej. un cobro doble): se reintegran todos
    pagosAReintegrar: async (reservaId) =>
      dato(await cliente.from('pagos').select('id, mp_payment_id')
        .eq('reserva_id', reservaId).eq('estado', 'reintegro_pendiente').order('creado_en')),
    marcarReintegrado: async (idPago) =>
      dato(await cliente.from('pagos').update({ estado: 'reintegrado', actualizado_en: ahora() })
        .eq('id', idPago).eq('estado', 'reintegro_pendiente')),
  };
}
