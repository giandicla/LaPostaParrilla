import Link from 'next/link';
import { MARCA } from '../../data/marca.js';
import { LOCALES } from '../../data/locales.js';
import estilos from './Footer.module.css';

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className={estilos.footer}>
      <div className={estilos.contenedor}>
        <div className={estilos.columnaMarca}>
          <img src={MARCA.logo} alt={MARCA.nombre} className={estilos.logo} />
          <p className={estilos.bajada}>{MARCA.bajada}</p>
          <a
            href={MARCA.instagramUrl}
            className={estilos.instagram}
            target="_blank"
            rel="noreferrer"
          >
            {MARCA.instagram}
          </a>
        </div>

        {LOCALES.map((local) => (
          <div key={local.id} className={estilos.columna}>
            <h3 className={estilos.tituloColumna}>{local.nombre}</h3>
            <address className={estilos.direccion}>{local.direccion}</address>
            {local.telefono && (
              <a href={`tel:${local.telefono.replace(/\s|-/g, '')}`} className={estilos.enlace}>
                {local.telefono}
              </a>
            )}
          </div>
        ))}

        <nav className={estilos.columna} aria-label="Navegación del pie">
          <h3 className={estilos.tituloColumna}>Secciones</h3>
          <Link href="/" className={estilos.enlace}>Inicio</Link>
          <Link href="/carta" className={estilos.enlace}>Carta</Link>
          <Link href="/reservas" className={estilos.enlace}>Reservas</Link>
          <Link href="/nosotros" className={estilos.enlace}>Nosotros</Link>
        </nav>
      </div>

      <p className={estilos.credito}>
        © {anio} {MARCA.nombre} · {MARCA.ciudad}
      </p>
    </footer>
  );
}
