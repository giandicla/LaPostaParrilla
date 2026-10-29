'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import RequiereSesion from '../../src/components/RequiereSesion/RequiereSesion.jsx';
import EstadoReserva from '../../src/components/EstadoReserva/EstadoReserva.jsx';
import NuevaReservaLocal from '../../src/components/NuevaReservaLocal/NuevaReservaLocal.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO } from '../../src/data/locales.js';
import {
  ESTADOS,
  ETIQUETAS_SENA,
  TURNOS,
  estadoSena,
  formatearFecha,
  formatearMonto,
  hoyEnArgentina,
  obtenerFranjas,
} from '../../src/servicios/reservas.js';
import {
  bloquearDia,
  desbloquearDia,
  escucharReservas,
  guardarNota,
  listarBloqueos,
  listarReintegrosPendientes,
  listarReservas,
  moverReserva,
} from '../../src/servicios/admin.js';
import { cancelarReserva, reintentarReintegro } from '../../src/servicios/pagos.js';
import { LIMITES, validarFecha, validarHora, validarMotivo } from '../../src/validacion/reservas.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

// Conecta un control de los formularios chicos del panel con su mensaje de error
const atributosDeError = (error, campo, idMensaje) =>
  error?.campo === campo ? { 'aria-invalid': true, 'aria-describedby': idMensaje } : {};

// ---------------------------------------------------------------------
// Una reserva en el panel: datos, acciones según el estado, mover, nota
// ---------------------------------------------------------------------
function FilaReserva({ reserva, franjas, alCambiar, alError }) {
  const [moviendo, setMoviendo] = useState(false);
  const [errorMover, setErrorMover] = useState(null); // { campo, mensaje }
  // Borrador de la nota mientras se escribe; null = se muestra la guardada.
  // Así una recarga (por tiempo real) no pisa lo que se está escribiendo.
  const [borradorNota, setBorradorNota] = useState(null);
  const nota = borradorNota ?? reserva.nota;
  const local = getLocal(reserva.local_id);
  const activa = ['esperando_pago', 'pendiente', 'confirmada'].includes(reserva.estado);
  const delLocal = reserva.origen === 'local';
  // Una reserva del local sin mail no recibe avisos: no se le promete uno
  const avisoMail = delLocal && !reserva.mail ? '' : ' Le avisamos al cliente por mail.';

  const ejecutar = async (accion) => {
    try {
      await accion();
      alCambiar();
    } catch (e) {
      alError(e.message);
    }
  };

  const alCancelar = () => {
    const motivo = window.prompt(
      `Motivo de la cancelación${avisoMail ? ' (le llega al cliente por mail)' : ''}:` +
        // Para que no se le devuelva la plata a mano a un cliente que ya no va a venir
        (estadoSena(reserva) === 'aprobado' ? ' Se le devuelve la seña automáticamente.' : ''),
      'No hay lugar'
    );
    if (motivo === null) return;
    if (!motivo.trim()) {
      alError('Escribí el motivo de la cancelación.');
      return;
    }
    ejecutar(async () => {
      const { reintegro } = await cancelarReserva(reserva.id, motivo.trim());
      if (reintegro === 'pendiente') {
        alError('La reserva quedó cancelada, pero no se pudo devolver la seña: reintentalo en "Reintegros pendientes".');
      }
    });
  };

  const alMover = (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const invalido =
      [['fecha', validarFecha(datos.fecha, { hoy: hoyEnArgentina() })], ['hora', validarHora(datos.hora, { franjas })]]
        .find(([, mensaje]) => mensaje);
    if (invalido) {
      setErrorMover({ campo: invalido[0], mensaje: invalido[1] });
      evento.currentTarget.elements[invalido[0]].focus();
      return;
    }
    setErrorMover(null);
    ejecutar(async () => {
      await moverReserva(reserva.id, { fecha: datos.fecha, hora: datos.hora });
      setMoviendo(false);
    });
  };

  return (
    <li className={`${estilos.fila} ${estilos[reserva.estado]}`}>
      <div className={estilos.hora}>
        <span>{reserva.hora.slice(0, 5)}</span>
        <small>{formatearFecha(reserva.fecha)}</small>
      </div>

      <div className={estilos.datos}>
        <p className={estilos.nombre}>
          {reserva.nombre} · {reserva.personas} {reserva.personas === 1 ? 'persona' : 'personas'}{' '}
          <EstadoReserva estado={reserva.estado} />
        </p>
        <p className={estilos.secundario}>
          {local?.nombre ?? reserva.local_id} ·{' '}
          <a href={`tel:${reserva.telefono.replace(/[^\d+]/g, '')}`}>{reserva.telefono}</a>
          {reserva.estado === 'cancelada' && reserva.cancelada_por && ` · canceló el ${reserva.cancelada_por}`}
          {reserva.estado === 'cancelada' && reserva.motivo_cancelacion && ` · "${reserva.motivo_cancelacion}"`}
          {estadoSena(reserva) && ` · ${ETIQUETAS_SENA[estadoSena(reserva)]}`}
          {delLocal && ' · Cargada en el local'}
          {reserva.mail && (
            <>
              {' · '}
              <a href={`mailto:${reserva.mail}`}>{reserva.mail}</a>
            </>
          )}
        </p>
        {reserva.comentarios && <p className={estilos.comentario}>“{reserva.comentarios}”</p>}

        <div className={estilos.nota}>
          <label className="visualmente-oculto" htmlFor={`nota-${reserva.id}`}>Nota interna</label>
          <textarea
            id={`nota-${reserva.id}`}
            rows="1"
            placeholder="Nota interna (solo la ve el equipo)"
            value={nota}
            onChange={(e) => setBorradorNota(e.target.value)}
            className={formulario.control}
          />
          {borradorNota !== null && borradorNota !== reserva.nota && (
            <button
              type="button"
              className={estilos.botonChico}
              onClick={() => ejecutar(async () => {
                await guardarNota(reserva.id, borradorNota);
                setBorradorNota(null);
              })}
            >
              Guardar nota
            </button>
          )}
        </div>

        {moviendo && (
          <form className={estilos.mover} onSubmit={alMover} noValidate>
            <input
              name="fecha"
              type="date"
              required
              defaultValue={reserva.fecha}
              min={hoyEnArgentina()}
              className={formulario.control}
              aria-label="Nueva fecha"
              {...atributosDeError(errorMover, 'fecha', `mover-error-${reserva.id}`)}
            />
            <select
              name="hora"
              required
              defaultValue={reserva.hora.slice(0, 5)}
              className={formulario.control}
              aria-label="Nueva hora"
              {...atributosDeError(errorMover, 'hora', `mover-error-${reserva.id}`)}
            >
              {franjas.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <button type="submit" className={estilos.botonChico}>Guardar</button>
            <button
              type="button"
              className={estilos.botonTexto}
              onClick={() => {
                setMoviendo(false);
                setErrorMover(null);
              }}
            >
              Cancelar
            </button>
            {errorMover && (
              <p id={`mover-error-${reserva.id}`} className={estilos.errorForm} role="alert">{errorMover.mensaje}</p>
            )}
          </form>
        )}
      </div>

      <div className={estilos.acciones}>
        {['pendiente', 'confirmada'].includes(reserva.estado) && !moviendo && (
          <button type="button" className={estilos.botonTexto} onClick={() => setMoviendo(true)}>Mover</button>
        )}
        {activa && (
          <button type="button" className={estilos.botonTexto} onClick={alCancelar}>Cancelar</button>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------
// Días bloqueados
// ---------------------------------------------------------------------
function DiasBloqueados({ alError }) {
  const [bloqueos, setBloqueos] = useState([]);
  const [version, setVersion] = useState(0);
  const [errorBloqueo, setErrorBloqueo] = useState(null); // { campo, mensaje }
  const hoy = hoyEnArgentina();
  const cargar = () => setVersion((v) => v + 1);

  useEffect(() => {
    let vigente = true;
    listarBloqueos(hoy)
      .then((lista) => vigente && setBloqueos(lista))
      .catch((e) => vigente && alError(e.message));
    return () => {
      vigente = false;
    };
  }, [hoy, alError, version]);

  const alBloquear = async (evento) => {
    evento.preventDefault();
    const form = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(form));
    const repetido = bloqueos.some((b) => b.fecha === datos.fecha && (b.local_id ?? '') === datos.local && (b.turno ?? '') === datos.turno);
    const invalido = [
      ['fecha', validarFecha(datos.fecha, { hoy }) || (repetido ? 'Ese día y turno ya está bloqueado.' : '')],
      ['motivo', validarMotivo(datos.motivo)],
    ].find(([, mensaje]) => mensaje);
    if (invalido) {
      setErrorBloqueo({ campo: invalido[0], mensaje: invalido[1] });
      form.elements[invalido[0]].focus();
      return;
    }
    setErrorBloqueo(null);
    try {
      await bloquearDia({ fecha: datos.fecha, idLocal: datos.local, turno: datos.turno, motivo: datos.motivo });
      form.reset();
      cargar();
    } catch (e) {
      // mensajeDeError traduce cualquier violación de unicidad como la de
      // reservas; acá la única posible es el mismo día bloqueado dos veces
      alError(e.message.includes('reserva activa') ? 'Ese día y turno ya está bloqueado.' : e.message);
    }
  };

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-bloqueos">
      <h2 id="titulo-bloqueos" className={estilos.tituloBloque}>Días bloqueados</h2>
      <p className={formulario.ayuda}>
        Un día o un turno bloqueado no se puede reservar desde la web. Las reservas que ya existían no se tocan.
      </p>
      <form className={estilos.formBloqueo} onSubmit={alBloquear} noValidate>
        <input
          name="fecha"
          type="date"
          required
          min={hoy}
          className={formulario.control}
          aria-label="Fecha"
          {...atributosDeError(errorBloqueo, 'fecha', 'bloqueo-error')}
        />
        <select name="local" className={formulario.control} aria-label="Local" defaultValue="">
          <option value="">Los dos locales</option>
          {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
        </select>
        <select name="turno" className={formulario.control} aria-label="Turno" defaultValue="">
          <option value="">Todo el día</option>
          {Object.entries(TURNOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
        <input
          name="motivo"
          placeholder="Motivo (opcional)"
          maxLength={LIMITES.motivo}
          className={formulario.control}
          aria-label="Motivo"
          {...atributosDeError(errorBloqueo, 'motivo', 'bloqueo-error')}
        />
        <button type="submit" className={estilos.confirmar}>Bloquear</button>
        {errorBloqueo && (
          <p id="bloqueo-error" className={estilos.errorForm} role="alert">{errorBloqueo.mensaje}</p>
        )}
      </form>
      {bloqueos.length > 0 ? (
        <ul className={estilos.listaBloqueos}>
          {bloqueos.map((b) => (
            <li key={b.id}>
              <span>
                <strong>{formatearFecha(b.fecha)}</strong> · {b.local_id ? getLocal(b.local_id)?.nombre : 'los dos locales'}
                {b.turno ? ` · ${TURNOS[b.turno].toLowerCase()}` : ' · todo el día'}
                {b.motivo && ` · ${b.motivo}`}
              </span>
              <button type="button" className={estilos.botonTexto} onClick={async () => {
                try {
                  await desbloquearDia(b.id);
                  cargar();
                } catch (e) {
                  alError(e.message);
                }
              }}>
                Desbloquear
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={formulario.ayuda}>No hay días bloqueados.</p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------
// Reintegros pendientes: señas de reservas canceladas cuyo reembolso falló
// ---------------------------------------------------------------------
function ReintegrosPendientes({ version, alCambiar, alError }) {
  const [pendientes, setPendientes] = useState([]);

  useEffect(() => {
    let vigente = true;
    listarReintegrosPendientes()
      .then((lista) => vigente && setPendientes(lista))
      .catch((e) => vigente && alError(e.message));
    return () => {
      vigente = false;
    };
  }, [version, alError]);

  if (!pendientes.length) return null;

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-reintegros">
      <h2 id="titulo-reintegros" className={estilos.tituloBloque}>Reintegros pendientes</h2>
      <ul className={estilos.listaBloqueos}>
        {pendientes.map((p) => (
          <li key={p.id}>
            <span>
              <strong>{p.reservas.nombre}</strong> · {formatearFecha(p.reservas.fecha)} {p.reservas.hora.slice(0, 5)} ·{' '}
              {formatearMonto(Number(p.monto))}
            </span>
            <button type="button" className={estilos.botonTexto} onClick={async () => {
              try {
                const { reintegro } = await reintentarReintegro(p.reserva_id);
                if (reintegro !== 'hecho') alError('Todavía no se pudo devolver la seña. Probá de nuevo en un rato.');
                alCambiar();
              } catch (e) {
                alError(e.message);
              }
            }}>
              Reintentar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------
function Panel() {
  // ?local=… llega cuando el admin toca "Reservar" en una página del sitio:
  // abre "Nueva reserva" con ese salón elegido
  const parametros = useSearchParams();
  const localPedido = parametros.get('local');
  const [nueva, setNueva] = useState(esIdDeLocal(localPedido) ? localPedido : null);
  const [filtros, setFiltros] = useState({ fecha: hoyEnArgentina(), idLocal: '', estado: '' });
  const [reservas, setReservas] = useState(null);
  const [franjas, setFranjas] = useState({});
  const [error, setError] = useState('');
  const [novedad, setNovedad] = useState('');
  // Subirlo vuelve a pedir la lista: después de una acción o de un aviso en tiempo real
  const [version, setVersion] = useState(0);
  const cargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    // Si los filtros cambian antes de que llegue la respuesta, esa respuesta
    // ya no sirve: sin esta marca, una consulta vieja y lenta pisaba la nueva.
    let vigente = true;
    listarReservas(filtros)
      .then((lista) => vigente && setReservas(lista))
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [filtros, version]);

  // Franjas de cada local, para el selector de "Mover"
  useEffect(() => {
    Promise.all(LOCALES.map(async (l) => [l.id, await obtenerFranjas(l.id)]))
      .then((pares) => setFranjas(Object.fromEntries(pares)))
      .catch((e) => setError(e.message));
  }, []);

  // Estado de cada reserva en pantalla, para saber cuándo una se acaba de pagar
  const estadosEnPantalla = useRef({});
  useEffect(() => {
    estadosEnPantalla.current = Object.fromEntries((reservas ?? []).map((r) => [r.id, r.estado]));
  }, [reservas]);

  // Tiempo real: cualquier cambio en reservas recarga la lista
  useEffect(
    () =>
      escucharReservas((cambio) => {
        const { id, estado, nombre } = cambio.new ?? {};
        if (cambio.eventType === 'UPDATE' && estado === 'confirmada' && estadosEnPantalla.current[id] === 'esperando_pago') {
          setNovedad(`Entró una reserva nueva de ${nombre}, con la seña paga.`);
        }
        cargar();
      }),
    [cargar]
  );

  const filtrar = (cambio) => setFiltros((anteriores) => ({ ...anteriores, ...cambio }));
  const alError = useCallback((mensaje) => setError(mensaje), []);

  return (
    <div className={estilos.panel}>
      <header className={estilos.cabecera}>
        <h1 className={estilos.titulo}>Reservas</h1>
        <div className={estilos.accionesCabecera}>
          <Boton to="/admin/carta" variante="contorno">Editar la carta</Boton>
          {!nueva && (
            <Boton onClick={() => setNueva(filtros.idLocal || ID_LOCAL_POR_DEFECTO)}>Nueva reserva</Boton>
          )}
        </div>
      </header>

      {nueva && (
        <NuevaReservaLocal
          idLocalInicial={nueva}
          alGuardar={(mensaje) => {
            setNueva(null);
            setNovedad(mensaje);
            cargar();
          }}
          alCerrar={() => setNueva(null)}
        />
      )}

      {novedad && (
        <p className={formulario.exito} role="status">
          {novedad}{' '}
          <button type="button" className={estilos.botonTexto} onClick={() => setNovedad('')}>Ok</button>
        </p>
      )}
      {error && (
        <p className={formulario.error} role="alert">
          {error}{' '}
          <button type="button" className={estilos.botonTexto} onClick={() => setError('')}>Cerrar</button>
        </p>
      )}

      <ReintegrosPendientes version={version} alCambiar={cargar} alError={alError} />

      <div className={estilos.filtros}>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Fecha</span>
          <input type="date" value={filtros.fecha} onChange={(e) => filtrar({ fecha: e.target.value })} className={formulario.control} />
        </label>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Local</span>
          <select value={filtros.idLocal} onChange={(e) => filtrar({ idLocal: e.target.value })} className={formulario.control}>
            <option value="">Los dos</option>
            {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </label>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Estado</span>
          <select value={filtros.estado} onChange={(e) => filtrar({ estado: e.target.value })} className={formulario.control}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
          </select>
        </label>
        <div className={estilos.atajos}>
          <button type="button" className={estilos.botonTexto} onClick={() => filtrar({ fecha: hoyEnArgentina() })}>Hoy</button>
          <button type="button" className={estilos.botonTexto} onClick={() => filtrar({ fecha: '' })}>Todas las fechas</button>
        </div>
      </div>

      {filtros.fecha && (
        <Boton
          to={`/admin/dia?fecha=${filtros.fecha}${filtros.idLocal ? `&local=${filtros.idLocal}` : ''}`}
          variante="texto"
        >
          Imprimir lista del {formatearFecha(filtros.fecha)}
        </Boton>
      )}

      {reservas === null ? (
        <p className={formulario.ayuda} role="status">Cargando…</p>
      ) : reservas.length ? (
        <ul className={estilos.lista}>
          {reservas.map((r) => (
            <FilaReserva
              key={r.id}
              reserva={r}
              franjas={franjas[r.local_id] ?? []}
              alCambiar={cargar}
              alError={alError}
            />
          ))}
        </ul>
      ) : (
        <p className={estilos.vacio}>No hay reservas con esos filtros.</p>
      )}

      <DiasBloqueados alError={alError} />
    </div>
  );
}

export default function Admin() {
  return (
    <main className={estilos.main}>
      <Section>
        <Suspense fallback={null}>
          <RequiereSesion admin>
            <Panel />
          </RequiereSesion>
        </Suspense>
      </Section>
    </main>
  );
}
