import { formatearPrecio } from '../../data/carta.js';
import estilos from './SeccionCarta.module.css';

// Una sección de la carta: platos (con descripción, traducción y uno o más
// precios) o vinos (agrupados por bodega). La forma de los datos está
// documentada en src/servidor/carta.js; la estética la pone HojaCarta.
export default function SeccionCarta({ seccion, idAncla }) {
  const { titulo, nota, tamanos, items, bodegas } = seccion;
  // Todas las secciones son h2, también las cepas: la carta de vinos ya no
  // muestra el título del grupo
  const Titulo = 'h2';

  return (
    <section id={idAncla} className={estilos.seccion}>
      <header className={estilos.encabezado}>
        <Titulo className={estilos.titulo}>{titulo}</Titulo>
        {nota && <p className={estilos.nota}>{nota}</p>}
      </header>

      {tamanos && (
        <p className={estilos.tamanos} aria-hidden="true">
          {tamanos.map((tamano) => (
            <span key={tamano}>{tamano}</span>
          ))}
        </p>
      )}

      {items && (
        <ul className={estilos.lista}>
          {items.map((item) => (
            <li key={item.id ?? item.nombre}>
              <Linea nombre={item.nombre} item={item} tamanos={tamanos} />
              {item.descripcion && <p className={estilos.descripcion}>{item.descripcion}</p>}
              {item.traduccion && (
                <p className={estilos.traduccion} lang="en">
                  {item.traduccion}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {bodegas &&
        bodegas.map((bodega) => (
          <div key={`${bodega.bodega}-${bodega.vinos[0].nombre}`} className={estilos.bodega}>
            <p className={estilos.nombreBodega}>
              {bodega.bodega}
              {bodega.region && <span className={estilos.region}>{bodega.region}</span>}
            </p>
            <ul className={estilos.lista}>
              {bodega.vinos.map((vino) => (
                <li key={vino.id ?? vino.nombre}>
                  <Linea nombre={vino.nombre} item={vino} />
                  {vino.detalle && <p className={estilos.descripcion}>{vino.detalle}</p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}

// Nombre y precio. Con tamanos, un precio por tamaño, cada uno con su
// etiqueta para lectores de pantalla (el encabezado visual es aria-hidden).
function Linea({ nombre, item, tamanos }) {
  return (
    <div className={estilos.linea}>
      <span className={estilos.nombre}>{nombre}</span>
      {item.precios ? (
        <span className={estilos.precios}>
          {item.precios.map((precio, i) => (
            <span key={i} className={estilos.precio}>
              <span className="visualmente-oculto">{tamanos?.[i]}: </span>
              {formatearPrecio(precio)}
            </span>
          ))}
        </span>
      ) : (
        item.precio != null && <span className={estilos.precio}>{formatearPrecio(item.precio)}</span>
      )}
    </div>
  );
}
