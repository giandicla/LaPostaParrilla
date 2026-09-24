import { Playfair_Display, Inter } from 'next/font/google';
import Navbar from '../src/components/Navbar/Navbar.jsx';
import Footer from '../src/components/Footer/Footer.jsx';
import '../src/styles/tokens.css';
import '../src/styles/global.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--fuente-titulo',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--fuente-cuerpo',
});

export const metadata = {
  title: 'La Posta · Parrilla & Restaurante · Villa La Angostura',
  description:
    'La Posta — Parrilla y Restaurante en Villa La Angostura. Dos salones, cocina patagónica y reservas online.',
  icons: { icon: '/logo.jpg' },
};

export const viewport = {
  themeColor: '#5F0004',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
