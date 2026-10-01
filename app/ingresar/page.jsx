'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Boton from '../../src/components/Boton/Boton.jsx';
import { useSesion } from '../../src/components/SesionProvider/SesionProvider.jsx';
import { backendDisponible } from '../../src/servicios/supabase.js';
import {
  cambiarClave,
  ingresarConEmail,
  ingresarConGoogle,
  pedirNuevaClave,
  registrarse,
} from '../../src/servicios/auth.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

const MODOS = {
  ingresar: { titulo: 'Ingresar', boton: 'Ingresar' },
  registrarse: { titulo: 'Crear cuenta', boton: 'Crear cuenta' },
  olvide: { titulo: 'Recuperar contraseña', boton: 'Mandarme el link' },
  'nueva-clave': { titulo: 'Nueva contraseña', boton: 'Guardar contraseña' },
};

// Solo se vuelve a rutas internas: un ?volver=https://otro-sitio no se sigue
const destinoSeguro = (volver) => (volver?.startsWith('/') && !volver.startsWith('//') ? volver : '/mis-reservas');

function IngresarContenido() {
  const parametros = useSearchParams();
  const router = useRouter();
  const { sesion, cargando, recuperando, terminarRecuperacion } = useSesion();
  const volver = destinoSeguro(parametros.get('volver'));

  const [modo, setModo] = useState(parametros.get('modo') === 'nueva-clave' ? 'nueva-clave' : 'ingresar');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  // Llegó desde el link del mail de recuperación
  const modoActual = recuperando ? 'nueva-clave' : modo;

  // Con sesión y fuera del flujo de nueva contraseña, no hay nada que hacer acá
  useEffect(() => {
    if (!cargando && sesion && modoActual !== 'nueva-clave') router.replace(volver);
  }, [cargando, sesion, modoActual, volver, router]);

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError('');
    setAviso('');
  };

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    setEnviando(true);
    setError('');
    setAviso('');
    try {
      if (modoActual === 'ingresar') {
        await ingresarConEmail(datos.email, datos.clave);
      } else if (modoActual === 'registrarse') {
        const { necesitaConfirmar } = await registrarse(datos);
        if (necesitaConfirmar) {
          setAviso('¡Listo! Te mandamos un mail para confirmar tu cuenta. Tocá el link y volvé a reservar.');
        }
      } else if (modoActual === 'olvide') {
        await pedirNuevaClave(datos.email);
        setAviso('Si hay una cuenta con ese email, te llega un link para elegir una contraseña nueva.');
      } else {
        await cambiarClave(datos.clave);
        terminarRecuperacion();
        router.replace(volver);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const conGoogle = async () => {
    setError('');
    try {
      await ingresarConGoogle(volver);
    } catch (e) {
      setError(e.message);
    }
  };

  if (!backendDisponible) {
    return <p className={estilos.centrado}>Las cuentas todavía no están disponibles.</p>;
  }

  const { titulo, boton } = MODOS[modoActual];
  const pideEmail = modoActual !== 'nueva-clave';
  const pideClave = modoActual !== 'olvide';

  return (
    <div className={estilos.tarjeta}>
      <h2 className={estilos.titulo}>{titulo}</h2>

      {(modoActual === 'ingresar' || modoActual === 'registrarse') && (
        <>
          <button type="button" className={estilos.google} onClick={conGoogle}>
            <span aria-hidden="true" className={estilos.g}>G</span>
            Continuar con Google
          </button>
          <p className={estilos.separador}><span>o con tu email</span></p>
        </>
      )}

      <form className={estilos.form} onSubmit={alEnviar}>
        {modoActual === 'registrarse' && (
          <div className={formulario.campo}>
            <label className={formulario.etiqueta} htmlFor="nombre">Nombre y apellido</label>
            <input id="nombre" name="nombre" required autoComplete="name" className={formulario.control} />
          </div>
        )}
        {pideEmail && (
          <div className={formulario.campo}>
            <label className={formulario.etiqueta} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={formulario.control} />
          </div>
        )}
        {pideClave && (
          <div className={formulario.campo}>
            <label className={formulario.etiqueta} htmlFor="clave">
              {modoActual === 'nueva-clave' ? 'Contraseña nueva' : 'Contraseña'}
            </label>
            <input
              id="clave"
              name="clave"
              type="password"
              required
              minLength={6}
              autoComplete={modoActual === 'ingresar' ? 'current-password' : 'new-password'}
              className={formulario.control}
            />
            {modoActual !== 'ingresar' && <span className={formulario.ayuda}>Mínimo 6 caracteres.</span>}
          </div>
        )}

        {error && <p className={formulario.error} role="alert">{error}</p>}
        {aviso && <p className={formulario.exito} role="status">{aviso}</p>}

        <Boton type="submit" tamano="lg" disabled={enviando}>
          {enviando ? 'Un momento…' : boton}
        </Boton>
      </form>

      <div className={estilos.enlaces}>
        {modoActual === 'ingresar' && (
          <>
            <button type="button" onClick={() => cambiarModo('registrarse')}>¿No tenés cuenta? Creala</button>
            <button type="button" onClick={() => cambiarModo('olvide')}>Olvidé mi contraseña</button>
          </>
        )}
        {(modoActual === 'registrarse' || modoActual === 'olvide') && (
          <button type="button" onClick={() => cambiarModo('ingresar')}>Ya tengo cuenta: ingresar</button>
        )}
      </div>
    </div>
  );
}

export default function Ingresar() {
  return (
    <main>
      <Hero compacto imagen="/img/comunes/entrada-noche.webp" alt="" titulo="Tu cuenta" bajada="Reservas · La Posta" />
      <Section>
        {/* useSearchParams exige Suspense para que la ruta siga siendo estática */}
        <Suspense fallback={null}>
          <IngresarContenido />
        </Suspense>
      </Section>
    </main>
  );
}
