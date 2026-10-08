import Hero from '../src/components/Hero/Hero.jsx';
import Section from '../src/components/Section/Section.jsx';
import Boton from '../src/components/Boton/Boton.jsx';
import LocalCard from '../src/components/LocalCard/LocalCard.jsx';
import PlatoCard from '../src/components/PlatoCard/PlatoCard.jsx';
import InfoLocal from '../src/components/InfoLocal/InfoLocal.jsx';
import { MARCA } from '../src/data/marca.js';
import { TEXTOS } from '../src/data/textos.js';
import { LOCALES } from '../src/data/locales.js';
import { getPlatosDestacados } from '../src/data/platos.js';
import estilos from './page.module.css';

// Los datos son estáticos: no hace falta recalcularlos en cada render.
// Un local sin platos cargados no arma su grupo.
const PLATOS = getPlatosDestacados();
const PLATOS_POR_LOCAL = LOCALES.map((local) => ({
  local,
  platos: PLATOS.filter((plato) => plato.idLocal === local.id),
})).filter(({ platos }) => platos.length > 0);

const FOTOS_BIENVENIDA = [
  { src: '/img/comunes/salon-calido.webp', alt: 'Salón de La Posta con lámparas cálidas y ventanales de troncos' },
  { src: '/img/comunes/sirviendo-vino.webp', alt: 'Mozo sirviendo vino tinto en la mesa' },
  { src: '/img/comunes/entrada-noche.webp', alt: 'Entrada de La Posta iluminada de noche' },
];

export default function Inicio() {
  return (
    <main>
      <Hero
        imagen="/img/comunes/hero-fuego.webp"
        alt="Cordero patagónico al asador, abierto en cruz junto a las brasas"
        conLogo
        titulo={MARCA.nombreCompleto}
        bajada={MARCA.rubro}
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
                alt={foto.alt}
                loading="lazy"
                className={estilos.fotoBienvenida}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Valores: armado como la hoja del manual, el logo y los tres textos
          sobre un bloque oliva plano */}
      <Section fondo="oliva">
        <div className={estilos.valores}>
          <h2 className="visualmente-oculto">Lo que nos define</h2>
          <img src={MARCA.logo} alt="" className={estilos.logoValores} />
          <dl className={estilos.listaValores}>
            {TEXTOS.valores.map((valor) => (
              <div key={valor.titulo} className={estilos.valor}>
                <dt className={estilos.tituloValor}>{valor.titulo}</dt>
                <dd>{valor.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <Section
        id="salones"
        titulo="Los dos salones"
        bajada="Están uno al lado del otro, sobre la avenida Arrayanes."
      >
        <div className={estilos.grillaLocales}>
          {LOCALES.map((local) => (
            <LocalCard key={local.id} local={local} />
          ))}
        </div>
      </Section>

      <Section
        fondo="arena"
        titulo="Platos de la casa"
        bajada="Algunos de cada salón. Los precios están en la carta."
      >
        {/* Agrupados por salón: el nombre del local va una vez, como
            encabezado, en vez de repetirse en cada foto */}
        <div className={estilos.gruposPlatos}>
          {PLATOS_POR_LOCAL.map(({ local, platos }) => (
            <section key={local.id} aria-labelledby={`platos-${local.id}`}>
              <h3 id={`platos-${local.id}`} className={estilos.tituloGrupo}>
                {local.nombre}
              </h3>
              <ul className={estilos.grillaPlatos}>
                {platos.map((plato) => (
                  <li key={plato.nombre}>
                    <PlatoCard
                      nombre={plato.nombre}
                      descripcion={plato.descripcion}
                      imagen={plato.imagen}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className={estilos.accionesPlatos}>
          <Boton to="/carta">Ver la carta completa</Boton>
        </div>
      </Section>

      <Section id="visitanos" titulo="Horarios y dirección">
        <div className={estilos.grillaInfo}>
          {LOCALES.map((local) => (
            <InfoLocal key={local.id} local={local} />
          ))}
        </div>
      </Section>
    </main>
  );
}
