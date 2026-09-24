import { MARCA } from '../../data/marca.js';
import estilos from './Hero.module.css';

export default function Hero({
  titulo,
  bajada,
  imagen,
  alt = '',
  conLogo = false,
  compacto = false,
  acciones,
}) {
  return (
    <header className={`${estilos.hero} ${compacto ? estilos.compacto : ''}`}>
      <img
        src={imagen}
        alt={alt}
        className={estilos.fondo}
        /* el hero es lo primero que se ve: no se difiere su carga */
        fetchPriority="high"
      />
      <div className={estilos.velo} aria-hidden="true" />

      <div className={estilos.contenido}>
        {conLogo && <img src={MARCA.logo} alt="" className={estilos.logo} />}
        <h1 className={compacto ? estilos.tituloCompacto : estilos.titulo}>{titulo}</h1>
        {bajada && <p className={estilos.bajada}>{bajada}</p>}
        {acciones && <div className={estilos.acciones}>{acciones}</div>}
      </div>
    </header>
  );
}
