import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import GaleriaGrid from '../../src/components/GaleriaGrid/GaleriaGrid.jsx';
import Visitanos from '../../src/components/Visitanos/Visitanos.jsx';
import { LOCALES } from '../../src/data/locales.js';
import { TEXTOS } from '../../src/data/textos.js';
import { MARCA } from '../../src/data/marca.js';
import Icono from '../../src/components/Icono/Icono.jsx';
import estilos from './page.module.css';

export const metadata = {
  title: 'Nosotros',
  description: 'La historia de La Posta, sus dos salones en Villa La Angostura y cómo llegar.',
};

export default function Nosotros() {
  return (
    <main>
      <Hero
        compacto
        imagen="/img/comunes/salon-calido.webp"
        alt=""
        titulo="Nosotros"
        bajada={MARCA.ciudad}
      />

      {/* El equipo como familia, común a los dos salones */}
      <Section ancho="angosto" titulo={TEXTOS.historia.titulo}>
        <div className={estilos.historia}>
          {TEXTOS.historia.parrafos.map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      </Section>

      <Section
        fondo="arena"
        titulo="Los salones por dentro"
        bajada="Dos salones con identidad propia. Elegí el que mejor se ajuste a lo que buscás disfrutar hoy."
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
                {/* Texto propio de Nosotros; si un local no lo tiene, va el del inicio */}
                <p>{local.descripcionNosotros ?? local.descripcion}</p>
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
        bajada="Contactanos o pasá a visitarnos. Nuestros restaurantes te esperan juntos, puerta con puerta."
      >
        {/* La misma tarjeta que "Visitanos" del inicio */}
        <Visitanos />

        <div className={estilos.contactoComun}>
          <p>Para cualquiera de los dos salones:</p>
          <a href={MARCA.instagramUrl} target="_blank" rel="noreferrer" className={estilos.enlaceComun}>
            <Icono nombre="instagram" />
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
