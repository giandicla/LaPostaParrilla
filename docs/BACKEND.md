# Backend: Supabase

Reservas, cuentas y panel de admin corren sobre **Supabase** (Postgres + Auth +
Realtime + Edge Functions). No hay servidor propio: el front habla con Supabase
desde el navegador y **la seguridad la pone la RLS de la base**. Las excepciones
son los pagos con Mercado Pago y la carta, que pasan por Route Handlers de Next
(secciones "Pagos con Mercado Pago" y "La carta"). Diseño completo:
`docs/superpowers/specs/2026-10-01-backend-supabase-design.md`.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Esquema, RLS, funciones y triggers | `supabase/migrations/*.sql` (la verdad: no se crean tablas desde el panel) |
| Tests de la base (pgTAP) | `supabase/tests/database/*.test.sql` |
| Datos de desarrollo (usuarios de prueba) | `supabase/seed.sql` — solo local |
| Edge Function de mails | `supabase/functions/notificar-reserva/` |
| Única puerta del front a Supabase | `src/servicios/` (`supabase.js`, `auth.js`, `reservas.js`, `admin.js`; `pagos.js` llama a las rutas de la API) |
| Rutas de pagos (servidor) | `app/api/v1/pagos`, `app/api/v1/reservas/[id]/cancelacion`, `app/api/webhooks/mercadopago`; lógica en `src/servidor/` |
| Rutas de la carta (servidor) | `app/api/v1/carta/…`; lógica en `src/servidor/carta.js` y `carta-base.js` |
| Configuración local | `supabase/config.toml` |

**Regla:** ningún componente importa `@supabase/supabase-js` ni `src/servicios/supabase.js`.
Usan las funciones de los otros archivos de `src/servicios/`.

## Desarrollo local

Requiere Docker Desktop prendido.

```bash
npx supabase start          # levanta Postgres, Auth, Realtime, Studio... (la 1ª vez tarda)
npx supabase db reset       # aplica migraciones + seed desde cero
npm run db:test             # tests de la base (pgTAP)
npx supabase functions serve --env-file supabase/functions/.env   # función de mails
npm run dev
```

- `.env.local` (no se commitea): `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, los de `npx supabase status`.
  Plantilla en `.env.example`.
- `supabase/functions/.env` (no se commitea): variables de la función de mails,
  ver la cabecera de `supabase/functions/notificar-reserva/index.ts`.
- Usuarios de prueba (del seed): `admin@laposta.test` y `cliente@laposta.test`,
  contraseña `laposta123`.
- Studio (panel de la base local): http://127.0.0.1:54323. Mails de Auth
  (confirmación, recuperar contraseña): http://127.0.0.1:54324.
- Los tests de la función de mails corren con Deno:
  `docker run --rm -v "$PWD/supabase/functions/notificar-reserva:/app" -w /app denoland/deno test mensajes.test.ts`

## Producción: estado actual

- Proyecto Supabase **`la-posta`** (ref `dagxitkhqbztgetoultt`, São Paulo), en la
  organización "TP Web La Posta". Migraciones aplicadas; los tests pgTAP pasan contra él.
- Migraciones de la seña (hasta `20261018120000`) aplicadas el 2026-10-18; función `notificar-reserva` redesplegada ese día.
- Función `notificar-reserva` desplegada con sus secretos y los de Vault. Falta
  `BREVO_API_KEY`: hasta cargarla, los mails solo quedan en el log de la función.
- Auth: Site URL `https://lapostaparrilla.vercel.app`. **Google y mail con contraseña**
  (desde la sesión 09): los mails de Auth salen por el SMTP de Brevo, configurado solo
  para producción en `[remotes.produccion]` (host `smtp-relay.brevo.com`, login
  `c1039d001@smtp-brevo.com`, clave `BREVO_SMTP_KEY` en `supabase/.env`). Ese bloque
  también fija valores que producción ya tenía (pooler, storage) para que el push no
  los cambie. **Antes de cada push: `npx supabase config diff`.** Se aplica con `npx supabase config push` (sección `[auth]` de
  `config.toml`; las credenciales salen de `supabase/.env`, que no se sube).
- Google: cliente OAuth creado con la cuenta de la facultad. Ingresar funciona con
  cualquier cuenta de Google (probado con una personal).
- La contraseña de la base está en `supabase/.db-password` (ignorado por git).

**Nota:** en local se puede crear una cuenta con mail y contraseña desde
`/ingresar`: el mail de confirmación cae en Mailpit (http://127.0.0.1:54324). El link
vuelve al sitio solo si su puerto está en `additional_redirect_urls` (3000). Para
probar Google en local hay que agregar `http://127.0.0.1:54321/auth/v1/callback` a las
URIs de redirección del cliente de Google.

## Puesta en producción (una sola vez)

Pasos en orden. Los marcados 👤 los tiene que hacer una persona (cuentas,
pantallas de consentimiento); el resto se puede hacer desde la CLI.

1. 👤 `npx supabase login` (abre el navegador; cuenta GitHub `giandicla`).
2. Crear el proyecto: `npx supabase projects create la-posta --region sa-east-1`
   (São Paulo, el más cercano) y guardar la contraseña de la base que pide.
3. `npx supabase link --project-ref <ref>` y `npx supabase db push` (migraciones).
4. Función de mails: `npx supabase functions deploy notificar-reserva` y sus
   secretos: `npx supabase secrets set NOTIFICACIONES_SECRETO=<algo largo y al azar>
   MAIL_REMITENTE=gianfrancodicla123@gmail.com
   SITIO_URL=https://<dominio de vercel> BREVO_API_KEY=<clave>`.
5. En el SQL Editor del proyecto, los dos secretos de Vault que usa el trigger:
   ```sql
   select vault.create_secret('https://<ref>.supabase.co/functions/v1/notificar-reserva', 'notificaciones_url');
   select vault.create_secret('<el mismo NOTIFICACIONES_SECRETO>', 'notificaciones_secreto');
   ```
6. Auth → URL Configuration: *Site URL* = el dominio de Vercel; *Redirect URLs* =
   `https://<dominio>/**`, `http://localhost:3000/**`, `http://127.0.0.1:3000/**` y las
   previews de Vercel: `https://la-posta-parrilla-*-gdiclaudio-3350s-projects.vercel.app/**`.
7. 👤 **Google**: en Google Cloud Console crear un *OAuth client ID* (Web), con
   *Authorized redirect URI* = `https://<ref>.supabase.co/auth/v1/callback`.
   Pegar Client ID y Secret en Supabase → Auth → Providers → Google.
8. 👤 **Brevo**: crear cuenta gratis, verificar el remitente (Senders), crear una API
   key (SMTP & API → API Keys) y cargarla con
   `npx supabase secrets set BREVO_API_KEY=<clave>` (la carga el usuario; la clave no
   pasa por el chat). **Remitente: `gianfrancodicla123@gmail.com`** (decisión del
   usuario 2026-11-03), para los mails de cuentas (`admin_email` en
   `[remotes.produccion.auth.email.smtp]`) y los de reservas (`MAIL_REMITENTE`). Antes
   era el de la facultad (`gdiclaudio@itba.edu.ar`, 2026-11-01), pero `itba.edu.ar` no
   autoriza a Brevo en su SPF y Hotmail rechazaba los mails (soft bounce). Con el Gmail,
   Brevo reescribe la dirección a una suya (`…@12649373.brevosend.com`, con el nombre
   "La Posta"), que sí está autenticada: el 2026-11-03 el mail de contraseña nueva
   llegó a Hotmail ("Entregado" en Brevo). No se manda
   en nombre de la casilla real del local. Lo ideal sería un dominio propio autenticado
   en Brevo (ver `PENDIENTES.md`). **El local no recibe
   mails** (decisión del usuario 2026-11-03): se entera por el panel, en tiempo real.
9. **Vercel** → Settings → Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del proyecto (Settings → API Keys), para
   *Production* **y *Preview***. Sin *Preview*, las previews de los PR dicen "Todavía
   no disponible". Ojo: **las previews usan esta misma base**, la de producción
   (decisión del usuario, 2026-10-08): lo que se reserve en una preview es real.
10. 👤 Nombrar al primer admin: registrarse en el sitio y, en el SQL Editor,
    `update public.perfiles set rol = 'admin' where id = (select id from auth.users where email = '<mail>');`

## Pagos con Mercado Pago

La seña de la reserva (**$10.000 por reserva**, guardada en `locales.sena`) se paga
con **Checkout Pro**. Diseño completo y correcciones:
`docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md`. Es la
excepción a "no hay servidor propio": hay **Route Handlers de Next** (`app/api/`)
porque el Access Token de Mercado Pago no puede llegar al navegador. La lógica vive
en `src/servidor/` (nadie del front la importa).

Flujo: el cliente reserva (`esperando_pago`) → `POST /api/v1/pagos` crea el `pago`
y la preferencia (monto leído de la base) y devuelve el `init_point` → paga en
Mercado Pago → llega el aviso a `POST /api/webhooks/mercadopago`, que valida la
firma, consulta `GET /v1/payments/:id` y concilia con `acreditar_pago()`
(idempotente) → la reserva queda `confirmada` (sin aceptación del admin). Si no
paga en **15 minutos**, el job de `pg_cron` la pasa a `vencida`.

### Variables de entorno (solo servidor, salvo la última)

Van en `.env.local` (ignorado por git) y en Vercel (*Preview* y *Production*).
Plantilla en `.env.example`. Nunca se escribe el valor en un documento.

| Variable | De dónde sale |
|---|---|
| `MP_ACCESS_TOKEN` | Desde el 2026-11-04: el Access Token **de prueba** (`TEST-…`, modo sandbox) de la aplicación "La Posta Web" del usuario (autorizado por el usuario). Con el `APP_USR-…` del vendedor de prueba que se usaba antes Mercado Pago rechaza los reembolsos (401, `hallazgos.md` 1.18 y 1.35) |
| `MP_WEBHOOK_SECRET` | La clave secreta que da el panel al configurar el webhook (ver abajo) |
| `SUPABASE_SECRET_KEY` | Supabase → Settings → API Keys → *secret key*. Se saltea la RLS: solo servidor, solo para `pagos` |
| `APP_URL` | URL pública del sitio **sin barra final**, solo para **previews y local** (en local `http://localhost:3000`; en la preview, la URL fija de la rama). Se usa para `notification_url` y `back_urls`. **En producción no se usa:** la URL sale de `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel informa solo (`src/servidor/sitio.js`, desde el PR #10) |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Public Key `TEST-…` de la misma aplicación. Es **pública por diseño**: la usa el cartel de Mercado Pago (Brand Brick) en el navegador. Si falta, el cartel no aparece y lo demás sigue igual |

### Cuentas de prueba y modo de prueba

**Desde el 2026-11-04 (reembolsos):** con credenciales `TEST-` la preferencia se abre en
`sandbox_init_point` (`src/servidor/mercadopago.js`) y se paga **en una ventana de
incógnito, sin sesión de Mercado Pago**, con tarjeta de prueba (titular `APRO`) y
cualquier mail que no sea de una cuenta de prueba. Pagar con la sesión de una cuenta de
prueba da "Una de las partes con la que intentás hacer el pago es de prueba". La
búsqueda de pagos (`/v1/payments/search`) no devuelve nada en sandbox: un pago se
consulta por su número de operación. Lo que sigue es cómo era antes.


No hay entorno Sandbox: se prueba **sobre la API real, con cuentas de prueba** y
una sola `init_point` (ver `docs/proceso/hallazgos.md` 1.16). La aplicación real
quedó solo con credenciales `TEST-` porque falló la creación automática del
vendedor (1.17), así que la app se creó a mano desde el vendedor de prueba.

- Usuarios de prueba (solo ids, las claves las tiene el usuario): **vendedor
  `3765216571`**, **comprador `3765205613`**.
- Tarjeta de prueba: la del país (se pueden consultar con el skill
  `mp-test-cards`). El resultado lo decide el **titular**: `APRO` aprueba, `OTHE`
  rechaza (error general), para probar el reintento.
- Para pagar hay que usar una ventana de incógnito con la sesión del comprador de
  prueba, no la cuenta real.

### Webhook

Desde el 2026-11-04 está en la aplicación **"La Posta Web"** del usuario, en **modo
prueba** (se configuró con el plugin de Mercado Pago, `save_webhook`): URL
`https://lapostaparrilla.vercel.app/api/webhooks/mercadopago`, evento **"Pagos"**. Las
previews reciben los avisos en su propia URL porque cada pago manda
`notification_url` (sale de `APP_URL`), pero necesitan la Vercel Authentication apagada
(ver abajo).

`MP_WEBHOOK_SECRET` es la clave secreta de esa aplicación (una sola por aplicación). El
panel la muestra con puntos porque el pedido del modo prueba
(`…/webhooks/signature?environment=test`) le responde 502; se obtiene abriendo, con la
sesión del usuario, `https://www.mercadopago.com.ar/developers/panel/applications/api/webhooks/signature?applicationId=462476463404106&environment=production`
(`hallazgos.md` 1.36). Antes del 2026-11-04 el webhook estaba en la aplicación del
vendedor de prueba, con otra clave. La ruta responde 200 si procesó (o no era un pago), 401 si la
firma no vale y 500 si falla la consulta a Mercado Pago o a la base, para que
Mercado Pago reintente.

**Las previews necesitan la Vercel Authentication apagada.** Con la protección de
despliegue prendida, Mercado Pago recibe un 302 al login de Vercel y el aviso
nunca llega. Se desactivó para previews (2026-10-18) solo mientras se probaba:
hay que volver a prenderla (`docs/PENDIENTES.md`).

### Base: lo que agrega la seña

Migraciones (aplicadas a producción el **2026-10-18**):

| Migración | Qué hace |
|---|---|
| `20261015110000_estados_sena` | Estados `esperando_pago` y `vencida` (archivo propio: Postgres no deja usar un valor de enum en la misma transacción en que se agrega) |
| `20261015120000_sena_reservas` | `locales.sena`, tabla `pagos` con RLS, `acreditar_pago()`, `cancelar_reserva(id, motivo)`, trigger de reintegro pendiente, `vencer_reservas_sin_pagar()` y el job de `pg_cron` |
| `20261015130000_bloqueo_por_turno` | `dias_bloqueados.turno` (mediodía / noche / todo el día) y su chequeo en `validar_reserva()` |
| `20261018120000_sena_ajustes` | `creada_en` fijada por la base al insertar; `acreditar_pago()` devuelve `'duplicado'` ante un segundo cobro de la misma preferencia |
| `20261104120000_reembolso_de_sena` | El trigger `marcar_reintegro` vuelve a actuar en cualquier cancelación; se borra `marcar_sena_devuelta` (el reembolso lo confirma el webhook) |
| `20261101120000_sena_no_reembolsable` | El trigger `marcar_reintegro` solo actúa si cancela el admin; `marcar_sena_devuelta(id)` (solo admin) pasa una seña de `reintegro_pendiente` a `reintegrado` |
| `20261102120000_reservas_por_turno_y_modificar` | Una reserva activa por usuario, local, día y **turno** (índice `reservas_una_activa_por_turno`); columna `modificada_por` (trigger `registrar_modificacion`); `modificar_reserva(id, fecha, hora, personas)` para el cliente, hasta 1 hora antes |

- **`pg_cron`:** el job `vencer-reservas-sin-pagar` corre cada minuto. La extensión
  se activa en el proyecto remoto con la migración.
- **Edge Function `notificar-reserva`:** redesplegada el **2026-10-18** con las
  plantillas nuevas (no se manda mail en `esperando_pago` ni `vencida`; el de
  cancelación del local lleva el motivo y avisa que se devuelve la seña).
- Nadie escribe `pagos` desde el navegador: solo el servidor, con la clave secreta.

### Una sola ventana de despliegue

**Las previews comparten la base de producción.** Aplicar las migraciones antes de
que el front nuevo esté publicado rompe el sitio: el front viejo seguiría creando
reservas en `esperando_pago` por defecto, el cron las vencería a los 15 minutos y la
cancelación del admin viejo chocaría con el motivo obligatorio. Orden que se usó el
2026-10-18, todo seguido: desplegar la función → `supabase db push` → variables en
Vercel → prueba de punta a punta en la preview → merge. Para próximos cambios que
toquen la base y el front a la vez, lo mismo.

### Reembolso de la seña (desde 2026-11-04)

Del 2026-11-01 al 2026-11-04 la seña no se reembolsaba: con las credenciales del
vendedor de prueba Mercado Pago responde 401 "Unauthorized use of live credentials" a
`POST /v1/payments/:id/refunds`, con o sin saldo (`hallazgos.md` 1.18 y 1.35). Con las
credenciales de prueba `TEST-` de la aplicación del usuario el reembolso funciona
(probado con Checkout Pro el 2026-11-04), así que volvió (decisión del usuario). Regla:

- **Toda cancelación con la seña cobrada la devuelve:** la del cliente (hasta 1 hora
  antes, regla de la base) y la del local. El trigger `marcar_reintegro` deja el pago
  en `reintegro_pendiente` y `cancelaciones.js` pide el reembolso total con
  `PaymentRefund` (`reintegros.js`), con clave de idempotencia `reintegro-<id del pago
  de Mercado Pago>`: reintentar no devuelve dos veces.
- **El reembolso se confirma por webhook**, no al pedirlo: Mercado Pago avisa el pago
  con `status: 'refunded'` y `avisos.js` lo pasa a `reintegrado`
  (`confirmarReintegro`, comparando también el id de Mercado Pago).
- **Pago tardío** (`acreditar_pago()` sobre una reserva que ya no espera pago): el
  webhook pide el reembolso en el momento; si Mercado Pago falla, responde 500 y el
  aviso se reintenta. **Cobro doble** de la misma preferencia: se reembolsa por su
  propio id.
- Si el pedido falla, la cancelación queda hecha y el panel lista la seña en
  "Devoluciones de seña en curso" con **Reintentar** (vuelve a llamar a
  `POST /api/v1/reservas/:id/cancelacion`, que sobre una reserva cancelada solo pide el
  reembolso). Ahí también se ven las pedidas que todavía no confirmó el webhook.

`POST /api/v1/reservas/:id/cancelacion` responde `{ reintegro: 'pedido' | 'fallo' |
'no_corresponde' }`. La migración `20261104120000_reembolso_de_sena` vuelve a activar el
trigger para cualquier cancelación y borra `marcar_sena_devuelta`.

## La carta

Desde la sesión 06 la carta vive en la base. Diseño:
`docs/superpowers/specs/2026-10-29-carta-editable-design.md`.

- **Tablas:** `carta_secciones` (fijas; `local_id` nulo = compartida por los dos
  locales: vinos y "Copas y descorche"; `slug` es el ancla pública y se repite entre
  locales) y `carta_items` (platos, bebidas y vinos; los vinos llevan `bodega` y
  `region`). Más `locales.cubierto`.
- **Reglas** (trigger `validar_item_carta`, mensajes en castellano): un precio o un
  precio por tamaño, nunca los dos; `precios` solo en secciones con `tamanos`, uno
  por tamaño; los vinos llevan bodega y los platos no; un ítem sin orden va al final.
- **Orden** (migración `20261029130000_carta_v2.sql`, editor v2): `ubicar_item_carta`
  (una posición dentro de su categoría; en vinos, de su bodega) y `ubicar_bodega_carta`,
  con la sección bloqueada mientras se renumera. Cambiar `seccion_id` o `bodega` deja el
  ítem al final del destino y renumera las dos secciones. Las `mover_*` de la primera
  versión quedan (las usó producción hasta el merge). `cambiar_region_bodega`;
  `cambiar_cubierto` es `security definer` porque `locales` no tiene política de
  update. Todas exigen admin.
- **RLS:** lectura pública; escritura solo con `es_admin()`. Ojo: un `update` de
  alguien que no es admin no falla, no toca filas. Por eso la API pregunta
  `es_admin` antes y responde 403.
- **API:** `GET /api/v1/carta?local=<id>` (la carta del local, sin vinos) y
  `GET /api/v1/carta/vinos` (públicas, `Cache-Control` de 1 minuto en Vercel;
  `fresca=1` sin caché, para el panel) y las escrituras del admin en `items`,
  `secciones/[id]/bodegas` y `locales/[id]`. Ver `docs/ESTRUCTURA.md`.
- **Carga inicial:** `supabase/migrations/20261029120100_carta_datos.sql`, generada
  una vez por `scripts/carta-a-sql.mjs` desde los JSON que había antes (278 ítems).
- **Tests:** `supabase/tests/database/08_carta.test.sql` (32 asserts).
- **Despliegue: primero la base, después el merge.** La migración solo agrega
  (tablas, una columna, funciones): el front viejo de producción sigue leyendo sus
  JSON y no se entera. Lo que rompe es el orden inverso: mergear sin las tablas deja
  `/carta` de producción en "No pudimos cargar la carta". Orden:
  1. Arreglos de SQL **antes** del `db push`: una vez aplicada, la migración no se
     vuelve a correr; un cambio posterior va en una migración nueva.
  2. `supabase db push`.
  3. Probar en la preview del PR (recién ahí tiene tablas). **Lo que se cambie en la
     carta desde la preview es la carta real** (las previews usan la base de
     producción): borrar los ítems de prueba y volver los precios antes del merge.
  4. Merge.

## Mails

Hay dos tipos de mails, y salen por caminos distintos de Brevo:

- **De cuentas** (confirmar la cuenta, contraseña nueva): los manda Supabase Auth por
  SMTP. Plantillas en `supabase/templates/` (`confirmacion.html`, `recuperacion.html`),
  con el mismo marco que los de reservas. En local caen en Mailpit
  (http://127.0.0.1:54324).
- **De reservas**: los manda la función `notificar-reserva` con la API de Brevo
  (`BREVO_API_KEY`). **Van solo al cliente** (desde el 2026-11-03): el local ve las
  reservas nuevas, cancelaciones y cambios en el panel, en tiempo real. El secreto
  `MAIL_ADMIN` ya no se usa.
