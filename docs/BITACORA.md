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
