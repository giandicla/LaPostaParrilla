import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const auth = vi.hoisted(() => ({
  crearCuenta: vi.fn(),
  ingresarConMail: vi.fn(),
  pedirNuevaContrasena: vi.fn(),
}));
vi.mock('../../servicios/auth.js', () => auth);

// Turnstile no corre en jsdom: el captcha falso entrega un token al montarse
// (o ninguno, para probar la espera) y cuenta los reinicios
const captcha = vi.hoisted(() => ({ token: 'token-prueba', reinicios: 0 }));
vi.mock('../Captcha/Captcha.jsx', async () => {
  const { useEffect, useImperativeHandle } = await import('react');
  return {
    default: function CaptchaFalso({ alCambiar, ref }) {
      useImperativeHandle(ref, () => ({ reiniciar: () => { captcha.reinicios += 1; } }), []);
      useEffect(() => { if (captcha.token) alCambiar(captcha.token); }, [alCambiar]);
      return null;
    },
  };
});

const { default: FormularioCuenta } = await import('./FormularioCuenta.jsx');
const { mensajeTrasCrear, mensajeTrasOlvido } = await import('../../validacion/cuenta.js');

const escribir = async (etiqueta, texto) => userEvent.type(screen.getByLabelText(etiqueta), texto);
const enviar = (nombre) => userEvent.click(screen.getByRole('button', { name: nombre }));

beforeEach(() => {
  vi.clearAllMocks();
  captcha.token = 'token-prueba';
  captcha.reinicios = 0;
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
      { nombre: 'Ana', mail: 'ana@gmail.com', contrasena: 'una-clave-larga' }, '/reservas', 'token-prueba'
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
    expect(captcha.reinicios).toBe(1);
  });

  test('sin el token de la verificación todavía, avisa y no llama a la base', async () => {
    captcha.token = '';
    render(<FormularioCuenta modo="crear" alCambiarModo={() => {}} />);
    await escribir('Nombre', 'Ana');
    await escribir('Mail', 'ana@gmail.com');
    await escribir('Contraseña', 'una-clave-larga');
    await enviar('Crear cuenta');
    expect(screen.getByRole('alert').textContent).toBe('Esperá a que termine la verificación de abajo y probá de nuevo.');
    expect(auth.crearCuenta).not.toHaveBeenCalled();
  });
});

describe('FormularioCuenta: ingresar y olvidé', () => {
  test('ingresar no pide nombre y deja el botón en "Ingresando…" hasta que la página redirige', async () => {
    render(<FormularioCuenta modo="ingresar" alCambiarModo={() => {}} />);
    expect(screen.queryByLabelText('Nombre')).toBe(null);
    await escribir('Mail', 'ana@gmail.com');
    await escribir('Contraseña', 'x');
    await enviar('Ingresar');
    expect(auth.ingresarConMail).toHaveBeenCalledWith({ mail: 'ana@gmail.com', contrasena: 'x' }, 'token-prueba');
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
    expect(auth.pedirNuevaContrasena).toHaveBeenCalledWith('nadie@gmail.com', 'token-prueba');
    expect(screen.getByRole('status').textContent).toContain(mensajeTrasOlvido('nadie@gmail.com'));
  });
});

describe('FormularioCuenta: foco', () => {
  test('al aparecer por un cambio de modo (enfocar), el foco va al mail', () => {
    render(<FormularioCuenta modo="olvide" enfocar alCambiarModo={() => {}} />);
    expect(document.activeElement).toBe(screen.getByLabelText('Mail'));
  });

  test('al cargar la página no roba el foco', () => {
    render(<FormularioCuenta modo="ingresar" alCambiarModo={() => {}} />);
    expect(document.activeElement).toBe(document.body);
  });

  test('al mandar, el foco pasa al aviso que reemplaza al formulario', async () => {
    render(<FormularioCuenta modo="olvide" alCambiarModo={() => {}} />);
    await escribir('Mail', 'ana@gmail.com');
    await enviar('Mandar el mail');
    expect(document.activeElement).toBe(screen.getByRole('status'));
  });
});
