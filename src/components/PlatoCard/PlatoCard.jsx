import { formatearPrecio } from '../../data/menu.js';
import estilos from './PlatoCard.module.css';

export default function PlatoCard({ nombre, descripcion, precio, imagen, etiquetaLocal }) {
  return (
    <article className={estilos.card}>
      <div className={estilos.marcoImagen}>
        <img src={imagen} alt={nombre} loading="lazy" className={estilos.imagen} />
        {/* Solo en la home: en la carta el local ya está claro por el contexto */}
        {etiquetaLocal && <span className={estilos.etiqueta}>{etiquetaLocal}</span>}
      </div>

      <div className={estilos.cuerpo}>
        <h3 className={estilos.nombre}>{nombre}</h3>
        <p className={estilos.descripcion}>{descripcion}</p>
        <p className={estilos.precio}>{formatearPrecio(precio)}</p>
      </div>
    </article>
  );
}
