// Generado por scripts/variantes-img.mjs: no editar a mano.
// Anchos disponibles de cada foto; el último es la original.
const ANCHOS = {
  "/img/comunes/entrada-noche.webp": [
    480,
    960,
    1200
  ],
  "/img/comunes/hero-cordero.webp": [
    480,
    960,
    1638
  ],
  "/img/comunes/salon-calido.webp": [
    480,
    960,
    1200
  ],
  "/img/comunes/sirviendo-vino.webp": [
    480,
    960,
    1200
  ],
  "/img/parrilla/abriendo-vino.webp": [
    480,
    960,
    1200
  ],
  "/img/parrilla/card.webp": [
    480,
    960,
    1200
  ],
  "/img/parrilla/cartel.webp": [
    480,
    960,
    1200
  ],
  "/img/parrilla/cordero-patagonico.webp": [
    480,
    960,
    1200
  ],
  "/img/parrilla/hero.webp": [
    480,
    960,
    1638
  ],
  "/img/parrilla/plato-bife.webp": [
    480,
    960,
    1000
  ],
  "/img/parrilla/plato-cordero.webp": [
    480,
    960,
    1000
  ],
  "/img/parrilla/plato-don-pedro.webp": [
    480,
    960,
    1000
  ],
  "/img/parrilla/plato-sorrentinos.webp": [
    480,
    960,
    1000
  ],
  "/img/parrilla/reserva.webp": [
    480,
    960,
    1200
  ],
  "/img/parrilla/tira-de-asado.webp": [
    480,
    960,
    1200
  ],
  "/img/restaurante/card.webp": [
    480,
    960,
    1200
  ],
  "/img/restaurante/fogon.webp": [
    480,
    960,
    1200
  ],
  "/img/restaurante/hero.webp": [
    480,
    960,
    1638
  ],
  "/img/restaurante/plato-albondigas.webp": [
    480,
    960,
    1000
  ],
  "/img/restaurante/plato-pizza.webp": [
    480,
    960,
    1000
  ],
  "/img/restaurante/plato-trucha.webp": [
    480,
    960,
    1000
  ],
  "/img/restaurante/plato-volcan.webp": [
    480,
    960,
    1000
  ],
  "/img/restaurante/reserva.webp": [
    480,
    960,
    1200
  ],
  "/img/restaurante/salon.webp": [
    480,
    960,
    1200
  ],
  "/img/restaurante/tres-pizzas.webp": [
    480,
    960,
    1200
  ],
  "/img/restaurante/vinos.webp": [
    480,
    960,
    1200
  ]
};

// srcSet de una foto de public/img: las versiones chicas y la original. Una
// ruta que no está en la lista (por ejemplo, un SVG) no lleva srcSet.
export function srcSetDe(src) {
  const anchos = ANCHOS[src];
  if (!anchos) return undefined;
  const ultimo = anchos.length - 1;
  return anchos
    .map((ancho, i) => `${i === ultimo ? src : src.replace(/\.webp$/, `-${ancho}.webp`)} ${ancho}w`)
    .join(', ');
}
