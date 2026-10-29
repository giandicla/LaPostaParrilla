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

// ---------- Carta ----------
// Mismos límites que los checks de carta_items (migración de la sesión 06)
const textoCarta = (max) => z.string().trim().max(max).nullable().optional();
const precio = z.number().int().positive();
const camposItem = {
  nombre: z.string().trim().min(1).max(120),
  descripcion: textoCarta(300),
  traduccion: textoCarta(300),
  detalle: textoCarta(300),
  bodega: textoCarta(80),
  region: textoCarta(80),
  precio: precio.optional(),
  precios: z.array(precio).min(2).optional(),
};
const mover = z.enum(['arriba', 'abajo']);

export const esquemaItemNuevo = z
  .object({ seccionId: z.uuid(), ...camposItem })
  .refine((item) => item.precio != null || item.precios != null, { path: ['precio'] });

export const esquemaItemCambios = z
  .object({ ...camposItem, nombre: camposItem.nombre.optional(), mover: mover.optional() })
  .refine((cambios) => Object.keys(cambios).length > 0);

export const esquemaBodega = z
  .object({ bodega: z.string().trim().min(1).max(80), region: textoCarta(80), mover: mover.optional() })
  .refine((datos) => datos.region !== undefined || datos.mover != null, { path: ['region'] });

export const esquemaCubierto = z.object({ cubierto: precio });

export const esquemaLocal = z.string().regex(/^[a-z0-9-]+$/);
