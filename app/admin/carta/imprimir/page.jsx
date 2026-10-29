'use client';

import { Fragment, Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Boton from '../../../../src/components/Boton/Boton.jsx';
import RequiereSesion from '../../../../src/components/RequiereSesion/RequiereSesion.jsx';
import HojaCarta from '../../../../src/components/HojaCarta/HojaCarta.jsx';
import SeccionCarta from '../../../../src/components/SeccionCarta/SeccionCarta.jsx';
import { esIdDeLocal, getLocal, ID_LOCAL_POR_DEFECTO } from '../../../../src/data/locales.js';
import { leerCarta } from '../../../../src/servicios/carta.js';
import estilos from './page.module.css';

// La carta de un local lista para imprimir o guardar como PDF: hoja oficio, dos
// columnas, el marco del local en cada hoja. Se arma con lo que hay en la base
// en este momento y abre la ventana de imprimir apenas carga.
function CartaParaImprimir() {
  const parametros = useSearchParams();
  const idLocal = esIdDeLocal(parametros.get('local')) ? parametros.get('local') : ID_LOCAL_POR_DEFECTO;
  const local = getLocal(idLocal);
  const [pedido, setPedido] = useState({ carta: null, error: '' });
  const imprimio = useRef(false);

  useEffect(() => {
    leerCarta(idLocal, { fresca: true })
      .then((carta) => setPedido({ carta, error: '' }))
      .catch((e) => setPedido({ carta: null, error: e.message }));
  }, [idLocal]);

  // Una sola vez, cuando la carta ya está en pantalla (y las fuentes cargadas)
  useEffect(() => {
    if (!pedido.carta || imprimio.current) return;
    imprimio.current = true;
    document.fonts.ready.then(() => window.print());
  }, [pedido.carta]);

  if (pedido.error) return <p role="alert">{pedido.error}</p>;
  if (!pedido.carta) return <p role="status">Cargando la carta…</p>;

  const { secciones, cubierto } = pedido.carta;
  return (
    <>
      <div className={estilos.barra}>
        <Boton to="/admin/carta" variante="texto">← Volver a la carta</Boton>
        <Boton onClick={() => window.print()}>Imprimir / Guardar PDF</Boton>
      </div>

      <HojaCarta local={local} cubierto={cubierto} columnas={2}>
        {secciones.map((seccion, i) => {
          const abreGrupo = seccion.grupo && secciones[i - 1]?.grupo !== seccion.grupo;
          return (
            <Fragment key={seccion.id}>
              {abreGrupo && <h2 className={estilos.tituloGrupo}>{seccion.grupo}</h2>}
              <SeccionCarta seccion={seccion} idAncla={`${idLocal}-${seccion.id}`} />
            </Fragment>
          );
        })}
      </HojaCarta>
    </>
  );
}

export default function ImprimirCarta() {
  return (
    <main className={estilos.main}>
      <Suspense fallback={null}>
        <RequiereSesion admin>
          <CartaParaImprimir />
        </RequiereSesion>
      </Suspense>
    </main>
  );
}
