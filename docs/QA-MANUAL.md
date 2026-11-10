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
- [ ] La carta dentro de una hoja color papel, igual en las tres cartas: doble marco
      recto y rombos bajo el logo. El logo real, con "Parrilla Patagónica",
      "Carta de vinos" o "Restaurante" debajo. En Vinos, las cepas son secciones
      como las de la parrilla (sin un título "Vinos" arriba).
- [ ] Cada plato con nombre, precio, y abajo la traducción en inglés/portugués en
      letra chica (y la descripción en castellano cuando la carta la tiene).
- [ ] En las pizzas de La Posta II, dos columnas de precio: Chica y Grande.
- [ ] El selector tiene tres opciones: La Posta Parrilla · **Vinos** ("De los dos
      locales") · La Posta II Restaurante. Las cartas de los locales terminan en
      "Tragos"; Vinos tiene las cepas, cada una por bodega con su región, y al final
      "Copas y descorche".
- [ ] Un link viejo a los vinos de un local (`/carta?local=parrilla#parrilla-vinos-malbec`)
      termina en Vinos, en Malbec.
- [ ] Al pie de la hoja de cada local, el cubierto; debajo, la aclaración de
      temporada. **No** hay forma de descargar ni imprimir la carta.
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

> Editor v2 (sesión 06). Con el admin. Los cambios se ven al instante en el panel y
> en hasta un minuto en `/carta` (caché de la API).

- [ ] En `/admin`, las pestañas **Reservas · Carta**; "Carta" lleva al editor. En
      `/carta`, el admin ve "Editar esta carta".
- [ ] Arriba: Parrilla · Vinos · Restaurante. En un local, el cubierto, la caja y su
      carta; en Vinos, la caja pide "Tipo de vino", bodega y región.
- [ ] La caja vacía agrega: nombre, precio (`6.000` o `$ 6.000`), categoría; el
      producto aparece último en su categoría.
- [ ] Buscar "rucula" (sin tilde) encuentra "RÚCULA"; elegirlo carga la caja.
- [ ] Editar desde la fila: la caja sube con el producto, la fila queda resaltada;
      cambiar el precio y guardar.
- [ ] Pasar una pizza a Entradas: la caja pasa de dos precios a uno; queda última en
      Entradas.
- [ ] Arrastrar con el mouse por el ⠿: el producto toma el lugar de la fila donde se
      suelta; la línea bordo marca dónde cae.
- [ ] En el celular, arrastrar con el dedo por el ⠿: la página no se desplaza mientras.
- [ ] Con el teclado: Tab hasta el ⠿, flechas arriba/abajo; el foco sigue en el ⠿.
- [ ] En Vinos: arrastrar una bodega entera; cambiar la bodega de un vino (queda
      último en la nueva, con su región).
- [ ] Eliminar pide confirmación.
- [ ] Con una cuenta que no es admin, `/admin/carta` dice que no tiene permisos.

---

## Cuentas y reservas (con Supabase)

> Reescrita en la sesión 02: el formulario dejó de ser maqueta. Para probar en
> local: `npx supabase start`, `npm run db:reset`, `npm run dev`. Usuarios de
> prueba en `docs/BACKEND.md`.

**Sin sesión**
- [ ] `/reservas` muestra "Ingresá para continuar" y un botón a `/ingresar`.
- [ ] El navbar muestra "Ingresar".

**Ingresar (Google o mail)**
- [ ] `/ingresar` muestra dos pestañas, "Ingresar" y "Crear cuenta", y en las dos el botón "Continuar con Google", con el logo de Google.
- [ ] Las pestañas se cambian con las flechas del teclado.
- [ ] Crear cuenta con un mail que no sea de Google (Hotmail, Yahoo): llega "Confirmá tu cuenta en La Posta" con la plantilla de la marca; el botón confirma y deja la sesión iniciada.
- [ ] Ingresar con mail y contraseña; con la contraseña mal dice "El mail o la contraseña no son correctos."; con la cuenta sin confirmar pide revisar el mail.
- [ ] "Olvidé mi contraseña": llega "Elegí una contraseña nueva"; el link lleva a `/ingresar/contrasena`; después de guardar queda en "Mis reservas". El mismo link usado otra vez dice que venció.
- [ ] Crear cuenta con un mail que ya tiene cuenta muestra el mismo aviso que una nueva.
- [ ] Captcha (desde 2026-11-08): en los tres formularios con mail aparece el recuadro de
      Cloudflare arriba del botón. A veces pasa solo y a veces pide tocar la casilla; las
      dos cosas son normales. Tocar el botón antes de que termine avisa "Esperá a que
      termine la verificación". En una preview de Vercel el captcha no valida: ahí se
      prueba con Google.
- [ ] `/ingresar?volver=%2F%5Cexample.com` con la sesión iniciada lleva a Mis reservas, no
      a example.com.
- [ ] Al reservar, el teléfono queda guardado (no hay casilla) y la próxima reserva lo trae escrito.
- [ ] Lleva a la pantalla de Google y vuelve al sitio, a la página de la que venía.
- [ ] La primera vez crea la cuenta: el nombre de Google aparece precargado al reservar.

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
- [ ] Sin sesión: se ven los dos salones; "Continuar con Google" vuelve a `/reservas`, y "Ingresar o crear cuenta" lleva a `/ingresar` y, al entrar, vuelve a `/reservas` con el mismo salón.

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
- [ ] "Editar" en el panel: corregir nombre, teléfono, personas y comentarios (y mail en una del local) se guarda; 7 personas en una de la web o un mail inválido muestran el error en el campo.
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

**Cancelación del cliente (la seña se reembolsa, desde 2026-11-04)**
- [ ] `/reservas` avisa antes de pagar: "…Si cancelás desde “Mis reservas” (hasta 1 hora antes) o cancelamos nosotros, te la devolvemos al mismo medio de pago."
- [ ] El pago se hace en incógnito, sin sesión de Mercado Pago, con tarjeta de prueba titular `APRO`.
- [ ] Con 1 hora o más de anticipación, "Cancelar reserva" pregunta "…Te devolvemos la seña por Mercado Pago." y cancela. Aviso: "…Ya pedimos la devolución de la seña a Mercado Pago…". La reserva muestra "Devolución de la seña en curso" y, cuando llega el webhook, "Seña devuelta". En Mercado Pago el pago figura *refunded*.
- [ ] Con menos de 1 hora, en vez de cancelar aparece el link a WhatsApp.

**Cancelación del admin (con motivo)**
- [ ] "Cancelar" en el panel pide el motivo, prearmado "No hay lugar", editable, y avisa que la seña se le devuelve por Mercado Pago.
- [ ] Sin motivo no deja cancelar.
- [ ] El cliente ve la reserva cancelada con el motivo; el mail de cancelación lo incluye.
- [ ] Hasta que llega el webhook, la seña aparece en "Devoluciones de seña en curso" con el monto y el número de operación; después sale sola y el cliente la ve como "Seña devuelta". "Reintentar" vuelve a pedirla sin devolver dos veces.

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

## Mediciones automáticas (2026-11-01, sesión 07)

Lighthouse 12.6.1 sobre el build de producción (`next start`, local), Chrome headless.
axe-core 4.10.2 inyectado en el navegador, viewport 375 px.

| Página | Rendimiento (cel / esc) | Accesibilidad | Buenas prácticas | SEO | axe |
|---|---|---|---|---|---|
| `/` | 74 / 87 | 100 | 100 | 100 | 0 (había 1 de contraste, corregida) |
| `/carta` | 48 / 70 | 100 | 100 | 100 | 0 |
| `/nosotros` | 74 / 94 | 100 | 100 | 100 | 0 |
| `/reservas` | 63 / 91 | 100 | 100 | 100 | 0 |
| `/ingresar` | — | — | — | — | 0 |

Las páginas con sesión (`/admin`, `/mis-reservas`) no se midieron: piden login con Google.
En local no hay compresión de texto; en Vercel sí, así que el rendimiento real es algo mejor.

## Rendimiento en el celular, en producción (2026-11-02, sesión 08)

**Qué son estos números.** Lighthouse es la herramienta de Google (viene en Chrome)
que puntúa una página de 0 a 100. "Rendimiento" simula un celular de gama media con
una red lenta y mide cuánto tarda en verse la página. Las partes que pesan:

- **LCP** (*Largest Contentful Paint*): cuándo aparece lo más grande de la pantalla,
  casi siempre la foto del hero. Bueno: menos de 2.5 s.
- **CLS** (*Cumulative Layout Shift*): cuánto "salta" la página mientras carga (el
  pie que baja de golpe, un botón que se corre). Bueno: menos de 0.1; 0 es perfecto.
- **TBT** (*Total Blocking Time*): cuánto tiempo el navegador está ocupado con
  JavaScript y no responde a toques.

La rúbrica no pide un puntaje de rendimiento; se midió porque la demo es en vivo y
desde un celular se nota. Los números varían entre corridas, por eso hay dos.

| Página | Antes (2026-11-02) | Después del PR #21 | CLS antes → después |
|---|---|---|---|
| `/` | 65 | 74 · 75 | 0 → 0 |
| `/carta` | 44 | 80 · 72 | 1 → 0 |
| `/reservas` | 43 | 77 · 72 | 0.26 → 0 |
| `/nosotros` | 51 | 72 · 79 | 0 → 0 |

Lighthouse 12.6.1, modo celular, contra https://lapostaparrilla.vercel.app. Lo que
queda alto es el LCP (entre 4 y 8 s en esa simulación): las fotos del hero y el
JavaScript de Next. Para medir de nuevo:

```bash
npx lighthouse https://lapostaparrilla.vercel.app/carta --only-categories=performance --view
```
