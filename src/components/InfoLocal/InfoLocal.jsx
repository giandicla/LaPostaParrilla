import estilos from './InfoLocal.module.css';

export default function InfoLocal({ local }) {
  const telefonoLimpio = local.telefono?.replace(/\s|-/g, '');

  return (
    <article className={estilos.info}>
      <h3 className={estilos.nombre}>{local.nombre}</h3>
      <p className={estilos.tagline}>{local.tagline}</p>

      <div className={estilos.bloque}>
        <h4 className={estilos.subtitulo}>Horarios</h4>
        <dl className={estilos.horarios}>
          {local.horarios.map((horario) => (
            <div key={horario.dia} className={estilos.horario}>
              <dt>{horario.dia}</dt>
              <dd>{horario.franja}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={estilos.bloque}>
        <h4 className={estilos.subtitulo}>Dónde estamos</h4>
        <address className={estilos.direccion}>{local.direccion}</address>
        <div className={estilos.marcoMapa}>
          <iframe
            src={local.mapaEmbedUrl}
            title={`Mapa de ${local.nombre}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={estilos.mapa}
          />
        </div>
      </div>

      <div className={estilos.contacto}>
        {/* Si el número todavía no lo pasó la familia, no se muestra nada */}
        {local.whatsapp && (
          <a
            href={`https://wa.me/${local.whatsapp}?text=${encodeURIComponent(
              `Hola! Quería consultar por una reserva en ${local.nombre}.`
            )}`}
            className={estilos.botonWhatsapp}
            target="_blank"
            rel="noreferrer"
          >
            Escribir por WhatsApp
          </a>
        )}
        {local.telefono ? (
          <a href={`tel:${telefonoLimpio}`} className={estilos.telefono}>
            {local.telefono}
          </a>
        ) : (
          <p className={estilos.sinTelefono}>Teléfono a confirmar</p>
        )}
      </div>
    </article>
  );
}
