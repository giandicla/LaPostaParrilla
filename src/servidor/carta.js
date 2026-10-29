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
// es la clave de la base, para editar. Las secciones de los dos locales (vinos
// y copas) llevan además `compartida: true`.

import { ErrorHttp } from './respuestas.js';

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
        compartida: seccion.local_id == null ? true : null,
      });
      return seccion.grupo === 'Vinos'
        ? { ...base, bodegas: agruparPorBodega(suyos) }
        : { ...base, items: suyos.sort(porOrden).map(aItem) };
    }),
  };
}

// ---------- Casos de uso (rutas de app/api/v1/carta) ----------
// `base` es crearBaseCarta() de carta-base.js, o una falsa en los tests.

const noEncontrado = () => new ErrorHttp(404, 'No encontramos ese ítem.');

export async function leerCarta(idLocal, { base }) {
  const filas = await base.leerFilas(idLocal);
  if (!filas) throw new ErrorHttp(404, 'No encontramos ese local.');
  return armarCarta(filas);
}

// La carta de vinos (y copas): las secciones compartidas por los dos locales
export async function leerVinos({ base }) {
  return armarCarta(await base.leerFilasVinos());
}

// Bajo RLS, un update de alguien que no es admin no falla: no toca ninguna
// fila. Por eso se pregunta antes.
export async function exigirAdmin(base) {
  if (!(await base.esAdmin())) throw new ErrorHttp(403, 'Solo el admin puede editar la carta.');
}

// Un vino nuevo con región cambia la de toda su bodega (la región es de la
// bodega; sin región, la base le copia la que ya tiene)
export async function crearItem(datos, { base }) {
  await exigirAdmin(base);
  const item = await base.crearItem(datos);
  if (datos.region && item.bodega) await base.editarBodega(item.seccion_id, item.bodega, { region: datos.region });
  return item;
}

// `posicion` lo ubica en su grupo (arrastrar); `region`, en un vino, es de su
// bodega: se aplica a todos sus vinos de esa sección (a la bodega nueva, si
// también cambió).
export async function editarItem(id, { posicion, region, ...cambios }, { base }) {
  await exigirAdmin(base);
  let item = null;
  if (Object.keys(cambios).length > 0) {
    item = await base.editarItem(id, cambios);
    if (!item) throw noEncontrado();
  }
  if (region !== undefined) {
    item ??= await base.leerItem(id);
    if (!item) throw noEncontrado();
    if (item.bodega) await base.editarBodega(item.seccion_id, item.bodega, { region });
  }
  if (posicion != null && !(await base.ubicarItem(id, posicion))) throw noEncontrado();
  return item ?? { id };
}

export async function borrarItem(id, { base }) {
  await exigirAdmin(base);
  if (!(await base.borrarItem(id))) throw noEncontrado();
}

export async function editarBodega(idSeccion, { bodega, region, posicion }, { base }) {
  await exigirAdmin(base);
  if (posicion != null) await base.ubicarBodega(idSeccion, bodega, posicion);
  if (region !== undefined) await base.editarBodega(idSeccion, bodega, { region });
}

export async function cambiarCubierto(idLocal, cubierto, { base }) {
  await exigirAdmin(base);
  await base.cambiarCubierto(idLocal, cubierto);
  return { cubierto };
}
