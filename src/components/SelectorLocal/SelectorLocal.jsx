'use client';

import estilos from './SelectorLocal.module.css';

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
            {local.nombreCorto}
          </button>
        );
      })}
    </div>
  );
}
