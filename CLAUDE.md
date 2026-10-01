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

Next.js 16 con App Router + React 19 + CSS Modules. JavaScript, no TypeScript.
Sin librerías de UI, sin backend. Deploy automático a Vercel en cada push a `main`.

- Las rutas son carpetas en `app/`. Cada página es `app/<ruta>/page.jsx`.
- **Server Components por defecto.** `'use client'` solo va en `Navbar`,
  `SelectorLocal`, `app/carta/page.jsx` y `app/reservas/page.jsx`.
- Navegación con `next/link`. `Boton` tiene dos props de destino, a propósito:
  `to` renderiza un `next/link` para navegación interna (rutas del sitio);
  `href` renderiza un `<a target="_blank" rel="noreferrer">` para links
  externos (WhatsApp). Nunca se usan juntas.

## Convenciones

- Código, nombres y contenido en **español**. Mensajes de commit en inglés.
- Colores **solo** desde las custom properties de `src/styles/tokens.css`.
  La paleta sale del manual de marca: bordo `#600003`, arena `#CBC1B1`,
  oliva `#757036`. Tipografías: Baskerville (títulos, en mayúsculas) y Gill Sans.
- **Los platos con foto no llevan precio.** Los precios viven solo en la carta
  (`src/data/cartas.json`). Lo pidió el usuario.
- Un componente = una carpeta: `Nombre/Nombre.jsx` + `Nombre.module.css`.
- CSS **mobile first**. Breakpoints principales: 768px y 1100px (algunas grillas
  puntuales usan otros; ver el hallazgo sobre breakpoints en `docs/PENDIENTES.md`).
- Datos sin confirmar se marcan con `// PENDIENTE`. Buscarlos:
  `grep -rn "PENDIENTE" src/`
- Un dato que falta **se omite**, no se inventa: si un local no tiene teléfono
  cargado, la UI esconde el botón en vez de mostrar un link roto.

## Comandos

```bash
npm run dev           # servidor de desarrollo
npm run build         # build de producción a .next/
python scripts/procesar-assets.py "../Branding y fotos"
                      # regenera logo, fotos y hojas de carta desde la carpeta
                      # de branding (requiere PyMuPDF y Pillow)
```

La carpeta `Branding y fotos/` (al lado del repo, no adentro) tiene el manual de
marca, el `Logo.ai`, las cartas en PDF y las fotos originales. Cuando la familia
cambie la carta, se reemplaza el PDF ahí y se corre el script.

## Registro del proceso — OBLIGATORIO

La cátedra pide usar IA **y registrar el proceso**: dónde falla, dónde acierta, y qué
sale distinto de lo esperado. Ese registro se presenta al final del cuatrimestre, así
que es entregable, no opcional.

**Al cerrar cada sesión de trabajo, o cuando el usuario lo pida, agregá una entrada**
en `docs/proceso/`:

- `docs/proceso/sesion-NN-AAAA-MM-DD.md` — una por sesión: qué se pidió, qué se
  decidió y por qué, qué falló, qué quedó abierto.
- `docs/proceso/hallazgos.md` — acumulativo. Si en la sesión apareció algo que vale
  contar en la presentación (un error de la IA con su evidencia, un acierto
  inesperado, una lección de método), va acá con archivo o commit concreto.

**Reglas:** se registran los errores con su evidencia, no como "hubo un ajuste menor".
Las entradas viejas no se editan para quedar bien — si algo resultó equivocado, se
corrige en una entrada nueva dejando el error visible. Se distingue lo que decidió el
usuario de lo que decidió la IA.

Ver `docs/proceso/README.md` para el formato.

## Dónde está el resto

- `docs/CONTEXTO.md` — el restaurante, la consigna, las decisiones y por qué
- `docs/ESTRUCTURA.md` — qué contiene cada página y componente
- `docs/BITACORA.md` — log de cambios, lo más nuevo arriba
- `docs/PENDIENTES.md` — lo que falta: datos, fotos, etapas futuras
- `docs/QA-MANUAL.md` — checklist de verificación visual, para correr en un navegador
- `docs/proceso/` — registro del trabajo con IA, para la presentación de la materia
- `docs/superpowers/specs/` — los diseños aprobados
- `docs/superpowers/plans/` — los planes de implementación
