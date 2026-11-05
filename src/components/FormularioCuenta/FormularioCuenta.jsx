'use client';

import { useEffect, useRef, useState } from 'react';
import Boton from '../Boton/Boton.jsx';
import Campo from '../Campo/Campo.jsx';
import { crearCuenta, ingresarConMail, pedirNuevaContrasena } from '../../servicios/auth.js';
import { LIMITES } from '../../validacion/reservas.js';
import { LIMITES_CUENTA, mensajeTrasCrear, mensajeTrasOlvido, validarCuenta } from '../../validacion/cuenta.js';
import formulario from '../../styles/formulario.module.css';
import estilos from './FormularioCuenta.module.css';

// Orden de los campos en pantalla: al enviar con errores, el foco va al primero
const CAMPOS = ['nombre', 'mail', 'contrasena'];
const BOTON = { ingresar: 'Ingresar', crear: 'Crear cuenta', olvide: 'Mandar el mail' };

// Los formularios de cuenta con mail: ingresar, crear cuenta y olvidé mi
// contraseña. modo: 'ingresar' | 'crear' | 'olvide'. Al ingresar, la página
// redirige sola cuando aparece la sesión. alCambiarModo(modo) para pasar de
// ingresar a "olvidé" y volver. enfocar: al aparecer, el foco va al mail (se
// usa al cambiar de modo, cuando desaparece el botón que se tocó).
export default function FormularioCuenta({ modo, volver, alCambiarModo, enfocar = false }) {
  const [errores, setErrores] = useState({});
  const [errorBase, setErrorBase] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState('');
  const prefijo = `cuenta-${modo}`;
  const formRef = useRef(null);
  const listoRef = useRef(null);

  useEffect(() => {
    if (enfocar) formRef.current?.elements.mail?.focus();
  }, [enfocar]);

  // Al mandar, el formulario se reemplaza por el aviso: el foco va al aviso
  useEffect(() => {
    if (listo) listoRef.current?.focus();
  }, [listo]);

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const nuevos = validarCuenta(datos, { modo });
    setErrores(nuevos);
    setErrorBase('');
    const primero = CAMPOS.find((campo) => nuevos[campo]);
    if (primero) {
      evento.currentTarget.elements[primero].focus();
      return;
    }

    setEnviando(true);
    try {
      if (modo === 'ingresar') {
        await ingresarConMail(datos);
        return; // sigue "Ingresando…" hasta que la página redirige
      }
      if (modo === 'crear') {
        await crearCuenta(datos, volver);
        setListo(mensajeTrasCrear(datos.mail));
      } else {
        await pedirNuevaContrasena(datos.mail);
        setListo(mensajeTrasOlvido(datos.mail));
      }
    } catch (e) {
      setErrorBase(e.message);
    }
    setEnviando(false);
  };

  if (listo) {
    return (
      <div ref={listoRef} tabIndex={-1} className={estilos.listo} role="status">
        <p>{listo}</p>
        {modo === 'olvide' && (
          <Boton variante="texto" onClick={() => alCambiarModo('ingresar')}>Volver a ingresar</Boton>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} className={estilos.formulario} onSubmit={alEnviar} noValidate>
      {modo === 'olvide' && (
        <p className={formulario.ayuda}>Escribí el mail de tu cuenta y te mandamos un link para elegir una contraseña nueva.</p>
      )}
      {modo === 'crear' && (
        <Campo id={`${prefijo}-nombre`} etiqueta="Nombre" error={errores.nombre}>
          {(props) => (
            <input {...props} name="nombre" autoComplete="name" maxLength={LIMITES.nombre.max}
              className={formulario.control} />
          )}
        </Campo>
      )}
      <Campo id={`${prefijo}-mail`} etiqueta="Mail" error={errores.mail}>
        {(props) => (
          <input {...props} name="mail" type="email" inputMode="email" autoComplete="email"
            maxLength={LIMITES.mail} className={formulario.control} />
        )}
      </Campo>
      {modo !== 'olvide' && (
        <Campo id={`${prefijo}-contrasena`} etiqueta="Contraseña" error={errores.contrasena}
          ayuda={modo === 'crear' ? `Al menos ${LIMITES_CUENTA.contrasena.min} caracteres.` : undefined}>
          {(props) => (
            <input {...props} name="contrasena" type="password"
              autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
              maxLength={LIMITES_CUENTA.contrasena.max} className={formulario.control} />
          )}
        </Campo>
      )}

      {errorBase && <p className={formulario.error} role="alert">{errorBase}</p>}

      <Boton type="submit" disabled={enviando}>
        {enviando ? (modo === 'ingresar' ? 'Ingresando…' : 'Enviando…') : BOTON[modo]}
      </Boton>

      {modo === 'ingresar' && (
        <Boton variante="texto" className={estilos.enlace} onClick={() => alCambiarModo('olvide')}>
          Olvidé mi contraseña
        </Boton>
      )}
      {modo === 'olvide' && (
        <Boton variante="texto" className={estilos.enlace} onClick={() => alCambiarModo('ingresar')}>
          Volver
        </Boton>
      )}
    </form>
  );
}
