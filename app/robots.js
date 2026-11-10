import { MARCA } from '../src/data/marca.js';

// robots.txt: los buscadores pueden recorrer las páginas públicas; el panel, la
// cuenta y la API no tienen nada para ellos.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/mis-reservas', '/ingresar', '/reservas/pago'],
    },
    sitemap: `${MARCA.sitio}/sitemap.xml`,
  };
}
