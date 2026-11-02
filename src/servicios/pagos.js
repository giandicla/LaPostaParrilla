// Pagos y cancelaciones: pasan por las rutas del servidor (app/api) porque
// necesitan el Access Token de Mercado Pago, que nunca llega al navegador.
// El servidor sabe quién llama por el token de la sesión de Supabase.

import { supabase } from './supabase.js';

const ERROR_GENERICO = 'Algo salió mal. Probá de nuevo en un momento.';

async function llamar(ruta, cuerpo = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Ingresá con tu cuenta para continuar.');

  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new Error('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error ?? ERROR_GENERICO);
  return datos;
}

// Devuelve la URL de Checkout Pro a la que hay que mandar al cliente
export const iniciarPago = async (reservaId) => (await llamar('/api/v1/pagos', { reservaId })).initPoint;

// { sena: 'retenida' | 'a_devolver' | 'no_corresponde' }
export const cancelarReserva = (reservaId, motivo) =>
  llamar(`/api/v1/reservas/${reservaId}/cancelacion`, motivo ? { motivo } : {});
