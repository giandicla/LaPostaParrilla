// Edge Function: recibe el aviso del trigger `notificar_reserva` de la base y
// manda el mail que corresponda con Brevo.
//
// Variables (supabase secrets set ... / supabase/functions/.env en local):
//   NOTIFICACIONES_SECRETO  el mismo valor guardado en Vault: sin él, 401
//   BREVO_API_KEY           si falta, el mail se escribe en el log y no se envía
//   MAIL_REMITENTE          dirección verificada en Brevo (lapostavla@gmail.com)
//   MAIL_ADMIN              a quién avisar de reservas nuevas y cancelaciones
//   SITIO_URL               para los links de los mails
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las pone Supabase solo.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { armarMensajes, type Aviso } from './mensajes.ts';

const env = (nombre: string) => Deno.env.get(nombre) ?? '';

async function enviar(para: string, asunto: string, html: string) {
  const clave = env('BREVO_API_KEY');
  if (!clave) {
    console.log(`[sin BREVO_API_KEY] mail a ${para}: ${asunto}`);
    return;
  }
  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': clave, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'La Posta', email: env('MAIL_REMITENTE') },
      to: [{ email: para }],
      subject: asunto,
      htmlContent: html,
    }),
  });
  if (!respuesta.ok) {
    throw new Error(`Brevo respondió ${respuesta.status}: ${await respuesta.text()}`);
  }
}

Deno.serve(async (pedido) => {
  if (pedido.headers.get('x-secreto') !== env('NOTIFICACIONES_SECRETO') || !env('NOTIFICACIONES_SECRETO')) {
    return new Response('No autorizado', { status: 401 });
  }

  const aviso = (await pedido.json()) as Aviso;
  const mensajes = armarMensajes(aviso, env('SITIO_URL'));
  if (mensajes.length === 0) return Response.json({ enviados: 0 });

  // El mail del cliente no está en la reserva: se lee de Auth con la service role
  let mailCliente = '';
  if (mensajes.some((m) => m.para === 'cliente')) {
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const { data, error } = await admin.auth.admin.getUserById(aviso.reserva.usuario_id);
    if (error) console.error('No se pudo leer el usuario', error.message);
    mailCliente = data?.user?.email ?? '';
  }

  let enviados = 0;
  for (const m of mensajes) {
    const para = m.para === 'admin' ? env('MAIL_ADMIN') : mailCliente;
    if (!para) continue;
    try {
      await enviar(para, m.asunto, m.html);
      enviados++;
    } catch (e) {
      // Un mail que falla no rompe nada: la reserva ya está guardada
      console.error(e instanceof Error ? e.message : e);
    }
  }
  return Response.json({ enviados });
});
