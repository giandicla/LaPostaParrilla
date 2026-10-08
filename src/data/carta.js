// Las cartas de cada local, transcriptas de los PDF de la familia.
//
// Los datos viven en cartas.json para que se puedan cargar tal cual en la
// base de datos cuando llegue el backend. Forma de cada carta:
//
//   { cubierto, secciones: [seccion] }
//   seccion de platos: { id, titulo, nota?, tamanos?, items: [{ nombre,
//                        descripcion?, traduccion?, precio? | precios? }] }
//   seccion de vinos:  { id, titulo, grupo: 'Vinos', bodegas: [{ bodega,
//                        region, vinos: [{ nombre, detalle?, precio }] }] }
//
// `precios` (en plural) va con `tamanos`: un precio por tamaño, en orden.
//
// La carta de vinos (con "Copas y descorche") es la misma en los dos locales:
// vive una sola vez, en vinos.json, y se suma al final de cada carta.

import CARTAS from './cartas.json' with { type: 'json' };
import VINOS from './vinos.json' with { type: 'json' };

export function getCarta(idLocal) {
  const carta = CARTAS[idLocal];
  if (!carta) return null;
  return { ...carta, secciones: [...carta.secciones, ...VINOS.secciones] };
}

export const formatearPrecio = (precio) =>
  precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
