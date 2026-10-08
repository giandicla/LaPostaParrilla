import Boton from '../Boton/Boton.jsx';
import estilos from './LocalCard.module.css';

// Un salón en la portada: foto, nombre, qué se come y cómo seguir. Horarios
// y dirección están en "Horarios y dirección", más abajo, para no repetirlos.
export default function LocalCard({ local }) {
  return (
    <article className={estilos.local}>
      <img
        src={local.imagenes.card}
        alt={`Salón de ${local.nombre}`}
        loading="lazy"
        className={estilos.imagen}
      />

      <div className={estilos.cuerpo}>
        <h3 className={estilos.nombre}>{local.nombre}</h3>
        <p className={estilos.tagline}>{local.tagline}</p>
        <p className={estilos.descripcion}>{local.descripcion}</p>

        <div className={estilos.acciones}>
          <Boton to={`/reservas?local=${local.id}`}>Reservar en {local.nombreCorto}</Boton>
          <Boton to={`/carta?local=${local.id}`} variante="texto">
            Ver la carta
          </Boton>
        </div>
      </div>
    </article>
  );
}
