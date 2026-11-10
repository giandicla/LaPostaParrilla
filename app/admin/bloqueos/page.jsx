'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Section from '../../../src/components/Section/Section.jsx';
import RequiereSesion from '../../../src/components/RequiereSesion/RequiereSesion.jsx';
import PestanasAdmin from '../../../src/components/PestanasAdmin/PestanasAdmin.jsx';
import { LOCALES, getLocal } from '../../../src/data/locales.js';
import { TURNOS, formatearFecha, hoyEnArgentina } from '../../../src/servicios/reservas.js';
import { bloquearDia, desbloquearDia, listarBloqueos } from '../../../src/servicios/admin.js';
import { LIMITES, validarFecha, validarMotivo } from '../../../src/validacion/reservas.js';
import formulario from '../../../src/styles/formulario.module.css';
import estilos from '../page.module.css';

// Conecta un control del formulario con su mensaje de error
const atributosDeError = (error, campo, idMensaje) =>
  error?.campo === campo ? { 'aria-invalid': true, 'aria-describedby': idMensaje } : {};

// Días y turnos sin reservas desde la web. Vivía al final de /admin, debajo de
// todas las reservas, y con "Todas las fechas" quedaba perdido: ahora es una
// pestaña del panel.
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
      alError(e.message.startsWith('Ya tenés una reserva') ? 'Ese día y turno ya está bloqueado.' : e.message);
    }
  };

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-bloqueos">
      <h1 id="titulo-bloqueos" className={estilos.titulo}>Días bloqueados</h1>
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
                <strong>{formatearFecha(b.fecha, { conAnio: true })}</strong> · {b.local_id ? getLocal(b.local_id)?.nombre : 'los dos locales'}
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

function Bloqueos() {
  const [error, setError] = useState('');
  const alError = useCallback((mensaje) => setError(mensaje), []);

  return (
    <div className={estilos.panel}>
      <PestanasAdmin />
      {error && (
        <p className={formulario.error} role="alert">
          {error}{' '}
          <button type="button" className={estilos.botonTexto} onClick={() => setError('')}>Cerrar</button>
        </p>
      )}
      <DiasBloqueados alError={alError} />
    </div>
  );
}

export default function AdminBloqueos() {
  return (
    <main className={estilos.main}>
      <Section>
        <Suspense fallback={null}>
          <RequiereSesion admin>
            <Bloqueos />
          </RequiereSesion>
        </Suspense>
      </Section>
    </main>
  );
}
