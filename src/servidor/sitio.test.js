// node --test "src/**/*.test.js"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { urlDelSitio } from './sitio.js';

test('en producción usa el dominio de producción que informa Vercel, aunque APP_URL diga otra cosa', () => {
  assert.equal(
    urlDelSitio({
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'lapostaparrilla.vercel.app',
      APP_URL: 'https://la-posta-parrilla-git-feat-pagos-sena-x.vercel.app',
    }),
    'https://lapostaparrilla.vercel.app'
  );
});

test('en una preview usa APP_URL si está cargada', () => {
  assert.equal(
    urlDelSitio({ VERCEL_ENV: 'preview', APP_URL: 'https://rama.vercel.app/', VERCEL_BRANCH_URL: 'otra.vercel.app' }),
    'https://rama.vercel.app'
  );
});

test('en una preview sin APP_URL usa la URL fija de la rama', () => {
  assert.equal(urlDelSitio({ VERCEL_ENV: 'preview', VERCEL_BRANCH_URL: 'rama.vercel.app' }), 'https://rama.vercel.app');
});

test('en local usa APP_URL, y si no hay, localhost', () => {
  assert.equal(urlDelSitio({ APP_URL: 'http://localhost:3001' }), 'http://localhost:3001');
  assert.equal(urlDelSitio({}), 'http://localhost:3000');
});
