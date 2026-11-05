import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Campo from './Campo.jsx';

const conInput = (props) => (
  <Campo id="nombre" etiqueta="Nombre" {...props}>
    {(atributos) => <input {...atributos} />}
  </Campo>
);

describe('Campo', () => {
  test('la etiqueta queda asociada al control', () => {
    render(conInput());
    expect(screen.getByLabelText('Nombre').id).toBe('nombre');
  });

  test('sin error ni ayuda, el control no lleva aria-invalid ni aria-describedby', () => {
    render(conInput());
    const control = screen.getByLabelText('Nombre');
    expect(control.hasAttribute('aria-invalid')).toBe(false);
    expect(control.hasAttribute('aria-describedby')).toBe(false);
  });

  test('con error: aria-invalid y el mensaje se lee al entrar al campo', () => {
    render(conInput({ error: 'Escribí tu nombre.' }));
    const control = screen.getByLabelText('Nombre');
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(control.getAttribute('aria-describedby')).toBe('nombre-error');
    expect(document.getElementById('nombre-error').textContent).toBe('Escribí tu nombre.');
  });

  test('con error y ayuda, describe las dos cosas, el error primero', () => {
    render(conInput({ error: 'Muy corto.', ayuda: 'Al menos 8 caracteres.' }));
    expect(screen.getByLabelText('Nombre').getAttribute('aria-describedby')).toBe('nombre-error nombre-ayuda');
    expect(document.getElementById('nombre-ayuda').textContent).toBe('Al menos 8 caracteres.');
  });

  test('opcional lo dice en la etiqueta', () => {
    render(conInput({ opcional: true }));
    expect(screen.getByLabelText('Nombre (opcional)')).toBeDefined();
  });
});
