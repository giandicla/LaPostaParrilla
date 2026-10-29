'use client';

import { useState } from 'react';
import Campo from '../Campo/Campo.jsx';
import Boton from '../Boton/Boton.jsx';
import formulario from '../../styles/formulario.module.css';
import { crearItem, editarItem } from '../../servicios/carta.js';
import { buscarEnCarta, datosDeLaCaja } from '../../data/editorCarta.js';
import {
  LIMITES_CARTA, validarNombreItem, validarPrecio, validarPrecios, validarTexto,
} from '../../validacion/carta.js';
import estilos from './CajaCarta.module.css';

// La caja del editor de la carta: sin `edicion`, agrega un producto (va último en
// su categoría); con `edicion`, edita ese producto. Tiene un buscador para elegir
// qué editar. La página le pone `key` por producto, así cada edición arranca con
// sus valores.
//
//   carta: la carta de la vista (de un local o de vinos), como la da la API
//   esVinos: la vista de vinos (la categoría se llama "Tipo de vino")
//   edicion: { item, seccion, bodega? } o null
//   alElegir(edicion): un resultado del buscador
//   alTerminar(mensaje?): guardado, agregado o cancelado
//   alCambiar(): después de guardar, para volver a leer la carta
export default function CajaCarta({ carta, esVinos, edicion, alElegir, alTerminar, alCambiar }) {
  const item = edicion ? { ...edicion.item, bodega: edicion.bodega?.bodega, region: edicion.bodega?.region } : null;
  const secciones = carta.secciones;

  const [valores, setValores] = useState({
    idSeccion: edicion?.seccion.idSeccion ?? secciones[0]?.idSeccion ?? '',
    nombre: item?.nombre ?? '',
    precio: item?.precio != null ? String(item.precio) : '',
    precios: (item?.precios ?? []).map(String),
    descripcion: item?.descripcion ?? '',
    traduccion: item?.traduccion ?? '',
    detalle: item?.detalle ?? '',
    bodega: item?.bodega ?? '',
    region: item?.region ?? '',
  });
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const seccion = secciones.find((s) => s.idSeccion === valores.idSeccion) ?? secciones[0];
  const esCepa = seccion?.grupo === 'Vinos';
  const tamanos = seccion?.tamanos;
  const bodegasDeLaSeccion = (seccion?.bodegas ?? []).map((b) => b.bodega);
  const resultados = buscarEnCarta(carta, busqueda);

  const campos = ['nombre', 'precio', ...(esCepa ? ['bodega', 'region', 'detalle'] : ['descripcion', 'traduccion'])];
  const validar = (campo, v = valores) => {
    if (campo === 'nombre') return validarNombreItem(v.nombre);
    if (campo === 'precio') {
      return tamanos ? validarPrecios(tamanos.map((_, i) => v.precios[i] ?? ''), tamanos) : validarPrecio(v.precio);
    }
    if (campo === 'bodega') return v.bodega.trim() ? validarTexto(v.bodega, LIMITES_CARTA.bodega) : 'Escribí la bodega.';
    if (campo === 'region') return validarTexto(v.region, LIMITES_CARTA.bodega);
    return validarTexto(v[campo], LIMITES_CARTA.texto);
  };

  const cambiar = (campo, valor) => {
    const nuevos = { ...valores, [campo]: valor };
    setValores(nuevos);
    const validado = campo === 'precios' ? 'precio' : campo;
    if (errores[validado]) setErrores({ ...errores, [validado]: validar(validado, nuevos) });
  };
  const salir = (campo) => setErrores({ ...errores, [campo]: validar(campo) });

  const guardar = async (evento) => {
    evento.preventDefault();
    const nuevos = Object.fromEntries(campos.map((campo) => [campo, validar(campo)]));
    setErrores(nuevos);
    const primerError = campos.find((campo) => nuevos[campo]);
    if (primerError) {
      document.getElementById(`caja-${primerError === 'precio' && tamanos ? 'precio-0' : primerError}`)?.focus();
      return;
    }
    const valoresCompletos = { ...valores, precios: tamanos ? tamanos.map((_, i) => valores.precios[i] ?? '') : [] };
    const datos = datosDeLaCaja(valoresCompletos, seccion, item, edicion?.seccion);
    if (item && Object.keys(datos).length === 0) return alTerminar();

    setOcupado(true);
    setErrorApi('');
    try {
      if (item) await editarItem(item.id, datos);
      else await crearItem(datos);
      await alCambiar();
      alTerminar(item ? `Guardado: ${datos.nombre ?? item.nombre}.` : `Agregado al final de ${seccion.titulo}.`);
    } catch (error) {
      // Lo borraron mientras se editaba: la caja vuelve a "agregar"
      if (item && error.message === 'No encontramos ese ítem.') {
        await alCambiar();
        alTerminar(error.message);
      } else {
        setErrorApi(error.message);
        setOcupado(false);
      }
    }
  };

  const control = (campo, props, extra = {}) => (
    <input
      {...props}
      className={formulario.control}
      value={valores[campo]}
      onChange={(e) => cambiar(campo, e.target.value)}
      onBlur={() => salir(campo)}
      {...extra}
    />
  );

  return (
    <section className={estilos.caja} aria-labelledby="caja-titulo">
      <h2 id="caja-titulo" className={estilos.titulo}>
        {item ? `Editando: ${item.nombre}` : 'Agregar a la carta'}
      </h2>

      <div className={estilos.buscador}>
        <label className="visualmente-oculto" htmlFor="caja-buscar">Buscar un producto para editarlo</label>
        <input
          id="caja-buscar"
          type="search"
          className={formulario.control}
          placeholder="Buscar un producto para editarlo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          autoComplete="off"
        />
        {resultados.length > 0 && (
          <ul className={estilos.resultados} aria-label="Resultados">
            {resultados.map((resultado) => (
              <li key={resultado.item.id}>
                <button
                  type="button"
                  className={estilos.resultado}
                  onClick={() => {
                    setBusqueda('');
                    alElegir(resultado);
                  }}
                >
                  {resultado.item.nombre}
                  <span>{resultado.bodega ? `${resultado.seccion.titulo} · ${resultado.bodega.bodega}` : resultado.seccion.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {busqueda.trim().length >= 2 && resultados.length === 0 && (
          <p className={formulario.ayuda}>No hay productos con ese nombre en esta carta.</p>
        )}
      </div>

      <form className={estilos.formulario} onSubmit={guardar} noValidate>
        <div className={estilos.fila}>
          <Campo id="caja-nombre" etiqueta="Nombre" error={errores.nombre}>
            {(props) => control('nombre', props, { maxLength: LIMITES_CARTA.nombre })}
          </Campo>
          <Campo id="caja-categoria" etiqueta={esVinos ? 'Tipo de vino' : 'Categoría'}>
            {(props) => (
              <select
                {...props}
                className={formulario.control}
                value={valores.idSeccion}
                onChange={(e) => cambiar('idSeccion', e.target.value)}
              >
                {secciones.map((s) => (
                  <option key={s.idSeccion} value={s.idSeccion}>{s.titulo}</option>
                ))}
              </select>
            )}
          </Campo>
        </div>

        {tamanos ? (
          <fieldset className={estilos.precios}>
            <legend className={formulario.etiqueta}>Precios</legend>
            {tamanos.map((tamano, i) => (
              <label key={tamano} className={estilos.precioTamano}>
                <span>{tamano}</span>
                <input
                  id={`caja-precio-${i}`}
                  className={formulario.control}
                  inputMode="numeric"
                  value={valores.precios[i] ?? ''}
                  aria-invalid={errores.precio ? true : undefined}
                  aria-describedby={errores.precio ? 'caja-precios-error' : undefined}
                  onChange={(e) => {
                    const precios = tamanos.map((_, j) => (j === i ? e.target.value : valores.precios[j] ?? ''));
                    cambiar('precios', precios);
                  }}
                  onBlur={() => salir('precio')}
                />
              </label>
            ))}
            {errores.precio && <p id="caja-precios-error" className={estilos.error}>{errores.precio}</p>}
          </fieldset>
        ) : (
          <Campo id="caja-precio" etiqueta="Precio" error={errores.precio}>
            {(props) => control('precio', props, { inputMode: 'numeric' })}
          </Campo>
        )}

        {esCepa ? (
          <div className={estilos.fila}>
            <Campo id="caja-bodega" etiqueta="Bodega" error={errores.bodega}>
              {(props) => control('bodega', props, { list: 'caja-bodegas', maxLength: LIMITES_CARTA.bodega })}
            </Campo>
            <datalist id="caja-bodegas">
              {bodegasDeLaSeccion.map((nombre) => <option key={nombre} value={nombre} />)}
            </datalist>
            <Campo
              id="caja-region"
              etiqueta="Región"
              opcional
              ayuda="Es de la bodega: cambia en todos sus vinos de este tipo."
              error={errores.region}
            >
              {(props) => control('region', props, { maxLength: LIMITES_CARTA.bodega })}
            </Campo>
            <Campo id="caja-detalle" etiqueta="Detalle" opcional error={errores.detalle}>
              {(props) => control('detalle', props, { maxLength: LIMITES_CARTA.texto })}
            </Campo>
          </div>
        ) : (
          <div className={estilos.fila}>
            <Campo id="caja-descripcion" etiqueta="Descripción" opcional error={errores.descripcion}>
              {(props) => control('descripcion', props, { maxLength: LIMITES_CARTA.texto })}
            </Campo>
            <Campo id="caja-traduccion" etiqueta="Traducción (inglés / portugués)" opcional error={errores.traduccion}>
              {(props) => control('traduccion', props, { maxLength: LIMITES_CARTA.texto })}
            </Campo>
          </div>
        )}

        {errorApi && <p className={estilos.error} role="alert">{errorApi}</p>}

        <div className={estilos.acciones}>
          <Boton type="submit" disabled={ocupado}>{item ? 'Guardar' : 'Agregar'}</Boton>
          {item ? (
            <button type="button" className={estilos.cancelar} onClick={() => alTerminar()}>Cancelar</button>
          ) : (
            <span className={formulario.ayuda}>Va último en su categoría; después se puede arrastrar.</span>
          )}
        </div>
      </form>
    </section>
  );
}
