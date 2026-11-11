import { LOCALES, datosEnComun, enlaceComoLlegar } from '../../data/locales.js';
import { MARCA } from '../../data/marca.js';
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
        <div className={estilos.resumen}>
          <div className={estilos.bloque}>
            <h3 className={estilos.subtitulo}>Dónde estamos</h3>
            <address className={estilos.direccion}>{comun.direccion}</address>
            <a href={enlaceComoLlegar(comun.direccion)} className={estilos.enlace} target="_blank" rel="noreferrer">
              Cómo llegar →
            </a>
          </div>
          <div className={estilos.bloque}>
            <h3 className={estilos.subtitulo}>Horarios</h3>
            {comun.horarios.map((horario) => (
              <p key={horario.dia}>
                {horario.dia}: {horario.franja}
              </p>
            ))}
          </div>
          <div className={estilos.bloque}>
            <h3 className={estilos.subtitulo}>Instagram y mail</h3>
            <a href={MARCA.instagramUrl} target="_blank" rel="noreferrer" className={estilos.enlaceIcono}>
              <Icono nombre="instagram" />
              {MARCA.instagram}
            </a>
            <a href={`mailto:${MARCA.email}`} className={estilos.enlaceIcono}>
              <Icono nombre="mail" />
              {MARCA.email}
            </a>
          </div>
        </div>

        <ul className={estilos.salones}>
          {LOCALES.map((local) => (
            <li key={local.id} className={estilos.salon}>
              <h3 className={estilos.nombre}>{local.nombre}</h3>
              {/* Abajo de todo en las dos tarjetas, aunque un nombre ocupe más líneas */}
              <div className={estilos.pie}>
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
              </div>
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
