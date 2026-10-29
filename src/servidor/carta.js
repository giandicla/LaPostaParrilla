// La carta: de las filas de la base a la forma que dibuja la web, y los casos
// de uso de las rutas de app/api/v1/carta. Recibe la base por parámetro para
// testearse sin red.
//
// Forma de una carta (la misma de antes, cuando vivía en src/data/cartas.json):
//
//   { cubierto, secciones: [seccion] }
//   seccion de platos: { id: slug, idSeccion, titulo, grupo?, nota?, tamanos?,
//                        items: [{ id, nombre, descripcion?, traduccion?,
//                        precio? | precios? }] }
//   seccion de vinos:  { id: slug, idSeccion, titulo, grupo: 'Vinos',
//                        bodegas: [{ bodega, region?, vinos: [{ id, nombre,
//                        detalle?, precio }] }] }
//
// `id` es el slug: arma las anclas públicas (#parrilla-entradas). `idSeccion`
// es la clave de la base, para editar.

const sinNulos = (objeto) => Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor != null));
const porOrden = (a, b) => a.orden - b.orden;

const aItem = ({ id, nombre, descripcion, traduccion, precio, precios }) =>
  sinNulos({ id, nombre, descripcion, traduccion, precio, precios });

// Una bodega va donde está su primer vino; sus vinos, juntos y en su orden
function agruparPorBodega(vinos) {
  const bodegas = new Map();
  for (const vino of [...vinos].sort(porOrden)) {
    if (!bodegas.has(vino.bodega)) bodegas.set(vino.bodega, { bodega: vino.bodega, region: vino.region, vinos: [] });
    bodegas.get(vino.bodega).vinos.push(sinNulos({ id: vino.id, nombre: vino.nombre, detalle: vino.detalle, precio: vino.precio }));
  }
  return [...bodegas.values()].map(sinNulos);
}

export function armarCarta({ cubierto, secciones, items }) {
  const propias = secciones.filter((s) => s.local_id != null).sort(porOrden);
  const compartidas = secciones.filter((s) => s.local_id == null).sort(porOrden);

  return {
    cubierto,
    secciones: [...propias, ...compartidas].map((seccion) => {
      const suyos = items.filter((item) => item.seccion_id === seccion.id);
      const base = sinNulos({
        id: seccion.slug, idSeccion: seccion.id, titulo: seccion.titulo,
        grupo: seccion.grupo, nota: seccion.nota, tamanos: seccion.tamanos,
      });
      return seccion.grupo === 'Vinos'
        ? { ...base, bodegas: agruparPorBodega(suyos) }
        : { ...base, items: suyos.sort(porOrden).map(aItem) };
    }),
  };
}
