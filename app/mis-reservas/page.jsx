'use client';

import { Suspense, useEffect, useState } from 'react';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import Icono from '../../src/components/Icono/Icono.jsx';
import RequiereSesion from '../../src/components/RequiereSesion/RequiereSesion.jsx';
import EstadoReserva from '../../src/components/EstadoReserva/EstadoReserva.jsx';
import { useSesion } from '../../src/components/SesionProvider/SesionProvider.jsx';
import { getLocal, enlaceWhatsapp } from '../../src/data/locales.js';
import { cancelarReserva, iniciarPago } from '../../src/servicios/pagos.js';
import {
  ETIQUETAS_SENA,
  esActiva,
  estadoSena,
  faltaParaReserva,
  formatearFecha,
  obtenerMisReservas,
  puedePagar,
  sePuedeCancelar,
  venceElPago,
} from '../../src/servicios/reservas.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

function TarjetaReserva({ reserva, alCancelar, alPagar }) {
  const local = getLocal(reserva.local_id);
  const cuando = `${formatearFecha(reserva.fecha)}, ${reserva.hora.slice(0, 5)}`;
  const whatsapp = enlaceWhatsapp(local, `Hola! Quería cancelar mi reserva del ${cuando} a nombre de ${reserva.nombre}.`);

  return (
    <li className={estilos.tarjeta}>
      <div className={estilos.cabecera}>
        <h3 className={estilos.local}>{local?.nombre ?? reserva.local_id}</h3>
        <EstadoReserva estado={reserva.estado} />
      </div>
      <p className={estilos.cuando}>{cuando}</p>
      <p className={estilos.detalle}>
        {reserva.personas} {reserva.personas === 1 ? 'persona' : 'personas'} · a nombre de {reserva.nombre}
      </p>
      {reserva.comentarios && <p className={estilos.comentario}>“{reserva.comentarios}”</p>}
      {puedePagar(reserva) && (
        <>
          <p className={estilos.aviso}>
            Falta pagar la seña: guardamos tu lugar hasta las{' '}
            {new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).format(venceElPago(reserva))}.
          </p>
          <Boton onClick={() => alPagar(reserva)}>Pagar seña</Boton>
        </>
      )}
      {estadoSena(reserva) && <p className={estilos.detalle}>{ETIQUETAS_SENA[estadoSena(reserva)]}</p>}
      {reserva.estado === 'cancelada' && reserva.motivo_cancelacion && (
        <p className={estilos.detalle}>Motivo: {reserva.motivo_cancelacion}</p>
      )}

      {sePuedeCancelar(reserva) && (
        <Boton variante="texto" onClick={() => alCancelar(reserva)}>Cancelar reserva</Boton>
      )}
      {esActiva(reserva) && !sePuedeCancelar(reserva) && faltaParaReserva(reserva) > 0 && (
        <p className={estilos.aviso}>
          Falta menos de 1 hora: para cancelar,{' '}
          {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer"><Icono nombre="whatsapp" /> escribinos por WhatsApp</a> : 'escribinos'}.
        </p>
      )}
    </li>
  );
}

function ListaReservas() {
  const { sesion } = useSesion();
  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  // Subirlo vuelve a pedir la lista (después de cancelar)
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    obtenerMisReservas(sesion.user.id)
      .then((lista) => vigente && setReservas(lista))
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [sesion.user.id, version]);

  const alCancelar = async (reserva) => {
    const pregunta = estadoSena(reserva) === 'aprobado'
      ? '¿Seguro que querés cancelar esta reserva? La seña no se devuelve.'
      : '¿Seguro que querés cancelar esta reserva?';
    if (!window.confirm(pregunta)) return;
    setError('');
    setAviso('');
    try {
      await cancelarReserva(reserva.id);
      setAviso('Listo, cancelamos tu reserva.');
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e.message);
    }
  };

  const alPagar = async (reserva) => {
    setError('');
    try {
      window.location.assign(await iniciarPago(reserva.id));
    } catch (e) {
      setError(e.message);
    }
  };

  if (!reservas && !error) return <p className={estilos.vacio} role="status">Cargando tus reservas…</p>;

  // Próximas: activas y por venir, de la más cercana a la más lejana
  const proximas = (reservas ?? [])
    .filter((r) => esActiva(r) && faltaParaReserva(r) > 0)
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
  const anteriores = (reservas ?? []).filter((r) => !proximas.includes(r));

  return (
    <div className={estilos.contenedor}>
      {error && <p className={formulario.error} role="alert">{error}</p>}
      {aviso && <p className={formulario.exito} role="status">{aviso}</p>}

      <h2 className={estilos.subtitulo}>Próximas</h2>
      {proximas.length ? (
        <ul className={estilos.lista}>
          {proximas.map((r) => <TarjetaReserva key={r.id} reserva={r} alCancelar={alCancelar} alPagar={alPagar} />)}
        </ul>
      ) : (
        <p className={estilos.vacio}>No tenés reservas próximas.</p>
      )}
      <Boton to="/reservas" className={estilos.nueva}>Hacer una reserva</Boton>

      {anteriores.length > 0 && (
        <>
          <h2 className={estilos.subtitulo}>Anteriores y canceladas</h2>
          <ul className={`${estilos.lista} ${estilos.listaAnteriores}`}>
            {anteriores.map((r) => <TarjetaReserva key={r.id} reserva={r} alCancelar={alCancelar} alPagar={alPagar} />)}
          </ul>
        </>
      )}
    </div>
  );
}

export default function MisReservas() {
  return (
    <main>
      <Hero compacto imagen="/img/comunes/salon-calido.webp" alt="" titulo="Mis reservas" bajada="La Posta" />
      <Section>
        <Suspense fallback={null}>
          <RequiereSesion soloClientes>
            <ListaReservas />
          </RequiereSesion>
        </Suspense>
      </Section>
    </main>
  );
}
