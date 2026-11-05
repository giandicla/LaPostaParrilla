'use client';

import { useRef } from 'react';
import estilos from './PestanasCuenta.module.css';

// Pestañas accesibles (patrón "tabs" de WAI-ARIA): flechas izquierda y
// derecha, Inicio y Fin. Solo la pestaña activa entra en el orden del Tab.
//   pestanas  [{ id, etiqueta }]
//   etiqueta  nombre del grupo de pestañas, para el lector de pantalla
//   activa    id de la pestaña elegida
//   alCambiar(id)
export default function PestanasCuenta({ pestanas, etiqueta, activa, alCambiar, children }) {
  const lista = useRef(null);

  const elegir = (indice) => {
    const { id } = pestanas[(indice + pestanas.length) % pestanas.length];
    alCambiar(id);
    lista.current?.querySelector(`#pestana-${id}`)?.focus();
  };

  const alTeclear = (evento) => {
    const actual = pestanas.findIndex((p) => p.id === activa);
    const destino = {
      ArrowRight: actual + 1,
      ArrowLeft: actual - 1,
      Home: 0,
      End: pestanas.length - 1,
    }[evento.key];
    if (destino === undefined) return;
    evento.preventDefault();
    elegir(destino);
  };

  return (
    <div>
      <div ref={lista} role="tablist" aria-label={etiqueta} className={estilos.lista} onKeyDown={alTeclear}>
        {pestanas.map(({ id, etiqueta }) => (
          <button
            key={id}
            id={`pestana-${id}`}
            type="button"
            role="tab"
            aria-selected={id === activa}
            aria-controls="panel-cuenta"
            tabIndex={id === activa ? 0 : -1}
            className={estilos.pestana}
            onClick={() => alCambiar(id)}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      <div id="panel-cuenta" role="tabpanel" aria-labelledby={`pestana-${activa}`} className={estilos.panel}>
        {children}
      </div>
    </div>
  );
}
