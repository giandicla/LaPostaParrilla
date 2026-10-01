import { Libre_Baskerville, Cabin } from 'next/font/google';
import Navbar from '../src/components/Navbar/Navbar.jsx';
import Footer from '../src/components/Footer/Footer.jsx';
import SesionProvider from '../src/components/SesionProvider/SesionProvider.jsx';
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

export const metadata = {
  title: 'La Posta · Parrilla & Restaurante · Villa La Angostura',
  description:
    'La Posta — Parrilla y Restaurante en Villa La Angostura. Dos salones, cocina patagónica y reservas online.',
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
