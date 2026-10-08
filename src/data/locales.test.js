// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLocal, mensajeReservaWhatsapp } from './locales.js';

const local = getLocal('parrilla');

test('mensaje de WhatsApp para un grupo: arma la frase con los datos completos', () => {
  assert.equal(
    mensajeReservaWhatsapp({
      local,
      fechaTexto: 'viernes 9 de octubre',
      hora: '20:30',
      nombre: 'Ana',
      personas: '8',
    }),
    'Hola! Me gustaría hacer una reserva en La Posta Parrilla para el viernes 9 de octubre a las 20:30, a nombre de Ana, para 8 personas.'
  );
});

test('mensaje de WhatsApp: los campos vacíos no aparecen', () => {
  assert.equal(
    mensajeReservaWhatsapp({ local, fechaTexto: '', hora: '', nombre: '  ', personas: '10' }),
    'Hola! Me gustaría hacer una reserva en La Posta Parrilla para 10 personas.'
  );
  assert.equal(
    mensajeReservaWhatsapp({ local, fechaTexto: 'sábado 10 de octubre', hora: '', nombre: 'Beto', personas: '9' }),
    'Hola! Me gustaría hacer una reserva en La Posta Parrilla para el sábado 10 de octubre, a nombre de Beto, para 9 personas.'
  );
});
