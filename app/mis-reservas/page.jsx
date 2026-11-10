'use client';

import { Suspense, useEffect, useState } from 'react';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import Dialogo from '../../src/components/Dialogo/Dialogo.jsx';
import ModificarReserva from '../../src/components/ModificarReserva/ModificarReserva.jsx';
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
  horaDeVencimiento,
  obtenerMisAnteriores,
  obtenerMisProximas,
  POR_PAGINA,
  puedePagar,
  sePuedeCancelar,
  sePuedeModificar,
} from '../../src/servicios/reservas.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

// Qué le decimos según lo que pasó con la seña (respuesta de la cancelación)
const MENSAJE_CANCELADA = {
  pedido: 'Listo, cancelamos tu reserva. Ya pedimos la devolución de la seña a Mercado Pago: vuelve al mismo medio de pago.',
  fallo: 'Listo, cancelamos tu reserva. La devolución de la seña no salió todavía; la reintentamos desde el local.',
  no_corresponde: 'Listo, cancelamos tu reserva.',
};

function TarjetaReserva({ reserva, alCancelar, alPagar, alModificar }) {
  const [modificando, setModificando] = useState(false);
  const local = getLocal(reserva.local_id);
  const cuando = `${formatearFecha(reserva.fecha)}, ${reserva.hora.slice(0, 5)}`;
  const whatsapp = enlaceWhatsapp(local, `Hola! Quería cancelar mi reserva del ${cuando} a nombre de ${reserva.nombre}.`);

  return (
    <li className={estilos.tarjeta}>
      <div className={estilos.cabecera}>
        <h3 className={estilos.local}>{local?.nombre ?? reserva.local_id}</h3>
        <EstadoReserva reserva={reserva} />
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
            {horaDeVencimiento(reserva)}.
          </p>
          <Boton onClick={() => alPagar(reserva)}>Pagar seña</Boton>
        </>
      )}
      {estadoSena(reserva) && <p className={estilos.detalle}>{ETIQUETAS_SENA[estadoSena(reserva)]}</p>}
      {reserva.estado === 'cancelada' && reserva.motivo_cancelacion && (
        <p className={estilos.detalle}>Motivo: {reserva.motivo_cancelacion}</p>
      )}

      {modificando ? (
        <ModificarReserva
          reserva={reserva}
          alGuardar={() => {
            setModificando(false);
            alModificar();
          }}
          alCerrar={() => setModificando(false)}
        />
      ) : (
        <div className={estilos.acciones}>
          {sePuedeModificar(reserva) && (
            <Boton variante="texto" onClick={() => setModificando(true)}>Modificar</Boton>
          )}
          {sePuedeCancelar(reserva) && (
            <Boton variante="texto" onClick={() => alCancelar(reserva)}>Cancelar reserva</Boton>
          )}
        </div>
      )}
      {esActiva(reserva) && !sePuedeCancelar(reserva) && faltaParaReserva(reserva) > 0 && (
        <p className={estilos.aviso}>
          Falta menos de 1 hora: para cambiarla o cancelarla,{' '}
          {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer"><Icono nombre="whatsapp" /> escribinos por WhatsApp</a> : 'escribinos'}.
        </p>
      )}
    </li>
  );
}

function ListaReservas() {
  const { sesion } = useSesion();
  const [proximas, setProximas] = useState(null);
  const [anteriores, setAnteriores] = useState([]);
  // Cuántas anteriores ya se pidieron a la base (para "Ver más")
  const [desde, setDesde] = useState(0);
  const [hayMas, setHayMas] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  // Subirlo vuelve a pedir las listas (después de cancelar o modificar)
  const [version, setVersion] = useState(0);
  // La reserva por la que se está preguntando "¿seguro que querés cancelar?"
  const [porCancelar, setPorCancelar] = useState(null);
  const idUsuario = sesion.user.id;

  useEffect(() => {
    let vigente = true;
    Promise.all([obtenerMisProximas(idUsuario), obtenerMisAnteriores(idUsuario)])
      .then(([activas, viejas]) => {
        if (!vigente) return;
        // Las de hoy que ya pasaron vienen con las activas: van arriba de las anteriores
        setProximas(activas.filter((r) => faltaParaReserva(r) > 0));
        setAnteriores([...activas.filter((r) => faltaParaReserva(r) <= 0).reverse(), ...viejas]);
        setDesde(viejas.length);
        setHayMas(viejas.length === POR_PAGINA);
      })
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [idUsuario, version]);

  const verMas = async () => {
    try {
      const mas = await obtenerMisAnteriores(idUsuario, desde);
      setAnteriores((lista) => [...lista, ...mas]);
      setDesde((n) => n + mas.length);
      setHayMas(mas.length === POR_PAGINA);
    } catch (e) {
      setError(e.message);
    }
  };

  const alModificar = () => {
    setError('');
    setAviso('Listo, guardamos los cambios de tu reserva.');
    setVersion((v) => v + 1);
  };

  const cancelar = async () => {
    const reserva = porCancelar;
    setPorCancelar(null);
    setError('');
    setAviso('');
    try {
      const { reintegro } = await cancelarReserva(reserva.id);
      setAviso(MENSAJE_CANCELADA[reintegro] ?? MENSAJE_CANCELADA.no_corresponde);
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

  if (!proximas && !error) return <p className={estilos.vacio} role="status">Cargando tus reservas…</p>;

  return (
    <div className={estilos.contenedor}>
      {error && <p className={formulario.error} role="alert">{error}</p>}
      {aviso && <p className={formulario.exito} role="status">{aviso}</p>}

      <h2 className={estilos.subtitulo}>Próximas</h2>
      {proximas?.length ? (
        <ul className={estilos.lista}>
          {proximas.map((r) => (
            <TarjetaReserva key={r.id} reserva={r} alCancelar={setPorCancelar} alPagar={alPagar} alModificar={alModificar} />
          ))}
        </ul>
      ) : (
        <p className={estilos.vacio}>No tenés reservas próximas.</p>
      )}
      <Boton to="/reservas" className={estilos.nueva}>Hacer una reserva</Boton>

      {anteriores.length > 0 && (
        <>
          <h2 className={estilos.subtitulo}>Anteriores y canceladas</h2>
          <ul className={`${estilos.lista} ${estilos.listaAnteriores}`}>
            {anteriores.map((r) => (
              <TarjetaReserva key={r.id} reserva={r} alCancelar={setPorCancelar} alPagar={alPagar} alModificar={alModificar} />
            ))}
          </ul>
          {hayMas && <Boton variante="secundario" onClick={verMas}>Ver más</Boton>}
        </>
      )}

      {porCancelar && (
        <Dialogo
          titulo="Cancelar la reserva"
          confirmar="Sí, cancelar"
          volver="No, volver"
          alConfirmar={cancelar}
          alCerrar={() => setPorCancelar(null)}
        >
          <p>
            ¿Seguro que querés cancelar tu reserva del {formatearFecha(porCancelar.fecha)} a
            las {porCancelar.hora.slice(0, 5)} en {getLocal(porCancelar.local_id)?.nombre}?
          </p>
          {estadoSena(porCancelar) === 'aprobado' && <p>Te devolvemos la seña por Mercado Pago.</p>}
        </Dialogo>
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
