// Validación de lo que llega a las rutas (clase 10: nunca confiar en el
// cliente). Si no cumple el esquema, 400 con los campos que fallaron.

import { z } from 'zod';
import { ErrorHttp } from './respuestas.js';

export const esquemaId = z.uuid();

export const esquemaPago = z.object({ reservaId: z.uuid() });

// Mismo límite que LIMITES.motivo y que el check de la base
export const esquemaCancelacion = z.object({ motivo: z.string().trim().max(120).optional() });

export async function leerCuerpo(pedido, esquema) {
  const texto = await pedido.text();
  let datos = {};
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      throw new ErrorHttp(400, 'El cuerpo del pedido tiene que ser JSON.');
    }
  }
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const campos = resultado.error.issues.map((problema) => problema.path.join('.') || 'cuerpo');
    throw new ErrorHttp(400, `Datos inválidos: ${[...new Set(campos)].join(', ')}.`);
  }
  return resultado.data;
}
