# Prueba de usuario en producción

Recorrido del sitio como lo haría un usuario, contra
https://lapostaparrilla.vercel.app. Lo hizo la IA (Claude) con el navegador
integrado, a pedido del usuario, el 2026-11-10 (dos días antes de la presentación).

**Qué pasó con lo que apareció** (al cierre del 2026-11-10; el detalle de cada punto
sigue abajo, tal como se anotó durante la prueba):

| Hallazgo | Estado |
|---|---|
| Google no dejaba elegir la cuenta | Arreglado, PR #40 |
| Concepto de la seña en Mercado Pago: "2011" por "20/11" | Arreglado, PR #41 |
| Hora del vencimiento: "12:57 a. m.." | Arreglado, PR #41 |
| Cancelar y eliminar preguntaban con los cuadros del navegador | Arreglado, PR #42 (componente `Dialogo`) |
| El panel abría en "Todos" los estados | Cambiado a "Confirmada" a pedido del usuario, PR #43 |
| El aviso "Ya tenés una reserva en ese turno…" quedaba al cambiar la fecha | Arreglado, PR #44 |
| La lista de días bloqueados no mostraba el año | Arreglado, PR #44 |
| Título al volver de Mercado Pago sin pagar | Queda como está: el usuario lo vio y dice "Falta pagar la seña" |
| Resto de las observaciones | Sin tocar; en `docs/PENDIENTES.md` |

Leyenda: ✅ anda como se espera · ⚠️ anda, con una observación · ❌ falla · ⏳ sin probar todavía

## Estado previo

- `npm test`: 156 tests de funciones + 123 de rutas y componentes, todos en verde.
- Según `docs/RUBRICA.md`, lo único abierto en Funcionalidad son las gift cards
  (en evaluación, decisión del usuario). No se encontró otra función a medio hacer:
  los únicos `PENDIENTE` del código son los textos de la familia (`src/data/textos.js`).

## Límites de esta prueba

- La IA no crea cuentas ni escribe contraseñas en el sitio real, y no pasa el captcha.
  Lo que pide sesión se prueba con el usuario ingresando en el navegador.
- La IA tampoco carga datos de tarjeta en Mercado Pago: el pago lo hace el usuario.
- Las capturas en tamaño celular fallaron en el navegador integrado; en ese tamaño
  se midió (ancho, desbordes, foco) pero no se miró la pantalla.

## 1. Sin sesión (visitante)

| # | Qué se hizo | Resultado |
|---|---|---|
| 1.1 | Abrir el inicio | ✅ Carga sin errores de consola, sin imágenes rotas, sin links vacíos. Un solo `h1`. |
| 1.2 | Pedir todos los links internos del inicio | ✅ Todos responden 200. |
| 1.3 | Links externos | ✅ WhatsApp de cada local con el mensaje armado, `tel:`, Instagram. Dos mapas con título. |
| 1.4 | Una dirección que no existe | ✅ 404 propio: "No encontramos esa página", con vuelta al inicio y a la carta. |
| 1.5 | "Ver la carta" de la tarjeta del restaurante | ✅ Abre `/carta?local=restaurante` con ese salón marcado; 14 secciones, cubierto al pie. |
| 1.6 | Cambiar a Vinos después de bajar | ✅ La URL pasa a `?local=vinos` sin recargar y la página vuelve arriba. 11 secciones, bodegas con región, "Copas y descorche" al final. |
| 1.7 | Link con ancla (`#restaurante-pizzas-clasicas`, `#parrilla-postres`) | ✅ Baja a la sección. Pizzas con dos precios (Chica / Grande). |
| 1.8 | Link viejo a los vinos de un local (`?local=parrilla#parrilla-vinos-malbec`) | ✅ Termina en `?local=vinos#vinos-vinos-malbec`. |
| 1.9 | `/carta?local=asado123` | ✅ No se rompe; muestra la carta de la parrilla. |
| 1.10 | Nosotros | ✅ 9 fotos, todas con `alt`, contacto igual al del inicio, Instagram y mail. |
| 1.11 | "Reservar acá" sin sesión | ✅ Muestra los dos salones y pide ingresar; el link a Ingresar guarda la vuelta (`volver=/reservas?local=restaurante`). |
| 1.12 | Ingresar: enviar vacío | ✅ "Escribí tu mail." / "Escribí tu contraseña.", foco en el primer campo, `aria-invalid`. |
| 1.13 | Crear cuenta: enviar vacío | ✅ Tres mensajes, uno por campo. Aclara "Al menos 8 caracteres". |
| 1.14 | "Olvidé mi contraseña" | ✅ Pide el mail y ofrece volver. (No se envió.) |
| 1.15 | Captcha | ✅ Presente en el formulario; en celular entra en el ancho (295 px). |
| 1.16 | `/mis-reservas`, `/admin`, `/admin/carta`, `/reservas/pago` sin sesión | ✅ "Ingresá para continuar". |
| 1.17 | `/ingresar/contrasena` sin link | ✅ "El link venció", con vuelta a Ingresar. |

### En tamaño celular (375 px)

| # | Qué se midió | Resultado |
|---|---|---|
| 1.18 | Scroll horizontal en inicio, carta (restaurante y vinos), nosotros, reservas, ingresar | ✅ Ninguno. |
| 1.19 | Menú hamburguesa | ✅ Abre, el foco pasa a "Inicio", Escape lo cierra y devuelve el foco al botón. |
| 1.20 | Botones de Ingresar | ✅ Ninguno de menos de 40 px de alto. |

### Seguridad, desde afuera

| # | Qué se hizo | Resultado |
|---|---|---|
| 1.21 | `POST` al webhook de Mercado Pago sin firma | ✅ 401 "Firma inválida". |
| 1.22 | Crear pago, cancelar reserva, crear ítem y cambiar el cubierto sin sesión | ✅ 401 los cuatro. |
| 1.23 | Meter el sitio en un `iframe` | ✅ Bloqueado (`frame-ancestors 'none'`). |
| 1.24 | `/api/v1/carta` sin local / con local inexistente | ✅ 400 y 404, con mensaje. |

### Observaciones (ninguna rompe nada)

- ⚠️ **Todas las páginas tienen el mismo título de pestaña** ("La Posta · Parrilla &
  Restaurante · Villa La Angostura"): carta, reservas, nosotros, ingresar. Solo el 404
  tiene el suyo. Con varias pestañas abiertas no se distinguen, y a un lector de
  pantalla no le anuncia el cambio de página.
- ⚠️ **No hay `robots.txt`, `sitemap.xml` ni imagen para compartir** (`og:image`): al
  pegar el link en WhatsApp sale sin foto. Para un restaurante es lo que más se nota.
- ⚠️ Sin sesión, `/admin` muestra "Ingresá para continuar" sin la portada que sí
  tienen `/mis-reservas` y `/reservas/pago`. Es estético.
- ⚠️ `PATCH` y `DELETE` de un ítem de la carta con un id inválido responden 400 antes
  de mirar la sesión (con un id válido, sin sesión, hay que confirmarlo en la parte 3).

## 2. Cliente con sesión

El usuario ingresó con su cuenta de cliente; la IA siguió desde esa sesión.

| # | Qué se hizo | Resultado |
|---|---|---|
| 2.1 | Navbar con sesión | ✅ "Mis reservas", "Salir", "Reservar". |
| 2.2 | `/reservas?local=restaurante` | ✅ Salón preseleccionado, nombre y teléfono precargados, fecha con mínimo hoy, botón con el monto ($ 10.000) y cartel de Mercado Pago. |
| 2.3 | Enviar sin fecha ni hora | ✅ "Revisá los 2 campos marcados…", un mensaje por campo, foco en la fecha. No se crea nada. |
| 2.4 | 7 personas | ✅ El botón pasa a "Reservar por WhatsApp" con el mensaje armado (salón, fecha, hora, nombre, personas; lo vacío no aparece). |
| 2.5 | Nombre con números, 0 personas, comentario de 114 caracteres | ✅ Tres errores, uno por campo. (El campo tiene `maxlength=100`: a mano no se llega a 114.) |
| 2.6 | Fecha de ayer | ✅ "Elegí una fecha desde hoy en adelante." |
| 2.7 | Reserva real: restaurante, 20/11 12:30, 2 personas | ✅ Se crea y abre Mercado Pago (sandbox) con $ 10.000. Sin efectivo entre los medios. |
| 2.8 | Volver de Mercado Pago sin pagar | ⚠️ Vuelve a `/reservas/pago` con los datos de la reserva y "Reintentar pago". Ver observaciones. |
| 2.9 | Mis reservas con la reserva sin pagar | ✅ "Esperando pago", "Pagar seña", "Cancelar reserva" y hasta qué hora se guarda el lugar. No ofrece "Modificar". |
| 2.10 | Segunda reserva en el mismo turno, día y local | ✅ "Ya tenés una reserva en ese turno, ese día y en ese local." No se crea. |
| 2.11 | "Modificar" en una reserva confirmada | ✅ Abre fecha, hora y personas (máximo 6) y avisa que la seña sigue valiendo. Con 7 personas: "Las reservas son de 1 a 6 personas." "No cambiar" cierra sin tocar nada. No se guardó ningún cambio. |
| 2.12 | Cancelar la reserva sin pagar | ✅ Pregunta "¿Seguro que querés cancelar esta reserva?", avisa "Listo, cancelamos tu reserva." y la pasa a "Anteriores y canceladas". |
| 2.13 | "Ver más" en anteriores | ✅ Trae las que faltaban (de 6 a 8) y el botón desaparece. |
| 2.14 | `/admin` y `/admin/carta` como cliente | ✅ "Tu cuenta no tiene permisos de administración." En `/carta` no aparece "Editar esta carta". |

### Hallazgos

- ❌ **La fecha en Mercado Pago se lee como un año.** El concepto del pago sale
  "Seña reserva La Posta II Restaurante · **2011** 12:30": Mercado Pago se come la
  barra de "20/11". Sale de `cuando()` en `src/servidor/preferencia.js:28`. Con
  "20-11" o "20 nov" se arregla; el test de `preferencia.test.js` espera la barra.
- ❌ **La hora límite del pago sale en formato de 12 horas y con dos puntos finales**:
  "guardamos tu lugar hasta las 12:57 a. m.." (era 00:57). Pasa en
  `app/mis-reservas/page.jsx:58` y en `app/reservas/pago/page.jsx:128`. El resto del
  sitio usa 24 horas. De noche es confuso: "12:57 a. m." se puede leer como mediodía.
- ⚠️ **Al volver de Mercado Pago sin pagar, el título dice "Estamos confirmando tu
  pago…"**. Mercado Pago vuelve con `status=null`: se podría mostrar "Todavía no
  pagaste la seña" y dejar el "confirmando" para cuando hay un pago en curso.
- ⚠️ **El aviso "Ya tenés una reserva en ese turno…" queda en pantalla** después de
  cambiar la fecha; se va recién al enviar de nuevo.
- ⚠️ **En "Anteriores y canceladas" hay reservas canceladas que dicen "Seña pagada"**
  (27/11 y 21/11 13:00). Son de los días en que la seña no se reembolsaba (del 01 al
  04/11), así que el dato es correcto, pero un cliente lee "cancelada" y "pagada" y no
  sabe si le devuelven la plata. Se van con la limpieza de datos de prueba.
- ⚠️ Después de ingresar, la dirección queda `/mis-reservas#` (sobra el `#`).
- ⚠️ Con 0 personas el mensaje dice "de 1 a 40 personas". Es a propósito (de 7 a 40 se
  reserva por WhatsApp), pero el cliente que reserva por la web tiene un máximo de 6.

### Sin probar en esta parte

- ⏳ **Pagar la seña** (aprobado y rechazado), **modificar de verdad** y **cancelar con
  devolución**: la IA no carga datos de tarjeta; lo tiene que pagar el usuario.
- ⏳ El vencimiento a los 15 minutos (lo cubren los tests de la base).
- No se intentó escribir en la carta con la sesión de cliente contra producción (los
  tests de rutas cubren el 403).

### Datos de prueba que quedaron en producción

- Reserva `cc8d13cc…`, La Posta II Restaurante, 20/11 12:30, a nombre de "Prueba
  Claude", **cancelada, sin pago**. Para borrar en la limpieza previa a la presentación.

## 2 bis. Qué se puede sacar con las herramientas de desarrollador

Pedido del usuario: ver si desde la pestaña Network (o la consola) alguien puede
llegar a datos sensibles o robar información. Se probó como lo haría un atacante,
solo con lecturas: sin sesión y con la sesión de cliente.

| # | Qué se intentó | Resultado |
|---|---|---|
| S.1 | Buscar claves en los 19 archivos de JavaScript del sitio (1 MB): clave secreta de Supabase, `service_role`, Access Token de Mercado Pago, claves de Brevo, secreto del captcha, secreto del webhook | ✅ Ninguna. Ni siquiera aparecen los nombres de esas variables. |
| S.2 | Mapas de código fuente (`.js.map`) | ✅ No se sirven (403). |
| S.3 | Leer la base **sin sesión**, directo a la API de Supabase con la clave pública: `perfiles`, `reservas`, `pagos`, `notas_reserva` | ✅ 0 filas en las cuatro. |
| S.4 | Lo mismo **con sesión de cliente** | ✅ 1 perfil (el propio), 8 reservas (todas propias), 8 pagos (de esas reservas), 0 notas internas. Ninguna fila de otra persona. |
| S.5 | Listar los usuarios (`/auth/v1/admin/users`) con el token de cliente | ✅ 403. |
| S.6 | Pedir el esquema de la base (`/rest/v1/`) con la clave pública | ✅ 401. |
| S.7 | Hacerse admin: el cliente ve su propio `rol`, ¿lo puede cambiar? | ✅ No. La base solo le deja cambiar `nombre` y `telefono` (permiso por columna, migración `20261001120000`). Revisado en el código, no se intentó contra producción. |
| S.8 | Marcar un pago como aprobado o crear una reserva ya confirmada | ✅ No. `pagos` no admite escrituras desde el navegador; `acreditar_pago` solo la puede llamar el servidor; una reserva de la web solo se puede crear en `esperando_pago`. Revisado en el código. |
| S.9 | Cookies | ✅ El sitio no usa ninguna. |

### Lo que sí se ve, y por qué no es un problema

- **La clave pública de Supabase, la Public Key de Mercado Pago y la clave de sitio del
  captcha.** Las tres son públicas por diseño: sin ellas el navegador no puede hablar
  con esos servicios. No dan acceso a nada por sí solas; lo que protege los datos son
  las reglas de la base (RLS), que es lo que se probó en S.3 y S.4.
- **La carta, los locales, las franjas y los días bloqueados**, sin sesión. Es lo mismo
  que el sitio muestra.
- **El código del panel de admin.** Viaja a cualquier navegador, pero sin datos: un
  cliente que lo abre ve "no tiene permisos" y la base no le devuelve nada.
- **El token de la sesión propia**, en el almacenamiento del navegador. Cada persona ve
  el suyo; así funciona Supabase en un sitio sin servidor propio de sesiones.

### Observaciones

- ⚠️ **El motivo de un día bloqueado es público.** Cualquiera lo puede leer sin sesión
  (y el formulario de reservas se lo muestra al cliente). Es a propósito, pero conviene
  no escribir ahí nada interno.
- ⚠️ **El token de Google queda guardado junto con la sesión** (`provider_token`). Solo
  sirve para leer nombre y mail de la propia cuenta y vence en una hora, y el sitio no
  lo usa. Se puede descartar al ingresar; es un endurecimiento, no un hallazgo.
- ⚠️ **No hay una política de contenido (CSP) completa**, solo `frame-ancestors`. Ya
  estaba anotado en `PENDIENTES.md`. Es lo que limitaría el daño si algún día se colara
  un script ajeno (que es la única forma de robarle el token a otra persona).

## 2 ter. Ingresar con Google no deja elegir la cuenta

Reportado por el usuario durante la prueba: al tocar "Continuar con Google" entra
directo con la cuenta que ya está abierta, sin preguntar.

- ❌ **Causa:** `src/servicios/auth.js:14` llama a `signInWithOAuth` sin
  `queryParams: { prompt: 'select_account' }`. Con una sola cuenta de Google abierta en
  el navegador, Google no muestra el selector.
- **A quién le pega:** a quien comparte la computadora (la del local, por ejemplo): el
  que sale y vuelve a entrar cae siempre en la misma cuenta.
- ✅ **Arreglado el mismo día** (PR #40, en producción): `ingresarConGoogle` manda
  `prompt=select_account`. El usuario salió, eligió la cuenta de admin en el selector y
  entró.

## 3. Panel del local (admin)

El usuario ingresó con la cuenta de admin; la IA siguió desde esa sesión. Todo lo que
se creó se revirtió (ver "Datos de prueba" al final).

| # | Qué se hizo | Resultado |
|---|---|---|
| 3.1 | Abrir `/admin` | ✅ Pestañas Reservas, Días bloqueados y Carta; lista de hoy vacía con su mensaje |
| 3.2 | Nueva reserva, enviar vacía | ✅ Marca fecha, hora, nombre y teléfono |
| 3.3 | Nueva reserva con 45 personas y teléfono "123" | ✅ "Las reservas son de 1 a 40 personas." y "Ese teléfono no parece válido. Ejemplo: …" |
| 3.4 | Nueva reserva válida (parrilla, 25/11 12:30, 8 personas, sin mail) | ✅ "Reserva de Prueba Claude guardada y confirmada." Queda confirmada, "Cargada en el local", sin seña |
| 3.5 | Filtro por fecha y por local | ✅ Aparece el 25/11 con "Los dos" y con la parrilla; no aparece filtrando por el restaurante |
| 3.6 | Nota interna | ✅ Aparece "Guardar nota" al escribir; se guarda |
| 3.7 | Editar (hora 20:30, 10 personas) | ✅ La fila se actualiza |
| 3.8 | Imprimir lista del día (`/admin/dia?fecha=2026-11-25`) | ✅ Tabla por local con hora, nombre, personas, teléfono, comentario y nota; total de personas confirmadas |
| 3.9 | Cancelar la reserva | ✅ Pide el motivo (propone "No hay lugar"); queda "Cancelada · canceló el admin · «motivo»" y pierde Editar y Cancelar |
| 3.10 | "Todas las fechas" | ✅ Lista las reservas que vienen, con su estado y el de la seña |
| 3.11 | Días bloqueados, enviar sin fecha | ✅ "Elegí una fecha." |
| 3.12 | Bloquear la noche del 10/03/2027 en la parrilla | ✅ Aparece en la lista con local, turno y motivo |
| 3.13 | Desbloquear | ✅ Vuelve a "No hay días bloqueados." |
| 3.14 | Carta: agregar vacío y con precio "abc" | ✅ "Escribí el nombre.", "Escribí el precio.", "El precio va en pesos enteros, sin centavos." |
| 3.15 | Carta: agregar "ZZ Prueba (borrar)" a Cafetería | ✅ "Agregado al final de Cafetería."; `POST` 201; sale en la API pública |
| 3.16 | Carta: editar el precio | ✅ "Guardado: ZZ Prueba (borrar)."; `PATCH` 200 |
| 3.17 | Carta: eliminar | ✅ Pregunta "¿Eliminar «ZZ Prueba (borrar)» de la carta?"; `DELETE` 204; desaparece del panel |
| 3.18 | Carta pública después de eliminar | ✅ Lo sacó, con demora: la primera respuesta todavía lo traía (caché `STALE`), la siguiente ya no |
| 3.19 | Vista Vinos | ✅ Carga los tipos de vino y el formulario propio (tipo, bodega, región) |
| 3.20 | Ancho de celular (420 px) | ✅ Sin scroll horizontal en reservas ni en carta |

### Hallazgos

- ⚠️ **Después de guardar una reserva nueva, la lista sigue en el día de hoy.** La
  reserva recién cargada no se ve hasta cambiar la fecha a mano.
- ⚠️ **Avisos que quedan viejos.** Al editar o cancelar una reserva sigue arriba
  "Reserva de … guardada y confirmada."; al eliminar un producto sigue "Guardado: …".
  Ni editar, ni cancelar, ni eliminar, ni guardar la nota muestran un aviso propio.
- ⚠️ **Cancelar pide el motivo con el cuadro del navegador** (`window.prompt`, en
  `app/admin/page.jsx:60`) y eliminar un producto con `window.confirm`. Funciona, pero
  no tiene el estilo del sitio. Queda para el pase estético.
- ⚠️ **Desbloquear no pregunta.** Un toque y se va; es fácil de rehacer.
- ⚠️ **La lista de días bloqueados no muestra el año** ("miércoles, 10 de marzo").
- ⚠️ **Un cambio en la carta tarda hasta un minuto en verse en la carta pública**, por
  el caché. Es por diseño; conviene saberlo para la demo.
- ⚠️ **El pie muestra la misma dirección para los dos locales** (Av. Arrayanes 263).
  A confirmar si es un dato pendiente.

### Sin probar

- Cancelar desde el panel una reserva con seña pagada (reembolso): necesita un pago.
- El aviso en tiempo real cuando entra una reserva nueva con el panel abierto.
- Reordenar la carta arrastrando.
- Guardar el cubierto y agregar un vino o una bodega (no se tocaron datos reales).

### Datos de prueba que quedaron en producción

- Reserva del local, La Posta Parrilla, 25/11 20:30, a nombre de "Prueba Claude",
  **cancelada**, con la nota interna "Nota de prueba". Para borrar en la limpieza.
- El bloqueo del 10/03/2027 y el producto "ZZ Prueba (borrar)" ya se eliminaron.
