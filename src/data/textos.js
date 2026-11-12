// Copys largos, separados del JSX para que se puedan cambiar sin tocar componentes.
// Textos del usuario o del manual de marca, revisados por él al 2026-11-11: ya no son borrador.

export const TEXTOS = {
  // Redacción del usuario (2026-11-05), con retoques de estilo
  bienvenida: {
    titulo: 'Dos salones, una misma mesa',
    parrafos: [
      'La Posta es un lugar cálido en el corazón de Villa La Angostura: dos propuestas ' +
        'gastronómicas en dos locales, uno al lado del otro.',
      'En La Posta Parrilla nos enfocamos en los cortes clásicos y en nuestro tradicional ' +
        'cordero patagónico al asador. En La Posta II Restaurante, la carta se centra en ' +
        'las pizzas, las pastas caseras y otros platos hechos con productos de primera ' +
        'calidad. Dos maneras distintas de disfrutar tu paso por Villa La Angostura.',
    ],
  },
  // Textuales del manual de marca (Branding.LaPosta.pdf, hoja 2)
  valores: [
    {
      titulo: 'Tradición',
      texto:
        'Celebramos los sabores, los métodos y la hospitalidad propia del sur argentino. ' +
        'Cada corte, cada fuego, honra la historia de nuestras tierras.',
    },
    {
      titulo: 'Producto noble',
      texto: 'La materia prima manda, el sabor habla.',
    },
    {
      titulo: 'Dedicación',
      texto:
        'Cada preparación lleva su ritmo. Creemos en el valor de esperar lo justo, ' +
        'en cocinar sin apuros, y en ofrecer un plato que refleje cuidado y oficio.',
    },
  ],
  // Idea y frases del usuario (2026-11-11), redactadas por la IA a su pedido: el
  // equipo como familia, no la familia que abrió el restaurante
  historia: {
    titulo: 'La familia detrás de La Posta',
    parrafos: [
      'La Posta reúne dos propuestas gastronómicas en Villa La Angostura, cada una con su ' +
        'propia identidad. Detrás de cada mesa hay un equipo que trabaja como una familia: ' +
        'en la cocina, en el salón y en cada detalle.',
      'Compartimos una misma dedicación por la buena gastronomía, la calidad de nuestros ' +
        'productos y la atención a quienes nos visitan.',
      'Dos espacios diferentes, unidos por el gusto de recibir y hacerte sentir como en casa.',
    ],
  },
  // Van junto al botón de /reservas. Redacción del usuario (2026-11-11): deja claro que
  // con menos de 1 hora no se puede cancelar y la seña no se devuelve
  avisoReserva:
    'La reserva se confirma una vez que se realiza el pago de la seña. ' +
    'Podés gestionarla desde la sección "Mis reservas" hasta una hora antes.',
  avisoSena:
    'Podés pagar con cualquier medio de pago a través de la redirección a la página ' +
    'oficial de Mercado Pago. Si cancelás la reserva hasta una hora antes, te devolvemos ' +
    'la seña al mismo medio de pago. Con menos de una hora de anticipación no se puede ' +
    'cancelar y la seña no será devuelta. Si cancelamos nosotros, te la devolvemos en ' +
    'cualquier caso.',
};
