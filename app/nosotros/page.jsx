import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import GaleriaGrid from '../../src/components/GaleriaGrid/GaleriaGrid.jsx';
import InfoLocal from '../../src/components/InfoLocal/InfoLocal.jsx';
import { LOCALES } from '../../src/data/locales.js';
import { TEXTOS } from '../../src/data/textos.js';
import { MARCA } from '../../src/data/marca.js';
import estilos from './page.module.css';

export default function Nosotros() {
  return (
    <main>
      <Hero
        compacto
        imagen="/img/comunes/hero-marca.svg"
        alt=""
        titulo="Nosotros"
        bajada={MARCA.ciudad}
      />

      {/* Historia: es de la familia, común a los dos salones */}
      <Section ancho="angosto" titulo={TEXTOS.historia.titulo}>
        <div className={estilos.historia}>
          {TEXTOS.historia.parrafos.map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      </Section>

      <Section
        fondo="bordoClaro"
        titulo="Los salones por dentro"
        bajada="Cada uno con su clima. Elegí el que vaya con la noche que tenés en mente."
      >
        <div className={estilos.locales}>
          {LOCALES.map((local, indice) => (
            <article
              key={local.id}
              className={`${estilos.local} ${
                indice % 2 === 1 ? estilos.localInvertido : ''
              }`}
            >
              <div className={estilos.textoLocal}>
                <h3 className={estilos.nombreLocal}>{local.nombre}</h3>
                <p className={estilos.taglineLocal}>{local.tagline}</p>
                <p>{local.descripcion}</p>
              </div>

              <div className={estilos.galeria}>
                <GaleriaGrid imagenes={local.imagenes.galeria} />
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="contacto"
        titulo="Contacto"
        bajada="Escribinos o pasá a vernos. Somos los dos, en la misma cuadra larga."
      >
        <div className={estilos.grillaInfo}>
          {LOCALES.map((local) => (
            <InfoLocal key={local.id} local={local} />
          ))}
        </div>

        <div className={estilos.contactoComun}>
          <p>Para cualquiera de los dos salones:</p>
          <a href={MARCA.instagramUrl} target="_blank" rel="noreferrer" className={estilos.enlaceComun}>
            {MARCA.instagram}
          </a>
          <a href={`mailto:${MARCA.email}`} className={estilos.enlaceComun}>
            {MARCA.email}
          </a>
        </div>
      </Section>
    </main>
  );
}
