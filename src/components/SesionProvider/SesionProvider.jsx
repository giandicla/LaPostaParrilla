'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { backendDisponible } from '../../servicios/config.js';

// supabase-js se importa después de pintar la página, no en el primer JS: en
// las páginas públicas (inicio, carta, nosotros) solo hace falta para saber si
// hay sesión, y pesaba ~245 KB en la carga inicial.
const cargarAuth = () => import('../../servicios/auth.js');

// La sesión del usuario, disponible en todo el sitio con useSesion().
//
//   sesion        objeto de Supabase Auth, o null
//   perfil        { id, nombre, telefono, rol }, o null
//   cargando      true hasta saber si hay sesión (evita parpadeos)
//   esAdmin       atajo para perfil.rol === 'admin'
//   recargarPerfil()  después de editar nombre o teléfono
//
// Que esAdmin sea true solo cambia qué se muestra. Lo que el usuario puede
// leer o modificar lo decide la RLS en la base, no este componente.
const ContextoSesion = createContext(null);

export default function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(backendDisponible);

  const cargarPerfil = useCallback(async (nuevaSesion) => {
    if (!nuevaSesion) {
      setPerfil(null);
      return;
    }
    try {
      const { obtenerPerfil } = await cargarAuth();
      setPerfil(await obtenerPerfil(nuevaSesion.user.id));
    } catch {
      setPerfil(null);
    }
  }, []);

  useEffect(() => {
    if (!backendDisponible) return undefined;

    // onAuthStateChange avisa enseguida con la sesión guardada (INITIAL_SESSION)
    // y después con cada ingreso, salida o renovación del token.
    let dejarDeEscuchar = null;
    let vigente = true;
    cargarAuth().then(({ escucharSesion }) => {
      if (!vigente) return;
      dejarDeEscuchar = escucharSesion((_evento, nuevaSesion) => {
        setSesion(nuevaSesion);
        // Fuera del callback: Supabase recomienda no esperar otras llamadas adentro
        setTimeout(async () => {
          await cargarPerfil(nuevaSesion);
          setCargando(false);
        }, 0);
      });
    });
    return () => {
      vigente = false;
      dejarDeEscuchar?.();
    };
  }, [cargarPerfil]);

  const valor = {
    sesion,
    perfil,
    cargando,
    esAdmin: perfil?.rol === 'admin',
    recargarPerfil: () => cargarPerfil(sesion),
  };

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export function useSesion() {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error('useSesion() tiene que usarse dentro de <SesionProvider>');
  return contexto;
}
