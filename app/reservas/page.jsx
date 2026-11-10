'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import Icono from '../../src/components/Icono/Icono.jsx';
import RequiereSesion from '../../src/components/RequiereSesion/RequiereSesion.jsx';
import Campo from '../../src/components/Campo/Campo.jsx';
import { useSesion } from '../../src/components/SesionProvider/SesionProvider.jsx';
import {
  LOCALES,
  getLocal,
  esIdDeLocal,
  ID_LOCAL_POR_DEFECTO,
  enlaceWhatsapp,
  mensajeReservaWhatsapp,
} from '../../src/data/locales.js';
import { TEXTOS } from '../../src/data/textos.js';
import { MARCA } from '../../src/data/marca.js';
import { guardarTelefonoDelPerfil, ingresarConGoogle } from '../../src/servicios/auth.js';
import { iniciarPago } from '../../src/servicios/pagos.js';
import {
  MINUTOS_PARA_PAGAR,
  TURNOS,
  crearReserva,
  faltaParaReserva,
  formatearFecha,
  formatearMonto,
  hoyEnArgentina,
  obtenerDiasBloqueados,
  obtenerFranjas,
  obtenerSena,
  turnoDe,
} from '../../src/servicios/reservas.js';
import SelloMercadoPago from '../../src/components/SelloMercadoPago/SelloMercadoPago.jsx';
import { LIMITES, esGrupo, limpiarTelefono, validarReserva, hayErrores } from '../../src/validacion/reservas.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';
import { srcSetDe } from '../../src/data/imagenes.js';

// Desde la web se reserva hasta LIMITES.personas.max. Se puede elegir más (hasta
// el tope del local): en ese caso la reserva se pide por WhatsApp.
const MAXIMO_ELEGIBLE = LIMITES.personas.maxLocal;

// Orden de los campos en pantalla: al enviar con errores, el foco va al primero
const CAMPOS = ['nombre', 'telefono', 'fecha', 'hora', 'personas', 'comentarios'];

// Los salones con su foto. Con onChange son opciones para elegir; sin él,
// solo se muestran (página sin sesión).
function Salones({ idLocal, onChange }) {
  return (
    <div className={estilos.salones}>
      {LOCALES.map((opcion) => {
        const contenido = (
          <>
            <img
              src={opcion.imagenes.reserva ?? opcion.imagenes.card}
              srcSet={srcSetDe(opcion.imagenes.reserva ?? opcion.imagenes.card)}
              sizes="(min-width: 768px) 30vw, 50vw"
              alt=""
              className={estilos.fotoSalon}
              loading="lazy"
            />
            <span className={estilos.nombreSalon}>{opcion.nombre}</span>
            <span className={estilos.taglineSalon}>{opcion.tagline}</span>
          </>
        );
        if (!onChange) return <div key={opcion.id} className={estilos.salon}>{contenido}</div>;
        return (
          <label
            key={opcion.id}
            className={`${estilos.salon} ${estilos.salonElegible} ${opcion.id === idLocal ? estilos.salonActivo : ''}`}
          >
            <input
              type="radio"
              name="local"
              value={opcion.id}
              checked={opcion.id === idLocal}
              onChange={() => onChange(opcion.id)}
              className="visualmente-oculto"
            />
            {contenido}
          </label>
        );
      })}
    </div>
  );
}

function SinSesion() {
  const ruta = usePathname();
  const parametros = useSearchParams();
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState('');
  const query = parametros.toString();
  // Con Google o con mail, al terminar vuelve acá, con el salón ya elegido
  const volver = query ? `${ruta}?${query}` : ruta;

  const conGoogle = async () => {
    setError('');
    setYendo(true);
    try {
      await ingresarConGoogle(volver);
    } catch (e) {
      setError(e.message);
      setYendo(false);
    }
  };

  return (
    <div className={estilos.pagina}>
      <div className={estilos.grupo}>
        <h2 className={estilos.leyenda}>Reservar en:</h2>
        <Salones />
      </div>
      <div className={`${formulario.formulario} ${estilos.ingreso}`}>
        <p className={estilos.textoIngreso}>
          Para pedir una mesa, ingresá con tu cuenta: así ves, cambiás y cancelás tus reservas desde acá.
        </p>
        {/* Con mail (o para crear la cuenta) se pasa por /ingresar; Google, a un clic */}
        <div className={estilos.botonesIngreso}>
          <Boton to={`/ingresar?volver=${encodeURIComponent(volver)}`}>Ingresar o crear cuenta</Boton>
          <p className={estilos.separador}>o</p>
          <button type="button" className={estilos.google} onClick={conGoogle} disabled={yendo}>
            <Icono nombre="google" className={estilos.logoGoogle} />
            {yendo ? 'Abriendo Google…' : 'Continuar con Google'}
          </button>
        </div>
        {error && <p className={formulario.error} role="alert">{error}</p>}
      </div>
    </div>
  );
}

function FormularioReserva({ idInicial }) {
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
  const [sena, setSena] = useState(null);

  const local = getLocal(idLocal);
  const hoy = hoyEnArgentina();
  const { fecha, hora } = valores;
  const grupo = esGrupo(valores.personas);

  // Al volver con "atrás" desde Mercado Pago, el navegador restaura la página
  // tal cual estaba (bfcache): sin esto quedaría trabada en "Enviando…"
  useEffect(() => {
    const alVolver = (evento) => evento.persisted && setEnviando(false);
    window.addEventListener('pageshow', alVolver);
    return () => window.removeEventListener('pageshow', alVolver);
  }, []);

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

  useEffect(() => {
    let vigente = true;
    obtenerSena(idLocal).then((monto) => vigente && setSena(monto)).catch(() => vigente && setSena(null));
    return () => {
      vigente = false;
    };
  }, [idLocal]);

  const delDia = bloqueos.filter((b) => b.fecha === fecha && (!b.local_id || b.local_id === idLocal));
  // Un bloqueo sin turno cierra el día; con turno, solo esos horarios
  const bloqueo = delDia.find((b) => !b.turno);
  const turnosCompletos = delDia.filter((b) => b.turno).map((b) => b.turno);

  // Si es hoy, solo los horarios que todavía no pasaron; y nunca los de un turno completo
  // (sin useMemo: el React Compiler ya lo memoiza)
  const franjasDisponibles = franjas.filter(
    (h) => (!fecha || faltaParaReserva({ fecha, hora: h }) > 0) && !turnosCompletos.includes(turnoDe(h))
  );

  // Los errores no se guardan: se calculan de los valores en cada render.
  // Se acepta hasta el tope del local: lo que pase de 6 no se manda, se pide por WhatsApp.
  const errores = validarReserva(valores, {
    hoy,
    franjas: franjasDisponibles,
    bloqueo,
    nombreLocal: local.nombre,
    maxPersonas: MAXIMO_ELEGIBLE,
  });
  const errorVisible = (campo) => (tocados[campo] || intentoEnviar ? errores[campo] : undefined);
  const cantidadErrores = CAMPOS.filter(errorVisible).length;

  const cambiar = (campo, valor, { tocar = false } = {}) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    // El error del envío ("Ya tenés una reserva en ese turno…") habla de la fecha
    // y la hora de antes: al cambiarlas deja de valer
    if (campo === 'fecha' || campo === 'hora') setError('');
    if (tocar) setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  };
  const alSalir = (campo) => () => setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  const alEscribir = (campo) => (evento) => cambiar(campo, evento.target.value);

  const cambiarLocal = (id) => {
    setIdLocal(id);
    cambiar('hora', ''); // las franjas dependen del local: la hora elegida deja de valer
  };

  // Grupo: WhatsApp con lo que ya se completó
  const whatsappGrupo = grupo
    ? enlaceWhatsapp(
        local,
        mensajeReservaWhatsapp({
          local,
          fechaTexto: fecha && !errores.fecha ? formatearFecha(fecha).replace(',', '') : '',
          hora,
          nombre: valores.nombre,
          personas: valores.personas,
        })
      )
    : null;

  const alEnviar = async (evento) => {
    evento.preventDefault();
    if (grupo) return; // se pide por WhatsApp: el botón es un link
    setIntentoEnviar(true);
    setError('');
    if (hayErrores(errores)) {
      const primero = CAMPOS.find((campo) => errores[campo]);
      document.getElementById(primero)?.focus();
      return;
    }

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
      if (telefono !== perfil?.telefono
        && await guardarTelefonoDelPerfil(sesion.user.id, { nombre: perfil?.nombre ?? valores.nombre.trim(), telefono })) {
        recargarPerfil();
      }
      setCreada(reserva);
      try {
        window.location.assign(await iniciarPago(reserva.id));
        return; // sigue "Enviando…" mientras el navegador va a Mercado Pago
      } catch (e) {
        setError(e.message);
      }
    } catch (e) {
      setError(e.message);
    }
    setEnviando(false);
  };

  const pagar = async () => {
    setError('');
    setEnviando(true);
    try {
      window.location.assign(await iniciarPago(creada.id));
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  };

  if (creada) {
    return (
      <div className={formulario.formulario}>
        <h2 className={estilos.tituloListo}>Falta pagar la seña</h2>
        <p>
          <strong>{getLocal(creada.local_id).nombre}</strong>, {formatearFecha(creada.fecha)} a las{' '}
          {creada.hora.slice(0, 5)}, {creada.personas} {creada.personas === 1 ? 'persona' : 'personas'}, a nombre
          de {creada.nombre}.
        </p>
        {error && <p className={formulario.error} role="alert">{error}</p>}
        <p>
          Guardamos tu lugar durante {MINUTOS_PARA_PAGAR} minutos. Si no se paga la seña, la reserva se libera.
        </p>
        <SelloMercadoPago />
        <div className={estilos.acciones}>
          <Boton onClick={pagar} disabled={enviando}>{enviando ? 'Abriendo Mercado Pago…' : 'Pagar seña'}</Boton>
          <Boton to="/mis-reservas" variante="texto">Ver mis reservas</Boton>
        </div>
      </div>
    );
  }

  return (
    <form className={estilos.pagina} onSubmit={alEnviar} noValidate>
      <fieldset className={estilos.grupo}>
        <legend className={estilos.leyenda}>Reservar en:</legend>
        <Salones idLocal={idLocal} onChange={cambiarLocal} />
      </fieldset>

      {/* El resto, en la card de siempre */}
      <div className={formulario.formulario}>
        {intentoEnviar && cantidadErrores > 0 && (
          <p className={formulario.error} role="alert">
            {cantidadErrores === 1
              ? 'Revisá el campo marcado antes de enviar.'
              : `Revisá los ${cantidadErrores} campos marcados antes de enviar.`}
          </p>
        )}

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
          {/* Se guarda en el perfil al reservar, siempre: la próxima vez ya viene escrito */}
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
        {turnosCompletos.length > 0 && (
          <p className={formulario.ayuda}>
            Ese día ya está completo el turno {turnosCompletos.map((t) => TURNOS[t].toLowerCase()).join(' y el de la ')}.
          </p>
        )}

        <Campo
          id="personas"
          etiqueta="Personas"
          error={errorVisible('personas')}
          ayuda={grupo ? `Para más de ${LIMITES.personas.max} personas deberá realizar la reserva por WhatsApp.` : undefined}
        >
          {/* Se escribe o se sube y baja con las flechitas; el tope lo controla el validador */}
          {(props) => (
            <input
              {...props}
              name="personas"
              type="number"
              min="1"
              max={MAXIMO_ELEGIBLE}
              step="1"
              inputMode="numeric"
              value={valores.personas}
              onChange={alEscribir('personas')}
              onBlur={alSalir('personas')}
              className={`${formulario.control} ${estilos.cantidad}`}
            />
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
              placeholder="Alergias, celíacos, silla para bebé, cumpleaños…"
              value={valores.comentarios}
              onChange={alEscribir('comentarios')}
              onBlur={alSalir('comentarios')}
              className={formulario.control}
            />
          )}
        </Campo>

        {error && <p className={formulario.error} role="alert">{error}</p>}

        <div className={estilos.cierre}>
          {grupo ? (
            whatsappGrupo ? (
              <Boton href={whatsappGrupo} tamano="lg" className={estilos.botonEnviar}>
                <Icono nombre="whatsapp" />
                Reservar por WhatsApp
              </Boton>
            ) : (
              <p>
                Para más de {LIMITES.personas.max} personas escribinos por Instagram:{' '}
                <a href={MARCA.instagramUrl} target="_blank" rel="noreferrer" className={estilos.enlace}>
                  {MARCA.instagram}
                </a>
              </p>
            )
          ) : (
            <>
              <p className={estilos.aviso}>{TEXTOS.avisoReserva}</p>
              <p className={formulario.ayuda}>
                La seña se paga con Mercado Pago. Si cancelás desde &ldquo;Mis reservas&rdquo; (hasta 1 hora antes) o cancelamos nosotros, te la devolvemos al mismo medio de pago.
              </p>
              <Boton type="submit" tamano="lg" className={estilos.botonEnviar} disabled={enviando}>
                {enviando ? 'Enviando…' : `Reservar y pagar seña${sena ? ` (${formatearMonto(sena)})` : ''}`}
              </Boton>
              <SelloMercadoPago />
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function ReservasContenido() {
  const parametros = useSearchParams();
  const idPedido = parametros.get('local');
  const idInicial = esIdDeLocal(idPedido) ? idPedido : ID_LOCAL_POR_DEFECTO;
  // El admin no reserva desde acá: RequiereSesion lo lleva al panel
  return (
    <RequiereSesion soloClientes sinSesion={<SinSesion />}>
      <FormularioReserva idInicial={idInicial} />
    </RequiereSesion>
  );
}

export default function Reservas() {
  return (
    <main>
      <Hero compacto imagen="/img/comunes/sirviendo-vino.webp" alt="" titulo="Reservá tu mesa" bajada={MARCA.bajada} />
      <Section>
        {/* useSearchParams exige Suspense para que la ruta siga siendo estática */}
        <Suspense fallback={<div className={estilos.esperando} />}>
          <ReservasContenido />
        </Suspense>
      </Section>
    </main>
  );
}
