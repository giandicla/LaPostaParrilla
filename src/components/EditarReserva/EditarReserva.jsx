'use client';

import { useEffect, useRef, useState } from 'react';
import Boton from '../Boton/Boton.jsx';
import Campo from '../Campo/Campo.jsx';
import { hoyEnArgentina } from '../../servicios/reservas.js';
import { editarReserva } from '../../servicios/admin.js';
import { LIMITES, limpiarTelefono, validarReserva } from '../../validacion/reservas.js';
import formulario from '../../styles/formulario.module.css';
import estilos from './EditarReserva.module.css';

// Orden de los campos en pantalla: al guardar con errores, el foco va al primero
const CAMPOS = ['fecha', 'hora', 'personas', 'nombre', 'telefono', 'mail', 'comentarios'];

// Formulario del panel para corregir una reserva: fecha, hora, personas y los
// datos de contacto. El mail se edita solo en las del local (las de la web
// usan el de la cuenta). Las reglas finales las pone la base; acá se valida
// para avisar antes. franjas: los horarios de reserva del local.
export default function EditarReserva({ reserva, franjas, avisaPorMail, alGuardar, alCerrar }) {
  const [errores, setErrores] = useState({});
  const [errorBase, setErrorBase] = useState('');
  const [guardando, setGuardando] = useState(false);
  const formRef = useRef(null);
  const prefijo = `editar-${reserva.id}`;
  const delLocal = reserva.origen === 'local';
  const maxPersonas = delLocal ? LIMITES.personas.maxLocal : LIMITES.personas.max;

  // Al abrirse, el foco va al primer campo
  useEffect(() => {
    formRef.current?.elements.fecha.focus();
  }, []);

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const nuevos = validarReserva(datos, { hoy: hoyEnArgentina(), franjas, maxPersonas });
    setErrores(nuevos);
    setErrorBase('');
    const primero = CAMPOS.find((campo) => nuevos[campo]);
    if (primero) {
      evento.currentTarget.elements[primero].focus();
      return;
    }

    setGuardando(true);
    try {
      await editarReserva(reserva.id, {
        fecha: datos.fecha,
        hora: datos.hora,
        personas: Number(datos.personas),
        nombre: datos.nombre.trim(),
        telefono: datos.telefono.trim(),
        comentarios: datos.comentarios.trim() || null,
        ...(delLocal && { mail: datos.mail.trim() || null }),
      });
      alGuardar();
    } catch (e) {
      setErrorBase(e.message);
      setGuardando(false);
    }
  };

  return (
    <form ref={formRef} className={estilos.formulario} onSubmit={alEnviar} noValidate aria-label={`Editar la reserva de ${reserva.nombre}`}>
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
              min={LIMITES.personas.min} max={maxPersonas}
              defaultValue={reserva.personas} className={formulario.control} />
          )}
        </Campo>
        <Campo id={`${prefijo}-nombre`} etiqueta="A nombre de" error={errores.nombre}>
          {(props) => (
            <input {...props} name="nombre" required maxLength={LIMITES.nombre.max}
              defaultValue={reserva.nombre} className={formulario.control} />
          )}
        </Campo>
        <Campo id={`${prefijo}-telefono`} etiqueta="Teléfono" error={errores.telefono}>
          {(props) => (
            <input {...props} name="telefono" type="tel" inputMode="tel" required
              defaultValue={reserva.telefono}
              onChange={(e) => {
                e.target.value = limpiarTelefono(e.target.value);
              }}
              className={formulario.control} />
          )}
        </Campo>
        {delLocal && (
          <Campo id={`${prefijo}-mail`} etiqueta="Mail del cliente" opcional error={errores.mail}>
            {(props) => (
              <input {...props} name="mail" type="email" autoComplete="off" maxLength={LIMITES.mail}
                defaultValue={reserva.mail ?? ''} className={formulario.control} />
            )}
          </Campo>
        )}
      </div>
      <Campo id={`${prefijo}-comentarios`} etiqueta="Comentarios" opcional error={errores.comentarios}>
        {(props) => (
          <textarea {...props} name="comentarios" rows="2" maxLength={LIMITES.comentarios}
            defaultValue={reserva.comentarios ?? ''} className={formulario.control} />
        )}
      </Campo>
      {errorBase && <p className={formulario.error} role="alert">{errorBase}</p>}
      {avisaPorMail && (
        <p className={formulario.ayuda}>Si cambiás la fecha o la hora, le avisamos al cliente por mail.</p>
      )}
      <div className={estilos.acciones}>
        <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Boton>
        <Boton variante="texto" onClick={alCerrar}>No cambiar</Boton>
      </div>
    </form>
  );
}
