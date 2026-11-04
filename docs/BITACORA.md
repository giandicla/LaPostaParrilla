# Bitácora

Log de cambios. **Lo más nuevo arriba.**

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
