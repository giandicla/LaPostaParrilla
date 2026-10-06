'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Icono from '../../src/components/Icono/Icono.jsx';
import { useSesion } from '../../src/components/SesionProvider/SesionProvider.jsx';
import { backendDisponible } from '../../src/servicios/supabase.js';
import { ingresarConGoogle } from '../../src/servicios/auth.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

// Solo se vuelve a rutas internas: un ?volver=https://otro-sitio no se sigue
const destinoSeguro = (volver) =>
  volver?.startsWith('/') && !volver.startsWith('//') ? volver : '/mis-reservas';

// Se ingresa solo con Google: no hay contraseñas que recordar ni mails de
// confirmación que dependan de un servidor de correo. La primera vez que
// alguien entra, se le crea la cuenta (y el perfil, por trigger en la base).
function IngresarContenido() {
  const parametros = useSearchParams();
  const router = useRouter();
  const { sesion, cargando } = useSesion();
  const volver = destinoSeguro(parametros.get('volver'));
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState('');

  // Con sesión no hay nada que hacer acá: de vuelta a donde iba
  useEffect(() => {
    if (!cargando && sesion) router.replace(volver);
  }, [cargando, sesion, volver, router]);

  const conGoogle = async () => {
    setError('');
    setYendo(true);
    try {
      await ingresarConGoogle(volver);
    } catch (e) {
      setError(e.message);
      setYendo(false);
    }
  };

  if (!backendDisponible) {
    return <p className={estilos.centrado}>Las cuentas todavía no están disponibles.</p>;
  }

  return (
    <div className={estilos.tarjeta}>
      <h2 className={estilos.titulo}>Ingresar</h2>
      <p className={estilos.bajada}>
        Con tu cuenta de Google podés reservar y ver o cancelar tus reservas.
      </p>

      <button type="button" className={estilos.google} onClick={conGoogle} disabled={yendo}>
        <Icono nombre="google" className={estilos.logoGoogle} />
        {yendo ? 'Abriendo Google…' : 'Continuar con Google'}
      </button>

      {error && <p className={formulario.error} role="alert">{error}</p>}

      <p className={estilos.letraChica}>
        Solo usamos tu nombre y tu mail para gestionar tus reservas.
      </p>
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
