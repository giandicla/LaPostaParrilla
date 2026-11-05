import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Boton from './Boton.jsx';

describe('Boton', () => {
  test('con `to` es un link interno, en la misma pestaña', () => {
    render(<Boton to="/reservas">Reservar</Boton>);
    const link = screen.getByRole('link', { name: 'Reservar' });
    expect(link.getAttribute('href')).toBe('/reservas');
    expect(link.getAttribute('target')).toBe(null);
  });

  test('con `href` es un link externo: pestaña nueva y rel="noreferrer"', () => {
    render(<Boton href="https://wa.me/5492944966199">WhatsApp</Boton>);
    const link = screen.getByRole('link', { name: 'WhatsApp' });
    expect(link.getAttribute('href')).toBe('https://wa.me/5492944966199');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noreferrer');
  });

  test('sin destino es un botón type="button": no envía el formulario que lo contiene', async () => {
    const alEnviar = vi.fn((e) => e.preventDefault());
    const alClic = vi.fn();
    render(
      <form onSubmit={alEnviar}>
        <Boton onClick={alClic}>Cancelar</Boton>
      </form>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(alClic).toHaveBeenCalledOnce();
    expect(alEnviar).not.toHaveBeenCalled();
  });

  test('type="submit" sí envía el formulario', async () => {
    const alEnviar = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={alEnviar}>
        <Boton type="submit">Guardar</Boton>
      </form>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(alEnviar).toHaveBeenCalledOnce();
  });

  test('pasa los atributos extra (disabled, aria-*)', () => {
    render(<Boton disabled aria-describedby="ayuda">Pagar</Boton>);
    const boton = screen.getByRole('button', { name: 'Pagar' });
    expect(boton.disabled).toBe(true);
    expect(boton.getAttribute('aria-describedby')).toBe('ayuda');
  });
});
