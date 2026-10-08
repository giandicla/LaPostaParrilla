import estilos from './Section.module.css';

export default function Section({
  id,
  fondo = 'papel',
  titulo,
  bajada,
  ancho = 'normal',
  children,
  className = '',
}) {
  return (
    <section id={id} className={`${estilos.seccion} ${estilos[fondo]} ${className}`}>
      <div className={`${estilos.contenedor} ${estilos[ancho]}`}>
        {titulo && (
          <header className={estilos.encabezado}>
            <h2 className={estilos.titulo}>{titulo}</h2>
            {bajada && <p className={estilos.bajada}>{bajada}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
