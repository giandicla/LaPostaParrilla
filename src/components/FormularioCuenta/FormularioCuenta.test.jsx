import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const auth = vi.hoisted(() => ({
  crearCuenta: vi.fn(),
  ingresarConMail: vi.fn(),
  pedirNuevaContrasena: vi.fn(),
}));
vi.mock('../../servicios/auth.js', () => auth);

const { default: FormularioCuenta } = await import('./FormularioCuenta.jsx');
const { mensajeTrasCrear, mensajeTrasOlvido } = await import('../../validacion/cuenta.js');

const escribir = async (etiqueta, texto) => userEvent.type(screen.getByLabelText(etiqueta), texto);
const enviar = (nombre) => userEvent.click(screen.getByRole('button', { name: nombre }));

beforeEach(() => {
  vi.clearAllMocks();
  auth.crearCuenta.mockResolvedValue(undefined);
  auth.ingresarConMail.mockResolvedValue(undefined);
  auth.pedirNuevaContrasena.mockResolvedValue(undefined);
});

describe('FormularioCuenta: crear cuenta', () => {
  test('vacío: marca los tres campos, lleva el foco al primero y no llama a la base', async () => {
    render(<FormularioCuenta modo="crear" alCambiarModo={() => {}} />);
    await enviar('Crear cuenta');
    expect(screen.getByLabelText('Nombre').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Mail').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Contraseña').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(screen.getByLabelText('Nombre'));
    expect(auth.crearCuenta).not.toHaveBeenCalled();
  });

  test('una contraseña corta: el foco va a ese campo y el error queda asociado', async () => {
    render(<FormularioCuenta modo="crear" alCambiarModo={() => {}} />);
    await escribir('Nombre', 'Ana');
    await escribir('Mail', 'ana@gmail.com');
    await escribir('Contraseña', 'corta');
    await enviar('Crear cuenta');
    const contrasena = screen.getByLabelText('Contraseña');
    expect(document.activeElement).toBe(contrasena);
    expect(contrasena.getAttribute('aria-describedby')).toContain('-error');
    expect(screen.getByText('La contraseña tiene que tener al menos 8 caracteres.')).toBeDefined();
  });

  test('con datos válidos crea la cuenta y avisa que revise el mail', async () => {
    render(<FormularioCuenta modo="crear" volver="/reservas" alCambiarModo={() => {}} />);
    await escribir('Nombre', 'Ana');
    await escribir('Mail', 'ana@gmail.com');
    await escribir('Contraseña', 'una-clave-larga');
    await enviar('Crear cuenta');
    expect(auth.crearCuenta).toHaveBeenCalledWith(
      { nombre: 'Ana', mail: 'ana@gmail.com', contrasena: 'una-clave-larga' }, '/reservas'
    );
    expect(screen.getByRole('status').textContent).toBe(mensajeTrasCrear('ana@gmail.com'));
  });

  test('un error de la base se muestra como alerta y se puede volver a intentar', async () => {
    auth.crearCuenta.mockRejectedValue(new Error('Probá de nuevo en un minuto.'));
    render(<FormularioCuenta modo="crear" alCambiarModo={() => {}} />);
    await escribir('Nombre', 'Ana');
    await escribir('Mail', 'ana@gmail.com');
    await escribir('Contraseña', 'una-clave-larga');
    await enviar('Crear cuenta');
    expect(screen.getByRole('alert').textContent).toBe('Probá de nuevo en un minuto.');
    expect(screen.getByRole('button', { name: 'Crear cuenta' }).disabled).toBe(false);
  });
});

describe('FormularioCuenta: ingresar y olvidé', () => {
  test('ingresar no pide nombre y deja el botón en "Ingresando…" hasta que la página redirige', async () => {
    render(<FormularioCuenta modo="ingresar" alCambiarModo={() => {}} />);
    expect(screen.queryByLabelText('Nombre')).toBe(null);
    await escribir('Mail', 'ana@gmail.com');
    await escribir('Contraseña', 'x');
    await enviar('Ingresar');
    expect(auth.ingresarConMail).toHaveBeenCalledWith({ mail: 'ana@gmail.com', contrasena: 'x' });
    expect(screen.getByRole('button', { name: 'Ingresando…' }).disabled).toBe(true);
  });

  test('"Olvidé mi contraseña" cambia de modo', async () => {
    const alCambiarModo = vi.fn();
    render(<FormularioCuenta modo="ingresar" alCambiarModo={alCambiarModo} />);
    await userEvent.click(screen.getByRole('button', { name: 'Olvidé mi contraseña' }));
    expect(alCambiarModo).toHaveBeenCalledWith('olvide');
  });

  test('olvidé: solo pide el mail y muestra el mismo aviso exista o no la cuenta', async () => {
    render(<FormularioCuenta modo="olvide" alCambiarModo={() => {}} />);
    expect(screen.queryByLabelText('Contraseña')).toBe(null);
    await escribir('Mail', 'nadie@gmail.com');
    await enviar('Mandar el mail');
    expect(auth.pedirNuevaContrasena).toHaveBeenCalledWith('nadie@gmail.com');
    expect(screen.getByRole('status').textContent).toContain(mensajeTrasOlvido('nadie@gmail.com'));
  });
});
