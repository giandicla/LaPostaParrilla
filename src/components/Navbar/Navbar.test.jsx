import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const estado = vi.hoisted(() => ({ ruta: '/', sesion: null, esAdmin: false }));

vi.mock('next/navigation', () => ({ usePathname: () => estado.ruta }));
vi.mock('../SesionProvider/SesionProvider.jsx', () => ({
  useSesion: () => ({ sesion: estado.sesion, esAdmin: estado.esAdmin, cargando: false }),
}));

const { default: Navbar } = await import('./Navbar.jsx');

const hamburguesa = () => screen.getByRole('button', { name: /menú/ });
const link = (nombre) => screen.getByRole('link', { name: nombre });

beforeEach(() => {
  estado.ruta = '/';
  estado.sesion = null;
  estado.esAdmin = false;
});

describe('Navbar: menú mobile', () => {
  test('abre con el botón, avisa que está expandido y lleva el foco al primer link', async () => {
    render(<Navbar />);
    expect(hamburguesa().getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(hamburguesa());
    expect(hamburguesa().getAttribute('aria-expanded')).toBe('true');
    expect(hamburguesa().getAttribute('aria-label')).toBe('Cerrar menú');
    expect(document.activeElement).toBe(link('Inicio'));
  });

  test('con el menú abierto el fondo no scrollea', async () => {
    render(<Navbar />);
    await userEvent.click(hamburguesa());
    expect(document.body.style.overflow).toBe('hidden');
    await userEvent.click(hamburguesa());
    expect(document.body.style.overflow).toBe('');
  });

  test('Escape lo cierra y devuelve el foco al botón', async () => {
    render(<Navbar />);
    await userEvent.click(hamburguesa());
    await userEvent.keyboard('{Escape}');
    expect(hamburguesa().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(hamburguesa());
  });

  test('el foco queda atrapado: Tab desde el último vuelve al primero', async () => {
    render(<Navbar />);
    await userEvent.click(hamburguesa());
    // Inicio → Carta → Nosotros → Ingresar → Reservar → botón de cerrar → Inicio
    for (let i = 0; i < 5; i += 1) await userEvent.tab();
    expect(document.activeElement).toBe(hamburguesa());
    await userEvent.tab();
    expect(document.activeElement).toBe(link('Inicio'));
  });

  test('Shift+Tab desde el primero va al botón de cerrar', async () => {
    render(<Navbar />);
    await userEvent.click(hamburguesa());
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(hamburguesa());
  });
});

describe('Navbar: links según la sesión', () => {
  test('sin sesión: Ingresar y Reservar', () => {
    render(<Navbar />);
    expect(link('Ingresar').getAttribute('href')).toBe('/ingresar');
    expect(link('Reservar').getAttribute('href')).toBe('/reservas');
    expect(screen.queryByRole('link', { name: 'Mis reservas' })).toBe(null);
  });

  test('un cliente con sesión ve Mis reservas y Salir', () => {
    estado.sesion = { user: { id: 'u-1' } };
    render(<Navbar />);
    expect(link('Mis reservas')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Salir' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Ingresar' })).toBe(null);
  });

  test('el admin no tiene Mis reservas, y el botón destacado lleva al panel', () => {
    estado.sesion = { user: { id: 'a-1' } };
    estado.esAdmin = true;
    render(<Navbar />);
    expect(screen.queryByRole('link', { name: 'Mis reservas' })).toBe(null);
    expect(link('Panel').getAttribute('href')).toBe('/admin');
  });

  test('marca la página actual con aria-current, también en subrutas', () => {
    estado.ruta = '/carta/algo';
    render(<Navbar />);
    expect(link('Carta').getAttribute('aria-current')).toBe('page');
    expect(link('Inicio').hasAttribute('aria-current')).toBe(false);
  });
});
