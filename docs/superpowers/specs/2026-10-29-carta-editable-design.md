# Carta editable: API, panel del admin y PDF

Fecha: 2026-10-29 (sesión 06). Diseño acordado en el chat, por partes, con el
usuario aprobando cada una; la estética de la carta se eligió sobre maquetas en el
navegador (`.superpowers/brainstorm/`, `carta-estilo-v3.html`). Cubre el entregable
**E4** de la rúbrica (catálogo navegable + API básica, hoy en Regular) y completa
**E5** (CRUD más allá de las reservas: la carta, editable desde el admin).

Criterio Excelente de E4, textual de la grilla (lo pasó el usuario el 2026-10-29):
**"Catálogo + API interna, lógica funcional y checklist en PRs."** No pide
búsqueda, filtros ni agotado: la lista que decía eso en `docs/RUBRICA.md` la había
escrito la IA, no la cátedra. Acá la "lógica funcional" es el CRUD validado con
permisos, el armado de la carta (secciones propias + compartidas, vinos por
bodega, orden) y la vista de impresión; el checklist ya está en la plantilla de PR.

## Por qué

Hoy la carta es un archivo (`src/data/cartas.json` y `src/data/vinos.json`) pegado
al código: cambiar un precio es un commit. La rúbrica marca que no hay API interna
y que el CRUD es solo de reservas. Para la familia, además, la carta impresa es un
PDF hecho a mano que hay que rehacer cada vez que cambian los precios.

Lo que queda resuelto: la carta vive en la base, la web la pide a una API propia,
el admin la edita desde el panel, y el PDF para imprimir sale de los mismos datos,
siempre al día.

## Decisiones

Del usuario:

- **La carta deja de ser un archivo plano**: pasa a la base.
- **El admin puede agregar y sacar ítems en las distintas secciones y cambiar
  precios.**
- **Solo el admin descarga el PDF**, con el formato y la estética que ya tienen las
  cartas impresas: marcos, filetes, fuentes, colores.
- **El PDF se genera con la ventana de imprimir del navegador** ("Guardar como
  PDF"), no con un archivo que baja directo.
- **La página pública `/carta` toma la estética del PDF** (marcos, filetes, fuentes)
  **pero conserva la forma de la página actual**: una sola columna, una sección
  abajo de la otra, con el índice de secciones arriba y el selector de local.
- **Con nuestro logo**, no "LA POSTA" escrito con una fuente.
- **Cada local mantiene su propio diseño**, como sus PDF (ver "Estética").
- **Nada de agotado, búsqueda ni filtros.** Los atajos del índice alcanzan.

De la IA (presentadas en el chat; el usuario no las objetó, quedan a revisar):

- La carta de **vinos es una sola, compartida** por los dos locales (como hoy en
  `vinos.json`): se edita una vez y se ve en las dos cartas.
- Además del precio, el admin edita **nombre, descripción, traducción**, los
  **precios por tamaño** (pizzas) y el **cubierto** de cada local.
- Los ítems se pueden **subir y bajar** dentro de su sección.
- Las **secciones son fijas**: no se crean, renombran ni reordenan desde el panel.
- Cada cambio **se guarda en el momento**; la carta pública lo muestra la próxima
  vez que se abre.
- El PDF mantiene el **formato del impreso** (hoja oficio, dos columnas) e
  **incluye la carta de vinos** al final.
- **Se saca el link público a los PDF viejos** (`local.cartaPdf`): mostraría
  precios desactualizados.

## Parte 1 — Base (una migración nueva)

La carta pasa a tablas, con la misma forma que describe hoy `src/data/carta.js`.

```
carta_secciones                         carta_items
  id          uuid  pk                    id         uuid pk
  slug        text  (el id de hoy)        seccion_id uuid → carta_secciones
  local_id    text  null → compartida
  titulo      text                        nombre     text not null
  grupo       text  null ('Vinos')        descripcion text null
  nota        text  null                  traduccion text null
  tamanos     text[] null                 detalle    text null (vinos)
  orden       int                         bodega     text null (vinos)
                                          region     text null (vinos)
                                          precio     int  null
                                          precios    int[] null (con tamanos)
                                          orden      int
```

- `local_id` apunta a `locales`; **null significa compartida** (las secciones de
  vinos y "Copas y descorche"). La carta de un local = sus secciones + las
  compartidas, en ese orden (hoy `getCarta()` hace lo mismo).
- **El slug no es único solo** (`entradas`, `postres`, `cervezas`, etc. existen en
  los dos locales): clave sustituta + único en `(coalesce(local_id, ''), slug)`. La
  API sigue devolviendo el slug como `id` de la sección, así las anclas públicas
  (`#parrilla-entradas`) **no cambian** *(decisión de la IA, revisión del diseño)*.
- Los **vinos se agrupan por bodega al mostrarlos**: cada vino es un ítem con
  `bodega` y `region`. El orden de las bodegas **no es alfabético** hoy (Malbec,
  Blends, Otras cepas), así que se respeta: una bodega va donde está su vino de
  menor `orden`, y sus vinos van juntos. Reglas *(decisión de la IA, revisión del
  diseño)*:
  - En el panel, Vinos se muestra por bodega. Un vino sube y baja **solo dentro de
    su bodega**; la **bodega entera** sube y baja dentro de su sección (renumera el
    `orden` de sus vinos).
  - La **región se edita en la bodega** y se aplica a todos sus vinos de esa
    sección. Una bodega nueva se crea al agregar un vino con ese nombre de bodega;
    va al final de la sección.
- **Cubierto:** columna nueva `locales.cubierto int`.
- Precios en pesos enteros, `> 0`. `precio` y `precios` son excluyentes;
  `precios` solo en secciones con `tamanos`, con un valor por tamaño. Todo ítem
  tiene precio (hoy no hay ninguno sin precio).
- **Carga inicial:** la migración inserta exactamente lo que hay hoy en
  `cartas.json` y `vinos.json` (generar el SQL desde los JSON, no a mano).
  Después de migrar, los JSON se borran: la base es la única fuente.
- **RLS:** lectura para todos (`anon` y `authenticated`); escritura solo con
  `public.es_admin()`, igual que el resto del panel.
- Tests pgTAP: un anónimo lee y no escribe; un cliente no escribe; el admin
  escribe; `precio`/`precios` excluyentes; precio negativo rechazado; la carga
  inicial tiene la cantidad de secciones e ítems de los JSON.

## Parte 2 — API (Route Handlers, como la seña)

Mismo patrón que `app/api/v1/pagos`: `manejar`, `json`, `ErrorHttp`, validación
con Zod en `src/servidor/esquemas.js`, lógica en `src/servidor/` testeable sin red.

| Método | Ruta | Quién | Qué |
|---|---|---|---|
| GET | `/api/v1/carta?local=<id>` | público | La carta armada de un local: cubierto + secciones (propias y compartidas) con sus ítems, vinos agrupados por bodega. 400 si falta `local`, 404 si no existe |
| POST | `/api/v1/carta/items` | admin | Crea un ítem al final de su sección. 201 con el ítem |
| PATCH | `/api/v1/carta/items/:id` | admin | Edita campos de un ítem, incluido moverlo arriba/abajo |
| DELETE | `/api/v1/carta/items/:id` | admin | Borra un ítem. 204 |
| PATCH | `/api/v1/carta/secciones/:id/bodegas` | admin | Sobre una bodega de una sección de vinos (`{ bodega, region?, mover? }`): cambia la región de todos sus vinos o la sube/baja entera |
| PATCH | `/api/v1/carta/locales/:id` | admin | Cambia el cubierto |

- Las escrituras usan **la sesión del que llama** (`usuarioDelPedido`), así la RLS
  decide; un no-admin recibe 403 con mensaje en castellano.
- El GET es cacheable un rato corto en Vercel; un cambio del admin tiene que verse
  en, como mucho, alrededor de un minuto. El mecanismo es del builder.
- La forma de la respuesta del GET es la misma que devuelve hoy `getCarta()`, para
  que `SeccionCarta` cambie lo mínimo.

## Parte 3 — La carta pública (`/carta`)

- Pide la carta a `GET /api/v1/carta?local=…`. Mientras carga muestra un estado de
  carga sobrio; si falla, un mensaje y el WhatsApp del local (no una página rota).
- **Forma:** la de hoy. Selector de local, índice de secciones arriba (atajos a cada
  sección), una sola columna, una sección abajo de la otra.
- **Estética:** la de la maqueta aprobada (`carta-estilo-v3.html`), ver "Estética".
- Se saca el link "Descargar carta en PDF" (`local.cartaPdf` en `locales.js` y su
  uso en `app/carta/page.jsx`) y los PDF de `public/cartas/`.

## Parte 4 — El panel (`/admin/carta`)

- Página nueva, con `RequiereSesion admin`, enlazada desde `/admin` (como
  `/admin/dia`).
- Arriba se elige **Parrilla, Restaurante o Vinos** (vinos y "Copas y descorche" son
  las secciones compartidas).
- Se ven las secciones en el orden de la carta. Por ítem: editar precio(s),
  nombre, descripción, traducción (y bodega/región/detalle en vinos), subir, bajar,
  borrar con confirmación. Al final de cada sección, **"Agregar"**.
- El cubierto de cada local se edita en su vista.
- Validación como la del resto del panel (`src/validacion/`): mensaje por campo,
  `aria-invalid` + `aria-describedby`, errores de la API traducidos.
- Botón **"Imprimir / Guardar PDF"** por local: abre la vista de impresión.
- Toda llamada pasa por un servicio nuevo en `src/servicios/` (convención del
  proyecto); el servicio llama a la API con el token de la sesión.

## Parte 5 — La vista de impresión (`/admin/carta/imprimir?local=<id>`)

- Solo admin. Arma la carta con los mismos datos y abre `window.print()`.
- **Formato del impreso:** hoja oficio (612 × 936 pt, `@page`), **dos columnas**,
  nuestro logo, el marco de cada local en **todas** las hojas, las secciones sin
  cortarse entre columnas u hojas cuando entran, la carta de vinos al final y el
  cubierto como en el impreso.
- La pantalla (antes de imprimir) puede verse igual que la hoja.

## Estética (la de la maqueta aprobada)

Común a los dos locales: hoja color papel, tinta casi negra (`--carbon`), nombre del
plato en mayúsculas con la traducción debajo en chico, precio alineado a la derecha.
Logo: `public/logo/logo-bordo.svg` (sin bajada; el completo trae "Parrilla
Patagónica" y no sirve para el restaurante), con el nombre del local debajo.

| | La Parrilla | La Posta II Restaurante |
|---|---|---|
| Marco | doble, recto | doble, esquinas redondeadas |
| Debajo del logo | "PARRILLA PATAGÓNICA", espaciado, y filete con rombos en las puntas | "RESTAURANTE" entre dos filetes finos |
| Títulos de sección | condensados, gruesos, filete grueso debajo | altos y finos, filete fino debajo |

**Fuentes:** los PDF usan fuentes comerciales (RT Flinton, HeyGotcha y una marcada
como *demo*) que no tenemos con licencia web. Se usan parecidas de Google con
`next/font`: **Oswald** (títulos de la parrilla), **Pathway Gothic One** (títulos
del restaurante) y **Old Standard TT** (texto). Si la familia consigue las
originales con licencia, se reemplazan sin tocar nada más.

Colores siempre desde `src/styles/tokens.css` (sumar tokens si hace falta, por
ejemplo el color papel). El resto del sitio (navbar, footer, hero) no cambia.

## Fuera de alcance

Agotado, búsqueda, filtros, alergenos o etiquetas, crear/renombrar/reordenar
secciones, fotos por ítem, historial de precios, carta en otros idiomas además de
la traducción que ya existe.

## Lo que queda para el builder

Nombres de archivos y componentes; cómo se marca el orden al mover; el mecanismo de
caché del GET; cómo se resuelve el marco en cada hoja impresa; el estado de carga.
Al terminar: actualizar `docs/RUBRICA.md` (E4, E5), `docs/BACKEND.md` (tablas y
rutas), `docs/ESTRUCTURA.md`, `CLAUDE.md` (los precios ya no viven en los JSON) y
`scripts/procesar-assets.py` (deja de generar los PDF de `public/cartas/`).
