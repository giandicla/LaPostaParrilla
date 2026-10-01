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

import CARTAS from './cartas.json';

export const getCarta = (idLocal) => CARTAS[idLocal] ?? null;

export const formatearPrecio = (precio) =>
  precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
