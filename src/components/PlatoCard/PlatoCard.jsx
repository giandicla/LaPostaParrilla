import estilos from './PlatoCard.module.css';

// Card de plato con foto. Sin precio, a propósito: los precios están solo en
// la carta en PDF, que es la que se mantiene al día.
export default function PlatoCard({ nombre, descripcion, imagen, etiquetaLocal }) {
  return (
    <article className={estilos.card}>
      <img src={imagen} alt={nombre} loading="lazy" className={estilos.imagen} />
      {etiquetaLocal && <span className={estilos.etiqueta}>{etiquetaLocal}</span>}

      <div className={estilos.texto}>
        <h3 className={estilos.nombre}>{nombre}</h3>
        {descripcion && <p className={estilos.descripcion}>{descripcion}</p>}
      </div>
    </article>
  );
}
