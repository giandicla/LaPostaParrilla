'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Section from '../../../src/components/Section/Section.jsx';
import RequiereSesion from '../../../src/components/RequiereSesion/RequiereSesion.jsx';
import PestanasAdmin from '../../../src/components/PestanasAdmin/PestanasAdmin.jsx';
import { LOCALES, getLocal } from '../../../src/data/locales.js';
import { formatearFecha, hoyEnArgentina, obtenerFranjas } from '../../../src/servicios/reservas.js';
import { bloquear, desbloquearDia, listarBloqueos } from '../../../src/servicios/admin.js';
import { LIMITES } from '../../../src/validacion/reservas.js';
import { horasDelBloqueo, mismoBloqueo, textoDeHoras, validarBloqueo } from '../../../src/validacion/bloqueos.js';
import formulario from '../../../src/styles/formulario.module.css';
import estilos from '../page.module.css';

// Conecta un control del formulario con su mensaje de error
const atributosDeError = (error, campo, idMensaje) =>
  error?.campo === campo ? { 'aria-invalid': true, 'aria-describedby': idMensaje } : {};

// "1 de marzo de 2027"
const fechaLarga = (fecha) =>
  new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${fecha}T00:00:00Z`));

// Un día: "miércoles, 10 de marzo de 2027". Varios: "del 1 de marzo de 2027 al 31 de marzo de 2027".
const textoDeFechas = (bloqueo) =>
  bloqueo.fecha_hasta === bloqueo.fecha
    ? formatearFecha(bloqueo.fecha, { conAnio: true })
    : `del ${fechaLarga(bloqueo.fecha)} al ${fechaLarga(bloqueo.fecha_hasta)}`;

// Bloqueos de reservas: de una fecha a otra y, si hace falta, entre dos horas
// (vacaciones, un evento, un horario que se deja de tomar por un tiempo). Vivía
// al final de /admin, debajo de todas las reservas, y con "Todas las fechas"
// quedaba perdido: ahora es una pestaña del panel.
function DiasBloqueados({ alError }) {
  const [bloqueos, setBloqueos] = useState([]);
  const [version, setVersion] = useState(0);
  const [errorBloqueo, setErrorBloqueo] = useState(null); // { campo, mensaje }
  // Horarios de reserva de cada local: { parrilla: ['12:00', …], … }
  const [franjasPorLocal, setFranjasPorLocal] = useState({});
  const [idLocal, setIdLocal] = useState('');
  // '' = el primer horario (desde) o el último (hasta) del local elegido
  const [horas, setHoras] = useState({ desde: '', hasta: '' });
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

  useEffect(() => {
    let vigente = true;
    Promise.all(LOCALES.map((l) => obtenerFranjas(l.id).then((franjas) => [l.id, franjas])))
      .then((pares) => vigente && setFranjasPorLocal(Object.fromEntries(pares)))
      .catch((e) => vigente && alError(e.message));
    return () => {
      vigente = false;
    };
  }, [alError]);

  // Los horarios del local elegido; con "Los dos locales", los de ambos
  const franjas = [...new Set((idLocal ? [idLocal] : LOCALES.map((l) => l.id)).flatMap((id) => franjasPorLocal[id] ?? []))].sort();
  const horaDesde = franjas.includes(horas.desde) ? horas.desde : franjas[0] ?? '';
  const horaHasta = franjas.includes(horas.hasta) ? horas.hasta : franjas[franjas.length - 1] ?? '';

  const alBloquear = async (evento) => {
    evento.preventDefault();
    const form = evento.currentTarget;
    const datos = { ...Object.fromEntries(new FormData(form)), horaDesde, horaHasta };
    const bloqueo = {
      fecha: datos.desde,
      fecha_hasta: datos.hasta || datos.desde,
      local_id: idLocal || null,
      ...horasDelBloqueo(datos, franjas),
      motivo: datos.motivo,
    };
    const invalido = validarBloqueo(datos, { hoy })
      ?? (bloqueos.some((b) => mismoBloqueo(b, bloqueo)) ? { campo: 'desde', mensaje: 'Ese bloqueo ya está cargado.' } : null);
    if (invalido) {
      setErrorBloqueo(invalido);
      form.elements[invalido.campo].focus();
      return;
    }
    setErrorBloqueo(null);
    try {
      await bloquear(bloqueo);
      form.reset();
      setIdLocal('');
      setHoras({ desde: '', hasta: '' });
      cargar();
    } catch (e) {
      // mensajeDeError traduce cualquier violación de unicidad como la de
      // reservas; acá la única posible es el mismo bloqueo cargado dos veces
      alError(e.message.startsWith('Ya tenés una reserva') ? 'Ese bloqueo ya está cargado.' : e.message);
    }
  };

  const conError = (campo) => atributosDeError(errorBloqueo, campo, 'bloqueo-error');

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-bloqueos">
      <h1 id="titulo-bloqueos" className={estilos.titulo}>Días bloqueados</h1>
      <p className={formulario.ayuda}>
        En los días y horarios bloqueados no se puede reservar. Las reservas que ya existían no se tocan.
        Para un solo día, dejá “Hasta” vacío. Del primer horario al último es todo el día.
      </p>
      <form className={estilos.formBloqueo} onSubmit={alBloquear} noValidate>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Desde</span>
          <input name="desde" type="date" required min={hoy} className={formulario.control} {...conError('desde')} />
        </label>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Hasta <span className={formulario.opcional}>(opcional)</span></span>
          <input name="hasta" type="date" min={hoy} className={formulario.control} {...conError('hasta')} />
        </label>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Local</span>
          <select name="local" className={formulario.control} value={idLocal} onChange={(e) => setIdLocal(e.target.value)}>
            <option value="">Los dos locales</option>
            {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </label>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Desde las</span>
          <select
            name="horaDesde"
            className={formulario.control}
            value={horaDesde}
            onChange={(e) => setHoras((h) => ({ ...h, desde: e.target.value }))}
          >
            {franjas.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          </select>
        </label>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Hasta las</span>
          <select
            name="horaHasta"
            className={formulario.control}
            value={horaHasta}
            onChange={(e) => setHoras((h) => ({ ...h, hasta: e.target.value }))}
            {...conError('horaHasta')}
          >
            {franjas.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          </select>
        </label>
        <label className={formulario.campo}>
          <span className={formulario.etiqueta}>Motivo <span className={formulario.opcional}>(opcional)</span></span>
          <input name="motivo" maxLength={LIMITES.motivo} className={formulario.control} {...conError('motivo')} />
        </label>
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
                <strong>{textoDeFechas(b)}</strong> · {b.local_id ? getLocal(b.local_id)?.nombre : 'los dos locales'}
                {` · ${textoDeHoras(b)}`}
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
