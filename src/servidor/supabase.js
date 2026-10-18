// Supabase desde el servidor (Route Handlers). Excepción documentada a "todo
// pasa por src/servicios/": esto nunca llega al navegador.
//
// clienteSecreto: con SUPABASE_SECRET_KEY, se saltea la RLS. Solo para pagos.
// usuarioDelPedido: con el token del que llama, así la base aplica sus reglas.

import { createClient } from '@supabase/supabase-js';
import { ErrorHttp } from './respuestas.js';

const SIN_SESION = { auth: { persistSession: false, autoRefreshToken: false } };

export function clienteSecreto() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !clave) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY');
  return createClient(url, clave, SIN_SESION);
}

export async function usuarioDelPedido(pedido) {
  const token = pedido.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ErrorHttp(401, 'Ingresá con tu cuenta para continuar.');

  const cliente = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    ...SIN_SESION,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await cliente.auth.getUser(token);
  if (error || !data.user) throw new ErrorHttp(401, 'Tu sesión venció. Ingresá de nuevo.');

  return {
    id: data.user.id,
    async leerReserva(id) {
      const { data: reserva, error: e } = await cliente.from('reservas').select('id, estado').eq('id', id).maybeSingle();
      if (e) throw new Error(e.message);
      return reserva;
    },
    async cancelar(id, motivo) {
      const { error: e } = await cliente.rpc('cancelar_reserva', { p_id: id, p_motivo: motivo ?? null });
      // Las reglas de la base (P0001) ya vienen en castellano
      if (e) throw e.code === 'P0001' ? new ErrorHttp(409, e.message) : new Error(e.message);
    },
  };
}
