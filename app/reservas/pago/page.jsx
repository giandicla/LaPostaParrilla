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
  escucharReserva,
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

  useEffect(() => {
    if (!id) return undefined;
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
  }, [id]);

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

  if (puedePagar(reserva)) {
    return (
      <div className={formulario.formulario} role="status" aria-live="polite">
        <h2 className={estilos.titulo}>Estamos confirmando tu pago…</h2>
        {resumen}
        <p>Si ya pagaste, esta página se actualiza sola en unos segundos.</p>
        <p className={formulario.ayuda}>
          Si el pago no se completó, podés intentarlo de nuevo hasta las {hora(venceElPago(reserva))}.
        </p>
        {errorPago && <p className={formulario.error} role="alert">{errorPago}</p>}
        <Boton onClick={reintentar} disabled={abriendo}>{abriendo ? 'Abriendo Mercado Pago…' : 'Reintentar pago'}</Boton>
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
