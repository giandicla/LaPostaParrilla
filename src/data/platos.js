// "Algunos de nuestros platos": la selección con foto de la home.
//
// A propósito NO llevan precio: los precios viven solo en la carta en PDF
// (ver `carta` en locales.js), que es la que la familia mantiene al día.
// Los nombres salen tal cual de esas cartas.

import { LOCALES } from './locales.js';

const PLATOS = {
  parrilla: [
    {
      nombre: 'Cordero al asador',
      descripcion: 'Cordero patagónico a la cruz, horas junto al fuego.',
      imagen: '/img/parrilla/plato-cordero.webp',
    },
    {
      nombre: 'Bife de chorizo',
      descripcion: 'El clásico de la parrilla, al punto que lo pidas.',
      imagen: '/img/parrilla/plato-bife.webp',
    },
    {
      nombre: 'Sorrentinos de cordero',
      descripcion: 'Pasta casera con salsa de finas hierbas.',
      imagen: '/img/parrilla/plato-sorrentinos.webp',
    },
    {
      nombre: 'Don Pedro',
      descripcion: 'Helado artesanal, nueces y un chorrito de whisky.',
      imagen: '/img/parrilla/plato-don-pedro.webp',
    },
  ],
  restaurante: [
    {
      nombre: 'Pizza de rúcula, tomates secos y parmesano',
      descripcion: 'Masa casera, rúcula fresca y parmesano en láminas.',
      imagen: '/img/restaurante/plato-pizza.webp',
    },
    {
      nombre: 'Cazuela de mini albóndigas',
      descripcion: 'En salsa, para compartir al centro de la mesa.',
      imagen: '/img/restaurante/plato-albondigas.webp',
    },
    {
      // PENDIENTE: confirmar con la familia que la foto es la trucha al roquefort
      nombre: 'Trucha al roquefort',
      descripcion: 'Trucha con salsa cremosa de queso azul.',
      imagen: '/img/restaurante/plato-trucha.webp',
    },
    {
      nombre: 'Volcán de chocolate',
      descripcion: 'Centro tibio, con helado de crema.',
      imagen: '/img/restaurante/plato-volcan.webp',
    },
  ],
};

// Se deriva de LOCALES en vez de hardcodear ids: un local sin platos cargados
// simplemente no aporta ninguno.
export const getPlatosDestacados = () =>
  LOCALES.flatMap((local) =>
    (PLATOS[local.id] ?? []).map((plato) => ({
      ...plato,
      idLocal: local.id,
      nombreLocal: local.nombreCorto,
    }))
  );
