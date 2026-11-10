// Datos comunes a los dos locales. Lo que es propio de cada uno vive en locales.js

export const MARCA = {
  nombre: 'La Posta',
  nombreCompleto: 'La Posta · Parrilla & Restaurante',
  bajada: 'Parrilla & Restaurante · Villa La Angostura',
  ciudad: 'Villa La Angostura, Neuquén',
  // El Instagram es uno solo y cubre los dos locales
  instagram: '@lapostavla',
  instagramUrl: 'https://www.instagram.com/lapostavla/',
  email: 'lapostavla@gmail.com', // compartido por los dos locales
  apertura: 'Diciembre de 2020',
  // Dirección pública: para el sitemap, robots.txt y la imagen al compartir el link
  sitio: 'https://lapostaparrilla.vercel.app',
  // Logo vectorial extraído de Logo.ai (scripts/procesar-assets.py).
  // Variante blanca para fondos bordo y fotos; bordo para fondos claros.
  logo: '/logo/logo-blanco.svg',
  logoOscuro: '/logo/logo-bordo.svg',
};
