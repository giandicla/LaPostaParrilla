'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import Campo from '../../src/components/Campo/Campo.jsx';
import Dialogo from '../../src/components/Dialogo/Dialogo.jsx';
import RequiereSesion from '../../src/components/RequiereSesion/RequiereSesion.jsx';
import EstadoReserva from '../../src/components/EstadoReserva/EstadoReserva.jsx';
import NuevaReservaLocal from '../../src/components/NuevaReservaLocal/NuevaReservaLocal.jsx';
import EditarReserva from '../../src/components/EditarReserva/EditarReserva.jsx';
import PestanasAdmin from '../../src/components/PestanasAdmin/PestanasAdmin.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO } from '../../src/data/locales.js';
import {
  ESTADOS,
  ETIQUETAS_SENA,
  estadoSena,
  estadoVisible,
  formatearFecha,
  formatearMonto,
  hoyEnArgentina,
  obtenerFranjas,
} from '../../src/servicios/reservas.js';
import {
  escucharReservas,
  guardarNota,
  listarSenasADevolver,
  listarReservas,
} from '../../src/servicios/admin.js';
import { cancelarReserva } from '../../src/servicios/pagos.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

const MOTIVO_SUGERIDO = 'No hay lugar';

// ---------------------------------------------------------------------
// Una reserva en el panel: datos, acciones según el estado, editar, nota
// ---------------------------------------------------------------------
function FilaReserva({ reserva, franjas, alCambiar, alError }) {
  const [editando, setEditando] = useState(false);
  // El diálogo que pide el motivo antes de cancelar
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVO_SUGERIDO);
  const [errorMotivo, setErrorMotivo] = useState('');
  // Borrador de la nota mientras se escribe; null = se muestra la guardada.
  // Así una recarga (por tiempo real) no pisa lo que se está escribiendo.
  const [borradorNota, setBorradorNota] = useState(null);
  const nota = borradorNota ?? reserva.nota;
  const local = getLocal(reserva.local_id);
  // Una confirmada de un día que ya pasó (terminada) no se edita ni se cancela
  const activa = ['esperando_pago', 'pendiente', 'confirmada'].includes(reserva.estado)
    && estadoVisible(reserva) !== 'terminada';
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

  const cancelar = () => {
    if (!motivo.trim()) {
      setErrorMotivo('Escribí el motivo de la cancelación.');
      return;
    }
    setCancelando(false);
    ejecutar(() => cancelarReserva(reserva.id, motivo.trim()));
  };

  return (
    <li className={`${estilos.fila} ${estilos[estadoVisible(reserva)]}`}>
      <div className={estilos.hora}>
        <span>{reserva.hora.slice(0, 5)}</span>
        <small>{formatearFecha(reserva.fecha)}</small>
      </div>

      <div className={estilos.datos}>
        <p className={estilos.nombre}>
          {reserva.nombre} · {reserva.personas} {reserva.personas === 1 ? 'persona' : 'personas'}{' '}
          <EstadoReserva reserva={reserva} />
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

        {editando && (
          <EditarReserva
            reserva={reserva}
            franjas={franjas}
            avisaPorMail={Boolean(avisoMail)}
            alGuardar={() => {
              setEditando(false);
              alCambiar();
            }}
            alCerrar={() => setEditando(false)}
          />
        )}
      </div>

      <div className={estilos.acciones}>
        {activa && reserva.estado !== 'esperando_pago' && !editando && (
          <button type="button" className={estilos.botonTexto} onClick={() => setEditando(true)}>Editar</button>
        )}
        {activa && (
          <button
            type="button"
            className={estilos.botonTexto}
            onClick={() => {
              setMotivo(MOTIVO_SUGERIDO);
              setErrorMotivo('');
              setCancelando(true);
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      {cancelando && (
        <Dialogo
          titulo={`Cancelar la reserva de ${reserva.nombre}`}
          confirmar="Cancelar la reserva"
          volver="No cancelar"
          alConfirmar={cancelar}
          alCerrar={() => setCancelando(false)}
        >
          <p>
            {formatearFecha(reserva.fecha)}, {reserva.hora.slice(0, 5)} · {reserva.personas}{' '}
            {reserva.personas === 1 ? 'persona' : 'personas'}
            {estadoSena(reserva) === 'aprobado' && '. La seña se le devuelve por Mercado Pago.'}
          </p>
          <Campo
            id={`motivo-${reserva.id}`}
            etiqueta="Motivo de la cancelación"
            ayuda={avisoMail ? 'Le llega al cliente por mail.' : undefined}
            error={errorMotivo}
          >
            {(props) => (
              <input
                {...props}
                className={formulario.control}
                value={motivo}
                maxLength={120}
                onChange={(evento) => {
                  setMotivo(evento.target.value);
                  setErrorMotivo('');
                }}
              />
            )}
          </Campo>
        </Dialogo>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------
// Devoluciones de seña sin confirmar: el reembolso ya se le pidió a Mercado
// Pago (o falló al pedirlo) y el webhook todavía no lo confirmó. "Reintentar"
// lo vuelve a pedir; con la misma clave de idempotencia no devuelve dos veces.
// ---------------------------------------------------------------------
function SenasADevolver({ version, alCambiar, alError }) {
  const [pendientes, setPendientes] = useState([]);
  const [reintentando, setReintentando] = useState(null);

  useEffect(() => {
    let vigente = true;
    listarSenasADevolver()
      .then((lista) => vigente && setPendientes(lista))
      .catch((e) => vigente && alError(e.message));
    return () => {
      vigente = false;
    };
  }, [version, alError]);

  if (!pendientes.length) return null;

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-senas">
      <h2 id="titulo-senas" className={estilos.tituloBloque}>Devoluciones de seña en curso</h2>
      <p className={formulario.ayuda}>
        Se pidieron a Mercado Pago y se confirman solas cuando llega su aviso. Si una queda acá mucho tiempo, reintentala.
      </p>
      <ul className={estilos.listaBloqueos}>
        {pendientes.map((p) => (
          <li key={p.id}>
            <span>
              <strong>{p.reservas.nombre}</strong> · {formatearFecha(p.reservas.fecha)} {p.reservas.hora.slice(0, 5)} ·{' '}
              {formatearMonto(Number(p.monto))}
              {p.mp_payment_id && <> · operación {p.mp_payment_id}</>}
            </span>
            <button type="button" className={estilos.botonTexto} disabled={reintentando === p.id} onClick={async () => {
              setReintentando(p.id);
              try {
                await cancelarReserva(p.reserva_id);
                alCambiar();
              } catch (e) {
                alError(e.message);
              } finally {
                setReintentando(null);
              }
            }}>
              {reintentando === p.id ? 'Reintentando…' : 'Reintentar'}
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

  // Franjas de cada local, para el selector de hora de "Editar"
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
      <PestanasAdmin />

      <header className={estilos.cabecera}>
        <h1 className={estilos.titulo}>Reservas</h1>
        <div className={estilos.accionesCabecera}>
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

      <SenasADevolver version={version} alCambiar={cargar} alError={alError} />

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
