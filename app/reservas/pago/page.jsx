'use client';

// A esta página vuelve el cliente desde Mercado Pago (back_urls). Lo que diga
// la URL no decide nada (clase 11: las back_urls no son confiables): se mira
// la reserva en la base, que la confirma el webhook.

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Hero from '../../../src/components/Hero/Hero.jsx';
import Section from '../../../src/components/Section/Section.jsx';
import Boton from '../../../src/components/Boton/Boton.jsx';
import RequiereSesion from '../../../src/components/RequiereSesion/RequiereSesion.jsx';
import { getLocal } from '../../../src/data/locales.js';
import { iniciarPago } from '../../../src/servicios/pagos.js';
import {
  ETIQUETAS_SENA,
  escucharReserva,
  estadoDelPago,
  estadoSena,
  formatearFecha,
  obtenerReserva,
  puedePagar,
  venceElPago,
} from '../../../src/servicios/reservas.js';
import formulario from '../../../src/styles/formulario.module.css';
import estilos from './page.module.css';

const hora = (fecha) =>
  new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(fecha);

function EstadoDelPago() {
  const id = useSearchParams().get('reserva');
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState(id ? '' : 'Falta el número de reserva.');
  const [abriendo, setAbriendo] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  // Una vez que la reserva deja de esperar el pago (confirmada, vencida,
  // cancelada) no hay nada más que esperar: se dejan el sondeo y el tiempo real
  const sigueEsperando = !reserva || reserva.estado === 'esperando_pago';

  // Al volver con "atrás" desde Mercado Pago, el navegador restaura la página
  // tal cual estaba (bfcache): sin esto quedaría trabada en "Abriendo…"
  useEffect(() => {
    const alVolver = (evento) => evento.persisted && setAbriendo(false);
    window.addEventListener('pageshow', alVolver);
    return () => window.removeEventListener('pageshow', alVolver);
  }, []);

  useEffect(() => {
    if (!id || !sigueEsperando) return undefined;
    let vigente = true;
    const leer = () =>
      obtenerReserva(id)
        .then((r) => {
          if (!vigente) return;
          if (r) {
            setReserva(r);
            setError('');
          } else {
            setError('No encontramos esa reserva.');
          }
        })
        .catch((e) => vigente && setError(e.message));
    leer();
    const dejarDeEscuchar = escucharReserva(id, leer);
    // Por si el tiempo real no llega: se vuelve a mirar cada 5 segundos
    const intervalo = setInterval(leer, 5000);
    return () => {
      vigente = false;
      dejarDeEscuchar();
      clearInterval(intervalo);
    };
  }, [id, sigueEsperando]);

  const reintentar = async () => {
    setErrorPago('');
    setAbriendo(true);
    try {
      window.location.assign(await iniciarPago(id));
    } catch (e) {
      setErrorPago(e.message);
      setAbriendo(false);
    }
  };

  // El error de lectura solo reemplaza la pantalla si todavía no se cargó la reserva:
  // una vez cargada, un sondeo que falla no la esconde (el siguiente lo corrige).
  if (!reserva && error) return <p className={formulario.error} role="alert">{error}</p>;
  if (!reserva) return <p className={formulario.ayuda} role="status">Cargando tu reserva…</p>;

  const local = getLocal(reserva.local_id);
  const resumen = (
    <p>
      <strong>{local?.nombre}</strong>, {formatearFecha(reserva.fecha)} a las {reserva.hora.slice(0, 5)},{' '}
      {reserva.personas} {reserva.personas === 1 ? 'persona' : 'personas'}.
    </p>
  );

  if (reserva.estado === 'confirmada') {
    return (
      <div className={formulario.formulario} role="status">
        <h2 className={estilos.titulo}>¡Reserva confirmada!</h2>
        {resumen}
        <p className={formulario.exito}>Recibimos la seña. Te mandamos la confirmación por mail.</p>
        <Boton to="/mis-reservas">Ver mis reservas</Boton>
      </div>
    );
  }

  const sena = estadoSena(reserva);

  if (puedePagar(reserva)) {
    const rechazado = estadoDelPago(reserva) === 'rechazado';
    return (
      <div className={formulario.formulario} role="status" aria-live="polite">
        <h2 className={estilos.titulo}>{rechazado ? 'No se pudo hacer el pago' : 'Estamos confirmando tu pago…'}</h2>
        {resumen}
        {rechazado ? (
          <p>Mercado Pago no aprobó el pago. Podés intentarlo de nuevo, con el mismo medio u otro.</p>
        ) : (
          <p>Si ya pagaste, esta página se actualiza sola en unos segundos.</p>
        )}
        <p className={formulario.ayuda}>
          {rechazado ? 'Tenés' : 'Si el pago no se completó, podés intentarlo de nuevo'} hasta las {hora(venceElPago(reserva))}.
        </p>
        {errorPago && <p className={formulario.error} role="alert">{errorPago}</p>}
        <Boton onClick={reintentar} disabled={abriendo}>{abriendo ? 'Abriendo Mercado Pago…' : 'Reintentar pago'}</Boton>
      </div>
    );
  }

  if (reserva.estado === 'cancelada') {
    return (
      <div className={formulario.formulario}>
        <h2 className={estilos.titulo}>La reserva fue cancelada</h2>
        {resumen}
        {reserva.motivo_cancelacion && <p>Motivo: {reserva.motivo_cancelacion}</p>}
        {sena && <p className={formulario.ayuda}>{ETIQUETAS_SENA[sena]}.</p>}
        <Boton to="/reservas">Hacer una reserva</Boton>
      </div>
    );
  }

  // El pago llegó después de que venció la reserva: el local devuelve la seña a mano
  if (reserva.estado === 'vencida' && (sena === 'reintegro_pendiente' || sena === 'reintegrado')) {
    return (
      <div className={formulario.formulario}>
        <h2 className={estilos.titulo}>Llegó tarde el pago</h2>
        {resumen}
        <p>
          El plazo para pagar ya se había vencido y el lugar se liberó, así que te devolvemos la seña en los próximos días.
          Si querés, hacé la reserva de nuevo.
        </p>
        <p className={formulario.ayuda}>{ETIQUETAS_SENA[sena]}.</p>
        <Boton to="/reservas">Hacer una reserva</Boton>
      </div>
    );
  }

  return (
    <div className={formulario.formulario}>
      <h2 className={estilos.titulo}>La reserva no se completó</h2>
      {resumen}
      <p>Se venció el plazo para pagar la seña, así que el lugar se liberó. Si querés, hacé la reserva de nuevo.</p>
      <Boton to="/reservas">Hacer una reserva</Boton>
    </div>
  );
}

export default function PagoDeLaReserva() {
  return (
    <main>
      <Hero compacto imagen="/img/comunes/salon-calido.webp" alt="" titulo="Tu reserva" bajada="La Posta" />
      <Section>
        <Suspense fallback={null}>
          <RequiereSesion soloClientes>
            <EstadoDelPago />
          </RequiereSesion>
        </Suspense>
      </Section>
    </main>
  );
}
