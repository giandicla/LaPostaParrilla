'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MARCA } from '../../data/marca.js';
import { useSesion } from '../SesionProvider/SesionProvider.jsx';
import { backendDisponible } from '../../servicios/supabase.js';
import { salir } from '../../servicios/auth.js';
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
  const botonHamburguesaRef = useRef(null);
  const { sesion, esAdmin } = useSesion();

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

  // Escape cierra el panel mobile y devuelve el foco al botón que lo abrió.
  // El listener solo existe mientras el panel está abierto.
  useEffect(() => {
    if (!menuAbierto) return undefined;

    const alPresionarTecla = (evento) => {
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
        botonHamburguesaRef.current?.focus();
      }
    };

    document.addEventListener('keydown', alPresionarTecla);
    return () => document.removeEventListener('keydown', alPresionarTecla);
  }, [menuAbierto]);

  // Fuera del inicio la navbar es siempre sólida: no hay hero debajo
  const solida = scrolleada || menuAbierto || pathname !== '/';

  const esActivo = (ruta) =>
    ruta === '/' ? pathname === '/' : pathname === ruta || pathname.startsWith(`${ruta}/`);

  return (
    <header className={`${estilos.navbar} ${solida ? estilos.solida : ''}`}>
      <nav className={estilos.contenedor} aria-label="Navegación principal">
        <Link href="/" className={estilos.marca}>
          {/* El logo ya contiene el nombre: el alt lo lee en voz alta */}
          <img src={MARCA.logo} alt={MARCA.nombre} className={estilos.logo} />
        </Link>

        <ul className={`${estilos.enlaces} ${menuAbierto ? estilos.enlacesAbiertos : ''}`}>
          {ENLACES.map((enlace) => (
            <li key={enlace.a}>
              <Link
                href={enlace.a}
                className={`${estilos.enlace} ${esActivo(enlace.a) ? estilos.enlaceActivo : ''}`}
                aria-current={esActivo(enlace.a) ? 'page' : undefined}
                onClick={() => setMenuAbierto(false)}
              >
                {enlace.texto}
              </Link>
            </li>
          ))}
          {/* Cuenta: solo si el backend está configurado */}
          {backendDisponible && sesion && (
            <>
              <li>
                <Link href="/mis-reservas" className={`${estilos.enlace} ${esActivo('/mis-reservas') ? estilos.enlaceActivo : ''}`}>
                  Mis reservas
                </Link>
              </li>
              {esAdmin && (
                <li>
                  <Link href="/admin" className={`${estilos.enlace} ${esActivo('/admin') ? estilos.enlaceActivo : ''}`}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <button type="button" className={estilos.enlace} onClick={() => salir()}>
                  Salir
                </button>
              </li>
            </>
          )}
          {backendDisponible && !sesion && (
            <li>
              <Link href="/ingresar" className={`${estilos.enlace} ${esActivo('/ingresar') ? estilos.enlaceActivo : ''}`}>
                Ingresar
              </Link>
            </li>
          )}
          <li className={estilos.itemReservar}>
            <Link
              href="/reservas"
              className={estilos.botonReservar}
              onClick={() => setMenuAbierto(false)}
            >
              Reservar
            </Link>
          </li>
        </ul>

        <button
          ref={botonHamburguesaRef}
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
