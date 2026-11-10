// Título de la pestaña de esta sección. La página es un componente de cliente y
// no puede exportar metadata: por eso vive en el layout.
export const metadata = {
  title: 'Carta',
  description: 'La carta de La Posta Parrilla y de La Posta II Restaurante, con precios, y la carta de vinos.',
};

export default function Layout({ children }) {
  return children;
}
