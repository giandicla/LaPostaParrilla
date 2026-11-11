import Link from 'next/link';
import { MARCA } from '../../data/marca.js';
import { LOCALES, datosEnComun, enlaceComoLlegar } from '../../data/locales.js';
import Icono from '../Icono/Icono.jsx';
import Telefono from '../Telefono/Telefono.jsx';
import estilos from './Footer.module.css';

export default function Footer() {
  const anio = new Date().getFullYear();
  // Los salones están uno al lado del otro: la dirección va una sola vez
  const direccionComun = datosEnComun()?.direccion;

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
            <Icono nombre="instagram" />
            {MARCA.instagram}
          </a>
          <a href={`mailto:${MARCA.email}`} className={estilos.instagram}>
            <Icono nombre="mail" />
            {MARCA.email}
          </a>
        </div>

        <div className={estilos.columna}>
          <h3 className={estilos.tituloColumna}>Dónde estamos</h3>
          {direccionComun ? (
            <>
              <address className={estilos.direccion}>{direccionComun}</address>
              <a href={enlaceComoLlegar(direccionComun)} className={estilos.enlace} target="_blank" rel="noreferrer">
                Cómo llegar
              </a>
            </>
          ) : (
            LOCALES.map((local) => (
              <address key={local.id} className={estilos.direccion}>
                {local.nombre}: {local.direccion}
              </address>
            ))
          )}
        </div>

        <div className={estilos.columna}>
          <h3 className={estilos.tituloColumna}>Contacto</h3>
          {LOCALES.filter((local) => local.telefono).map((local) => (
            <p key={local.id} className={estilos.contacto}>
              <span className={estilos.nombreLocal}>{local.nombre}</span>
              <Telefono numero={local.telefono} className={estilos.enlace} />
            </p>
          ))}
        </div>

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
