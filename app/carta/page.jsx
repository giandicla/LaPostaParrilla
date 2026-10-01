'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import SelectorLocal from '../../src/components/SelectorLocal/SelectorLocal.jsx';
import VisorCarta from '../../src/components/VisorCarta/VisorCarta.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO } from '../../src/data/locales.js';
import estilos from './page.module.css';

function CartaContenido() {
  const parametros = useSearchParams();
  const router = useRouter();

  // El local activo sale de la URL. Si el parámetro falta o es basura,
  // se cae al primer local en vez de romper.
  const idPedido = parametros.get('local');
  const idActivo = esIdDeLocal(idPedido) ? idPedido : ID_LOCAL_POR_DEFECTO;
  const local = getLocal(idActivo);

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

        {local.carta ? (
          // key: al cambiar de local, el visor vuelve a la primera hoja
          <VisorCarta
            key={local.id}
            hojas={local.carta.hojas}
            pdf={local.carta.pdf}
            nombre={local.nombre}
          />
        ) : (
          /* Sin carta cargada: se dice, no se muestra un visor vacío */
          <p className={estilos.sinCarta}>
            Estamos terminando de cargar la carta de {local.nombre}.
          </p>
        )}

        <p className={estilos.aclaracion}>
          La carta puede cambiar según la temporada y lo que consigamos en la zona.
        </p>
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
