# Editor de la carta v2: una caja, la carta abajo y los vinos aparte

Fecha: 2026-10-29 (sesión 06, después del deploy de la carta editable). Diseño
acordado en el chat con el usuario, sobre la maqueta
`.superpowers/brainstorm/1367-1793313277/content/editor-v1.html`. Sigue al spec
`2026-10-29-carta-editable-design.md`: lo que no se dice acá, sigue como allá.

## Por qué

El usuario probó el panel en la preview del PR #13 y lo encontró incómodo: una
caja grande por producto, una abajo de la otra, y para agregar hay que bajar hasta
la categoría. "Por más que sea admin, tiene que ser sencillo de usar."

## Decisiones

Del usuario:

- **Una sola caja de edición arriba**, igual a las de hoy pero una. Sin nada
  elegido sirve para **agregar**; al tocar **Editar** en un producto, la caja se
  carga con él.
- En la caja: precio, **categoría (lista desplegable)**, descripción y traducción
  (y nombre). En vinos, la categoría es el **tipo de vino** (Malbec, Cabernet…).
- **Buscador** en la caja, para encontrar el producto que se quiere editar.
- **Abajo, la carta**: cada producto en una fila con **Editar** y **Eliminar** del
  lado del precio y, del lado del nombre, **un asa para arrastrar** y cambiar la
  posición.
- **Agregar** pone el producto **último en su categoría**; para reordenarlo, se
  arrastra.
- **Los vinos aparte**, en la carta pública y en el panel: el selector pasa a ser
  **Parrilla · Vinos · Restaurante**, con los vinos **en el medio** y algo que
  muestre que **se comparten entre los dos locales**.
- **Sin PDF**: la carta no se puede imprimir ni descargar desde el sitio. Se borra
  `/admin/carta/imprimir` y sus botones.

De la IA (presentadas en el chat; el usuario no las objetó):

- Cambiar la categoría de un producto existente lo pasa **al final** de la nueva.
- En vinos, la caja pide también la **bodega** y su **región**; la región sigue
  siendo de la bodega (cambiarla cambia la de todos sus vinos en ese tipo). La
  bodega de un vino ya cargado **se puede editar** (era un menor pendiente).
- **Eliminar** pide confirmación. **Cancelar** vacía la caja y vuelve a "agregar".
  La fila que se está editando queda resaltada.
- **Arrastrar** reordena **dentro de la misma categoría** (en vinos, dentro de su
  bodega). Pasar a otra categoría se hace desde la caja. Las **bodegas** también
  tienen su asa para moverse enteras dentro de su tipo de vino.
- El asa **también se maneja con teclado** (foco en el asa + flechas arriba/abajo)
  y con el dedo en el celular. Arrastrar sin alternativa de teclado no pasa
  accesibilidad.
- El **cubierto** de cada local sigue editable arriba, en la vista del local.
- **"Copas y descorche"** va con los vinos.
- En la `/carta` pública, la hoja de **Vinos** usa el estilo de la parrilla (marco
  recto), con la bajada "Carta de vinos" y la marca de compartida; su índice lista
  los tipos de vino. Las cartas de cada local ya no traen los vinos al final.
- El trabajo sigue en la rama `feat/accesos-carta` (PR #13, que todavía no se
  mergeó): las pestañas del panel, el link "Editar esta carta" y la variante
  `secundario` de `Boton` quedan.

## Parte 1 — Base (migración nueva; la de la carta ya está en producción)

- **Ubicar un ítem en una posición**: `ubicar_item_carta(p_id uuid, p_posicion int)`
  lo pone en la posición pedida (1 = primero) **dentro de su grupo** (sección; en
  vinos, su bodega) y renumera la sección sin huecos ni repetidos. Lo usa el
  arrastre. Fuera de rango, se acota al primero o al último.
- **Ubicar una bodega**: `ubicar_bodega_carta(p_seccion_id uuid, p_bodega text,
  p_posicion int)`, misma idea con bloques de bodega.
- **Cambiar de categoría**: un `update` que cambia `seccion_id` (o la `bodega` de un
  vino) deja el ítem al final de su nueva categoría (o de su nueva bodega, si ya
  existe; si no, al final de la sección), con la misma regla que el insert. Las
  reglas del trigger (precio/precios según tamaños, bodega solo en vinos) se
  vuelven a validar contra la sección nueva.
- Todas exigen admin, como las de hoy. `mover_item_carta` y `mover_bodega_carta`
  pueden quedar o borrarse (builder).
- Bloqueo de las filas de la sección mientras se renumera (`for update`), así dos
  arrastres seguidos no dejan órdenes repetidos (era un menor pendiente).
- Tests pgTAP para cada regla nueva: posición válida, fuera de rango, en vinos solo
  dentro de la bodega, cambio de sección al final, cambio de bodega, no admin.

## Parte 2 — API

- `GET /api/v1/carta?local=<id>`: **solo las secciones del local** (ya no suma las
  compartidas). Sigue público y con el mismo caché.
- `GET /api/v1/carta/vinos`: las secciones compartidas (vinos + copas), misma forma
  y caché. Ningún local se llama "vinos": es una ruta propia, no un local.
- `PATCH /api/v1/carta/items/:id` acepta además `seccionId`, `bodega` y `region`
  (la región se aplica a la bodega), y `posicion` en lugar de `mover`.
- `PATCH /api/v1/carta/secciones/:id/bodegas` acepta `posicion` en lugar de `mover`.
- Mismos permisos, validación y errores que hoy.

## Parte 3 — `/carta` pública

- Selector **Parrilla · Vinos · Restaurante** (vinos en el medio), con la marca de
  compartida en "Vinos" (por ejemplo un texto chico "De los dos locales"; la forma
  exacta es del builder, que se lea en celular). URL: `?local=vinos` o la que el
  builder elija, mientras `?local=parrilla` y `?local=restaurante` sigan andando y
  las anclas de las secciones sigan siendo las de siempre.
- La hoja de cada local, sin vinos. La hoja de Vinos, con sus tipos y bodegas.
- "Editar esta carta" (admin) lleva a la vista que corresponde, también a Vinos.

## Parte 4 — `/admin/carta`

```
[ Reservas | Carta ]                        ← pestañas (PR #13)
CARTA
( Parrilla )( Vinos · de los dos locales )( Restaurante )
Cubierto: [ 1.500 ] [Guardar]                ← solo en un local
┌ Agregar a la carta ───────────── o ── Editando: Provoleta ┐
│ 🔍 Buscar un producto para editarlo…                        │
│ Nombre [        ]  Precio [      ] (o un precio por tamaño)│
│ Categoría [Entradas ▾]  (en Vinos: Tipo de vino [Malbec ▾], │
│                          Bodega [      ], Región [      ])  │
│ Descripción [   ]  Traducción [   ]   (en vinos: Detalle)   │
│ [Agregar | Guardar]  Cancelar                               │
└─────────────────────────────────────────────────────────────┘
ENTRADAS
⠿ EMPANADA DE CARNE…            $ 6.000   Editar  Eliminar
⠿ CHORIZO                       $ 6.000   Editar  Eliminar
```

- **Buscador**: busca por nombre (sin distinguir mayúsculas ni acentos) en la vista
  actual; muestra las coincidencias debajo; elegir una carga la caja.
- La caja valida como hoy (mensaje por campo, foco al primer error); los precios
  aceptan `6.000` y `$ 6.000`.
- Después de cada cambio, la carta de abajo se vuelve a leer (sin caché).
- Se borra `EditorItemCarta` como está hoy (una caja por ítem) o se transforma en
  la caja única; decisión del builder.
- **Sin "Imprimir / Guardar PDF"**.

## Parte 5 — Lo que se borra

`app/admin/carta/imprimir/`, los botones de imprimir, las dos columnas y el CSS de
impresión de `HojaCarta` (`columnas`, `@media print`), y las menciones en los docs
(spec anterior queda como historia; RUBRICA, BACKEND, ESTRUCTURA, QA-MANUAL,
PENDIENTES y CLAUDE.md al día).

## Resuelto en la revisión del diseño (decisiones de la IA)

- **Links viejos a los vinos** (`/carta?local=parrilla#parrilla-vinos-malbec`, por
  ejemplo de un QR o de Instagram): se redirigen a la vista Vinos, a esa sección.
- **La vista Vinos no tiene local**: portada con la foto del local por defecto y
  bajada "Carta de vinos", sin cubierto; si la carta no carga, mensaje sin botón de
  WhatsApp (no hay un número "de los vinos" y un dato que falta se omite).
- **Cambiar la bodega de un vino**: toma la región de la bodega nueva, salvo que en
  el mismo cambio se edite la región.
- **Cambiar a una categoría con tamaños** (pizzas): la caja muestra los campos de
  precio de la categoría elegida en la lista.
- **Copas y descorche** aparece en la lista de Vinos, sin campos de bodega.
- Las funciones `mover_*` **quedan**: el panel de producción las usa entre el
  `db push` y el merge.

## Fuera de alcance

Fotos, agotado, filtros en la carta pública, crear o renombrar categorías o tipos
de vino, deshacer.

## Lo que queda para el builder

Componentes y nombres; cómo se dibuja el arrastre (sin librerías nuevas: eventos
de puntero); la marca exacta de "compartida"; el parámetro de URL de Vinos; si
quedan o no las funciones `mover_*`. Despliegue: hay migración nueva, así que el
orden es el de `docs/BACKEND.md` (primero `db push`, después merge), con el OK del
usuario.
