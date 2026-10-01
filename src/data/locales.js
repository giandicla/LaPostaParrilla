// Los dos salones de La Posta.
//
// Son DATOS, no rutas: los componentes iteran sobre LOCALES o reciben un
// objeto local por props. Nadie escribe 'parrilla' ni 'restaurante' a mano.
// Sumar un tercer local es agregar un objeto a este array.

// Hoy los dos locales están uno al lado del otro: comparten dirección, ficha
// de Google Maps, horarios y franjas de reserva. Cada local igual tiene sus
// propios campos, así que si algún día difieren se cambia solo el suyo.
const DIRECCION = 'Av. Arrayanes 263, Q8407 Villa La Angostura, Neuquén';
const MAPA_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d263.345475315839!2d-71.64262525524717!3d-40.762358095137984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9610bfd98a8cbcb9%3A0x88f442e311f5dc39!2sLa%20Posta%20Parrilla%20Patag%C3%B3nica!5e0!3m2!1ses!2sar!4v1790875164019!5m2!1ses!2sar';
// Igual en temporada alta y baja
const HORARIOS = [{ dia: 'Todos los días', franja: '12:00 – 23:00' }];
const FRANJAS_RESERVA = [
  '12:00', '12:15', '12:30', '12:45', '13:00',
  '20:00', '20:15', '20:30', '20:45', '21:00',
];

export const LOCALES = [
  {
    id: 'parrilla',
    nombre: 'La Posta Parrilla',
    nombreCorto: 'La Parrilla',
    tagline: 'Parrilla patagónica',
    descripcion:
      'Cordero al asador, cortes a la parrilla y una carta de vinos larga. ' +
      'El lugar para una mesa larga, sin apuro, frente al fuego.',
    direccion: DIRECCION,
    mapaEmbedUrl: MAPA_EMBED_URL,
    telefono: '+54 9 2944 96-6199',
    whatsapp: '5492944966199', // formato para wa.me, sin + ni espacios
    // La carta en sí vive en src/data/cartas.json; acá solo el PDF original,
    // para quien la quiera descargar.
    cartaPdf: '/cartas/carta-parrilla.pdf',
    horarios: HORARIOS,
    franjasReserva: FRANJAS_RESERVA,
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
    direccion: DIRECCION,
    mapaEmbedUrl: MAPA_EMBED_URL,
    telefono: '+54 9 2944 86-1339',
    whatsapp: '5492944861339',
    cartaPdf: '/cartas/carta-restaurante.pdf',
    horarios: HORARIOS,
    franjasReserva: FRANJAS_RESERVA,
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

// Link a WhatsApp con un mensaje ya escrito, o null si el local no tiene número
export const enlaceWhatsapp = (local, texto) =>
  local?.whatsapp ? `https://wa.me/${local.whatsapp}?text=${encodeURIComponent(texto)}` : null;
