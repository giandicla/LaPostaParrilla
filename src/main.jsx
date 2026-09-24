import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './styles/tokens.css';
import './styles/global.css';
import App from './App.jsx';
import Inicio from './pages/Inicio/Inicio.jsx';
import Carta from './pages/Carta/Carta.jsx';
import Reservas from './pages/Reservas/Reservas.jsx';
import Nosotros from './pages/Nosotros/Nosotros.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Inicio /> },
      { path: 'carta', element: <Carta /> },
      { path: 'reservas', element: <Reservas /> },
      { path: 'nosotros', element: <Nosotros /> },
      // Sin página 404 propia en esta etapa: cualquier ruta rara vuelve al inicio
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
