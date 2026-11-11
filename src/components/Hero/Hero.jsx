import { MARCA } from '../../data/marca.js';
import Separados from '../Separados/Separados.jsx';
import estilos from './Hero.module.css';
import { srcSetDe } from '../../data/imagenes.js';

// entera: en pantallas apaisadas la foto (vertical) se muestra completa al
// centro, y a los costados la misma foto agrandada y desenfocada. Sin esto, una
// foto vertical se agranda hasta cubrir el ancho y se ve solo una franja.
export default function Hero({
  titulo,
  bajada,
  imagen,
  alt = '',
  entera = false,
  conLogo = false,
  compacto = false,
  acciones,
}) {
  return (
    <header className={`${estilos.hero} ${compacto ? estilos.compacto : ''} ${entera ? estilos.entera : ''}`}>
      {/* Misma foto que la de adelante: el navegador la baja una sola vez */}
      {entera && (
        <img src={imagen} srcSet={srcSetDe(imagen)} sizes="100vw" alt="" aria-hidden="true" className={estilos.difuso} />
      )}
      <img
        src={imagen}
        srcSet={srcSetDe(imagen)}
        sizes="100vw"
        alt={alt}
        className={estilos.fondo}
        /* el hero es lo primero que se ve: no se difiere su carga */
        fetchPriority="high"
      />
      <div className={estilos.velo} aria-hidden="true" />

      <div className={estilos.contenido}>
        {conLogo ? (
          /* Como en la portada del manual: el logo dentro de un marco fino.
             El logo ya dice el nombre, así que el h1 queda para lectores de
             pantalla y buscadores, sin repetirlo en pantalla. */
          <div className={estilos.marco}>
            <h1 className="visualmente-oculto">{titulo}</h1>
            <img src={MARCA.logo} alt="" className={estilos.logo} />
            {bajada && <p className={estilos.bajadaMarco}><Separados texto={bajada} /></p>}
          </div>
        ) : (
          <>
            <h1 className={compacto ? estilos.tituloCompacto : estilos.titulo}>{titulo}</h1>
            {bajada && <p className={estilos.bajada}><Separados texto={bajada} /></p>}
          </>
        )}
        {acciones && <div className={estilos.acciones}>{acciones}</div>}
      </div>
    </header>
  );
}
