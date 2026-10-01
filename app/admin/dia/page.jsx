'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Section from '../../../src/components/Section/Section.jsx';
import Boton from '../../../src/components/Boton/Boton.jsx';
import RequiereSesion from '../../../src/components/RequiereSesion/RequiereSesion.jsx';
import { LOCALES, esIdDeLocal } from '../../../src/data/locales.js';
import { formatearFecha, hoyEnArgentina } from '../../../src/servicios/reservas.js';
import { listarReservas } from '../../../src/servicios/admin.js';
import estilos from './page.module.css';

// Lista del día para imprimir y tener en el salón: reservas confirmadas
// (y las pendientes, marcadas, para que no se escapen), agrupadas por local.
function ListaDelDia() {
  const parametros = useSearchParams();
  const fecha = parametros.get('fecha') || hoyEnArgentina();
  const idLocal = esIdDeLocal(parametros.get('local')) ? parametros.get('local') : '';
  const [reservas, setReservas] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listarReservas({ fecha, idLocal })
      .then((lista) => setReservas(lista.filter((r) => ['confirmada', 'pendiente'].includes(r.estado))))
      .catch((e) => setError(e.message));
  }, [fecha, idLocal]);

  if (error) return <p role="alert">{error}</p>;
  if (!reservas) return <p role="status">Cargando…</p>;

  const locales = LOCALES.filter((l) => !idLocal || l.id === idLocal);

  return (
    <div className={estilos.hoja}>
      <div className={estilos.barra}>
        <Boton to="/admin" variante="texto">← Volver al panel</Boton>
        <Boton onClick={() => window.print()}>Imprimir</Boton>
      </div>

      <h1 className={estilos.titulo}>Reservas del {formatearFecha(fecha)}</h1>

      {locales.map((local) => {
        const delLocal = reservas.filter((r) => r.local_id === local.id);
        const cubiertos = delLocal.filter((r) => r.estado === 'confirmada').reduce((t, r) => t + r.personas, 0);
        return (
          <section key={local.id} className={estilos.local}>
            <h2 className={estilos.nombreLocal}>
              {local.nombre} <span>· {cubiertos} personas confirmadas</span>
            </h2>
            {delLocal.length ? (
              <table className={estilos.tabla}>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Nombre</th>
                    <th>Pers.</th>
                    <th>Teléfono</th>
                    <th>Comentarios y notas</th>
                  </tr>
                </thead>
                <tbody>
                  {delLocal.map((r) => (
                    <tr key={r.id} className={r.estado === 'pendiente' ? estilos.pendiente : ''}>
                      <td>{r.hora.slice(0, 5)}</td>
                      <td>
                        {r.nombre}
                        {r.estado === 'pendiente' && <em> (pendiente)</em>}
                      </td>
                      <td>{r.personas}</td>
                      <td>{r.telefono}</td>
                      <td>{[r.comentarios, r.nota].filter(Boolean).join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={estilos.vacio}>Sin reservas.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default function Dia() {
  return (
    <main className={estilos.main}>
      <Section>
        <Suspense fallback={null}>
          <RequiereSesion admin>
            <ListaDelDia />
          </RequiereSesion>
        </Suspense>
      </Section>
    </main>
  );
}
