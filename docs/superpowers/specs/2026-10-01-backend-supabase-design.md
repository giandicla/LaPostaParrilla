# Backend con Supabase — diseño (partes 1 y 2)

Fecha: 2026-10-01. Estado: acordado con el usuario en conversación; el usuario
pidió implementar las partes 1 y 2 sin frenar a aprobar cada sección del diseño.

## 1. Objetivo

Que las reservas dejen de ser una maqueta: el cliente se loguea, reserva, ve y
cancela sus reservas; la familia (admin) las gestiona desde un panel. Más adelante
(parte 3), el admin edita la carta y los horarios.

## 2. Decisiones del usuario

| Tema | Decisión |
|---|---|
| Backend | Supabase como BaaS, base relacional (Postgres), RLS |
| ¿Login para reservar? | Sí, siempre |
| Proveedores | ~~Google + email y contraseña~~ → **solo Google** (cambio del 2026-10-06, ver sección 12) |
| Al reservar | Queda **pendiente** hasta que el admin confirma o rechaza |
| Máximo | **6 personas**; más, por WhatsApp del local |
| El cliente puede | Ver y **cancelar** (no modificar). Cancelar desde la web hasta **2 horas antes**; después, por WhatsApp |
| Admin | Un rol `admin` para los dos locales, en la tabla de perfiles |
| Avisos | Parte 1: solo web. Parte 2: tiempo real en el panel + **mails con Brevo** (plan gratis) |
| Conexión | **Desde el navegador** (`supabase-js`), sin servidor de Next. La seguridad la pone la RLS |
| Extras | Teléfono en el perfil · días bloqueados · notas internas · lista del día imprimible · "agotado" en la carta (parte 3) |
| Límite | **Una reserva activa por usuario, local y día** |

## 3. Partes

1. **Base + auth + reservas del cliente** — esquema, RLS, login, reservar, mis reservas.
2. **Panel de admin** — reservas por día y local, confirmar / rechazar / cancelar /
   mover, notas internas, días bloqueados, lista del día imprimible, tiempo real,
   mails con Brevo.
3. **Admin de contenido** — carta (desde `cartas.json`), "agotado", horarios y
   franjas. *No incluida en esta implementación.*

## 4. Arquitectura

```
Navegador (Next.js estático)
  ├─ componentes / páginas ──► src/servicios/*.js ──► supabase-js ──► Supabase
  │                                                                    ├─ Auth (Google, email)
  │                                                                    ├─ Postgres + RLS
  │                                                                    └─ Realtime
  └─ (nunca llama a Supabase directo desde un componente)
Postgres ── trigger + pg_net ──► Edge Function `notificar-reserva` ──► Brevo (mail)
```

- **No hay servidor propio**: ni API routes, ni Server Actions, ni middleware. Las
  páginas siguen prerenderizándose como estáticas; las que dependen de la sesión
  muestran "cargando" hasta leerla en el navegador.
- **Capa de servicios** (`src/servicios/`): único lugar que conoce Supabase. Si
  mañana cambia el backend, cambian estos archivos y no los componentes.
- **Migraciones SQL versionadas** en `supabase/migrations/`, manejadas con la CLI.
  El esquema del repo es la verdad; el panel de Supabase no se usa para crear tablas.

## 5. Modelo de datos

| Tabla | Contenido | Parte |
|---|---|---|
| `locales` | `id` ('parrilla', 'restaurante'), `nombre`. Fotos y textos siguen en `locales.js` | 1 |
| `perfiles` | 1 por usuario (trigger al registrarse): `nombre`, `telefono`, `rol` ('cliente' / 'admin') | 1 |
| `franjas_reserva` | `local_id`, `hora`: horarios reservables | 1 |
| `reservas` | usuario, local, fecha, hora, personas (1–6), nombre, teléfono, comentarios, `estado`, `cancelada_por`, fechas | 1 |
| `dias_bloqueados` | fecha, local (nulo = los dos), motivo | 2 |
| `notas_reserva` | nota interna por reserva — tabla aparte porque la RLS filtra filas, no columnas | 2 |

Estados: `pendiente` → `confirmada` | `rechazada` (admin); `pendiente` | `confirmada`
→ `cancelada` (cliente o admin).

## 6. Reglas (las hace cumplir la base)

- El cliente **ve** solo sus reservas; **crea** solo a su nombre y en `pendiente`;
  **no edita** reservas. Cancela con la función `cancelar_reserva(id)`, que verifica
  que sea suya, que esté activa y que falten 2 horas o más (hora de Argentina).
- Al crear o mover una reserva, un trigger valida: hora dentro de las franjas del
  local, fecha y hora futuras, día no bloqueado. El `check` de la tabla limita a 6.
- Índice único parcial: una reserva activa (`pendiente` o `confirmada`) por
  usuario, local y día.
- El cliente edita su `nombre` y `telefono` pero **no su `rol`** (permiso por
  columna). El primer admin se nombra a mano en el panel de Supabase.
- El admin ve y modifica todo; las notas internas solo las ve el admin.
- Nadie borra reservas: se cancelan, para conservar el historial.

## 7. Mails (parte 2)

Un trigger en `reservas` llama con `pg_net` a la Edge Function `notificar-reserva`.
La URL y un secreto compartido viven en Supabase Vault; si no están configurados,
el trigger no hace nada (el sitio funciona sin mails).

| Evento | Destinatario |
|---|---|
| Reserva nueva | Admin (`lapostavla@gmail.com`) |
| Confirmada / rechazada / movida por el admin | Cliente |
| Cancelada por el admin | Cliente |
| Cancelada por el cliente | Admin |

Remitente: una dirección verificada en Brevo (sin dominio propio). Sin
`BREVO_API_KEY`, la función registra el mail en el log y no envía.

## 8. Pantallas

| Ruta | Qué hace |
|---|---|
| `/ingresar` | Ingresar / crear cuenta / recuperar contraseña; Google y email |
| `/reservas` | Sin sesión: invita a ingresar. Con sesión: formulario real, nombre y teléfono precargados |
| `/mis-reservas` | Próximas y pasadas, con estado; cancelar o WhatsApp según la regla de 2 horas |
| `/admin` | Reservas por fecha, local y estado; acciones; notas; días bloqueados; tiempo real |
| `/admin/dia` | Lista imprimible de las reservas confirmadas de un día |

## 9. Errores

Los servicios traducen los errores de Postgres a mensajes en castellano (por
ejemplo, la violación del índice único → "Ya tenés una reserva activa ese día en
ese local"). Si faltan las variables de entorno de Supabase, el sitio sigue
funcionando y las pantallas de cuenta y reservas avisan que no están disponibles.

## 10. Pruebas

- **Base:** pgTAP (`npx supabase test db`) sobre cada regla de la sección 6,
  actuando como cliente, como otro cliente, como admin y como anónimo.
- **Front:** lint, build, y recorrido con Playwright contra el Supabase local
  (registro, reserva, cancelación, panel de admin).

## 12. Cambio posterior: solo Google (2026-10-06)

Ya en producción apareció que el servidor de mails de fábrica de Supabase solo
entrega a miembros del equipo del proyecto: un cliente que se registrara con
email no recibiría la confirmación. El usuario decidió **dejar solo el ingreso con
Google** (que ya verifica el mail). Se sacaron de `/ingresar` el registro, el
ingreso con email y "olvidé mi contraseña", y se apagó el proveedor de email en
Supabase (`[auth.email] enable_signup = false`), para que tampoco se pueda
crear una cuenta así llamando a la API.

## 11. Fuera de alcance

Parte 3 (admin de la carta y horarios), pagos, reservas de invitados, cupos
automáticos, historial de cambios, fotos editables.
