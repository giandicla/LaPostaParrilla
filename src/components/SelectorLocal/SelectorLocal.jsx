'use client';

import estilos from './SelectorLocal.module.css';

// Las opciones son locales o vistas con la misma forma (`id`, `nombre`); una
// opción con `nota` la muestra debajo del nombre (los vinos: "De los dos locales").
export default function SelectorLocal({ locales, localActivoId, onChange }) {
  return (
    <div className={estilos.selector} role="tablist" aria-label="Elegir salón">
      {locales.map((local) => {
        const activo = local.id === localActivoId;
        return (
          <button
            key={local.id}
            type="button"
            role="tab"
            aria-selected={activo}
            className={`${estilos.opcion} ${activo ? estilos.activa : ''}`}
            onClick={() => onChange(local.id)}
          >
            {local.nombre}
            {local.nota && <span className={estilos.nota}>{local.nota}</span>}
          </button>
        );
      })}
    </div>
  );
}
