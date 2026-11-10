import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dialogo from './Dialogo.jsx';

function abrir() {
  const alConfirmar = vi.fn();
  const alCerrar = vi.fn();
  render(
    <Dialogo titulo="Eliminar de la carta" confirmar="Eliminar" volver="No, volver" alConfirmar={alConfirmar} alCerrar={alCerrar}>
      <p>¿Eliminar «Provoleta» de la carta?</p>
    </Dialogo>
  );
  return { alConfirmar, alCerrar };
}

describe('Dialogo', () => {
  test('se abre como diálogo con el título como nombre y muestra la pregunta', () => {
    abrir();
    expect(screen.getByRole('dialog', { name: 'Eliminar de la carta' })).toBeTruthy();
    expect(screen.getByText('¿Eliminar «Provoleta» de la carta?')).toBeTruthy();
  });

  test('confirmar avisa y no cierra por su cuenta', async () => {
    const { alConfirmar, alCerrar } = abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(alConfirmar).toHaveBeenCalledTimes(1);
    expect(alCerrar).not.toHaveBeenCalled();
  });

  test('volver cierra sin confirmar', async () => {
    const { alConfirmar, alCerrar } = abrir();
    await userEvent.click(screen.getByRole('button', { name: 'No, volver' }));
    expect(alCerrar).toHaveBeenCalledTimes(1);
    expect(alConfirmar).not.toHaveBeenCalled();
  });

  test('Escape (evento cancel del diálogo) cierra sin confirmar', () => {
    const { alConfirmar, alCerrar } = abrir();
    screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(alCerrar).toHaveBeenCalledTimes(1);
    expect(alConfirmar).not.toHaveBeenCalled();
  });
});
