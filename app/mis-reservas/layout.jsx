// Título de la pestaña de esta sección. La página es un componente de cliente y
// no puede exportar metadata: por eso vive en el layout.
export const metadata = {
  title: 'Mis reservas',
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return children;
}
