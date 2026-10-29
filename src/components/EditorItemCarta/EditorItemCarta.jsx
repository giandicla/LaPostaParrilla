'use client';

import { useState } from 'react';
import Campo from '../Campo/Campo.jsx';
import Boton from '../Boton/Boton.jsx';
import formulario from '../../styles/formulario.module.css';
import { borrarItem, crearItem, editarItem, moverItem } from '../../servicios/carta.js';
import {
  LIMITES_CARTA, aEntero, validarNombreItem, validarPrecio, validarPrecios, validarTexto,
} from '../../validacion/carta.js';
import estilos from './EditorItemCarta.module.css';

// Un ítem de la carta en el panel: sus campos, Guardar, Subir, Bajar y Borrar.
// Sin `item`, es el formulario para agregar uno al final de la sección (en una
// sección de vinos, pide además la bodega y la región).
//
//   seccion: { idSeccion, tamanos?, grupo? } — de la carta que da la API
//   bodegas: nombres de las bodegas de la sección, para sugerir al agregar un vino
//   primero / ultimo: deshabilitan Subir / Bajar (en vinos, dentro de su bodega)
//   alCambiar(): después de cada escritura, para volver a leer la carta
//   alCancelar(): solo para el formulario de agregar
export default function EditorItemCarta({ seccion, item, bodegas = [], primero, ultimo, alCambiar, alCancelar }) {
  const esVino = seccion.grupo === 'Vinos';
  const { tamanos } = seccion;
  const prefijo = `item-${item?.id ?? `nuevo-${seccion.idSeccion}`}`;

  const inicial = {
    nombre: item?.nombre ?? '',
    precio: item?.precio != null ? String(item.precio) : '',
    precios: tamanos ? tamanos.map((_, i) => (item?.precios?.[i] != null ? String(item.precios[i]) : '')) : [],
    descripcion: item?.descripcion ?? '',
    traduccion: item?.traduccion ?? '',
    detalle: item?.detalle ?? '',
    bodega: '',
    region: '',
  };
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const campos = [
    'nombre',
    'precio',
    ...(esVino ? ['detalle', ...(item ? [] : ['bodega', 'region'])] : ['descripcion', 'traduccion']),
  ];
  const validar = (campo, v = valores) => {
    if (campo === 'nombre') return validarNombreItem(v.nombre);
    if (campo === 'precio') return tamanos ? validarPrecios(v.precios, tamanos) : validarPrecio(v.precio);
    if (campo === 'bodega') return v.bodega.trim() ? validarTexto(v.bodega, LIMITES_CARTA.bodega) : 'Escribí la bodega.';
    if (campo === 'region') return validarTexto(v.region, LIMITES_CARTA.bodega);
    return validarTexto(v[campo], LIMITES_CARTA.texto);
  };

  // Mensaje al salir del campo; mientras se corrige, se revalida
  const cambiar = (campo, valor) => {
    const nuevos = { ...valores, [campo]: valor };
    setValores(nuevos);
    const validado = campo === 'precios' ? 'precio' : campo;
    if (errores[validado]) setErrores({ ...errores, [validado]: validar(validado, nuevos) });
  };
  const salir = (campo) => setErrores({ ...errores, [campo]: validar(campo) });

  const texto = (valor) => valor.trim() || null;
  const datosParaGuardar = () => {
    const datos = {
      nombre: valores.nombre.trim(),
      ...(tamanos ? { precios: valores.precios.map(aEntero) } : { precio: aEntero(valores.precio) }),
      ...(esVino
        ? { detalle: texto(valores.detalle) }
        : { descripcion: texto(valores.descripcion), traduccion: texto(valores.traduccion) }),
    };
    if (!item) {
      const vino = esVino ? { bodega: valores.bodega.trim(), region: texto(valores.region) } : {};
      return { seccionId: seccion.idSeccion, ...datos, ...vino };
    }
    // Editando: solo lo que cambió
    const antes = {
      nombre: item.nombre, precio: item.precio, precios: item.precios,
      descripcion: item.descripcion ?? null, traduccion: item.traduccion ?? null, detalle: item.detalle ?? null,
    };
    return Object.fromEntries(
      Object.entries(datos).filter(([campo, valor]) => JSON.stringify(valor) !== JSON.stringify(antes[campo]))
    );
  };
  // Comparado ya convertido: "16.500" y 16500 son el mismo precio
  const hayCambios = !item || Object.keys(datosParaGuardar()).length > 0;

  const hacer = async (accion) => {
    setOcupado(true);
    setErrorApi('');
    try {
      await accion();
      await alCambiar();
    } catch (error) {
      setErrorApi(error.message);
    } finally {
      setOcupado(false);
    }
  };

  const guardar = (evento) => {
    evento.preventDefault();
    const nuevos = Object.fromEntries(campos.map((campo) => [campo, validar(campo)]));
    setErrores(nuevos);
    const primerError = campos.find((campo) => nuevos[campo]);
    if (primerError) {
      const id = primerError === 'precio' && tamanos ? 'precio-0' : primerError;
      document.getElementById(`${prefijo}-${id}`)?.focus();
      return;
    }
    hacer(async () => {
      if (item) await editarItem(item.id, datosParaGuardar());
      else {
        await crearItem(datosParaGuardar());
        setValores(inicial);
      }
    });
  };

  const borrar = () => {
    if (window.confirm(`¿Borrar «${item.nombre}» de la carta?`)) hacer(() => borrarItem(item.id));
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
    <form className={`${estilos.editor} ${item ? '' : estilos.nuevo}`} onSubmit={guardar} noValidate>
      <div className={estilos.principal}>
        <Campo id={`${prefijo}-nombre`} etiqueta={esVino ? 'Vino' : 'Nombre'} error={errores.nombre}>
          {(props) => control('nombre', props, { maxLength: LIMITES_CARTA.nombre })}
        </Campo>

        {tamanos ? (
          <fieldset className={estilos.precios}>
            <legend className={formulario.etiqueta}>Precios</legend>
            {tamanos.map((tamano, i) => (
              <label key={tamano} className={estilos.precioTamano}>
                <span>{tamano}</span>
                <input
                  id={`${prefijo}-precio-${i}`}
                  className={formulario.control}
                  inputMode="numeric"
                  value={valores.precios[i]}
                  aria-invalid={errores.precio ? true : undefined}
                  aria-describedby={errores.precio ? `${prefijo}-precios-error` : undefined}
                  onChange={(e) => cambiar('precios', valores.precios.map((p, j) => (j === i ? e.target.value : p)))}
                  onBlur={() => salir('precio')}
                />
              </label>
            ))}
            {errores.precio && (
              <p id={`${prefijo}-precios-error`} className={estilos.error}>
                {errores.precio}
              </p>
            )}
          </fieldset>
        ) : (
          <Campo id={`${prefijo}-precio`} etiqueta="Precio" error={errores.precio}>
            {(props) => control('precio', props, { inputMode: 'numeric' })}
          </Campo>
        )}
      </div>

      <div className={estilos.secundarios}>
        {esVino ? (
          <>
            {!item && (
              <>
                <Campo id={`${prefijo}-bodega`} etiqueta="Bodega" error={errores.bodega}>
                  {(props) => control('bodega', props, { list: `${prefijo}-bodegas`, maxLength: LIMITES_CARTA.bodega })}
                </Campo>
                <datalist id={`${prefijo}-bodegas`}>
                  {bodegas.map((nombre) => (
                    <option key={nombre} value={nombre} />
                  ))}
                </datalist>
                <Campo
                  id={`${prefijo}-region`}
                  etiqueta="Región"
                  opcional
                  ayuda="Si la bodega ya está en la sección, toma su región."
                  error={errores.region}
                >
                  {(props) => control('region', props, { maxLength: LIMITES_CARTA.bodega })}
                </Campo>
              </>
            )}
            <Campo id={`${prefijo}-detalle`} etiqueta="Detalle" opcional error={errores.detalle}>
              {(props) => control('detalle', props, { maxLength: LIMITES_CARTA.texto })}
            </Campo>
          </>
        ) : (
          <>
            <Campo id={`${prefijo}-descripcion`} etiqueta="Descripción" opcional error={errores.descripcion}>
              {(props) => control('descripcion', props, { maxLength: LIMITES_CARTA.texto })}
            </Campo>
            <Campo
              id={`${prefijo}-traduccion`}
              etiqueta="Traducción (inglés / portugués)"
              opcional
              error={errores.traduccion}
            >
              {(props) => control('traduccion', props, { maxLength: LIMITES_CARTA.texto })}
            </Campo>
          </>
        )}
      </div>

      {errorApi && (
        <p className={estilos.error} role="alert">
          {errorApi}
        </p>
      )}

      <div className={estilos.acciones}>
        <Boton type="submit" disabled={ocupado || !hayCambios}>
          {item ? 'Guardar' : 'Agregar'}
          {item && <span className="visualmente-oculto"> {item.nombre}</span>}
        </Boton>
        {item ? (
          <>
            <button
              type="button"
              className={estilos.accion}
              disabled={ocupado || primero}
              onClick={() => hacer(() => moverItem(item.id, 'arriba'))}
            >
              Subir<span className="visualmente-oculto"> {item.nombre}</span>
            </button>
            <button
              type="button"
              className={estilos.accion}
              disabled={ocupado || ultimo}
              onClick={() => hacer(() => moverItem(item.id, 'abajo'))}
            >
              Bajar<span className="visualmente-oculto"> {item.nombre}</span>
            </button>
            <button type="button" className={`${estilos.accion} ${estilos.borrar}`} disabled={ocupado} onClick={borrar}>
              Borrar<span className="visualmente-oculto"> {item.nombre}</span>
            </button>
          </>
        ) : (
          <button type="button" className={estilos.accion} onClick={alCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
