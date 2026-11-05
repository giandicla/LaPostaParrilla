import { describe, expect, test } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PestanasCuenta from './PestanasCuenta.jsx';

const PESTANAS = [
  { id: 'ingresar', etiqueta: 'Ingresar' },
  { id: 'crear', etiqueta: 'Crear cuenta' },
];

function Prueba() {
  const [activa, setActiva] = useState('ingresar');
  return (
    <PestanasCuenta pestanas={PESTANAS} etiqueta="Ingresar o crear cuenta" activa={activa} alCambiar={setActiva}>
      <p>Panel de {activa}</p>
    </PestanasCuenta>
  );
}

const pestana = (nombre) => screen.getByRole('tab', { name: nombre });

describe('PestanasCuenta', () => {
  test('el grupo de pestañas tiene nombre para el lector de pantalla', () => {
    render(<Prueba />);
    expect(screen.getByRole('tablist', { name: 'Ingresar o crear cuenta' })).toBeDefined();
  });

  test('solo la pestaña activa entra en el orden del Tab, y el panel la nombra', () => {
    render(<Prueba />);
    expect(pestana('Ingresar').getAttribute('aria-selected')).toBe('true');
    expect(pestana('Ingresar').tabIndex).toBe(0);
    expect(pestana('Crear cuenta').tabIndex).toBe(-1);
    expect(screen.getByRole('tabpanel', { name: 'Ingresar' })).toBeDefined();
  });

  test('las flechas cambian de pestaña y mueven el foco, en ronda', async () => {
    render(<Prueba />);
    pestana('Ingresar').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(pestana('Crear cuenta'));
    expect(screen.getByText('Panel de crear')).toBeDefined();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(pestana('Ingresar'));
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(pestana('Crear cuenta'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(pestana('Ingresar'));
  });

  test('con el mouse también cambia', async () => {
    render(<Prueba />);
    await userEvent.click(pestana('Crear cuenta'));
    expect(pestana('Crear cuenta').getAttribute('aria-selected')).toBe('true');
  });
});
