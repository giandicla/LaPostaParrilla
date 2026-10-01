# Bitácora

Log de cambios. **Lo más nuevo arriba.**

---

## 2026-10-01 — La marca real: manual, logo, fotos y cartas

El usuario trajo la carpeta `Branding y fotos/` con el manual de marca, el `Logo.ai`,
las dos cartas en PDF y las fotos de cada local. Detalle y decisiones en
`docs/proceso/sesion-02-2026-10-01.md`.

**Marca**
- Paleta del manual: bordo `#600003` (antes `#5F0004`), arena `#CBC1B1`, oliva
  `#757036`. Salieron el naranja "brasa" (queda solo en el foco) y el "madera".
- Tipografías: Libre Baskerville en títulos, en mayúsculas sostenidas; Gill Sans con
  respaldo Cabin en textos. Antes: Playfair Display + Inter.
- Logo vectorial extraído del `.ai`: navbar, footer, hero y favicon (`app/icon.svg`).
- Radios chicos y líneas finas, como el manual. El fogón del logo como ornamento
  sobre cada título de sección.

**Contenido**
- Nombres de los locales: **La Posta Parrilla** y **La Posta II Restaurante**.
- Fotos reales en todo el sitio (WebP). Se borraron los SVG placeholder y
  `scripts/gen-placeholders.mjs`; lo reemplaza `scripts/procesar-assets.py`.
- Inicio: sección nueva "Lo que nos mueve" (valores del manual) y "Algunos de
  nuestros platos" con 8 fotos, **sin precio**.
- `/carta`: la carta es el PDF hoja por hoja (componente nuevo `VisorCarta`), con
  links para ampliar y descargar. Se borró `src/data/menu.js` (platos y precios
  inventados) y el bloque de Canva. Datos nuevos en `src/data/platos.js`.
- En la carta de la parrilla se tapó la red y clave del WiFi.

**Verificado**
- `npm run lint` y `npm run build` limpios; las rutas siguen estáticas.
- Capturas con Playwright de las cuatro páginas en 1440px y 390px.
- Visor de carta probado por código: flechas, teclado, miniaturas, swipe y reinicio
  al cambiar de local, sin errores de consola.

---

## 2026-09-24 — Etapa 1: boceto visual

Primera sesión. De cero a sitio desplegado.

**Diseño y decisiones**
- Spec escrito y aprobado: `docs/superpowers/specs/2026-09-24-la-posta-web-design.md`
- Se confirmó que son **dos locales** y se eligió el patrón "un sitio, dos salones".
- Bordo de marca muestreado del logo real: `#5F0004`.

**Construido**
- Scaffolding inicial en Vite + React + React Router. Repo enlazado con Vercel.
- **Migración a Next.js App Router** (tarea 6M), en la misma sesión, después de que
  el profesor definiera el stack a mitad de la construcción: el trabajo no podía ser
  Vite, tenía que ser Next.js. La migración fue de framework, no de diseño: la capa
  de datos (`src/data/`), los tokens (`src/styles/tokens.css`) y los CSS Modules de
  cada componente pasaron sin cambios. Lo que cambió fue el ruteo (de React Router a
  carpetas bajo `app/`) y la introducción de Server Components por defecto, con
  `'use client'` limitado a los cuatro archivos que necesitan estado o hooks de
  navegación del cliente. El detalle completo está en la sección 2.bis del spec.
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

---

**Cierre (tarea 14 — pase final)**

Última tarea del plan. No se pudo abrir un navegador real desde acá, así que se
redefinió en tres partes: aplicar los hallazgos diferidos que quedaban pendientes
de revisiones anteriores, correr todas las verificaciones que sí se pueden hacer
sin navegador, y dejar armado el checklist manual para que el usuario lo corra él
mismo con el sitio en pantalla.

- Se unificó el breakpoint de `.grillaPlatos` (`app/page.module.css`) de 600px a
  768px, el mismo que usan Navbar, Footer y Section.
- Se oscureció `--madera` en `src/styles/tokens.css` de `#8B5E3C` a `#7A5134`
  para ganar margen de contraste: pasó de ~4.88:1 a **~6.02:1** sobre `--crema`
  (mínimo pedido: 5.5:1), y de paso mejoró sobre `--blanco` (~6.88:1) y sobre
  `--bordo-100` (~5.52:1). Es un solo cambio en el token y se propaga a precios,
  taglines y acentos en todo el sitio.
- Se documentó en `src/components/GaleriaGrid/GaleriaGrid.jsx` el contrato que
  antes vivía solo en un comentario del CSS: exactamente 3 imágenes, la segunda
  vertical.
- El panel mobile de `Navbar` ahora es completo por teclado: `Escape` lo cierra
  (el listener solo existe mientras el panel está abierto) y al cerrarse — por
  Escape — el foco vuelve al botón de hamburguesa, vía un `ref`. El ajuste de
  estado durante el render que cierra el panel al navegar se dejó como estaba,
  sin convertirlo a efecto.
- `docs/PENDIENTES.md` se actualizó: los cuatro hallazgos de arriba se marcaron
  como resueltos en la lista de "Hallazgos diferidos de la etapa 1".

**Verificaciones sin navegador — todas limpias**
- `npm run lint`: sin errores.
- `npm run build`: sin errores ni warnings; las 5 rutas (`/`, `/carta`,
  `/nosotros`, `/reservas`, `/_not-found`) siguen estáticas (`○`).
- Grep de ids de local hardcodeados (`'parrilla'` / `'restaurante'` en `.jsx`):
  cero resultados.
- Grep de persistencia o red (`localStorage`, `sessionStorage`, `fetch(`,
  `axios`): cero resultados.
- Grep de colores literales en `.module.css`: cero resultados (todo sale de
  `tokens.css`).
- `'use client'` está exactamente en los cuatro archivos esperados: `Navbar`,
  `SelectorLocal`, `app/carta/page.jsx`, `app/reservas/page.jsx`.
- `package.json`: `dependencies` es exactamente `next`, `react`, `react-dom`.
- Grep de restos de React Router: cero resultados.
- Grep de `PENDIENTE` en `src/`: 14 resultados, todos datos de la familia
  (dirección, horarios, teléfono del restaurante, etc.), y coinciden uno a uno
  con lo catalogado en `docs/PENDIENTES.md`.

**Lo que queda para el usuario**
El checklist de QA manual — los tres breakpoints en el navegador, el recorrido
con teclado y el comportamiento de los dos locales, todo lo que necesita ojos
humanos y un navegador de verdad — quedó armado en `docs/QA-MANUAL.md`. Es lo
único que falta correr antes de dar por cerrada esta etapa.
