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
- [ ] Un hero grande con el logo dentro de un marco fino, una bajada y dos
      botones: "Reservar mesa" y "Ver la carta".
- [ ] Un bloque de bienvenida con texto y tres fotos.
- [ ] Una franja oliva "Lo que nos mueve" con tres valores: Tradición, Producto
      noble y Dedicación.
- [ ] Una sección "Nuestros dos salones" con **dos tarjetas**, una por local
      (Parrilla y Restaurante), cada una con foto, nombre, bajada, descripción,
      dirección, un horario resumido y dos botones: "Reservar acá" y "Ver la
      carta".
- [ ] Una sección "Algunos de nuestros platos" con 8 fotos (4 de cada salón,
      cada una con la etiqueta de su local) y un botón "Ver las cartas".
- [ ] **Ningún plato con foto muestra precio.** Es intencional: lo pidió el
      usuario, los precios están solo en la carta.
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

> Reescrita dos veces en la sesión 02: primero la carta pasó al PDF hoja por hoja;
> después, a pedido del usuario (el PDF no se leía cómodo), volvió a HTML con los
> datos reales transcriptos de los PDF. Sesión 06: la carta se pide a la API
> (`/api/v1/carta`) y se dibuja con la estética de la carta impresa de cada local.

**Qué tiene que verse:**
- [ ] Un hero con el nombre del salón activo.
- [ ] Un selector de dos botones ("La Posta Parrilla" / "La Posta II Restaurante"); en el
      celular, dos botones parejos que no se cortan.
- [ ] Un índice de secciones que lleva a cada una sin que la navbar tape el título.
- [ ] La carta dentro de una hoja color papel con el marco del local: doble y recto en
      la Parrilla (con rombos bajo el logo), redondeado en La Posta II. El logo
      real, con "Parrilla Patagónica" o "Restaurante" debajo.
- [ ] Cada plato con nombre, precio, y abajo la traducción en inglés/portugués en
      letra chica (y la descripción en castellano cuando la carta la tiene).
- [ ] En las pizzas de La Posta II, dos columnas de precio: Chica y Grande.
- [ ] En **las dos cartas**, "Vinos" con subsecciones por cepa y, dentro, por bodega
      con su región, y al final "Copas y descorche". Es la misma carta de vinos en
      los dos locales (secciones compartidas en la base).
- [ ] Al pie de la hoja, el cubierto; debajo, la aclaración de temporada. **No** hay
      link para descargar el PDF (lo baja solo el admin).
- [ ] Un link con ancla (`/carta?local=restaurante#restaurante-pizzas-clasicas`)
      abre directo en esa sección, aunque la carta tarde en llegar.
- [ ] Si la API no responde, aparece "No pudimos cargar la carta" y el botón de
      WhatsApp del local, no una página vacía.
- [ ] Comparar algunos precios contra el PDF (la transcripción se verificó por
      script: los 188 precios de la parrilla y los 100 de La Posta II coinciden).

**El toggle de carta (comportamiento clave a probar):**
- [ ] Al entrar a `/carta` sin nada en la URL, se abre la carta de **La Posta
      Parrilla** por defecto.
- [ ] Al tocar "La Posta II Restaurante", la carta cambia, la URL pasa a
      `/carta?local=restaurante` sin recargar la página, y **la página vuelve arriba
      de todo** (probarlo después de bajar hasta los vinos).
- [ ] Escribir directamente `/carta?local=restaurante` abre directo en la carta
      de La Posta II, con ese botón ya marcado.
- [ ] Escribir un valor sin sentido, por ejemplo `/carta?local=asado123`: la
      página **no se rompe** y cae a la carta de la Parrilla.

---

## Carta en el panel (`/admin/carta`)

> Sesión 06. Con el admin. Los cambios se ven al instante en el panel y en hasta un
> minuto en `/carta` (caché de la API).

- [ ] En `/admin`, "Editar la carta" lleva a `/admin/carta`.
- [ ] Arriba: Parrilla, Restaurante y Vinos. En un local, el cubierto y sus secciones;
      en Vinos, las cepas y "Copas y descorche", por bodega.
- [ ] Cambiar un precio (vale escribir `6.000` o `$ 6.000`) y guardar: "Guardar" se
      deshabilita y el precio nuevo aparece en `/carta`.
- [ ] Una pizza con un solo precio: mensaje "Cargá un precio por tamaño." y el foco
      en el primer precio.
- [ ] "Agregar" al final de una sección, guardar, y verlo último en la carta. Subirlo,
      bajarlo (el primero no sube, el último no baja) y borrarlo (pide confirmación).
- [ ] En Vinos: agregar un vino a una bodega que ya está → aparece dentro de esa
      bodega. Subir una bodega entera. Cambiar la región de una bodega.
- [ ] Con una cuenta que no es admin, `/admin/carta` dice que no tiene permisos.

**Imprimir / Guardar PDF**
- [ ] El botón de cada local abre `/admin/carta/imprimir` y la ventana de imprimir.
- [ ] Hoja oficio (8,5 × 13 in), dos columnas, el marco del local en **todas** las
      hojas, ningún plato partido entre columnas, "Vinos" a lo ancho y el cubierto al
      final.

---

## Cuentas y reservas (con Supabase)

> Reescrita en la sesión 02: el formulario dejó de ser maqueta. Para probar en
> local: `npx supabase start`, `npm run db:reset`, `npm run dev`. Usuarios de
> prueba en `docs/BACKEND.md`.

**Sin sesión**
- [ ] `/reservas` muestra "Ingresá para continuar" y un botón a `/ingresar`.
- [ ] El navbar muestra "Ingresar".

**Ingresar (solo Google)**
- [ ] `/ingresar` muestra un único botón "Continuar con Google", con el logo de Google.
- [ ] Lleva a la pantalla de Google y vuelve al sitio, a la página de la que venía.
- [ ] La primera vez crea la cuenta: el nombre de Google aparece precargado al reservar.
- [ ] No hay formulario de email ni "crear cuenta" en ningún lado.

**Reservar**
- [ ] Nombre y teléfono vienen precargados del perfil.
- [ ] Solo deja elegir fechas desde hoy; si es hoy, solo horarios que no pasaron.
- [ ] "Reservar en:" con las fotos de los salones; la elegida tiene marco bordo y se ve el foco con Tab.
- [ ] El nombre acepta una sola letra; rechaza números y símbolos. Comentarios: hasta 100 caracteres.
- [ ] Personas: con más de 6, el botón pasa a "Reservar por WhatsApp" y abre el chat del local
      con el mensaje armado (salón, fecha, hora, nombre, personas; lo vacío no aparece).
- [ ] Un día bloqueado muestra el aviso y deshabilita el botón.
- [ ] Una segunda reserva el mismo día en el mismo local: "Ya tenés una reserva activa…".
- [ ] Al reservar: "Pedido de reserva enviado", estado pendiente.
- [ ] Sin sesión: se ven los dos salones y "Ingresar con Google" vuelve a `/reservas`.

**Mis reservas**
- [ ] Muestra próximas (de la más cercana a la más lejana) y anteriores.
- [ ] "Cancelar reserva" pide confirmación y la cancela.
- [ ] Con menos de 1 h, en vez de cancelar aparece el link a WhatsApp.

**Logos**
- [ ] Instagram con su logo en el footer, en `/nosotros` y al final de `/reservas`.
- [ ] WhatsApp con su logo en "Escribir por WhatsApp" (Inicio), "Consultar por WhatsApp"
      y en los avisos de `/reservas` y `/mis-reservas`.

**Panel de admin** (con una cuenta con rol admin)
- [ ] Un cliente que entra a `/admin` ve "Sección para el equipo de La Posta".
- [ ] El contador de pendientes filtra al tocarlo.
- [ ] El navbar del admin muestra "Panel" (no "Reservar" ni "Mis reservas"); `/reservas` y
      `/mis-reservas` lo llevan al panel, y "Reservar acá" de un salón abre "Nueva reserva" con ese salón.
- [ ] "Nueva reserva": queda confirmada, marcada "Cargada en el local"; se pueden cargar varias el
      mismo día; hasta 40 personas; con mail, aparece en la fila y le llega la confirmación.
- [ ] Confirmar, rechazar, cancelar y mover funcionan y el cliente lo ve en "Mis reservas".
- [ ] Con el panel abierto, una reserva nueva aparece sola, con el aviso arriba.
- [ ] La nota interna se guarda y el cliente **no** la ve.
- [ ] Bloquear y desbloquear días.
- [ ] "Imprimir lista del…" abre la lista del día; al imprimir no salen navbar ni footer.
- [ ] Entre 768 y 1100 px el navbar usa el menú hamburguesa y no se corta nada.

---

## Seña con Mercado Pago (`/reservas`, `/reservas/pago`, `/mis-reservas`, `/admin`)

> Agregada en la sesión 05 (2026-10-18). **Reemplaza** estas líneas de "Cuentas y
> reservas", que quedaron de antes de la seña: "Al reservar: ... estado pendiente"
> (ahora la reserva queda *Esperando pago* hasta pagar) y "Confirmar, rechazar,
> cancelar y mover" del panel (el admin ya no confirma ni rechaza: una reserva
> pagada queda confirmada; solo cancela, con motivo, o mueve).
>
> Se prueba **en la preview de la rama** (Mercado Pago no llega a `localhost`),
> con una ventana de **incógnito** y la **cuenta compradora de prueba** de
> Mercado Pago (ids y credenciales en `docs/BACKEND.md`). Es plata ficticia, pero
> **la preview usa la base de producción**: las reservas que se creen quedan como
> filas reales; cancelarlas o anotarlas en la bitácora al terminar. Con la
> protección de Vercel prendida el webhook no llega: ver `docs/BACKEND.md`.
>
> Tarjeta de prueba: la del país (skill `mp-test-cards`), con el **titular**
> `APRO` (aprueba) u `OTHE` (rechaza).

**Antes del pago**
- [ ] En `/reservas`, el botón dice "Reservar y pagar seña ($10.000)" (monto leído de la base).
- [ ] Bajo el botón se ve el cartel oficial de Mercado Pago (Brand Brick) con su logo y los medios de pago; no ofrece efectivo.
- [ ] Al enviar, la reserva se crea y se abre Mercado Pago ("Abriendo Mercado Pago…").
- [ ] En el checkout, el monto es $10.000 y el concepto es "Seña reserva <salón> · <fecha> <hora>". No aparecen medios en efectivo (Rapipago, Pago Fácil).

**Pago aprobado (titular `APRO`)**
- [ ] Al volver, `/reservas/pago` dice "Estamos confirmando tu pago…" y en menos de unos minutos pasa a confirmada, sin recargar.
- [ ] En "Mis reservas" figura *Confirmada*; en el panel de admin, la reserva con la seña pagada.
- [ ] Llega el mail de confirmación (solo si `BREVO_API_KEY` está cargada; si no, queda en el log de la función).
- [ ] No llegó ningún mail cuando la reserva estaba *Esperando pago*.

**Pago rechazado (titular `OTHE`) y reintento**
- [ ] Mercado Pago rechaza el pago; al volver, `/reservas/pago` muestra "No se pudo hacer el pago" con "Reintentar pago".
- [ ] La reserva sigue *Esperando pago* (no se pierde el lugar mientras no pasen 15 minutos).
- [ ] Reintentar con `APRO` aprueba y la reserva queda confirmada.

**Vencimiento (15 minutos)**
- [ ] Crear una reserva y no pagar: pasados los 15 minutos queda *Vencida* (la corre `pg_cron` cada minuto) y "Mis reservas" ya no ofrece "Pagar seña".
- [ ] Mientras esperaba, "Mis reservas" mostraba "Pagar seña" y el tiempo que faltaba.
- [ ] El vencimiento no manda mail.

**Cancelación del cliente (con reintegro)**
- [ ] Con 1 hora o más de anticipación, "Cancelar reserva" pide confirmación y cancela. Aviso esperado con el reintegro hecho: "Listo, cancelamos tu reserva y te devolvimos la seña."
- [ ] **Esperado hoy en modo de prueba:** el aviso es "…La devolución de la seña está en proceso.", la reserva queda cancelada y el pago en *reintegro pendiente* (Mercado Pago rechaza el reembolso con 401; ver `docs/proceso/hallazgos.md` 1.18). Con credenciales de prueba propias, el pago pasaría a *reintegrado*.
- [ ] Con menos de 1 hora, en vez de cancelar aparece el link a WhatsApp.

**Cancelación del admin (con motivo)**
- [ ] "Cancelar" en el panel pide el motivo, prearmado "No hay lugar", editable, y avisa que se devuelve la seña.
- [ ] Sin motivo no deja cancelar.
- [ ] El cliente ve la reserva cancelada con el motivo; el mail de cancelación lo incluye.
- [ ] Si el reembolso falla, la reserva queda cancelada y el pago aparece en "Reintegros pendientes" con "Reintentar".

**Bloqueo por turno**
- [ ] En el panel, bloquear un día con turno "Noche" (o "Mediodía"); la lista muestra el turno.
- [ ] En `/reservas`, ese día y ese turno rechazan reservas nuevas ("Ese turno ya está completo."); el otro turno sigue disponible.
- [ ] Las reservas ya hechas de ese turno no se tocan. Antes de las 17:00 es mediodía; desde las 17:00, noche.

**Webhook**
- [ ] Un `POST` a `/api/webhooks/mercadopago` sin firma responde **401** (por ejemplo, `curl -i -X POST "<URL de la preview>/api/webhooks/mercadopago?type=payment&data.id=1"`).
- [ ] Con la firma de Mercado Pago, un mismo aviso repetido no cambia nada (es idempotente).

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
- [ ] En cada elemento enfocado aparece un **anillo de foco naranja con un
      halo oscuro alrededor**, bien visible. Probalo sobre todo en fondos
      **claros** — los campos del formulario de `/reservas`, los links del
      índice de categorías en `/carta`, cualquier link sobre `--crema` — que es
      donde antes casi no se veía. Confirmá también que se sigue viendo igual
      de bien sobre fondo bordo (vino), como los botones de la navbar y los de
      la sección "Nuestros dos salones".
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
- [ ] En 360px, con el dedo (o el mouse): abrí el menú tocando el botón de
      hamburguesa y confirmá que el botón (ahora con forma de X) queda
      **visible por encima del panel** y se puede tocar para cerrarlo. Cerralo
      así, tocando la X, sin usar `Escape`.
- [ ] En 360px, con el menú abierto, tocá el link de la página en la que ya
      estás (por ejemplo, si estás en `/`, tocá "Inicio"): el menú tiene que
      **cerrarse igual**, aunque la ruta no cambie.
- [ ] En `/carta`, el selector de salón ("La Parrilla" / "La Posta II") se
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
