# Bitácora

Log de cambios. **Lo más nuevo arriba.**

---

## 2026-11-11 — Barra de la carta: siempre una píldora de una fila

Rama `fix/barra-carta-redonda`. Pedido del usuario: la barra Parrilla · Vinos ·
Restaurante solo era redonda en pantalla completa. En el celular era un rectángulo, y
entre 600 y ~900 px tomaba el tamaño de la compu, "La Posta II Restaurante" bajaba a otra
fila y quedaba una forma rara. Ahora es una píldora de una fila en todos los anchos (tres
columnas parejas en el celular, ajustada al contenido desde 600 px, letra grande desde
900 px), y al bajar queda separada del menú. Medido a 360, 615, 800 y 1200 px.

## 2026-11-11 — Último chequeo en celular

Rama `fix/celular-ultimo-chequeo`. Revisión de todas las páginas a 360 px (públicas,
cliente y admin) con un script que busca desbordes, zonas táctiles chicas, letra chica e
inputs de menos de 16 px (que hacen zoom en iPhone). No hubo desbordes ni inputs con
zoom. Arreglos:

- **"Parrilla & Restaurante · Villa La Angostura"** (portada del inicio, de reservas y
  pie): en el celular el punto quedaba al principio de la segunda línea. Componente
  `Separados`: en el celular cada parte va en su línea, sin el punto; desde 600 px, en
  una.
- **Zonas táctiles:** los links del pie, de "Visitanos" y del índice de la carta medían
  24 px de alto; ahora unos 40. En la compu el índice de la carta queda como estaba.
- **Selector de carta (fijo arriba):** menos relleno en el celular; "La Posta II
  Restaurante" entra en dos líneas y la barra pasa de ~90 a 69 px de alto.
- **Pie en el celular** (al usuario le parecía enorme): de 867 a 484 px de alto. Menos
  relleno, logo más chico, Instagram y mail en una fila, los dos teléfonos lado a lado y
  sin la columna "Secciones" (están en el menú de arriba). En la compu queda igual.

## 2026-11-11 — Aviso de la seña en /reservas y tarjeta de Días bloqueados

Rama `feat/ultimos-retoques`. Últimos cambios visuales pedidos por el usuario.

- **`/reservas`:** el aviso junto al botón no dejaba claro que con menos de 1 hora no se
  puede cancelar y la seña se pierde (la base no deja cancelar al cliente con menos de
  1 hora). Textos nuevos del usuario: `TEXTOS.avisoReserva` y `TEXTOS.avisoSena`.
- **`/admin/bloqueos`:** el formulario va en una tarjeta blanca, como los filtros de
  Reservas, y se sacó la línea de más que quedaba debajo de las pestañas.

## 2026-11-11 — Nosotros: las empanadas en la galería del restaurante

Pedido del usuario: la primera foto de la galería de La Posta II Restaurante en
`/nosotros` pasa a ser "Cuatro tipos empanadas plano arriba.jpg"
(`public/img/restaurante/empanadas.webp`, sumada a `scripts/procesar-assets.py`). La foto
del salón (`salon.webp`) queda en el repo pero sin uso. Después el usuario pidió otro orden: arriba los
vinos y el fogón, abajo las empanadas.

## 2026-11-11 — Nosotros: el equipo como familia y un texto propio por salón

Rama `feat/nosotros-equipo`. Pedido del usuario: "La familia detrás de La Posta" tiene que
hablar del equipo como familia, no de la familia que abrió el restaurante. El borrador
anterior ("Empezamos con un solo salón…") estaba inventado. Texto nuevo armado con
frases e ideas del usuario, que lo aprobó. "Los salones por dentro" repetía las frases
de las tarjetas del inicio: cada local suma `descripcionNosotros` (texto del usuario), y
la página usa la corta si un local no la tiene. Las bajadas de "Los salones por dentro" y "Contacto" son del usuario, y Contacto usa la misma tarjeta que "Visitanos" del inicio en vez de una tarjeta por local. La tarjeta suma el Instagram; el mail va al pie, con un ícono nuevo (`mail`), "Cómo llegar" queda siempre debajo de la dirección (cada bloque baja entero al achicar) y el teléfono y WhatsApp de cada salón van al pie de su tarjetita, alineados aunque un nombre ocupe dos líneas.

## 2026-11-11 — Foto propia en la portada de la carta de vinos

Rama `feat/fondo-carta-vinos`. La vista Vinos de `/carta` usaba la portada de la parrilla;
el usuario pidió una foto de vinos. Probó dos fotos suyas (`Vinosfondo.jpg`, una
estantería de madera, y `vinosfondo2.jpg`, una pared con botellas acostadas) y eligió la
segunda. Queda en `public/img/vinos/hero-pared.webp` (con sus variantes) y
`CARTA_VINOS.imagenes.hero` en `src/data/carta.js`. También se sacó, a pedido del usuario, la nota del pie de la carta ("La carta puede cambiar según la temporada…"). La foto original no está en la
carpeta `Branding y fotos/`: el usuario la pasó por Descargas.

## 2026-11-11 — Estética del inicio y del pie

Rama `feat/estetica-inicio-y-footer`. Pedidos del usuario mirando el sitio.

- **Textos del usuario:** descripciones de los dos salones, la bajada de "Nuestros dos
  salones" y la de "Algunos de nuestros platos". Los anteriores tenían detalles
  inventados por la IA.
- **Albóndigas:** la foto se recortó desde la original, sobre la cazuela (era 4:5 como la
  tarjeta, así que correr el encuadre no cambiaba nada). Se regeneraron sus variantes.
- **Visitanos:** una sola tarjeta, porque los salones comparten dirección, mapa y
  horarios (`datosEnComun()` en `locales.js`; si un día difieren, vuelve a una tarjeta
  por local). Arriba la dirección, los horarios y "Cómo llegar" (Google Maps); abajo una
  tarjetita por salón con teléfono y WhatsApp; el mapa al costado.
- **Teléfono** (componente `Telefono`): link para llamar en pantallas táctiles, texto con
  mouse.
- **Pie:** más bajo (de ~570 a ~290 px en la compu), dirección una sola vez, columna de
  contacto, columnas que se acomodan en 1, 2 o 4.
- `scripts/variantes-img.mjs` saltea los archivos sueltos de `public/img/` (se trababa con
  `compartir.jpg`).

## 2026-11-11 — Textos de la devolución, avisos del panel, sin columna `turno` y limpieza

PR #49 (rama `fix/textos-reembolso-y-panel`) y limpieza de producción.

- **Devolución de la seña:** el diálogo de cancelar, el aviso de después y la página de
  pago tardío dicen "El monto de la seña ($10.000) será devuelto al mismo medio de pago"
  (pedido del usuario). `pagos(estado, monto)` en los embeds; `montoSena()` y
  `textoMontoSena()` en `src/servicios/reservas.js`, con tests.
- **Panel:** editar, cancelar y guardar la nota muestran su aviso (se va a los 8 s); si el
  reembolso falla, lo dice. En la carta, "Eliminado: …". Las pestañas bajan de línea a
  menos de unos 400 px.
- **Base:** migración `20261111120000_sin_columna_turno` (borra `dias_bloqueados.turno`);
  pgTAP 06, 14 y 16 actualizados.
- **Producción probada pagando:** pago aprobado, cancelación y devolución confirmada por
  el webhook.
- **Limpieza de producción** (script corrido por el usuario en el editor SQL): sin
  reservas, pagos, notas ni bloqueos; quedan la cuenta admin del usuario y dos cuentas
  de prueba nuevas (`admin@laposta.test`, `cliente@laposta.test`). Carta intacta.

## 2026-11-10 — Bloqueos por rango de fechas y de horas

Rama `feat/bloqueos-por-rango`. Pedido del usuario: bloquear de una fecha a otra y entre
dos horas (vacaciones, un horario que se deja de tomar por un mes), en vez de un día y
un turno por vez.

- **Base** (migración `20261110120000_bloqueos_por_rango`): `dias_bloqueados` suma
  `fecha_hasta`, `hora_desde` y `hora_hasta` (las dos horas nulas = todo el día). Los
  bloqueos por turno que había se convierten a rango de horas. `validar_reserva()`
  rechaza una reserva cuya fecha y hora caen en un bloqueo. La migración se puede
  aplicar antes de publicar el front: el anterior sigue andando.
- **Panel** (`/admin/bloqueos`): Desde, Hasta (opcional), local, "Desde las" y "Hasta
  las" (los horarios de reserva del local elegido; del primero al último es todo el
  día) y motivo.
- **`/reservas` y "Nueva reserva" del panel:** no ofrecen los horarios bloqueados; si
  quedan todos tapados, el día figura cerrado con su motivo.
- Lógica en `src/validacion/bloqueos.js` (10 tests); pgTAP `16_bloqueos_por_rango` (16).
- El mensaje "Ese turno ya está completo." pasa a "Ese horario no está disponible para
  reservar.".

## 2026-11-10 — Aviso del panel, títulos por página, robots, sitemap e imagen al compartir

Rama `feat/aviso-del-panel-y-metadatos`. Pedidos del usuario después de la prueba.

- **Panel:** el aviso de una reserva cargada por el local trae sus datos ("Reserva
  guardada y confirmada: nombre, fecha, hora, personas, local") y se va solo a los 8
  segundos; "Ok" lo cierra antes. El aviso de una reserva que entró por la web no se va
  solo.
- **Título de la pestaña por sección** ("Carta · La Posta", "Reservas · La Posta"…): un
  `layout.jsx` por carpeta, porque las páginas son componentes de cliente. El panel, la
  cuenta y el pago llevan `noindex`.
- **`app/robots.js` y `app/sitemap.js`**: `/robots.txt` y `/sitemap.xml` con las cuatro
  páginas públicas. La dirección sale de `MARCA.sitio`.
- **Imagen al compartir el link** (`public/img/compartir.jpg`, 1200 × 630: el cordero del
  inicio y el logo sobre bordo), por Open Graph.

## 2026-11-10 — Aviso viejo en /reservas y año en los días bloqueados

Rama `fix/aviso-de-turno-y-anio-en-bloqueos`. Dos menores de la prueba de usuario:

- **`/reservas`:** el error del envío ("Ya tenés una reserva en ese turno…") quedaba en
  pantalla después de cambiar la fecha o la hora. Ahora se borra al cambiarlas.
- **Días bloqueados:** la lista muestra el año ("miércoles, 10 de marzo de 2027");
  `formatearFecha` acepta `{ conAnio: true }`.

## 2026-11-10 — El panel arranca en las confirmadas

Rama `feat/admin-confirmadas-por-defecto`. Pedido del usuario: al abrir `/admin`, el
filtro de estado arranca en "Confirmada" (antes "Todos"), porque es lo que el local
quiere ver primero. El resto de los estados sigue en el mismo desplegable.

## 2026-11-10 — Diálogos con el estilo del sitio

Rama `feat/dialogos-del-sitio`. Lo pidió el usuario después de la prueba del panel:
cancelar una reserva y eliminar un producto preguntaban con los cuadros del navegador
(`window.confirm`, `window.prompt`).

- Componente `Dialogo`: `<dialog>` modal con la marca (título en Baskerville, botones
  del sitio). Atrapa el foco, cierra con Escape o con un clic afuera y devuelve el foco
  al botón que lo abrió.
- **Mis reservas:** "¿Seguro que querés cancelar tu reserva del … ?", con el aviso de
  que se devuelve la seña si estaba paga.
- **Panel, cancelar:** pide el motivo en un campo (propone "No hay lugar", hasta 120
  caracteres, igual que la base) y marca el error en el campo si queda vacío.
- **Panel, carta:** "¿Eliminar «…» de la carta?".

## 2026-11-10 — Fecha de la seña en Mercado Pago y hora del vencimiento

Rama `fix/fecha-mp-y-hora-vencimiento`. Dos errores de texto que vio el cliente en la
prueba de usuario contra producción:

- **Concepto de la seña en Mercado Pago:** decía "2011 12:30" por "20/11 12:30";
  Mercado Pago saca la barra. Ahora va "20 de noviembre 12:30"
  (`src/servidor/preferencia.js`).
- **Hora en que vence el pago:** decía "hasta las 12:57 a. m..". Ahora "hasta las
  00:57." con `horaDeVencimiento` (`src/servicios/reservas.js`), que usan Mis reservas
  y la página del pago.

## 2026-11-10 — Google muestra siempre el selector de cuentas

Rama `fix/google-selector-de-cuenta`. Con una sola cuenta de Google abierta, "Ingresar
con Google" entraba directo y no dejaba elegir otra: en una computadora compartida, o
para pasar de la cuenta de cliente a la del local. Apareció en la prueba de usuario
contra producción. `ingresarConGoogle` (`src/servicios/auth.js`) ahora manda
`prompt=select_account`.

## 2026-11-07 — Captcha en los formularios con mail

Rama `feat/captcha-turnstile` (PR #38). Prendido en producción el 2026-11-08; el
ingreso con mail lo probó el usuario. Cierra el último punto de la auditoría: el cupo de 30
mails de Auth por hora, para todo el sitio, se podía agotar sin cuenta.

- Componente `Captcha` (Cloudflare Turnstile, modo "Managed": casi siempre pasa solo).
  Va en crear cuenta, ingresar con contraseña y "Olvidé mi contraseña".
- Supabase verifica el token (`[auth.captcha]` y `[remotes.produccion.auth.captcha]`).
  Cada token sirve para un intento: después de un error se pide otro.
- En previews el captcha no valida (el widget es solo del dominio de producción):
  ahí se ingresa con Google. Cómo apagarlo, en `docs/BACKEND.md`.

## 2026-11-06 — Arreglos de la auditoría de seguridad

Rama `fix/seguridad-auditoria` (PR #37). Arregla lo que encontró la auditoría de
seguridad (skill `security-audit` de Cloudflare, perfil deep; sesión 12). En producción
desde el 2026-11-07, con `db push` y `config push` (sesión 13).

- **Redirect abierto en `/ingresar`:** `?volver=/\otro-sitio.com` llevaba a otro sitio.
  `destinoSeguro` pasa a `src/validacion/destino.js`, resuelve la ruta con `URL` y solo
  acepta el origen propio.
- **Redirects de Auth en producción:** solo `lapostaparrilla.vercel.app`
  (`[remotes.produccion.auth]` de `supabase/config.toml`). Se van el comodín de las
  previews de Vercel y localhost. Ingresar desde una preview termina en producción.
- **Topes de uso** (migración `20261106120000_topes_de_uso.sql`, test pgTAP 15):
  - hasta 10 reservas web por cliente cada 24 horas;
  - hasta 3 cambios del cliente por reserva (pedir lo mismo no cuenta ni manda mail);
  - hasta 5 intentos de pago por reserva (`POST /api/v1/pagos` responde 429).
- Una reserva nueva ya no puede traer `modificada_por` ni el contador de cambios.
- **Panel:** `listarReservas` pide de a páginas (PostgREST corta en 1000 filas) y
  `/admin/dia` filtra el estado en la base.
- **Cabeceras de seguridad** en `next.config.mjs`: `frame-ancestors 'none'`, `nosniff`,
  `Referrer-Policy`.
- **Sin arreglar:** el cupo global de mails de Auth (30 por hora) se puede agotar sin
  captcha. Hace falta un captcha con claves del dueño.

## 2026-11-05 — Estética del inicio

Rama `feat/hero-foto-entera`. Cambios pedidos por el usuario mirando el sitio y
comparando dos copias locales (`hallazgos.md` 2.15).

- **Portada:** la foto es "Cordero patagónico" (`comunes/hero-cordero.webp`; sale la de
  los corderos en el asador). En pantallas apaisadas va al centro, al 64 % del ancho, y
  se funde con los costados: la misma foto agrandada y con poco desenfoque (prop
  `entera` de `Hero`). En el celular, como antes.
- **Tarjeta de la parrilla:** foto del frente con nieve, mejorada por el usuario con
  Gemini. Encuadrada desde arriba (`imagenes.encuadreCard` en `locales.js`) para que se
  vea el cartel.
- **Etiquetas de las tarjetas de los salones:** más chicas y más pegadas a la esquina,
  sobre todo en el celular, donde tapaban el cartel.
- **Texto de bienvenida:** redacción del usuario (`src/data/textos.js`).
- **Fotos de la bienvenida:** tira de asado, sirviendo vino (la alta) y tres pizzas, con
  los encuadres que eligió el usuario.
- Las fotos nuevas están en `scripts/procesar-assets.py` y tienen sus versiones de 480 y
  960 px.

---

## 2026-11-05 — Menores de la seña

Rama `fix/menores-de-la-sena`. Los menores que habían quedado de las revisiones de la seña.

- **Monto cobrado:** `avisos.js` compara `transaction_amount` con el monto de la seña en
  la base. Un pago aprobado por otro monto no confirma la reserva y se reembolsa (en
  Checkout Pro no debería pasar: el monto lo fija el servidor).
- **`cancelar_reserva` con `for update`** y motivo de más de 120 caracteres con mensaje
  en castellano (migración `20261105120000_cancelar_reserva_ajustes`).
- **Mail de cancelación:** "la seña se reintegra" solo si la reserva estaba confirmada
  (con la seña cobrada). Hay que redesplegar `notificar-reserva`.
- **Pago tardío en `/reservas/pago`:** la pantalla sigue mirando 10 minutos después del
  vencimiento. Probado en local: con la reserva vencida, se cargó un pago aprobado en la
  base y la pantalla pasó sola de "La reserva no se completó" a "Llegó tarde el pago";
  con la seña devuelta, dejó de consultar.
- **`esUrlPublica`:** `[::1]`, IPs de la red local (10/8, 172.16/12, 192.168/16,
  169.254/16, IPv6 privadas) y nombres `.local` / `.localhost` no son públicos.
- Tests: pgTAP `14_cancelar_reserva_ajustes` (10: motivo largo, cancelación directa del
  admin sin motivo, un turno bloqueado en los dos locales, corte de las 17:00), 6 en
  `node --test`, 1 de ruta y 1 de Deno.
- `pagos.reserva_id` sigue en cascada (decisión del usuario): las cuentas no se borran,
  salvo para limpiar los datos de prueba de la presentación. Queda para decidir el registro
  de los reembolsos de cobros duplicados que fallan.

---

## 2026-11-05 — Menores del ingreso con mail

Rama `fix/menores-ingreso-con-mail`. Los cinco que quedaron de la revisión final de la
sesión 09.

- **El límite de envíos revelaba qué mails tienen cuenta.** Probado contra Supabase Auth
  local: pedir "Olvidé mi contraseña" dos veces seguidas con un mail que tiene cuenta da
  429 ("you can only request this after N seconds"); con uno que no tiene, da ok. Lo
  mismo al crear otra vez una cuenta sin confirmar. Ahora ese error por cuenta se responde
  como enviado (`esEsperaDeLaCuenta` en `src/servicios/auth.js`); el límite general del
  sitio, que no dice nada de nadie, se sigue mostrando.
- **Link vencido con la sesión abierta:** supabase-js conserva la sesión anterior y deja
  el error en la URL, así que se veía el formulario de contraseña nueva. Ahora
  `/ingresar/contrasena` lee el error (`errorDelLink`) y muestra "El link venció".
  Probado en el navegador con un link real de Mailpit usado dos veces: antes del arreglo,
  formulario; después, el aviso.
- **Errores de Auth traducidos:** demasiados intentos, cuenta suspendida, link vencido,
  sesión vencida, datos inválidos, demora y sin conexión. Uno desconocido sigue dando el
  mensaje genérico, nunca el texto en inglés.
- **Foco:** al pasar a "Olvidé mi contraseña" o volver, va al mail del formulario nuevo
  (antes quedaba en la nada porque el botón tocado desaparece); al mandar, va al aviso
  "Listo…". Al cambiar de pestaña se queda en la pestaña.
- **Pestañas:** el grupo se llama "Ingresar o crear cuenta" para el lector de pantalla.
- Tests: 14 nuevos en `node --test` y 7 en Vitest (`PestanasCuenta` nuevo, foco de
  `FormularioCuenta`).

---

## 2026-11-05 — Tests de las rutas y de los componentes

Rama `test/componentes-y-rutas`. Cierra el faltante de Código / Estructura en la rúbrica.

- **Vitest + React Testing Library + jsdom** (lo que recomienda la guía de Next 16), solo
  como dependencias de desarrollo. `vitest.config.js` tiene dos proyectos: `rutas`
  (entorno Node) y `componentes` (jsdom). Los tests de `node --test` siguen igual;
  `npm test` corre las dos tandas, así el CI no cambia.
- **Rutas** (`app/api/**/route.test.js`, `app/api/v1/carta/escrituras.test.js`, 58 tests):
  se llama al handler con un `Request` real. Se reemplazan solo los adaptadores
  (`supabase.js`, `base.js`, `carta-base.js`, `mercadopago.js`); la lógica, Zod y el
  manejo de errores corren de verdad. Cubre 201/200/204, 400, 401, 403, 404, 409 y 500
  sin detalles; el webhook con firmas HMAC reales (válida, con otro secreto, sin firma,
  sin secreto cargado, firma de otro `data.id`); reembolso y pago tardío; caché de la carta.
- **Componentes** (56 tests): `Boton`, `Campo`, `LocalCard`, `InfoLocal`, `Navbar` (menú
  mobile: foco, trampa de Tab, Escape, scroll; links según la sesión), `RequiereSesion`,
  `FormularioCuenta`, `EditarReserva`, `ModificarReserva`.
- Se comprobó que los tests detectan errores: con el chequeo de firma salteado, el caché
  cambiado, el `aria-invalid` sacado de `Campo`, el foco de Escape sacado y los
  comentarios sin recortar, fallan 11 tests; con el código original pasan todos.
- **Descartado (decisión del usuario):** editar franjas y horarios desde el panel. Ya no
  cambian entre temporadas (`hallazgos.md` 1.37).

---

## 2026-11-04 — La seña vuelve a reembolsarse

Rama `feat/reembolso-de-sena`. La ayudante de cátedra sugirió volver a probar los
reembolsos; con las credenciales de prueba `TEST-` de la aplicación del usuario funcionan
(con las del vendedor de prueba, 401 aunque tenga saldo: `hallazgos.md` 1.35). Decisión
del usuario: se devuelve en toda cancelación, y se da por devuelta cuando lo confirma el
webhook.

- `reintegros.js` (vuelve): `PaymentRefund` con clave de idempotencia por pago.
  `cancelaciones.js` pide el reembolso al cancelar (o lo reintenta sobre una reserva ya
  cancelada) y responde `{ reintegro: 'pedido' | 'fallo' | 'no_corresponde' }`.
- `avisos.js`: el pago `refunded` pasa la seña a `reintegrado` (`confirmarReintegro`);
  un pago tardío o un cobro doble piden el reembolso en el momento.
- `mercadopago.js`: con un token `TEST-` usa `sandbox_init_point`.
- Migración `20261104120000_reembolso_de_sena`: `marcar_reintegro` en cualquier
  cancelación y se borra `marcar_sena_devuelta`. pgTAP `10_reembolso_de_sena` y
  `05_sena` ajustados.
- Front: aviso antes de pagar, confirmación y mensaje al cancelar en "Mis reservas",
  "Devoluciones de seña en curso" con "Reintentar" en el panel, etiqueta "Devolución de
  la seña en curso". Mails: la seña se reintegra también si cancela el cliente.
- Probado en local de punta a punta (pago en sandbox en incógnito, el webhook simulado
  con la misma lógica de la ruta porque Mercado Pago no llega a localhost).
- En producción el mismo día (PR #29, `69c9ba9`): webhook de prueba de la aplicación,
  variables nuevas en Vercel, `db push` y `notificar-reserva` v11. Probado con el webhook
  real: pago #1354726481 reembolsado y marcado `reintegrado`. Una seña de prueba del 02/11
  cobrada con la aplicación anterior se marcó `reintegrado` a mano (no se puede
  reembolsar con el token nuevo).

---

## 2026-11-04 — Ingresar con mail desde /reservas

Rama `feat/reservas-ingresar-con-mail` (PR #27). Pedido del usuario: sin sesión,
`/reservas` solo ofrecía Google. Ahora muestra una tarjeta centrada con "Ingresar o crear
cuenta" arriba (lleva a `/ingresar?volver=...` y vuelve con el salón elegido), una "o" y
"Continuar con Google" abajo, los dos del mismo ancho (el usuario pidió centrado y el
de mail primero).

Nota sobre la entrada de abajo: el registro con mail **no** quedó apagado; se prendió en
producción el mismo 2026-11-03 (ver `docs/proceso/sesion-09-2026-11-03.md`).

---

## 2026-11-03 — Ingreso con mail y contraseña

Rama `feat/ingreso-con-mail`. Spec `docs/superpowers/specs/2026-11-03-ingreso-con-mail-design.md`,
plan `docs/superpowers/plans/2026-11-03-ingreso-con-mail.md`.

- `/ingresar` con dos pestañas (`PestanasCuenta`, opción B de la maqueta, elegida por
  el usuario): Google en las dos y, abajo, mail y contraseña (`FormularioCuenta`).
  Crear cuenta pide nombre, mail y contraseña; el teléfono no (decisión del usuario).
- "Olvidé mi contraseña" y `/ingresar/contrasena`.
- `src/validacion/cuenta.js` (mail en minúsculas y sin espacios, contraseña de 8 a 72,
  repetición) y errores de Auth en castellano en `supabase.js`.
- Un mail que ya tiene cuenta muestra el mismo aviso que uno nuevo: Supabase local
  responde `user_already_exists` y no un usuario vacío, como suponía el diseño.
- Mails de Auth por el SMTP de Brevo solo en producción (`[remotes.produccion]`), con
  plantillas propias. En producción el registro queda apagado hasta probar que los
  mails llegan (paso 1).
- `/reservas`: el teléfono se guarda siempre en el perfil (sin casilla).
- Tests: `node --test` 122, pgTAP 174 en 12 archivos (`13_perfil_registro_con_mail`).
  Recorrido completo en local con Mailpit.

---

## 2026-11-03 — El local ya no recibe mails

Rama `feat/sin-mails-al-local`. Pedido del usuario: los avisos al local (reserva
nueva con la seña paga, cancelación y cambio del cliente) llegaban al mail de la
facultad y caían en spam. La función `notificar-reserva` ahora le escribe **solo al
cliente**; el local se entera por el panel, en tiempo real. Los mails al cliente no
cambian (el usuario confirmó que le llegan bien).

- `mensajes.ts`: fuera los tres mails al admin, el campo `para` y el teléfono con
  links de llamada y WhatsApp (solo iba en esos mails). `index.ts`: deja de leer
  `MAIL_ADMIN`.
- Tests Deno: 19 (uno nuevo: ningún mail lleva al panel).
- Hay que **redesplegar la función** (`npx supabase functions deploy notificar-reserva`)
  para que llegue a producción; el secreto `MAIL_ADMIN` puede quedar o borrarse.

---

## 2026-11-03 — Editar una reserva desde el panel

Rama `feat/editar-reserva-panel`. En el panel, "Mover" pasa a ser **"Editar"**: fecha,
hora, personas, nombre, teléfono, comentarios y, en las reservas del local, el mail
(las de la web usan el de la cuenta). Componente nuevo `EditarReserva`; en
`src/servicios/admin.js`, `moverReserva` pasa a `editarReserva`.

- **Sin migración**: la política "reservas: el admin edita" ya dejaba actualizar
  cualquier columna, y los checks y triggers que había (`validar_contacto`, tope de
  6 / 40 personas, mail solo en las del local, `validar_reserva`) ya controlaban los
  datos nuevos. pgTAP `12_admin_edita_reserva.test.sql` (12) lo deja fijado.
- El mail al cliente sigue saliendo solo si cambian la fecha o la hora (como antes con
  "Mover"); el formulario lo avisa.
- Tests: `node --test` 100, pgTAP 183 en 12 archivos. Probado en local con sesión de
  admin: errores por campo, error de la base (día bloqueado) y guardado, en escritorio
  y a 375 px.

---

## 2026-11-02 — Rendimiento en el celular

Rama `perf/celular`. Medido primero contra producción (Lighthouse celular):
inicio 65, carta 44, reservas 43, nosotros 51.

- **supabase-js (~245 KB) fuera de la carga inicial**: la navbar y `SesionProvider`
  lo importaban en todas las páginas. Ahora `backendDisponible` sale de
  `src/servicios/config.js` y el cliente se importa después de pintar la página.
- **`/carta` llegaba vacía en el HTML** (`Suspense fallback={null}` alrededor de toda
  la página): el fallback ahora trae la portada del local por defecto y el lugar de
  la carta. CLS 1 → 0.
- `/reservas` y `RequiereSesion` reservan el lugar mientras se sabe si hay sesión.
  CLS 0.26 → 0.
- Fotos con `srcSet` y `sizes`: `scripts/variantes-img.mjs` genera versiones de 480
  y 960 px (48 archivos) y `src/data/imagenes.js`.
- Medido en producción después del merge (Lighthouse celular): inicio 65 → 74-75,
  carta 44 → 72-80, reservas 43 → 72-77, nosotros 51 → 72-79; CLS 0 en las cuatro.
- **Las tres cartas con la misma estética** (pedido del usuario): el restaurante deja
  el estilo "redondeado" y los vinos dejan el título "Vinos" sobre las cepas; todo
  como la hoja de la parrilla. Se va la fuente Pathway Gothic One (una descarga
  menos).

---

## 2026-11-02 — Mails con Brevo, con la marca

Rama `docs/brevo`. Cuenta de Brevo del usuario (mail de la facultad); remitente y
avisos al local a `gdiclaudio@itba.edu.ar` (decisión del usuario: no se manda en
nombre de la casilla real del local). Clave con permiso solo para emails
transaccionales, cargada por el usuario.

- Plantilla nueva (`supabase/functions/notificar-reserva/mensajes.ts`): logo en PNG
  (`public/logo/logo-mail-blanco.png`, Gmail no muestra SVG), colores del manual,
  datos en tabla, el cambio de horario con el anterior tachado.
- Textos al cliente en tercera persona ("Tu reserva fue cancelada"), pedido del
  usuario. El teléfono del cliente solo va en los mails al local, con links para
  llamar y WhatsApp; al cliente se le muestra el WhatsApp del local.
- La cancelación del cliente ahora también le llega a él (antes solo al local), y
  dice que la seña no se reintegra; la del local, que se reintegra.
- Deno: 18 tests (4 nuevos).

---

## 2026-11-01 — Reservas: una por turno, modificar, estados y días bloqueados aparte

Rama `feat/reservas-cliente`. Pedidos del usuario después de probar producción.

- Migración `20261102120000_reservas_por_turno_y_modificar`: una reserva activa por
  turno (almuerzo y cena el mismo día); `modificar_reserva()` para el cliente hasta 1
  hora antes (fecha, hora y personas, mismo local; la seña sigue valiendo);
  `modificada_por`. pgTAP `11_…` (13).
- Mis reservas: "Modificar" (`ModificarReserva`); anteriores y canceladas de a 5 con
  "Ver más" (antes se pedían todas).
- Estados: las confirmadas de días pasados se ven "Terminada" (no es un estado de la
  base); "Pendiente" y "Rechazada" salen del filtro (ya nada las crea).
- Días bloqueados: pestaña propia, `/admin/bloqueos`.
- Mail "el cliente cambió su reserva" en la Edge Function (falta desplegarla).

---

## 2026-11-01 — La seña no se reembolsa

Rama `feat/sena-no-reembolsable`. Decisión del usuario: Mercado Pago no deja
reembolsar en modo de prueba y no se usan cuentas con plata real, así que la app deja
de pedir reembolsos.

- Migración `20261101120000_sena_no_reembolsable`: el trigger `marcar_reintegro` solo
  actúa si cancela el local; `marcar_sena_devuelta()` para el admin. pgTAP
  `10_sena_no_reembolsable` (8) y `05_sena` ajustado.
- Servidor: fuera `reintegros.js` y `mp.reintegrar`; la cancelación responde
  `{ sena }` y una reserva ya cancelada da 409; el webhook ya no reembolsa.
- Front: aviso antes de pagar y al cancelar; el panel muestra "Señas a devolver" con
  el número de operación y "Ya la devolví".

---

## 2026-11-01 — Pase de accesibilidad (E2) y dependencias

Rama `fix/accesibilidad`. Presentación fijada para el **jueves 12 de noviembre**;
el usuario saca el pedido para llevar, deja las gift cards en evaluación y decide
que la seña no se reembolsa (PR aparte).

- Menú mobile: el foco entra al primer link, queda atrapado (Tab / Shift+Tab) y
  Escape lo devuelve al botón; `aria-controls` en el botón.
- Una sola escala de breakpoints, documentada en `src/styles/tokens.css`.
- axe: contraste 3.8:1 en "Lo que nos mueve" (crema suave sobre oliva) → crema plena.
- `LocalCard` omite el horario si un local no tiene.
- Next 16.4.3 + `npm audit fix`: sin vulnerabilidades altas ni críticas.
- Test del ranking de `estadoSena`.
- Lighthouse y axe registrados en `docs/QA-MANUAL.md`: Accesibilidad 100 en todas
  las páginas públicas. RUBRICA: E2 e Interfaz ✅.

---

## 2026-10-30 — La carta en producción, probada por el usuario

- **PR #12** (carta editable, `698911f`) y **PR #13** (editor v2, vinos aparte, sin
  PDF, `964a33d`) en `main`, con `supabase db push` de `20261029120000`,
  `20261029120100` y `20261029130000` antes de cada merge. Producción verificada:
  `/carta` con Parrilla · Vinos · Restaurante, `/api/v1/carta/vinos`,
  `/admin/carta/imprimir` responde 404.
- El usuario lo probó con la cuenta de admin y lo aprobó. RUBRICA: E4 y E5 ✅.
- `README.md` y `docs/CONTEXTO.md` al día (estado, etapas, la carta ya no es el PDF).
- `.claude/launch.json`: el servidor de desarrollo para el panel de vista previa de
  Claude Code (`npm run dev`, puerto 3000).

---

## 2026-10-29 — Editor de la carta v2, vinos aparte, sin PDF

Rama `feat/accesos-carta` (PR #13). Spec `docs/superpowers/specs/2026-10-29-editor-carta-v2-design.md`,
plan `docs/superpowers/plans/2026-10-29-editor-carta-v2.md`.

- **Base:** `20261029130000_carta_v2.sql` — `ubicar_item_carta`, `ubicar_bodega_carta`,
  cambio de categoría o bodega al final del destino, renumeración sin huecos.
  pgTAP `09_carta_v2.test.sql` (17).
- **API:** `GET /api/v1/carta/vinos`; la carta de un local ya no trae los vinos;
  `posicion` en lugar de `mover`; `seccionId` y `region` al editar.
- **`/carta`:** Parrilla · Vinos · Restaurante, con "De los dos locales"; links viejos
  a los vinos redirigen.
- **Panel:** `CajaCarta` (una caja, buscador, categoría desplegable) y `ListaCarta`
  (arrastre con puntero y teclado). Se borró `EditorItemCarta`.
- **Sin PDF:** se borró `/admin/carta/imprimir` y el CSS de impresión de la hoja.
- Tests: `node --test` 96, pgTAP 150 en 9 archivos.

---

## 2026-10-29 — Cómo llegar al editor de la carta

Rama `feat/accesos-carta`.

- **Pestañas "Reservas · Carta"** en el panel (`src/components/PestanasAdmin/`), en
  `/admin` y `/admin/carta`. Reemplazan el botón "Editar la carta" y "← Volver al
  panel".
- **"Editar esta carta"** en `/carta`, solo para el admin → `/admin/carta?vista=<local>`.
- **Botones invisibles:** `Boton variante="contorno"` es para fondos oscuros; en
  fondos claros no se veía (el botón al editor, "Imprimir / Guardar PDF", "Guardar
  región", "Guardar cubierto" y el WhatsApp del error de `/carta`). Variante nueva
  `secundario`, bordo sobre claro (`hallazgos.md` 1.28).

---

## 2026-10-29 — La carta pasa a la base, con API, panel e impresión

Rama `feat/carta-editable`. Spec `docs/superpowers/specs/2026-10-29-carta-editable-design.md`,
plan `docs/superpowers/plans/2026-10-29-carta-editable.md`.

- **Base:** migraciones `20261029120000_carta.sql` (tablas, trigger de reglas,
  funciones de orden, RLS) y `20261029120100_carta_datos.sql` (carga inicial, 278
  ítems, generada por `scripts/carta-a-sql.mjs`). pgTAP `08_carta.test.sql` (32).
- **API:** `GET /api/v1/carta` (pública, caché de 1 minuto, `&fresca=1` sin caché) y
  escrituras del admin en `items`, `secciones/[id]/bodegas` y `locales/[id]`. Lógica
  en `src/servidor/carta.js` y `carta-base.js`.
- **`/carta`** lee la API y toma la estética de la carta impresa (`HojaCarta`, fuentes
  parecidas de Google en `src/styles/fuentesCarta.js`, logo real). Se sacó el link
  público a los PDF y `public/cartas/`.
- **Panel:** `/admin/carta` (editar, mover, agregar, borrar; bodegas; cubierto) y
  `/admin/carta/imprimir` (hoja oficio, dos columnas, marco en cada hoja).
- Se borraron `src/data/cartas.json`, `vinos.json` y su test; `procesar-assets.py`
  ya no genera los PDF de la carta.
- Tests: `node --test` 86, pgTAP 129 en 8 archivos. Build: `/carta` sigue estática.

---

## 2026-10-18 — La vuelta de Mercado Pago iba a la preview

Rama `fix/url-produccion`, [PR #10](https://github.com/giandicla/LaPostaParrilla/pull/10) (`d7f7307`).

- **El síntoma (lo reportó el usuario):** al pagar en `lapostaparrilla.vercel.app`,
  Mercado Pago lo devolvía a una pantalla de Vercel en vez de a La Posta.
- **La causa:** en Vercel, `APP_URL` de Production tenía la URL de la preview. La
  vuelta (`back_urls`) y el aviso de pago (`notification_url`) iban a la preview,
  que pide login de Vercel. El pago se cobraba en Mercado Pago, pero el webhook no
  llegaba y la reserva quedaba "esperando pago" hasta vencer. Dos pagos de prueba
  quedaron así (cobrados, sin registrar, vencidos; el usuario decidió dejarlos).
- **El arreglo:** `src/servidor/sitio.js` (`urlDelSitio`, 4 tests). En producción
  la URL sale de `VERCEL_PROJECT_PRODUCTION_URL`, que informa Vercel; `APP_URL` queda
  para previews y local. Ya no depende de que esa variable esté bien cargada.
- **Verificado en producción** con un pago real de prueba: vuelta y webhook a
  `https://lapostaparrilla.vercel.app/...`, reserva confirmada en 11 segundos.

---

## 2026-10-18 — La seña en producción; base limpia

- **Merge del [PR #8](https://github.com/giandicla/LaPostaParrilla/pull/8)**
  (`ccf06c7`), con los 5 checks en verde (lint/tests/build, pgTAP, Edge Function,
  Vercel). Autorizado por el usuario después de la prueba de punta a punta.
- Antes del merge, el usuario pasó las variables a **Production** (`APP_URL` con el
  dominio de producción) y cambió la URL del webhook en Mercado Pago a
  `https://lapostaparrilla.vercel.app/api/webhooks/mercadopago`. Tuvo que hacerlo
  dos veces, porque la IA le había pedido cargarlas solo en Preview sin avisar que
  se podían tildar los dos entornos juntos.
- Verificado en producción: `/reservas` y `/reservas/pago` responden 200, el
  webhook responde 401 sin firma y la ruta de pagos pide sesión.
- El usuario volvió a prender la Vercel Authentication en las previews.
- **Base de producción limpia, a pedido del usuario:** se borraron todas las
  reservas (8), los pagos (5) y el bloqueo de prueba (1), en una transacción que
  controlaba las cantidades. Quedaron las 2 cuentas, los 2 locales y las 20 franjas.
- `CLAUDE.md`: sección "Pagos", la excepción de `src/servidor/` a la regla de
  Supabase, y el bloque que agrega `next dev`, commiteado a pedido del usuario para
  que no aparezca más como cambio pendiente.

---

## 2026-10-18 — Seña de la reserva con Mercado Pago

Rama `feat/pagos-sena`, [PR #8](https://github.com/giandicla/LaPostaParrilla/pull/8).
Spec: `docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md`.
Primer cobro de los tres decididos (seña, gift cards, pedido para llevar); cubre E6.

**Qué se hizo**

- Las reservas de la web ahora nacen `esperando_pago` y se confirman solas cuando
  se acredita la **seña de $10.000** (monto fijo por reserva, `locales.sena`), sin
  aceptación del admin. Sin pago a los 15 minutos pasan a `vencida` (`pg_cron`).
- Pago con **Checkout Pro**: `POST /api/v1/pagos` crea el pago y la preferencia en
  el servidor; `POST /api/webhooks/mercadopago` valida la firma, consulta el pago
  real y concilia con `acreditar_pago()` (idempotente, con pago tardío y cobro
  doble); `POST /api/v1/reservas/:id/cancelacion` cancela y reintegra.
- Cancelación del admin **con motivo** ("No hay lugar" por defecto). Se sacan
  Confirmar y Rechazar del panel. Bloque "Reintegros pendientes" con "Reintentar".
- **Bloqueo por turno** (mediodía antes de las 17:00, noche desde las 17:00) para
  cuando el local se llena.
- `/reservas/pago` (vuelta desde Mercado Pago), `/mis-reservas` con "Pagar seña",
  y el cartel oficial de Mercado Pago (Brand Brick) bajo el botón.
- Tests: pgTAP 7 archivos / 97 asserts, `node --test` 64, Deno 13. Lint y build sin errores.

**Despliegue a producción (una sola ventana, 2026-10-18)**

- `supabase functions deploy notificar-reserva`.
- `supabase db push`: migraciones `20261015110000`, `20261015120000`,
  `20261015130000` y `20261018120000`. Antes, lectura de la base de producción:
  3 reservas (2 canceladas, 1 confirmada futura), ninguna `pendiente`. El primer
  `db push` lo frenó el clasificador del modo automático; corrió cuando el usuario
  lo volvió a pedir.
- Variables en Vercel, todas cargadas por el usuario (la IA no carga claves en
  servicios externos): `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`,
  `SUPABASE_SECRET_KEY`, `APP_URL` y, para el cartel, `NEXT_PUBLIC_MP_PUBLIC_KEY`.
  Primero solo en Preview: la IA no avisó que se podían tildar Preview y
  Production juntas, y el usuario tuvo que repetir el paso para producción.
  Webhook configurado por el usuario en el panel del vendedor de prueba. Vercel
  Authentication apagada en las previews (si no, el webhook recibe un 302).
- Un commit vacío (`0ac7b88`) rearmó la preview con las variables.
- **Falta:** el merge a `main`, que el usuario autorizó para después de una prueba de punta a punta exitosa; no estaba hecho al escribir esta entrada. Pendientes en `docs/PENDIENTES.md`.

**Prueba de punta a punta en la preview** (ids = prefijos en la base)

| # | Caso | Resultado |
|---|---|---|
| 1 | Pago aprobado (titular `APRO`) | OK. Reserva `7410e296` confirmada, pago `d3799943` aprobado (Mercado Pago `184877192398`), conciliado por webhook en menos de 2 minutos. El primer intento falló con 500 (variables sin cargar): quedó la reserva `7493381b` cancelada sin pago |
| 2 | Pago rechazado (`OTHE`) y reintento | OK. Pago `b657479c` rechazado, la reserva `c9beaa9e` siguió `esperando_pago`; reintento con `APRO`: pago `68114989` aprobado, confirmada |
| 3 | Cancelación del cliente de `7410e296` | **Falló el reintegro**: la cancelación se hizo y el pago quedó `reintegro_pendiente` (Mercado Pago responde 401 "Unauthorized use of live credentials" al reembolsar con estas credenciales) |
| 4 | Cancelación del admin de `c55bdcf1`, motivo "No hay lugar" | OK la cancelación; reintegro pendiente por la misma causa. El bloqueo de turno (2026-10-23, parrilla, noche) frena las reservas en `/reservas` |

**Lo que no está probado:** el reintegro automático contra Mercado Pago. Sí está
probado lo que hace la app cuando Mercado Pago lo rechaza: cancelación firme, pago
en `reintegro_pendiente`, "Reintentar" en el panel. Detalle y salidas en
`docs/BACKEND.md` y `docs/proceso/hallazgos.md` 1.18.

**Documentación:** `RUBRICA.md` (E6), `BACKEND.md` (sección de pagos),
`ESTRUCTURA.md`, `QA-MANUAL.md` (checklist de la seña), `PENDIENTES.md`, registro
del proceso (`proceso/sesion-05-2026-10-15.md` y `hallazgos.md` 1.16 a 1.22, 2.10, 3.9).

---

## 2026-10-08 — Previews de Vercel conectadas a la base

Decisión del usuario: las previews de cada PR usan la **base de producción** (no
hay base de pruebas aparte).

- Vercel: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  habilitadas también para *Preview* (lo hizo el usuario).
- Supabase → Auth → Redirect URLs: se suma
  `https://la-posta-parrilla-*-gdiclaudio-3350s-projects.vercel.app/**`, para que el
  login con Google vuelva a la preview.
- Verificado en la preview del PR #7: `/reservas` muestra "Ingresar con Google" y
  la carta de La Posta II, los vinos.

---

## 2026-10-08 — Vinos en las dos cartas; la carta nueva arranca arriba

Rama `feat/carta-vinos`.

- La carta de vinos es la misma en los dos locales (lo confirmó el usuario): pasa
  de la carta de la parrilla a `src/data/vinos.json` y `getCarta()` la suma al
  final de las dos. La Posta II Restaurante ahora muestra vinos y "Copas y
  descorche". 5 tests nuevos (`src/data/carta.test.js`; `npm test`: 23).
- `/carta`: al cambiar de local, la página vuelve arriba de todo.
- El import de los JSON lleva `with { type: 'json' }`: Node lo pide para correr los
  tests, y Next lo acepta.

---

## 2026-10-08 — Producción: migración, función y merges

- `supabase db push`: migración `20261008130000_reservas_del_local` aplicada en
  producción (antes, `--dry-run`: era la única pendiente).
- `supabase functions deploy notificar-reserva`.
- Merge de los PRs #4 y #6 a `main`; Vercel publicó el sitio con el #6 ("Ready").
  Verificado: páginas en 200, nombres nuevos en `/reservas` y la API de producción
  acepta las columnas `origen` y `mail`.

---

## 2026-10-08 — Reservas del local y nueva página de reservas

Rama `feat/reservas-admin`. Spec: `docs/superpowers/specs/2026-10-08-reservas-admin-design.md`.
(Antes, el rediseño general del sitio se hizo y se descartó: PR #5 cerrado sin mergear.)

- Migración `20261008130000_reservas_del_local`: `reservas.origen` (`web`/`local`),
  `usuario_id` opcional (solo en las del local), `mail` opcional (solo en las del
  local), personas 1–6 web y 1–40 local, cancelar desde la web hasta **1 hora**
  antes. `cancelar_reserva()` compara con `is distinct from` (con `<>`, una reserva
  sin cuenta la podía cancelar cualquiera). Test pgTAP 04 (19 asserts); el 01 pasa a 1 hora.
- Mails: las del local solo le avisan al cliente, y solo si tiene mail; sin link a
  "Mis reservas". 4 tests Deno nuevos.
- Panel: **Nueva reserva** (`NuevaReservaLocal`), queda confirmada; la lista marca
  "Cargada en el local" y muestra el mail.
- El admin no tiene "Mis reservas" ni "Reservar": el botón del navbar es **Panel**, y
  `/reservas` y `/mis-reservas` lo llevan al panel (`RequiereSesion soloClientes`).
  `obtenerMisReservas()` filtra por usuario (al admin le traía todas).
- `/reservas` en una columna: salón con fotos, día y hora, tus datos; condiciones en
  un párrafo junto al botón; sin panel lateral. Con más de 6 personas, "Reservar
  por WhatsApp" con el mensaje armado (`mensajeReservaWhatsapp`). Sin sesión:
  salones + "Ingresar con Google".
- Funciones puras nuevas con tests: `validarMail`, `esGrupo`,
  `mensajeReservaWhatsapp`, plazo de 1 hora (`npm test`: 18).
- Después de la revisión del usuario: "Reservar en:" con las fotos arriba y el resto
  en la card de antes; sin la línea "¿Preferís hablar con alguien?"; el aviso de
  grupo dice "Para más de 6 personas deberá realizar la reserva por WhatsApp". El
  nombre ya no pide 2 letras (alcanza con no vacío, sin números ni símbolos) y los
  comentarios bajan de 500 a 100 caracteres, en el formulario y en la base (test 03
  actualizado).
- Segunda ronda: fotos nuevas para elegir salón en `/reservas` (`imagenes.reserva`,
  en prueba: "Cordero vino salon de fondo" y "plano mesa con fondo rustico"; las
  de la home no cambian). Aviso sin los 15 minutos: "…hasta que sea confirmada por
  el restaurante. Podés gestionarla desde la sección "Mis reservas" hasta 1 hora
  antes." Personas pasa a campo numérico con flechitas (tope 40, el validador avisa).
- Nombres completos en todo el sitio, a pedido del usuario: "La Posta Parrilla" y
  "La Posta II Restaurante" (se eliminó `nombreCorto` de `locales.js`). En el
  celular, el selector de la carta pasa a dos columnas para que entren.

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
