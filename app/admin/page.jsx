'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import RequiereSesion from '../../src/components/RequiereSesion/RequiereSesion.jsx';
import EstadoReserva from '../../src/components/EstadoReserva/EstadoReserva.jsx';
import { LOCALES, getLocal } from '../../src/data/locales.js';
import { ESTADOS, formatearFecha, hoyEnArgentina, obtenerFranjas } from '../../src/servicios/reservas.js';
import {
  bloquearDia,
  cambiarEstado,
  contarPendientes,
  desbloquearDia,
  escucharReservas,
  guardarNota,
  listarBloqueos,
  listarReservas,
  moverReserva,
} from '../../src/servicios/admin.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

// ---------------------------------------------------------------------
// Una reserva en el panel: datos, acciones según el estado, mover, nota
// ---------------------------------------------------------------------
function FilaReserva({ reserva, franjas, alCambiar, alError }) {
  const [moviendo, setMoviendo] = useState(false);
  // Borrador de la nota mientras se escribe; null = se muestra la guardada.
  // Así una recarga (por tiempo real) no pisa lo que se está escribiendo.
  const [borradorNota, setBorradorNota] = useState(null);
  const nota = borradorNota ?? reserva.nota;
  const local = getLocal(reserva.local_id);
  const activa = ['pendiente', 'confirmada'].includes(reserva.estado);

  const ejecutar = async (accion, confirmar) => {
    if (confirmar && !window.confirm(confirmar)) return;
    try {
      await accion();
      alCambiar();
    } catch (e) {
      alError(e.message);
    }
  };

  const alMover = (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
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
          {local?.nombreCorto ?? reserva.local_id} ·{' '}
          <a href={`tel:${reserva.telefono.replace(/[^\d+]/g, '')}`}>{reserva.telefono}</a>
          {reserva.estado === 'cancelada' && reserva.cancelada_por && ` · canceló el ${reserva.cancelada_por}`}
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
          <form className={estilos.mover} onSubmit={alMover}>
            <input name="fecha" type="date" required defaultValue={reserva.fecha} min={hoyEnArgentina()} className={formulario.control} aria-label="Nueva fecha" />
            <select name="hora" required defaultValue={reserva.hora.slice(0, 5)} className={formulario.control} aria-label="Nueva hora">
              {franjas.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <button type="submit" className={estilos.botonChico}>Guardar</button>
            <button type="button" className={estilos.botonTexto} onClick={() => setMoviendo(false)}>Cancelar</button>
          </form>
        )}
      </div>

      <div className={estilos.acciones}>
        {reserva.estado === 'pendiente' && (
          <>
            <button type="button" className={estilos.confirmar} onClick={() => ejecutar(() => cambiarEstado(reserva.id, 'confirmada'))}>
              Confirmar
            </button>
            <button
              type="button"
              className={estilos.botonTexto}
              onClick={() => ejecutar(() => cambiarEstado(reserva.id, 'rechazada'), '¿Rechazar esta reserva? Le avisamos al cliente por mail.')}
            >
              Rechazar
            </button>
          </>
        )}
        {activa && !moviendo && (
          <button type="button" className={estilos.botonTexto} onClick={() => setMoviendo(true)}>Mover</button>
        )}
        {reserva.estado === 'confirmada' && (
          <button
            type="button"
            className={estilos.botonTexto}
            onClick={() => ejecutar(() => cambiarEstado(reserva.id, 'cancelada'), '¿Cancelar esta reserva? Le avisamos al cliente por mail.')}
          >
            Cancelar
          </button>
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
    try {
      await bloquearDia({ fecha: datos.fecha, idLocal: datos.local, motivo: datos.motivo });
      form.reset();
      cargar();
    } catch (e) {
      // mensajeDeError traduce cualquier violación de unicidad como la de
      // reservas; acá la única posible es el mismo día bloqueado dos veces
      alError(e.message.includes('reserva activa') ? 'Ese día ya está bloqueado.' : e.message);
    }
  };

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-bloqueos">
      <h2 id="titulo-bloqueos" className={estilos.tituloBloque}>Días bloqueados</h2>
      <p className={formulario.ayuda}>
        Un día bloqueado no se puede reservar desde la web. Las reservas que ya existían no se tocan.
      </p>
      <form className={estilos.formBloqueo} onSubmit={alBloquear}>
        <input name="fecha" type="date" required min={hoy} className={formulario.control} aria-label="Fecha" />
        <select name="local" className={formulario.control} aria-label="Local" defaultValue="">
          <option value="">Los dos locales</option>
          {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.nombreCorto}</option>)}
        </select>
        <input name="motivo" placeholder="Motivo (opcional)" className={formulario.control} aria-label="Motivo" />
        <button type="submit" className={estilos.confirmar}>Bloquear</button>
      </form>
      {bloqueos.length > 0 ? (
        <ul className={estilos.listaBloqueos}>
          {bloqueos.map((b) => (
            <li key={b.id}>
              <span>
                <strong>{formatearFecha(b.fecha)}</strong> · {b.local_id ? getLocal(b.local_id)?.nombreCorto : 'los dos locales'}
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
// Panel
// ---------------------------------------------------------------------
function Panel() {
  const [filtros, setFiltros] = useState({ fecha: hoyEnArgentina(), idLocal: '', estado: '' });
  const [reservas, setReservas] = useState(null);
  const [pendientes, setPendientes] = useState(0);
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
    Promise.all([listarReservas(filtros), contarPendientes()])
      .then(([lista, cantidad]) => {
        if (!vigente) return;
        setReservas(lista);
        setPendientes(cantidad);
      })
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

  // Tiempo real: cualquier cambio en reservas recarga la lista
  useEffect(
    () =>
      escucharReservas((cambio) => {
        if (cambio.eventType === 'INSERT') {
          setNovedad(`Entró una reserva nueva de ${cambio.new.nombre}.`);
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
        <button
          type="button"
          className={`${estilos.contador} ${pendientes ? estilos.contadorActivo : ''}`}
          onClick={() => filtrar({ fecha: '', estado: 'pendiente' })}
        >
          {pendientes} {pendientes === 1 ? 'pendiente' : 'pendientes'}
        </button>
      </header>

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

      <div className={estilos.filtros}>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Fecha</span>
          <input type="date" value={filtros.fecha} onChange={(e) => filtrar({ fecha: e.target.value })} className={formulario.control} />
        </label>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Local</span>
          <select value={filtros.idLocal} onChange={(e) => filtrar({ idLocal: e.target.value })} className={formulario.control}>
            <option value="">Los dos</option>
            {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.nombreCorto}</option>)}
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
