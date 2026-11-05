import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const admin = vi.hoisted(() => ({ editarReserva: vi.fn() }));
vi.mock('../../servicios/admin.js', () => admin);
// Fecha fija: la validación compara con "hoy en Argentina"
vi.mock('../../servicios/reservas.js', async (original) => ({
  ...(await original()),
  hoyEnArgentina: () => '2026-11-05',
}));

const { default: EditarReserva } = await import('./EditarReserva.jsx');

const FRANJAS = ['12:00', '12:15', '20:00', '20:30'];
const reservaWeb = {
  id: 'r-1', origen: 'web', fecha: '2026-11-20', hora: '20:30:00', personas: 4,
  nombre: 'Ana Pérez', telefono: '2944 123456', mail: 'ana@gmail.com', comentarios: null,
};

function abrir(reserva = reservaWeb, props = {}) {
  const alGuardar = vi.fn();
  render(<EditarReserva reserva={reserva} franjas={FRANJAS} alGuardar={alGuardar} alCerrar={() => {}} {...props} />);
  return { alGuardar };
}

const campo = (etiqueta) => screen.getByLabelText(etiqueta);
const guardar = () => userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

beforeEach(() => {
  admin.editarReserva.mockReset().mockResolvedValue(undefined);
});

describe('EditarReserva (panel)', () => {
  test('arranca con los datos de la reserva y el foco en la fecha', () => {
    abrir();
    expect(campo('Fecha').value).toBe('2026-11-20');
    expect(campo('Hora').value).toBe('20:30');
    expect(campo('A nombre de').value).toBe('Ana Pérez');
    expect(document.activeElement).toBe(campo('Fecha'));
  });

  test('en una reserva de la web el mail no se edita (es el de la cuenta)', () => {
    abrir();
    expect(screen.queryByLabelText(/Mail del cliente/)).toBe(null);
  });

  test('guarda los datos limpios y avisa al panel', async () => {
    const { alGuardar } = abrir();
    await userEvent.clear(campo('Personas'));
    await userEvent.type(campo('Personas'), '5');
    await userEvent.type(campo('Comentarios (opcional)'), '  Cumpleaños  ');
    await guardar();
    expect(admin.editarReserva).toHaveBeenCalledWith('r-1', {
      fecha: '2026-11-20', hora: '20:30', personas: 5, nombre: 'Ana Pérez',
      telefono: '2944 123456', comentarios: 'Cumpleaños',
    });
    expect(alGuardar).toHaveBeenCalledOnce();
  });

  test('una fecha pasada no se manda: error en la fecha y foco ahí', async () => {
    abrir();
    await userEvent.clear(campo('Fecha'));
    await userEvent.type(campo('Fecha'), '2026-11-01');
    await userEvent.clear(campo('A nombre de'));
    await guardar();
    expect(admin.editarReserva).not.toHaveBeenCalled();
    expect(campo('Fecha').getAttribute('aria-invalid')).toBe('true');
    expect(campo('A nombre de').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(campo('Fecha'));
  });

  test('una reserva web acepta hasta 6 personas; una del local, más', async () => {
    abrir();
    await userEvent.clear(campo('Personas'));
    await userEvent.type(campo('Personas'), '8');
    await guardar();
    expect(admin.editarReserva).not.toHaveBeenCalled();
    expect(campo('Personas').getAttribute('aria-invalid')).toBe('true');
  });

  test('en una reserva del local se edita el mail, y vacío se guarda como null', async () => {
    abrir({ ...reservaWeb, origen: 'local', mail: 'viejo@gmail.com', personas: 10 });
    await userEvent.clear(campo('Mail del cliente (opcional)'));
    await guardar();
    expect(admin.editarReserva).toHaveBeenCalledWith('r-1', expect.objectContaining({ personas: 10, mail: null }));
  });

  test('el teléfono solo acepta números y signos de teléfono', async () => {
    abrir();
    await userEvent.clear(campo('Teléfono'));
    await userEvent.type(campo('Teléfono'), '2944-abc12');
    expect(campo('Teléfono').value).toBe('2944-12');
  });

  test('si la base rechaza el cambio, muestra su mensaje y deja reintentar', async () => {
    admin.editarReserva.mockRejectedValue(new Error('Ese turno ya está completo.'));
    const { alGuardar } = abrir();
    await guardar();
    expect(screen.getByRole('alert').textContent).toBe('Ese turno ya está completo.');
    expect(screen.getByRole('button', { name: 'Guardar cambios' }).disabled).toBe(false);
    expect(alGuardar).not.toHaveBeenCalled();
  });
});
