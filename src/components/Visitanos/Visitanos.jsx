import { LOCALES, datosEnComun, enlaceComoLlegar } from '../../data/locales.js';
import InfoLocal from '../InfoLocal/InfoLocal.jsx';
import Icono from '../Icono/Icono.jsx';
import Telefono from '../Telefono/Telefono.jsx';
import estilos from './Visitanos.module.css';

// "Visitanos" del inicio. Los dos salones están uno al lado del otro: la
// dirección, el mapa y los horarios van una sola vez, y el contacto de cada
// uno abajo. Si un día los locales difieren, vuelve a ir una tarjeta por local.
export default function Visitanos() {
  const comun = datosEnComun();
  if (!comun) {
    return (
      <div className={estilos.grilla}>
        {LOCALES.map((local) => <InfoLocal key={local.id} local={local} />)}
      </div>
    );
  }

  return (
    <article className={estilos.tarjeta}>
      <div className={estilos.datos}>
        <dl className={estilos.resumen}>
          <div>
            <dt className={estilos.subtitulo}>Dónde estamos</dt>
            <dd>
              <address className={estilos.direccion}>{comun.direccion}</address>
            </dd>
          </div>
          {comun.horarios.map((horario) => (
            <div key={horario.dia}>
              <dt className={estilos.subtitulo}>{horario.dia}</dt>
              <dd>{horario.franja}</dd>
            </div>
          ))}
        </dl>
        <a href={enlaceComoLlegar(comun.direccion)} className={estilos.comoLlegar} target="_blank" rel="noreferrer">
          Cómo llegar →
        </a>

        <ul className={estilos.salones}>
          {LOCALES.map((local) => (
            <li key={local.id} className={estilos.salon}>
              <h3 className={estilos.nombre}>{local.nombre}</h3>
              {local.telefono && <Telefono numero={local.telefono} className={estilos.telefono} />}
              {local.whatsapp && (
                <a
                  href={`https://wa.me/${local.whatsapp}?text=${encodeURIComponent(
                    `Hola! Quería consultar por una reserva en ${local.nombre}.`
                  )}`}
                  className={estilos.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icono nombre="whatsapp" />
                  WhatsApp<span className="visualmente-oculto"> de {local.nombre}</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className={estilos.marcoMapa}>
        <iframe
          src={comun.mapaEmbedUrl}
          title="Mapa de La Posta"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className={estilos.mapa}
        />
      </div>
    </article>
  );
}
