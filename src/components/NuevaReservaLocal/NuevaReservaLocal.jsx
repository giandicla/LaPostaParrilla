'use client';

import { useEffect, useMemo, useState } from 'react';
import Boton from '../Boton/Boton.jsx';
import Campo from '../Campo/Campo.jsx';
import { LOCALES, getLocal } from '../../data/locales.js';
import { faltaParaReserva, formatearFecha, hoyEnArgentina, obtenerDiasBloqueados, obtenerFranjas } from '../../servicios/reservas.js';
import { crearReservaLocal } from '../../servicios/admin.js';
import { LIMITES, hayErrores, limpiarTelefono, validarReserva } from '../../validacion/reservas.js';
import formulario from '../../styles/formulario.module.css';
import estilos from './NuevaReservaLocal.module.css';

const MAXIMO_PERSONAS = LIMITES.personas.maxLocal;
// Orden de los campos en pantalla: al guardar con errores, el foco va al primero
const CAMPOS = ['fecha', 'hora', 'personas', 'nombre', 'telefono', 'mail', 'comentarios'];

// Formulario del panel para cargar una reserva que tomó el local (teléfono,
// WhatsApp, en la puerta). Queda confirmada y sin cuenta de cliente; el mail
// es opcional y solo sirve para mandarle la confirmación.
// alGuardar(mensaje) avisa al panel; la lista se actualiza sola por tiempo real.
export default function NuevaReservaLocal({ idLocalInicial, alGuardar, alCerrar }) {
  const [idLocal, setIdLocal] = useState(idLocalInicial);
  const [valores, setValores] = useState({
    fecha: '',
    hora: '',
    personas: '2',
    nombre: '',
    telefono: '',
    mail: '',
    comentarios: '',
  });
  const [tocados, setTocados] = useState({});
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [franjas, setFranjas] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const local = getLocal(idLocal);
  const hoy = hoyEnArgentina();
  const { fecha } = valores;

  useEffect(() => {
    let vigente = true;
    obtenerFranjas(idLocal).then((f) => vigente && setFranjas(f)).catch((e) => setError(e.message));
    return () => {
      vigente = false;
    };
  }, [idLocal]);

  useEffect(() => {
    let vigente = true;
    obtenerDiasBloqueados(hoy)
      .then((lista) => vigente && setBloqueos(lista))
      .catch(() => vigente && setBloqueos([]));
    return () => {
      vigente = false;
    };
  }, [hoy]);

  // Si es hoy, solo los horarios que todavía no pasaron
  const franjasDisponibles = useMemo(
    () => franjas.filter((h) => !fecha || faltaParaReserva({ fecha, hora: h }) > 0),
    [franjas, fecha]
  );
  const bloqueo = bloqueos.find((b) => b.fecha === fecha && (!b.local_id || b.local_id === idLocal));

  const errores = validarReserva(valores, {
    hoy,
    franjas: franjasDisponibles,
    bloqueo,
    nombreLocal: local.nombre,
    maxPersonas: MAXIMO_PERSONAS,
  });
  const errorVisible = (campo) => (tocados[campo] || intentoEnviar ? errores[campo] : undefined);

  const cambiar = (campo, valor) => setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
  const alSalir = (campo) => () => setTocados((anteriores) => ({ ...anteriores, [campo]: true }));
  const alEscribir = (campo) => (evento) => cambiar(campo, evento.target.value);

  const alEnviar = async (evento) => {
    evento.preventDefault();
    setIntentoEnviar(true);
    setError('');
    if (hayErrores(errores)) {
      document.getElementById(`nueva-${CAMPOS.find((campo) => errores[campo])}`)?.focus();
      return;
    }

    const mail = valores.mail.trim();
    setGuardando(true);
    try {
      await crearReservaLocal({
        local_id: idLocal,
        fecha,
        hora: valores.hora,
        personas: Number(valores.personas),
        nombre: valores.nombre.trim(),
        telefono: valores.telefono.trim(),
        mail: mail || null,
        comentarios: valores.comentarios.trim() || null,
      });
      const personas = Number(valores.personas);
      alGuardar(
        `Reserva guardada y confirmada: ${valores.nombre.trim()}, ${formatearFecha(fecha, { conAnio: true })} ` +
          `a las ${valores.hora}, ${personas} ${personas === 1 ? 'persona' : 'personas'}, ${getLocal(idLocal)?.nombre}.` +
          (mail ? ` Le avisamos por mail a ${mail}.` : '')
      );
    } catch (e) {
      setError(e.message);
      setGuardando(false);
    }
  };

  return (
    <form className={estilos.formulario} onSubmit={alEnviar} noValidate aria-labelledby="titulo-nueva">
      <h2 id="titulo-nueva" className={estilos.titulo}>Nueva reserva</h2>
      <p className={formulario.ayuda}>
        Para las que toma el local: queda confirmada y no necesita cuenta. Hasta {MAXIMO_PERSONAS} personas.
      </p>

      <div className={estilos.grilla}>
        <div className={formulario.campo}>
          <label className={formulario.etiqueta} htmlFor="nueva-local">Salón</label>
          <select
            id="nueva-local"
            value={idLocal}
            onChange={(e) => {
              setIdLocal(e.target.value);
              cambiar('hora', ''); // las franjas dependen del local
            }}
            className={formulario.control}
          >
            {LOCALES.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
        </div>

        {/* Un día bloqueado se avisa apenas se elige, sin esperar a salir del campo */}
        <Campo id="nueva-fecha" etiqueta="Fecha" error={errorVisible('fecha') ?? (bloqueo ? errores.fecha : undefined)}>
          {(props) => (
            <input
              {...props}
              type="date"
              min={hoy}
              value={fecha}
              onChange={(e) => {
                cambiar('fecha', e.target.value);
                cambiar('hora', '');
              }}
              onBlur={alSalir('fecha')}
              className={formulario.control}
            />
          )}
        </Campo>

        <Campo id="nueva-hora" etiqueta="Hora" error={errorVisible('hora')}>
          {(props) => (
            <select
              {...props}
              value={valores.hora}
              onChange={alEscribir('hora')}
              onBlur={alSalir('hora')}
              className={formulario.control}
            >
              <option value="" disabled>
                {franjasDisponibles.length ? 'Elegí' : 'Sin horarios'}
              </option>
              {franjasDisponibles.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          )}
        </Campo>

        <Campo id="nueva-personas" etiqueta="Personas" error={errorVisible('personas')}>
          {(props) => (
            <input
              {...props}
              type="number"
              min="1"
              max={MAXIMO_PERSONAS}
              inputMode="numeric"
              value={valores.personas}
              onChange={alEscribir('personas')}
              onBlur={alSalir('personas')}
              className={formulario.control}
            />
          )}
        </Campo>

        <Campo id="nueva-nombre" etiqueta="A nombre de" error={errorVisible('nombre')}>
          {(props) => (
            <input
              {...props}
              maxLength={LIMITES.nombre.max}
              value={valores.nombre}
              onChange={alEscribir('nombre')}
              onBlur={alSalir('nombre')}
              className={formulario.control}
            />
          )}
        </Campo>

        <Campo id="nueva-telefono" etiqueta="Teléfono" error={errorVisible('telefono')}>
          {(props) => (
            <input
              {...props}
              type="tel"
              inputMode="tel"
              value={valores.telefono}
              onChange={(e) => cambiar('telefono', limpiarTelefono(e.target.value))}
              onBlur={alSalir('telefono')}
              className={formulario.control}
            />
          )}
        </Campo>

        <Campo
          id="nueva-mail"
          etiqueta="Mail del cliente"
          opcional
          error={errorVisible('mail')}
          ayuda="Si lo cargás, le llega la confirmación."
        >
          {(props) => (
            <input
              {...props}
              type="email"
              autoComplete="off"
              maxLength={LIMITES.mail}
              value={valores.mail}
              onChange={alEscribir('mail')}
              onBlur={alSalir('mail')}
              className={formulario.control}
            />
          )}
        </Campo>
      </div>

      <Campo id="nueva-comentarios" etiqueta="Comentarios" opcional error={errorVisible('comentarios')}>
        {(props) => (
          <textarea
            {...props}
            rows="2"
            maxLength={LIMITES.comentarios}
            value={valores.comentarios}
            onChange={alEscribir('comentarios')}
            onBlur={alSalir('comentarios')}
            className={formulario.control}
          />
        )}
      </Campo>

      {error && <p className={formulario.error} role="alert">{error}</p>}

      <div className={estilos.acciones}>
        <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar reserva'}</Boton>
        <Boton variante="texto" onClick={alCerrar}>Cancelar</Boton>
      </div>
    </form>
  );
}
