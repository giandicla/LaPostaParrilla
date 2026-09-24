# Boceto visual La Posta — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sitio React de 4 páginas para La Posta, maquetado y desplegado en Vercel, que presenta los dos locales de la marca sin lógica de datos ni backend.

**Architecture:** SPA con Vite + React Router. Los dos locales son datos (`LOCALES` en `src/data/locales.js`), no rutas: los componentes iteran sobre el array y reciben el local por props. Estilos con CSS Modules sobre una capa de custom properties en `tokens.css`. Todo el contenido editable del restaurante vive en `src/data/`, fuera del JSX.

**Tech Stack:** Vite 6, React 19, React Router 7, CSS Modules, Google Fonts (Playfair Display + Inter). Sin TypeScript, sin librerías de UI, sin backend.

**Spec:** `docs/superpowers/specs/2026-09-24-la-posta-web-design.md`

## Nota sobre testing

El spec (sección 2) define esta etapa como maqueta visual sin lógica: no hay servicios, ni estado persistido, ni fetch. No hay nada que testear unitariamente que no sea testear a React. Por eso **no se escriben tests automatizados en este plan** y el ciclo TDD no aplica.

En su lugar, cada tarea cierra con una **verificación ejecutable y concreta**:

1. `npm run build` termina sin errores ni warnings.
2. Un chequeo visual con criterios explícitos y verificables (qué se ve, en qué breakpoint, qué pasa al hacer clic).

Los tests entran en la etapa 2, junto con el CRUD de reservas, que sí tiene lógica.

## Global Constraints

Copiados del spec. Aplican a todas las tareas.

- **Idioma:** todo el contenido visible y los nombres de archivos, variables y componentes van en **español**. Los mensajes de commit van en inglés.
- **Paleta:** solo los tokens de `tokens.css`. Ningún color literal en un `.module.css`. El bordo de marca es exactamente `#5F0004`.
- **Locales como datos:** ningún componente escribe `'parrilla'` o `'restaurante'` a mano. Se itera sobre `LOCALES` o se recibe el objeto por props. Única excepción: el valor por defecto `LOCALES[0]`.
- **Acceso a datos:** solo `Navbar`, `Footer` y las páginas importan de `src/data/`. Los componentes presentacionales (`LocalCard`, `InfoLocal`, `PlatoCard`, `Hero`, `GaleriaGrid`) reciben todo por props.
- **Un componente, una carpeta:** `src/components/Nombre/Nombre.jsx` + `Nombre.module.css`.
- **Mobile first:** el CSS base es mobile. Los `@media` suben desde ahí, nunca al revés.
- **Breakpoints:** tablet `768px`, desktop `1100px`. Verificar en 360px, 768px y 1440px.
- **Imágenes:** todas con `alt` descriptivo en español. Todas con `loading="lazy"` salvo la del hero.
- **Datos faltantes:** se marcan con el comentario `// PENDIENTE` para poder encontrarlos con `grep -rn "PENDIENTE" src/`.
- **Sin dependencias nuevas** más allá de `react`, `react-dom`, `react-router-dom` y las de Vite. Cualquier agregado necesita aprobación.
- **Alcance:** el formulario de reservas **no persiste nada**. No se agrega localStorage, ni fetch, ni capa de servicios.

## Estructura de archivos

| Archivo | Responsabilidad | Tarea |
|---|---|---|
| `package.json`, `vite.config.js`, `index.html`, `.gitignore` | Scaffolding y build | 1 |
| `src/styles/tokens.css` | Custom properties: color, tipografía, espaciado, sombras | 2 |
| `src/styles/global.css` | Reset, base del `body`, tipografía por defecto | 2 |
| `src/data/marca.js` | Datos comunes: nombre, Instagram, email | 3 |
| `src/data/locales.js` | `LOCALES` + `getLocal()`. Pieza central del modelo | 3 |
| `src/data/menu.js` | Cartas por local + `getCarta()` + `getDestacados()` | 3 |
| `src/data/textos.js` | Copys largos: bienvenida, historia | 3 |
| `scripts/gen-placeholders.mjs` | Genera los SVG placeholder de `public/img/` | 3 |
| `src/main.jsx` | Monta React, define el router | 4 |
| `src/App.jsx` | Layout: Navbar + `<Outlet/>` + Footer + scroll-to-top | 4 |
| `src/components/Navbar/` | Navegación, estado de scroll, menú mobile | 4 |
| `src/components/Footer/` | Links, redes, las dos direcciones | 4 |
| `src/components/Boton/` | Botón o link según props. 3 variantes | 5 |
| `src/components/Section/` | Ancho máximo, padding vertical, color de fondo | 5 |
| `src/components/Hero/` | Bloque de portada reutilizable | 6 |
| `src/pages/Inicio/` | Arma los 7 bloques de la home | 6, 7, 8, 9 |
| `src/components/LocalCard/` | Tarjeta grande de un salón | 7 |
| `src/components/PlatoCard/` | Card de plato | 8 |
| `src/components/GaleriaGrid/` | Grilla de fotos responsiva | 9 |
| `src/components/InfoLocal/` | Horarios, mapa y contacto de UN local | 9 |
| `src/components/SelectorLocal/` | Toggle Parrilla / Restaurante, controlado | 10 |
| `src/pages/Carta/` | Carta del local activo, leído de la URL | 10 |
| `src/pages/Reservas/` | Formulario maquetado, sin persistencia | 11 |
| `src/pages/Nosotros/` | Historia + un bloque por local | 12 |
| `CLAUDE.md`, `docs/*.md`, `README.md` | Contexto del proyecto | 13 |

---

## Task 1: Scaffolding, primer push y Vercel

Esta tarea existe sola porque desbloquea el requisito del profesor (repo enlazado con Vercel) y porque el repo vacío era justamente lo que impedía enlazarlo. Termina con una URL pública andando.

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore`, `src/main.jsx`, `src/App.jsx`
- Create: `public/logo.jpg` (copia del logo existente)

**Interfaces:**
- Consumes: nada
- Produces: proyecto Vite que compila; `npm run dev` y `npm run build` funcionando

- [ ] **Step 1: Crear el proyecto Vite**

Desde `LaPostaParrilla/` (la carpeta ya existe y ya es un repo git con 3 commits de docs). Vite se niega a scaffoldear en una carpeta con contenido, así que se genera al lado y se mueve:

```bash
cd ..
npm create vite@latest _tmp-posta -- --template react
cd _tmp-posta
# mover todo menos node_modules a LaPostaParrilla
mv package.json vite.config.js index.html eslint.config.js ../LaPostaParrilla/
mv src/main.jsx src/App.jsx ../LaPostaParrilla/src/ 2>/dev/null || (mkdir -p ../LaPostaParrilla/src && mv src/main.jsx src/App.jsx ../LaPostaParrilla/src/)
cd ../LaPostaParrilla
rm -rf ../_tmp-posta
rm -f src/App.css src/index.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 2: Instalar React Router**

```bash
npm install react-router-dom
npm install
```

- [ ] **Step 3: Copiar el logo y escribir `.gitignore`**

```bash
mkdir -p public/img/parrilla public/img/restaurante public/img/comunes
cp "../LogoLaPosta.jpg" public/logo.jpg
```

`.gitignore`:

```gitignore
node_modules/
dist/
dist-ssr/
*.local
.env
.env.*
!.env.example
.vercel
.DS_Store
Thumbs.db
*.log
.vite/
```

- [ ] **Step 4: Escribir `index.html`**

Reemplazar el generado por Vite. El `lang="es"` y la meta description importan para SEO y para la nota del TP.

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/jpeg" href="/logo.jpg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="La Posta — Parrilla y Restaurante en Villa La Angostura. Dos salones, cocina patagónica y reservas online."
    />
    <meta name="theme-color" content="#5F0004" />
    <title>La Posta · Parrilla & Restaurante · Villa La Angostura</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: `src/main.jsx` mínimo**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 6: `src/App.jsx` mínimo**

Provisorio. La Task 4 lo reemplaza por el layout real.

```jsx
export default function App() {
  return <h1>La Posta — en construcción</h1>;
}
```

- [ ] **Step 7: Verificar que compila**

```bash
npm run build
```

Esperado: termina con `built in ...`, sin errores ni warnings. Se crea `dist/`.

```bash
npm run dev
```

Esperado: sirve en `http://localhost:5173` y se ve "La Posta — en construcción". El favicon es el logo bordo.

- [ ] **Step 8: Commit y push**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Router

Sets up the build, the Spanish-language document shell with the brand
fonts preconnected, and the folder skeleton for per-venue images.
App.jsx is a placeholder until the layout lands."
git remote add origin https://github.com/giandicla/LaPostaParrilla.git
git push -u origin main
```

Si `git remote add` falla con "remote origin already exists", usar `git remote set-url origin https://github.com/giandicla/LaPostaParrilla.git`.

- [ ] **Step 9: Enlazar Vercel**

Manual, en el navegador. Con el repo ya con contenido, el problema anterior desaparece:

1. Entrar a `vercel.com` → **Add New** → **Project**.
2. **Import Git Repository** → autorizar GitHub si lo pide → elegir `giandicla/LaPostaParrilla`.
3. Vercel detecta **Vite** solo. Confirmar: Framework Preset `Vite`, Build Command `npm run build`, Output Directory `dist`.
4. **Deploy**.

Verificación: la URL que devuelve Vercel muestra "La Posta — en construcción".

Desde acá, cada `git push` a `main` redespliega solo.

---

## Task 2: Tokens de diseño y CSS global

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`
- Modify: `src/main.jsx` (importar los estilos)

**Interfaces:**
- Consumes: nada
- Produces: custom properties disponibles en todo el árbol — `--bordo-900`, `--bordo-700`, `--bordo-100`, `--crema`, `--blanco`, `--madera`, `--brasa`, `--carbon`, `--gris-600`, `--gris-300`, `--font-titulo`, `--font-cuerpo`, `--fs-hero`, `--fs-h1`, `--fs-h2`, `--fs-h3`, `--fs-body`, `--fs-small`, `--sp-1` a `--sp-16`, `--radio-sm/md/lg`, `--sombra-sm/md`, `--ancho-max`, `--transicion`

- [ ] **Step 1: Escribir `src/styles/tokens.css`**

```css
:root {
  /* ---------- Marca ---------- */
  --bordo-900: #5F0004;  /* muestreado del logo real */
  --bordo-700: #7A1218;
  --bordo-100: #F2E3E3;

  /* ---------- Superficie ---------- */
  --crema: #F5EFE6;
  --blanco: #FFFFFF;

  /* ---------- Acentos ---------- */
  --madera: #8B5E3C;
  --brasa: #E8A33D;

  /* ---------- Texto ---------- */
  --carbon: #1C1512;
  --gris-600: #5A524C;
  --gris-300: #D8D0C6;

  /* ---------- Tipografía ---------- */
  --font-titulo: 'Playfair Display', Georgia, 'Times New Roman', serif;
  --font-cuerpo: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --fs-hero: clamp(2.5rem, 8vw, 5rem);
  --fs-h1: clamp(2rem, 5vw, 3rem);
  --fs-h2: clamp(1.5rem, 3.5vw, 2.25rem);
  --fs-h3: clamp(1.15rem, 2vw, 1.4rem);
  --fs-body: 1rem;
  --fs-small: 0.875rem;

  --lh-titulo: 1.15;
  --lh-cuerpo: 1.65;

  /* ---------- Espaciado (escala de 4px) ---------- */
  --sp-1: 0.25rem;
  --sp-2: 0.5rem;
  --sp-3: 0.75rem;
  --sp-4: 1rem;
  --sp-6: 1.5rem;
  --sp-8: 2rem;
  --sp-12: 3rem;
  --sp-16: 4rem;
  --sp-24: 6rem;

  /* ---------- Forma ---------- */
  --radio-sm: 4px;
  --radio-md: 8px;
  --radio-lg: 16px;

  /* Sombras cálidas, nunca negro puro */
  --sombra-sm: 0 2px 8px rgba(28, 21, 18, 0.08);
  --sombra-md: 0 4px 16px rgba(28, 21, 18, 0.10);
  --sombra-lg: 0 12px 32px rgba(28, 21, 18, 0.16);

  /* ---------- Layout ---------- */
  --ancho-max: 1180px;
  --alto-navbar: 72px;

  --transicion: 200ms ease;
}
```

- [ ] **Step 2: Escribir `src/styles/global.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

html {
  scroll-behavior: smooth;
  /* que el scroll a una sección no quede tapado por la navbar fija */
  scroll-padding-top: var(--alto-navbar);
}

body {
  min-height: 100svh;
  background-color: var(--crema);
  color: var(--carbon);
  font-family: var(--font-cuerpo);
  font-size: var(--fs-body);
  line-height: var(--lh-cuerpo);
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3 {
  font-family: var(--font-titulo);
  line-height: var(--lh-titulo);
  font-weight: 600;
  text-wrap: balance;
}

h1 { font-size: var(--fs-h1); }
h2 { font-size: var(--fs-h2); }
h3 { font-size: var(--fs-h3); }

p {
  text-wrap: pretty;
}

img,
picture,
svg {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select,
textarea {
  font: inherit;
  color: inherit;
}

ul, ol {
  list-style: none;
  padding: 0;
}

/* Foco visible y consistente en todo el sitio */
:focus-visible {
  outline: 3px solid var(--brasa);
  outline-offset: 2px;
  border-radius: var(--radio-sm);
}

/* Respetar a quien pidió menos movimiento */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Solo para lectores de pantalla */
.visualmente-oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 3: Importar en `src/main.jsx`**

El orden importa: `tokens.css` antes que `global.css`, porque global usa las variables.

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Verificar**

```bash
npm run dev
```

Esperado, mirando la página:
- El fondo es crema (`#F5EFE6`), no blanco.
- El `<h1>` se ve en serif (Playfair Display), no en la sans del sistema.
- En DevTools → Elements → `:root`, aparecen las custom properties listadas.

```bash
npm run build
```

Esperado: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/styles src/main.jsx
git commit -m "feat: add design tokens and global stylesheet

The palette is built around #5F0004, sampled from the restaurant's
actual logo. Type scales with clamp() so text sizing needs no
breakpoints of its own.

Global CSS sets a warm cream default, a visible focus ring, and honours
prefers-reduced-motion."
git push
```

---

## Task 3: Capa de datos y placeholders de imagen

Esta es la tarea que define el modelo de dos locales. Todo lo demás consume lo que se escribe acá.

**Files:**
- Create: `src/data/marca.js`, `src/data/locales.js`, `src/data/menu.js`, `src/data/textos.js`
- Create: `scripts/gen-placeholders.mjs`
- Create: `public/img/**` (generados por el script)

**Interfaces:**
- Produces:
  - `MARCA` — objeto con `nombre`, `nombreCorto`, `bajada`, `ciudad`, `instagram`, `instagramUrl`, `email`, `logo`
  - `LOCALES` — array de objetos local
  - `getLocal(id)` → objeto local o `undefined`
  - `ID_LOCAL_POR_DEFECTO` → string, el id del primer local
  - `esIdDeLocal(id)` → boolean
  - `getCarta(idLocal)` → array de `{ categoria, platos: [{ nombre, descripcion, precio }] }`
  - `getDestacados()` → array de `{ nombre, descripcion, precio, imagen, idLocal, nombreLocal }`
  - `TEXTOS` — objeto con `bienvenida`, `historia`, `condicionesReserva`

Forma de un objeto local (la consumen `LocalCard`, `InfoLocal`, `Carta`, `Reservas`, `Nosotros`):

```
{ id, nombre, nombreCorto, tagline, descripcion, direccion, mapaEmbedUrl,
  telefono, whatsapp, cartaUrl, horarios: [{dia, franja}],
  franjasReserva: [string], imagenes: { hero, galeria: [{src, alt}] } }
```

- [ ] **Step 1: Escribir `src/data/marca.js`**

```js
// Datos comunes a los dos locales. Lo que es propio de cada uno vive en locales.js

export const MARCA = {
  nombre: 'La Posta',
  nombreCompleto: 'La Posta · Parrilla & Restaurante',
  bajada: 'Parrilla & Restaurante · Villa La Angostura',
  ciudad: 'Villa La Angostura, Neuquén',
  // El Instagram es uno solo y cubre los dos locales
  instagram: '@lapostavla',
  instagramUrl: 'https://www.instagram.com/lapostavla/',
  email: 'contacto@lapostavla.com', // PENDIENTE: confirmar con la familia
  logo: '/logo.jpg',
};
```

- [ ] **Step 2: Escribir `src/data/locales.js`**

Los `// PENDIENTE` marcan lo que la familia todavía no pasó. El teléfono de la parrilla es dato confirmado.

```js
// Los dos salones de La Posta.
//
// Son DATOS, no rutas: los componentes iteran sobre LOCALES o reciben un
// objeto local por props. Nadie escribe 'parrilla' ni 'restaurante' a mano.
// Sumar un tercer local es agregar un objeto a este array.

export const LOCALES = [
  {
    id: 'parrilla',
    nombre: 'La Posta Parrilla',
    nombreCorto: 'La Parrilla',
    tagline: 'Brasas, cordero y fuegos patagónicos',
    descripcion:
      'Nuestro salón de parrilla, con la leña a la vista y los cortes al asador. ' +
      'El lugar para una mesa larga, sin apuro, frente al fuego.',
    direccion: 'Villa La Angostura, Neuquén', // PENDIENTE: dirección exacta
    mapaEmbedUrl:
      'https://maps.google.com/maps?q=Villa%20La%20Angostura&z=14&output=embed', // PENDIENTE: embed del local
    telefono: '+54 9 2944 96-6199',
    whatsapp: '5492944966199', // formato para wa.me, sin + ni espacios
    cartaUrl:
      'https://www.canva.com/design/DAGkMvwV_fU/XfpQdDldp_dO58eCMU5Sdg/edit',
    horarios: [
      // PENDIENTE: horarios reales, incluyendo días de cierre y temporada baja
      { dia: 'Lunes a Jueves', franja: '12:00 – 15:00 · 20:00 – 23:30' },
      { dia: 'Viernes y Sábado', franja: '12:00 – 15:30 · 20:00 – 00:00' },
      { dia: 'Domingo', franja: '12:00 – 16:00' },
    ],
    // PENDIENTE: franjas reales de reserva
    franjasReserva: [
      '12:30', '13:00', '13:30', '14:00',
      '20:00', '20:30', '21:00', '21:30', '22:00',
    ],
    imagenes: {
      hero: '/img/parrilla/hero.svg',
      galeria: [
        { src: '/img/parrilla/galeria-1.svg', alt: 'Salón de la parrilla con mesas de madera' },
        { src: '/img/parrilla/galeria-2.svg', alt: 'Cortes de carne al asador sobre las brasas' },
        { src: '/img/parrilla/galeria-3.svg', alt: 'Detalle del fuego y la leña de la parrilla' },
      ],
    },
  },
  {
    id: 'restaurante',
    nombre: 'La Posta Restaurante',
    nombreCorto: 'El Restaurante',
    tagline: 'Cocina de montaña, pastas y pesca del lago',
    descripcion:
      'Nuestro salón de restaurante, más recogido y a media luz. ' +
      'Platos de olla, pastas caseras y la trucha del lago.',
    direccion: 'Villa La Angostura, Neuquén', // PENDIENTE: dirección exacta
    mapaEmbedUrl:
      'https://maps.google.com/maps?q=Villa%20La%20Angostura&z=14&output=embed', // PENDIENTE: embed del local
    telefono: null, // PENDIENTE: la familia tiene que pasarlo
    whatsapp: null, // PENDIENTE
    cartaUrl: null, // PENDIENTE: existe un segundo Canva, falta el link
    horarios: [
      // PENDIENTE: horarios reales
      { dia: 'Martes a Domingo', franja: '12:00 – 15:00 · 19:30 – 23:30' },
      { dia: 'Lunes', franja: 'Cerrado' },
    ],
    // PENDIENTE: franjas reales de reserva
    franjasReserva: [
      '12:30', '13:00', '13:30', '14:00',
      '19:30', '20:00', '20:30', '21:00', '21:30',
    ],
    imagenes: {
      hero: '/img/restaurante/hero.svg',
      galeria: [
        { src: '/img/restaurante/galeria-1.svg', alt: 'Salón del restaurante a media luz' },
        { src: '/img/restaurante/galeria-2.svg', alt: 'Mesa servida con pastas caseras' },
        { src: '/img/restaurante/galeria-3.svg', alt: 'Ventanal del restaurante con vista al bosque' },
      ],
    },
  },
];

export const ID_LOCAL_POR_DEFECTO = LOCALES[0].id;

export const getLocal = (id) => LOCALES.find((local) => local.id === id);

export const esIdDeLocal = (id) => LOCALES.some((local) => local.id === id);
```

- [ ] **Step 3: Escribir `src/data/menu.js`**

```js
// CARTAS DE EJEMPLO. Los platos y precios son inventados y están acá solo
// para maquetar. Se reemplazan cuando lleguen los PDF reales de cada local.

import { LOCALES } from './locales.js';

const CARTAS = {
  parrilla: [
    {
      categoria: 'Entradas',
      platos: [
        { nombre: 'Provoleta al orégano', descripcion: 'Provolone a la parrilla, orégano y aceite de oliva', precio: 9500 },
        { nombre: 'Empanadas de carne cortada a cuchillo', descripcion: 'Media docena, al horno de barro', precio: 12000 },
        { nombre: 'Tabla de ahumados patagónicos', descripcion: 'Ciervo, jabalí y trucha ahumada de la región', precio: 21000 },
      ],
    },
    {
      categoria: 'De la parrilla',
      platos: [
        { nombre: 'Cordero patagónico al asador', descripcion: 'Cocción lenta a la cruz, seis horas sobre las brasas', precio: 34000 },
        { nombre: 'Bife de chorizo', descripcion: '400 g, con papas rústicas al romero', precio: 27000 },
        { nombre: 'Entraña', descripcion: 'A punto, con chimichurri de la casa', precio: 25500 },
        { nombre: 'Parrillada para dos', descripcion: 'Asado, vacío, chorizo, morcilla y achuras', precio: 48000 },
      ],
    },
    {
      categoria: 'Guarniciones',
      platos: [
        { nombre: 'Papas al plomo', descripcion: 'Con manteca de hierbas', precio: 7000 },
        { nombre: 'Ensalada de estación', descripcion: 'Hojas verdes, tomate y cebolla morada', precio: 6500 },
      ],
    },
    {
      categoria: 'Postres',
      platos: [
        { nombre: 'Flan casero', descripcion: 'Con dulce de leche y crema', precio: 7500 },
        { nombre: 'Frutos rojos del bosque', descripcion: 'Con helado de crema americana', precio: 8500 },
      ],
    },
    {
      categoria: 'Bebidas',
      platos: [
        { nombre: 'Malbec de la Patagonia', descripcion: 'Copa o botella, consultar etiquetas', precio: 9000 },
        { nombre: 'Cerveza artesanal local', descripcion: 'Pinta, rubia o roja', precio: 6000 },
      ],
    },
  ],
  restaurante: [
    {
      categoria: 'Entradas',
      platos: [
        { nombre: 'Sopa de calabaza y jengibre', descripcion: 'Con crocante de panceta', precio: 9000 },
        { nombre: 'Trucha marinada en cítricos', descripcion: 'Del lago Nahuel Huapi, con eneldo', precio: 15500 },
      ],
    },
    {
      categoria: 'Pastas caseras',
      platos: [
        { nombre: 'Sorrentinos de ciervo', descripcion: 'Con salsa de hongos de pino', precio: 24000 },
        { nombre: 'Ñoquis de papa', descripcion: 'Con estofado de cordero de cocción lenta', precio: 22000 },
        { nombre: 'Ravioles de espinaca y ricota', descripcion: 'Con manteca de salvia', precio: 21000 },
      ],
    },
    {
      categoria: 'Principales',
      platos: [
        { nombre: 'Trucha del lago a la manteca negra', descripcion: 'Con papas andinas y alcaparras', precio: 28000 },
        { nombre: 'Ciervo braseado en Malbec', descripcion: 'Con puré de zanahoria ahumada', precio: 31000 },
        { nombre: 'Risotto de hongos', descripcion: 'Hongos de pino de la zona y queso de cabra', precio: 23000 },
      ],
    },
    {
      categoria: 'Postres',
      platos: [
        { nombre: 'Volcán de chocolate', descripcion: 'Con helado de dulce de leche', precio: 8500 },
        { nombre: 'Tarta de frambuesas', descripcion: 'De la chacra, con crema batida', precio: 8000 },
      ],
    },
    {
      categoria: 'Bebidas',
      platos: [
        { nombre: 'Pinot Noir patagónico', descripcion: 'Copa o botella, consultar etiquetas', precio: 9500 },
        { nombre: 'Limonada de la casa', descripcion: 'Con menta y jengibre', precio: 5500 },
      ],
    },
  ],
};

export const getCarta = (idLocal) => CARTAS[idLocal] ?? [];

// Dos platos de cada local, para que la home muestre las dos cocinas.
// Se deriva de LOCALES en vez de hardcodear ids.
export const getDestacados = () =>
  LOCALES.flatMap((local) => {
    const carta = getCarta(local.id);
    const platos = carta.flatMap((seccion) => seccion.platos);
    return platos.slice(1, 3).map((plato, i) => ({
      ...plato,
      idLocal: local.id,
      nombreLocal: local.nombreCorto,
      imagen: `/img/${local.id}/plato-${i + 1}.svg`,
    }));
  });

export const formatearPrecio = (precio) =>
  precio.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
```

- [ ] **Step 4: Escribir `src/data/textos.js`**

```js
// Copys largos, separados del JSX para que se puedan cambiar sin tocar componentes.
// PENDIENTE: la familia tiene que revisar y corregir estos textos — son un borrador.

export const TEXTOS = {
  bienvenida: {
    titulo: 'Dos salones, una misma mesa',
    parrafos: [
      'La Posta es un lugar de madera y fuego en el corazón de Villa La Angostura. ' +
        'Lo llevamos en familia desde hace años, y creció hasta ser dos salones con ' +
        'personalidad propia.',
      'En la parrilla mandan las brasas, el cordero al asador y las mesas largas. ' +
        'En el restaurante, las pastas caseras, la trucha del lago y una luz más baja. ' +
        'Dos maneras de pasar la misma noche.',
    ],
  },
  historia: {
    titulo: 'La familia detrás de La Posta',
    parrafos: [
      // PENDIENTE: historia real, año de fundación, nombres de la familia
      'Empezamos con un solo salón y la idea simple de cocinar como cocinábamos en casa: ' +
        'producto de la zona, cocciones largas y nada apurado.',
      'Con los años abrimos el segundo local, a unas cuadras del primero, para darle ' +
        'lugar propio a la cocina de olla sin sacarle espacio a la parrilla.',
      'Seguimos siendo los mismos: una familia, dos salones y la misma manera de recibir.',
    ],
  },
  condicionesReserva: [
    'Guardamos la mesa durante 15 minutos pasada la hora reservada.',
    'Para grupos de más de 12 personas, escribinos por WhatsApp y lo coordinamos.',
    'Si no podés venir, avisanos con anticipación así liberamos la mesa.',
    'Las reservas se confirman por WhatsApp o teléfono.',
  ],
};
```

- [ ] **Step 5: Escribir `scripts/gen-placeholders.mjs`**

No hay fotos reales todavía. Este script genera SVG de tono cálido con la proporción y el nombre correctos, para que la maqueta se vea como se va a ver de verdad. Cuando lleguen las fotos, se reemplazan los archivos y no se toca código.

```js
// Genera los placeholders de public/img/ hasta que lleguen las fotos reales.
// Uso: node scripts/gen-placeholders.mjs
//
// Cuando la familia pase las fotos: reemplazar cada .svg por el .jpg real y
// actualizar las extensiones en src/data/locales.js y src/data/menu.js.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PALETA = {
  parrilla: ['#5F0004', '#7A1218', '#8B5E3C'],
  restaurante: ['#3E2A22', '#8B5E3C', '#5F0004'],
  comunes: ['#5F0004', '#1C1512', '#8B5E3C'],
};

function svg({ ancho, alto, colores, etiqueta }) {
  const [a, b, c] = colores;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="${etiqueta}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="60%" stop-color="${b}"/>
      <stop offset="100%" stop-color="${c}"/>
    </linearGradient>
  </defs>
  <rect width="${ancho}" height="${alto}" fill="url(#g)"/>
  <g fill="#F5EFE6" opacity="0.55">
    <circle cx="${ancho * 0.75}" cy="${alto * 0.3}" r="${Math.min(ancho, alto) * 0.22}" opacity="0.12"/>
    <circle cx="${ancho * 0.2}" cy="${alto * 0.8}" r="${Math.min(ancho, alto) * 0.3}" opacity="0.08"/>
  </g>
  <text x="50%" y="50%" fill="#F5EFE6" opacity="0.8" font-family="Georgia, serif"
        font-size="${Math.round(Math.min(ancho, alto) * 0.075)}" text-anchor="middle" dominant-baseline="middle">
    ${etiqueta}
  </text>
</svg>`;
}

const ARCHIVOS = [
  // parrilla
  ['public/img/parrilla/hero.svg', 1920, 1080, 'parrilla', 'Salón parrilla'],
  ['public/img/parrilla/galeria-1.svg', 800, 600, 'parrilla', 'Salón'],
  ['public/img/parrilla/galeria-2.svg', 800, 1000, 'parrilla', 'Asador'],
  ['public/img/parrilla/galeria-3.svg', 800, 600, 'parrilla', 'Brasas'],
  ['public/img/parrilla/plato-1.svg', 600, 450, 'parrilla', 'Plato'],
  ['public/img/parrilla/plato-2.svg', 600, 450, 'parrilla', 'Plato'],
  ['public/img/parrilla/card.svg', 900, 700, 'parrilla', 'La Parrilla'],
  // restaurante
  ['public/img/restaurante/hero.svg', 1920, 1080, 'restaurante', 'Salón restaurante'],
  ['public/img/restaurante/galeria-1.svg', 800, 600, 'restaurante', 'Salón'],
  ['public/img/restaurante/galeria-2.svg', 800, 1000, 'restaurante', 'Mesa'],
  ['public/img/restaurante/galeria-3.svg', 800, 600, 'restaurante', 'Ventanal'],
  ['public/img/restaurante/plato-1.svg', 600, 450, 'restaurante', 'Plato'],
  ['public/img/restaurante/plato-2.svg', 600, 450, 'restaurante', 'Plato'],
  ['public/img/restaurante/card.svg', 900, 700, 'restaurante', 'El Restaurante'],
  // comunes
  ['public/img/comunes/hero-marca.svg', 1920, 1080, 'comunes', 'La Posta'],
  ['public/img/comunes/bienvenida-1.svg', 800, 600, 'comunes', 'La Posta'],
  ['public/img/comunes/bienvenida-2.svg', 800, 1000, 'comunes', 'La Posta'],
  ['public/img/comunes/bienvenida-3.svg', 800, 600, 'comunes', 'La Posta'],
];

for (const [ruta, ancho, alto, tema, etiqueta] of ARCHIVOS) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, svg({ ancho, alto, colores: PALETA[tema], etiqueta }), 'utf8');
  console.log('✓', ruta);
}

console.log(`\n${ARCHIVOS.length} placeholders generados.`);
```

Agregar el script a `package.json`, **sin borrar los que ya están** (Vite deja `lint`):

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "placeholders": "node scripts/gen-placeholders.mjs"
}
```

- [ ] **Step 6: Generar los placeholders y verificar**

```bash
npm run placeholders
ls public/img/parrilla public/img/restaurante public/img/comunes
```

Esperado: 18 archivos `.svg` creados, repartidos en las tres carpetas.

Verificar que los datos se importan sin romper — crear un chequeo descartable:

```bash
node --input-type=module -e "
import('./src/data/locales.js').then(async (m) => {
  const menu = await import('./src/data/menu.js');
  console.log('locales:', m.LOCALES.map(l => l.id).join(', '));
  console.log('por defecto:', m.ID_LOCAL_POR_DEFECTO);
  console.log('getLocal(restaurante):', m.getLocal('restaurante').nombre);
  console.log('esIdDeLocal(otro):', m.esIdDeLocal('otro'));
  console.log('categorias parrilla:', menu.getCarta('parrilla').length);
  console.log('destacados:', menu.getDestacados().length);
  console.log('precio:', menu.formatearPrecio(27000));
});
"
```

Esperado exactamente:
```
locales: parrilla, restaurante
por defecto: parrilla
getLocal(restaurante): La Posta Restaurante
esIdDeLocal(otro): false
categorias parrilla: 5
destacados: 4
precio: $ 27.000
```

Si `getDestacados()` no devuelve 4, revisar el `.slice(1, 3)`.

- [ ] **Step 7: Verificar los PENDIENTE**

```bash
grep -rn "PENDIENTE" src/
```

Esperado: al menos 10 coincidencias, todas en `src/data/`. Ninguna fuera de ahí.

- [ ] **Step 8: Commit**

```bash
git add src/data scripts public/img package.json
git commit -m "feat: add the data layer for both venues

LOCALES is the spine of the two-venue model: components map over it or
take a venue object as a prop, so neither id is ever written by hand and
a third venue would be one more object.

Unconfirmed values are marked // PENDIENTE so a grep finds them all. The
restaurante's phone and Canva link are null on purpose — the UI hides
those affordances rather than rendering a dead link.

Sample menus and a placeholder image generator stand in until the family
sends the real menus and photos; swapping them touches no code."
git push
```

---

## Task 4: Layout, router, Navbar y Footer

**Files:**
- Modify: `src/main.jsx`, `src/App.jsx`
- Create: `src/components/Navbar/Navbar.jsx`, `src/components/Navbar/Navbar.module.css`
- Create: `src/components/Footer/Footer.jsx`, `src/components/Footer/Footer.module.css`
- Create: `src/pages/Inicio/Inicio.jsx`, `src/pages/Carta/Carta.jsx`, `src/pages/Reservas/Reservas.jsx`, `src/pages/Nosotros/Nosotros.jsx` (stubs)

**Interfaces:**
- Consumes: `MARCA` de `marca.js`, `LOCALES` de `locales.js`
- Produces: rutas `/`, `/carta`, `/reservas`, `/nosotros`, y `*` → redirect a `/`. `App` como layout con `<Outlet/>`

- [ ] **Step 1: Crear los 4 stubs de página**

Los cuatro con la misma forma. Se completan en tareas posteriores.

`src/pages/Inicio/Inicio.jsx`:
```jsx
export default function Inicio() {
  return <main><h1>Inicio</h1></main>;
}
```

`src/pages/Carta/Carta.jsx`:
```jsx
export default function Carta() {
  return <main><h1>Carta</h1></main>;
}
```

`src/pages/Reservas/Reservas.jsx`:
```jsx
export default function Reservas() {
  return <main><h1>Reservas</h1></main>;
}
```

`src/pages/Nosotros/Nosotros.jsx`:
```jsx
export default function Nosotros() {
  return <main><h1>Nosotros</h1></main>;
}
```

- [ ] **Step 2: Escribir `src/App.jsx` — el layout**

```jsx
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';

// En una SPA el navegador no resetea el scroll al cambiar de ruta.
// Sin esto, entrás a /carta y aparecés a mitad de página.
function ScrollAlTope() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollAlTope />
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Escribir `src/main.jsx` con el router**

```jsx
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
```

- [ ] **Step 4: Escribir `src/components/Navbar/Navbar.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { MARCA } from '../../data/marca.js';
import estilos from './Navbar.module.css';

const ENLACES = [
  { a: '/', texto: 'Inicio' },
  { a: '/carta', texto: 'Carta' },
  { a: '/nosotros', texto: 'Nosotros' },
];

export default function Navbar() {
  const [scrolleada, setScrolleada] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  // La navbar arranca translúcida sobre el hero y se vuelve sólida al bajar
  useEffect(() => {
    const alScrollear = () => setScrolleada(window.scrollY > 80);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  // Cerrar el menú mobile al navegar
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  // Con el menú abierto, el fondo no debe scrollear
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  // Fuera del inicio la navbar es siempre sólida: no hay hero debajo
  const solida = scrolleada || menuAbierto || pathname !== '/';

  return (
    <header className={`${estilos.navbar} ${solida ? estilos.solida : ''}`}>
      <nav className={estilos.contenedor} aria-label="Navegación principal">
        <Link to="/" className={estilos.marca}>
          <img src={MARCA.logo} alt="" className={estilos.logo} />
          <span className={estilos.nombreMarca}>{MARCA.nombre}</span>
        </Link>

        <ul className={`${estilos.enlaces} ${menuAbierto ? estilos.enlacesAbiertos : ''}`}>
          {ENLACES.map((enlace) => (
            <li key={enlace.a}>
              <NavLink
                to={enlace.a}
                className={({ isActive }) =>
                  `${estilos.enlace} ${isActive ? estilos.enlaceActivo : ''}`
                }
                end={enlace.a === '/'}
              >
                {enlace.texto}
              </NavLink>
            </li>
          ))}
          <li className={estilos.itemReservar}>
            <Link to="/reservas" className={estilos.botonReservar}>
              Reservar
            </Link>
          </li>
        </ul>

        <button
          type="button"
          className={estilos.hamburguesa}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`${estilos.barra} ${menuAbierto ? estilos.barraX1 : ''}`} />
          <span className={`${estilos.barra} ${menuAbierto ? estilos.barraOculta : ''}`} />
          <span className={`${estilos.barra} ${menuAbierto ? estilos.barraX2 : ''}`} />
        </button>
      </nav>
    </header>
  );
}
```

- [ ] **Step 5: Escribir `src/components/Navbar/Navbar.module.css`**

```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--alto-navbar);
  background: transparent;
  transition: background-color var(--transicion), box-shadow var(--transicion);
}

.solida {
  background-color: var(--bordo-900);
  box-shadow: var(--sombra-md);
}

.contenedor {
  max-width: var(--ancho-max);
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--sp-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
}

.marca {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  z-index: 2;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: var(--radio-sm);
  object-fit: cover;
}

.nombreMarca {
  font-family: var(--font-titulo);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--crema);
  letter-spacing: 0.02em;
}

/* ---------- Mobile: panel deslizante ---------- */
.enlaces {
  position: fixed;
  inset: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-8);
  background-color: var(--bordo-900);
  transform: translateX(100%);
  transition: transform var(--transicion);
  visibility: hidden;
}

.enlacesAbiertos {
  transform: translateX(0);
  visibility: visible;
}

.enlace {
  color: var(--crema);
  font-size: 1.5rem;
  font-weight: 500;
  padding: var(--sp-2) var(--sp-3);
  border-bottom: 2px solid transparent;
  transition: border-color var(--transicion), color var(--transicion);
}

.enlace:hover {
  color: var(--brasa);
}

.enlaceActivo {
  border-bottom-color: var(--brasa);
}

.botonReservar {
  display: inline-block;
  background-color: var(--brasa);
  color: var(--carbon);
  font-weight: 600;
  padding: var(--sp-3) var(--sp-6);
  border-radius: var(--radio-md);
  transition: background-color var(--transicion), transform var(--transicion);
}

.botonReservar:hover {
  background-color: var(--crema);
  transform: translateY(-1px);
}

.hamburguesa {
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 44px;
  height: 44px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.barra {
  display: block;
  width: 26px;
  height: 2px;
  margin: 0 auto;
  background-color: var(--crema);
  border-radius: 2px;
  transition: transform var(--transicion), opacity var(--transicion);
}

.barraX1 { transform: translateY(7px) rotate(45deg); }
.barraX2 { transform: translateY(-7px) rotate(-45deg); }
.barraOculta { opacity: 0; }

/* ---------- Desktop ---------- */
@media (min-width: 768px) {
  .enlaces {
    position: static;
    flex-direction: row;
    gap: var(--sp-6);
    background: none;
    transform: none;
    visibility: visible;
    inset: auto;
  }

  .enlace {
    font-size: var(--fs-body);
  }

  .hamburguesa {
    display: none;
  }
}
```

- [ ] **Step 6: Escribir `src/components/Footer/Footer.jsx`**

Muestra las dos direcciones iterando `LOCALES`, y el Instagram una sola vez porque es compartido.

```jsx
import { Link } from 'react-router-dom';
import { MARCA } from '../../data/marca.js';
import { LOCALES } from '../../data/locales.js';
import estilos from './Footer.module.css';

export default function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className={estilos.footer}>
      <div className={estilos.contenedor}>
        <div className={estilos.columnaMarca}>
          <img src={MARCA.logo} alt="" className={estilos.logo} />
          <p className={estilos.bajada}>{MARCA.bajada}</p>
          <a
            href={MARCA.instagramUrl}
            className={estilos.instagram}
            target="_blank"
            rel="noreferrer"
          >
            {MARCA.instagram}
          </a>
        </div>

        {LOCALES.map((local) => (
          <div key={local.id} className={estilos.columna}>
            <h3 className={estilos.tituloColumna}>{local.nombreCorto}</h3>
            <address className={estilos.direccion}>{local.direccion}</address>
            {local.telefono && (
              <a href={`tel:${local.telefono.replace(/\s|-/g, '')}`} className={estilos.enlace}>
                {local.telefono}
              </a>
            )}
          </div>
        ))}

        <nav className={estilos.columna} aria-label="Navegación del pie">
          <h3 className={estilos.tituloColumna}>Secciones</h3>
          <Link to="/" className={estilos.enlace}>Inicio</Link>
          <Link to="/carta" className={estilos.enlace}>Carta</Link>
          <Link to="/reservas" className={estilos.enlace}>Reservas</Link>
          <Link to="/nosotros" className={estilos.enlace}>Nosotros</Link>
        </nav>
      </div>

      <p className={estilos.credito}>
        © {anio} {MARCA.nombre} · {MARCA.ciudad}
      </p>
    </footer>
  );
}
```

- [ ] **Step 7: Escribir `src/components/Footer/Footer.module.css`**

```css
.footer {
  background-color: var(--bordo-900);
  color: var(--crema);
  padding: var(--sp-16) var(--sp-4) var(--sp-8);
}

.contenedor {
  max-width: var(--ancho-max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-8);
}

.columnaMarca,
.columna {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  align-items: flex-start;
}

.logo {
  width: 64px;
  height: 64px;
  border-radius: var(--radio-md);
  margin-bottom: var(--sp-2);
}

.bajada {
  font-size: var(--fs-small);
  opacity: 0.85;
  max-width: 28ch;
}

.instagram {
  color: var(--brasa);
  font-weight: 500;
  margin-top: var(--sp-2);
}

.instagram:hover {
  text-decoration: underline;
}

.tituloColumna {
  font-size: var(--fs-h3);
  color: var(--crema);
  margin-bottom: var(--sp-2);
}

.direccion {
  font-style: normal;
  font-size: var(--fs-small);
  opacity: 0.85;
}

.enlace {
  font-size: var(--fs-small);
  opacity: 0.85;
  transition: opacity var(--transicion), color var(--transicion);
}

.enlace:hover {
  opacity: 1;
  color: var(--brasa);
}

.credito {
  max-width: var(--ancho-max);
  margin: var(--sp-12) auto 0;
  padding-top: var(--sp-6);
  border-top: 1px solid rgba(245, 239, 230, 0.2);
  font-size: var(--fs-small);
  opacity: 0.7;
  text-align: center;
}

@media (min-width: 768px) {
  .contenedor {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--sp-12);
  }
}

@media (min-width: 1100px) {
  .contenedor {
    grid-template-columns: 1.4fr 1fr 1fr 1fr;
  }
}
```

- [ ] **Step 8: Verificar**

```bash
npm run dev
```

Chequeos concretos, en desktop (1440px):
- La navbar está fija arriba, translúcida sobre el fondo crema del Inicio, y se vuelve bordo sólida al scrollear más de 80px.
- En `/carta` la navbar está bordo desde el principio, sin scrollear.
- Clic en Inicio / Carta / Nosotros cambia el contenido y el link activo queda subrayado en naranja brasa.
- El botón "Reservar" lleva a `/reservas`.
- Escribir `localhost:5173/cualquiercosa` redirige a `/`.
- El footer muestra **dos** columnas de local (La Parrilla y El Restaurante), y el teléfono aparece solo en la parrilla.
- El Instagram aparece **una sola vez**.

En mobile (360px, DevTools):
- Los links desaparecen y queda la hamburguesa.
- Al tocarla, se abre un panel bordo a pantalla completa y las barras se convierten en una X.
- El fondo no scrollea con el panel abierto.
- Al elegir un link, el panel se cierra solo.

```bash
npm run build
```

Esperado: sin errores.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add layout shell with navbar, footer and routing

Four routes behind a shared layout. Unknown paths redirect home rather
than 404ing, which is enough for a four-page site.

The navbar rides transparent over the home hero and turns solid past
80px; on every other route it starts solid, since there is no hero
underneath. Mobile gets a full-screen panel that locks background scroll
while open.

The footer lists both venues by mapping over LOCALES, and shows the
shared Instagram once. A venue without a phone simply omits it.

SPAs do not reset scroll between routes, so the layout does it."
git push
```

---

## Task 5: Primitivas — Boton y Section

Dos componentes chicos que usa todo el resto. Van juntos porque ninguno de los dos justifica su propio ciclo de review.

**Files:**
- Create: `src/components/Boton/Boton.jsx`, `src/components/Boton/Boton.module.css`
- Create: `src/components/Section/Section.jsx`, `src/components/Section/Section.module.css`

**Interfaces:**
- Consumes: nada (solo React Router para `<Link>`)
- Produces:
  - `<Boton variante="primario|contorno|texto" tamano="md|lg" to="/ruta" href="url" onClick={fn}>` — renderiza `<Link>` si tiene `to`, `<a>` si tiene `href`, `<button>` si no
  - `<Section id fondo="crema|bordo|bordoClaro" titulo bajada ancho="normal|angosto">` — envuelve children con ancho máximo y padding vertical

- [ ] **Step 1: Escribir `src/components/Boton/Boton.jsx`**

Un solo componente que decide qué etiqueta HTML usar según las props. Evita tener tres componentes casi iguales.

```jsx
import { Link } from 'react-router-dom';
import estilos from './Boton.module.css';

export default function Boton({
  variante = 'primario',
  tamano = 'md',
  to,
  href,
  children,
  className = '',
  ...resto
}) {
  const clases = `${estilos.boton} ${estilos[variante]} ${estilos[tamano]} ${className}`;

  // Navegación interna: Link de React Router, para no recargar la página
  if (to) {
    return (
      <Link to={to} className={clases} {...resto}>
        {children}
      </Link>
    );
  }

  // Link externo: siempre en pestaña nueva, con rel de seguridad
  if (href) {
    return (
      <a href={href} className={clases} target="_blank" rel="noreferrer" {...resto}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={clases} {...resto}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Escribir `src/components/Boton/Boton.module.css`**

```css
.boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  font-family: var(--font-cuerpo);
  font-weight: 600;
  text-align: center;
  border: 2px solid transparent;
  border-radius: var(--radio-md);
  cursor: pointer;
  transition: background-color var(--transicion), color var(--transicion),
    border-color var(--transicion), transform var(--transicion);
}

.boton:hover {
  transform: translateY(-2px);
}

.boton:active {
  transform: translateY(0);
}

/* ---------- Tamaños ---------- */
.md {
  padding: var(--sp-3) var(--sp-6);
  font-size: var(--fs-body);
}

.lg {
  padding: var(--sp-4) var(--sp-8);
  font-size: 1.05rem;
}

/* ---------- Variantes ---------- */
.primario {
  background-color: var(--bordo-900);
  color: var(--crema);
  border-color: var(--bordo-900);
}

.primario:hover {
  background-color: var(--bordo-700);
  border-color: var(--bordo-700);
}

.contorno {
  background-color: transparent;
  color: var(--crema);
  border-color: var(--crema);
}

.contorno:hover {
  background-color: var(--crema);
  color: var(--bordo-900);
}

.texto {
  background: none;
  border-color: transparent;
  color: var(--bordo-900);
  padding-left: 0;
  padding-right: 0;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.texto:hover {
  color: var(--madera);
}

.boton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

- [ ] **Step 3: Escribir `src/components/Section/Section.jsx`**

```jsx
import estilos from './Section.module.css';

export default function Section({
  id,
  fondo = 'crema',
  titulo,
  bajada,
  ancho = 'normal',
  children,
  className = '',
}) {
  return (
    <section id={id} className={`${estilos.seccion} ${estilos[fondo]} ${className}`}>
      <div className={`${estilos.contenedor} ${estilos[ancho]}`}>
        {titulo && (
          <header className={estilos.encabezado}>
            <h2 className={estilos.titulo}>{titulo}</h2>
            {bajada && <p className={estilos.bajada}>{bajada}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Escribir `src/components/Section/Section.module.css`**

```css
.seccion {
  padding: var(--sp-16) var(--sp-4);
}

.crema {
  background-color: var(--crema);
  color: var(--carbon);
}

.bordoClaro {
  background-color: var(--bordo-100);
  color: var(--carbon);
}

.bordo {
  background-color: var(--bordo-900);
  color: var(--crema);
}

.contenedor {
  margin: 0 auto;
}

.normal {
  max-width: var(--ancho-max);
}

.angosto {
  max-width: 68ch;
}

.encabezado {
  margin-bottom: var(--sp-12);
  text-align: center;
}

.titulo {
  position: relative;
  display: inline-block;
  padding-bottom: var(--sp-3);
}

/* Subrayado corto en brasa, centrado bajo el título */
.titulo::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 3px;
  background-color: var(--brasa);
  border-radius: 2px;
}

.bajada {
  margin-top: var(--sp-4);
  color: var(--gris-600);
  max-width: 60ch;
  margin-left: auto;
  margin-right: auto;
}

/* Sobre fondo bordo el texto secundario tiene que aclararse */
.bordo .bajada {
  color: rgba(245, 239, 230, 0.85);
}

@media (min-width: 768px) {
  .seccion {
    padding: var(--sp-24) var(--sp-8);
  }
}
```

- [ ] **Step 5: Verificar con un render temporal**

Reemplazar el contenido de `src/pages/Inicio/Inicio.jsx` por esto, **solo para probar**:

```jsx
import Section from '../../components/Section/Section.jsx';
import Boton from '../../components/Boton/Boton.jsx';

export default function Inicio() {
  return (
    <main>
      <Section titulo="Prueba en crema" bajada="Bajada de ejemplo para ver el ancho.">
        <Boton to="/carta">Primario interno</Boton>{' '}
        <Boton href="https://www.canva.com" variante="texto">Texto externo</Boton>{' '}
        <Boton onClick={() => alert('click')}>Botón real</Boton>
      </Section>
      <Section fondo="bordo" titulo="Prueba en bordo" bajada="Misma bajada, otro fondo.">
        <Boton variante="contorno" tamano="lg" to="/reservas">Contorno grande</Boton>
      </Section>
    </main>
  );
}
```

```bash
npm run dev
```

Chequeos:
- La primera sección es crema, la segunda bordo, y el texto de bajada se lee bien en las dos.
- Los títulos tienen un subrayado naranja corto y centrado.
- "Primario interno" navega a `/carta` **sin recargar** la página.
- "Texto externo" abre Canva en una **pestaña nueva**.
- "Botón real" muestra el `alert`.
- Los tres se levantan 2px al pasar el mouse.
- Con Tab, cada botón muestra un anillo naranja de foco.

Después de verificar, **dejar el Inicio como estaba** (`<main><h1>Inicio</h1></main>`); la Task 6 lo escribe de verdad.

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Boton src/components/Section
git commit -m "feat: add Boton and Section primitives

Boton picks its element from its props - Link for internal navigation,
anchor for external (always new tab, with a safe rel), button otherwise
- so callers never have to think about which one they need.

Section owns the vertical rhythm, max width and background of every
block on the site, which keeps that spacing in one file instead of
scattered across pages."
git push
```

---

## Task 6: Hero y los dos primeros bloques del Inicio

**Files:**
- Create: `src/components/Hero/Hero.jsx`, `src/components/Hero/Hero.module.css`
- Modify: `src/pages/Inicio/Inicio.jsx`
- Create: `src/pages/Inicio/Inicio.module.css`

**Interfaces:**
- Consumes: `Boton`, `Section` (Task 5), `MARCA` (Task 3), `TEXTOS` (Task 3)
- Produces: `<Hero titulo bajada imagen alt conLogo compacto acciones />` donde `acciones` es un nodo React

- [ ] **Step 1: Escribir `src/components/Hero/Hero.jsx`**

Reutilizable: el Inicio lo usa a pantalla completa con logo, y las otras páginas en versión compacta sin logo.

```jsx
import { MARCA } from '../../data/marca.js';
import estilos from './Hero.module.css';

export default function Hero({
  titulo,
  bajada,
  imagen,
  alt = '',
  conLogo = false,
  compacto = false,
  acciones,
}) {
  return (
    <header className={`${estilos.hero} ${compacto ? estilos.compacto : ''}`}>
      <img
        src={imagen}
        alt={alt}
        className={estilos.fondo}
        /* el hero es lo primero que se ve: no se difiere su carga */
        fetchPriority="high"
      />
      <div className={estilos.velo} aria-hidden="true" />

      <div className={estilos.contenido}>
        {conLogo && <img src={MARCA.logo} alt="" className={estilos.logo} />}
        <h1 className={compacto ? estilos.tituloCompacto : estilos.titulo}>{titulo}</h1>
        {bajada && <p className={estilos.bajada}>{bajada}</p>}
        {acciones && <div className={estilos.acciones}>{acciones}</div>}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Escribir `src/components/Hero/Hero.module.css`**

`100svh` y no `100vh`: en mobile, `vh` cuenta la barra del navegador y el hero queda cortado.

```css
.hero {
  position: relative;
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: calc(var(--alto-navbar) + var(--sp-8)) var(--sp-4) var(--sp-16);
  overflow: hidden;
  text-align: center;
  color: var(--crema);
}

.compacto {
  min-height: 52svh;
}

.fondo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Overlay bordo→carbón: garantiza contraste del texto sobre cualquier foto */
.velo {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(95, 0, 4, 0.55) 0%,
    rgba(28, 21, 18, 0.75) 100%
  );
}

.contenido {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-4);
  max-width: 62ch;
}

.logo {
  width: clamp(96px, 18vw, 140px);
  height: auto;
  border-radius: var(--radio-lg);
  box-shadow: var(--sombra-lg);
  margin-bottom: var(--sp-2);
}

.titulo {
  font-size: var(--fs-hero);
  letter-spacing: 0.01em;
  text-shadow: 0 2px 24px rgba(28, 21, 18, 0.5);
}

.tituloCompacto {
  font-size: var(--fs-h1);
  text-shadow: 0 2px 24px rgba(28, 21, 18, 0.5);
}

.bajada {
  font-size: clamp(1rem, 2vw, 1.2rem);
  opacity: 0.92;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-4);
  margin-top: var(--sp-6);
}
```

- [ ] **Step 3: Escribir el Inicio con hero + bienvenida**

`src/pages/Inicio/Inicio.jsx`. Los bloques de las Tasks 7, 8 y 9 se agregan después, en este mismo archivo.

```jsx
import Hero from '../../components/Hero/Hero.jsx';
import Section from '../../components/Section/Section.jsx';
import Boton from '../../components/Boton/Boton.jsx';
import { MARCA } from '../../data/marca.js';
import { TEXTOS } from '../../data/textos.js';
import estilos from './Inicio.module.css';

const FOTOS_BIENVENIDA = [
  { src: '/img/comunes/bienvenida-1.svg', alt: 'Salón de La Posta con mesas de madera' },
  { src: '/img/comunes/bienvenida-2.svg', alt: 'Detalle de la parrilla encendida' },
  { src: '/img/comunes/bienvenida-3.svg', alt: 'Plato servido en la mesa' },
];

export default function Inicio() {
  return (
    <main>
      <Hero
        imagen="/img/comunes/hero-marca.svg"
        alt=""
        conLogo
        titulo={MARCA.nombre}
        bajada={MARCA.bajada}
        acciones={
          <>
            <Boton to="/reservas" tamano="lg">Reservar mesa</Boton>
            <Boton to="/carta" variante="contorno" tamano="lg">Ver la carta</Boton>
          </>
        }
      />

      <Section>
        <div className={estilos.bienvenida}>
          <div className={estilos.textoBienvenida}>
            <h2>{TEXTOS.bienvenida.titulo}</h2>
            {TEXTOS.bienvenida.parrafos.map((parrafo) => (
              <p key={parrafo.slice(0, 24)}>{parrafo}</p>
            ))}
            <Boton to="/nosotros" variante="texto">Conocé nuestra historia</Boton>
          </div>

          <div className={estilos.fotosBienvenida}>
            {FOTOS_BIENVENIDA.map((foto) => (
              <img
                key={foto.src}
                src={foto.src}
                alt={foto.alt}
                loading="lazy"
                className={estilos.fotoBienvenida}
              />
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}
```

- [ ] **Step 4: Escribir `src/pages/Inicio/Inicio.module.css`**

```css
/* ---------- Bienvenida ---------- */
.bienvenida {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-12);
  align-items: center;
}

.textoBienvenida {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  align-items: flex-start;
}

.textoBienvenida h2 {
  margin-bottom: var(--sp-2);
}

.fotosBienvenida {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-3);
}

.fotoBienvenida {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radio-md);
  box-shadow: var(--sombra-sm);
}

/* La segunda foto es la vertical: ocupa la columna derecha entera */
.fotoBienvenida:nth-child(2) {
  grid-row: span 2;
  grid-column: 2;
}

.fotoBienvenida:nth-child(1),
.fotoBienvenida:nth-child(3) {
  grid-column: 1;
  aspect-ratio: 4 / 3;
}

@media (min-width: 900px) {
  .bienvenida {
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-16);
  }
}
```

- [ ] **Step 5: Verificar**

```bash
npm run dev
```

Chequeos en desktop (1440px):
- El hero ocupa toda la altura de la ventana. Se ve el logo bordo, "La Posta" en Playfair grande, la bajada en mayúsculas y dos botones.
- El texto se lee con claridad sobre la imagen (el overlay hace su trabajo).
- La navbar está translúcida sobre el hero y no tapa el logo.
- "Reservar mesa" va a `/reservas`; "Ver la carta" a `/carta`.
- Al scrollear, la navbar se vuelve bordo sólida.
- La bienvenida es de dos columnas: texto a la izquierda, tres fotos a la derecha con la del medio vertical ocupando toda la altura.

En mobile (360px):
- El hero entra completo, **sin recorte por la barra del navegador** (esto es lo que verifica el uso de `svh`).
- Los dos botones se apilan o se envuelven, sin desbordar.
- La bienvenida pasa a una sola columna: primero el texto, después las fotos.
- **No hay scroll horizontal.** Verificar en la consola: `document.documentElement.scrollWidth === document.documentElement.clientWidth` → `true`.

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero src/pages/Inicio
git commit -m "feat: add the hero and welcome block

The hero speaks for the brand, not for either venue - it is the one
place on the site where both rooms are presented as a single thing.

Height is 100svh rather than 100vh so the mobile browser chrome does not
crop it, and a bordo-to-charcoal overlay keeps the text readable over
whatever photo the family sends.

The welcome copy lives in textos.js, so changing it never means opening
a component."
git push
```

---

## Task 7: LocalCard y el bloque "Nuestros dos salones"

El bloque que resuelve la división del sitio. Es lo que hace que un visitante entienda, sin que se lo expliquen, que hay dos salones de la misma marca.

**Files:**
- Create: `src/components/LocalCard/LocalCard.jsx`, `src/components/LocalCard/LocalCard.module.css`
- Modify: `src/pages/Inicio/Inicio.jsx`, `src/pages/Inicio/Inicio.module.css`

**Interfaces:**
- Consumes: `LOCALES` (Task 3), `Section`, `Boton` (Task 5)
- Produces: `<LocalCard local={objetoLocal} />`. La card linkea a `/carta?local={id}` y `/reservas?local={id}`

- [ ] **Step 1: Escribir `src/components/LocalCard/LocalCard.jsx`**

Recibe el objeto local completo por props. No importa `locales.js`: así se puede reusar para un tercer local sin tocarlo.

```jsx
import Boton from '../Boton/Boton.jsx';
import estilos from './LocalCard.module.css';

export default function LocalCard({ local }) {
  // Resumen de horario: solo la primera franja, para no llenar la card
  const primerHorario = local.horarios[0];

  return (
    <article className={estilos.card}>
      <div className={estilos.marcoImagen}>
        <img
          src={`/img/${local.id}/card.svg`}
          alt={`Salón de ${local.nombre}`}
          loading="lazy"
          className={estilos.imagen}
        />
        <span className={estilos.etiqueta}>{local.nombreCorto}</span>
      </div>

      <div className={estilos.cuerpo}>
        <h3 className={estilos.nombre}>{local.nombre}</h3>
        <p className={estilos.tagline}>{local.tagline}</p>
        <p className={estilos.descripcion}>{local.descripcion}</p>

        <dl className={estilos.datos}>
          <div className={estilos.dato}>
            <dt>Dónde</dt>
            <dd>{local.direccion}</dd>
          </div>
          <div className={estilos.dato}>
            <dt>{primerHorario.dia}</dt>
            <dd>{primerHorario.franja}</dd>
          </div>
        </dl>

        <div className={estilos.acciones}>
          <Boton to={`/reservas?local=${local.id}`}>Reservar acá</Boton>
          <Boton to={`/carta?local=${local.id}`} variante="texto">
            Ver la carta
          </Boton>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Escribir `src/components/LocalCard/LocalCard.module.css`**

```css
.card {
  display: flex;
  flex-direction: column;
  background-color: var(--blanco);
  border-radius: var(--radio-lg);
  overflow: hidden;
  box-shadow: var(--sombra-md);
  transition: transform var(--transicion), box-shadow var(--transicion);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sombra-lg);
}

.marcoImagen {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 400ms ease;
}

.card:hover .imagen {
  transform: scale(1.04);
}

.etiqueta {
  position: absolute;
  top: var(--sp-4);
  left: var(--sp-4);
  background-color: var(--bordo-900);
  color: var(--crema);
  font-size: var(--fs-small);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: var(--sp-2) var(--sp-4);
  border-radius: 999px;
}

.cuerpo {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-6);
  flex: 1;
}

.nombre {
  color: var(--bordo-900);
}

.tagline {
  color: var(--madera);
  font-weight: 500;
  font-style: italic;
}

.descripcion {
  color: var(--gris-600);
  font-size: var(--fs-small);
}

.datos {
  display: grid;
  gap: var(--sp-3);
  margin: var(--sp-2) 0;
  padding: var(--sp-4) 0;
  border-top: 1px solid var(--gris-300);
  border-bottom: 1px solid var(--gris-300);
}

.dato dt {
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--carbon);
}

.dato dd {
  margin: 0;
  font-size: var(--fs-small);
  color: var(--gris-600);
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-4);
  margin-top: auto;
  padding-top: var(--sp-2);
}
```

- [ ] **Step 3: Agregar el bloque al Inicio**

En `src/pages/Inicio/Inicio.jsx`: agregar los imports y la sección **después** de la de bienvenida.

Imports nuevos:
```jsx
import LocalCard from '../../components/LocalCard/LocalCard.jsx';
import { LOCALES } from '../../data/locales.js';
```

Sección nueva, justo después del `</Section>` de la bienvenida:
```jsx
      <Section
        id="salones"
        fondo="bordoClaro"
        titulo="Nuestros dos salones"
        bajada="Dos propuestas de la misma familia, a pocas cuadras una de la otra. Elegí con cuál tenés ganas hoy."
      >
        <div className={estilos.grillaLocales}>
          {LOCALES.map((local) => (
            <LocalCard key={local.id} local={local} />
          ))}
        </div>
      </Section>
```

- [ ] **Step 4: Agregar la grilla a `Inicio.module.css`**

```css
/* ---------- Nuestros dos salones ---------- */
.grillaLocales {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-8);
}

@media (min-width: 900px) {
  .grillaLocales {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 5: Verificar**

```bash
npm run dev
```

Chequeos:
- Después de la bienvenida aparece una sección de fondo rosado claro con el título "Nuestros dos salones".
- Hay **exactamente dos** cards, lado a lado en desktop, apiladas en mobile.
- Cada card tiene su etiqueta bordo arriba a la izquierda ("La Parrilla" / "El Restaurante").
- Al pasar el mouse, la card se levanta y la imagen hace un zoom leve.
- Clic en "Reservar acá" de la parrilla → la URL queda `/reservas?local=parrilla`.
- Clic en "Ver la carta" del restaurante → la URL queda `/carta?local=restaurante`.
- Las dos cards tienen la misma altura, y los botones quedan alineados abajo aunque las descripciones midan distinto.

Verificación de la restricción del spec — ningún id escrito a mano:
```bash
grep -rn "'parrilla'\|\"parrilla\"\|'restaurante'\|\"restaurante\"" src/ --include=*.jsx
```
Esperado: **cero resultados**. Si aparece alguno, ese componente tiene que recibir el local por props.

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/LocalCard src/pages/Inicio
git commit -m "feat: add the two-venue block to the home page

This is the block that carries the whole split: two cards, rendered by
mapping over LOCALES, each linking to its own menu and its own
reservation with the venue already selected via the query string.

LocalCard takes the venue as a prop and never imports the data, so a
third venue would need no change to it at all.

Cards stretch to equal height so the actions line up regardless of how
long each description runs."
git push
```

---

## Task 8: PlatoCard y el bloque de destacados

**Files:**
- Create: `src/components/PlatoCard/PlatoCard.jsx`, `src/components/PlatoCard/PlatoCard.module.css`
- Modify: `src/pages/Inicio/Inicio.jsx`, `src/pages/Inicio/Inicio.module.css`

**Interfaces:**
- Consumes: `getDestacados`, `formatearPrecio` (Task 3), `Section`, `Boton` (Task 5)
- Produces: `<PlatoCard nombre descripcion precio imagen etiquetaLocal />`. `etiquetaLocal` es opcional: en la Carta no se pasa, porque ahí ya se sabe de qué local es

- [ ] **Step 1: Escribir `src/components/PlatoCard/PlatoCard.jsx`**

```jsx
import { formatearPrecio } from '../../data/menu.js';
import estilos from './PlatoCard.module.css';

export default function PlatoCard({ nombre, descripcion, precio, imagen, etiquetaLocal }) {
  return (
    <article className={estilos.card}>
      <div className={estilos.marcoImagen}>
        <img src={imagen} alt={nombre} loading="lazy" className={estilos.imagen} />
        {/* Solo en la home: en la carta el local ya está claro por el contexto */}
        {etiquetaLocal && <span className={estilos.etiqueta}>{etiquetaLocal}</span>}
      </div>

      <div className={estilos.cuerpo}>
        <h3 className={estilos.nombre}>{nombre}</h3>
        <p className={estilos.descripcion}>{descripcion}</p>
        <p className={estilos.precio}>{formatearPrecio(precio)}</p>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Escribir `src/components/PlatoCard/PlatoCard.module.css`**

Va sobre fondo bordo en la home, así que la card es crema para destacar.

```css
.card {
  display: flex;
  flex-direction: column;
  background-color: var(--crema);
  color: var(--carbon);
  border-radius: var(--radio-md);
  overflow: hidden;
  box-shadow: var(--sombra-md);
  transition: transform var(--transicion);
}

.card:hover {
  transform: translateY(-4px);
}

.marcoImagen {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.etiqueta {
  position: absolute;
  top: var(--sp-3);
  right: var(--sp-3);
  background-color: rgba(28, 21, 18, 0.82);
  color: var(--crema);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: var(--sp-1) var(--sp-3);
  border-radius: 999px;
}

.cuerpo {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-4);
  flex: 1;
}

.nombre {
  font-size: 1.1rem;
  color: var(--bordo-900);
}

.descripcion {
  font-size: var(--fs-small);
  color: var(--gris-600);
  flex: 1;
}

.precio {
  font-family: var(--font-titulo);
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--madera);
  margin-top: var(--sp-2);
}
```

- [ ] **Step 3: Agregar el bloque al Inicio**

Imports nuevos en `src/pages/Inicio/Inicio.jsx`:
```jsx
import PlatoCard from '../../components/PlatoCard/PlatoCard.jsx';
import { getDestacados } from '../../data/menu.js';
```

Constante, fuera del componente (los datos son estáticos, no hace falta recalcular en cada render):
```jsx
const DESTACADOS = getDestacados();
```

Sección nueva, después de la de los dos salones:
```jsx
      <Section
        fondo="bordo"
        titulo="Para empezar por algún lado"
        bajada="Dos platos de cada salón. La carta completa tiene bastante más."
      >
        <div className={estilos.grillaPlatos}>
          {DESTACADOS.map((plato) => (
            <PlatoCard
              key={`${plato.idLocal}-${plato.nombre}`}
              nombre={plato.nombre}
              descripcion={plato.descripcion}
              precio={plato.precio}
              imagen={plato.imagen}
              etiquetaLocal={plato.nombreLocal}
            />
          ))}
        </div>

        <div className={estilos.accionesPlatos}>
          <Boton to="/carta" variante="contorno" tamano="lg">
            Ver las dos cartas
          </Boton>
        </div>
      </Section>
```

- [ ] **Step 4: Agregar la grilla a `Inicio.module.css`**

```css
/* ---------- Destacados ---------- */
.grillaPlatos {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-6);
}

.accionesPlatos {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-12);
}

@media (min-width: 600px) {
  .grillaPlatos {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .grillaPlatos {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

- [ ] **Step 5: Verificar**

```bash
npm run dev
```

Chequeos:
- La sección tiene fondo bordo y las cards son crema.
- Hay **exactamente 4** platos: dos con la etiqueta "La Parrilla" y dos con "El Restaurante". Que haya dos de cada uno es el punto del bloque.
- Los precios se ven como `$ 27.000` (formato argentino, sin decimales).
- En desktop (1440px) son 4 columnas; en tablet (768px) 2; en mobile (360px) 1.
- El botón "Ver las dos cartas" es de contorno crema y se lee bien sobre el bordo.
- Las 4 cards tienen la misma altura aunque las descripciones midan distinto.

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/PlatoCard src/pages/Inicio
git commit -m "feat: add the highlights block

Two dishes from each venue, derived from LOCALES rather than listed by
hand, so the block always shows both kitchens. Each card carries a small
badge naming its venue - on the menu page that badge is omitted, since
the context already says which one you are reading.

Prices render through es-AR currency formatting in one place, so the
format never drifts between pages."
git push
```

---

## Task 9: GaleriaGrid, InfoLocal y el cierre del Inicio

Última tarea del Inicio. Deja la home con los 7 bloques del spec.

**Files:**
- Create: `src/components/GaleriaGrid/GaleriaGrid.jsx`, `src/components/GaleriaGrid/GaleriaGrid.module.css`
- Create: `src/components/InfoLocal/InfoLocal.jsx`, `src/components/InfoLocal/InfoLocal.module.css`
- Modify: `src/pages/Inicio/Inicio.jsx`, `src/pages/Inicio/Inicio.module.css`

**Interfaces:**
- Consumes: `LOCALES` (Task 3), `Section` (Task 5)
- Produces:
  - `<GaleriaGrid imagenes={[{src, alt}]} />` — espera 3 imágenes, la segunda vertical
  - `<InfoLocal local={objetoLocal} />` — horarios, mapa embebido y contacto de un local

`GaleriaGrid` se crea acá porque lo consumen las Tasks 9 y 12; se usa por primera vez en Nosotros.

- [ ] **Step 1: Escribir `src/components/GaleriaGrid/GaleriaGrid.jsx`**

```jsx
import estilos from './GaleriaGrid.module.css';

export default function GaleriaGrid({ imagenes }) {
  return (
    <ul className={estilos.grilla}>
      {imagenes.map((imagen) => (
        <li key={imagen.src} className={estilos.item}>
          <img src={imagen.src} alt={imagen.alt} loading="lazy" className={estilos.imagen} />
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Escribir `src/components/GaleriaGrid/GaleriaGrid.module.css`**

```css
.grilla {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-3);
  margin: 0;
}

.item {
  overflow: hidden;
  border-radius: var(--radio-md);
  box-shadow: var(--sombra-sm);
}

/* La segunda imagen es la vertical: ocupa las dos filas de la derecha */
.item:nth-child(2) {
  grid-row: span 2;
  grid-column: 2;
}

.item:nth-child(1),
.item:nth-child(3) {
  grid-column: 1;
}

.imagen {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 400ms ease;
}

.item:nth-child(1) .imagen,
.item:nth-child(3) .imagen {
  aspect-ratio: 4 / 3;
}

.item:hover .imagen {
  transform: scale(1.05);
}
```

- [ ] **Step 3: Escribir `src/components/InfoLocal/InfoLocal.jsx`**

Un local puede no tener teléfono todavía (el restaurante). El componente omite lo que falta en vez de mostrar un link muerto.

```jsx
import estilos from './InfoLocal.module.css';

export default function InfoLocal({ local }) {
  const telefonoLimpio = local.telefono?.replace(/\s|-/g, '');

  return (
    <article className={estilos.info}>
      <h3 className={estilos.nombre}>{local.nombre}</h3>
      <p className={estilos.tagline}>{local.tagline}</p>

      <div className={estilos.bloque}>
        <h4 className={estilos.subtitulo}>Horarios</h4>
        <dl className={estilos.horarios}>
          {local.horarios.map((horario) => (
            <div key={horario.dia} className={estilos.horario}>
              <dt>{horario.dia}</dt>
              <dd>{horario.franja}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={estilos.bloque}>
        <h4 className={estilos.subtitulo}>Dónde estamos</h4>
        <address className={estilos.direccion}>{local.direccion}</address>
        <div className={estilos.marcoMapa}>
          <iframe
            src={local.mapaEmbedUrl}
            title={`Mapa de ${local.nombre}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className={estilos.mapa}
          />
        </div>
      </div>

      <div className={estilos.contacto}>
        {/* Si el número todavía no lo pasó la familia, no se muestra nada */}
        {local.whatsapp && (
          <a
            href={`https://wa.me/${local.whatsapp}?text=${encodeURIComponent(
              `Hola! Quería consultar por una reserva en ${local.nombre}.`
            )}`}
            className={estilos.botonWhatsapp}
            target="_blank"
            rel="noreferrer"
          >
            Escribir por WhatsApp
          </a>
        )}
        {local.telefono ? (
          <a href={`tel:${telefonoLimpio}`} className={estilos.telefono}>
            {local.telefono}
          </a>
        ) : (
          <p className={estilos.sinTelefono}>Teléfono a confirmar</p>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Escribir `src/components/InfoLocal/InfoLocal.module.css`**

```css
.info {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  background-color: var(--blanco);
  border-radius: var(--radio-lg);
  padding: var(--sp-6);
  box-shadow: var(--sombra-sm);
  border-top: 4px solid var(--bordo-900);
}

.nombre {
  color: var(--bordo-900);
}

.tagline {
  color: var(--madera);
  font-style: italic;
  font-size: var(--fs-small);
}

.bloque {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.subtitulo {
  font-family: var(--font-cuerpo);
  font-size: var(--fs-small);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gris-600);
}

.horarios {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
}

.horario {
  display: flex;
  justify-content: space-between;
  gap: var(--sp-4);
  font-size: var(--fs-small);
  padding-bottom: var(--sp-2);
  border-bottom: 1px dashed var(--gris-300);
}

.horario dt {
  font-weight: 600;
}

.horario dd {
  margin: 0;
  color: var(--gris-600);
  text-align: right;
}

.direccion {
  font-style: normal;
  font-size: var(--fs-small);
  color: var(--gris-600);
}

.marcoMapa {
  border-radius: var(--radio-md);
  overflow: hidden;
  border: 1px solid var(--gris-300);
}

.mapa {
  display: block;
  width: 100%;
  height: 220px;
  border: 0;
}

.contacto {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-4);
  margin-top: auto;
  padding-top: var(--sp-4);
  border-top: 1px solid var(--gris-300);
}

.botonWhatsapp {
  background-color: var(--bordo-900);
  color: var(--crema);
  font-weight: 600;
  font-size: var(--fs-small);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--radio-md);
  transition: background-color var(--transicion);
}

.botonWhatsapp:hover {
  background-color: var(--bordo-700);
}

.telefono {
  font-weight: 600;
  color: var(--bordo-900);
}

.telefono:hover {
  text-decoration: underline;
}

.sinTelefono {
  font-size: var(--fs-small);
  color: var(--gris-600);
  font-style: italic;
}
```

- [ ] **Step 5: Cerrar el Inicio**

Import nuevo en `src/pages/Inicio/Inicio.jsx`:
```jsx
import InfoLocal from '../../components/InfoLocal/InfoLocal.jsx';
```

Sección nueva, la última antes de cerrar `</main>`:
```jsx
      <Section
        id="visitanos"
        titulo="Visitanos"
        bajada="Horarios, dirección y contacto de cada salón."
      >
        <div className={estilos.grillaInfo}>
          {LOCALES.map((local) => (
            <InfoLocal key={local.id} local={local} />
          ))}
        </div>
      </Section>
```

Y en `Inicio.module.css`:
```css
/* ---------- Visitanos ---------- */
.grillaInfo {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-8);
  align-items: stretch;
}

@media (min-width: 900px) {
  .grillaInfo {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 6: Verificar el Inicio completo**

```bash
npm run dev
```

Chequeo de los 7 bloques del spec, en orden, scrolleando de arriba a abajo:
1. Navbar fija
2. Hero a pantalla completa
3. Bienvenida
4. Nuestros dos salones (2 cards)
5. Destacados (4 platos, fondo bordo)
6. Visitanos (2 `InfoLocal`)
7. Footer bordo

Chequeos específicos de esta tarea:
- Los **dos mapas cargan** y muestran Villa La Angostura.
- La parrilla muestra el botón de WhatsApp **y** el teléfono `+54 9 2944 96-6199`.
- El restaurante **no muestra** botón de WhatsApp, y en lugar del teléfono dice "Teléfono a confirmar" en itálica. Esto es lo correcto: un dato faltante se omite, no se inventa.
- Clic en el WhatsApp de la parrilla abre `wa.me` con el mensaje precargado.
- Las dos tarjetas de info tienen la misma altura, con el bloque de contacto pegado abajo.

En mobile (360px): todo en una columna, sin scroll horizontal.

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/GaleriaGrid src/components/InfoLocal src/pages/Inicio
git commit -m "feat: complete the home page with venue info

InfoLocal renders one venue's hours, map and contact. Where the family
has not sent a number yet it omits the WhatsApp button and says the
phone is pending, rather than rendering a link that goes nowhere.

The home page now has all seven blocks the spec calls for."
git push
```

---

## Task 10: SelectorLocal y la página Carta

El local activo vive en la URL (`/carta?local=parrilla`), no en estado interno. Tres razones, en orden de peso: el link se puede compartir apuntando a una carta concreta, el botón "atrás" del navegador funciona como se espera, y las `LocalCard` del Inicio pueden linkear directo a la carta correcta.

**Files:**
- Create: `src/components/SelectorLocal/SelectorLocal.jsx`, `src/components/SelectorLocal/SelectorLocal.module.css`
- Modify: `src/pages/Carta/Carta.jsx`
- Create: `src/pages/Carta/Carta.module.css`

**Interfaces:**
- Consumes: `LOCALES`, `getLocal`, `esIdDeLocal`, `ID_LOCAL_POR_DEFECTO` (Task 3), `getCarta`, `formatearPrecio` (Task 3), `Hero` (Task 6), `Section`, `Boton` (Task 5)
- Produces: `<SelectorLocal locales={LOCALES} localActivoId={id} onChange={(id) => ...} />` — controlado: no guarda estado propio

- [ ] **Step 1: Escribir `src/components/SelectorLocal/SelectorLocal.jsx`**

Controlado a propósito. Si manejara el estado adentro habría dos fuentes de verdad, porque en la Carta el estado real es la URL.

```jsx
import estilos from './SelectorLocal.module.css';

export default function SelectorLocal({ locales, localActivoId, onChange }) {
  return (
    <div className={estilos.selector} role="tablist" aria-label="Elegir salón">
      {locales.map((local) => {
        const activo = local.id === localActivoId;
        return (
          <button
            key={local.id}
            type="button"
            role="tab"
            aria-selected={activo}
            className={`${estilos.opcion} ${activo ? estilos.activa : ''}`}
            onClick={() => onChange(local.id)}
          >
            {local.nombreCorto}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Escribir `src/components/SelectorLocal/SelectorLocal.module.css`**

Pegajoso al scrollear: sin esto habría que volver arriba de todo para cambiar de carta.

```css
.selector {
  position: sticky;
  top: var(--alto-navbar);
  z-index: 50;
  display: flex;
  gap: var(--sp-2);
  width: fit-content;
  margin: 0 auto var(--sp-12);
  padding: var(--sp-2);
  background-color: var(--blanco);
  border: 1px solid var(--gris-300);
  border-radius: 999px;
  box-shadow: var(--sombra-md);
}

.opcion {
  padding: var(--sp-3) var(--sp-6);
  background: none;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  color: var(--gris-600);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color var(--transicion), color var(--transicion);
}

.opcion:hover {
  color: var(--bordo-900);
}

.activa {
  background-color: var(--bordo-900);
  color: var(--crema);
}

.activa:hover {
  color: var(--crema);
}

@media (max-width: 420px) {
  .opcion {
    padding: var(--sp-3) var(--sp-4);
    font-size: var(--fs-small);
  }
}
```

- [ ] **Step 3: Escribir `src/pages/Carta/Carta.jsx`**

```jsx
import { useSearchParams } from 'react-router-dom';
import Hero from '../../components/Hero/Hero.jsx';
import Section from '../../components/Section/Section.jsx';
import Boton from '../../components/Boton/Boton.jsx';
import SelectorLocal from '../../components/SelectorLocal/SelectorLocal.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO } from '../../data/locales.js';
import { getCarta, formatearPrecio } from '../../data/menu.js';
import estilos from './Carta.module.css';

export default function Carta() {
  const [parametros, setParametros] = useSearchParams();

  // El local activo sale de la URL. Si el parámetro falta o es basura,
  // se cae al primer local en vez de romper.
  const idPedido = parametros.get('local');
  const idActivo = esIdDeLocal(idPedido) ? idPedido : ID_LOCAL_POR_DEFECTO;
  const local = getLocal(idActivo);
  const carta = getCarta(idActivo);

  // replace: cambiar de carta no debería llenar el historial de entradas
  const cambiarLocal = (id) => setParametros({ local: id }, { replace: true });

  return (
    <main>
      <Hero
        compacto
        imagen={local.imagenes.hero}
        alt=""
        titulo="Nuestra carta"
        bajada={local.nombre}
      />

      <Section>
        <SelectorLocal
          locales={LOCALES}
          localActivoId={idActivo}
          onChange={cambiarLocal}
        />

        <p className={estilos.aclaracion}>
          Precios de referencia. La carta puede cambiar según la temporada y lo que
          consigamos en la zona.
        </p>

        {/* Índice de categorías: ancla a cada bloque de la carta */}
        <nav className={estilos.indice} aria-label="Categorías de la carta">
          {carta.map((seccion) => (
            <a
              key={seccion.categoria}
              href={`#${idActivo}-${seccion.categoria}`}
              className={estilos.enlaceIndice}
            >
              {seccion.categoria}
            </a>
          ))}
        </nav>

        <div className={estilos.carta}>
          {carta.map((seccion) => (
            <section
              key={seccion.categoria}
              id={`${idActivo}-${seccion.categoria}`}
              className={estilos.categoria}
            >
              <h2 className={estilos.tituloCategoria}>{seccion.categoria}</h2>
              <ul className={estilos.platos}>
                {seccion.platos.map((plato) => (
                  <li key={plato.nombre} className={estilos.plato}>
                    <div className={estilos.lineaPlato}>
                      <h3 className={estilos.nombrePlato}>{plato.nombre}</h3>
                      <span className={estilos.puntos} aria-hidden="true" />
                      <span className={estilos.precioPlato}>
                        {formatearPrecio(plato.precio)}
                      </span>
                    </div>
                    <p className={estilos.descripcionPlato}>{plato.descripcion}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Section>

      <Section fondo="bordoClaro" ancho="angosto">
        <div className={estilos.bloqueCanva}>
          <h2>La carta oficial, siempre al día</h2>
          <p>
            La familia actualiza la carta de {local.nombreCorto} desde Canva, así que
            ahí siempre está la versión más reciente.
          </p>
          {local.cartaUrl ? (
            <Boton href={local.cartaUrl} tamano="lg">
              Abrir la carta de {local.nombreCorto}
            </Boton>
          ) : (
            /* Sin link todavía: se dice, no se muestra un botón roto */
            <p className={estilos.sinCarta}>
              Estamos terminando de cargar la carta digital de {local.nombreCorto}.
              Mientras tanto, la de arriba es de referencia.
            </p>
          )}
        </div>
      </Section>
    </main>
  );
}
```

- [ ] **Step 4: Escribir `src/pages/Carta/Carta.module.css`**

La línea punteada entre el nombre y el precio es el detalle que hace que se lea como una carta de restaurante y no como una tabla.

```css
.aclaracion {
  text-align: center;
  font-size: var(--fs-small);
  color: var(--gris-600);
  font-style: italic;
  margin-bottom: var(--sp-8);
}

.indice {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--sp-2) var(--sp-6);
  margin-bottom: var(--sp-16);
  padding-bottom: var(--sp-6);
  border-bottom: 1px solid var(--gris-300);
}

.enlaceIndice {
  font-size: var(--fs-small);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--madera);
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: color var(--transicion), border-color var(--transicion);
}

.enlaceIndice:hover {
  color: var(--bordo-900);
  border-bottom-color: var(--brasa);
}

.carta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-16);
}

.tituloCategoria {
  font-size: var(--fs-h2);
  color: var(--bordo-900);
  text-align: center;
  margin-bottom: var(--sp-8);
}

.platos {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  max-width: 62ch;
  margin: 0 auto;
}

.lineaPlato {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
}

.nombrePlato {
  font-size: 1.05rem;
  font-weight: 600;
}

/* Línea punteada que rellena el espacio entre el nombre y el precio */
.puntos {
  flex: 1;
  height: 1px;
  min-width: var(--sp-4);
  border-bottom: 1px dotted var(--gris-300);
  transform: translateY(-4px);
}

.precioPlato {
  font-family: var(--font-titulo);
  font-weight: 600;
  color: var(--madera);
  white-space: nowrap;
}

.descripcionPlato {
  font-size: var(--fs-small);
  color: var(--gris-600);
  margin-top: var(--sp-1);
  max-width: 52ch;
}

.bloqueCanva {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-4);
  text-align: center;
}

.sinCarta {
  font-size: var(--fs-small);
  color: var(--gris-600);
  font-style: italic;
  max-width: 46ch;
}
```

- [ ] **Step 5: Verificar**

```bash
npm run dev
```

Chequeos de comportamiento — estos son el corazón de la tarea:
- Entrar a `/carta` sin parámetro → muestra la carta de **la parrilla** (el local por defecto).
- Entrar a `/carta?local=restaurante` → muestra la del **restaurante**, con el toggle marcando esa opción.
- Entrar a `/carta?local=cualquiera` → **no rompe**: cae a la parrilla.
- Tocar el toggle cambia la carta **y** la URL.
- Copiar `/carta?local=restaurante`, pegarlo en una pestaña nueva → abre directo en esa carta. Esto es lo que justifica haber puesto el estado en la URL.
- Desde el Inicio, "Ver la carta" del restaurante → llega con esa carta ya seleccionada.

Chequeos visuales:
- El toggle queda pegado bajo la navbar al scrollear, sin taparla ni quedar tapado.
- Cada plato tiene la línea punteada entre el nombre y el precio.
- Clic en una categoría del índice hace scroll suave hasta ahí, y el título **no queda tapado** por la navbar (esto verifica el `scroll-padding-top` de `global.css`).
- En la parrilla: el bloque final muestra el botón a Canva.
- En el restaurante: **no hay botón**, hay un texto en itálica diciendo que la carta digital está en camino.
- El hero compacto usa la foto del local activo y cambia al cambiar de local.

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/SelectorLocal src/pages/Carta
git commit -m "feat: add the menu page with a per-venue toggle

The active venue lives in the query string rather than in component
state: that makes a menu link shareable, keeps the back button
meaningful, and lets the home page's venue cards deep-link straight to
the right menu.

An unknown or missing value falls back to the first venue instead of
rendering nothing. SelectorLocal stays controlled so the URL remains the
single source of truth.

The parrilla links out to its Canva menu; the restaurante has no link
yet, so it says so rather than showing a dead button."
git push
```

---

## Task 11: Página de Reservas (maqueta)

**Importante:** esta página **no persiste nada**. El botón no guarda, no envía y no llama a ninguna API. Es maqueta. El CRUD es la etapa 2 y tiene su propio spec. No agregar `localStorage`, `fetch` ni una capa de servicios en esta tarea.

Sí hay estado local (`useState`), porque un formulario controlado necesita estado para mostrar lo que se escribe. Eso no es persistencia.

**Files:**
- Modify: `src/pages/Reservas/Reservas.jsx`
- Create: `src/pages/Reservas/Reservas.module.css`

**Interfaces:**
- Consumes: `LOCALES`, `getLocal`, `esIdDeLocal`, `ID_LOCAL_POR_DEFECTO` (Task 3), `TEXTOS` (Task 3), `Hero` (Task 6), `Section`, `Boton` (Task 5)

- [ ] **Step 1: Escribir `src/pages/Reservas/Reservas.jsx`**

El local va **primero** porque condiciona las franjas horarias. Se muestra como dos tarjetas seleccionables, no como un `<select>`: ocupa más lugar, pero deja claro de entrada que hay dos salones.

```jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hero from '../../components/Hero/Hero.jsx';
import Section from '../../components/Section/Section.jsx';
import Boton from '../../components/Boton/Boton.jsx';
import { LOCALES, getLocal, esIdDeLocal, ID_LOCAL_POR_DEFECTO } from '../../data/locales.js';
import { TEXTOS } from '../../data/textos.js';
import { MARCA } from '../../data/marca.js';
import estilos from './Reservas.module.css';

export default function Reservas() {
  const [parametros] = useSearchParams();
  const idInicial = parametros.get('local');

  const [idLocal, setIdLocal] = useState(
    esIdDeLocal(idInicial) ? idInicial : ID_LOCAL_POR_DEFECTO
  );

  const local = getLocal(idLocal);

  // MAQUETA: el formulario no guarda ni envía nada. La lógica de reservas
  // es la etapa 2 y tiene su propio spec. Acá solo se corta el submit para
  // que el navegador no recargue la página.
  const alEnviar = (evento) => {
    evento.preventDefault();
  };

  return (
    <main>
      <Hero
        compacto
        imagen="/img/comunes/hero-marca.svg"
        alt=""
        titulo="Reservá tu mesa"
        bajada={MARCA.bajada}
      />

      <Section>
        <div className={estilos.columnas}>
          <form className={estilos.formulario} onSubmit={alEnviar}>
            {/* El local va primero: define las franjas horarias de abajo */}
            <fieldset className={estilos.grupoLocal}>
              <legend className={estilos.etiqueta}>¿En qué salón?</legend>
              <div className={estilos.opcionesLocal}>
                {LOCALES.map((opcion) => (
                  <label
                    key={opcion.id}
                    className={`${estilos.tarjetaLocal} ${
                      opcion.id === idLocal ? estilos.tarjetaLocalActiva : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="local"
                      value={opcion.id}
                      checked={opcion.id === idLocal}
                      onChange={() => setIdLocal(opcion.id)}
                      className={estilos.radioOculto}
                    />
                    <span className={estilos.nombreLocal}>{opcion.nombreCorto}</span>
                    <span className={estilos.taglineLocal}>{opcion.tagline}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={estilos.fila}>
              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="nombre">
                  Nombre y apellido
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Juan Pérez"
                  className={estilos.control}
                />
              </div>

              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="telefono">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="+54 9 2944 00-0000"
                  className={estilos.control}
                />
              </div>
            </div>

            <div className={estilos.campo}>
              <label className={estilos.etiqueta} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="juan@ejemplo.com"
                className={estilos.control}
              />
            </div>

            <div className={estilos.fila}>
              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="fecha">
                  Fecha
                </label>
                <input
                  id="fecha"
                  name="fecha"
                  type="date"
                  required
                  className={estilos.control}
                />
              </div>

              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="hora">
                  Hora
                </label>
                {/* Las franjas salen del local elegido arriba */}
                <select id="hora" name="hora" required className={estilos.control}>
                  {local.franjasReserva.map((franja) => (
                    <option key={franja} value={franja}>
                      {franja}
                    </option>
                  ))}
                </select>
              </div>

              <div className={estilos.campo}>
                <label className={estilos.etiqueta} htmlFor="personas">
                  Personas
                </label>
                <input
                  id="personas"
                  name="personas"
                  type="number"
                  min="1"
                  max="12"
                  defaultValue="2"
                  required
                  className={estilos.control}
                />
              </div>
            </div>

            <div className={estilos.campo}>
              <label className={estilos.etiqueta} htmlFor="comentarios">
                Comentarios <span className={estilos.opcional}>(opcional)</span>
              </label>
              <textarea
                id="comentarios"
                name="comentarios"
                rows="4"
                placeholder="Alergias, cumpleaños, si preferís una mesa cerca del fuego…"
                className={estilos.control}
              />
            </div>

            <Boton type="submit" tamano="lg" className={estilos.botonEnviar}>
              Confirmar reserva
            </Boton>

            <p className={estilos.avisoMaqueta}>
              Esta sección todavía no está conectada. Por ahora confirmanos la reserva
              por WhatsApp o teléfono.
            </p>
          </form>

          <aside className={estilos.panel}>
            <h2 className={estilos.tituloPanel}>Antes de reservar</h2>
            <ul className={estilos.condiciones}>
              {TEXTOS.condicionesReserva.map((condicion) => (
                <li key={condicion} className={estilos.condicion}>
                  {condicion}
                </li>
              ))}
            </ul>

            <div className={estilos.contactoPanel}>
              <h3 className={estilos.subtituloPanel}>{local.nombre}</h3>
              {local.whatsapp ? (
                <Boton
                  href={`https://wa.me/${local.whatsapp}?text=${encodeURIComponent(
                    `Hola! Quería reservar una mesa en ${local.nombre}.`
                  )}`}
                >
                  Reservar por WhatsApp
                </Boton>
              ) : (
                <p className={estilos.sinContacto}>
                  Todavía no tenemos el WhatsApp de este salón cargado. Escribinos por
                  Instagram y te respondemos.
                </p>
              )}
              <a
                href={MARCA.instagramUrl}
                className={estilos.instagram}
                target="_blank"
                rel="noreferrer"
              >
                {MARCA.instagram}
              </a>
            </div>
          </aside>
        </div>
      </Section>

      {/*
        Etapa 2: acá va el listado de reservas del CRUD.
        No se renderiza nada todavía — ver el spec de la etapa 2.
      */}
    </main>
  );
}
```

- [ ] **Step 2: Escribir `src/pages/Reservas/Reservas.module.css`**

```css
.columnas {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-12);
  align-items: start;
}

/* ---------- Formulario ---------- */
.formulario {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  background-color: var(--blanco);
  padding: var(--sp-6);
  border-radius: var(--radio-lg);
  box-shadow: var(--sombra-sm);
}

.fila {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-4);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.etiqueta {
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--carbon);
}

.opcional {
  font-weight: 400;
  color: var(--gris-600);
}

.control {
  width: 100%;
  padding: var(--sp-3);
  background-color: var(--crema);
  border: 1px solid var(--gris-300);
  border-radius: var(--radio-md);
  transition: border-color var(--transicion), box-shadow var(--transicion);
}

.control:focus {
  outline: none;
  border-color: var(--bordo-900);
  box-shadow: 0 0 0 3px var(--bordo-100);
}

textarea.control {
  resize: vertical;
  min-height: 96px;
}

/* ---------- Selector de local ---------- */
.grupoLocal {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.opcionesLocal {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-3);
}

.tarjetaLocal {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-4);
  background-color: var(--crema);
  border: 2px solid var(--gris-300);
  border-radius: var(--radio-md);
  cursor: pointer;
  transition: border-color var(--transicion), background-color var(--transicion);
}

.tarjetaLocal:hover {
  border-color: var(--madera);
}

.tarjetaLocalActiva {
  border-color: var(--bordo-900);
  background-color: var(--bordo-100);
}

/* El radio real sigue existiendo para teclado y lectores de pantalla */
.radioOculto {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}

.radioOculto:focus-visible + .nombreLocal {
  outline: 3px solid var(--brasa);
  outline-offset: 3px;
  border-radius: var(--radio-sm);
}

.nombreLocal {
  font-weight: 600;
  color: var(--bordo-900);
}

.taglineLocal {
  font-size: var(--fs-small);
  color: var(--gris-600);
  font-style: italic;
}

.botonEnviar {
  align-self: flex-start;
}

.avisoMaqueta {
  font-size: var(--fs-small);
  color: var(--gris-600);
  font-style: italic;
  padding-top: var(--sp-2);
  border-top: 1px dashed var(--gris-300);
}

/* ---------- Panel lateral ---------- */
.panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
  background-color: var(--bordo-100);
  padding: var(--sp-6);
  border-radius: var(--radio-lg);
  border-top: 4px solid var(--bordo-900);
}

.tituloPanel {
  font-size: var(--fs-h3);
  color: var(--bordo-900);
}

.condiciones {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.condicion {
  position: relative;
  padding-left: var(--sp-6);
  font-size: var(--fs-small);
  color: var(--carbon);
}

.condicion::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 8px;
  height: 8px;
  background-color: var(--brasa);
  border-radius: 50%;
}

.contactoPanel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--gris-300);
}

.subtituloPanel {
  font-size: 1.05rem;
  color: var(--bordo-900);
}

.sinContacto {
  font-size: var(--fs-small);
  color: var(--gris-600);
  font-style: italic;
}

.instagram {
  font-size: var(--fs-small);
  font-weight: 600;
  color: var(--bordo-900);
}

.instagram:hover {
  text-decoration: underline;
}

@media (min-width: 600px) {
  .fila {
    grid-template-columns: repeat(2, 1fr);
  }

  .opcionesLocal {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1100px) {
  .columnas {
    grid-template-columns: 1.6fr 1fr;
    gap: var(--sp-12);
  }

  .formulario {
    padding: var(--sp-8);
  }
}
```

- [ ] **Step 3: Verificar**

```bash
npm run dev
```

Chequeos de comportamiento:
- Entrar a `/reservas` → el salón seleccionado es la parrilla.
- Entrar a `/reservas?local=restaurante` → arranca con el restaurante marcado.
- Desde el Inicio, "Reservar acá" del restaurante → llega con ese salón ya elegido.
- **Cambiar de salón cambia las horas del `<select>`.** Parrilla: aparece `22:00`. Restaurante: aparece `19:30` y **no** `22:00`. Esto es lo que verifica que las franjas salen del local.
- Con el restaurante elegido, el panel lateral **no muestra** botón de WhatsApp (todavía no hay número) y sí un texto que manda a Instagram.
- Apretar "Confirmar reserva" con el formulario completo → **la página no se recarga y no pasa nada**. Correcto: es maqueta.
- Dejar un campo requerido vacío → el navegador muestra su validación nativa.

Chequeos visuales:
- En desktop el formulario ocupa la columna ancha y el panel la angosta, a la derecha.
- La tarjeta del salón elegido tiene borde bordo y fondo rosado.
- Navegando con Tab se puede cambiar de salón con las flechas, y la tarjeta enfocada muestra el anillo naranja.
- En mobile todo pasa a una columna, en este orden: formulario, después panel.

Verificación de la restricción de alcance del spec:
```bash
grep -rn "localStorage\|sessionStorage\|fetch(\|axios" src/
```
Esperado: **cero resultados**. Si hay alguno, se coló lógica de la etapa 2.

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Reservas
git commit -m "feat: add the reservation form as a mockup

The form is deliberately inert: submit is prevented and nothing is
stored or sent. Persistence belongs to the CRUD stage, which has its own
spec.

Venue is the first field because it determines which time slots the
select offers, and it is rendered as two selectable cards rather than a
dropdown so the two rooms are visible rather than hidden behind a click.
It preselects from the query string when arriving from a venue card.

A venue with no WhatsApp number yet points at Instagram instead."
git push
```

---

## Task 12: Página Nosotros / Contacto

**Files:**
- Modify: `src/pages/Nosotros/Nosotros.jsx`
- Create: `src/pages/Nosotros/Nosotros.module.css`

**Interfaces:**
- Consumes: `LOCALES` (Task 3), `TEXTOS`, `MARCA` (Task 3), `Hero` (Task 6), `Section` (Task 5), `GaleriaGrid`, `InfoLocal` (Task 9)

- [ ] **Step 1: Escribir `src/pages/Nosotros/Nosotros.jsx`**

Los bloques por local alternan el lado de la foto, para que la página no se lea como una lista.

```jsx
import Hero from '../../components/Hero/Hero.jsx';
import Section from '../../components/Section/Section.jsx';
import GaleriaGrid from '../../components/GaleriaGrid/GaleriaGrid.jsx';
import InfoLocal from '../../components/InfoLocal/InfoLocal.jsx';
import { LOCALES } from '../../data/locales.js';
import { TEXTOS } from '../../data/textos.js';
import { MARCA } from '../../data/marca.js';
import estilos from './Nosotros.module.css';

export default function Nosotros() {
  return (
    <main>
      <Hero
        compacto
        imagen="/img/comunes/hero-marca.svg"
        alt=""
        titulo="Nosotros"
        bajada={MARCA.ciudad}
      />

      {/* Historia: es de la familia, común a los dos salones */}
      <Section ancho="angosto" titulo={TEXTOS.historia.titulo}>
        <div className={estilos.historia}>
          {TEXTOS.historia.parrafos.map((parrafo) => (
            <p key={parrafo.slice(0, 24)}>{parrafo}</p>
          ))}
        </div>
      </Section>

      <Section
        fondo="bordoClaro"
        titulo="Los salones por dentro"
        bajada="Cada uno con su clima. Elegí el que vaya con la noche que tenés en mente."
      >
        <div className={estilos.locales}>
          {LOCALES.map((local, indice) => (
            <article
              key={local.id}
              className={`${estilos.local} ${
                indice % 2 === 1 ? estilos.localInvertido : ''
              }`}
            >
              <div className={estilos.galeria}>
                <GaleriaGrid imagenes={local.imagenes.galeria} />
              </div>

              <div className={estilos.textoLocal}>
                <h3 className={estilos.nombreLocal}>{local.nombre}</h3>
                <p className={estilos.taglineLocal}>{local.tagline}</p>
                <p>{local.descripcion}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        id="contacto"
        titulo="Contacto"
        bajada="Escribinos o pasá a vernos. Somos los dos, en la misma cuadra larga."
      >
        <div className={estilos.grillaInfo}>
          {LOCALES.map((local) => (
            <InfoLocal key={local.id} local={local} />
          ))}
        </div>

        <div className={estilos.contactoComun}>
          <p>Para cualquiera de los dos salones:</p>
          <a href={MARCA.instagramUrl} target="_blank" rel="noreferrer" className={estilos.enlaceComun}>
            {MARCA.instagram}
          </a>
          <a href={`mailto:${MARCA.email}`} className={estilos.enlaceComun}>
            {MARCA.email}
          </a>
        </div>
      </Section>
    </main>
  );
}
```

- [ ] **Step 2: Escribir `src/pages/Nosotros/Nosotros.module.css`**

```css
.historia {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.locales {
  display: flex;
  flex-direction: column;
  gap: var(--sp-16);
}

.local {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-8);
  align-items: center;
}

.galeria {
  min-width: 0;
}

.textoLocal {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.nombreLocal {
  color: var(--bordo-900);
}

.taglineLocal {
  color: var(--madera);
  font-style: italic;
  font-weight: 500;
}

.grillaInfo {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--sp-8);
  align-items: stretch;
}

.contactoComun {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--sp-4);
  margin-top: var(--sp-12);
  padding-top: var(--sp-8);
  border-top: 1px solid var(--gris-300);
  text-align: center;
  color: var(--gris-600);
}

.enlaceComun {
  font-weight: 600;
  color: var(--bordo-900);
}

.enlaceComun:hover {
  text-decoration: underline;
}

@media (min-width: 900px) {
  .local {
    grid-template-columns: 1.1fr 1fr;
    gap: var(--sp-12);
  }

  /* El segundo local invierte el orden: la galería pasa a la derecha */
  .localInvertido .galeria {
    order: 2;
  }

  .grillaInfo {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

- [ ] **Step 3: Verificar**

```bash
npm run dev
```

Chequeos en `/nosotros`, desktop:
- Hero compacto (algo más de media pantalla), con la navbar sólida encima.
- La historia va en columna angosta y centrada, más fácil de leer que a todo el ancho.
- Dos bloques de local: en el primero la galería está a la **izquierda**, en el segundo a la **derecha**. Esa alternancia es la que evita que se lea como una lista.
- Cada galería tiene 3 fotos, con la del medio vertical ocupando toda la altura de la derecha.
- Abajo, dos `InfoLocal` con sus mapas.
- El bloque de contacto común muestra Instagram y email una sola vez.

En mobile (360px):
- Todo en una columna. La alternancia desaparece, que es lo correcto: en una columna no significa nada.
- Sin scroll horizontal.

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Nosotros
git commit -m "feat: add the about and contact page

The family's story is shared, so it runs once at the top in a narrow
measure. Below it each venue gets its own block, alternating which side
the gallery sits on so the page does not read as a list.

Contact repeats InfoLocal per venue and then gives the shared Instagram
and email once, matching how the business actually works."
git push
```

---

## Task 13: Documentación del proyecto

Los `.md` que pediste: para que un chat nuevo entienda el proyecto sin explicaciones, y para que vos tengas registro de lo hecho.

**Files:**
- Create: `CLAUDE.md`, `README.md`
- Create: `docs/CONTEXTO.md`, `docs/ESTRUCTURA.md`, `docs/BITACORA.md`, `docs/PENDIENTES.md`

- [ ] **Step 1: Escribir `CLAUDE.md`**

Corto a propósito: es lo que Claude carga en cada chat, así que todo lo que sobre acá gasta contexto en cada sesión. Lo largo va en `docs/`.

````markdown
# La Posta — contexto para Claude

Sitio web de **La Posta**, negocio gastronómico familiar en Villa La Angostura,
Neuquén. Es a la vez un TP de la materia Programación Web y una web real para el
restaurante.

## Lo que hay que saber antes de tocar nada

- **Son DOS locales** bajo la misma marca: la parrilla y el restaurante. Comparten
  dueños, identidad e Instagram; se diferencian en carta, ambiente y dirección.
- Los locales son **datos, no rutas**. Viven en `src/data/locales.js` como el array
  `LOCALES`. Los componentes iteran sobre él o reciben un local por props.
  **Nunca escribir `'parrilla'` ni `'restaurante'` a mano en un componente.**
- El profesor pidió **solo el front en React**. No agregar backend, API routes ni
  base de datos.
- La etapa actual es **maqueta visual**: el formulario de reservas no guarda nada.
  No agregar `localStorage`, `fetch` ni capa de servicios sin que lo pidan.

## Stack

Vite + React 19 + React Router 7 + CSS Modules. JavaScript, no TypeScript.
Sin librerías de UI. Deploy automático a Vercel en cada push a `main`.

## Convenciones

- Código, nombres y contenido en **español**. Mensajes de commit en inglés.
- Colores **solo** desde las custom properties de `src/styles/tokens.css`.
  El bordo de marca es `#5F0004`, muestreado del logo real.
- Un componente = una carpeta: `Nombre/Nombre.jsx` + `Nombre.module.css`.
- CSS **mobile first**. Breakpoints: 768px y 1100px.
- Datos sin confirmar se marcan con `// PENDIENTE`. Buscarlos:
  `grep -rn "PENDIENTE" src/`
- Un dato que falta **se omite**, no se inventa: si un local no tiene teléfono
  cargado, la UI esconde el botón en vez de mostrar un link roto.

## Comandos

```bash
npm run dev           # servidor de desarrollo
npm run build         # build de producción a dist/
npm run placeholders  # regenera los SVG placeholder de public/img/
```

## Dónde está el resto

- `docs/CONTEXTO.md` — el restaurante, la consigna, las decisiones y por qué
- `docs/ESTRUCTURA.md` — qué contiene cada página y componente
- `docs/BITACORA.md` — log de cambios, lo más nuevo arriba
- `docs/PENDIENTES.md` — lo que falta: datos, fotos, etapas futuras
- `docs/superpowers/specs/` — los diseños aprobados
- `docs/superpowers/plans/` — los planes de implementación
````

- [ ] **Step 2: Escribir `docs/CONTEXTO.md`**

````markdown
# Contexto del proyecto

## El restaurante

**La Posta** es un negocio gastronómico familiar en **Villa La Angostura**, Neuquén.
Son **dos locales bajo la misma marca**:

| | Parrilla | Restaurante |
|---|---|---|
| Propuesta | Brasas, cordero al asador, mesas largas | Pastas caseras, trucha del lago, luz baja |
| Teléfono | +54 9 2944 96-6199 | PENDIENTE |
| Carta en Canva | Sí, link cargado | Existe, falta el link |

Comparten dueños, identidad visual, nombre e Instagram (`@lapostavla`).
El local es de madera, acogedor, de montaña. El color de marca es **bordo `#5F0004`**,
muestreado del logo real.

La familia mantiene las cartas en Canva y las actualiza desde ahí, así que el link
siempre muestra la versión vigente.

## La consigna

Trabajo práctico de **Programación Web**. El profesor pidió:

1. Convertir todo a **React**.
2. Crear cuenta en **Vercel**.
3. **Enlazarla con GitHub**.
4. Aclararle a la IA: **"solo hacé el React del front"**.

El punto 4 es una restricción de diseño, no una formalidad: nada de backend, API
routes ni base de datos, aunque técnicamente se pueda.

Más adelante el profesor va a enseñar **pagos**; recién ahí se agregan.

Repositorio: `https://github.com/giandicla/LaPostaParrilla`

## Las decisiones y por qué

### Por qué "un sitio, dos salones"

Se evaluaron tres formas de dividir el sitio:

| Patrón | Por qué no / sí |
|---|---|
| **A — Un sitio, dos salones** ✅ | La marca manda. Una sola home. La división aparece solo donde cambia la info: carta, reservas, contacto. Menos código y navegación simple, que además se defiende mejor en el TP. |
| B — Hub + sub-sitios (`/parrilla`, `/restaurante`) | Casi el doble de trabajo, y obliga a elegir antes de ver nada, lo que hace perder visitantes. |
| C — Selector global persistente en el navbar | Solo sirve si el contenido es casi idéntico. Acá las cartas son distintas, así que esconder un local detrás del otro empobrece el sitio. |

**Consecuencia:** los locales son **datos, no rutas**. Un array `LOCALES` y
componentes que iteran. Sumar un tercer local es agregar un objeto.

### Por qué Vite y no Next.js

Next trae SSR y API routes. Choca con "solo el front" y agrega superficie que el
profesor no pidió. Vite compila a estático puro y Vercel lo detecta solo.

### Por qué CSS Modules y no Tailwind

Es CSS real, explicable en la defensa, sin clases mágicas en el JSX. Se puede
revisar con el profesor más adelante si prefiere otra cosa.

### Por qué el local activo va en la URL

En `/carta?local=parrilla` el estado vive en la query string, no en `useState`.
Así el link se puede compartir apuntando a una carta concreta, el botón "atrás"
funciona, y las cards del Inicio pueden linkear directo a la carta correcta.

### Por qué el formulario de reservas no guarda nada

La etapa actual es maqueta visual. El CRUD tiene su propio spec y su propia etapa.
Mezclarlos habría hecho que ninguna de las dos quedara bien.

## Las etapas

| Etapa | Qué | Estado |
|---|---|---|
| 1 | Boceto visual: 4 páginas maquetadas, dos locales, deploy | En curso |
| 2 | CRUD de reservas + panel de administración | No empezada |
| 3 | Pagos (después de que el profesor lo enseñe) | No empezada |
````

- [ ] **Step 3: Escribir `docs/ESTRUCTURA.md`**

````markdown
# Estructura del sitio

## Rutas

| Ruta | Página | Qué tiene |
|---|---|---|
| `/` | Inicio | Los 7 bloques de la home |
| `/carta` | Carta | Carta del local activo + toggle. Acepta `?local=<id>` |
| `/reservas` | Reservas | Formulario maquetado. Acepta `?local=<id>` |
| `/nosotros` | Nosotros | Historia + un bloque por local + contacto |
| `*` | — | Redirige a `/` |

## Inicio, bloque por bloque

1. **Navbar** — fija. Translúcida sobre el hero, bordo sólida al pasar 80px. En las
   demás rutas arranca sólida. Mobile: panel a pantalla completa.
2. **Hero** — `100svh`, foto de fondo con overlay bordo. Habla de la marca, no de un
   local. Logo, nombre, bajada y dos botones.
3. **Bienvenida** — texto + 3 fotos.
4. **Nuestros dos salones** — dos `LocalCard`. El bloque que resuelve la división.
5. **Destacados** — 4 `PlatoCard` sobre fondo bordo, dos de cada local.
6. **Visitanos** — dos `InfoLocal` con horarios, mapa y contacto.
7. **Footer** — bordo. Las dos direcciones, Instagram una vez.

## Componentes

| Componente | Props | Qué hace |
|---|---|---|
| `Navbar` | — | Navegación, estado de scroll, menú mobile |
| `Footer` | — | Links, redes, las dos direcciones |
| `Hero` | `titulo`, `bajada`, `imagen`, `alt`, `conLogo`, `compacto`, `acciones` | Portada. Completa en el Inicio, compacta en el resto |
| `Section` | `id`, `fondo`, `titulo`, `bajada`, `ancho`, `children` | Ancho máximo, padding vertical, color de fondo |
| `Boton` | `variante`, `tamano`, `to`, `href`, `onClick`, `children` | Link interno, externo o botón según las props |
| `LocalCard` | `local` | Tarjeta grande de un salón, con sus dos CTA |
| `SelectorLocal` | `locales`, `localActivoId`, `onChange` | Toggle. Controlado |
| `PlatoCard` | `nombre`, `descripcion`, `precio`, `imagen`, `etiquetaLocal?` | Card de plato |
| `GaleriaGrid` | `imagenes[]` | Grilla de 3 fotos, la del medio vertical |
| `InfoLocal` | `local` | Horarios, mapa y contacto de UN local |

**Regla:** solo `Navbar`, `Footer` y las páginas importan de `src/data/`.
Los demás reciben todo por props.

## Datos

| Archivo | Qué exporta |
|---|---|
| `marca.js` | `MARCA` — nombre, bajada, ciudad, Instagram, email, logo |
| `locales.js` | `LOCALES`, `getLocal(id)`, `esIdDeLocal(id)`, `ID_LOCAL_POR_DEFECTO` |
| `menu.js` | `getCarta(idLocal)`, `getDestacados()`, `formatearPrecio(n)` |
| `textos.js` | `TEXTOS` — bienvenida, historia, condiciones de reserva |

Forma de un local:

```js
{ id, nombre, nombreCorto, tagline, descripcion, direccion, mapaEmbedUrl,
  telefono, whatsapp, cartaUrl, horarios: [{dia, franja}],
  franjasReserva: [string], imagenes: { hero, galeria: [{src, alt}] } }
```

`telefono`, `whatsapp` y `cartaUrl` pueden ser `null`. La UI esconde lo que falta.

## Estilos

- `src/styles/tokens.css` — todas las custom properties. **Ningún color literal
  fuera de acá.**
- `src/styles/global.css` — reset, base, foco visible, `prefers-reduced-motion`.
- Un `.module.css` por componente, al lado del `.jsx`.

## Imágenes

`public/img/{parrilla,restaurante,comunes}/`. Hoy son SVG placeholder generados por
`npm run placeholders`. Cuando lleguen las fotos reales se reemplazan los archivos
conservando los nombres y se actualizan las extensiones en `locales.js` y `menu.js`.
````

- [ ] **Step 4: Escribir `docs/BITACORA.md`**

Lo más nuevo arriba. Cada sesión agrega una entrada.

````markdown
# Bitácora

Log de cambios. **Lo más nuevo arriba.**

---

## 2026-09-24 — Etapa 1: boceto visual

Primera sesión. De cero a sitio desplegado.

**Diseño y decisiones**
- Spec escrito y aprobado: `docs/superpowers/specs/2026-09-24-la-posta-web-design.md`
- Se confirmó que son **dos locales** y se eligió el patrón "un sitio, dos salones".
- Bordo de marca muestreado del logo real: `#5F0004`.

**Construido**
- Scaffolding Vite + React + React Router. Repo enlazado con Vercel.
- `tokens.css` y `global.css` — paleta, tipografías, espaciado.
- Capa de datos: `marca.js`, `locales.js`, `menu.js`, `textos.js`.
- Generador de placeholders: `scripts/gen-placeholders.mjs`.
- Layout: Navbar (con menú mobile) + Footer + 4 rutas.
- Componentes: Boton, Section, Hero, LocalCard, PlatoCard, GaleriaGrid,
  InfoLocal, SelectorLocal.
- Páginas: Inicio (7 bloques), Carta (con toggle por local en la URL),
  Reservas (maqueta), Nosotros.
- Documentación del proyecto.

**Datos que se confirmaron en esta sesión**
- Son dos locales, misma marca, cartas distintas.
- Instagram `@lapostavla` cubre los dos.
- Teléfono de la parrilla: `+54 9 2944 96-6199`.
- El link de Canva conocido es el de la parrilla; existe un segundo para el
  restaurante.

**Lo que quedó pendiente**
Ver `docs/PENDIENTES.md`.
````

- [ ] **Step 5: Escribir `docs/PENDIENTES.md`**

````markdown
# Pendientes

## Datos que tiene que pasar la familia

### Parrilla
- [ ] Dirección exacta
- [ ] URL de embed del mapa de Google
- [ ] Horarios reales por día, con días de cierre y temporada baja
- [ ] Franjas horarias de reserva
- [x] Teléfono / WhatsApp — `+54 9 2944 96-6199`
- [x] Link de la carta en Canva

### Restaurante
- [ ] Nombre exacto con el que se lo conoce
- [ ] Dirección exacta
- [ ] URL de embed del mapa de Google
- [ ] Horarios reales por día
- [ ] Franjas horarias de reserva
- [ ] Teléfono / WhatsApp
- [ ] Link del segundo Canva

### Los dos
- [ ] Tagline real (los actuales son borrador)
- [ ] Carta en PDF
- [ ] Fotos en alta: salón, parrilla, platos

### De la marca
- [ ] Email de contacto real
- [ ] Año de fundación e historia real de la familia
- [ ] Logo en alta resolución o vectorial (el actual es 150×150px)

Todos están marcados en el código. Para encontrarlos:

```bash
grep -rn "PENDIENTE" src/
```

## Assets

- [ ] Reemplazar los SVG placeholder de `public/img/` por las fotos reales,
      conservando los nombres de archivo y actualizando las extensiones en
      `src/data/locales.js` y `src/data/menu.js`.
- [ ] Reemplazar `public/logo.jpg` por la versión en alta.

## Decisiones a tomar

- [ ] Consultar con el profesor si prefiere otra forma de estilos (CSS Modules vs
      Tailwind vs CSS plano).
- [ ] Definir si la carta del sitio se mantiene a mano o se enlaza directo al Canva.
      Hoy conviven las dos: platos de ejemplo + botón al Canva.

## Etapas futuras

### Etapa 2 — CRUD de reservas
- [ ] Escribir el spec
- [ ] Capa de servicios aislada, para que el backend real entre después sin
      reescribir componentes
- [ ] Listado de reservas (el contenedor ya está previsto al final de `/reservas`)
- [ ] Panel de administración: listar, editar, confirmar, cancelar
- [ ] Tests (la etapa 1 no tiene, por ser maqueta sin lógica)

### Etapa 3 — Pagos
- [ ] Esperar a que el profesor lo enseñe
````

- [ ] **Step 6: Escribir `README.md`**

````markdown
# La Posta — Parrilla & Restaurante

Sitio web de La Posta, restaurante familiar en Villa La Angostura, Neuquén.
Trabajo práctico de Programación Web.

**Producción:** desplegado en Vercel desde `main`.

## Correrlo

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción a `dist/` |
| `npm run preview` | Sirve el build local, para revisar antes de pushear |
| `npm run placeholders` | Regenera los SVG placeholder de `public/img/` |

## Stack

Vite · React 19 · React Router 7 · CSS Modules

Front puro: sin backend, sin base de datos.

## Documentación

| Archivo | Qué tiene |
|---|---|
| `CLAUDE.md` | Contexto rápido del proyecto y convenciones |
| `docs/CONTEXTO.md` | El restaurante, la consigna, las decisiones y por qué |
| `docs/ESTRUCTURA.md` | Qué contiene cada página y componente |
| `docs/BITACORA.md` | Log de cambios |
| `docs/PENDIENTES.md` | Lo que falta |

## Estado

**Etapa 1 — boceto visual.** Las cuatro páginas están maquetadas.
El formulario de reservas es maqueta: todavía no guarda ni envía nada.
El CRUD es la etapa 2 y los pagos la 3.
````

- [ ] **Step 7: Verificar**

```bash
ls CLAUDE.md README.md docs/
grep -rn "PENDIENTE" src/ | wc -l
```

Esperado: los 6 archivos existen, y el conteo de `PENDIENTE` coincide con lo que
dice `docs/PENDIENTES.md`.

Leer `CLAUDE.md` de punta a punta y preguntarse: **si abriera un chat nuevo mañana
sin recordar nada, ¿alcanza para no romper el proyecto?** En particular tiene que
quedar claro que son dos locales y que no hay que escribir los ids a mano.

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md README.md docs/
git commit -m "docs: add project context documentation

CLAUDE.md is deliberately short — it loads into every session, so
anything unnecessary there costs context every time. The long-form
material lives in docs/.

CONTEXTO records why each decision was made, including the two patterns
rejected for splitting the site, so a later reader does not relitigate
them. PENDIENTES tracks the data the family still has to send, split by
venue and mirroring the // PENDIENTE markers in the code."
git push
```

---

## Task 14: Pase final de responsive, accesibilidad y verificación

Última tarea. Revisa el sitio entero como una sola cosa, que es algo que no se puede hacer mientras se lo construye por partes.

**Files:**
- Modify: los que hagan falta según lo que aparezca
- Modify: `docs/BITACORA.md`

- [ ] **Step 1: Verificar los tres breakpoints, página por página**

```bash
npm run dev
```

Con DevTools, en 360px, 768px y 1440px, recorrer `/`, `/carta`, `/reservas`,
`/nosotros`. En cada combinación:

- [ ] **Sin scroll horizontal.** En la consola:
      `document.documentElement.scrollWidth === document.documentElement.clientWidth`
      tiene que dar `true`. Si da `false`, hay un elemento desbordando: buscarlo con
      `document.querySelectorAll('*')` y comparar `scrollWidth` contra el ancho del
      viewport.
- [ ] Ningún texto cortado ni encimado.
- [ ] Ninguna imagen deformada (todas con `object-fit: cover`).
- [ ] Los botones son tocables en mobile: mínimo 44×44px.
- [ ] La navbar no tapa contenido al llegar a una sección por ancla.

- [ ] **Step 2: Recorrer el sitio con el teclado**

Sin tocar el mouse, solo Tab, Shift+Tab, Enter y flechas:

- [ ] Todo lo interactivo es alcanzable.
- [ ] El anillo de foco naranja se ve **siempre**, también sobre fondo bordo.
- [ ] El orden de tabulación sigue el orden visual.
- [ ] En mobile, con el panel abierto, el foco va a los links del panel.
- [ ] El toggle de la carta se opera con teclado.
- [ ] En reservas, el radio de salón se cambia con las flechas.

- [ ] **Step 3: Chequear contraste**

En DevTools → Lighthouse → Accessibility, o inspeccionando los pares de color:

- [ ] Crema sobre bordo-900: tiene que superar 4.5:1.
- [ ] Gris-600 sobre crema: tiene que superar 4.5:1.
- [ ] Madera sobre blanco (los precios): tiene que superar 4.5:1. **Si no llega,
      oscurecer `--madera` en `tokens.css`** — se cambia en un solo lugar y se
      arregla en todo el sitio. Ese es el punto de tener tokens.
- [ ] Texto del hero sobre la imagen: se lee sin esfuerzo.

- [ ] **Step 4: Verificar las restricciones del spec**

Las tres reglas duras, cada una con su comando:

```bash
# 1. Ningún id de local escrito a mano en componentes
grep -rn "'parrilla'\|\"parrilla\"\|'restaurante'\|\"restaurante\"" src/ --include=*.jsx
```
Esperado: **cero**.

```bash
# 2. Ninguna lógica de persistencia (es etapa 1)
grep -rn "localStorage\|sessionStorage\|fetch(\|axios" src/
```
Esperado: **cero**.

```bash
# 3. Ningún color literal fuera de tokens.css
grep -rn "#[0-9a-fA-F]\{3,6\}" src/ --include=*.module.css
```
Esperado: **cero**. Los `rgba()` para overlays y sombras están permitidos y no
aparecen en esta búsqueda.

```bash
# 4. Sin dependencias de más
cat package.json
```
Esperado en `dependencies`: solo `react`, `react-dom`, `react-router-dom`.

- [ ] **Step 5: Verificar el build de producción**

El dev server perdona cosas que el build no. Hay que mirar el build real:

```bash
npm run lint
npm run build
npm run preview
```

`npm run lint` tiene que pasar limpio. Los errores típicos acá son imports sin usar
que quedaron de las tareas anteriores y variables declaradas y nunca leídas.

- [ ] El build termina sin errores **ni warnings**.
- [ ] En `http://localhost:4173`, recorrer las 4 rutas: se ven igual que en dev.
- [ ] Las imágenes y los mapas cargan.
- [ ] En la consola del navegador: **cero errores**.

- [ ] **Step 6: Cerrar la bitácora**

Agregar al final de la entrada del 2026-09-24 en `docs/BITACORA.md`:

```markdown
**Verificación final**
- Revisado en 360px, 768px y 1440px en las 4 páginas: sin scroll horizontal.
- Recorrido completo con teclado: foco visible en todo, orden correcto.
- Contraste verificado en los pares de color principales.
- Build de producción sin errores ni warnings, revisado con `npm run preview`.
- Confirmado por grep: ningún id de local hardcodeado, ninguna persistencia,
  ningún color fuera de tokens.
```

- [ ] **Step 7: Commit final**

```bash
git add -A
git commit -m "polish: responsive, keyboard and contrast pass

Reviews the whole site as one thing, which is not possible while
building it piece by piece: three breakpoints across four pages, a full
keyboard pass, and contrast checks on the main colour pairs.

Also verifies by grep that the stage-1 constraints held — no hardcoded
venue ids, no persistence, no colours outside the token file."
git push
```

- [ ] **Step 8: Verificar el deploy**

Abrir la URL de Vercel (no localhost) y confirmar:

- [ ] El último commit está desplegado.
- [ ] Las 4 rutas andan **navegando desde el sitio**.
- [ ] **Recargar estando en `/carta`** carga la carta, no un 404. Vercel resuelve
      esto solo para Vite; si diera 404, agregar `vercel.json` con un rewrite de
      `/(.*)` a `/index.html`.
- [ ] `/carta?local=restaurante` abre directo en esa carta.
- [ ] Probarlo en un celular real, no solo en el emulador de DevTools.

---

## Qué queda listo al terminar

- Sitio de 4 páginas desplegado en Vercel, con push automático desde `main`.
- Los dos locales presentados como dos salones de una misma marca.
- Los cuatro pedidos del profesor cumplidos: React, Vercel, GitHub enlazado, front puro.
- Documentación que le permite a un chat nuevo retomar sin explicaciones.
- El terreno listo para la etapa 2: la capa de datos aislada y el lugar del listado de reservas ya previsto.

## Qué NO queda listo (y es a propósito)

- El formulario de reservas no guarda nada.
- No hay panel de administración.
- No hay pagos.
- No hay tests.
- Las fotos y varios datos son placeholder.

Cada uno tiene su etapa. Ver `docs/PENDIENTES.md`.
