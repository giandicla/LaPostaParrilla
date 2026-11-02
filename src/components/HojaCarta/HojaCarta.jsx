import { fuentesCarta } from '../../styles/fuentesCarta.js';
import { formatearPrecio } from '../../data/carta.js';
import estilos from './HojaCarta.module.css';

// La hoja de la carta, como la carta impresa de la parrilla: doble marco, logo,
// bajada con el ornamento y el cubierto al pie. Las tres cartas (parrilla, vinos
// y restaurante) usan la misma estética, pedido del usuario. La bajada sale de
// `local.carta` (src/data/locales.js; la vista de vinos, CARTA_VINOS en
// src/data/carta.js). Las secciones van como hijos, una abajo de la otra.
export default function HojaCarta({ local, cubierto, children }) {
  const { bajada } = local.carta;
  const clases = [estilos.hoja, fuentesCarta].join(' ');

  return (
    <article className={clases}>
      <div className={estilos.marco}>
        <header className={estilos.cabecera}>
          <img src="/logo/logo-bordo.svg" alt={local.nombre} className={estilos.logo} />
          <p className={estilos.bajada}>{bajada}</p>
          <div className={estilos.ornamento} aria-hidden="true" />
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
