# Seña de la reserva con Mercado Pago

Fecha: 2026-10-15 (sesión 05). Diseño acordado en el chat, por partes, con el
usuario aprobando cada una. Ajustes al escribir el plan (misma fecha, antes de
implementar): ver "Correcciones del plan" al final. Es el primero de los tres cobros decididos en la
sesión 03 (seña, gift cards, pedido para llevar); los otros dos llevan su propio
spec. Cubre el entregable E6 de la rúbrica: checkout + webhook que actualiza la
base, con pruebas.

Base teórica: clase 10 (Route Handlers, REST versionado, validación con esquemas,
códigos de error) y clase 11 (Checkout Pro, preferencia, `back_urls`,
`external_reference`, webhook con firma, conciliación en Supabase).

## Decisiones

Del usuario:

- **Solo cuentas de prueba y plata ficticia.** Nada de credenciales de producción.
- **La seña es obligatoria** y se paga en el momento de reservar desde la web.
- **Monto fijo por reserva** (no por persona).
- **Sin aceptación del admin:** una reserva pagada queda confirmada. El admin
  puede cancelarla indicando el motivo ("No hay lugar" o texto libre).
- **Si se cancela, se reintegra el total** cuando la cancelación es válida: el
  cliente con 1 hora o más de anticipación (regla actual) o el admin. Si el
  cliente no viene, no hay reintegro.
- **Bloqueo por turno** para cuando el local se llena: frena reservas nuevas de
  ese turno, no toca las ya hechas.
- Enfoque A: Route Handlers de Next (lo que dio la cátedra).

De la IA (aprobadas por el usuario en el diseño):

- Checkout Pro y no Checkout API: la clase 11 lo recomienda para un MVP y los
  datos de tarjeta nunca pasan por el sitio.
- Monto de **$10.000**, guardado en la base (`locales.sena`).
- **Vencimiento técnico de 15 minutos** para la reserva sin pagar, con la
  preferencia de Mercado Pago vencida en el mismo momento.
- Turno según la hora de la franja: antes de las 17:00 es mediodía; desde las
  17:00, noche.
- Validación con Zod en las rutas (clase 10) y SDK oficial `mercadopago`.

## Parte 1 — Base (una migración nueva)

### Estados de la reserva

```
esperando_pago ──(webhook: pago aprobado)──► confirmada
      │                                          │
      │ 15 min sin pagar (pg_cron)               │ cancela el cliente (≥ 1 h antes)
      ▼                                          │ o el admin, con motivo
   vencida                                       ▼
                                             cancelada ──► reintegro automático
```

- `estado_reserva` suma `esperando_pago` y `vencida`. `pendiente` y `rechazada`
  quedan en el enum por las reservas existentes; el flujo nuevo no los usa.
- El cliente crea la reserva en `esperando_pago` (cambia la política de insert,
  que hoy exige `pendiente`). Las reservas del local (`origen = 'local'`) no
  cambian: entran `confirmada` y sin seña.
- `esperando_pago` cuenta como activa: entra en el índice de una reserva activa
  por usuario, local y día (`estado in ('esperando_pago', 'pendiente', 'confirmada')`).
- `cancelar_reserva(p_id, p_motivo)` (suma el motivo) es la única forma de
  cancelar, para el cliente y para el admin. Acepta también `esperando_pago` (el
  cliente abandona antes de pagar: se cancela sin reintegro, porque no hay pago
  aprobado).
- `reservas.motivo_cancelacion text`: obligatorio cuando cancela el admin
  (trigger), opcional cuando cancela el cliente. Máximo 200 caracteres.
- Aviso por mail (`notificar_reserva`): no se manda nada en `esperando_pago` ni
  en `vencida`. El primer mail al cliente es el de `confirmada`. El de
  `cancelada` incluye el motivo y avisa que la seña se reintegra (el reembolso
  se hace después del cambio de estado). Cambian las plantillas de la Edge
  Function `notificar-reserva` y sus tests Deno.

### Seña y pagos

- `locales.sena numeric(12,2) not null default 10000`, con `check (sena > 0)`.
  Lectura pública (ya la tiene la tabla `locales`).
- Tabla `pagos`:
  - `id uuid` (es el `external_reference` de la preferencia)
  - `reserva_id uuid not null references reservas`
  - `monto numeric(12,2) not null` (copia de `locales.sena` al crear el pago)
  - `estado text not null`: `iniciado`, `aprobado`, `rechazado`,
    `reintegro_pendiente`, `reintegrado`
  - `mp_preference_id text`, `mp_payment_id text unique`
  - `creado_en`, `actualizado_en`
  - Como mucho un pago `aprobado`, `reintegro_pendiente` o `reintegrado` por
    reserva (índice único parcial).
- RLS de `pagos`: el cliente ve los pagos de sus reservas; el admin, todos.
  **Nadie inserta ni actualiza desde el navegador**: solo el servidor, con la
  clave secreta de Supabase (que se saltea la RLS).

### Reglas

- **Vencimiento** (`vencer_reservas_sin_pagar()`, programada con `pg_cron`
  cada minuto): pasa a `vencida` las reservas `esperando_pago` con más de 15
  minutos desde `creada_en`.
- **Acreditar pago** (`acreditar_pago(p_pago_id, p_mp_payment_id, p_estado_mp)`,
  `security definer`, ejecutable solo por `service_role`):
  - `approved` + reserva `esperando_pago` → pago `aprobado`, reserva `confirmada`.
  - `approved` + reserva `vencida` o `cancelada` → pago `reintegro_pendiente`.
  - `rejected` / `cancelled` → pago `rechazado`; la reserva sigue
    `esperando_pago` hasta vencer (el cliente puede reintentar).
  - `pending` / `in_process` → sin cambios.
  - Idempotente: el mismo `mp_payment_id` con el mismo estado no cambia nada
    (Mercado Pago repite avisos).
- **Reintegro pendiente** (trigger en `reservas`): si la reserva pasa a
  `cancelada` y tiene un pago `aprobado`, el pago pasa a `reintegro_pendiente`,
  sin importar quién la canceló ni por dónde.
- **Bloqueo por turno**: `dias_bloqueados.turno text check (turno in ('mediodia', 'noche'))`,
  `null` = todo el día. La unicidad pasa a `(fecha, local_id, turno)` con
  `nulls not distinct`. `validar_reserva()` rechaza una reserva nueva si hay un
  bloqueo del día entero o del turno de su hora, con el mensaje "Ese turno ya
  está completo." (o el actual si es el día entero). Las reservas existentes no
  se tocan.

## Parte 2 — Servidor (Route Handlers)

Código de servidor en `src/servidor/`; ningún componente lo importa.

- `src/servidor/mercadopago.js`: cliente del SDK con `MP_ACCESS_TOKEN`.
- `src/servidor/supabase.js`: cliente con `SUPABASE_SECRET_KEY` (para
  `pagos` y `acreditar_pago`) y un helper que crea un cliente con el token del
  usuario que llama (para que la base aplique sus reglas).
- `src/servidor/firma.js`: valida `x-signature` (función pura, con tests).
- `src/servidor/preferencia.js`: arma el cuerpo de la preferencia (función pura).
- `src/servidor/esquemas.js`: esquemas Zod.
- `src/servidor/respuestas.js`: errores JSON uniformes; los detalles van al log
  del servidor, nunca un stack trace al cliente.

### `POST /api/v1/pagos`

- Auth: `Authorization: Bearer <token de Supabase>`. Sin token o inválido → 401.
- Body (Zod): `{ reservaId: uuid }`. Inválido → 400.
- La reserva tiene que ser del usuario (si no, 404), estar `esperando_pago` y no
  haber vencido (si no, 409 con el motivo).
- Crea el `pago` (`iniciado`, monto = `locales.sena`) y la preferencia:
  - un ítem: "Seña reserva <nombre del local> · <fecha> <hora>", cantidad 1,
    `unit_price` = monto, `currency_id: 'ARS'`
  - `external_reference` = id del pago
  - `notification_url` = `<APP_URL>/api/webhooks/mercadopago`
  - `back_urls` (`success`, `pending`, `failure`) = `<APP_URL>/reservas/pago?reserva=<id>`
  - `auto_return: 'approved'` solo si `APP_URL` es HTTPS y no local
  - `expires: true`, vence a los 15 minutos de `creada_en` de la reserva
- Respuesta 201: `{ initPoint }` (siempre `init_point`, nunca `sandbox_init_point`).

### `POST /api/webhooks/mercadopago`

1. Valida la firma: `x-signature` (`ts=…,v1=…`) + `x-request-id` + `data.id` de
   la query; HMAC-SHA256 del manifiesto `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
   con `MP_WEBHOOK_SECRET`, comparación en tiempo constante. Inválida → 401.
2. Si el tipo no es `payment`, responde 200 y no hace nada.
3. `GET /v1/payments/:id` con el Access Token: el estado real sale de ahí, no
   del cuerpo del aviso.
4. Llama a `acreditar_pago(external_reference, id, status)`.
5. Si quedó `reintegro_pendiente` (pago tardío), hace el reintegro como en la
   cancelación.
6. Responde 200. Si falla la consulta a Mercado Pago o a la base, 500, para que
   Mercado Pago reintente.

### `POST /api/v1/reservas/:id/cancelacion`

- Auth como arriba. Body (Zod): `{ motivo?: string (máx. 200) }`; para el admin
  es obligatorio (lo exige la base).
- Cancela llamando a `cancelar_reserva(id, motivo)` con el cliente del usuario
  que llama (cliente o admin), así la base aplica la regla de 1 hora, los
  permisos y el motivo obligatorio del admin.
- Si el pago quedó `reintegro_pendiente`: reembolso total en Mercado Pago
  (`POST /v1/payments/:id/refunds`, `X-Idempotency-Key` = id del pago), y el
  pago pasa a `reintegrado`. Si el reembolso falla, la cancelación igual queda
  hecha y el pago sigue `reintegro_pendiente` (se reintenta desde el panel).
- La misma ruta sirve para reintentar un reintegro desde el panel (admin, sobre
  una reserva ya cancelada con pago `reintegro_pendiente`).

### Variables de entorno (solo servidor)

`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `SUPABASE_SECRET_KEY`, `APP_URL`. En
`.env.local` (ignorado por git) y en Vercel. `.env.example` las lista vacías.
Ninguna lleva prefijo `NEXT_PUBLIC_`.

## Parte 3 — Pantallas

- `src/servicios/pagos.js`: `iniciarPago(reservaId)` y
  `cancelarReserva(id, motivo?)` llaman a las rutas con el token de la sesión.
  Los componentes siguen sin hablar con Supabase ni con las rutas directamente.
- **`/reservas`**: el botón pasa a "Reservar y pagar seña ($10.000)", con el
  monto leído de `locales.sena`. Crea la reserva, pide el `initPoint` y redirige.
  Errores de la ruta, traducidos, en el resumen de errores existente.
- **`/reservas/pago`** (nueva): vuelve el cliente desde Mercado Pago. No usa
  los parámetros de la URL para decidir nada: muestra "Estamos confirmando tu
  pago…" y escucha la reserva por tiempo real hasta que figure `confirmada`
  (éxito), o muestra "pago pendiente" / "no se pudo pagar" con "Reintentar
  pago" mientras no venza.
- **`/mis-reservas`**: `esperando_pago` con "Pagar seña" y el tiempo que falta;
  `vencida`; `cancelada` con motivo y estado del reintegro. Cancelar pasa por la
  ruta.
- **`/admin`**: sin Confirmar ni Rechazar; **Cancelar** pide el motivo
  (prearmado "No hay lugar", editable). Cada reserva web muestra su seña
  (pagada / reintegrada / reintegro pendiente). Bloque **Reintegros pendientes**
  con "Reintentar". El contador del panel deja de contar `pendiente`.
- **Días bloqueados**: selector de turno (mediodía, noche, todo el día) y el
  turno en la lista.

## Pruebas

- **pgTAP** (archivo nuevo `05_sena.test.sql`): el cliente solo crea
  `esperando_pago`; no puede insertar ni actualizar `pagos`; vence a los 15
  minutos; `acreditar_pago` confirma, es idempotente y deja
  `reintegro_pendiente` si la reserva venció; cancelar con pago aprobado deja
  `reintegro_pendiente`; el admin no cancela sin motivo; el bloqueo por turno
  frena ese turno y no el otro, y no toca reservas existentes; `esperando_pago`
  ocupa el lugar del día. Se actualizan los tests 01–04 que asumían `pendiente`.
- **`node --test`**: firma (válida, alterada, otro secreto, cabecera mal
  formada), cuerpo de la preferencia (monto, `external_reference`,
  `auto_return` solo con HTTPS público, vencimiento) y esquemas.
- **De punta a punta, a mano** (en `docs/QA-MANUAL.md`), en la preview de la
  rama: incógnito + cuenta compradora de prueba; tarjeta de prueba con titular
  `APRO` (confirmada) y `OTHE` (rechazado, reintento); cancelación del cliente
  y del admin con reintegro; vencimiento a los 15 minutos; bloqueo por turno.
- Al final, `/mp-review`.

## Despliegue

- Mercado Pago no llega a `localhost`: el webhook se prueba en la URL fija de la
  rama en Vercel. Se configura en el panel de Mercado Pago **iniciando sesión
  como el vendedor de prueba** (Webhooks → URL + evento "Pagos"), que da el
  `MP_WEBHOOK_SECRET`.
- Variables en Vercel para *Preview* (y para *Production* recién al mergear, con
  las mismas credenciales de prueba).
- Migración con `supabase db push`; extensión `pg_cron` activada en el proyecto
  remoto.

## Riesgos

1. **Las previews usan la base de producción.** Las reservas y pagos de prueba
   quedan como filas reales: se borran al terminar y se anota en la bitácora.
2. **Protección de despliegue de Vercel:** si las previews piden login, el
   webhook recibe 401. Verificar antes de probar; usar el bypass para
   automatización o desactivarla en previews.
3. **La clase 11 habla de un entorno "Sandbox"** que Mercado Pago ya no tiene:
   hoy se prueba con cuentas de prueba sobre la API real. Además, la creación
   automática del vendedor de prueba falló (`MP_API_DOWN`) y hubo que crear la
   app a mano desde esa cuenta. Va al registro del proceso como hallazgo.

## Fuera de alcance

Gift cards y pedido para llevar (specs propios), reintegros parciales,
credenciales de producción, cupo máximo por turno (el bloqueo es manual).

## Correcciones del plan (2026-10-15)

Al escribir el plan de implementación aparecieron tres cosas en este spec que no
cerraban. Se dejan anotadas en lugar de reescribir las secciones de arriba:

1. **Motivo de cancelación: hasta 120 caracteres**, no 200: es el mismo límite
   que ya usa el motivo de los días bloqueados (`LIMITES.motivo`), y así hay
   una sola regla.
2. **El índice único de `pagos` es solo sobre `aprobado`.** Como estaba escrito
   ("un pago aprobado, a reintegrar o reintegrado por reserva") contradecía la
   regla de acreditar: si alguien paga dos preferencias de la misma reserva, la
   segunda tiene que poder quedar `reintegro_pendiente` mientras la primera
   está `aprobada`.
3. **Son tres migraciones, no una:** los valores nuevos del enum van en un
   archivo propio (Postgres no deja usarlos en la misma transacción en que se
   agregan) y el bloqueo por turno en otro.
