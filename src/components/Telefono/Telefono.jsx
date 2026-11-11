import estilos from './Telefono.module.css';

// Un teléfono: en celulares (pantalla táctil) es un link para llamar; con
// mouse se muestra como texto, porque en la compu un tel: no abre nada útil.
export default function Telefono({ numero, className = '' }) {
  return (
    <>
      <a href={`tel:${numero.replace(/\s|-/g, '')}`} className={`${estilos.llamar} ${className}`}>
        {numero}
      </a>
      <span className={`${estilos.texto} ${className}`}>{numero}</span>
    </>
  );
}
