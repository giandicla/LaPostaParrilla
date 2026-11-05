'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '../../../src/components/Hero/Hero.jsx';
import Section from '../../../src/components/Section/Section.jsx';
import Boton from '../../../src/components/Boton/Boton.jsx';
import Campo from '../../../src/components/Campo/Campo.jsx';
import RequiereSesion from '../../../src/components/RequiereSesion/RequiereSesion.jsx';
import { cambiarContrasena } from '../../../src/servicios/auth.js';
import { LIMITES_CUENTA, errorDelLink, validarCuenta } from '../../../src/validacion/cuenta.js';
import formulario from '../../../src/styles/formulario.module.css';
import estilos from '../page.module.css';

const CAMPOS = ['contrasena', 'repetida'];

// A esta página lleva el link del mail de "Olvidé mi contraseña": el link abre
// la sesión, y acá se elige la contraseña nueva.
function ContrasenaNueva() {
  const router = useRouter();
  const [errores, setErrores] = useState({});
  const [errorBase, setErrorBase] = useState('');
  const [guardando, setGuardando] = useState(false);

  const alEnviar = async (evento) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const nuevos = validarCuenta(datos, { modo: 'nueva' });
    setErrores(nuevos);
    setErrorBase('');
    const primero = CAMPOS.find((campo) => nuevos[campo]);
    if (primero) {
      evento.currentTarget.elements[primero].focus();
      return;
    }
    setGuardando(true);
    try {
      await cambiarContrasena(datos.contrasena);
      router.replace('/mis-reservas');
    } catch (e) {
      setErrorBase(e.message);
      setGuardando(false);
    }
  };

  return (
    <form className={`${estilos.tarjeta} ${estilos.formulario}`} onSubmit={alEnviar} noValidate>
      <h2 className={estilos.titulo}>Contraseña nueva</h2>
      <Campo id="nueva-contrasena" etiqueta="Contraseña nueva" error={errores.contrasena}
        ayuda={`Al menos ${LIMITES_CUENTA.contrasena.min} caracteres.`}>
        {(props) => (
          <input {...props} name="contrasena" type="password" autoComplete="new-password"
            maxLength={LIMITES_CUENTA.contrasena.max} className={formulario.control} />
        )}
      </Campo>
      <Campo id="nueva-repetida" etiqueta="Repetila" error={errores.repetida}>
        {(props) => (
          <input {...props} name="repetida" type="password" autoComplete="new-password"
            maxLength={LIMITES_CUENTA.contrasena.max} className={formulario.control} />
        )}
      </Campo>
      {errorBase && <p className={formulario.error} role="alert">{errorBase}</p>}
      <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
    </form>
  );
}

// Sin sesión, o con el error del link en la URL: venció, ya se usó o se abrió
// en otro navegador. Con una sesión ya abierta (la de antes), Supabase la
// conserva aunque el link falle: sin mirar la URL se mostraría el formulario.
const LinkVencido = (
  <div className={estilos.tarjeta}>
    <h2 className={estilos.titulo}>El link venció</h2>
    <p className={estilos.bajada}>
      El link venció o ya se usó. Pedí uno nuevo desde Ingresar → Olvidé mi contraseña.
    </p>
    <Boton to="/ingresar">Ir a Ingresar</Boton>
  </div>
);

export default function Contrasena() {
  // Se lee una sola vez, al cargar: supabase-js no borra el error de la URL.
  // En el servidor no hay URL; no cambia el HTML de la hidratación porque
  // RequiereSesion muestra "Cargando…" hasta tener la sesión.
  const [linkFallido] = useState(() => typeof window !== 'undefined' && Boolean(errorDelLink(window.location)));

  return (
    <main>
      <Hero compacto imagen="/img/comunes/entrada-noche.webp" alt="" titulo="Tu cuenta" bajada="Reservas · La Posta" />
      <Section>
        {/* RequiereSesion usa useSearchParams: Suspense para que la ruta siga estática */}
        <Suspense fallback={null}>
          <RequiereSesion sinSesion={LinkVencido}>
            {linkFallido ? LinkVencido : <ContrasenaNueva />}
          </RequiereSesion>
        </Suspense>
      </Section>
    </main>
  );
}
