// Genera los placeholders de public/img/ hasta que lleguen las fotos reales.
// Uso: node scripts/gen-placeholders.mjs
//
// Cuando la familia pase las fotos: reemplazar cada .svg por el .jpg real y
// actualizar las extensiones en src/data/locales.js y src/data/menu.js.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const PALETA = {
  parrilla: ['#5F0004', '#7A1218', '#8B5E3C'],
  restaurante: ['#3E2A22', '#8B5E3C', '#5F0004'],
  comunes: ['#5F0004', '#1C1512', '#8B5E3C'],
};

function svg({ ancho, alto, colores, etiqueta }) {
  const [a, b, c] = colores;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${etiqueta}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="60%" stop-color="${b}"/>
      <stop offset="100%" stop-color="${c}"/>
    </linearGradient>
  </defs>
  <rect width="${ancho}" height="${alto}" fill="url(#g)"/>
  <g fill="#F5EFE6" opacity="0.55">
    <circle cx="${ancho * 0.75}" cy="${alto * 0.3}" r="${Math.min(ancho, alto) * 0.22}" opacity="0.12"/>
    <circle cx="${ancho * 0.2}" cy="${alto * 0.8}" r="${Math.min(ancho, alto) * 0.3}" opacity="0.08"/>
  </g>
  <text x="50%" y="50%" fill="#F5EFE6" opacity="0.8" font-family="Georgia, serif"
        font-size="${Math.round(Math.min(ancho, alto) * 0.075)}" text-anchor="middle" dominant-baseline="middle">
    ${etiqueta}
  </text>
</svg>`;
}

const ARCHIVOS = [
  // parrilla
  ['public/img/parrilla/hero.svg', 1920, 1080, 'parrilla', 'Salón parrilla'],
  ['public/img/parrilla/galeria-1.svg', 800, 600, 'parrilla', 'Salón'],
  ['public/img/parrilla/galeria-2.svg', 800, 1000, 'parrilla', 'Asador'],
  ['public/img/parrilla/galeria-3.svg', 800, 600, 'parrilla', 'Brasas'],
  ['public/img/parrilla/plato-1.svg', 600, 450, 'parrilla', 'Plato'],
  ['public/img/parrilla/plato-2.svg', 600, 450, 'parrilla', 'Plato'],
  ['public/img/parrilla/card.svg', 900, 700, 'parrilla', 'La Parrilla'],
  // restaurante
  ['public/img/restaurante/hero.svg', 1920, 1080, 'restaurante', 'Salón restaurante'],
  ['public/img/restaurante/galeria-1.svg', 800, 600, 'restaurante', 'Salón'],
  ['public/img/restaurante/galeria-2.svg', 800, 1000, 'restaurante', 'Mesa'],
  ['public/img/restaurante/galeria-3.svg', 800, 600, 'restaurante', 'Ventanal'],
  ['public/img/restaurante/plato-1.svg', 600, 450, 'restaurante', 'Plato'],
  ['public/img/restaurante/plato-2.svg', 600, 450, 'restaurante', 'Plato'],
  ['public/img/restaurante/card.svg', 900, 700, 'restaurante', 'El Restaurante'],
  // comunes
  ['public/img/comunes/hero-marca.svg', 1920, 1080, 'comunes', 'La Posta'],
  ['public/img/comunes/bienvenida-1.svg', 800, 600, 'comunes', 'La Posta'],
  ['public/img/comunes/bienvenida-2.svg', 800, 1000, 'comunes', 'La Posta'],
  ['public/img/comunes/bienvenida-3.svg', 800, 600, 'comunes', 'La Posta'],
];

for (const [ruta, ancho, alto, tema, etiqueta] of ARCHIVOS) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, svg({ ancho, alto, colores: PALETA[tema], etiqueta }), 'utf8');
  console.log('✓', ruta);
}

console.log(`\n${ARCHIVOS.length} placeholders generados.`);
