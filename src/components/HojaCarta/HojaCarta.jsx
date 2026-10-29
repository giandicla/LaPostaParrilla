import { fuentesCarta } from '../../styles/fuentesCarta.js';
import { formatearPrecio } from '../../data/carta.js';
import estilos from './HojaCarta.module.css';

// La hoja de la carta, como la carta impresa del local: marco, logo, nombre del
// local y el cubierto al pie. El estilo (recto o redondeado) y la bajada salen
// de `local.carta` (src/data/locales.js). Las secciones van como hijos: una
// columna en la web, dos en la vista de impresión.
export default function HojaCarta({ local, cubierto, columnas = 1, children }) {
  const { estilo, bajada } = local.carta;
  const clases = [estilos.hoja, estilos[estilo], fuentesCarta, columnas === 2 ? estilos.dosColumnas : '']
    .filter(Boolean)
    .join(' ');

  return (
    <article className={clases}>
      <div className={estilos.marco}>
        <header className={estilos.cabecera}>
          <img src="/logo/logo-bordo.svg" alt={local.nombre} className={estilos.logo} />
          <p className={estilos.bajada}>{bajada}</p>
          {estilo === 'recto' && <div className={estilos.ornamento} aria-hidden="true" />}
        </header>

        <div className={estilos.cuerpo}>{children}</div>

        {cubierto && (
          <footer className={estilos.pie}>
            <p>
              <span className={estilos.nombrePie}>Cubierto</span>
              <span className={estilos.traduccionPie} lang="pt">Talheres</span>
            </p>
            <p className={estilos.precioPie}>{formatearPrecio(cubierto)}</p>
          </footer>
        )}
      </div>
    </article>
  );
}
