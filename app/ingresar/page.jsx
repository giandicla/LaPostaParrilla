'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Hero from '../../src/components/Hero/Hero.jsx';
import Section from '../../src/components/Section/Section.jsx';
import Icono from '../../src/components/Icono/Icono.jsx';
import PestanasCuenta from '../../src/components/PestanasCuenta/PestanasCuenta.jsx';
import FormularioCuenta from '../../src/components/FormularioCuenta/FormularioCuenta.jsx';
import { useSesion } from '../../src/components/SesionProvider/SesionProvider.jsx';
import { backendDisponible } from '../../src/servicios/config.js';
import { ingresarConGoogle } from '../../src/servicios/auth.js';
import { destinoSeguro } from '../../src/validacion/destino.js';
import formulario from '../../src/styles/formulario.module.css';
import estilos from './page.module.css';

const PESTANAS = [
  { id: 'ingresar', etiqueta: 'Ingresar' },
  { id: 'crear', etiqueta: 'Crear cuenta' },
];

// Con Google o con mail y contraseña, en dos pestañas. Con Google, la primera
// vez que alguien entra se le crea la cuenta; con mail, la crea en "Crear
// cuenta" y la confirma desde el mail. El perfil lo crea un trigger en la base.
function IngresarContenido() {
  const parametros = useSearchParams();
  const router = useRouter();
  const { sesion, cargando } = useSesion();
  const volver = destinoSeguro(parametros.get('volver'));
  const [yendo, setYendo] = useState(false);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('ingresar');
  // Dentro de "Ingresar": el formulario de ingreso o el de "Olvidé mi contraseña"
  const [modoIngreso, setModoIngreso] = useState('ingresar');
  const modo = pestana === 'crear' ? 'crear' : modoIngreso;
  // Al pasar a "Olvidé" (o volver) desaparece el botón que se tocó: el foco va
  // al mail del formulario nuevo. Al cambiar de pestaña se queda en la pestaña.
  const [enfocarFormulario, setEnfocarFormulario] = useState(false);
  const cambiarModo = (nuevo) => {
    setModoIngreso(nuevo);
    setEnfocarFormulario(true);
  };

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
      <h2 className="visualmente-oculto">Tu cuenta</h2>
      <PestanasCuenta
        pestanas={PESTANAS}
        etiqueta="Ingresar o crear cuenta"
        activa={pestana}
        alCambiar={(id) => {
          setPestana(id);
          setModoIngreso('ingresar');
          setEnfocarFormulario(false);
        }}
      >
        <p className={estilos.bajada}>Para reservar y ver o cancelar tus reservas.</p>

        {/* "Olvidé mi contraseña" es solo para cuentas con mail: ahí Google sobra */}
        {modo !== 'olvide' && (
          <>
            <button type="button" className={estilos.google} onClick={conGoogle} disabled={yendo}>
              <Icono nombre="google" className={estilos.logoGoogle} />
              {yendo ? 'Abriendo Google…' : 'Continuar con Google'}
            </button>
            {error && <p className={formulario.error} role="alert">{error}</p>}
            <p className={estilos.separador}>o con tu mail</p>
          </>
        )}

        {/* key: al cambiar de formulario se vacían los campos y los errores */}
        <FormularioCuenta key={modo} modo={modo} volver={volver} alCambiarModo={cambiarModo}
          enfocar={enfocarFormulario} />
      </PestanasCuenta>

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
