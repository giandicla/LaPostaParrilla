'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MARCA } from '../../data/marca.js';
import estilos from './Navbar.module.css';

const ENLACES = [
  { a: '/', texto: 'Inicio' },
  { a: '/carta', texto: 'Carta' },
  { a: '/nosotros', texto: 'Nosotros' },
];

export default function Navbar() {
  const [scrolleada, setScrolleada] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const pathname = usePathname();

  // La navbar arranca translúcida sobre el hero y se vuelve sólida al bajar
  useEffect(() => {
    const alScrollear = () => setScrolleada(window.scrollY > 80);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  // Cerrar el menú mobile al navegar. Ajuste de estado durante el render
  // (en vez de un efecto) porque no sincroniza con nada externo.
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setMenuAbierto(false);
  }

  // Con el menú abierto, el fondo no debe scrollear
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  // Fuera del inicio la navbar es siempre sólida: no hay hero debajo
  const solida = scrolleada || menuAbierto || pathname !== '/';

  const esActivo = (ruta) => (ruta === '/' ? pathname === '/' : pathname.startsWith(ruta));

  return (
    <header className={`${estilos.navbar} ${solida ? estilos.solida : ''}`}>
      <nav className={estilos.contenedor} aria-label="Navegación principal">
        <Link href="/" className={estilos.marca}>
          <img src={MARCA.logo} alt="" className={estilos.logo} />
          <span className={estilos.nombreMarca}>{MARCA.nombre}</span>
        </Link>

        <ul className={`${estilos.enlaces} ${menuAbierto ? estilos.enlacesAbiertos : ''}`}>
          {ENLACES.map((enlace) => (
            <li key={enlace.a}>
              <Link
                href={enlace.a}
                className={`${estilos.enlace} ${esActivo(enlace.a) ? estilos.enlaceActivo : ''}`}
                aria-current={esActivo(enlace.a) ? 'page' : undefined}
              >
                {enlace.texto}
              </Link>
            </li>
          ))}
          <li className={estilos.itemReservar}>
            <Link href="/reservas" className={estilos.botonReservar}>
              Reservar
            </Link>
          </li>
        </ul>

        <button
          type="button"
          className={estilos.hamburguesa}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`${estilos.barra} ${menuAbierto ? estilos.barraX1 : ''}`} />
          <span className={`${estilos.barra} ${menuAbierto ? estilos.barraOculta : ''}`} />
          <span className={`${estilos.barra} ${menuAbierto ? estilos.barraX2 : ''}`} />
        </button>
      </nav>
    </header>
  );
}
