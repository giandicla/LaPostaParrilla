import formulario from '../../styles/formulario.module.css';
import estilos from './Campo.module.css';

// Un campo de formulario: etiqueta, control, mensaje de error y ayuda.
// El control se pasa como función y recibe los atributos que lo conectan con
// su etiqueta y sus mensajes (id, aria-invalid, aria-describedby), para que un
// lector de pantalla lea el error al entrar al campo.
//
//   <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
//     {(props) => <input {...props} className={formulario.control} />}
//   </Campo>
export default function Campo({ id, etiqueta, opcional = false, ayuda, error, children }) {
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const describe = [error && idError, ayuda && idAyuda].filter(Boolean).join(' ');

  return (
    <div className={formulario.campo}>
      <label className={formulario.etiqueta} htmlFor={id}>
        {etiqueta}
        {opcional && <span className={formulario.opcional}> (opcional)</span>}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describe || undefined,
      })}
      {error && (
        <p id={idError} className={estilos.error}>
          {error}
        </p>
      )}
      {ayuda && (
        <div id={idAyuda} className={formulario.ayuda}>
          {ayuda}
        </div>
      )}
    </div>
  );
}
