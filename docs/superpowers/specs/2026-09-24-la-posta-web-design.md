# Diseño — Sitio web La Posta Parrilla & Restaurante

**Fecha:** 2026-09-24
**Autor:** Gianfranco Di Claudio (+ Claude)
**Estado:** aprobado — listo para plan de implementación
**Etapa:** 1 de N — boceto visual, sin lógica de datos

---

## 1. Contexto

La Posta Parrilla & Restaurante es un restaurante familiar en Villa La Angostura,
Neuquén. El sitio cumple dos objetivos a la vez:

1. **Académico:** trabajo práctico de la materia Programación Web. El profesor pidió
   explícitamente: convertir todo a React, crear cuenta en Vercel, enlazarla con
   GitHub, y limitar el alcance del asistente de IA a "solo el React del front".
2. **Real:** que el restaurante tenga una web usable, con reservas online y
   eventualmente pagos.

El repositorio destino es `https://github.com/giandicla/LaPostaParrilla` (vacío al
momento de escribir este documento). Instagram del local: `@lapostavla`.

### Alcance de esta etapa

Esta etapa entrega **únicamente la capa visual**. Las cuatro rutas existen y están
maquetadas, pero:

- El formulario de reservas **no persiste datos**. Es maqueta.
- **No hay** capa de servicios, ni localStorage, ni fetch.
- **No hay** pasarela de pagos (el profesor la enseña más adelante).

El CRUD de reservas y los pagos son etapas posteriores, cada una con su propio
documento de diseño. Este documento no las especifica; solo deja el terreno
preparado para que entren sin reescribir lo hecho.

### Criterio de éxito

- `npm run dev` levanta el sitio sin errores ni warnings.
- `npm run build` produce `dist/` desplegable.
- Las cuatro rutas navegan entre sí y se ven correctas en mobile (360px), tablet
  (768px) y desktop (1440px).
- El sitio está en GitHub y desplegado en Vercel con URL pública.
- Un chat nuevo de Claude puede leer `CLAUDE.md` y entender el proyecto sin
  explicaciones adicionales.

---

## 2. Stack y decisiones técnicas

| Decisión | Elección | Motivo |
|---|---|---|
| Build tool | Vite 6 | Arranque instantáneo, build a estático puro, Vercel lo autodetecta. |
| Framework | React 19 | Requisito de la cátedra. |
| Ruteo | React Router 7 (`createBrowserRouter`) | Estándar de facto para SPA en React. |
| Estilos | CSS Modules + custom properties | CSS real y defendible ante el profesor, sin dependencias ni clases mágicas. Revisable con el profesor más adelante. |
| Lenguaje | JavaScript (JSX), no TypeScript | La cátedra trabaja en JS; TS sumaría fricción sin sumar nota. |
| Tipografías | Google Fonts: Playfair Display + Inter | Gratuitas, con `display=swap`. |
| Iconos | SVG inline en componentes | Cero dependencias, control total del color. |
| Testing | Ninguno en esta etapa | Es una maqueta visual sin lógica. El testing entra junto con el CRUD. |

### Rechazadas

- **Next.js:** trae API routes y SSR. Choca con la consigna "solo el front" y agrega
  superficie que el profesor no pidió.
- **Create React App:** deprecado desde 2023, sin mantenimiento.
- **Tailwind:** más veloz de escribir, pero satura el JSX de clases y varias cátedras
  lo penalizan por ocultar el CSS.

---

## 3. Estructura de archivos

```
LaPostaParrilla/
├── CLAUDE.md                     # contexto que Claude carga solo
├── README.md                     # cómo correr el proyecto
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── docs/
│   ├── CONTEXTO.md
│   ├── ESTRUCTURA.md
│   ├── BITACORA.md
│   ├── PENDIENTES.md
│   └── superpowers/specs/        # este documento y los que vengan
├── public/
│   ├── logo.jpg                  # logo actual (baja calidad, a reemplazar)
│   └── img/                      # fotos del restaurante (placeholders por ahora)
└── src/
    ├── main.jsx                  # monta React, define el router
    ├── App.jsx                   # layout: Navbar + <Outlet/> + Footer
    ├── styles/
    │   ├── tokens.css            # variables CSS: color, tipografía, espaciado
    │   └── global.css            # reset, base, utilidades mínimas
    ├── data/
    │   ├── restaurante.js        # nombre, dirección, horarios, teléfono, redes
    │   ├── menu.js               # categorías y platos de ejemplo
    │   └── textos.js             # copys largos (bienvenida, historia)
    ├── components/
    │   ├── Navbar/
    │   ├── Footer/
    │   ├── Hero/
    │   ├── Section/              # wrapper con título y ancho máximo
    │   ├── Boton/
    │   ├── PlatoCard/
    │   ├── GaleriaGrid/
    │   └── InfoPractica/
    └── pages/
        ├── Inicio/
        ├── Carta/
        ├── Reservas/
        └── Nosotros/
```

### Por qué `src/data/` separado del JSX

Todo el contenido editable del restaurante (horarios, dirección, platos, textos)
vive en archivos de datos planos. Cuando la familia pida "cambiá el horario del
domingo", se toca un solo archivo y no se busca el string perdido en un componente.
También deja el camino listo para que, cuando exista backend, esos módulos se
reemplacen por llamadas a la API sin tocar los componentes.

Cada componente vive en su propia carpeta con `Componente.jsx` y
`Componente.module.css` al lado. Un componente, una carpeta, un archivo de estilos.

---

## 4. Identidad visual

### Paleta

Extraída del logo real (`LogoLaPosta.jpg`, muestreo de píxel: `#5F0004`).

```css
:root {
  /* Marca */
  --bordo-900: #5F0004;   /* color exacto del logo — fondos fuertes, navbar, footer */
  --bordo-700: #7A1218;   /* hover, bordes, estados activos */
  --bordo-100: #F2E3E3;   /* fondos suaves de sección */

  /* Superficie */
  --crema:     #F5EFE6;   /* fondo general, sensación de papel cálido */
  --blanco:    #FFFFFF;

  /* Acentos */
  --madera:    #8B5E3C;   /* detalles, bordes, guiño a la madera del salón */
  --brasa:     #E8A33D;   /* CTA secundario, subrayados, calor de brasa */

  /* Texto */
  --carbon:    #1C1512;   /* texto principal */
  --gris-600:  #5A524C;   /* texto secundario */
  --gris-300:  #D8D0C6;   /* separadores */
}
```

Regla de uso: el bordo manda en navbar, footer y CTAs primarios. La crema es el
fondo por defecto. La brasa aparece poco y siempre como acento — nunca como fondo
de bloque grande. La madera solo en bordes, líneas y detalles.

### Tipografía

```css
--font-titulo: 'Playfair Display', Georgia, serif;
--font-cuerpo: 'Inter', system-ui, sans-serif;
```

Escala fluida con `clamp()` para que no haga falta un breakpoint por tamaño de
texto:

```css
--fs-hero:  clamp(2.5rem, 8vw, 5rem);
--fs-h1:    clamp(2rem, 5vw, 3rem);
--fs-h2:    clamp(1.5rem, 3.5vw, 2.25rem);
--fs-body:  1rem;
--fs-small: 0.875rem;
```

### Espaciado y forma

Escala de 4px: `--sp-1: 0.25rem` hasta `--sp-16: 4rem`. Radios: `--radio-sm: 4px`,
`--radio-md: 8px`, `--radio-lg: 16px`. Sombras suaves y cálidas, nunca negro puro:
`0 4px 16px rgba(28, 21, 18, 0.10)`.

### Tono

Madera, bordo y crema. Acogedor patagónico, fotografía grande y cálida. No es un
sitio minimalista frío ni un sitio corporativo.

### Breakpoints

```css
/* mobile first; los media queries suben desde el default */
--bp-tablet:  768px;
--bp-desktop: 1100px;
```

---

## 5. Rutas y contenido

Ruteo con `createBrowserRouter`. `App.jsx` es el layout compartido: Navbar arriba,
`<Outlet/>` en el medio, Footer abajo. Cada página es hija.

| Ruta | Página | Estado en esta etapa |
|---|---|---|
| `/` | Inicio | Completa y pulida |
| `/carta` | Carta | Borrador visual con datos de ejemplo |
| `/reservas` | Reservas | Formulario maquetado, sin persistencia |
| `/nosotros` | Nosotros / Contacto | Borrador visual |
| `*` | Redirect a `/` | Sin página 404 propia en esta etapa |

### 5.1 Inicio — la sección que se trabaja a fondo

Seis bloques, en orden:

1. **Navbar** — fija arriba. Arranca translúcida sobre el hero y pasa a bordo sólido
   al scrollear más de 80px. Logo a la izquierda, links al centro (Inicio, Carta,
   Nosotros), botón "Reservar" a la derecha. En mobile: logo + menú hamburguesa que
   abre un panel deslizante a pantalla completa.

2. **Hero** — alto `100svh` (no `100vh`, que rompe con la barra del navegador móvil).
   Foto de fondo del salón o la parrilla, con overlay
   `linear-gradient(rgba(95,0,4,.55), rgba(28,21,18,.75))` para que el texto se lea
   sobre cualquier foto. Encima: logo, el nombre en Playfair, la bajada
   "Parrilla & Restaurante · Villa La Angostura", y dos botones — "Reservar mesa"
   (relleno bordo) y "Ver la carta" (contorno crema).

3. **Bienvenida** — fondo crema. Texto corto a la izquierda sobre la propuesta del
   lugar; a la derecha, grilla de 3 fotos con proporciones distintas.

4. **Destacados** — fondo bordo. Cuatro `PlatoCard` en grilla (4 columnas en
   desktop, 2 en tablet, 1 en mobile). Cada card: foto, nombre, descripción de una
   línea, precio. Los datos salen de `src/data/menu.js`, marcados como ejemplo.

5. **Info práctica** — fondo crema. Tres columnas: horarios (tabla simple),
   dirección con mapa de Google embebido en `<iframe>` con `loading="lazy"`, y
   contacto (botón WhatsApp, link a Instagram).

6. **Footer** — fondo bordo. Logo, links de navegación repetidos, redes, dirección,
   y línea de crédito.

### 5.2 Carta

Encabezado con el nombre de la sección. Debajo, navegación por categorías (Entradas,
Parrilla, Principales, Pastas, Postres, Bebidas) que hace scroll suave a cada bloque.
Cada categoría lista sus platos con nombre, descripción y precio, en tipografía de
carta clásica con línea punteada entre el nombre y el precio.

Al final, un bloque destacado con botón hacia la carta oficial en Canva:
`https://www.canva.com/design/DAGkMvwV_fU/XfpQdDldp_dO58eCMU5Sdg/edit`

> **Nota de contenido:** todos los platos y precios de esta etapa son de ejemplo y
> están marcados como tales en `src/data/menu.js`. Se reemplazan cuando llegue el PDF
> real de la carta. El link de Canva es de solo lectura y la familia lo actualiza
> desde ahí, por lo que a futuro conviene evaluar si la carta del sitio se mantiene
> a mano o se enlaza directamente.

### 5.3 Reservas — maqueta

Formulario de dos columnas en desktop, una en mobile:

| Campo | Tipo | Nota |
|---|---|---|
| Nombre y apellido | texto | |
| Teléfono | tel | |
| Email | email | |
| Fecha | date | |
| Hora | select | Franjas fijas, definidas en `restaurante.js` |
| Cantidad de personas | number | 1 a 12 |
| Comentarios | textarea | Alergias, cumpleaños, ubicación preferida |

El botón "Confirmar reserva" está presente y estilado pero **no envía nada**. Al
costado, un panel con las condiciones de reserva (tolerancia, grupos grandes,
cancelación).

Debajo del formulario se deja un contenedor vacío rotulado en el código como el lugar
donde entrará el listado del CRUD en la etapa siguiente. No se renderiza nada ahí
todavía.

### 5.4 Nosotros / Contacto

Historia del restaurante (texto en `textos.js`), galería de fotos del salón, y un
bloque de contacto con mapa, dirección, teléfono, Instagram y horarios.

---

## 6. Componentes

| Componente | Props | Responsabilidad |
|---|---|---|
| `Navbar` | — | Navegación, estado de scroll, menú mobile |
| `Footer` | — | Links, redes, datos del local |
| `Hero` | `titulo`, `bajada`, `imagen`, `acciones[]` | Bloque de portada reutilizable en todas las páginas |
| `Section` | `titulo`, `fondo`, `children` | Ancho máximo, padding vertical, color de fondo |
| `Boton` | `variante`, `to`, `href`, `onClick`, `children` | Botón o link según las props; variantes `primario`, `contorno`, `texto` |
| `PlatoCard` | `nombre`, `descripcion`, `precio`, `imagen` | Card de plato |
| `GaleriaGrid` | `imagenes[]` | Grilla de fotos responsiva |
| `InfoPractica` | — | Horarios, mapa, contacto |

Cada uno debe entenderse sin leer su interior: se sabe qué hace por su nombre y sus
props. Ninguno accede a `src/data/` directamente salvo `Navbar`, `Footer` e
`InfoPractica`, que consumen `restaurante.js` porque muestran datos globales del
local; el resto recibe todo por props.

---

## 7. Imágenes

Al momento de escribir esto no hay fotos reales en buena calidad. El único asset
disponible es `LogoLaPosta.jpg` (150×150px, insuficiente para el hero).

Estrategia interina: `public/img/` se llena con placeholders de tono cálido y
proporción correcta, nombrados con la intención final — `hero-salon.jpg`,
`galeria-1.jpg`, `plato-bife.jpg`. Cuando lleguen las fotos reales se reemplazan los
archivos conservando los nombres y no hace falta tocar código.

Todas las `<img>` llevan `alt` descriptivo en español y `loading="lazy"` salvo la del
hero.

---

## 8. Documentación del proyecto

Cinco archivos, cada uno con un trabajo distinto:

| Archivo | Para qué | Cuándo se actualiza |
|---|---|---|
| `CLAUDE.md` | Lo que Claude carga automáticamente al abrir un chat nuevo: qué es el proyecto, stack, convenciones, y punteros al resto de los docs. Corto a propósito. | Cuando cambia el stack o una convención |
| `docs/CONTEXTO.md` | El restaurante, la consigna del profesor, las decisiones tomadas y por qué | Cuando cambia una decisión de fondo |
| `docs/ESTRUCTURA.md` | Qué contiene cada página y cada componente | Al agregar o cambiar páginas/componentes |
| `docs/BITACORA.md` | Log cronológico inverso. Cada entrada: fecha, qué se hizo, qué archivos | En cada sesión de trabajo |
| `docs/PENDIENTES.md` | Lo que falta: assets, datos a confirmar, etapas futuras | Al cerrar o abrir un pendiente |

`README.md` queda para lo de siempre: qué es, cómo instalarlo, cómo correrlo.

---

## 9. Despliegue

1. `git remote add origin https://github.com/giandicla/LaPostaParrilla.git`
2. `git push -u origin main`
3. En Vercel: **Add New → Project → Import** el repositorio.
4. Vercel autodetecta Vite. Framework Preset `Vite`, build `npm run build`, output
   `dist`. No se toca nada más.
5. Deploy. Queda `lapostaparrilla.vercel.app` (o similar).

Desde ahí, cada push a `main` redespliega solo. El repo estaba vacío y por eso Vercel
no lo enlazaba; con el primer commit el problema desaparece.

`.gitignore` cubre `node_modules/`, `dist/`, `.env*`, `.vercel`, `.DS_Store`.

---

## 10. Datos pendientes de confirmar

Van como placeholder en `src/data/restaurante.js`, cada uno marcado con
`// PENDIENTE` para encontrarlos con un grep:

- Dirección exacta y código postal
- Horarios por día, incluyendo si cierra algún día
- Teléfono y número de WhatsApp
- Email de contacto
- Año de fundación e historia real del local
- **Si son dos locales distintos** — el usuario mencionó "ambos restaurantes". Si son
  dos, el sitio necesita resolver cómo los presenta, y eso cambia la navegación.
- Carta real en PDF, para ambos locales
- Fotos en alta del salón, la parrilla y los platos
- Logo en alta resolución o vectorial

---

## 11. Fuera de alcance en esta etapa

Se listan para dejar constancia de que son decisiones diferidas, no olvidos:

- CRUD de reservas con persistencia — etapa 2, con su propio diseño
- Panel de administración — etapa 2
- Pasarela de pagos — etapa 3, después de que el profesor la enseñe
- Backend y base de datos
- Autenticación
- Inglés / sitio bilingüe
- Tests automatizados
