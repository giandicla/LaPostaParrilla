import estilos from './GaleriaGrid.module.css';

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
