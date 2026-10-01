'use client';

import { Fragment, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import SelectorLocal from '../../src/components/SelectorLocal/SelectorLocal.jsx';
import SeccionCarta from '../../src/components/SeccionCarta/SeccionCarta.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO } from '../../src/data/locales.js';
import { getCarta, formatearPrecio } from '../../src/data/carta.js';
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
  const carta = getCarta(idActivo);

  // replace y no push: cambiar de carta no debería llenar el historial.
  // scroll: false para no saltar al tope al tocar el toggle.
  const cambiarLocal = (id) =>
    router.replace(`/carta?local=${id}`, { scroll: false });

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

        {carta ? (
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

            <div className={estilos.carta}>
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
            </div>

            <footer className={estilos.pie}>
              {carta.cubierto && <p>Cubierto: {formatearPrecio(carta.cubierto)}</p>}
              <p>La carta puede cambiar según la temporada y lo que consigamos en la zona.</p>
              {local.cartaPdf && (
                <a href={local.cartaPdf} download className={estilos.enlacePdf}>
                  Descargar la carta en PDF
                </a>
              )}
            </footer>
          </>
        ) : (
          /* Sin carta cargada: se dice, no se muestra una carta vacía */
          <p className={estilos.sinCarta}>
            Estamos terminando de cargar la carta de {local.nombre}.
          </p>
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
