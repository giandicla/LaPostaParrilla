'use client';

import { useEffect, useImperativeHandle, useRef } from 'react';
import estilos from './Captcha.module.css';

// Cloudflare Turnstile: el "no soy un robot" de los formularios con mail.
// Supabase Auth lo exige al crear la cuenta, al ingresar con contraseña y al
// pedir una contraseña nueva (bloque [auth.captcha] de supabase/config.toml).
// Casi siempre pasa solo, sin que el usuario toque nada.
//
// La clave del sitio es pública. En la computadora (localhost) va la de prueba
// de Cloudflare, que siempre pasa y combina con el secreto de prueba de la base
// local. En producción, la del widget "La Posta" de Turnstile.
const CLAVE_PRODUCCION = '0x4AAAAAAF4OC6ECKl1smnW7';
const CLAVE_PRUEBA = '1x00000000000000000000AA';
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const claveDelSitio = () =>
  ['localhost', '127.0.0.1'].includes(window.location.hostname) ? CLAVE_PRUEBA : CLAVE_PRODUCCION;

// El script se carga una sola vez para todo el sitio
let cargando;
function cargarTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  cargando ??= new Promise((resolver, rechazar) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => resolver(window.turnstile);
    script.onerror = () => {
      cargando = undefined;
      rechazar(new Error('No se pudo cargar la verificación'));
    };
    document.head.appendChild(script);
  });
  return cargando;
}

// alCambiar(token | ''): el token de un uso que hay que mandarle a Supabase.
// Con ref.current.reiniciar() se pide uno nuevo (después de cada intento).
export default function Captcha({ alCambiar, ref }) {
  const contenedor = useRef(null);
  const widget = useRef(null);
  const alCambiarRef = useRef(alCambiar);
  useEffect(() => {
    alCambiarRef.current = alCambiar;
  }, [alCambiar]);

  useImperativeHandle(ref, () => ({
    reiniciar: () => {
      alCambiarRef.current('');
      if (widget.current != null) window.turnstile?.reset(widget.current);
    },
  }), []);

  useEffect(() => {
    let vigente = true;
    cargarTurnstile()
      .then((turnstile) => {
        if (!vigente || !contenedor.current) return;
        widget.current = turnstile.render(contenedor.current, {
          sitekey: claveDelSitio(),
          language: 'es',
          theme: 'light',
          callback: (token) => alCambiarRef.current(token),
          'expired-callback': () => alCambiarRef.current(''),
          'error-callback': () => alCambiarRef.current(''),
        });
      })
      .catch(() => alCambiarRef.current(''));
    return () => {
      vigente = false;
      if (widget.current != null) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  return <div ref={contenedor} className={estilos.captcha} />;
}
