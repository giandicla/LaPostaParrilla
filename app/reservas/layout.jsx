// Título de la pestaña de esta sección. La página es un componente de cliente y
// no puede exportar metadata: por eso vive en el layout.
export const metadata = {
  title: 'Reservas',
  description: 'Reservá tu mesa en La Posta Parrilla o en La Posta II Restaurante, en Villa La Angostura.',
};

export default function Layout({ children }) {
  return children;
}
