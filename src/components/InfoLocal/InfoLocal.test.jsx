import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfoLocal from './InfoLocal.jsx';
import { LOCALES } from '../../data/locales.js';

const [local] = LOCALES;

describe('InfoLocal', () => {
  test('el teléfono es un link tel: sin espacios ni guiones', () => {
    render(<InfoLocal local={{ ...local, telefono: '+54 9 2944 96-6199' }} />);
    expect(screen.getByRole('link', { name: '+54 9 2944 96-6199' }).getAttribute('href')).toBe('tel:+5492944966199');
  });

  test('sin teléfono no hay link roto: dice que falta confirmarlo', () => {
    render(<InfoLocal local={{ ...local, telefono: undefined }} />);
    expect(screen.queryByRole('link', { name: /^\+54/ })).toBe(null);
    expect(screen.getByText('Teléfono a confirmar')).toBeDefined();
  });

  test('con WhatsApp, el link abre en otra pestaña con el mensaje armado para ese local', () => {
    render(<InfoLocal local={{ ...local, whatsapp: '5492944966199' }} />);
    const link = screen.getByRole('link', { name: /Escribir por WhatsApp/ });
    const url = new URL(link.getAttribute('href'));
    expect(url.origin + url.pathname).toBe('https://wa.me/5492944966199');
    expect(url.searchParams.get('text')).toBe(`Hola! Quería consultar por una reserva en ${local.nombre}.`);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  test('sin WhatsApp no aparece el botón', () => {
    render(<InfoLocal local={{ ...local, whatsapp: undefined }} />);
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBe(null);
  });

  test('lista todos los horarios y el mapa tiene título accesible', () => {
    const horarios = [{ dia: 'Lunes a viernes', franja: '12 a 23' }, { dia: 'Domingos', franja: '12 a 16' }];
    render(<InfoLocal local={{ ...local, horarios }} />);
    expect(screen.getByText('Lunes a viernes')).toBeDefined();
    expect(screen.getByText('12 a 16')).toBeDefined();
    expect(screen.getByTitle(`Mapa de ${local.nombre}`)).toBeDefined();
  });
});
