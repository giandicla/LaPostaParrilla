import estilos from './GaleriaGrid.module.css';

// Contrato: `imagenes` debe traer exactamente 3 fotos. El layout las acomoda
// en una grilla de 2 columnas donde la segunda imagen ocupa las dos filas de
// la derecha, así que tiene que ser la vertical (retrato); la primera y la
// tercera van apiladas a la izquierda en formato horizontal (4:3).
export default function GaleriaGrid({ imagenes }) {
  return (
    <ul className={estilos.grilla}>
      {imagenes.map((imagen) => (
        <li key={imagen.src} className={estilos.item}>
          <img src={imagen.src} alt={imagen.alt} loading="lazy" className={estilos.imagen} />
        </li>
      ))}
    </ul>
  );
}
