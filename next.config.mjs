// Cabeceras de seguridad para todo el sitio (auditoría del 2026-11-06). Solo
// las que no pueden romper nada: el sitio no se muestra dentro de otro
// (frame-ancestors, contra el clickjacking), el navegador no adivina tipos de
// archivo y a otros sitios solo les llega el dominio de donde viene el usuario.
const CABECERAS_DE_SEGURIDAD = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: CABECERAS_DE_SEGURIDAD }];
  },
};

export default nextConfig;
