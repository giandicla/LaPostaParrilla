# Bitácora

Log de cambios. **Lo más nuevo arriba.**

---

## 2026-10-08 — Diseño propio: "la carta y el cartel"

Rama `feat/diseno-propio`. Pase para que el sitio no se vea hecho por IA, con el
plugin de diseño. El detalle y el porqué están en `docs/proceso/sesion-04-2026-10-08.md`.

- Fondo blanco (`--papel`) en lugar de crema, como pide el manual. Se van las
  sombras (`--sombra-*`), los radios de 4 y 6px, los velos de foto y
  `--tracking-etiqueta`. Nuevo `--linea` (1px gris).
- `Hero`: bloque bordo con el texto + foto sin velo al costado (abajo en mobile).
  La foto del Inicio se descubre una vez al cargar.
- `Navbar`: siempre bordo; se fue el estado de scroll. Links en minúsculas.
- `Section`: título y bajada a la izquierda, sin el fogón ni la rayita.
- `LocalCard`, `PlatoCard`, `InfoLocal`: sin tarjeta, sombra ni zoom. Los platos
  van agrupados por salón, con epígrafe; `PlatoCard` pierde `etiquetaLocal`.
  Horarios con línea punteada.
- `SelectorLocal`: pestañas subrayadas. Carta: índice fijo al costado en desktop.
- `Boton` y etiquetas en minúsculas, sin saltito al pasar el mouse.
- Textos sin puntos medios; `MARCA.rubro` nuevo para la bajada del logo.
- Fotos con un color de fondo mientras cargan.
- Formularios, Mis reservas, Ingresar y Admin: línea de 1px en vez de sombra.

---

## 2026-10-08 — El teléfono no acepta letras

Pedido del usuario: que en el teléfono ni se puedan escribir letras. `limpiarTelefono`
filtra mientras se escribe o se pega: solo entran dígitos, espacios y `+ - ( )`
(test nuevo; 10 en total). `inputMode="tel"` abre el teclado numérico en el celular.
La migración de la validación (`20261008120000`) ya está aplicada en producción.

---

## 2026-10-08 — Validación de formularios (E3)

Rama `feat/validacion-formularios`.

- `src/validacion/reservas.js`: reglas de nombre, teléfono, fecha, hora, personas,
  comentarios y motivo, como funciones puras. 9 tests con `node --test` (`npm test`,
  también en el CI). `package.json` pasa a `"type": "module"`.
- Componente `Campo`: conecta cada control con su error y su ayuda
  (`aria-invalid`, `aria-describedby`).
- `/reservas`: `noValidate` y mensajes propios. Cada campo avisa al salir de él y se
  revalida mientras se corrige; al enviar, resumen con `role="alert"` y foco al
  primer error. Contador de caracteres en comentarios. El día bloqueado pasó a ser
  el error del campo fecha.
- Admin: los formularios de mover reserva y bloquear día validan antes de mandar
  (incluido "ese día ya está bloqueado").
- Base: migración `20261008120000_validacion_contacto.sql`. Trigger
  `validar_contacto` (nombre 2–80, teléfono 8–15 dígitos, comentarios ≤ 500) que solo
  corre al insertar o al cambiar esos campos, para no trabar reservas viejas; check
  `not valid` de 120 caracteres en el motivo de un bloqueo. 10 tests pgTAP nuevos.
  Los datos de prueba de los tests viejos usaban teléfonos como `'111'`: se
  cambiaron por uno válido.

---

## 2026-10-08 — La rúbrica, CI y flujo con PRs

- `docs/RUBRICA.md`: la grilla oficial de corrección contra el estado del proyecto,
  entregable por entregable. Hay que sacar Excelente en los 5 criterios transversales.
- CI en GitHub Actions (`.github/workflows/ci.yml`): lint + build, tests pgTAP de la
  base y tests Deno de la Edge Function, en cada PR y en cada push a `main`.
- Plantilla de PR con checklist (`.github/pull_request_template.md`). Desde acá,
  todo cambio entra por PR (hasta hoy no se había abierto ninguno).
- Decisión del usuario: Mercado Pago para seña de reserva, gift cards y take away.
- `README.md` y `CONTEXTO.md` al día (el README todavía decía "etapa 1, maqueta").

---

## 2026-10-06 — En producción, y solo con Google

- Proyecto Supabase `la-posta` (São Paulo) creado por CLI; migraciones, función de
  mails, secretos y Vault cargados; los tests pgTAP pasan contra el remoto.
- Google OAuth activado (`supabase config push`); variables en Vercel; `main`
  publicado. Primer admin nombrado por SQL.
- **Ingreso solo con Google** (decisión del usuario): el servidor de mails de
  fábrica de Supabase no le entrega a clientes, así que el registro con email no
  iba a funcionar. Se sacó del front y se apagó el proveedor de email en Supabase.
- Logos: "G" de Google en el botón de ingreso; Instagram y WhatsApp donde aparecen
  (componente `Icono`, SVG inline).

---

## 2026-10-01 — Backend con Supabase (partes 1 y 2)

Rama `feat/backend-supabase`. Spec: `docs/superpowers/specs/2026-10-01-backend-supabase-design.md`.
Cómo correrlo y desplegarlo: `docs/BACKEND.md`.

**Base (Postgres, `supabase/migrations/`)**
- Tablas `locales`, `perfiles` (rol cliente/admin), `franjas_reserva`, `reservas`,
  `dias_bloqueados`, `notas_reserva`.
- RLS en todas. El cliente ve y crea solo lo suyo, en estado pendiente; cancela con
  `cancelar_reserva()` hasta 2 h antes; no puede cambiarse el rol (permiso por columna).
- Trigger de validación: franja del local, fecha futura, día no bloqueado. Check de
  1 a 6 personas. Índice único: una reserva activa por usuario, local y día.
- Realtime sobre `reservas`. Trigger con `pg_net` → Edge Function de mails.

**Mails** — Edge Function `notificar-reserva` (Deno) con Brevo: reserva nueva y
cancelación del cliente → admin; confirmada, rechazada, movida o cancelada por el
admin → cliente. Sin API key, solo registra en el log.

**Front**
- `src/servicios/` (única puerta a Supabase), `SesionProvider`, `RequiereSesion`,
  `EstadoReserva`, estilos de formulario compartidos.
- Páginas nuevas: `/ingresar`, `/mis-reservas`, `/admin`, `/admin/dia`. `/reservas`
  pasó de maqueta a formulario real. Navbar con links de cuenta; su menú
  horizontal pasó de 768 a 1100 px porque con los links nuevos no entraba.
- Condiciones de reserva actualizadas (pendiente, 6 personas, 2 horas).

**Verificado**
- 33 tests pgTAP en verde, y prueba de mutación (sacar el índice único y abrir las
  notas hace fallar exactamente los tests que corresponden).
- 7 tests de Deno de la lógica de mails.
- Recorrido Playwright de 12 pasos contra Supabase local, sin errores de página.
- `npm run lint` limpio; todas las rutas siguen estáticas.

---

## 2026-10-01 — La carta vuelve a HTML, con los datos reales

El usuario probó el visor del PDF y no se leía cómodo. Se volvió a una carta en
HTML como la de la etapa 1, pero ahora con el contenido real:

- `src/data/cartas.json`: las dos cartas transcriptas de los PDF por script (posición
  de cada texto en la hoja → sección, plato, traducción, precio). Parrilla: 11
  secciones, 10 cepas de vino, copas; La Posta II: 14 secciones. Verificado por
  script: la lista de precios del JSON es idéntica a la de cada PDF (188 y 100).
- Se corrigieron errores de tipeo evidentes (ver `sesion-02`, sección 7).
- Componente nuevo `SeccionCarta`; se borró `VisorCarta` y las hojas en WebP.
- El JSON tiene la forma pensada para cargarse en la base de datos del backend.

---

## 2026-10-01 — Datos reales de los locales

- Dirección compartida: Av. Arrayanes 263, Q8407 Villa La Angostura (los locales
  están uno al lado del otro). Un solo mapa de Google para los dos, por ahora.
- Horario: todos los días de 12 a 23, todo el año.
- Reservas: 12:00 a 13:00 y 20:00 a 21:00, cada 15 minutos.
- Teléfono y WhatsApp de La Posta II: +54 9 2944 86-1339.
- Email compartido: lapostavla@gmail.com. Apertura: diciembre de 2020.
- Los datos comunes viven una sola vez arriba de `src/data/locales.js` y cada local
  los referencia: si algún día difieren, se cambia solo el del local.
- Copys corregidos: "a unas cuadras" / "en la misma cuadra larga" ya no eran ciertos.

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
- En la carta de la parrilla se tapó la red y clave del WiFi. Después del primer
  push se tapó también en la de La Posta II, que se había pasado por alto.

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
