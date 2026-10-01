'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import RequiereSesion from '../../src/components/RequiereSesion/RequiereSesion.jsx';
import { useSesion } from '../../src/components/SesionProvider/SesionProvider.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO, enlaceWhatsapp } from '../../src/data/locales.js';
import { TEXTOS } from '../../src/data/textos.js';
import { MARCA } from '../../src/data/marca.js';
import { actualizarPerfil } from '../../src/servicios/auth.js';
import {
  crearReserva,
  faltaParaReserva,
  formatearFecha,
  hoyEnArgentina,
  obtenerDiasBloqueados,
  obtenerFranjas,
} from '../../src/servicios/reservas.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

const MAXIMO_PERSONAS = 6;

function FormularioReserva({ idInicial, alCambiarLocal }) {
  const { sesion, perfil, recargarPerfil } = useSesion();
  const [idLocal, setIdLocal] = useState(idInicial);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [franjas, setFranjas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [creada, setCreada] = useState(null);

  const local = getLocal(idLocal);
  const hoy = hoyEnArgentina();

  useEffect(() => {
    let vigente = true;
    obtenerFranjas(idLocal).then((f) => vigente && setFranjas(f)).catch((e) => setError(e.message));
    return () => {
      vigente = false;
    };
  }, [idLocal]);

  // Se vuelve a pedir al elegir fecha: si el admin bloqueó un día con el
  // formulario ya abierto, el aviso aparece antes de mandar (la base igual
  // rechazaría la reserva, pero es mejor no dejar llegar hasta ahí).
  useEffect(() => {
    let vigente = true;
    obtenerDiasBloqueados(hoy)
      .then((lista) => vigente && setBloqueos(lista))
      .catch(() => vigente && setBloqueos([]));
    return () => {
      vigente = false;
    };
  }, [hoy, fecha]);

  // Si es hoy, solo los horarios que todavía no pasaron
  const franjasDisponibles = useMemo(
    () => franjas.filter((h) => !fecha || faltaParaReserva({ fecha, hora: h }) > 0),
    [franjas, fecha]
  );

  const bloqueo = bloqueos.find((b) => b.fecha === fecha && (!b.local_id || b.local_id === idLocal));

  const cambiarLocal = (id) => {
    setIdLocal(id);
    setHora(''); // las franjas dependen del local: la hora elegida deja de valer
    alCambiarLocal(id);
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    setEnviando(true);
    setError('');
    try {
      const reserva = await crearReserva(sesion.user.id, {
        local_id: idLocal,
        fecha,
        hora,
        personas: Number(datos.personas),
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        comentarios: datos.comentarios.trim() || null,
      });
      if (datos.guardarTelefono && datos.telefono.trim() !== perfil?.telefono) {
        await actualizarPerfil(sesion.user.id, { nombre: perfil?.nombre ?? datos.nombre, telefono: datos.telefono.trim() });
        recargarPerfil();
      }
      setCreada(reserva);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (creada) {
    return (
      <div className={formulario.formulario}>
        <h2 className={estilos.tituloListo}>¡Recibimos tu pedido de reserva!</h2>
        <p>
          <strong>{getLocal(creada.local_id).nombre}</strong> — {formatearFecha(creada.fecha)},{' '}
          {creada.hora.slice(0, 5)} · {creada.personas} {creada.personas === 1 ? 'persona' : 'personas'}
        </p>
        <p className={formulario.exito}>
          Queda <strong>pendiente</strong> hasta que la confirmemos. Te avisamos por mail y la ves en
          &quot;Mis reservas&quot;.
        </p>
        <div className={estilos.accionesListo}>
          <Boton to="/mis-reservas">Ver mis reservas</Boton>
          <Boton variante="texto" onClick={() => setCreada(null)}>Hacer otra reserva</Boton>
        </div>
      </div>
    );
  }

  const whatsappGrupo = enlaceWhatsapp(local, `Hola! Quería reservar para más de ${MAXIMO_PERSONAS} personas en ${local.nombre}.`);

  return (
    <form className={formulario.formulario} onSubmit={alEnviar}>
      <fieldset className={estilos.grupoLocal}>
        <legend className={formulario.etiqueta}>¿En qué salón?</legend>
        <div className={estilos.opcionesLocal}>
          {LOCALES.map((opcion) => (
            <label
              key={opcion.id}
              className={`${estilos.tarjetaLocal} ${opcion.id === idLocal ? estilos.tarjetaLocalActiva : ''}`}
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

      <div className={formulario.fila}>
        <div className={formulario.campo}>
          <label className={formulario.etiqueta} htmlFor="nombre">A nombre de</label>
          <input id="nombre" name="nombre" required autoComplete="name" defaultValue={perfil?.nombre ?? ''} className={formulario.control} />
        </div>
        <div className={formulario.campo}>
          <label className={formulario.etiqueta} htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+54 9 2944 00-0000"
            defaultValue={perfil?.telefono ?? ''}
            className={formulario.control}
          />
          <label className={formulario.casilla}>
            <input type="checkbox" name="guardarTelefono" defaultChecked /> Guardarlo para la próxima
          </label>
        </div>
      </div>

      <div className={formulario.fila}>
        <div className={formulario.campo}>
          <label className={formulario.etiqueta} htmlFor="fecha">Fecha</label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            min={hoy}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setHora('');
            }}
            className={formulario.control}
          />
        </div>
        <div className={formulario.campo}>
          <label className={formulario.etiqueta} htmlFor="hora">Hora</label>
          <select id="hora" name="hora" required value={hora} onChange={(e) => setHora(e.target.value)} className={formulario.control}>
            <option value="" disabled>
              {franjasDisponibles.length ? 'Elegí un horario' : 'No quedan horarios ese día'}
            </option>
            {franjasDisponibles.map((franja) => (
              <option key={franja} value={franja}>{franja}</option>
            ))}
          </select>
        </div>
      </div>

      {bloqueo && (
        <p className={formulario.error} role="alert">
          Ese día no tomamos reservas en {local.nombre}
          {bloqueo.motivo ? ` (${bloqueo.motivo})` : ''}. Elegí otra fecha.
        </p>
      )}

      <div className={formulario.campo}>
        <label className={formulario.etiqueta} htmlFor="personas">Personas</label>
        <select id="personas" name="personas" defaultValue="2" className={formulario.control}>
          {Array.from({ length: MAXIMO_PERSONAS }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className={formulario.ayuda}>
          ¿Son más de {MAXIMO_PERSONAS}?{' '}
          {whatsappGrupo ? (
            <a href={whatsappGrupo} target="_blank" rel="noreferrer" className={estilos.enlace}>
              Escribinos por WhatsApp
            </a>
          ) : (
            'Escribinos por Instagram'
          )}{' '}
          y lo coordinamos.
        </span>
      </div>

      <div className={formulario.campo}>
        <label className={formulario.etiqueta} htmlFor="comentarios">
          Comentarios <span className={formulario.opcional}>(opcional)</span>
        </label>
        <textarea
          id="comentarios"
          name="comentarios"
          rows="3"
          maxLength={500}
          placeholder="Alergias, cumpleaños, si preferís una mesa cerca del fuego…"
          className={formulario.control}
        />
      </div>

      {error && <p className={formulario.error} role="alert">{error}</p>}

      <Boton type="submit" tamano="lg" className={estilos.botonEnviar} disabled={enviando || Boolean(bloqueo)}>
        {enviando ? 'Enviando…' : 'Pedir reserva'}
      </Boton>
    </form>
  );
}

function ReservasContenido() {
  const parametros = useSearchParams();
  const idPedido = parametros.get('local');
  const [idLocal, setIdLocal] = useState(esIdDeLocal(idPedido) ? idPedido : ID_LOCAL_POR_DEFECTO);
  const local = getLocal(idLocal);
  const whatsapp = enlaceWhatsapp(local, `Hola! Quería consultar por una reserva en ${local.nombre}.`);

  return (
    <div className={estilos.columnas}>
      <RequiereSesion mensaje="Para reservar necesitás una cuenta: así podés ver y cancelar tus reservas cuando quieras.">
        <FormularioReserva idInicial={idLocal} alCambiarLocal={setIdLocal} />
      </RequiereSesion>

      <aside className={estilos.panel}>
        <h2 className={estilos.tituloPanel}>Antes de reservar</h2>
        <ul className={estilos.condiciones}>
          {TEXTOS.condicionesReserva.map((condicion) => (
            <li key={condicion} className={estilos.condicion}>{condicion}</li>
          ))}
        </ul>

        <div className={estilos.contactoPanel}>
          <h3 className={estilos.subtituloPanel}>{local.nombre}</h3>
          {whatsapp && <Boton href={whatsapp}>Consultar por WhatsApp</Boton>}
          <a href={MARCA.instagramUrl} className={estilos.instagram} target="_blank" rel="noreferrer">
            {MARCA.instagram}
          </a>
        </div>
      </aside>
    </div>
  );
}

export default function Reservas() {
  return (
    <main>
      <Hero compacto imagen="/img/comunes/sirviendo-vino.webp" alt="" titulo="Reservá tu mesa" bajada={MARCA.bajada} />
      <Section>
        {/* useSearchParams exige Suspense para que la ruta siga siendo estática */}
        <Suspense fallback={null}>
          <ReservasContenido />
        </Suspense>
      </Section>
    </main>
  );
}
