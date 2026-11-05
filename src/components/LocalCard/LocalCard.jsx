import Boton from '../Boton/Boton.jsx';
import estilos from './LocalCard.module.css';
import { srcSetDe } from '../../data/imagenes.js';

export default function LocalCard({ local }) {
  // Resumen de horario: solo la primera franja, para no llenar la card.
  // Un local sin horarios cargados no muestra el dato (no se inventa).
  const primerHorario = local.horarios?.[0];

  return (
    <article className={estilos.card}>
      <div className={estilos.marcoImagen}>
        <img
          src={local.imagenes.card}
          srcSet={srcSetDe(local.imagenes.card)}
          sizes="(min-width: 900px) 50vw, 100vw"
          alt={`Salón de ${local.nombre}`}
          loading="lazy"
          className={estilos.imagen}
          style={local.imagenes.encuadreCard ? { objectPosition: local.imagenes.encuadreCard } : undefined}
        />
        <span className={estilos.etiqueta}>{local.nombre}</span>
      </div>

      <div className={estilos.cuerpo}>
        <h3 className={estilos.nombre}>{local.nombre}</h3>
        <p className={estilos.tagline}>{local.tagline}</p>
        <p className={estilos.descripcion}>{local.descripcion}</p>

        <dl className={estilos.datos}>
          <div className={estilos.dato}>
            <dt>Dónde</dt>
            <dd>{local.direccion}</dd>
          </div>
          {primerHorario && (
            <div className={estilos.dato}>
              <dt>{primerHorario.dia}</dt>
              <dd>{primerHorario.franja}</dd>
            </div>
          )}
        </dl>

        <div className={estilos.acciones}>
          <Boton to={`/reservas?local=${local.id}`}>Reservar acá</Boton>
          <Boton to={`/carta?local=${local.id}`} variante="texto">
            Ver la carta
          </Boton>
        </div>
      </div>
    </article>
  );
}
