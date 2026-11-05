// La carta vista desde las rutas de app/api/v1/carta. Para leer se usa el
// cliente público; para escribir, el del usuario que llama (la RLS deja
// escribir solo al admin, y la lógica de carta.js lo pregunta antes).

import { ErrorHttp } from './respuestas.js';

// Los errores de la base, en castellano. Las reglas del trigger y de las
// funciones (P0001) ya vienen escritas para el panel.
export function traducir(error) {
  if (error.code === 'P0001') return new ErrorHttp(400, error.message);
  if (error.code === '23514') return new ErrorHttp(400, 'Revisá los datos: algún valor no es válido.');
  // La única clave foránea que se escribe desde el panel es la categoría del ítem
  if (error.code === '23503') return new ErrorHttp(404, 'No encontramos esa categoría.');
  if (error.code === '42501') return new ErrorHttp(403, 'Solo el admin puede editar la carta.');
  return new Error(error.message);
}

const dato = ({ data, error }) => {
  if (error) throw traducir(error);
  return data;
};

const COLUMNAS_SECCION = 'id, slug, local_id, titulo, grupo, nota, tamanos, orden';
const COLUMNAS_ITEM = 'id, seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden';

// De los campos de la API (camelCase) a las columnas
const aFila = ({ seccionId, ...campos }) => (seccionId ? { seccion_id: seccionId, ...campos } : campos);

export function crearBaseCarta(cliente) {
  const itemsDe = async (secciones) =>
    dato(await cliente.from('carta_items').select(COLUMNAS_ITEM).in('seccion_id', secciones.map((seccion) => seccion.id)));

  return {
    async leerFilas(idLocal) {
      const local = dato(await cliente.from('locales').select('cubierto').eq('id', idLocal).maybeSingle());
      if (!local) return null;
      const secciones = dato(await cliente.from('carta_secciones').select(COLUMNAS_SECCION).eq('local_id', idLocal));
      return { cubierto: local.cubierto, secciones, items: await itemsDe(secciones) };
    },
    // Vinos y copas: las secciones sin local
    async leerFilasVinos() {
      const secciones = dato(await cliente.from('carta_secciones').select(COLUMNAS_SECCION).is('local_id', null));
      return { cubierto: null, secciones, items: await itemsDe(secciones) };
    },
    leerItem: async (id) =>
      dato(await cliente.from('carta_items').select(COLUMNAS_ITEM).eq('id', id).maybeSingle()),
    esAdmin: async () => dato(await cliente.rpc('es_admin')) === true,
    crearItem: async (datos) =>
      dato(await cliente.from('carta_items').insert(aFila(datos)).select(COLUMNAS_ITEM).single()),
    editarItem: async (id, cambios) =>
      dato(await cliente.from('carta_items').update(aFila(cambios)).eq('id', id).select(COLUMNAS_ITEM).maybeSingle()),
    borrarItem: async (id) =>
      dato(await cliente.from('carta_items').delete().eq('id', id).select('id')).length > 0,
    async ubicarItem(id, posicion) {
      const existe = dato(await cliente.from('carta_items').select('id').eq('id', id).maybeSingle());
      if (!existe) return false;
      dato(await cliente.rpc('ubicar_item_carta', { p_id: id, p_posicion: posicion }));
      return true;
    },
    editarBodega: async (idSeccion, bodega, { region }) =>
      dato(await cliente.rpc('cambiar_region_bodega', { p_seccion_id: idSeccion, p_bodega: bodega, p_region: region })),
    ubicarBodega: async (idSeccion, bodega, posicion) =>
      dato(await cliente.rpc('ubicar_bodega_carta', { p_seccion_id: idSeccion, p_bodega: bodega, p_posicion: posicion })),
    cambiarCubierto: async (idLocal, cubierto) =>
      dato(await cliente.rpc('cambiar_cubierto', { p_local_id: idLocal, p_cubierto: cubierto })),
  };
}
