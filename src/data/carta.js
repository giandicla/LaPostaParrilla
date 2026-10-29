// La carta vive en la base (tablas carta_secciones y carta_items) y se pide a
// la API (app/api/v1/carta); su forma está documentada en src/servidor/carta.js.
// Acá quedan cómo se escribe un precio y la vista de vinos.

// La carta de vinos (y copas) es una sola para los dos locales: no es un local,
// es una tercera vista de la carta. Tiene la forma que HojaCarta y SelectorLocal
// esperan de un local (`nombre`, `carta.estilo`, `carta.bajada`), más `nota`.
export const CARTA_VINOS = {
  id: 'vinos',
  nombre: 'Vinos',
  nota: 'De los dos locales',
  carta: { estilo: 'recto', bajada: 'Carta de vinos' },
};

export const formatearPrecio = (precio) =>
  precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
