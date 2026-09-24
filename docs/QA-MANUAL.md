# Checklist de QA manual

Esta es la revisión que hay que hacer **con el sitio abierto en un navegador de
verdad**. No es algo que se pueda automatizar desde acá: hay que mirar la
pantalla y tocar los botones. Marcá cada casillero a medida que lo confirmás.
Si algo falla, no lo arregles a ojo: anotá qué página, qué ancho de pantalla y
qué pasó, y reportalo (más abajo hay una sección sobre qué hacer en ese caso).

## Antes de empezar: los tres anchos de pantalla

Todo lo de abajo hay que probarlo en **tres anchos**, porque el sitio cambia de
layout en esos puntos:

- **360px** — un celular chico.
- **768px** — una tablet.
- **1440px** — una notebook o monitor.

Cómo simular un ancho fijo, con Chrome o Edge:

1. Abrí el sitio.
2. Apretá `F12` (o clic derecho → "Inspeccionar") para abrir DevTools.
3. Apretá `Ctrl+Shift+M` (o el ícono de celular/tablet en la esquina superior
   izquierda de DevTools) para activar el "Device Toolbar".
4. Arriba aparece un cuadro de ancho; escribí `360`, después `768`, después
   `1440` y repetí la revisión de cada página en cada uno.
5. Para probar el teclado no hace falta el Device Toolbar: hacelo en cualquier
   ancho, con la ventana normal.

---

## Comprobación de scroll horizontal (hacerla en cada página, en 360px y 768px)

Con DevTools abierto, andá a la pestaña **Console**, pegá esto y apretá Enter:

```js
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

- [ ] Da `true` en `/` a 360px
- [ ] Da `true` en `/` a 768px
- [ ] Da `true` en `/carta` a 360px
- [ ] Da `true` en `/carta` a 768px
- [ ] Da `true` en `/reservas` a 360px
- [ ] Da `true` en `/reservas` a 768px
- [ ] Da `true` en `/nosotros` a 360px
- [ ] Da `true` en `/nosotros` a 768px

Si da `false`, hay algo desbordando el ancho de la pantalla (scroll horizontal
que no debería existir). Para encontrar el culpable, en la misma consola:

```js
[...document.querySelectorAll('*')].filter(
  (el) => el.scrollWidth > document.documentElement.clientWidth
)
```

Eso devuelve la lista de elementos más anchos que la pantalla. Anotá el primero
de la lista y en qué página apareció.

---

## Página de Inicio (`/`)

**Qué tiene que verse:**
- [ ] Un hero grande con el logo, el nombre de la marca, una bajada y dos
      botones: "Reservar mesa" y "Ver la carta".
- [ ] Un bloque de bienvenida con texto y tres fotos.
- [ ] Una sección "Nuestros dos salones" con **dos tarjetas**, una por local
      (Parrilla y Restaurante), cada una con foto, nombre, bajada, descripción,
      dirección, un horario resumido y dos botones: "Reservar acá" y "Ver la
      carta".
- [ ] Una sección de platos destacados con 4 platos (2 de cada salón) y un
      botón "Ver las dos cartas".
- [ ] Una sección "Visitanos" con la info completa de los dos salones:
      horarios, dirección, mapa embebido, y contacto.

**Qué tiene que pasar al hacer clic (esto es el comportamiento de "dos
locales bajo una marca" — es lo más importante de probar):**
- [ ] En la tarjeta de **la Parrilla**, el botón "Reservar acá" lleva a
      `/reservas?local=parrilla` y ese salón queda preseleccionado en el
      formulario (la tarjeta de "¿En qué salón?" resaltada es la de la
      Parrilla).
- [ ] En la tarjeta de **la Parrilla**, el botón "Ver la carta" lleva a
      `/carta?local=parrilla` y esa carta se abre directamente, sin que haga
      falta tocar nada más.
- [ ] Repetí los dos puntos anteriores con la tarjeta **del Restaurante**:
      tiene que llevar a `?local=restaurante` en ambos casos, con ese salón
      preseleccionado.
- [ ] El botón "Reservar mesa" del hero va a `/reservas` (sin salón
      preseleccionado en la URL: se elige el primero por defecto).
- [ ] El botón "Ver la carta" del hero va a `/carta`.
- [ ] El mapa de cada salón, en "Visitanos", carga y muestra un mapa real (no
      un rectángulo vacío ni un error).

---

## Página de Carta (`/carta`)

**Qué tiene que verse:**
- [ ] Un hero con el nombre del salón activo.
- [ ] Un selector de dos botones ("La Parrilla" / "El Restaurante") que marca
      cuál está activo.
- [ ] Un índice de categorías (ancla a cada bloque de más abajo).
- [ ] Los platos del salón activo, agrupados por categoría, cada uno con
      nombre, descripción y precio.
- [ ] Un bloque final invitando a abrir la carta oficial en Canva.

**El toggle de carta (comportamiento clave a probar):**
- [ ] Al entrar a `/carta` sin nada en la URL, se abre la carta de **la
      Parrilla** por defecto.
- [ ] Al tocar el botón "El Restaurante" del selector, **el contenido cambia**
      (otros platos, otras categorías) **y la URL cambia** a
      `/carta?local=restaurante`, sin recargar la página.
- [ ] Al volver a tocar "La Parrilla", la URL vuelve a
      `/carta?local=parrilla` (o a `/carta`, según cómo lo arme el toggle) y
      el contenido vuelve a ser el de la parrilla.
- [ ] Escribir directamente en la barra de direcciones `/carta?local=restaurante`
      y apretar Enter: la página tiene que abrir **directo** en la carta del
      restaurante, con ese botón ya marcado como activo, sin que haya que
      tocar el selector.
- [ ] Escribir un valor sin sentido, por ejemplo `/carta?local=asado123`: la
      página **no se rompe** y cae de vuelta a la carta de la Parrilla (el
      salón por defecto), en vez de mostrar un error o una carta vacía.
- [ ] Los links del índice de categorías, al tocarlos, bajan hasta esa sección
      sin que la navbar fija tape el título.

**Sobre el Canva de cada salón — esto es intencional, no es un bug:**
- [ ] Con la carta de **la Parrilla** activa, al final de la página aparece un
      botón para abrir la carta oficial en Canva.
- [ ] Con la carta **del Restaurante** activa, en cambio, **no hay botón**:
      en su lugar aparece un texto que dice que todavía se está cargando la
      carta digital de ese salón. Esto es correcto — el link de Canva del
      restaurante todavía no lo pasó la familia (está anotado en
      `docs/PENDIENTES.md`) — **no lo reportes como un botón roto o
      faltante**, es un dato pendiente, no un error de código.

---

## Página de Reservas (`/reservas`)

**Qué tiene que verse:**
- [ ] Un formulario con: selector de salón (dos tarjetas clickeables), nombre,
      teléfono, email, fecha, hora, cantidad de personas y comentarios.
      Un panel al costado (o debajo, en mobile) con las condiciones para
      reservar y el contacto del salón elegido.
- [ ] Un aviso visible de que "esta sección todavía no está conectada" y que
      por ahora hay que confirmar por WhatsApp o teléfono. Esto es correcto:
      el formulario es una maqueta, no guarda nada todavía.

**Comportamiento a probar:**
- [ ] Al entrar a `/reservas` sin nada en la URL, el salón preseleccionado es
      **la Parrilla**.
- [ ] Al entrar con `/reservas?local=restaurante` en la URL (por ejemplo,
      llegando desde la tarjeta del Restaurante en Inicio), el salón
      preseleccionado es **el Restaurante**.
- [ ] En el campo "Hora", elegí un horario cualquiera (por ejemplo `13:00`).
- [ ] Con esa hora elegida, cambiá de salón en el selector de arriba (tocá la
      tarjeta del otro salón).
- [ ] Confirmá que el campo "Hora" **se vacía** (vuelve a "Elegí un horario")
      en vez de dejar puesta la hora anterior. Esto es a propósito: las
      franjas horarias son distintas para cada salón, así que una hora
      elegida para un salón puede no existir en el otro.
- [ ] Las horas que aparecen en el desplegable cambian según el salón elegido
      (la Parrilla y el Restaurante tienen franjas distintas).
- [ ] Al apretar "Confirmar reserva" con el formulario completo, la página
      **no recarga** y no aparece ningún error en la consola (el envío está
      cortado a propósito, es una maqueta).

**Sobre el WhatsApp del Restaurante — esto también es intencional:**
- [ ] En el panel de contacto, con **la Parrilla** elegida, aparece un botón
      "Reservar por WhatsApp".
- [ ] Con **el Restaurante** elegido, en cambio, **no hay botón de
      WhatsApp**: aparece un texto invitando a escribir por Instagram. Esto es
      correcto — el restaurante todavía no tiene WhatsApp cargado — **no lo
      reportes como un botón faltante**.

---

## Página Nosotros (`/nosotros`)

**Qué tiene que verse:**
- [ ] Un hero con el título "Nosotros".
- [ ] Un bloque de historia de la familia (texto común a los dos salones).
- [ ] "Los salones por dentro": un bloque por cada salón, alternando texto e
      imágenes (uno a la izquierda, el otro a la derecha), cada uno con una
      **galería de 3 fotos**: dos horizontales apiladas a un lado y una
      vertical más grande al otro. Las tres fotos tienen que verse completas y
      sin deformarse.
- [ ] Una sección de contacto con la info de los dos salones (igual formato
      que en Inicio) y, al final, un Instagram y un email comunes a los dos.

**Comportamiento a probar:**
- [ ] Los datos de contacto (dirección, teléfono, mapa) de cada salón
      coinciden con los que se ven en Inicio.
- [ ] En el salón que no tiene teléfono cargado (el Restaurante), vuelve a
      aparecer el texto "Teléfono a confirmar" en vez de un link roto — otra
      vez, es correcto, no un bug.

---

## Recorrido con teclado (hacerlo una vez por página, sin tocar el mouse)

Usá solo `Tab`, `Shift+Tab`, `Enter` y las flechas. Empezá desde la barra de
direcciones y apretá `Tab`.

- [ ] Todo lo clickeable (links, botones, campos del formulario) se alcanza
      con `Tab`, en un orden que sigue el orden visual de la página (de
      arriba hacia abajo, de izquierda a derecha).
- [ ] En cada elemento enfocado aparece un **anillo de foco naranja**, bien
      visible. Probá especialmente los botones sobre fondo bordo (vino), como
      los de la navbar y los de la sección "Nuestros dos salones": el anillo
      tiene que verse igual de bien ahí que sobre fondo claro.
- [ ] Angosta la ventana (o usá el Device Toolbar en 360px) hasta que aparezca
      el botón de hamburguesa de la navbar. Con `Tab`, llegá hasta ese botón y
      apretá `Enter`: el panel de menú se abre.
- [ ] **Esto es lo esperado, no una falla:** al abrirse el panel, el foco se
      queda en el botón de hamburguesa; si seguís con `Tab` no entra solo a
      los links de adentro (Inicio, Carta, Nosotros, Reservar), sigue de largo
      hacia el resto de la página. Mover el foco hacia adentro del panel al
      abrirse quedó pendiente a propósito (está anotado en
      `docs/PENDIENTES.md`) — para llegar a esos links ahora hay que tocarlos
      directo, o ir hacia atrás con `Shift+Tab` desde el botón.
- [ ] Con el panel abierto, apretá `Escape`: el panel se cierra.
- [ ] Inmediatamente después de cerrarse con `Escape`, apretá `Tab` una vez
      (o fijate dónde está el anillo de foco): tiene que estar **de vuelta en
      el botón de hamburguesa**, no perdido en otro lado de la página.
- [ ] En `/carta`, el selector de salón ("La Parrilla" / "El Restaurante") se
      puede operar llegando con `Tab` y activando con `Enter` (o con las
      flechas, si el foco está dentro del selector).
- [ ] En `/reservas`, con el foco dentro del grupo "¿En qué salón?", las
      flechas del teclado (arriba/abajo o izquierda/derecha) cambian cuál
      tarjeta está seleccionada.

---

## Qué hacer si algo falla

No lo arregles adivinando. Anotá:

1. Qué página y qué ancho de pantalla (360 / 768 / 1440).
2. Qué esperabas ver y qué viste en realidad.
3. Si es algo visual (texto cortado, imagen deformada, scroll horizontal,
   colores), el archivo a mirar es el `.module.css` del componente o de la
   página en cuestión — por ejemplo, algo raro en las tarjetas de Inicio está
   en `app/page.module.css` o en `src/components/LocalCard/LocalCard.module.css`.
4. Si es de comportamiento (un botón que no aparece, un dato que no cambia),
   el archivo a mirar es `src/data/locales.js` (ahí están los datos de cada
   salón, incluyendo lo que todavía no está cargado) o el `.jsx` de la página
   o el componente correspondiente.
5. Reportá lo que encontraste (con esos datos) en vez de tocar el código vos
   mismo — así queda un registro de qué se probó y qué se encontró, en
   `docs/BITACORA.md` o donde se esté llevando el seguimiento del proyecto.
