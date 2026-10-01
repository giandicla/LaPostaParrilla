'use client';

import { useRef, useState } from 'react';
import estilos from './VisorCarta.module.css';

// Distancia mínima (px) de un deslizamiento horizontal para pasar de hoja
const UMBRAL_SWIPE = 50;

// Muestra la carta tal cual es el PDF de la familia, una hoja a la vez.
// Las hojas son imágenes generadas desde el PDF (scripts/procesar-assets.py):
// se ven idénticas en cualquier navegador y no hace falta un lector de PDF.
// Para hacer zoom o guardarla está el botón al PDF original.
//
// Se pasa de hoja con las flechas, las miniaturas, el teclado (← →) o
// deslizando el dedo. Quien lo usa le pone `key={local.id}` para que al
// cambiar de local vuelva a la primera hoja.
export default function VisorCarta({ hojas, pdf, nombre }) {
  const [indice, setIndice] = useState(0);
  const inicioToque = useRef(null);
  const total = hojas.length;

  const irA = (nuevo) => setIndice(Math.min(Math.max(nuevo, 0), total - 1));

  const alPresionarTecla = (evento) => {
    if (evento.key === 'ArrowRight') irA(indice + 1);
    if (evento.key === 'ArrowLeft') irA(indice - 1);
  };

  const alEmpezarToque = (evento) => {
    inicioToque.current = evento.touches[0].clientX;
  };

  const alTerminarToque = (evento) => {
    if (inicioToque.current === null) return;
    const distancia = evento.changedTouches[0].clientX - inicioToque.current;
    inicioToque.current = null;
    if (distancia <= -UMBRAL_SWIPE) irA(indice + 1);
    if (distancia >= UMBRAL_SWIPE) irA(indice - 1);
  };

  return (
    <div className={estilos.visor}>
      <div
        className={estilos.escenario}
        role="region"
        aria-roledescription="carrusel"
        aria-label={`Carta de ${nombre}`}
        tabIndex={0}
        onKeyDown={alPresionarTecla}
        onTouchStart={alEmpezarToque}
        onTouchEnd={alTerminarToque}
      >
        <button
          type="button"
          className={`${estilos.flecha} ${estilos.anterior}`}
          onClick={() => irA(indice - 1)}
          disabled={indice === 0}
          aria-label="Hoja anterior"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <div className={estilos.hoja}>
          <div
            className={estilos.pista}
            style={{ transform: `translateX(-${indice * 100}%)` }}
          >
            {hojas.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Carta de ${nombre}, hoja ${i + 1} de ${total}`}
                aria-hidden={i !== indice}
                // La hoja visible y sus vecinas se cargan ya, para que el
                // cambio de hoja no espere a la red; el resto, cuando haga falta.
                loading={Math.abs(i - indice) <= 1 ? 'eager' : 'lazy'}
                className={estilos.imagen}
                draggable={false}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`${estilos.flecha} ${estilos.siguiente}`}
          onClick={() => irA(indice + 1)}
          disabled={indice === total - 1}
          aria-label="Hoja siguiente"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <p className={estilos.contador} aria-live="polite">
        Hoja {indice + 1} de {total}
      </p>

      {total > 1 && (
        <ol className={estilos.miniaturas} aria-label="Ir a una hoja">
          {hojas.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                className={`${estilos.miniatura} ${i === indice ? estilos.miniaturaActiva : ''}`}
                onClick={() => irA(i)}
                aria-label={`Ir a la hoja ${i + 1}`}
                aria-current={i === indice ? 'true' : undefined}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className={estilos.acciones}>
        <a href={pdf} target="_blank" rel="noreferrer" className={estilos.enlacePdf}>
          Abrir el PDF para ampliar
        </a>
        <a href={pdf} download className={estilos.enlacePdf}>
          Descargar la carta
        </a>
      </div>
    </div>
  );
}
