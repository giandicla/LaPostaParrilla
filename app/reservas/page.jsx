'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO } from '../../src/data/locales.js';
import { TEXTOS } from '../../src/data/textos.js';
import { MARCA } from '../../src/data/marca.js';
import estilos from './page.module.css';

function ReservasContenido() {
  const parametros = useSearchParams();
  const idInicial = parametros.get('local');

  const [idLocal, setIdLocal] = useState(
    esIdDeLocal(idInicial) ? idInicial : ID_LOCAL_POR_DEFECTO
  );
  const [hora, setHora] = useState('');

  const local = getLocal(idLocal);

  // Las franjas dependen del local, así que al cambiarlo la hora elegida
  // deja de ser válida. Se limpia a propósito: mejor volver a preguntar
  // que dejar puesta una hora que el usuario no eligió.
  const cambiarLocal = (id) => {
    setIdLocal(id);
    setHora('');
  };

  // MAQUETA: el formulario no guarda ni envía nada. La lógica de reservas
  // es la etapa 2 y tiene su propio spec. Acá solo se corta el submit para
  // que el navegador no recargue la página.
  const alEnviar = (evento) => {
    evento.preventDefault();
  };

  return (
    <main>
      <Hero
        compacto
        imagen="/img/comunes/hero-marca.svg"
        alt=""
        titulo="Reservá tu mesa"
        bajada={MARCA.bajada}
      />

      <Section>
        <div className={estilos.columnas}>
          <form className={estilos.formulario} onSubmit={alEnviar}>
            {/* El local va primero: define las franjas horarias de abajo */}
            <fieldset className={estilos.grupoLocal}>
              <legend className={estilos.etiqueta}>¿En qué salón?</legend>
              <div className={estilos.opcionesLocal}>
                {LOCALES.map((opcion) => (
                  <label
                    key={opcion.id}
                    className={`${estilos.tarjetaLocal} ${
                      opcion.id === idLocal ? estilos.tarjetaLocalActiva : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="local"
                      value={opcion.id}
                      checked={opcion.id === idLocal}
                      onChange={() => cambiarLocal(opcion.id)}
                      className={estilos.radioOculto}
                    />
                    <span className={estilos.nombreLocal}>{opcion.nombreCorto}</span>
                    <span className={estilos.taglineLocal}>{opcion.tagline}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={estilos.fila}>
              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="nombre">
                  Nombre y apellido
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Juan Pérez"
                  className={estilos.control}
                />
              </div>

              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="telefono">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+54 9 2944 00-0000"
                  className={estilos.control}
                />
              </div>
            </div>

            <div className={estilos.campo}>
              <label className={estilos.etiqueta} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="juan@ejemplo.com"
                className={estilos.control}
              />
            </div>

            <div className={estilos.fila}>
              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="fecha">
                  Fecha
                </label>
                <input
                  id="fecha"
                  name="fecha"
                  type="date"
                  required
                  className={estilos.control}
                />
              </div>

              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="hora">
                  Hora
                </label>
                {/* Las franjas salen del local elegido arriba */}
                <select
                  id="hora"
                  name="hora"
                  required
                  value={hora}
                  onChange={(evento) => setHora(evento.target.value)}
                  className={estilos.control}
                >
                  <option value="" disabled>
                    Elegí un horario
                  </option>
                  {local.franjasReserva.map((franja) => (
                    <option key={franja} value={franja}>
                      {franja}
                    </option>
                  ))}
                </select>
              </div>

              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="personas">
                  Personas
                </label>
                <input
                  id="personas"
                  name="personas"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue="2"
                  required
                  className={estilos.control}
                />
              </div>
            </div>

            <div className={estilos.campo}>
              <label className={estilos.etiqueta} htmlFor="comentarios">
                Comentarios <span className={estilos.opcional}>(opcional)</span>
              </label>
              <textarea
                id="comentarios"
                name="comentarios"
                rows="4"
                placeholder="Alergias, cumpleaños, si preferís una mesa cerca del fuego…"
                className={estilos.control}
              />
            </div>

            <Boton type="submit" tamano="lg" className={estilos.botonEnviar}>
              Confirmar reserva
            </Boton>

            <p className={estilos.avisoMaqueta}>
              Esta sección todavía no está conectada. Por ahora confirmanos la reserva
              por WhatsApp o teléfono.
            </p>
          </form>

          <aside className={estilos.panel}>
            <h2 className={estilos.tituloPanel}>Antes de reservar</h2>
            <ul className={estilos.condiciones}>
              {TEXTOS.condicionesReserva.map((condicion) => (
                <li key={condicion} className={estilos.condicion}>
                  {condicion}
                </li>
              ))}
            </ul>

            <div className={estilos.contactoPanel}>
              <h3 className={estilos.subtituloPanel}>{local.nombre}</h3>
              {local.whatsapp ? (
                <Boton
                  href={`https://wa.me/${local.whatsapp}?text=${encodeURIComponent(
                    `Hola! Quería reservar una mesa en ${local.nombre}.`
                  )}`}
                >
                  Reservar por WhatsApp
                </Boton>
              ) : (
                <p className={estilos.sinContacto}>
                  Todavía no tenemos el WhatsApp de este salón cargado. Escribinos por
                  Instagram y te respondemos.
                </p>
              )}
              <a
                href={MARCA.instagramUrl}
                className={estilos.instagram}
                target="_blank"
                rel="noreferrer"
              >
                {MARCA.instagram}
              </a>
            </div>
          </aside>
        </div>
      </Section>

      {/*
        Etapa 2: acá va el listado de reservas del CRUD.
        No se renderiza nada todavía — ver el spec de la etapa 2.
      */}
    </main>
  );
}

export default function Reservas() {
  // useSearchParams() adentro de ReservasContenido exige un límite de
  // Suspense para que la ruta se pueda seguir prerenderizando como estática.
  return (
    <Suspense fallback={null}>
      <ReservasContenido />
    </Suspense>
  );
}
