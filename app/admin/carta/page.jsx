'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Section from '../../../src/components/Section/Section.jsx';
import Boton from '../../../src/components/Boton/Boton.jsx';
import Campo from '../../../src/components/Campo/Campo.jsx';
import RequiereSesion from '../../../src/components/RequiereSesion/RequiereSesion.jsx';
import PestanasAdmin from '../../../src/components/PestanasAdmin/PestanasAdmin.jsx';
import SelectorLocal from '../../../src/components/SelectorLocal/SelectorLocal.jsx';
import CajaCarta from '../../../src/components/CajaCarta/CajaCarta.jsx';
import ListaCarta from '../../../src/components/ListaCarta/ListaCarta.jsx';
import formulario from '../../../src/styles/formulario.module.css';
import { LOCALES, esIdDeLocal, getLocal, ID_LOCAL_POR_DEFECTO } from '../../../src/data/locales.js';
import { CARTA_VINOS } from '../../../src/data/carta.js';
import { cambiarCubierto, leerCarta, leerVinos } from '../../../src/servicios/carta.js';
import { aEntero, validarPrecio } from '../../../src/validacion/carta.js';
import estilos from './page.module.css';

// Las tres cartas, con los vinos (compartidos) en el medio, como en /carta
const VISTAS = [LOCALES[0], CARTA_VINOS, ...LOCALES.slice(1)];

// La carta en el panel: una caja arriba (agregar, o editar lo que se elige) y la
// carta abajo, con ⠿ para cambiar de lugar, Editar y Eliminar.
function EditorCarta() {
  const parametros = useSearchParams();
  const router = useRouter();
  const pedida = parametros.get('vista');
  const esVinos = pedida === CARTA_VINOS.id;
  const vista = esVinos || esIdDeLocal(pedida) ? pedida : ID_LOCAL_POR_DEFECTO;

  // Guardada con su vista, para no mostrar la de otra mientras llega la nueva
  const [pedido, setPedido] = useState({ vista: null, carta: null, error: '' });
  const cargar = useCallback(
    () =>
      (esVinos ? leerVinos({ fresca: true }) : leerCarta(vista, { fresca: true }))
        .then((carta) => setPedido({ vista, carta, error: '' }))
        .catch((e) => setPedido({ vista, carta: null, error: e.message })),
    [vista, esVinos]
  );
  useEffect(() => {
    cargar();
  }, [cargar]);
  const carta = pedido.vista === vista ? pedido.carta : null;
  const error = pedido.vista === vista ? pedido.error : '';

  // Lo que está en la caja ({ item, seccion, bodega? }) y el último aviso
  const [edicion, setEdicion] = useState(null);
  const [aviso, setAviso] = useState('');
  // Cada vez que la caja termina (agregó, guardó o canceló) vuelve a armarse vacía
  const [vuelta, setVuelta] = useState(0);
  const caja = useRef(null);

  const editar = (elegido) => {
    setEdicion(elegido);
    setAviso('');
    caja.current?.scrollIntoView({ block: 'start' });
    // El foco va al primer campo, para seguir con el teclado
    requestAnimationFrame(() => document.getElementById('caja-nombre')?.focus());
  };

  const cambiarVista = (id) => {
    setEdicion(null);
    setAviso('');
    router.replace(`/admin/carta?vista=${id}`, { scroll: false });
  };

  return (
    <div className={estilos.panel}>
      <PestanasAdmin />

      <h1 className={estilos.titulo}>Carta</h1>

      <SelectorLocal locales={VISTAS} localActivoId={vista} onChange={cambiarVista} />

      {esVinos && (
        <p className={formulario.ayuda}>Los vinos y las copas son los mismos en los dos locales: se editan una sola vez.</p>
      )}

      {error && <p role="alert" className={estilos.error}>{error}</p>}
      {!carta && !error && <p role="status">Cargando…</p>}

      {carta && !esVinos && (
        <Cubierto key={`${vista}-${carta.cubierto}`} local={getLocal(vista)} cubierto={carta.cubierto} alCambiar={cargar} />
      )}

      <p role="status" className={estilos.aviso}>{aviso}</p>

      {carta && (
        <>
          <div ref={caja}>
            <CajaCarta
              key={`${vista}-${edicion?.item.id ?? 'nuevo'}-${vuelta}`}
              carta={carta}
              esVinos={esVinos}
              edicion={edicion}
              alElegir={editar}
              alTerminar={(mensaje) => {
                setEdicion(null);
                setVuelta((n) => n + 1);
                setAviso(mensaje ?? '');
              }}
              alCambiar={cargar}
            />
          </div>

          <ListaCarta
            carta={carta}
            idEditando={edicion?.item.id}
            alEditar={editar}
            alCambiar={cargar}
            alError={setAviso}
            alAviso={setAviso}
          />
        </>
      )}
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
    <form className={estilos.cubierto} onSubmit={guardar} noValidate>
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
      <Boton type="submit" variante="secundario" disabled={ocupado || aEntero(valor) === cubierto}>
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
