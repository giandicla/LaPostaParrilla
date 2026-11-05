import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const estado = vi.hoisted(() => ({
  sesion: null, cargando: false, esAdmin: false, ruta: '/reservas', query: '', reemplazos: [],
}));

vi.mock('next/navigation', () => ({
  usePathname: () => estado.ruta,
  useSearchParams: () => new URLSearchParams(estado.query),
  useRouter: () => ({ replace: (url) => estado.reemplazos.push(url) }),
}));
vi.mock('../SesionProvider/SesionProvider.jsx', () => ({
  useSesion: () => ({ sesion: estado.sesion, cargando: estado.cargando, esAdmin: estado.esAdmin }),
}));

const { default: RequiereSesion } = await import('./RequiereSesion.jsx');

const SECRETO = 'Contenido protegido';
const protegido = (props) => (
  <RequiereSesion {...props}>
    <p>{SECRETO}</p>
  </RequiereSesion>
);

beforeEach(() => {
  Object.assign(estado, { sesion: null, cargando: false, esAdmin: false, ruta: '/reservas', query: '', reemplazos: [] });
});

describe('RequiereSesion', () => {
  test('mientras carga la sesión no muestra el contenido', () => {
    estado.cargando = true;
    render(protegido());
    expect(screen.getByRole('status').textContent).toBe('Cargando…');
    expect(screen.queryByText(SECRETO)).toBe(null);
  });

  test('sin sesión pide ingresar y vuelve a la misma página, con su query', () => {
    estado.query = 'local=parrilla';
    render(protegido());
    expect(screen.queryByText(SECRETO)).toBe(null);
    expect(screen.getByRole('heading', { name: 'Ingresá para continuar' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Ingresar' }).getAttribute('href'))
      .toBe(`/ingresar?volver=${encodeURIComponent('/reservas?local=parrilla')}`);
  });

  test('sin sesión, `sinSesion` reemplaza el aviso', () => {
    render(protegido({ sinSesion: <p>Otra cosa</p> }));
    expect(screen.getByText('Otra cosa')).toBeDefined();
    expect(screen.queryByText(SECRETO)).toBe(null);
  });

  test('con sesión muestra el contenido', () => {
    estado.sesion = { user: { id: 'u-1' } };
    render(protegido());
    expect(screen.getByText(SECRETO)).toBeDefined();
  });

  test('una sección de admin no se muestra a un cliente', () => {
    estado.sesion = { user: { id: 'u-1' } };
    render(protegido({ admin: true }));
    expect(screen.queryByText(SECRETO)).toBe(null);
    expect(screen.getByText('Tu cuenta no tiene permisos de administración.')).toBeDefined();
  });

  test('una sección de admin se muestra al admin', () => {
    estado.sesion = { user: { id: 'a-1' } };
    estado.esAdmin = true;
    render(protegido({ admin: true }));
    expect(screen.getByText(SECRETO)).toBeDefined();
  });

  test('una página solo para clientes manda al admin al panel, con la misma query', () => {
    estado.sesion = { user: { id: 'a-1' } };
    estado.esAdmin = true;
    estado.query = 'local=restaurante';
    render(protegido({ soloClientes: true }));
    expect(screen.queryByText(SECRETO)).toBe(null);
    expect(estado.reemplazos).toEqual(['/admin?local=restaurante']);
  });
});
