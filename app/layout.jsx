import { Libre_Baskerville, Cabin } from 'next/font/google';
import Navbar from '../src/components/Navbar/Navbar.jsx';
import Footer from '../src/components/Footer/Footer.jsx';
import SesionProvider from '../src/components/SesionProvider/SesionProvider.jsx';
import { MARCA } from '../src/data/marca.js';
import '../src/styles/tokens.css';
import '../src/styles/global.css';

// Manual de marca: Baskerville para títulos, Gill Sans Nova para textos.
// Cabin es el respaldo de Gill Sans (ver --font-cuerpo en tokens.css).
const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--fuente-titulo',
});

const cabin = Cabin({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--fuente-cuerpo',
});

const TITULO = 'La Posta · Parrilla & Restaurante · Villa La Angostura';
const DESCRIPCION =
  'La Posta — Parrilla y Restaurante en Villa La Angostura. Dos salones, cocina patagónica y reservas online.';

// El título de cada sección lo pone su layout.jsx ("Carta · La Posta"); el inicio
// usa el completo. La imagen es la que muestran WhatsApp y las redes al pegar el
// link (public/img/compartir.jpg, 1200 × 630).
export const metadata = {
  metadataBase: new URL(MARCA.sitio),
  title: { default: TITULO, template: '%s · La Posta' },
  description: DESCRIPCION,
  openGraph: {
    type: 'website',
    siteName: MARCA.nombreCompleto,
    locale: 'es_AR',
    title: TITULO,
    description: DESCRIPCION,
    images: [{ url: '/img/compartir.jpg', width: 1200, height: 630, alt: 'Cordero patagónico y una copa de vino en La Posta' }],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  themeColor: '#600003',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${baskerville.variable} ${cabin.variable}`}>
      <body>
        <SesionProvider>
          <Navbar />
          {children}
          <Footer />
        </SesionProvider>
      </body>
    </html>
  );
}
