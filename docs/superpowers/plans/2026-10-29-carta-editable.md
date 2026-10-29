# Carta editable — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La carta pasa de `cartas.json`/`vinos.json` a Supabase, se sirve por una API propia, el admin la edita desde `/admin/carta`, la página `/carta` toma la estética del PDF y el admin la imprime en formato oficio.

**Architecture:** Dos tablas nuevas (`carta_secciones`, `carta_items`) más `locales.cubierto`, con RLS (lectura pública, escritura admin) y funciones SQL para mover ítems y bodegas. Route Handlers en `app/api/v1/carta/…` con el patrón de la seña (`manejar`, Zod, lógica en `src/servidor/` inyectada por parámetro). El front llama a la API por `src/servicios/carta.js`; la hoja con la estética del PDF es un componente (`HojaCarta`) que comparten `/carta` y la vista de impresión.

**Tech Stack:** Next.js 16 (App Router, Route Handlers), React 19, CSS Modules, Supabase (Postgres + RLS + pgTAP), Zod 4, `node --test`, `next/font/google`.

**Spec:** `docs/superpowers/specs/2026-10-29-carta-editable-design.md` (leerlo antes de empezar; la maqueta aprobada es `.superpowers/brainstorm/1769-1793300096/content/carta-estilo-v3.html`).

## Global Constraints

- Rama `feat/carta-editable`; un commit por tarea, mensajes en inglés; no mergear sin el OK del usuario.
- Código, nombres y textos en español. JavaScript (no TypeScript). Sin librerías nuevas salvo fuentes de `next/font/google`.
- Colores solo desde `src/styles/tokens.css` (sumar tokens ahí si hacen falta).
- Ningún componente importa `@supabase/supabase-js` ni `src/servidor/`; el front pasa por `src/servicios/`.
- Nunca escribir `'parrilla'` ni `'restaurante'` a mano en un componente: lo que varía por local va como dato en `LOCALES`.
- El esquema se cambia solo con migraciones, y cada regla lleva su test pgTAP.
- Errores al usuario en castellano; la API nunca devuelve un stack trace.
- Precios en pesos enteros `> 0`; `precio` y `precios` excluyentes; `precios` solo en secciones con `tamanos`, uno por tamaño.
- Las anclas públicas no cambian: `#<idLocal>-<slug>` (por ejemplo `#parrilla-entradas`).
- Fuera de alcance: agotado, búsqueda, filtros, crear/renombrar/reordenar secciones, fotos por ítem.
- Fuentes: Oswald (títulos parrilla), Pathway Gothic One (títulos restaurante), Old Standard TT (texto de la hoja). Logo: `public/logo/logo-bordo.svg`.

## Review Focus

1. **Un no-admin que escribe** (cliente logueado que llama a PATCH/DELETE): un `update` bajo RLS afecta 0 filas sin error; la API tiene que responder 403, no 200. → test en Task 3 (`exigirAdmin`) y pgTAP en Task 1.
2. **Mover en el borde** (subir el primer ítem, bajar el último, subir la primera bodega): no hace nada y no rompe el orden. → pgTAP en Task 1.
3. **Un vino nuevo de una bodega existente**: aparece dentro de su bodega, no como una bodega repetida al final. → test de `armarCarta` en Task 2.
4. **Pizza con un solo precio o con tres** (`precios` que no coincide con `tamanos`): la base lo rechaza con un mensaje en castellano. → pgTAP en Task 1 y validación en Task 5.
5. **La API caída o lenta en `/carta`**: estado de carga sobrio y, si falla, mensaje + WhatsApp del local, nunca una página vacía. → verificación en el navegador en Task 4.

---

### Task 1: Base — tablas, carga inicial, reglas y funciones de orden

**Files:**
- Create: `supabase/migrations/20261029120000_carta.sql` (esquema, RLS, trigger, funciones)
- Create: `scripts/carta-a-sql.mjs` (genera la carga inicial desde los JSON)
- Create: `supabase/migrations/20261029120100_carta_datos.sql` (generado por el script; se commitea)
- Test: `supabase/tests/database/08_carta.test.sql`

**Interfaces:**
- Produces (tablas):
  - `carta_secciones(id uuid pk default gen_random_uuid(), slug text not null, local_id text null references locales, titulo text not null, grupo text null, nota text null, tamanos text[] null, orden int not null)`, único en `(coalesce(local_id, ''), slug)`.
  - `carta_items(id uuid pk default gen_random_uuid(), seccion_id uuid not null references carta_secciones on delete cascade, nombre text not null, descripcion text, traduccion text, detalle text, bodega text, region text, precio int, precios int[], orden int not null)`.
  - `locales.cubierto int null check (cubierto > 0)`.
- Produces (funciones, todas lanzan `P0001` en castellano si quien llama no es admin):
  - `mover_item_carta(p_id uuid, p_sentido int) returns void` — `p_sentido` −1 sube, +1 baja; intercambia `orden` con el vecino de la misma sección (y, si la sección es de vinos, de la misma bodega). En el borde no hace nada.
  - `mover_bodega_carta(p_seccion_id uuid, p_bodega text, p_sentido int) returns void` — intercambia el bloque de la bodega con el bloque vecino; renumera `orden` de la sección `1..n` conservando el orden interno de cada bloque. En el borde no hace nada.
  - `cambiar_region_bodega(p_seccion_id uuid, p_bodega text, p_region text) returns void`.
  - `cambiar_cubierto(p_local_id text, p_cubierto int) returns void` — `security definer`, porque `locales` no tiene política de update.

- [ ] **Step 1: Escribir `08_carta.test.sql`** (mismo estilo que `01_reservas_cliente.test.sql`: usuarios de prueba Ana cliente y un admin, `set local role` + `request.jwt.claims`). Asserts:
  - carga inicial: `count(*) from carta_secciones where local_id = 'parrilla'` = 11, `= 'restaurante'` = 14, `is null` = 11; `count(*) from carta_items` = 278 (179 de `cartas.json` + 95 vinos + 4 de "Copas y descorche"); `select cubierto from locales where id='parrilla'` = 1500, `'restaurante'` = 2000.
  - como `anon`: `select` funciona; `insert` en `carta_items` → `throws_ok … '42501'`.
  - como Ana: `insert` → `42501`; `select mover_item_carta(…)` → `throws_ok` con `P0001`; `cambiar_cubierto` → `P0001`.
  - como admin: inserta un ítem en `entradas` de la parrilla con `orden` nulo → queda con `orden = max + 1` de la sección.
  - `precio` y `precios` juntos → `throws_ok` `P0001`; ninguno de los dos → `P0001`; `precio = -1` → `23514`.
  - pizza (`pizzas-clasicas`, `tamanos` de 2) con `precios = '{21000}'` → `P0001` 'Cargá un precio por tamaño.'; con `precios` en una sección sin `tamanos` → `P0001`.
  - vino sin `bodega` en una sección `grupo = 'Vinos'` → `P0001`; plato con `bodega` en `entradas` → `P0001`.
  - `mover_item_carta` del primer ítem de `entradas` con −1 → los `orden` de la sección no cambian; con +1 → intercambia con el segundo.
  - en `vinos-malbec`: mover un vino de una bodega con −1 cuando es el primero de su bodega → no cambia nada (no salta a la bodega anterior).
  - `mover_bodega_carta` de la segunda bodega de `vinos-malbec` con −1 → pasa a ser la primera (por `min(orden)`), y sus vinos siguen contiguos; la primera con −1 → sin cambios.
  - `cambiar_region_bodega` → todos los vinos de esa bodega en esa sección tienen la región nueva; los de otras secciones, no.

- [ ] **Step 2: Correr y ver que falla**
  Run: `npx supabase start` (si no está) y `npm run db:test`
  Expected: `08_carta.test.sql` falla (las tablas no existen).

- [ ] **Step 3: Escribir `20261029120000_carta.sql`.** Esquema y funciones de arriba. Reglas en un trigger `before insert or update` sobre `carta_items` (`validar_item_carta`): `num_nonnulls(precio, precios) = 1`; `precios` solo si la sección tiene `tamanos` y con `array_length` igual; `bodega` obligatoria si la sección tiene `grupo = 'Vinos'` y prohibida si no; textos recortados (`btrim`) y `nombre` no vacío; si `orden` es null, `coalesce(max(orden), 0) + 1` de la sección. Checks de tabla: `precio > 0`, `0 < all(precios)`, largos (`nombre` ≤ 120, `descripcion`/`traduccion`/`detalle` ≤ 300, `bodega`/`region` ≤ 80). Mensajes del trigger, textuales: 'Cargá un precio o un precio por tamaño, no los dos.', 'Cargá un precio por tamaño.', 'Esta sección no tiene tamaños: cargá un solo precio.', 'Indicá la bodega del vino.', 'Solo los vinos llevan bodega.', 'Escribí el nombre.'. RLS: `select` para `anon, authenticated` con `true`; `insert/update/delete` para `authenticated` con `public.es_admin()` (mismo estilo que `dias_bloqueados` en `20261001130000_panel_admin.sql`). Las funciones `mover_*` y `cambiar_region_bodega` son `security invoker`; empiezan con `if not public.es_admin() then raise exception 'Solo el admin puede editar la carta.'`.

- [ ] **Step 4: Escribir `scripts/carta-a-sql.mjs`** (Node, sin dependencias): lee `src/data/cartas.json` y `src/data/vinos.json` y escribe `supabase/migrations/20261029120100_carta_datos.sql` con `insert`s: una fila de `carta_secciones` por sección (`local_id` = la clave del JSON, `null` para las de `vinos.json`; `orden` = posición, empezando en 1); un ítem por `items[]` y uno por vino de cada `bodegas[].vinos[]` (con `bodega`, `region`, `detalle`), `orden` correlativo dentro de la sección siguiendo el orden del JSON (bodega por bodega); y `update public.locales set cubierto = … where id = …` desde `cubierto`. Escapar comillas simples (`'` → `''`). Las secciones se referencian por `(local_id, slug)` con un subselect, no por uuid fijo. Correr: `node scripts/carta-a-sql.mjs`.

- [ ] **Step 5: Correr los tests**
  Run: `npm run db:reset && npm run db:test`
  Expected: todos los archivos pasan, incluido `08_carta.test.sql`.

- [ ] **Step 6: Commit**
  ```bash
  git add supabase/migrations/20261029120000_carta.sql supabase/migrations/20261029120100_carta_datos.sql scripts/carta-a-sql.mjs supabase/tests/database/08_carta.test.sql
  git commit -m "feat: menu tables with admin-only writes, seeded from the JSON menus"
  ```

### Task 2: Armar la carta desde las filas (función pura)

**Files:**
- Create: `src/servidor/carta.js`
- Test: `src/servidor/carta.test.js`

**Interfaces:**
- Consumes: las filas de Task 1.
- Produces: `armarCarta({ cubierto, secciones, items })` → `{ cubierto, secciones: Seccion[] }`, donde `secciones` ya viene filtrada (propias del local y compartidas) y `items` son las filas de esas secciones.
  - Orden: primero las secciones con `local_id` del local, después las compartidas (`local_id` null); dentro de cada grupo por `orden`.
  - `Seccion` de platos: `{ id: slug, idSeccion: uuid, titulo, grupo?, nota?, tamanos?, items: [{ id, nombre, descripcion?, traduccion?, precio? | precios? }] }`.
  - `Seccion` de vinos (`grupo === 'Vinos'`): igual pero con `bodegas: [{ bodega, region?, vinos: [{ id, nombre, detalle?, precio }] }]` en lugar de `items`. Bodegas ordenadas por el menor `orden` de sus vinos; vinos por `orden`.
  - Las claves con `null` se omiten (misma forma que hoy documenta `src/data/carta.js`, más `id`/`idSeccion`).

- [ ] **Step 1: Escribir los tests** con filas armadas a mano:
  - `'las secciones del local van antes que las compartidas'`: una sección propia `orden 2`, otra propia `orden 1`, una compartida `orden 1` → ids `['a', 'b', 'vinos-x']`.
  - `'agrupa los vinos por bodega en el orden de su primer vino'`: vinos `Zuccardi orden 1`, `Catena orden 2`, `Zuccardi orden 3` → `bodegas.map(b => b.bodega)` es `['Zuccardi', 'Catena']` y Zuccardi tiene 2 vinos en orden.
  - `'un vino nuevo de una bodega existente queda dentro de su bodega'`: además de lo anterior, `Catena orden 9` → Catena tiene 2 vinos y no aparece una tercera bodega.
  - `'omite los campos nulos'`: un ítem con `descripcion: null` → `!('descripcion' in item)`.
  - `'los precios por tamaño pasan como precios'`: ítem con `precios: [21000, 30000]` → `item.precios` igual y sin `precio`.

- [ ] **Step 2: Correr y ver que falla** — Run: `npm test` · Expected: FAIL, `armarCarta` no existe.
- [ ] **Step 3: Implementar `armarCarta` en `src/servidor/carta.js`.**
- [ ] **Step 4: Correr** — Run: `npm test` · Expected: PASS.
- [ ] **Step 5: Comprobación única contra los JSON** (no se commitea): un script en el scratchpad que convierta `cartas.json`/`vinos.json` en filas como lo hace `carta-a-sql.mjs`, pase cada local por `armarCarta` y compare con `getCarta()` de `src/data/carta.js` ignorando `id`/`idSeccion` de ítems y secciones (comparar `slug` con el `id` viejo). Expected: iguales para los dos locales.
- [ ] **Step 6: Commit** — `git commit -m "feat: assemble a local's menu from database rows"`

### Task 3: API de lectura y escritura

**Files:**
- Modify: `src/servidor/respuestas.js` (`json(cuerpo, status = 200, headers = {})`)
- Modify: `src/servidor/supabase.js` (`clientePublico()`; `usuarioDelPedido` suma `cliente` al objeto que devuelve)
- Modify: `src/servidor/esquemas.js` (esquemas de la carta)
- Create: `src/servidor/carta-base.js` (adaptador a Supabase)
- Modify: `src/servidor/carta.js` (casos de uso)
- Create: `app/api/v1/carta/route.js` (GET)
- Create: `app/api/v1/carta/items/route.js` (POST)
- Create: `app/api/v1/carta/items/[id]/route.js` (PATCH, DELETE)
- Create: `app/api/v1/carta/secciones/[id]/bodegas/route.js` (PATCH)
- Create: `app/api/v1/carta/locales/[id]/route.js` (PATCH)
- Test: `src/servidor/carta.test.js`, `src/servidor/esquemas.test.js`

**Interfaces:**
- Consumes: `armarCarta` (Task 2); tablas y funciones SQL (Task 1); `manejar`, `ErrorHttp`, `leerCuerpo`, `esquemaId`, `usuarioDelPedido`.
- Produces:
  - `crearBaseCarta(cliente)` → `{ leerFilas(idLocal) → { cubierto, secciones, items } | null, esAdmin() → boolean, crearItem(datos) → item, editarItem(id, cambios) → item | null, borrarItem(id) → boolean, moverItem(id, sentido), editarBodega(idSeccion, bodega, { region }), moverBodega(idSeccion, bodega, sentido), cambiarCubierto(idLocal, cubierto) }`. Traduce errores: `P0001` → `ErrorHttp(400, mensaje)`, `23514` → `ErrorHttp(400, 'Revisá los datos: algún valor no es válido.')`, `42501` → `ErrorHttp(403, 'Solo el admin puede editar la carta.')`.
  - En `src/servidor/carta.js`: `leerCarta(idLocal, { base })` (404 'No encontramos ese local.' si `leerFilas` da null), `exigirAdmin(base)` (403 'Solo el admin puede editar la carta.'), `crearItem(datos, { base })`, `editarItem(id, cambios, { base })` (si trae `mover`, llama `moverItem` con −1/+1 y después aplica el resto; 404 'No encontramos ese ítem.' si no existe), `borrarItem(id, { base })` (404 igual), `editarBodega(idSeccion, { bodega, region, mover }, { base })`, `cambiarCubierto(idLocal, cubierto, { base })`. Todas las de escritura llaman primero a `exigirAdmin`.
  - Esquemas: `esquemaItemNuevo` (`seccionId` uuid, `nombre` 1–120, `descripcion`/`traduccion`/`detalle` ≤ 300 opcionales, `bodega`/`region` ≤ 80 opcionales, `precio` entero positivo o `precios` array de enteros positivos, al menos uno de los dos); `esquemaItemCambios` (los mismos campos menos `seccionId`, todos opcionales y los de texto `.nullable()` para borrarlos, más `mover: 'arriba' | 'abajo'`; al menos una clave); `esquemaBodega` (`bodega` 1–80, `region` ≤ 80 nullable opcional, `mover` opcional; al menos `region` o `mover`); `esquemaCubierto` (`cubierto` entero positivo); `esquemaLocal = z.string().regex(/^[a-z0-9-]+$/)`.
  - Rutas (respuestas): GET `?local=` → 200 `armarCarta(...)` con `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`; 400 'Falta el local.' sin `local`. POST → 201 ítem. PATCH ítem → 200 ítem. DELETE → 204 sin cuerpo. PATCH bodegas → 200 `{ ok: true }`. PATCH locales → 200 `{ cubierto }`.

- [ ] **Step 1: Tests de casos de uso** (con `base` falsa, como `cancelaciones.test.js`):
  - `'un no admin no puede editar'`: `esAdmin` → false; `crearItem`, `editarItem`, `borrarItem`, `editarBodega`, `cambiarCubierto` rechazan con `ErrorHttp` status 403 y no llaman a la escritura.
  - `'editar con mover sube el ítem'`: `{ mover: 'arriba' }` → `moverItem(id, -1)`; `'abajo'` → `+1`.
  - `'borrar un ítem que no existe da 404'`: `borrarItem` de la base → false → status 404.
  - `'leer un local inexistente da 404'`.
- [ ] **Step 2: Tests de esquemas** en `esquemas.test.js`: `esquemaItemNuevo` rechaza `precio: 0`, `precio: 1.5`, `nombre: '   '`, sin `precio` ni `precios`; acepta `{ seccionId, nombre: 'Chorizo', precio: 6000 }`. `esquemaItemCambios` rechaza `{}` y `mover: 'costado'`. `esquemaBodega` rechaza `{ bodega: 'X' }` sin `region` ni `mover`.
- [ ] **Step 3: Correr** — `npm test` · Expected: FAIL.
- [ ] **Step 4: Implementar** esquemas, `carta-base.js`, casos de uso y las cinco rutas (mismo patrón que `app/api/v1/reservas/[id]/cancelacion/route.js`: `const { id } = await params`, validar el id con `esquemaId` → 400). Lectura con `crearBaseCarta(clientePublico())`; escrituras con `crearBaseCarta(usuario.cliente)`. `esAdmin` llama `rpc('es_admin')`.
- [ ] **Step 5: Correr** — `npm test && npm run lint` · Expected: PASS, lint limpio.
- [ ] **Step 6: Probar contra la base local** con `npm run dev`: `curl "http://localhost:3000/api/v1/carta?local=parrilla"` → 200 con 22 secciones (11 + 11) y el header `Cache-Control`; `curl -X DELETE …/api/v1/carta/items/<uuid>` sin token → 401; con el token de un cliente de prueba → 403.
- [ ] **Step 7: Commit** — `git commit -m "feat: menu API, public read and admin-only writes"`

### Task 4: La carta pública con la estética del PDF

**Files:**
- Create: `src/servicios/carta.js` (lectura pública; las escrituras se suman en Task 5)
- Create: `src/components/HojaCarta/HojaCarta.jsx` + `HojaCarta.module.css`
- Create: `src/styles/fuentesCarta.js` (las tres fuentes de `next/font/google` como variables CSS)
- Modify: `src/components/SeccionCarta/SeccionCarta.jsx` + `.module.css` (estética nueva, misma estructura y accesibilidad)
- Modify: `app/carta/page.jsx` + `page.module.css`
- Modify: `src/data/locales.js` (sacar `cartaPdf`; sumar `carta: { estilo: 'recto' | 'redondeado', bajada: 'Parrilla Patagónica' | 'Restaurante' }`)
- Modify: `src/styles/tokens.css` (`--papel: #FBF8F2` y lo que haga falta)
- Delete: `public/cartas/carta-parrilla.pdf`, `public/cartas/carta-restaurante.pdf`

**Interfaces:**
- Consumes: GET `/api/v1/carta` (Task 3).
- Produces:
  - `leerCarta(idLocal)` en `src/servicios/carta.js` → la carta (`armarCarta`) o lanza `Error` con mensaje en castellano.
  - `<HojaCarta local={local} columnas={1 | 2}>{secciones}</HojaCarta>` con `cubierto` como prop (`cubierto={carta.cubierto}`): dibuja la hoja (marco según `local.carta.estilo`, logo `logo-bordo.svg` con `alt={local.nombre}`, `local.carta.bajada`, ornamento de rombos solo en estilo recto), los hijos y el pie con el cubierto ("CUBIERTO / Talheres" y el precio). Task 6 lo reutiliza con `columnas={2}`.
  - `SeccionCarta` mantiene sus props (`seccion`, `idAncla`) y su marcado accesible; los títulos de sección toman la fuente y el filete del estilo de la hoja que la contiene (por clase del contenedor, no por prop de local).

- [ ] **Step 1: Implementar** `fuentesCarta.js`, tokens, `HojaCarta`, el restyle de `SeccionCarta` y la página, siguiendo la tabla "Estética" del spec y la maqueta `carta-estilo-v3.html`. La página pide la carta con `leerCarta` en un `useEffect` por `idActivo`; mientras carga, un texto sobrio ("Cargando la carta…") dentro de la sección; si falla, el mensaje 'No pudimos cargar la carta. Probá de nuevo en un momento.' y el `Boton href` de WhatsApp del local si tiene teléfono. Se saca el link "Descargar la carta en PDF" y el estilo `.enlacePdf`. La forma no cambia: selector de local, índice arriba, una sola columna.
- [ ] **Step 2: Verificar** — `npm test && npm run lint && npm run build` · Expected: PASS, `/carta` sigue prerenderizada como estática.
- [ ] **Step 3: Verificar en el navegador** (`npm run dev`, base local): las dos cartas a 375 px y a 1280 px; el índice salta a `#parrilla-entradas`; las pizzas muestran los dos precios; los vinos agrupados por bodega; con la API apagada (detener `supabase`) aparece el mensaje y el WhatsApp. Screenshot para el usuario.
- [ ] **Step 4: Commit** — `git commit -m "feat: public menu reads the API and wears the printed menu's look"`

### Task 5: Servicio y validación de la edición

**Files:**
- Modify: `src/servicios/carta.js` (escrituras)
- Create: `src/validacion/carta.js`
- Test: `src/validacion/carta.test.js`

**Interfaces:**
- Consumes: rutas de escritura (Task 3).
- Produces:
  - En `src/servicios/carta.js`: `crearItem(datos)`, `editarItem(id, cambios)`, `borrarItem(id)`, `moverItem(id, 'arriba' | 'abajo')`, `editarBodega(idSeccion, { bodega, region?, mover? })`, `cambiarCubierto(idLocal, cubierto)`. Todas con el token de la sesión, como `llamar()` en `src/servicios/pagos.js` pero con método (`POST`/`PATCH`/`DELETE`); lanzan `Error` con el `error` de la respuesta.
  - En `src/validacion/carta.js` (puras, devuelven el mensaje o `''`, como `src/validacion/reservas.js`): `LIMITES_CARTA = { nombre: 120, texto: 300, bodega: 80 }`, `validarNombreItem(v)`, `validarPrecio(v)` (acepta `'6000'`, `'6.000'` y `'$ 6.000'`; rechaza vacío, 0, negativos y decimales), `validarPrecios(valores, tamanos)`, `validarTexto(v, max)`, `aEntero(v)` → número o `null`.

- [ ] **Step 1: Tests** en `src/validacion/carta.test.js`: `validarPrecio('')` → 'Escribí el precio.'; `validarPrecio('0')` y `('-5')` → 'El precio tiene que ser mayor que cero.'; `('12,5')` → 'El precio va en pesos enteros, sin centavos.'; `('6.000')` → `''` y `aEntero('6.000') === 6000`; `validarPrecios(['21000'], ['Chica', 'Grande'])` → 'Cargá un precio por tamaño.'; `validarNombreItem('  ')` → 'Escribí el nombre.'; nombre de 121 caracteres → 'Hasta 120 caracteres.'.
- [ ] **Step 2: Correr** — `npm test` · Expected: FAIL.
- [ ] **Step 3: Implementar** validación y servicio.
- [ ] **Step 4: Correr** — `npm test` · Expected: PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat: menu editing service and field validation"`

### Task 6: Panel `/admin/carta` y vista de impresión

**Files:**
- Create: `app/admin/carta/page.jsx` + `page.module.css`
- Create: `src/components/EditorItemCarta/EditorItemCarta.jsx` + `.module.css`
- Create: `app/admin/carta/imprimir/page.jsx` + `page.module.css`
- Modify: `app/admin/page.jsx` (link "Editar la carta" junto al de `/admin/dia`)

**Interfaces:**
- Consumes: `leerCarta` y escrituras de `src/servicios/carta.js` (Tasks 4–5), validación (Task 5), `HojaCarta` y `SeccionCarta` (Task 4), `RequiereSesion admin`, `LOCALES`.
- Produces: `/admin/carta?vista=<idLocal | vinos>` y `/admin/carta/imprimir?local=<idLocal>`.

- [ ] **Step 1: `/admin/carta`.** `'use client'`, envuelta en `RequiereSesion admin` y `Suspense` (como `/admin/dia`). Selector arriba: un botón por local de `LOCALES` más "Vinos". En la vista de un local: el cubierto editable y sus secciones propias; en "Vinos": las secciones compartidas, agrupadas por bodega, con la región y los botones subir/bajar de la bodega. Por ítem, `EditorItemCarta`: campos de nombre, precio (o un precio por tamaño, con la etiqueta del tamaño), descripción, traducción (y detalle en vinos); "Guardar" (solo habilitado si algo cambió), "Subir", "Bajar" (deshabilitados en el borde), "Borrar" con `window.confirm('¿Borrar «<nombre>» de la carta?')`. Al final de cada sección, "Agregar" abre un `EditorItemCarta` vacío (en vinos, con campo bodega y región). Validación por campo como en `/reservas`: mensaje al salir del campo, `aria-invalid` + `aria-describedby`, foco al primer error al guardar; el error de la API se muestra en el ítem. Tras cada escritura se vuelve a leer la carta. Un botón "Imprimir / Guardar PDF" por local abre `/admin/carta/imprimir?local=<id>` en otra pestaña.
- [ ] **Step 2: `/admin/carta/imprimir`.** `RequiereSesion admin`; lee la carta y la dibuja con `<HojaCarta columnas={2}>` (las secciones de comida y después los vinos); al terminar de cargar llama a `window.print()` una vez. CSS de impresión: `@page { size: 8.5in 13in; margin: … }`, `break-inside: avoid` en cada sección y en cada bodega, sin navbar ni footer del sitio al imprimir (`@media print`), y el marco del local repetido en cada hoja (con un elemento `position: fixed` que en impresión se repite por página, o el método que el builder pruebe que funciona en Chrome y Edge). En pantalla se ve la hoja con un botón "Imprimir".
- [ ] **Step 3: Verificar** — `npm test && npm run lint && npm run build` · Expected: PASS.
- [ ] **Step 4: Verificar en el navegador** con el admin de la base local: cambiar un precio y verlo en `/carta`; agregar un plato y borrarlo; subir el primero (deshabilitado) y bajar uno; agregar un vino a una bodega existente y verlo dentro de su bodega; subir una bodega; cargar una pizza con un solo precio → mensaje en el campo; un cliente (no admin) que entra a `/admin/carta` ve el aviso de `RequiereSesion`. Imprimir a PDF las dos cartas y revisar: hoja oficio, dos columnas, marco en todas las hojas, ninguna sección cortada. Screenshots y el PDF para el usuario.
- [ ] **Step 5: Commit** — `git commit -m "feat: admin menu editor and print view"`

### Task 7: Limpieza y documentación

**Files:**
- Delete: `src/data/cartas.json`, `src/data/vinos.json`, `src/data/carta.test.js`
- Modify: `src/data/carta.js` (queda solo `formatearPrecio`; se borra `getCarta` y el comentario de forma pasa a `src/servidor/carta.js`)
- Modify: `scripts/procesar-assets.py` (deja de generar `public/cartas/`)
- Modify: `scripts/carta-a-sql.mjs` (encabezado: ya se usó una vez; los JSON ya no existen — o borrarlo, a elección del builder, dejándolo dicho en la bitácora)
- Modify: `docs/RUBRICA.md` (E4 y E5 con el criterio textual y el estado; corregir "búsqueda, filtros, agotado" como nota escrita por la IA), `docs/BACKEND.md` (tablas, funciones, rutas, despliegue: `supabase db push` en la ventana del merge), `docs/ESTRUCTURA.md`, `docs/BITACORA.md`, `docs/PENDIENTES.md` (etapa 2.3 parcial: carta hecha; fuentes originales si la familia consigue licencia), `CLAUDE.md` (los precios viven en la base, no en los JSON; `'use client'` suma `admin/carta`), `docs/QA-MANUAL.md` (checklist de la carta y de la impresión)
- Create: `docs/proceso/sesion-06-2026-10-29.md` y entrada en `docs/proceso/hallazgos.md` (la lista de E4 escrita por la IA tomada como de la cátedra; el revisor del spec que encontró los slugs repetidos)

- [ ] **Step 1: Borrar y ajustar** lo de arriba. `grep -rn "cartas.json\|vinos.json\|getCarta\|cartaPdf" app src scripts` → solo comentarios históricos o nada.
- [ ] **Step 2: Verificar** — `npm test && npm run lint && npm run build && npm run db:test` · Expected: todo PASS.
- [ ] **Step 3: Commit** — `git commit -m "docs: menu now lives in the database; rubric, backend and process log"`
- [ ] **Step 4: PR** con la plantilla y su checklist; en la descripción, que la migración se aplica con `supabase db push` en la misma ventana que el merge (las previews usan la base de producción). No mergear sin el OK del usuario.
