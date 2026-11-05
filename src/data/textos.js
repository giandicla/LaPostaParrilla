// Copys largos, separados del JSX para que se puedan cambiar sin tocar componentes.
// PENDIENTE: la familia tiene que revisar y corregir estos textos — son un borrador.

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
  historia: {
    titulo: 'La familia detrás de La Posta',
    parrafos: [
      // PENDIENTE: historia real y nombres de la familia (abrieron en diciembre
      // de 2020, ver MARCA.apertura)
      'Empezamos con un solo salón y la idea simple de cocinar como cocinábamos en casa: ' +
        'producto de la zona, cocciones largas y nada apurado.',
      'Con los años abrimos el segundo local, pared de por medio con el primero, para darle ' +
        'lugar propio a la cocina de olla sin sacarle espacio a La Posta Parrilla.',
      'Seguimos siendo los mismos: una familia, dos salones y la misma manera de recibir.',
    ],
  },
  // Va junto al botón de /reservas. Redacción del usuario (2026-10-08); la primera oración se ajustó al flujo con seña (2026-10-18).
  avisoReserva:
    'La reserva queda confirmada cuando se acredita la seña. ' +
    'Podés gestionarla desde la sección "Mis reservas" hasta 1 hora antes.',
};
