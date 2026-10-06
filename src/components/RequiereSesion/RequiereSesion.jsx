'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Boton from '../Boton/Boton.jsx';
import { useSesion } from '../SesionProvider/SesionProvider.jsx';
import { backendDisponible } from '../../servicios/supabase.js';
import estilos from './RequiereSesion.module.css';

// Muestra `children` solo si hay sesión (y, con `admin`, si además es admin).
// Si no, explica por qué y ofrece el camino: ingresar o volver.
//
// Es comodidad, no seguridad: aunque alguien se saltee este componente, la
// RLS de la base no le devuelve datos que no le corresponden.
export default function RequiereSesion({ admin = false, mensaje, children }) {
  const { sesion, cargando, esAdmin } = useSesion();
  const ruta = usePathname();
  const parametros = useSearchParams();

  if (!backendDisponible) {
    return (
      <Aviso titulo="Todavía no disponible">
        Las reservas online no están activas en este momento. Escribinos por WhatsApp.
      </Aviso>
    );
  }

  if (cargando) {
    return <p className={estilos.cargando} role="status">Cargando…</p>;
  }

  if (!sesion) {
    const query = parametros.toString();
    const volver = encodeURIComponent(query ? `${ruta}?${query}` : ruta);
    return (
      <Aviso titulo="Ingresá para continuar">
        {mensaje ?? 'Necesitás una cuenta para ver esta sección.'}
        <Boton to={`/ingresar?volver=${volver}`} tamano="lg">
          Ingresar con Google
        </Boton>
      </Aviso>
    );
  }

  if (admin && !esAdmin) {
    return (
      <Aviso titulo="Sección para el equipo de La Posta">
        Tu cuenta no tiene permisos de administración.
        <Boton to="/" variante="texto">Volver al inicio</Boton>
      </Aviso>
    );
  }

  return children;
}

function Aviso({ titulo, children }) {
  return (
    <div className={estilos.aviso}>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <div className={estilos.cuerpo}>{children}</div>
    </div>
  );
}
