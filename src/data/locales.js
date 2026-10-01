// Los dos salones de La Posta.
//
// Son DATOS, no rutas: los componentes iteran sobre LOCALES o reciben un
// objeto local por props. Nadie escribe 'parrilla' ni 'restaurante' a mano.
// Sumar un tercer local es agregar un objeto a este array.

export const LOCALES = [
  {
    id: 'parrilla',
    nombre: 'La Posta Parrilla',
    nombreCorto: 'La Parrilla',
    tagline: 'Parrilla patagónica',
    descripcion:
      'Cordero al asador, cortes a la parrilla y una carta de vinos larga. ' +
      'El lugar para una mesa larga, sin apuro, frente al fuego.',
    direccion: 'Villa La Angostura, Neuquén', // PENDIENTE: dirección exacta
    mapaEmbedUrl:
      'https://maps.google.com/maps?q=Villa%20La%20Angostura&z=14&output=embed', // PENDIENTE: embed del local
    telefono: '+54 9 2944 96-6199',
    whatsapp: '5492944966199', // formato para wa.me, sin + ni espacios
    // La carta es el PDF de la familia, rasterizado hoja por hoja para el
    // visor de /carta (scripts/procesar-assets.py). Comida y vinos.
    carta: {
      pdf: '/cartas/carta-parrilla.pdf',
      hojas: [1, 2, 3, 4, 5, 6].map((n) => `/cartas/parrilla-${n}.webp`),
    },
    horarios: [
      // PENDIENTE: horarios reales, incluyendo días de cierre y temporada baja
      { dia: 'Lunes a Jueves', franja: '12:00 – 15:00 · 20:00 – 23:30' },
      { dia: 'Viernes y Sábado', franja: '12:00 – 15:30 · 20:00 – 00:00' },
      { dia: 'Domingo', franja: '12:00 – 16:00' },
    ],
    // PENDIENTE: franjas reales de reserva
    franjasReserva: [
      '12:30', '13:00', '13:30', '14:00',
      '20:00', '20:30', '21:00', '21:30', '22:00',
    ],
    imagenes: {
      card: '/img/parrilla/card.webp',
      hero: '/img/parrilla/hero.webp',
      galeria: [
        { src: '/img/parrilla/cartel.webp', alt: 'Cartel de La Posta Parrilla Patagónica bajo las ramas de un árbol en flor' },
        { src: '/img/parrilla/cordero-patagonico.webp', alt: 'Costillar de cordero patagónico servido junto a una copa de vino tinto' },
        { src: '/img/parrilla/abriendo-vino.webp', alt: 'Mozo descorchando un vino en la mesa' },
      ],
    },
  },
  {
    id: 'restaurante',
    nombre: 'La Posta II Restaurante',
    nombreCorto: 'La Posta II',
    // Es lo que dice el cartel de la entrada
    tagline: 'Pizzas, pastas y cocina de montaña',
    descripcion:
      'Una cabaña de troncos con fogón a leña y la pared llena de vinos. ' +
      'Pastas caseras rellenas, pizzas y platos de olla para las noches frías.',
    direccion: 'Villa La Angostura, Neuquén', // PENDIENTE: dirección exacta
    mapaEmbedUrl:
      'https://maps.google.com/maps?q=Villa%20La%20Angostura&z=14&output=embed', // PENDIENTE: embed del local
    telefono: null, // PENDIENTE: la familia tiene que pasarlo
    whatsapp: null, // PENDIENTE
    carta: {
      pdf: '/cartas/carta-restaurante.pdf',
      hojas: [1, 2].map((n) => `/cartas/restaurante-${n}.webp`),
    },
    horarios: [
      // PENDIENTE: horarios reales
      { dia: 'Martes a Domingo', franja: '12:00 – 15:00 · 19:30 – 23:30' },
      { dia: 'Lunes', franja: 'Cerrado' },
    ],
    // PENDIENTE: franjas reales de reserva
    franjasReserva: [
      '12:30', '13:00', '13:30', '14:00',
      '19:30', '20:00', '20:30', '21:00', '21:30',
    ],
    imagenes: {
      card: '/img/restaurante/card.webp',
      hero: '/img/restaurante/hero.webp',
      galeria: [
        { src: '/img/restaurante/salon.webp', alt: 'Salón de La Posta II con sillas de madera y ventanales' },
        { src: '/img/restaurante/fogon.webp', alt: 'Fogón a leña encendido en una chimenea de piedra' },
        { src: '/img/restaurante/vinos.webp', alt: 'Mueble de madera con botellas de vino junto a las mesas' },
      ],
    },
  },
];

export const ID_LOCAL_POR_DEFECTO = LOCALES[0].id;

export const getLocal = (id) => LOCALES.find((local) => local.id === id);

export const esIdDeLocal = (id) => LOCALES.some((local) => local.id === id);
