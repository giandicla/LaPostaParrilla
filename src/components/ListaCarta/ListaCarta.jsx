'use client';

import { useEffect, useRef, useState } from 'react';
import { borrarItem, ubicarBodega, ubicarItem } from '../../servicios/carta.js';
import { posicionTrasArrastre } from '../../data/editorCarta.js';
import { formatearPrecio } from '../../data/carta.js';
import Dialogo from '../Dialogo/Dialogo.jsx';
import estilos from './ListaCarta.module.css';

// La carta en el panel: una fila por producto, con ⠿ para cambiarlo de lugar
// (arrastrando con el mouse o el dedo, o con las flechas del teclado), y Editar
// y Eliminar. Se mueve dentro de su categoría; en vinos, dentro de su bodega, y
// las bodegas enteras dentro de su tipo de vino.
//
//   carta: la carta de la vista, como la da la API
//   idEditando: el producto que está en la caja (su fila se resalta)
//   alEditar({ item, seccion, bodega? }), alCambiar(), alError(mensaje)
export default function ListaCarta({ carta, idEditando, alEditar, alCambiar, alError, alAviso }) {
  // { tipo: 'item' | 'bodega', id, grupo, destino } mientras se arrastra. El
  // estado dibuja; la ref la leen los eventos, que con un arrastre rápido llegan
  // antes del render siguiente.
  const [arrastre, setArrastreEstado] = useState(null);
  const arrastreActual = useRef(null);
  const setArrastre = (valor) => {
    arrastreActual.current = valor;
    setArrastreEstado(valor);
  };
  const [ocupado, setOcupado] = useState(false);
  // El producto por el que se está preguntando "¿eliminar?"
  const [porEliminar, setPorEliminar] = useState(null);
  // Después de mover con el teclado, el foco vuelve al asa de esa fila
  const focoPendiente = useRef(null);

  useEffect(() => {
    if (!focoPendiente.current) return;
    document.querySelector(`[data-asa="${CSS.escape(focoPendiente.current)}"]`)?.focus();
    focoPendiente.current = null;
  }, [carta]);

  // aviso: lo que se muestra arriba cuando salió bien (si no, se borra el anterior)
  const hacer = async (accion, aviso = '') => {
    setOcupado(true);
    try {
      await accion();
      await alCambiar();
      alAviso?.(aviso);
    } catch (error) {
      alError(error.message);
    } finally {
      setOcupado(false);
    }
  };

  // La línea que marca dónde cae: debajo del destino si se baja, arriba si se sube
  const claseDestino = (ids, idDestino) =>
    ids.indexOf(idDestino) > ids.indexOf(arrastre?.id) ? estilos.destinoAbajo : estilos.destinoArriba;

  // ids: el orden actual del grupo; mover(id, posicion) hace el pedido
  const asa = ({ tipo, id, grupo, ids, nombre, mover }) => {
    const empezar = (evento) => {
      if (ocupado) return;
      evento.currentTarget.setPointerCapture(evento.pointerId);
      setArrastre({ tipo, id, grupo, destino: null });
    };
    const seguir = (evento) => {
      const arrastre = arrastreActual.current;
      if (arrastre?.id !== id) return;
      const fila = document.elementFromPoint(evento.clientX, evento.clientY)?.closest(`[data-grupo="${CSS.escape(grupo)}"]`);
      const destino = fila?.dataset.id ?? null;
      if (destino !== arrastre.destino) setArrastre({ ...arrastre, destino });
    };
    const soltar = () => {
      const arrastre = arrastreActual.current;
      const destino = arrastre?.id === id ? arrastre.destino : null;
      setArrastre(null);
      if (destino && destino !== id) hacer(() => mover(id, posicionTrasArrastre(ids, id, destino)));
    };
    const teclado = (evento) => {
      const indice = ids.indexOf(id);
      const nueva = evento.key === 'ArrowUp' ? indice : evento.key === 'ArrowDown' ? indice + 2 : null;
      if (nueva == null) return;
      evento.preventDefault();
      if (ocupado || nueva < 1 || nueva > ids.length) return;
      focoPendiente.current = id;
      hacer(() => mover(id, nueva));
    };
    return (
      <button
        type="button"
        className={estilos.asa}
        data-asa={id}
        aria-label={`Mover ${nombre}`}
        aria-describedby="lista-ayuda-mover"
        onPointerDown={empezar}
        onPointerMove={seguir}
        onPointerUp={soltar}
        onPointerCancel={() => setArrastre(null)}
        onKeyDown={teclado}
      >
        ⠿
      </button>
    );
  };

  const fila = (item, seccion, bodega, ids) => {
    const grupo = bodega ? `${seccion.idSeccion}:${bodega.bodega}` : seccion.idSeccion;
    const clases = [
      estilos.fila,
      item.id === idEditando ? estilos.editando : '',
      arrastre?.id === item.id ? estilos.arrastrando : '',
      arrastre?.destino === item.id && arrastre.id !== item.id ? claseDestino(ids, item.id) : '',
    ].join(' ');
    return (
      <li key={item.id} className={clases} data-grupo={grupo} data-id={item.id}>
        {asa({ tipo: 'item', id: item.id, grupo, ids, nombre: item.nombre, mover: ubicarItem })}
        <span className={estilos.nombre}>
          {item.nombre}
          {(item.traduccion || item.detalle) && <small>{item.traduccion ?? item.detalle}</small>}
        </span>
        <span className={estilos.precio}>
          {item.precios ? item.precios.map(formatearPrecio).join(' · ') : item.precio != null && formatearPrecio(item.precio)}
        </span>
        <button type="button" className={estilos.accion} onClick={() => alEditar({ item, seccion, bodega })}>
          Editar<span className="visualmente-oculto"> {item.nombre}</span>
        </button>
        <button
          type="button"
          className={`${estilos.accion} ${estilos.eliminar}`}
          disabled={ocupado}
          onClick={() => setPorEliminar(item)}
        >
          Eliminar<span className="visualmente-oculto"> {item.nombre}</span>
        </button>
      </li>
    );
  };

  return (
    <div className={estilos.lista}>
      <p id="lista-ayuda-mover" className="visualmente-oculto">
        Arrastrá para cambiarlo de lugar, o usá las flechas arriba y abajo.
      </p>

      {porEliminar && (
        <Dialogo
          titulo="Eliminar de la carta"
          confirmar="Eliminar"
          volver="No, volver"
          alConfirmar={() => {
            const { id, nombre } = porEliminar;
            setPorEliminar(null);
            hacer(() => borrarItem(id), `Eliminado: ${nombre}.`);
          }}
          alCerrar={() => setPorEliminar(null)}
        >
          <p>¿Eliminar «{porEliminar.nombre}» de la carta? Deja de verse en la carta del sitio.</p>
        </Dialogo>
      )}

      {carta.secciones.map((seccion) => {
        const nombresBodegas = (seccion.bodegas ?? []).map((b) => b.bodega);
        return (
          <section key={seccion.idSeccion} className={estilos.seccion} aria-labelledby={`lista-${seccion.idSeccion}`}>
            <h3 id={`lista-${seccion.idSeccion}`} className={estilos.tituloSeccion}>
              {seccion.titulo}
              {seccion.tamanos && <span> · {seccion.tamanos.join(' / ')}</span>}
            </h3>

            {seccion.items && (
              <ul className={estilos.filas}>
                {seccion.items.map((item) => fila(item, seccion, null, seccion.items.map((i) => i.id)))}
              </ul>
            )}

            {seccion.bodegas?.map((bodega) => {
              const grupoBodegas = `bodegas:${seccion.idSeccion}`;
              const claveBodega = `${seccion.idSeccion}:${bodega.bodega}`;
              return (
                <div
                  key={bodega.bodega}
                  className={`${estilos.bodega} ${
                    arrastre?.destino === claveBodega && arrastre.id !== claveBodega
                      ? claseDestino(nombresBodegas.map((nombre) => `${seccion.idSeccion}:${nombre}`), claveBodega)
                      : ''
                  }`}
                  data-grupo={grupoBodegas}
                  data-id={claveBodega}
                >
                  <div className={estilos.cabeceraBodega}>
                    {asa({
                      tipo: 'bodega',
                      id: claveBodega,
                      grupo: grupoBodegas,
                      ids: nombresBodegas.map((nombre) => `${seccion.idSeccion}:${nombre}`),
                      nombre: `la bodega ${bodega.bodega}`,
                      mover: (_, posicion) => ubicarBodega(seccion.idSeccion, bodega.bodega, posicion),
                    })}
                    <span className={estilos.nombreBodega}>{bodega.bodega}</span>
                    {bodega.region && <span className={estilos.region}>{bodega.region}</span>}
                  </div>
                  <ul className={estilos.filas}>
                    {bodega.vinos.map((vino) => fila(vino, seccion, bodega, bodega.vinos.map((v) => v.id)))}
                  </ul>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
