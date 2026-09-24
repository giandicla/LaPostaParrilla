import { Link } from 'react-router-dom';
import estilos from './Boton.module.css';

export default function Boton({
  variante = 'primario',
  tamano = 'md',
  to,
  href,
  children,
  className = '',
  ...resto
}) {
  const clases = `${estilos.boton} ${estilos[variante]} ${estilos[tamano]} ${className}`;

  // Navegación interna: Link de React Router, para no recargar la página
  if (to) {
    return (
      <Link to={to} className={clases} {...resto}>
        {children}
      </Link>
    );
  }

  // Link externo: siempre en pestaña nueva, con rel de seguridad
  if (href) {
    return (
      <a href={href} className={clases} target="_blank" rel="noreferrer" {...resto}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={clases} {...resto}>
      {children}
    </button>
  );
}
