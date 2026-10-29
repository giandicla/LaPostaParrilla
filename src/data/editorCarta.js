// Funciones puras del editor de la carta (/admin/carta): buscar un producto,
// calcular la posición después de arrastrar y armar lo que la caja manda a la
// API. Sin React, para testearse con node --test.

import { aEntero } from '../validacion/carta.js';

const MAXIMO_RESULTADOS = 8;

// "Rúcula" y "rucula" son lo mismo para buscar
const normalizar = (texto) =>
  String(texto ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

// [{ item, seccion, bodega? }] de los productos cuyo nombre contiene el texto
export function buscarEnCarta(carta, texto) {
  const buscado = normalizar(texto);
  if (buscado.length < 2) return [];
  const resultados = [];
  for (const seccion of carta?.secciones ?? []) {
    for (const item of seccion.items ?? []) resultados.push({ item, seccion });
    for (const bodega of seccion.bodegas ?? []) {
      for (const item of bodega.vinos) resultados.push({ item, seccion, bodega });
    }
  }
  return resultados.filter(({ item }) => normalizar(item.nombre).includes(buscado)).slice(0, MAXIMO_RESULTADOS);
}

// Posición (desde 1) del movido si se suelta sobre el destino: toma su lugar
// (bajando queda después del destino; subiendo, antes)
export function posicionTrasArrastre(ids, idMovido, idDestino) {
  return ids.indexOf(idDestino) + 1;
}

const texto = (valor) => String(valor ?? '').trim() || null;
const sinNulos = (objeto) => Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor != null));

// Lo que la caja manda a la API.
//   valores: los campos de la caja (textos, como se escribieron)
//   seccion: la categoría elegida en la lista
//   item: el producto que se edita (null al agregar); en vinos, con su `bodega` y `region`
//   seccionDelItem: la categoría en la que estaba el producto
// Al agregar, todo lo cargado. Al editar, solo lo que cambió.
export function datosDeLaCaja(valores, seccion, item, seccionDelItem) {
  // Las cepas (grupo "Vinos") llevan bodega y detalle; "Copas y descorche" va
  // con los vinos pero es una sección común, sin bodega
  const esVino = seccion.grupo === 'Vinos';
  const datos = {
    nombre: texto(valores.nombre),
    precio: seccion.tamanos ? null : aEntero(valores.precio),
    precios: seccion.tamanos ? valores.precios.map(aEntero) : null,
    ...(esVino
      ? { detalle: texto(valores.detalle) }
      : { descripcion: texto(valores.descripcion), traduccion: texto(valores.traduccion) }),
    ...(esVino ? { bodega: texto(valores.bodega), region: texto(valores.region) } : {}),
  };

  if (!item) return { seccionId: seccion.idSeccion, ...sinNulos(datos) };

  const antes = {
    nombre: item.nombre, precio: item.precio ?? null, precios: item.precios ?? null,
    descripcion: item.descripcion ?? null, traduccion: item.traduccion ?? null, detalle: item.detalle ?? null,
    bodega: item.bodega ?? null, region: item.region ?? null,
  };
  const cambios = Object.fromEntries(
    Object.entries(datos).filter(([campo, valor]) => JSON.stringify(valor) !== JSON.stringify(antes[campo]))
  );
  return seccion.idSeccion !== seccionDelItem?.idSeccion ? { seccionId: seccion.idSeccion, ...cambios } : cambios;
}
