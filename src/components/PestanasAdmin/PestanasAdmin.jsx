'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import estilos from './PestanasAdmin.module.css';

// Las secciones del panel del admin. Una sección nueva (gift cards, pedidos)
// es una pestaña más acá.
const PESTANAS = [
  { a: '/admin', texto: 'Reservas' },
  { a: '/admin/bloqueos', texto: 'Días bloqueados' },
  { a: '/admin/carta', texto: 'Carta' },
];

export default function PestanasAdmin() {
  const pathname = usePathname();

  return (
    <nav className={estilos.pestanas} aria-label="Secciones del panel">
      {PESTANAS.map(({ a, texto }) => (
        <Link
          key={a}
          href={a}
          className={estilos.pestana}
          aria-current={pathname === a ? 'page' : undefined}
        >
          {texto}
        </Link>
      ))}
    </nav>
  );
}
