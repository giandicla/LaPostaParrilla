'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import Icono from '../../src/components/Icono/Icono.jsx';
import RequiereSesion from '../../src/components/RequiereSesion/RequiereSesion.jsx';
import Campo from '../../src/components/Campo/Campo.jsx';
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
import { LIMITES, limpiarTelefono, validarReserva, hayErrores } from '../../src/validacion/reservas.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

const MAXIMO_PERSONAS = LIMITES.personas.max;

// Orden de los campos en pantalla: al enviar con errores, el foco va al primero
const CAMPOS = ['nombre', 'telefono', 'fecha', 'hora', 'personas', 'comentarios'];

function FormularioReserva({ idInicial, alCambiarLocal }) {
  const { sesion, perfil, recargarPerfil } = useSesion();
  const [idLocal, setIdLocal] = useState(idInicial);
  const [valores, setValores] = useState({
    nombre: perfil?.nombre ?? '',
    telefono: perfil?.telefono ?? '',
    fecha: '',
    hora: '',
    personas: '2',
    comentarios: '',
  });
  // Un campo muestra su error recién después de que la persona pasó por él,
  // o cuando intenta enviar: no se la reta antes de que escriba.
  const [tocados, setTocados] = useState({});
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [franjas, setFranjas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [creada, setCreada] = useState(null);

  const local = getLocal(idLocal);
  const hoy = hoyEnArgentina();
  const { fecha, hora } = valores;

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

  // Los errores no se guardan: se calculan de los valores en cada render
  const errores = validarReserva(valores, {
    hoy,
    franjas: franjasDisponibles,
    bloqueo,
    nombreLocal: local.nombre,
  });
  const errorVisible = (campo) => (tocados[campo] || intentoEnviar ? errores[campo] : undefined);
  const cantidadErrores = CAMPOS.filter(errorVisible).length;

  const cambiar = (campo, valor, { tocar = false } = {}) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    if (tocar) setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  };
  const alSalir = (campo) => () => setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  const alEscribir = (campo) => (evento) => cambiar(campo, evento.target.value);

  const cambiarLocal = (id) => {
    setIdLocal(id);
    cambiar('hora', ''); // las franjas dependen del local: la hora elegida deja de valer
    alCambiarLocal(id);
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setError('');
    if (hayErrores(errores)) {
      const primero = CAMPOS.find((campo) => errores[campo]);
      document.getElementById(primero)?.focus();
      return;
    }

    const guardarTelefono = new FormData(evento.currentTarget).get('guardarTelefono');
    const telefono = valores.telefono.trim();
    setEnviando(true);
    try {
      const reserva = await crearReserva(sesion.user.id, {
        local_id: idLocal,
        fecha,
        hora,
        personas: Number(valores.personas),
        nombre: valores.nombre.trim(),
        telefono,
        comentarios: valores.comentarios.trim() || null,
      });
      if (guardarTelefono && telefono !== perfil?.telefono) {
        await actualizarPerfil(sesion.user.id, { nombre: perfil?.nombre ?? valores.nombre.trim(), telefono });
        recargarPerfil();
      }
      setCreada(reserva);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const otraReserva = () => {
    setCreada(null);
    setValores((anteriores) => ({ ...anteriores, fecha: '', hora: '', comentarios: '' }));
    setTocados({});
    setIntentoEnviar(false);
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
          <Boton variante="texto" onClick={otraReserva}>Hacer otra reserva</Boton>
        </div>
      </div>
    );
  }

  const whatsappGrupo = enlaceWhatsapp(local, `Hola! Quería reservar para más de ${MAXIMO_PERSONAS} personas en ${local.nombre}.`);

  return (
    <form className={formulario.formulario} onSubmit={alEnviar} noValidate>
      {intentoEnviar && cantidadErrores > 0 && (
        <p className={formulario.error} role="alert">
          {cantidadErrores === 1
            ? 'Revisá el campo marcado antes de enviar.'
            : `Revisá los ${cantidadErrores} campos marcados antes de enviar.`}
        </p>
      )}

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
        <Campo id="nombre" etiqueta="A nombre de" error={errorVisible('nombre')}>
          {(props) => (
            <input
              {...props}
              name="nombre"
              required
              autoComplete="name"
              maxLength={LIMITES.nombre.max}
              value={valores.nombre}
              onChange={alEscribir('nombre')}
              onBlur={alSalir('nombre')}
              className={formulario.control}
            />
          )}
        </Campo>
        <div className={formulario.campo}>
          <Campo id="telefono" etiqueta="Teléfono" error={errorVisible('telefono')}>
            {(props) => (
              <input
                {...props}
                name="telefono"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+54 9 2944 00-0000"
                value={valores.telefono}
                inputMode="tel"
                onChange={(e) => cambiar('telefono', limpiarTelefono(e.target.value))}
                onBlur={alSalir('telefono')}
                className={formulario.control}
              />
            )}
          </Campo>
          <label className={formulario.casilla}>
            <input type="checkbox" name="guardarTelefono" defaultChecked /> Guardarlo para la próxima
          </label>
        </div>
      </div>

      <div className={formulario.fila}>
        {/* Un día bloqueado se avisa apenas se elige, sin esperar a salir del campo */}
        <Campo id="fecha" etiqueta="Fecha" error={errorVisible('fecha') ?? (bloqueo ? errores.fecha : undefined)}>
          {(props) => (
            <input
              {...props}
              name="fecha"
              type="date"
              required
              min={hoy}
              value={fecha}
              onChange={(e) => {
                cambiar('fecha', e.target.value, { tocar: true });
                cambiar('hora', '');
              }}
              onBlur={alSalir('fecha')}
              className={formulario.control}
            />
          )}
        </Campo>
        <Campo id="hora" etiqueta="Hora" error={errorVisible('hora')}>
          {(props) => (
            <select
              {...props}
              name="hora"
              required
              value={hora}
              onChange={(e) => cambiar('hora', e.target.value, { tocar: true })}
              onBlur={alSalir('hora')}
              className={formulario.control}
            >
              <option value="" disabled>
                {franjasDisponibles.length ? 'Elegí un horario' : 'No quedan horarios ese día'}
              </option>
              {franjasDisponibles.map((franja) => (
                <option key={franja} value={franja}>{franja}</option>
              ))}
            </select>
          )}
        </Campo>
      </div>

      <Campo
        id="personas"
        etiqueta="Personas"
        error={errorVisible('personas')}
        ayuda={
          <>
            ¿Son más de {MAXIMO_PERSONAS}?{' '}
            {whatsappGrupo ? (
              <a href={whatsappGrupo} target="_blank" rel="noreferrer" className={estilos.enlace}>
                <Icono nombre="whatsapp" /> Escribinos por WhatsApp
              </a>
            ) : (
              'Escribinos por Instagram'
            )}{' '}
            y lo coordinamos.
          </>
        }
      >
        {(props) => (
          <select
            {...props}
            name="personas"
            value={valores.personas}
            onChange={alEscribir('personas')}
            className={formulario.control}
          >
            {Array.from({ length: MAXIMO_PERSONAS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
      </Campo>

      <Campo
        id="comentarios"
        etiqueta="Comentarios"
        opcional
        error={errorVisible('comentarios')}
        ayuda={`${valores.comentarios.length}/${LIMITES.comentarios} caracteres`}
      >
        {(props) => (
          <textarea
            {...props}
            name="comentarios"
            rows="3"
            maxLength={LIMITES.comentarios}
            placeholder="Alergias, cumpleaños, si preferís una mesa cerca del fuego…"
            value={valores.comentarios}
            onChange={alEscribir('comentarios')}
            onBlur={alSalir('comentarios')}
            className={formulario.control}
          />
        )}
      </Campo>

      {error && <p className={formulario.error} role="alert">{error}</p>}

      <Boton type="submit" tamano="lg" className={estilos.botonEnviar} disabled={enviando}>
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
          {whatsapp && (
            <Boton href={whatsapp}>
              <Icono nombre="whatsapp" />
              Consultar por WhatsApp
            </Boton>
          )}
          <a href={MARCA.instagramUrl} className={estilos.instagram} target="_blank" rel="noreferrer">
            <Icono nombre="instagram" />
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
