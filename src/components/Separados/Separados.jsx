import estilos from './Separados.module.css';

// Un texto con partes separadas por " · " ("Parrilla & Restaurante · Villa La
// Angostura"). En el celular cada parte va en su línea, sin el punto: si no,
// el punto quedaba al principio de la segunda línea. Desde 600 px, en una línea.
export default function Separados({ texto }) {
  const partes = String(texto).split(' · ');
  return partes.map((parte, i) => (
    <span key={i}>
      {i > 0 && <span className={estilos.separador} aria-hidden="true">·</span>}
      <span className={estilos.parte}>{parte}</span>
      {/* Para lectores de pantalla, una pausa entre partes */}
      {i < partes.length - 1 && <span className="visualmente-oculto">, </span>}
    </span>
  ));
}
