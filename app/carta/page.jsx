'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import SelectorLocal from '../../src/components/SelectorLocal/SelectorLocal.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO } from '../../src/data/locales.js';
import { getCarta, formatearPrecio } from '../../src/data/menu.js';
import estilos from './page.module.css';

export function CartaContenido() {
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

        <p className={estilos.aclaracion}>
          Precios de referencia. La carta puede cambiar según la temporada y lo que
          consigamos en la zona.
        </p>

        {/* Índice de categorías: ancla a cada bloque de la carta */}
        <nav className={estilos.indice} aria-label="Categorías de la carta">
          {carta.map((seccion) => (
            <a
              key={seccion.categoria}
              href={`#${idActivo}-${seccion.categoria}`}
              className={estilos.enlaceIndice}
            >
              {seccion.categoria}
            </a>
          ))}
        </nav>

        <div className={estilos.carta}>
          {carta.map((seccion) => (
            <section
              key={seccion.categoria}
              id={`${idActivo}-${seccion.categoria}`}
              className={estilos.categoria}
            >
              <h2 className={estilos.tituloCategoria}>{seccion.categoria}</h2>
              <ul className={estilos.platos}>
                {seccion.platos.map((plato) => (
                  <li key={plato.nombre} className={estilos.plato}>
                    <div className={estilos.lineaPlato}>
                      <h3 className={estilos.nombrePlato}>{plato.nombre}</h3>
                      <span className={estilos.puntos} aria-hidden="true" />
                      <span className={estilos.precioPlato}>
                        {formatearPrecio(plato.precio)}
                      </span>
                    </div>
                    <p className={estilos.descripcionPlato}>{plato.descripcion}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Section>

      <Section fondo="bordoClaro" ancho="angosto">
        <div className={estilos.bloqueCanva}>
          <h2>La carta oficial, siempre al día</h2>
          <p>
            La familia actualiza la carta de {local.nombreCorto} desde Canva, así que
            ahí siempre está la versión más reciente.
          </p>
          {local.cartaUrl ? (
            <Boton href={local.cartaUrl} tamano="lg">
              Abrir la carta de {local.nombreCorto}
            </Boton>
          ) : (
            /* Sin link todavía: se dice, no se muestra un botón roto */
            <p className={estilos.sinCarta}>
              Estamos terminando de cargar la carta digital de {local.nombreCorto}.
              Mientras tanto, la de arriba es de referencia.
            </p>
          )}
        </div>
      </Section>
    </main>
  );
}

export default function Carta() {
  return (
    <Suspense fallback={null}>
      <CartaContenido />
    </Suspense>
  );
}
