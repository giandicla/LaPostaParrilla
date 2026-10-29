'use client';

import { Fragment, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import SelectorLocal from '../../src/components/SelectorLocal/SelectorLocal.jsx';
import SeccionCarta from '../../src/components/SeccionCarta/SeccionCarta.jsx';
import HojaCarta from '../../src/components/HojaCarta/HojaCarta.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO, enlaceWhatsapp } from '../../src/data/locales.js';
import { leerCarta } from '../../src/servicios/carta.js';
import estilos from './page.module.css';

// Índice de la carta: una entrada por sección, salvo las que pertenecen a un
// grupo (las cepas de "Vinos"), que se resumen en una sola entrada al grupo.
const armarIndice = (secciones) => {
  const indice = [];
  secciones.forEach((seccion) => {
    if (!seccion.grupo) indice.push({ id: seccion.id, texto: seccion.titulo });
    else if (!indice.some((entrada) => entrada.texto === seccion.grupo))
      indice.push({ id: seccion.id, texto: seccion.grupo });
  });
  return indice;
};

function CartaContenido() {
  const parametros = useSearchParams();
  const router = useRouter();

  // El local activo sale de la URL. Si el parámetro falta o es basura,
  // se cae al primer local en vez de romper.
  const idPedido = parametros.get('local');
  const idActivo = esIdDeLocal(idPedido) ? idPedido : ID_LOCAL_POR_DEFECTO;
  const local = getLocal(idActivo);

  // La carta se pide a la API cada vez que cambia el local. Se guarda con el
  // id del local para no mostrar la de otro mientras llega la nueva.
  const [pedido, setPedido] = useState({ idLocal: null, carta: null, error: null });
  useEffect(() => {
    let vigente = true;
    leerCarta(idActivo)
      .then((carta) => vigente && setPedido({ idLocal: idActivo, carta, error: null }))
      .catch((error) => vigente && setPedido({ idLocal: idActivo, carta: null, error: error.message }));
    return () => {
      vigente = false;
    };
  }, [idActivo]);
  const cargando = pedido.idLocal !== idActivo;
  const carta = cargando ? null : pedido.carta;

  // Un link con ancla (/carta?local=parrilla#parrilla-entradas) llega antes que
  // la carta: cuando la carta aparece, se va a la sección.
  useEffect(() => {
    if (carta && window.location.hash) {
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
    }
  }, [carta]);

  // replace y no push: cambiar de carta no debería llenar el historial.
  // La carta nueva se empieza a leer desde arriba de todo (pedido del usuario):
  // el scroll lo hace window.scrollTo y no Next, que solo llevaría la sección
  // a la vista y dejaría la portada afuera.
  const cambiarLocal = (id) => {
    router.replace(`/carta?local=${id}`, { scroll: false });
    window.scrollTo({ top: 0 });
  };

  return (
    <main>
      <Hero
        compacto
        imagen={local.imagenes.hero}
        alt=""
        titulo="Nuestra carta"
        bajada={local.nombre}
      />

      <Section>
        <SelectorLocal
          locales={LOCALES}
          localActivoId={idActivo}
          onChange={cambiarLocal}
        />

        {cargando && <p className={estilos.estado}>Cargando la carta…</p>}

        {!cargando && pedido.error && (
          <div className={estilos.estado} role="alert">
            <p>No pudimos cargar la carta. Probá de nuevo en un momento.</p>
            {local.whatsapp && (
              <Boton href={enlaceWhatsapp(local, 'Hola, quería consultar la carta.')} variante="contorno">
                Consultanos por WhatsApp
              </Boton>
            )}
          </div>
        )}

        {carta && (
          <>
            <nav className={estilos.indice} aria-label="Secciones de la carta">
              {armarIndice(carta.secciones).map((entrada) => (
                <a
                  key={entrada.id}
                  href={`#${idActivo}-${entrada.id}`}
                  className={estilos.enlaceIndice}
                >
                  {entrada.texto}
                </a>
              ))}
            </nav>

            <HojaCarta local={local} cubierto={carta.cubierto}>
              {carta.secciones.map((seccion, i) => {
                // El título del grupo va una sola vez, antes de su primera sección
                const abreGrupo =
                  seccion.grupo && carta.secciones[i - 1]?.grupo !== seccion.grupo;
                return (
                  <Fragment key={seccion.id}>
                    {abreGrupo && <h2 className={estilos.tituloGrupo}>{seccion.grupo}</h2>}
                    <SeccionCarta seccion={seccion} idAncla={`${idActivo}-${seccion.id}`} />
                  </Fragment>
                );
              })}
            </HojaCarta>

            <p className={estilos.pie}>
              La carta puede cambiar según la temporada y lo que consigamos en la zona.
            </p>
          </>
        )}
      </Section>
    </main>
  );
}

export default function Carta() {
  // useSearchParams() adentro de CartaContenido exige un límite de Suspense
  // para que la ruta se pueda seguir prerenderizando como estática.
  return (
    <Suspense fallback={null}>
      <CartaContenido />
    </Suspense>
  );
}
