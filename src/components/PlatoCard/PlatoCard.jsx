import estilos from './PlatoCard.module.css';

// Plato con foto y su nombre abajo, como un epígrafe. Sin precio, a
// propósito: los precios están solo en la carta, que es la que se mantiene
// al día.
export default function PlatoCard({ nombre, descripcion, imagen }) {
  return (
    <figure className={estilos.plato}>
      <img src={imagen} alt="" loading="lazy" className={estilos.imagen} />
      <figcaption className={estilos.texto}>
        <span className={estilos.nombre}>{nombre}</span>
        {descripcion && <span className={estilos.descripcion}>{descripcion}</span>}
      </figcaption>
    </figure>
  );
}
