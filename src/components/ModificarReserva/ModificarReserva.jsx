'use client';

import { useEffect, useRef, useState } from 'react';
import Boton from '../Boton/Boton.jsx';
import Campo from '../Campo/Campo.jsx';
import { hoyEnArgentina, modificarReserva, obtenerFranjas } from '../../servicios/reservas.js';
import { LIMITES, validarFecha, validarHora, validarPersonas } from '../../validacion/reservas.js';
import formulario from '../../styles/formulario.module.css';
import estilos from './ModificarReserva.module.css';

// Cambiar fecha, hora y personas de una reserva propia (mismo local). Las
// reglas finales (franjas, días bloqueados, una por turno, 1 hora antes) las
// pone la base en modificar_reserva(); acá se valida para avisar antes.
export default function ModificarReserva({ reserva, alGuardar, alCerrar }) {
  const [franjas, setFranjas] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorBase, setErrorBase] = useState('');
  const [guardando, setGuardando] = useState(false);
  const formRef = useRef(null);
  const prefijo = `modificar-${reserva.id}`;

  useEffect(() => {
    let vigente = true;
    obtenerFranjas(reserva.local_id)
      .then((lista) => vigente && setFranjas(lista))
      .catch((e) => vigente && setErrorBase(e.message));
    return () => {
      vigente = false;
    };
  }, [reserva.local_id]);

  // Al abrirse, el foco va al primer campo
  useEffect(() => {
    formRef.current?.elements.fecha.focus();
  }, []);

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const nuevos = Object.fromEntries(
      [
        ['fecha', validarFecha(datos.fecha, { hoy: hoyEnArgentina() })],
        ['hora', validarHora(datos.hora, { franjas })],
        ['personas', validarPersonas(datos.personas)],
      ].filter(([, mensaje]) => mensaje)
    );
    setErrores(nuevos);
    setErrorBase('');
    const primero = Object.keys(nuevos)[0];
    if (primero) {
      evento.currentTarget.elements[primero].focus();
      return;
    }

    setGuardando(true);
    try {
      await modificarReserva(reserva.id, datos);
      alGuardar();
    } catch (e) {
      setErrorBase(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form ref={formRef} className={estilos.formulario} onSubmit={alEnviar} noValidate>
      <div className={estilos.campos}>
        <Campo id={`${prefijo}-fecha`} etiqueta="Fecha" error={errores.fecha}>
          {(props) => (
            <input {...props} name="fecha" type="date" required min={hoyEnArgentina()}
              defaultValue={reserva.fecha} className={formulario.control} />
          )}
        </Campo>
        <Campo id={`${prefijo}-hora`} etiqueta="Hora" error={errores.hora}>
          {(props) => (
            <select {...props} name="hora" required defaultValue={reserva.hora.slice(0, 5)} className={formulario.control}>
              {/* Mientras cargan las franjas, la hora actual para que el select no quede vacío */}
              {(franjas.length ? franjas : [reserva.hora.slice(0, 5)]).map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          )}
        </Campo>
        <Campo id={`${prefijo}-personas`} etiqueta="Personas" error={errores.personas}>
          {(props) => (
            <input {...props} name="personas" type="number" required inputMode="numeric"
              min={LIMITES.personas.min} max={LIMITES.personas.max}
              defaultValue={reserva.personas} className={formulario.control} />
          )}
        </Campo>
      </div>
      {errorBase && <p className={formulario.error} role="alert">{errorBase}</p>}
      <p className={formulario.ayuda}>La seña que pagaste sigue valiendo para la reserva modificada.</p>
      <div className={estilos.acciones}>
        <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Boton>
        <Boton variante="texto" onClick={alCerrar}>No cambiar</Boton>
      </div>
    </form>
  );
}
