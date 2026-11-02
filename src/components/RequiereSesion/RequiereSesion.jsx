'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Boton from '../Boton/Boton.jsx';
import { useSesion } from '../SesionProvider/SesionProvider.jsx';
import { backendDisponible } from '../../servicios/config.js';
import estilos from './RequiereSesion.module.css';

// Muestra `children` solo si hay sesión (y, con `admin`, si además es admin).
// Si no, explica por qué y ofrece el camino: ingresar o volver.
//
// soloClientes: páginas del cliente (reservar, mis reservas). El admin
// gestiona todo desde el panel, así que se lo lleva ahí, con la misma query
// (?local=… deja elegido el salón en "Nueva reserva").
// sinSesion: reemplaza el aviso de "Ingresá para continuar" en una página
// que quiere mostrar otra cosa.
//
// Es comodidad, no seguridad: aunque alguien se saltee este componente, la
// RLS de la base no le devuelve datos que no le corresponden.
export default function RequiereSesion({ admin = false, soloClientes = false, mensaje, sinSesion, children }) {
  const { sesion, cargando, esAdmin } = useSesion();
  const ruta = usePathname();
  const parametros = useSearchParams();
  const router = useRouter();
  const query = parametros.toString();
  const alPanel = soloClientes && !cargando && esAdmin;

  useEffect(() => {
    if (alPanel) router.replace(query ? `/admin?${query}` : '/admin');
  }, [alPanel, query, router]);

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
    if (sinSesion) return sinSesion;
    const volver = encodeURIComponent(query ? `${ruta}?${query}` : ruta);
    return (
      <Aviso titulo="Ingresá para continuar">
        {mensaje ?? 'Necesitás una cuenta para ver esta sección.'}
        <Boton to={`/ingresar?volver=${volver}`} tamano="lg">
          Ingresar
        </Boton>
      </Aviso>
    );
  }

  if (alPanel) {
    return <p className={estilos.cargando} role="status">Te llevamos al panel…</p>;
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
