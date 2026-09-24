import Hero from '../src/components/Hero/Hero.jsx';
import Section from '../src/components/Section/Section.jsx';
import Boton from '../src/components/Boton/Boton.jsx';
import { MARCA } from '../src/data/marca.js';
import { TEXTOS } from '../src/data/textos.js';
import estilos from './page.module.css';

const FOTOS_BIENVENIDA = [
  { src: '/img/comunes/bienvenida-1.svg', alt: 'Salón de La Posta con mesas de madera' },
  { src: '/img/comunes/bienvenida-2.svg', alt: 'Detalle de la parrilla encendida' },
  { src: '/img/comunes/bienvenida-3.svg', alt: 'Plato servido en la mesa' },
];

export default function Inicio() {
  return (
    <main>
      <Hero
        imagen="/img/comunes/hero-marca.svg"
        alt=""
        conLogo
        titulo={MARCA.nombre}
        bajada={MARCA.bajada}
        acciones={
          <>
            <Boton to="/reservas" tamano="lg">Reservar mesa</Boton>
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
    </main>
  );
}
