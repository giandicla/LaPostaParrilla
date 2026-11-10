import { MARCA } from '../src/data/marca.js';

// sitemap.xml: las páginas públicas del sitio
const PAGINAS = [
  { ruta: '', prioridad: 1 },
  { ruta: '/carta', prioridad: 0.9 },
  { ruta: '/reservas', prioridad: 0.9 },
  { ruta: '/nosotros', prioridad: 0.6 },
];

export default function sitemap() {
  return PAGINAS.map(({ ruta, prioridad }) => ({
    url: `${MARCA.sitio}${ruta}`,
    changeFrequency: 'monthly',
    priority: prioridad,
  }));
}
