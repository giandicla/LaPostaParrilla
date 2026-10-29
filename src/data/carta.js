// La carta vive en la base (tablas carta_secciones y carta_items) y se pide a
// la API (app/api/v1/carta); su forma está documentada en src/servidor/carta.js.
// Acá queda solo cómo se escribe un precio.

export const formatearPrecio = (precio) =>
  precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
