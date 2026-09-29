// CARTAS DE EJEMPLO. Los platos y precios son inventados y están acá solo
// para maquetar. Se reemplazan cuando lleguen los PDF reales de cada local.

import { LOCALES } from './locales.js';

const CARTAS = {
  parrilla: [
    {
      categoria: 'Entradas',
      platos: [
        { nombre: 'Provoleta al orégano', descripcion: 'Provolone a la parrilla, orégano y aceite de oliva', precio: 9500 },
        { nombre: 'Empanadas de carne cortada a cuchillo', descripcion: 'Media docena, al horno de barro', precio: 12000 },
        { nombre: 'Tabla de ahumados patagónicos', descripcion: 'Ciervo, jabalí y trucha ahumada de la región', precio: 21000 },
      ],
    },
    {
      categoria: 'De la parrilla',
      platos: [
        { nombre: 'Cordero patagónico al asador', descripcion: 'Cocción lenta a la cruz, seis horas sobre las brasas', precio: 34000, destacado: true },
        { nombre: 'Bife de chorizo', descripcion: '400 g, con papas rústicas al romero', precio: 27000 },
        { nombre: 'Entraña', descripcion: 'A punto, con chimichurri de la casa', precio: 25500 },
        { nombre: 'Parrillada para dos', descripcion: 'Asado, vacío, chorizo, morcilla y achuras', precio: 48000, destacado: true },
      ],
    },
    {
      categoria: 'Guarniciones',
      platos: [
        { nombre: 'Papas al plomo', descripcion: 'Con manteca de hierbas', precio: 7000 },
        { nombre: 'Ensalada de estación', descripcion: 'Hojas verdes, tomate y cebolla morada', precio: 6500 },
      ],
    },
    {
      categoria: 'Postres',
      platos: [
        { nombre: 'Flan casero', descripcion: 'Con dulce de leche y crema', precio: 7500 },
        { nombre: 'Frutos rojos del bosque', descripcion: 'Con helado de crema americana', precio: 8500 },
      ],
    },
    {
      categoria: 'Bebidas',
      platos: [
        { nombre: 'Malbec de la Patagonia', descripcion: 'Copa o botella, consultar etiquetas', precio: 9000 },
        { nombre: 'Cerveza artesanal local', descripcion: 'Pinta, rubia o roja', precio: 6000 },
      ],
    },
  ],
  restaurante: [
    {
      categoria: 'Entradas',
      platos: [
        { nombre: 'Sopa de calabaza y jengibre', descripcion: 'Con crocante de panceta', precio: 9000 },
        { nombre: 'Trucha marinada en cítricos', descripcion: 'Del lago Nahuel Huapi, con eneldo', precio: 15500 },
      ],
    },
    {
      categoria: 'Pastas caseras',
      platos: [
        { nombre: 'Sorrentinos de ciervo', descripcion: 'Con salsa de hongos de pino', precio: 24000, destacado: true },
        { nombre: 'Ñoquis de papa', descripcion: 'Con estofado de cordero de cocción lenta', precio: 22000 },
        { nombre: 'Ravioles de espinaca y ricota', descripcion: 'Con manteca de salvia', precio: 21000 },
      ],
    },
    {
      categoria: 'Principales',
      platos: [
        { nombre: 'Trucha del lago a la manteca negra', descripcion: 'Con papas andinas y alcaparras', precio: 28000, destacado: true },
        { nombre: 'Ciervo braseado en Malbec', descripcion: 'Con puré de zanahoria ahumada', precio: 31000 },
        { nombre: 'Risotto de hongos', descripcion: 'Hongos de pino de la zona y queso de cabra', precio: 23000 },
      ],
    },
    {
      categoria: 'Postres',
      platos: [
        { nombre: 'Volcán de chocolate', descripcion: 'Con helado de dulce de leche', precio: 8500 },
        { nombre: 'Tarta de frambuesas', descripcion: 'De la chacra, con crema batida', precio: 8000 },
      ],
    },
    {
      categoria: 'Bebidas',
      platos: [
        { nombre: 'Pinot Noir patagónico', descripcion: 'Copa o botella, consultar etiquetas', precio: 9500 },
        { nombre: 'Limonada de la casa', descripcion: 'Con menta y jengibre', precio: 5500 },
      ],
    },
  ],
};

export const getCarta = (idLocal) => CARTAS[idLocal] ?? [];

// Dos platos de cada local, para que la home muestre las dos cocinas.
// Se marcan a mano con `destacado: true` en la carta de cada local (arriba),
// en vez de tomar una posición fija: así el destacado es una decisión de
// contenido, no un accidente del orden en que están escritos los platos.
// Se deriva de LOCALES en vez de hardcodear ids.
export const getDestacados = () =>
  LOCALES.flatMap((local) => {
    const carta = getCarta(local.id);
    const platos = carta.flatMap((seccion) => seccion.platos);
    return platos
      .filter((plato) => plato.destacado)
      .map(({ destacado, ...plato }, i) => ({
        ...plato,
        idLocal: local.id,
        nombreLocal: local.nombreCorto,
        imagen: `/img/${local.id}/plato-${i + 1}.svg`,
      }));
  });

export const formatearPrecio = (precio) =>
  precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
