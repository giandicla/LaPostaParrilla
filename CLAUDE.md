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
- **El alcance avanza clase a clase.** Al principio el profesor pidió **solo el
  front en React**; el backend es **Supabase** (BaaS, decisión del usuario), el
  front le habla desde el navegador y la seguridad la pone la **RLS**. Ver
  `docs/BACKEND.md`. El 2026-10-08 la cátedra dio **webhooks y Mercado Pago**: a
  partir de ahí entra código de servidor para la API del catálogo y los pagos.
  Desde el 2026-10-18 están en `main` las tres rutas de la seña (ver "Pagos"), y
  desde la sesión 06 las de la carta (`app/api/v1/carta/…`, ver `docs/BACKEND.md`).
  Fuera de eso, no agregar API routes, Server Actions ni middleware sin hablarlo.
- **Todo cambio va por rama + PR** (lo pide la rúbrica, E1). CI en
  `.github/workflows/ci.yml`; la plantilla del PR trae el checklist. No mergear
  sin el OK del usuario.
- **Se ingresa con Google o con mail y contraseña** (desde la sesión 09). Los mails
  de Auth (confirmar la cuenta, contraseña nueva) salen por el **SMTP de Brevo solo en
  producción**: bloque `[remotes.produccion]` de `supabase/config.toml`, clave
  `BREVO_SMTP_KEY` en `supabase/.env` (no se sube). En local caen en Mailpit
  (http://127.0.0.1:54324). El servidor de mails de fábrica de Supabase no le entrega a
  clientes: no apagar el SMTP de producción. Antes de un `config push`, mirar
  `npx supabase config diff`.
- **Toda llamada a Supabase pasa por `src/servicios/`.** Ningún componente
  importa `@supabase/supabase-js`. Las reglas de negocio (6 personas, 1 hora para cancelar,
  franjas, una reserva por turno, modificar hasta 1 hora antes, seña y vencimiento) viven en la base, no en los componentes.
  **Única excepción: `src/servidor/`**, el código que usan solo las rutas de
  `app/api/`. Ahí se crean clientes propios, incluido uno con la clave secreta
  (`SUPABASE_SECRET_KEY`, se saltea la RLS) para la tabla `pagos`. Ningún componente
  ni página importa nada de `src/servidor/`.
- El esquema se cambia **solo con migraciones** (`supabase/migrations/`) y cada
  regla nueva lleva su test pgTAP (`npm run db:test`).

## Stack

Next.js 16 con App Router + React 19 + CSS Modules. JavaScript, no TypeScript
(salvo la Edge Function, que es Deno + TypeScript). Sin librerías de UI.
Supabase para auth, base y tiempo real. Deploy automático a Vercel en cada push a `main`
y preview de Vercel en cada PR. **Las previews usan la base de producción** (no hay
base de pruebas): lo que se haga en una preview queda en los datos reales.

- Las rutas son carpetas en `app/`. Cada página es `app/<ruta>/page.jsx`.
- **Server Components por defecto.** `'use client'` va en `Navbar`,
  `SelectorLocal`, `SesionProvider`, `RequiereSesion`, `SelloMercadoPago`,
  `app/carta`, y en las páginas que usan la sesión: `reservas`, `reservas/pago`,
  `ingresar`, `ingresar/contrasena`, `mis-reservas`, `admin`, `admin/dia`, `admin/bloqueos`, `admin/carta`. Todas las páginas
  siguen prerenderizándose como estáticas; las únicas rutas dinámicas son las de
  `app/api/`.
- Navegación con `next/link`. `Boton` tiene dos props de destino, a propósito:
  `to` renderiza un `next/link` para navegación interna (rutas del sitio);
  `href` renderiza un `<a target="_blank" rel="noreferrer">` para links
  externos (WhatsApp). Nunca se usan juntas.

## Pagos (Mercado Pago, solo credenciales de prueba)

Seña obligatoria de $10.000 para reservar desde la web, con Checkout Pro. Detalle,
variables y despliegue en `docs/BACKEND.md`; diseño en
`docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md`.

- `POST /api/v1/pagos`: crea el pago y la preferencia (el monto sale de la base).
- `POST /api/webhooks/mercadopago`: valida la firma, consulta el pago real y
  concilia con `acreditar_pago()`.
- `POST /api/v1/reservas/:id/cancelacion`: cancela con la sesión del que llama y
  dice qué pasa con la seña. **La app no reembolsa por Mercado Pago** (decisión del
  usuario, 2026-11-01): si cancela el cliente la seña no se devuelve; si cancela el
  local o el pago llega tarde, queda en "Señas a devolver" y el local la devuelve a
  mano. Ver `docs/BACKEND.md`.
- **Nunca credenciales de producción de Mercado Pago.** `MP_ACCESS_TOKEN` es del
  vendedor de prueba y solo vive en el servidor; la única clave con
  `NEXT_PUBLIC_` es la Public Key (`NEXT_PUBLIC_MP_PUBLIC_KEY`, pública por diseño).
- **Las previews comparten la base de producción:** un cambio de esquema se aplica
  (`supabase db push`) en la misma ventana que el merge, no antes.
- La vuelta desde Mercado Pago y el webhook usan `urlDelSitio()`
  (`src/servidor/sitio.js`): en producción el dominio que informa Vercel, en
  previews y local `APP_URL`. No volver a leer `process.env.APP_URL` directo.

## Convenciones

- Código, nombres y contenido en **español**. Mensajes de commit en inglés.
- Colores **solo** desde las custom properties de `src/styles/tokens.css`.
  La paleta sale del manual de marca: bordo `#600003`, arena `#CBC1B1`,
  oliva `#757036`. Tipografías: Baskerville (títulos, en mayúsculas) y Gill Sans.
- **Los platos con foto no llevan precio.** Los precios viven solo en la carta, que
  desde la sesión 06 está en la base (tablas `carta_secciones` y `carta_items`; los
  vinos son secciones compartidas por los dos locales) y se edita en `/admin/carta`.
  Lo pidió el usuario.
- Un componente = una carpeta: `Nombre/Nombre.jsx` + `Nombre.module.css`.
- CSS **mobile first**. Breakpoints: solo los de la escala documentada en
  `src/styles/tokens.css` (420 · 600 · 768 · 900 · 1100); no agregar otros.
- Datos sin confirmar se marcan con `// PENDIENTE`. Buscarlos:
  `grep -rn "PENDIENTE" src/`
- Un dato que falta **se omite**, no se inventa: si un local no tiene teléfono
  cargado, la UI esconde el botón en vez de mostrar un link roto.

## Comandos

```bash
npm run dev           # servidor de desarrollo
npm run build         # build de producción a .next/
npm test              # tests de las funciones puras (node --test, src/**/*.test.js)
npm run db:test       # tests pgTAP de la base (requiere `npx supabase start`)
npm run db:reset      # base local desde cero: migraciones + usuarios de prueba
node scripts/variantes-img.mjs   # versiones de 480 y 960 px de cada foto + src/data/imagenes.js
                      # (correrlo después de procesar-assets.py o de sumar una foto)
python scripts/procesar-assets.py "../Branding y fotos"
                      # regenera logo y fotos desde la carpeta de branding
                      # (requiere PyMuPDF y Pillow)
```

La carpeta `Branding y fotos/` (al lado del repo, no adentro) tiene el manual de
marca, el `Logo.ai`, las cartas en PDF y las fotos originales. La carta del sitio ya
no sale de esos PDF: desde la sesión 06 se edita en `/admin/carta`. El sitio no
imprime ni descarga la carta (decisión del usuario).

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
- `docs/RUBRICA.md` — la grilla de corrección y qué cumple el proyecto hoy. **Hay
  que sacar Excelente en los 5 criterios transversales.** Actualizarlo cuando un
  ítem cambie de estado
- `docs/PENDIENTES.md` — lo que falta: datos, fotos, etapas futuras
- `docs/QA-MANUAL.md` — checklist de verificación visual, para correr en un navegador
- `docs/BACKEND.md` — Supabase: cómo correrlo en local y cómo ponerlo en producción
- `docs/proceso/` — registro del trabajo con IA, para la presentación de la materia
- `docs/superpowers/specs/` — los diseños aprobados
- `docs/superpowers/plans/` — los planes de implementación

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
