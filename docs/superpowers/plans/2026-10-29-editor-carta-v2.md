# Editor de la carta v2 — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el editor de una caja por ítem por una sola caja (agregar o editar, con buscador y categoría desplegable) sobre la carta compacta con arrastre; separar los vinos como tercera carta compartida en `/carta` y en el panel; sacar el PDF.

**Architecture:** Una migración nueva agrega `ubicar_item_carta` / `ubicar_bodega_carta` y que un cambio de sección o de bodega deje el ítem al final del destino. La API separa la carta de un local (`?local=`) de la de vinos (`/vinos`) y cambia `mover` por `posicion`. En el front, `CajaCarta` (la caja) y `ListaCarta` (las filas con asa) reemplazan a `EditorItemCarta`; la búsqueda y el cálculo de posiciones son funciones puras testeadas.

**Tech Stack:** Next.js 16, React 19, CSS Modules, Supabase (Postgres, RLS, pgTAP), Zod 4, `node --test`. Sin librerías nuevas.

**Spec:** `docs/superpowers/specs/2026-10-29-editor-carta-v2-design.md` (y el anterior, `2026-10-29-carta-editable-design.md`, para todo lo que no cambia). Maqueta: `.superpowers/brainstorm/1367-1793313277/content/editor-v1.html`.

## Global Constraints

- Rama `feat/accesos-carta` (PR #13). Un commit por tarea, mensajes en inglés. No mergear ni hacer `db push` sin el OK del usuario; el orden es `db push` → merge.
- La migración de la carta ya está en producción: todo cambio de esquema va en una **migración nueva** (`20261029130000_carta_v2.sql`); las funciones `mover_*` quedan.
- Español en código y textos; colores solo de `tokens.css`; nada de `'parrilla'`/`'restaurante'` a mano en componentes; botones sobre fondo claro con `variante="secundario"` (nunca `contorno`).
- Sin librerías nuevas: el arrastre con eventos de puntero; el asa también se mueve con teclado (flechas arriba/abajo con el foco en el asa).
- Precios en pesos enteros > 0; `precios` solo en categorías con tamaños, uno por tamaño (la base ya lo valida).
- Anclas de la carta pública: `#<vista>-<slug>` (por ejemplo `#parrilla-entradas`, `#vinos-vinos-malbec`).
- **Verificar mirando**: toda verificación de UI incluye una captura (no alcanza con que el elemento exista en el DOM; ver `hallazgos.md` 1.28).
- Sin PDF: no queda ninguna ruta ni botón para imprimir o descargar la carta.

## Review Focus

1. **Arrastrar con el dedo en el celular** (375 px): mueve la fila sin que la página haga scroll al mismo tiempo, y suelta en la posición correcta → verificación en Task 4.
2. **Mover con teclado**: foco en ⠿, flecha abajo → la fila baja una posición, el foco sigue en su asa → verificación en Task 4.
3. **Cambiar de categoría entre una con tamaños y una sin** (pizza → Entradas): la caja muestra un solo precio y manda `precio`, no `precios`; la base acepta → test de `datosDeLaCaja` en Task 4 y pgTAP en Task 1.
4. **Buscar con o sin tildes** ("rucula" encuentra "RÚCULA Y PARMESANO") → test de `buscarEnCarta` en Task 4.
5. **Editar un producto que se borró** (desde otra pestaña): guardar da "No encontramos ese ítem." y la caja vuelve a "agregar" → ya cubierto por el 404 de la API; verificación en Task 4.

---

### Task 1: Base — ubicar ítems y bodegas, cambio de categoría

**Files:**
- Create: `supabase/migrations/20261029130000_carta_v2.sql`
- Test: `supabase/tests/database/09_carta_v2.test.sql`

**Interfaces:**
- Produces:
  - `ubicar_item_carta(p_id uuid, p_posicion int) returns void` — posición 1-based **dentro de su grupo** (en vinos, su bodega; si no, la sección); fuera de rango se acota. Renumera `orden` de toda la sección `1..n` sin huecos, respetando el orden de las bodegas. Bloquea las filas de la sección (`for update`). Exige admin (`exigir_admin_carta()`).
  - `ubicar_bodega_carta(p_seccion_id uuid, p_bodega text, p_posicion int) returns void` — igual con bloques de bodega.
  - Trigger `validar_item_carta` (reemplazado con `create or replace`): en `UPDATE`, si cambió `seccion_id` o `bodega`, el ítem va al final del destino (al final de su bodega si ya existe en la sección destino, y toma su región salvo que `region` también cambie; si no, al final de la sección), y se renumera la sección de origen sin huecos.

- [ ] **Step 1: Escribir `09_carta_v2.test.sql`** (estilo de `08_carta.test.sql`; admin y cliente de prueba). Asserts:
  - `ubicar_item_carta(<3º de entradas>, 1)` → queda primero; los órdenes de la sección son `1..n` sin repetidos.
  - posición `99` → queda último; posición `0` → primero.
  - en `vinos-malbec`, ubicar el 2º vino de una bodega en 1 → primero de **su bodega**; la bodega no cambia de lugar.
  - `ubicar_bodega_carta(malbec, <3ª bodega>, 1)` → primera, sus vinos contiguos.
  - `update carta_items set seccion_id = <ensaladas>` en un ítem de entradas → queda último en ensaladas; entradas queda `1..n-1`.
  - `update … set seccion_id = <entradas>, precio = 9000, precios = null` en una pizza → acepta; sin cambiar `precios` → `P0001` 'Cargá un precio o un precio por tamaño, no los dos.'.
  - cambiar la `bodega` de un vino a otra bodega existente de la sección → queda último de esa bodega con su región.
  - como cliente: `ubicar_item_carta` → `throws_ok … 'P0001', 'Solo el admin puede editar la carta.'`.
- [ ] **Step 2: Correr** — `npm run db:test` · Expected: `09_carta_v2` FAIL (las funciones no existen).
- [ ] **Step 3: Escribir la migración.** Grants como en `20261029120000_carta.sql` (revoke de `public, anon`, grant a `authenticated`).
- [ ] **Step 4: Correr** — `npm run db:reset && npm run db:test` · Expected: todos PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: place menu items and wineries at a position; moving category goes to the end"`

### Task 2: API — vinos aparte, `posicion`, cambio de categoría

**Files:**
- Modify: `src/servidor/carta-base.js`, `src/servidor/carta.js`, `src/servidor/esquemas.js`
- Modify: `app/api/v1/carta/route.js`, `app/api/v1/carta/items/[id]/route.js`, `app/api/v1/carta/secciones/[id]/bodegas/route.js`
- Create: `app/api/v1/carta/vinos/route.js`
- Test: `src/servidor/carta.test.js`, `src/servidor/esquemas.test.js`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `crearBaseCarta(cliente)`: `leerFilas(idLocal)` devuelve **solo** las secciones con ese `local_id`; nuevo `leerFilasVinos()` → `{ cubierto: null, secciones, items }` de las compartidas; `ubicarItem(id, posicion)`, `ubicarBodega(idSeccion, bodega, posicion)`; `editarItem(id, cambios)` acepta `seccionId` (lo pasa a `seccion_id`).
  - `src/servidor/carta.js`: `leerVinos({ base })`; `editarItem(id, { posicion, region, ...cambios }, { base })` → si trae `posicion`, `ubicarItem`; si trae `region` y el ítem tiene bodega, la aplica con `editarBodega` a la bodega (la final, si también cambió); `editarBodega(idSeccion, { bodega, region, posicion }, { base })`. `mover` deja de existir en la API.
  - Esquemas: `esquemaItemCambios` suma `seccionId: z.uuid()` y `posicion: z.number().int().min(1)`, saca `mover`; `esquemaBodega` cambia `mover` por `posicion`.
  - `GET /api/v1/carta/vinos` → 200 `armarCarta(leerFilasVinos())`, mismo `Cache-Control` y `&fresca=1`.

- [ ] **Step 1: Tests** en `carta.test.js`: `'editar con posicion ubica el ítem'` → `[['ubicarItem','i-1',3]]`; `'la región de un vino se aplica a su bodega'` (base falsa cuyo `editarItem` devuelve `{ id, seccion_id: 's', bodega: 'Catena' }`) → llama `editarBodega('s','Catena',{ region: 'Mendoza' })`; `'leer vinos'` arma la carta con `leerFilasVinos`; el test de no admin incluye `posicion`. En `esquemas.test.js`: `esquemaItemCambios` acepta `{ posicion: 2 }` y `{ seccionId: ID }`, rechaza `{ posicion: 0 }` y `{ mover: 'arriba' }` (ya no es un campo: la prueba es que `{ mover: 'arriba' }` solo no pasa el "al menos una clave conocida"); `esquemaBodega` acepta `{ bodega: 'X', posicion: 1 }`. Actualizar el test de `mover` existente a `posicion`.
- [ ] **Step 2: Correr** — `npm test` · Expected: FAIL.
- [ ] **Step 3: Implementar.** Para rechazar claves desconocidas, los esquemas de cambios usan `.strict()`.
- [ ] **Step 4: Correr** — `npm test && npm run lint` · Expected: PASS.
- [ ] **Step 5: Probar contra la base local** (`npm run dev`): `GET /api/v1/carta?local=parrilla` → 11 secciones, ninguna `compartida`; `GET /api/v1/carta/vinos` → 11 secciones; `PATCH` con `posicion` como admin → 200; como cliente → 403.
- [ ] **Step 6: Commit** — `git commit -m "feat: wines served apart; items and wineries placed by position"`

### Task 3: `/carta` pública con Vinos en el medio

**Files:**
- Modify: `app/carta/page.jsx`, `app/carta/page.module.css`
- Modify: `src/components/SelectorLocal/SelectorLocal.jsx` + `.module.css` (opción con nota)
- Modify: `src/data/carta.js` (dato `CARTA_VINOS`)
- Modify: `src/servicios/carta.js` (`leerVinos({ fresca })`)

**Interfaces:**
- Consumes: Task 2 (`GET /api/v1/carta/vinos`).
- Produces:
  - `CARTA_VINOS = { id: 'vinos', nombre: 'Vinos', nota: 'De los dos locales', carta: { estilo: 'recto', bajada: 'Carta de vinos' } }` en `src/data/carta.js` (la vista; no es un local).
  - `SelectorLocal` acepta en cada opción un `nota` opcional que se muestra debajo del nombre, en chico.
  - `leerVinos({ fresca } = {})` en `src/servicios/carta.js`.

- [ ] **Step 1: Implementar.** Opciones del selector: `[LOCALES[0], CARTA_VINOS, ...LOCALES.slice(1)]` (vinos en el medio). `?local=vinos` elige Vinos; cualquier otro valor inválido sigue cayendo al primer local. Vinos: portada con la foto del local por defecto y bajada "Carta de vinos"; `HojaCarta` recibe `CARTA_VINOS` como `local` (usa `carta.estilo`, `carta.bajada` y `nombre` para el `alt`); sin cubierto; si falla, el mensaje sin WhatsApp. Anclas de vinos: `#vinos-<slug>`. **Links viejos**: si llega `?local=<local>` con un hash `#<local>-vinos-…` o `#<local>-copas-y-descorche`, `router.replace` a `/carta?local=vinos#vinos-<slug>`. "Editar esta carta" (admin) → `/admin/carta?vista=<vista>`.
- [ ] **Step 2: Verificar** — `npm test && npm run lint && npm run build` · Expected: PASS, `/carta` estática.
- [ ] **Step 3: Verificar en el navegador con capturas** (1280 y 375 px): el selector con Vinos en el medio y la nota legible; la carta de la parrilla termina en "Tragos" (sin vinos); Vinos muestra los tipos y "Copas y descorche"; `/carta?local=parrilla#parrilla-vinos-malbec` termina en Vinos, en Malbec.
- [ ] **Step 4: Commit** — `git commit -m "feat: wines as a shared menu between the two locals on /carta"`

### Task 4: El panel — una caja y la carta con arrastre

**Files:**
- Create: `src/components/CajaCarta/CajaCarta.jsx` + `.module.css`
- Create: `src/components/ListaCarta/ListaCarta.jsx` + `.module.css`
- Create: `src/data/editorCarta.js` + `src/data/editorCarta.test.js` (funciones puras del editor)
- Modify: `app/admin/carta/page.jsx` + `.module.css`
- Modify: `src/servicios/carta.js` (escrituras: `editarItem` acepta `seccionId`/`posicion`/`region`; `ubicarItem(id, posicion)`; `ubicarBodega(idSeccion, bodega, posicion)`; se borran `moverItem` y el `mover` de `editarBodega`)
- Delete: `src/components/EditorItemCarta/`

**Interfaces:**
- Consumes: Tasks 2–3, `src/validacion/carta.js`, `Campo`, `PestanasAdmin`, `SelectorLocal` con nota.
- Produces (en `src/data/editorCarta.js`):
  - `buscarEnCarta(carta, texto) → [{ item, seccion, bodega? }]`: nombre sin mayúsculas ni tildes (`normalize('NFD')`), máximo 8, vacío si `texto` tiene menos de 2 letras.
  - `posicionTrasArrastre(ids, idMovido, idDestino) → int` (1-based): la posición del destino en la lista sin el movido.
  - `datosDeLaCaja(valores, seccion, item?) → objeto para la API`: precio o precios según `seccion.tamanos`; textos vacíos → `null`; editando, solo lo que cambió (`seccionId` incluido si cambió la categoría).
- `CajaCarta` props: `carta`, `vista`, `item` (o `null` = agregar), `alElegir(item)`, `alCancelar()`, `alCambiar()`.
- `ListaCarta` props: `carta`, `idEditando`, `alEditar(item)`, `alCambiar()`.

- [ ] **Step 1: Tests** en `editorCarta.test.js`: `buscarEnCarta(carta, 'rucula')` encuentra `'RÚCULA Y PARMESANO'`; `'r'` → `[]`; `posicionTrasArrastre(['a','b','c','d'], 'a', 'c') === 2`, `('d','a') === 1`; `datosDeLaCaja` de una pizza pasada a Entradas → `{ seccionId, precio: 9000 }` sin `precios`; `datosDeLaCaja` sin cambios → `{}`; descripción vaciada → `{ descripcion: null }`.
- [ ] **Step 2: Correr** — `npm test` · Expected: FAIL.
- [ ] **Step 3: Implementar `editorCarta.js`**, después `CajaCarta`, `ListaCarta` y la página.
  - Página: pestañas; selector Parrilla · Vinos · Restaurante (`?vista=`); cubierto solo en un local; la caja; la lista. Al tocar Editar, la caja se carga y la página sube a la caja.
  - Caja: título "Agregar a la carta" / "Editando: <nombre>"; buscador con resultados en lista (teclado: flechas + Enter); categoría `<select>` con las categorías de la vista (en Vinos la etiqueta es "Tipo de vino", y si no es "Copas y descorche", campos Bodega con sugerencias y Región); precio o un precio por tamaño según la categoría elegida; descripción y traducción (en vinos, detalle); Agregar/Guardar + Cancelar; validación como hoy.
  - Lista: por categoría, filas compactas `⠿ · nombre (y traducción chica) · precio · Editar · Eliminar` (Eliminar con confirmación); en vinos, encabezado de bodega con su propia asa. Arrastre con `pointerdown`/`pointermove`/`pointerup` y `setPointerCapture`, `touch-action: none` en el asa; al soltar, `ubicarItem(id, posicionTrasArrastre(...))`. Teclado en el asa: flechas mueven una posición (`ubicarItem` con la posición ±1) y el foco vuelve al asa de esa fila. Fila en edición resaltada.
  - Si guardar falla con "No encontramos ese ítem.", la caja vuelve a "agregar" y muestra el mensaje.
- [ ] **Step 4: Correr** — `npm test && npm run lint && npm run build` · Expected: PASS.
- [ ] **Step 5: Verificar en el navegador con el admin de prueba, con capturas** (1280 y 375 px): agregar un plato (último de su categoría); buscar "provo" y editar el precio; pasar una pizza a Entradas con un precio; arrastrar una fila con mouse y con toque emulado; mover con flechas; arrastrar una bodega; editar un vino cambiando bodega y región; eliminar; un cliente ve "sin permisos". Reiniciar la base local al terminar.
- [ ] **Step 6: Commit** — `git commit -m "feat: one-box menu editor with search and drag to reorder"`

### Task 5: Sin PDF, documentación y registro

**Files:**
- Delete: `app/admin/carta/imprimir/`
- Modify: `src/components/HojaCarta/HojaCarta.jsx` + `.module.css` (fuera `columnas`, `dosColumnas` y `@media print`)
- Modify: `docs/RUBRICA.md`, `docs/BACKEND.md`, `docs/ESTRUCTURA.md`, `docs/QA-MANUAL.md`, `docs/PENDIENTES.md`, `docs/BITACORA.md`, `CLAUDE.md` (lista de `'use client'`), `docs/proceso/sesion-06-2026-10-29.md` (§8) y `hallazgos.md` si aparece algo nuevo.

- [ ] **Step 1: Borrar y ajustar.** `grep -rn "imprimir\|columnas\|Guardar PDF" app src` → nada.
- [ ] **Step 2: Verificar** — `npm test && npm run lint && npm run build && npm run db:test` · Expected: PASS.
- [ ] **Step 3: Commit** — `git commit -m "docs: menu editor v2, wines apart, no PDF"`
- [ ] **Step 4:** Revisión final de la rama; después actualizar la descripción del PR #13 (orden de despliegue: `db push` de `20261029130000_carta_v2.sql` → merge, con el OK del usuario).
