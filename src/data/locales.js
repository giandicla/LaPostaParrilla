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
    tagline: 'Parrilla patagónica',
    descripcion:
      'Cordero al asador, cortes a la parrilla y una carta de vinos larga. ' +
      'El lugar para una mesa larga, sin apuro, frente al fuego.',
    direccion: DIRECCION,
    mapaEmbedUrl: MAPA_EMBED_URL,
    telefono: '+54 9 2944 96-6199',
    whatsapp: '5492944966199', // formato para wa.me, sin + ni espacios
    // Cómo se ve su carta (la hoja de HojaCarta), como el PDF impreso del local.
    // La carta en sí vive en la base (tablas carta_secciones y carta_items).
    carta: { bajada: 'Parrilla Patagónica' },
    horarios: HORARIOS,
    franjasReserva: FRANJAS_RESERVA,
    imagenes: {
      card: '/img/parrilla/card.webp',
      // La foto del frente es vertical y la tarjeta apaisada: se muestra la
      // parte de arriba, así el cartel "LA POSTA" queda a la vista
      encuadreCard: 'center top',
      hero: '/img/parrilla/hero.webp',
      // La foto para elegir salón en /reservas (en prueba, pedido del usuario)
      reserva: '/img/parrilla/reserva.webp',
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
    // Es lo que dice el cartel de la entrada
    tagline: 'Pizzas, pastas y cocina de montaña',
    descripcion:
      'Una cabaña de troncos con fogón a leña y la pared llena de vinos. ' +
      'Pastas caseras rellenas, pizzas y platos de olla para las noches frías.',
    direccion: DIRECCION,
    mapaEmbedUrl: MAPA_EMBED_URL,
    telefono: '+54 9 2944 86-1339',
    whatsapp: '5492944861339',
    carta: { bajada: 'Restaurante' },
    horarios: HORARIOS,
    franjasReserva: FRANJAS_RESERVA,
    imagenes: {
      card: '/img/restaurante/card.webp',
      hero: '/img/restaurante/hero.webp',
      reserva: '/img/restaurante/reserva.webp',
      galeria: [
        { src: '/img/restaurante/salon.webp', alt: 'Salón de La Posta II Restaurante con sillas de madera y ventanales' },
        { src: '/img/restaurante/fogon.webp', alt: 'Fogón a leña encendido en una chimenea de piedra' },
        { src: '/img/restaurante/vinos.webp', alt: 'Mueble de madera con botellas de vino junto a las mesas' },
      ],
    },
  },
];

export const ID_LOCAL_POR_DEFECTO = LOCALES[0].id;

export const getLocal = (id) => LOCALES.find((local) => local.id === id);

export const esIdDeLocal = (id) => LOCALES.some((local) => local.id === id);

// Mensaje para pedir por WhatsApp una reserva de grupo, con lo que ya se
// completó en el formulario. Lo que está vacío no aparece en la frase.
// fechaTexto ya viene formateada ("viernes 9 de octubre").
export function mensajeReservaWhatsapp({ local, fechaTexto, hora, nombre, personas }) {
  let texto = `Hola! Me gustaría hacer una reserva en ${local.nombre}`;
  if (fechaTexto) texto += ` para el ${fechaTexto}${hora ? ` a las ${hora}` : ''},`;
  const detalles = [];
  if (nombre?.trim()) detalles.push(`a nombre de ${nombre.trim()}`);
  detalles.push(`para ${personas} personas`);
  return `${texto} ${detalles.join(', ')}.`;
}

// Link a WhatsApp con un mensaje ya escrito, o null si el local no tiene número
export const enlaceWhatsapp = (local, texto) =>
  local?.whatsapp ? `https://wa.me/${local.whatsapp}?text=${encodeURIComponent(texto)}` : null;
