// Vitest: tests de las rutas de app/api/ y de los componentes React.
// Las funciones puras siguen con node --test (src/**/*.test.js); por eso cada
// proyecto toma solo sus archivos. `npm test` corre las dos tandas.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'rutas',
          environment: 'node',
          include: ['app/api/**/*.test.js'],
        },
      },
      {
        extends: true,
        test: {
          name: 'componentes',
          environment: 'jsdom',
          include: ['src/components/**/*.test.jsx'],
          setupFiles: ['./vitest.setup.js'],
          // Con estas dos variables, backendDisponible es true (src/servicios/config.js).
          // No se conecta a nada: la sesión y los servicios se reemplazan en cada test.
          env: {
            NEXT_PUBLIC_SUPABASE_URL: 'http://supabase.test',
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'clave-de-prueba',
          },
        },
      },
    ],
  },
});
