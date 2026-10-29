'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Section from '../../../src/components/Section/Section.jsx';
import Boton from '../../../src/components/Boton/Boton.jsx';
import Campo from '../../../src/components/Campo/Campo.jsx';
import RequiereSesion from '../../../src/components/RequiereSesion/RequiereSesion.jsx';
import EditorItemCarta from '../../../src/components/EditorItemCarta/EditorItemCarta.jsx';
import formulario from '../../../src/styles/formulario.module.css';
import { LOCALES, esIdDeLocal, getLocal, ID_LOCAL_POR_DEFECTO } from '../../../src/data/locales.js';
import { cambiarCubierto, editarBodega, leerCarta } from '../../../src/servicios/carta.js';
import { LIMITES_CARTA, aEntero, validarPrecio, validarTexto } from '../../../src/validacion/carta.js';
import estilos from './page.module.css';

const VINOS = 'vinos';

// La carta en el panel: un local (sus secciones y el cubierto) o "Vinos" (las
// secciones compartidas por los dos locales, por bodega). Las secciones son
// fijas; los ítems se agregan, editan, mueven y borran.
function EditorCarta() {
  const parametros = useSearchParams();
  const router = useRouter();
  const pedida = parametros.get('vista');
  const vista = pedida === VINOS || esIdDeLocal(pedida) ? pedida : ID_LOCAL_POR_DEFECTO;
  // Los vinos se leen con la carta de cualquier local: son las secciones compartidas
  const idLocal = vista === VINOS ? ID_LOCAL_POR_DEFECTO : vista;

  // Guardada con su local, para no mostrar la de otro mientras llega la nueva
  const [pedido, setPedido] = useState({ idLocal: null, carta: null, error: '' });
  const cargar = useCallback(
    () =>
      leerCarta(idLocal, { fresca: true })
        .then((carta) => setPedido({ idLocal, carta, error: '' }))
        .catch((e) => setPedido({ idLocal, carta: null, error: e.message })),
    [idLocal]
  );
  useEffect(() => {
    cargar();
  }, [cargar]);
  const carta = pedido.idLocal === idLocal ? pedido.carta : null;
  const error = pedido.idLocal === idLocal ? pedido.error : '';

  const secciones = carta?.secciones.filter((s) => (vista === VINOS ? s.compartida : !s.compartida)) ?? [];

  return (
    <div className={estilos.panel}>
      <div className={estilos.barra}>
        <Boton to="/admin" variante="texto">← Volver al panel</Boton>
      </div>

      <header className={estilos.cabecera}>
        <h1 className={estilos.titulo}>Carta</h1>
        <div className={estilos.imprimir}>
          {LOCALES.map((local) => (
            <Boton key={local.id} href={`/admin/carta/imprimir?local=${local.id}`} variante="contorno">
              Imprimir / Guardar PDF · {local.nombre}
            </Boton>
          ))}
        </div>
      </header>

      <nav className={estilos.vistas} aria-label="Qué carta editar">
        {[...LOCALES.map((local) => ({ id: local.id, texto: local.nombre })), { id: VINOS, texto: 'Vinos' }].map(
          (opcion) => (
            <button
              key={opcion.id}
              type="button"
              className={estilos.vista}
              aria-pressed={vista === opcion.id}
              onClick={() => router.replace(`/admin/carta?vista=${opcion.id}`, { scroll: false })}
            >
              {opcion.texto}
            </button>
          )
        )}
      </nav>

      {vista === VINOS && (
        <p className={formulario.ayuda}>Los vinos y las copas son los mismos en los dos locales: se editan una sola vez.</p>
      )}

      {error && <p role="alert" className={estilos.error}>{error}</p>}
      {!carta && !error && <p role="status">Cargando…</p>}

      {carta && vista !== VINOS && (
        <Cubierto key={`${idLocal}-${carta.cubierto}`} local={getLocal(idLocal)} cubierto={carta.cubierto} alCambiar={cargar} />
      )}

      {secciones.map((seccion) => (
        <SeccionEditable key={seccion.idSeccion} seccion={seccion} alCambiar={cargar} />
      ))}
    </div>
  );
}

function SeccionEditable({ seccion, alCambiar }) {
  const [agregando, setAgregando] = useState(false);
  const bodegas = seccion.bodegas ?? [];

  return (
    <section className={estilos.seccion} aria-labelledby={`seccion-${seccion.idSeccion}`}>
      <h2 id={`seccion-${seccion.idSeccion}`} className={estilos.tituloSeccion}>
        {seccion.titulo}
        {seccion.tamanos && <span className={estilos.tamanos}> · {seccion.tamanos.join(' / ')}</span>}
      </h2>

      {seccion.items && (
        <ul className={estilos.items}>
          {seccion.items.map((item, i) => (
            <li key={item.id}>
              <EditorItemCarta
                seccion={seccion}
                item={item}
                primero={i === 0}
                ultimo={i === seccion.items.length - 1}
                alCambiar={alCambiar}
              />
            </li>
          ))}
        </ul>
      )}

      {bodegas.map((bodega, b) => (
        <Bodega
          key={bodega.bodega}
          seccion={seccion}
          bodega={bodega}
          primera={b === 0}
          ultima={b === bodegas.length - 1}
          alCambiar={alCambiar}
        />
      ))}

      {agregando ? (
        <EditorItemCarta
          seccion={seccion}
          bodegas={bodegas.map((b) => b.bodega)}
          alCambiar={async () => {
            await alCambiar();
            setAgregando(false);
          }}
          alCancelar={() => setAgregando(false)}
        />
      ) : (
        <button type="button" className={estilos.agregar} onClick={() => setAgregando(true)}>
          {seccion.grupo === 'Vinos' ? `+ Agregar un vino a ${seccion.titulo}` : `+ Agregar a ${seccion.titulo}`}
        </button>
      )}
    </section>
  );
}

// Una bodega en una sección de vinos: su región, subirla o bajarla entera, y sus vinos
function Bodega({ seccion, bodega, primera, ultima, alCambiar }) {
  const [region, setRegion] = useState(bodega.region ?? '');
  const [errorRegion, setErrorRegion] = useState('');
  const [errorApi, setErrorApi] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const id = `bodega-${seccion.idSeccion}-${bodega.bodega}`.replace(/\s+/g, '-');

  const hacer = async (datos) => {
    setOcupado(true);
    setErrorApi('');
    try {
      await editarBodega(seccion.idSeccion, { bodega: bodega.bodega, ...datos });
      await alCambiar();
    } catch (e) {
      setErrorApi(e.message);
    } finally {
      setOcupado(false);
    }
  };

  const guardarRegion = (evento) => {
    evento.preventDefault();
    const mensaje = validarTexto(region, LIMITES_CARTA.bodega);
    setErrorRegion(mensaje);
    if (mensaje) return document.getElementById(`${id}-region`)?.focus();
    hacer({ region: region.trim() || null });
  };

  return (
    <div className={estilos.bodega}>
      <div className={estilos.cabeceraBodega}>
        <h3 className={estilos.nombreBodega}>{bodega.bodega}</h3>
        <button type="button" className={estilos.accion} disabled={ocupado || primera} onClick={() => hacer({ mover: 'arriba' })}>
          Subir bodega<span className="visualmente-oculto"> {bodega.bodega}</span>
        </button>
        <button type="button" className={estilos.accion} disabled={ocupado || ultima} onClick={() => hacer({ mover: 'abajo' })}>
          Bajar bodega<span className="visualmente-oculto"> {bodega.bodega}</span>
        </button>
      </div>

      <form className={estilos.formRegion} onSubmit={guardarRegion} noValidate>
        <Campo id={`${id}-region`} etiqueta="Región" opcional error={errorRegion}>
          {(props) => (
            <input
              {...props}
              className={formulario.control}
              value={region}
              maxLength={LIMITES_CARTA.bodega}
              onChange={(e) => setRegion(e.target.value)}
              onBlur={() => setErrorRegion(validarTexto(region, LIMITES_CARTA.bodega))}
            />
          )}
        </Campo>
        <Boton type="submit" variante="contorno" disabled={ocupado || region === (bodega.region ?? '')}>
          Guardar región
        </Boton>
      </form>
      {errorApi && <p role="alert" className={estilos.error}>{errorApi}</p>}

      <ul className={estilos.items}>
        {bodega.vinos.map((vino, i) => (
          <li key={vino.id}>
            <EditorItemCarta
              seccion={seccion}
              item={vino}
              primero={i === 0}
              ultimo={i === bodega.vinos.length - 1}
              alCambiar={alCambiar}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cubierto({ local, cubierto, alCambiar }) {
  const [valor, setValor] = useState(cubierto != null ? String(cubierto) : '');
  const [errorCampo, setErrorCampo] = useState('');
  const [errorApi, setErrorApi] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const guardar = async (evento) => {
    evento.preventDefault();
    const mensaje = validarPrecio(valor);
    setErrorCampo(mensaje);
    if (mensaje) return document.getElementById('cubierto')?.focus();
    setOcupado(true);
    setErrorApi('');
    try {
      await cambiarCubierto(local.id, aEntero(valor));
      await alCambiar();
    } catch (e) {
      setErrorApi(e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form className={estilos.formRegion} onSubmit={guardar} noValidate>
      <Campo id="cubierto" etiqueta={`Cubierto de ${local.nombre}`} error={errorCampo}>
        {(props) => (
          <input
            {...props}
            className={formulario.control}
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => setErrorCampo(validarPrecio(valor))}
          />
        )}
      </Campo>
      <Boton type="submit" variante="contorno" disabled={ocupado || valor === String(cubierto ?? '')}>
        Guardar cubierto
      </Boton>
      {errorApi && <p role="alert" className={estilos.error}>{errorApi}</p>}
    </form>
  );
}

export default function AdminCarta() {
  return (
    <main className={estilos.main}>
      <Section>
        <Suspense fallback={null}>
          <RequiereSesion admin>
            <EditorCarta />
          </RequiereSesion>
        </Suspense>
      </Section>
    </main>
  );
}
