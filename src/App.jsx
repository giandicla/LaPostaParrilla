import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';

// En una SPA el navegador no resetea el scroll al cambiar de ruta.
// Sin esto, entrás a /carta y aparecés a mitad de página.
function ScrollAlTope() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollAlTope />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
