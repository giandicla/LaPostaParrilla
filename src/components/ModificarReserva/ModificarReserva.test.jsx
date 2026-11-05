import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const servicios = vi.hoisted(() => ({ obtenerFranjas: vi.fn(), modificarReserva: vi.fn() }));
vi.mock('../../servicios/reservas.js', async (original) => ({
  ...(await original()),
  ...servicios,
  hoyEnArgentina: () => '2026-11-05',
}));

const { default: ModificarReserva } = await import('./ModificarReserva.jsx');

const reserva = { id: 'r-1', local_id: 'parrilla', fecha: '2026-11-20', hora: '20:30:00', personas: 4 };
const campo = (etiqueta) => screen.getByLabelText(etiqueta);
const guardar = () => userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

function abrir() {
  const alGuardar = vi.fn();
  render(<ModificarReserva reserva={reserva} alGuardar={alGuardar} alCerrar={() => {}} />);
  return { alGuardar };
}

beforeEach(() => {
  servicios.obtenerFranjas.mockReset().mockResolvedValue(['20:00', '20:15', '20:30', '20:45']);
  servicios.modificarReserva.mockReset().mockResolvedValue(undefined);
});

describe('ModificarReserva (Mis reservas)', () => {
  test('pide las franjas de su local y las ofrece en la hora', async () => {
    abrir();
    expect(servicios.obtenerFranjas).toHaveBeenCalledWith('parrilla');
    expect(await screen.findByRole('option', { name: '20:45' })).toBeDefined();
    expect(campo('Hora').value).toBe('20:30');
  });

  test('guarda fecha, hora y personas', async () => {
    const { alGuardar } = abrir();
    await screen.findByRole('option', { name: '20:45' });
    await userEvent.selectOptions(campo('Hora'), '20:45');
    await guardar();
    expect(servicios.modificarReserva).toHaveBeenCalledWith('r-1', { fecha: '2026-11-20', hora: '20:45', personas: '4' });
    expect(alGuardar).toHaveBeenCalledOnce();
  });

  test('más de 6 personas no se manda', async () => {
    abrir();
    await screen.findByRole('option', { name: '20:45' });
    await userEvent.clear(campo('Personas'));
    await userEvent.type(campo('Personas'), '7');
    await guardar();
    expect(servicios.modificarReserva).not.toHaveBeenCalled();
    expect(screen.getByText('Las reservas son de 1 a 6 personas.')).toBeDefined();
    expect(document.activeElement).toBe(campo('Personas'));
  });

  test('si no cargan las franjas, lo dice y no deja guardar una hora que no se puede validar', async () => {
    servicios.obtenerFranjas.mockRejectedValue(new Error('No pudimos cargar los horarios.'));
    abrir();
    expect((await screen.findByRole('alert')).textContent).toBe('No pudimos cargar los horarios.');
    await guardar();
    expect(servicios.modificarReserva).not.toHaveBeenCalled();
  });

  test('una regla de la base (menos de 1 hora) se muestra como alerta', async () => {
    servicios.modificarReserva.mockRejectedValue(new Error('Solo se puede modificar hasta 1 hora antes.'));
    const { alGuardar } = abrir();
    await screen.findByRole('option', { name: '20:45' });
    await guardar();
    expect(screen.getByRole('alert').textContent).toBe('Solo se puede modificar hasta 1 hora antes.');
    expect(alGuardar).not.toHaveBeenCalled();
  });
});
