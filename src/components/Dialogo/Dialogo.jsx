'use client';

import { useEffect, useId, useRef } from 'react';
import Boton from '../Boton/Boton.jsx';
import estilos from './Dialogo.module.css';

// Una pregunta antes de una acción que no se deshace (cancelar una reserva,
// eliminar un producto). Reemplaza a window.confirm y window.prompt, que no
// llevan el estilo del sitio.
//
// Es un <dialog> abierto con showModal(): el navegador atrapa el foco adentro y
// avisa del Escape. Al cerrar, el foco vuelve al botón que lo abrió.
//
// Se monta cuando hace falta y se desmonta al cerrar:
//
//   {porEliminar && (
//     <Dialogo titulo="Eliminar de la carta" confirmar="Eliminar" volver="No, volver"
//       alConfirmar={eliminar} alCerrar={() => setPorEliminar(null)}>
//       <p>¿Eliminar «{porEliminar.nombre}» de la carta?</p>
//     </Dialogo>
//   )}
//
// alConfirmar no cierra el diálogo: lo cierra quien lo usa, para poder dejarlo
// abierto si falta un dato (el motivo de la cancelación).
export default function Dialogo({ titulo, confirmar, volver, alConfirmar, alCerrar, children }) {
  const dialogo = useRef(null);
  const idTitulo = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    const abridor = document.activeElement;
    // showModal falta en navegadores viejos: ahí queda como diálogo sin modal
    if (elemento.showModal) elemento.showModal();
    else elemento.setAttribute('open', '');
    return () => {
      elemento.close?.();
      // Al desmontarse, el foco vuelve al botón que lo abrió (si sigue en la página)
      if (abridor?.isConnected) abridor.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogo}
      className={estilos.dialogo}
      aria-labelledby={idTitulo}
      // Escape. No se usa onClose: también se dispara al desmontar (close() de arriba)
      onCancel={(evento) => {
        evento.preventDefault();
        alCerrar();
      }}
      // Un clic en el fondo oscuro (fuera de la caja) cierra
      onClick={(evento) => evento.target === dialogo.current && alCerrar()}
    >
      <form
        className={estilos.caja}
        noValidate
        onSubmit={(evento) => {
          evento.preventDefault();
          alConfirmar();
        }}
      >
        <h2 id={idTitulo} className={estilos.titulo}>{titulo}</h2>
        <div className={estilos.cuerpo}>{children}</div>
        <div className={estilos.acciones}>
          <Boton type="submit">{confirmar}</Boton>
          <Boton variante="secundario" onClick={alCerrar}>{volver}</Boton>
        </div>
      </form>
    </dialog>
  );
}
