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
    tagline: 'Brasas, cordero y fuegos patagónicos',
    descripcion:
      'Nuestro salón de parrilla, con la leña a la vista y los cortes al asador. ' +
      'El lugar para una mesa larga, sin apuro, frente al fuego.',
    direccion: 'Villa La Angostura, Neuquén', // PENDIENTE: dirección exacta
    mapaEmbedUrl:
      'https://maps.google.com/maps?q=Villa%20La%20Angostura&z=14&output=embed', // PENDIENTE: embed del local
    telefono: '+54 9 2944 96-6199',
    whatsapp: '5492944966199', // formato para wa.me, sin + ni espacios
    cartaUrl:
      'https://www.canva.com/design/DAGkMvwV_fU/XfpQdDldp_dO58eCMU5Sdg/edit',
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
      hero: '/img/parrilla/hero.svg',
      galeria: [
        { src: '/img/parrilla/galeria-1.svg', alt: 'Salón de la parrilla con mesas de madera' },
        { src: '/img/parrilla/galeria-2.svg', alt: 'Cortes de carne al asador sobre las brasas' },
        { src: '/img/parrilla/galeria-3.svg', alt: 'Detalle del fuego y la leña de la parrilla' },
      ],
    },
  },
  {
    id: 'restaurante',
    nombre: 'La Posta Restaurante',
    nombreCorto: 'El Restaurante',
    tagline: 'Cocina de montaña, pastas y pesca del lago',
    descripcion:
      'Nuestro salón de restaurante, más recogido y a media luz. ' +
      'Platos de olla, pastas caseras y la trucha del lago.',
    direccion: 'Villa La Angostura, Neuquén', // PENDIENTE: dirección exacta
    mapaEmbedUrl:
      'https://maps.google.com/maps?q=Villa%20La%20Angostura&z=14&output=embed', // PENDIENTE: embed del local
    telefono: null, // PENDIENTE: la familia tiene que pasarlo
    whatsapp: null, // PENDIENTE
    cartaUrl: null, // PENDIENTE: existe un segundo Canva, falta el link
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
      hero: '/img/restaurante/hero.svg',
      galeria: [
        { src: '/img/restaurante/galeria-1.svg', alt: 'Salón del restaurante a media luz' },
        { src: '/img/restaurante/galeria-2.svg', alt: 'Mesa servida con pastas caseras' },
        { src: '/img/restaurante/galeria-3.svg', alt: 'Ventanal del restaurante con vista al bosque' },
      ],
    },
  },
];

export const ID_LOCAL_POR_DEFECTO = LOCALES[0].id;

export const getLocal = (id) => LOCALES.find((local) => local.id === id);

export const esIdDeLocal = (id) => LOCALES.some((local) => local.id === id);
