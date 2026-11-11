import Hero from '../src/components/Hero/Hero.jsx';
import Section from '../src/components/Section/Section.jsx';
import Boton from '../src/components/Boton/Boton.jsx';
import LocalCard from '../src/components/LocalCard/LocalCard.jsx';
import PlatoCard from '../src/components/PlatoCard/PlatoCard.jsx';
import Visitanos from '../src/components/Visitanos/Visitanos.jsx';
import { MARCA } from '../src/data/marca.js';
import { TEXTOS } from '../src/data/textos.js';
import { LOCALES } from '../src/data/locales.js';
import { getPlatosDestacados } from '../src/data/platos.js';
import estilos from './page.module.css';
import { srcSetDe } from '../src/data/imagenes.js';

// Los datos son estáticos: no hace falta recalcularlos en cada render.
const PLATOS = getPlatosDestacados();

// Fotos y encuadres elegidos por el usuario (2026-11-05). La segunda es la
// alta de la derecha. `posicion` es qué parte de la foto se ve al recortarla
// (object-position, horizontal y vertical).
const FOTOS_BIENVENIDA = [
  { src: '/img/parrilla/tira-de-asado.webp', alt: 'Tira de asado sobre tabla de madera, con una copa de vino', posicion: '54% 81%' },
  { src: '/img/comunes/sirviendo-vino.webp', alt: 'Mozo sirviendo vino tinto en la mesa', posicion: '64% 30%' },
  { src: '/img/restaurante/tres-pizzas.webp', alt: 'Tres pizzas de La Posta II Restaurante sobre la mesa', posicion: '100% 20%' },
];

export default function Inicio() {
  return (
    <main>
      <Hero
        imagen="/img/comunes/hero-cordero.webp"
        entera
        alt=""
        conLogo
        titulo={MARCA.nombreCompleto}
        bajada={MARCA.bajada}
        acciones={
          <>
            <Boton to="/reservas" variante="claro" tamano="lg">Reservar mesa</Boton>
            <Boton to="/carta" variante="contorno" tamano="lg">Ver la carta</Boton>
          </>
        }
      />

      <Section>
        <div className={estilos.bienvenida}>
          <div className={estilos.textoBienvenida}>
            <h2>{TEXTOS.bienvenida.titulo}</h2>
            {TEXTOS.bienvenida.parrafos.map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
            <Boton to="/nosotros" variante="texto">Conocé nuestra historia</Boton>
          </div>

          <div className={estilos.fotosBienvenida}>
            {FOTOS_BIENVENIDA.map((foto) => (
              <img
                key={foto.src}
                src={foto.src}
                srcSet={srcSetDe(foto.src)}
                sizes="(min-width: 900px) 25vw, 50vw"
                alt={foto.alt}
                loading="lazy"
                className={estilos.fotoBienvenida}
                style={{ objectPosition: foto.posicion }}
              />
            ))}
          </div>
        </div>
      </Section>

      <Section fondo="oliva" titulo="Lo que nos mueve">
        <ul className={estilos.valores}>
          {TEXTOS.valores.map((valor) => (
            <li key={valor.titulo} className={estilos.valor}>
              <h3 className={estilos.tituloValor}>{valor.titulo}</h3>
              <p>{valor.texto}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="salones"
        fondo="arena"
        titulo="Nuestros dos salones"
        bajada="Dos propuestas únicas. Elegí con cuál te quedás hoy."
      >
        <div className={estilos.grillaLocales}>
          {LOCALES.map((local) => (
            <LocalCard key={local.id} local={local} />
          ))}
        </div>
      </Section>

      <Section
        fondo="bordo"
        titulo="Algunos de nuestros platos"
        bajada="Una selección de cada salón. Conocé nuestra propuesta completa ingresando al menú."
      >
        <div className={estilos.grillaPlatos}>
          {PLATOS.map((plato) => (
            <PlatoCard
              key={`${plato.idLocal}-${plato.nombre}`}
              nombre={plato.nombre}
              descripcion={plato.descripcion}
              imagen={plato.imagen}
              etiquetaLocal={plato.nombreLocal}
            />
          ))}
        </div>

        <div className={estilos.accionesPlatos}>
          <Boton to="/carta" variante="contorno" tamano="lg">
            Ver las cartas
          </Boton>
        </div>
      </Section>

      <Section
        id="visitanos"
        titulo="Visitanos"
        bajada="Horarios, dirección y contacto de cada salón."
      >
        <Visitanos />
      </Section>
    </main>
  );
}
