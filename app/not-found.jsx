import Section from '../src/components/Section/Section.jsx';
import Boton from '../src/components/Boton/Boton.jsx';

export const metadata = {
  title: 'Página no encontrada · La Posta',
};

export default function NoEncontrada() {
  return (
    <main>
      <Section
        ancho="angosto"
        titulo="No encontramos esa página"
        bajada="Puede que el link esté viejo o que hayamos movido algo de lugar."
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Boton to="/">Volver al inicio</Boton>
          <Boton to="/carta" variante="texto">Ver la carta</Boton>
        </div>
      </Section>
    </main>
  );
}
