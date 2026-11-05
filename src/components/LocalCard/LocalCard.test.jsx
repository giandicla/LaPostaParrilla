import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocalCard from './LocalCard.jsx';
import { LOCALES } from '../../data/locales.js';

const [local] = LOCALES;

describe('LocalCard', () => {
  test.each(LOCALES)('$nombre: nombre, dirección y links con su id', (unLocal) => {
    render(<LocalCard local={unLocal} />);
    expect(screen.getByRole('heading', { name: unLocal.nombre })).toBeDefined();
    expect(screen.getByText(unLocal.direccion)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Reservar acá' }).getAttribute('href')).toBe(`/reservas?local=${unLocal.id}`);
    expect(screen.getByRole('link', { name: 'Ver la carta' }).getAttribute('href')).toBe(`/carta?local=${unLocal.id}`);
    expect(screen.getByRole('img').getAttribute('alt')).toBe(`Salón de ${unLocal.nombre}`);
  });

  test('muestra la primera franja de horario', () => {
    render(<LocalCard local={local} />);
    expect(screen.getByText(local.horarios[0].franja)).toBeDefined();
  });

  test('un local sin horarios cargados no muestra el dato (no se inventa)', () => {
    render(<LocalCard local={{ ...local, horarios: [] }} />);
    expect(screen.queryByText(local.horarios[0].franja)).toBe(null);
    expect(screen.getByText(local.direccion)).toBeDefined();
  });

  test('tampoco se rompe si `horarios` no existe', () => {
    const { horarios, ...sinHorarios } = local;
    void horarios;
    render(<LocalCard local={sinHorarios} />);
    expect(screen.getByRole('heading', { name: local.nombre })).toBeDefined();
  });
});
