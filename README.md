# La Posta — Parrilla & Restaurante

Sitio web de La Posta, en Villa La Angostura, Neuquén: **dos salones bajo una misma
marca**, La Posta Parrilla y La Posta II Restaurante, uno al lado del otro.
Trabajo práctico integrador de Programación Web (2026) y, a la vez, la web real del
restaurante.

**Producción:** https://lapostaparrilla.vercel.app — se publica sola en Vercel con cada
merge a `main`.

## Qué hace

- **Sitio público:** inicio, carta de cada salón y carta de vinos compartida, Nosotros
  y contacto con mapa, "Cómo llegar" y WhatsApp de cada salón. Pensado primero para el
  celular.
- **Cuentas:** ingreso con Google o con mail y contraseña (crear cuenta con mail de
  confirmación, recuperar la contraseña). Los formularios con mail llevan captcha.
- **Reservas con seña:** el cliente elige salón, fecha, hora y personas, y paga una
  seña con **Mercado Pago** (Checkout Pro, credenciales de prueba). El webhook firmado
  confirma la reserva. Desde "Mis reservas" puede pagar, modificar o cancelar hasta
  1 hora antes; al cancelar, la seña se devuelve sola al mismo medio de pago. Con
  menos de 1 hora no se puede cancelar. Si cancela el local, se devuelve siempre.
- **Panel del local** (`/admin`): reservas en tiempo real con filtros, reservas
  tomadas en el local, editar y cancelar con motivo, notas internas, lista del día
  para imprimir, devoluciones de seña en curso, **días bloqueados** por rango de
  fechas y de horas, y **editor de la carta** (agregar, editar, ordenar arrastrando).
- **Mails** de reserva (confirmación, cambios, cancelación) con la marca, por Brevo.

## Stack

Next.js 16 (App Router) · React 19 · CSS Modules · Supabase (Postgres con RLS, Auth,
Realtime, Edge Functions, `pg_cron`) · Mercado Pago · Vercel.

El front le habla a Supabase desde el navegador y la seguridad la pone la **RLS** de la
base, donde viven también las reglas del negocio. El código de servidor queda en las
rutas de `app/api/`: la seña y su webhook, la cancelación con reembolso y la **API de la
carta** (`/api/v1/carta`). Detalle en `docs/BACKEND.md`.

## Correrlo en local

Requiere Node 20+ y Docker (para Supabase local).

```bash
npm install
npx supabase start
npm run db:reset
cp .env.example .env.local
npm run dev
```

Completá `.env.local` con los valores de `npx supabase status` y las credenciales de
prueba de Mercado Pago (ver `.env.example` y `docs/BACKEND.md`). Abre en
`http://localhost:3000`. `db:reset` crea un admin y un cliente de prueba (los datos
están en `supabase/seed.sql`); los mails locales caen en Mailpit
(http://127.0.0.1:54324).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción a `.next/` |
| `npm run start` | Sirve el build local, para revisar antes de pushear |
| `npm run lint` | ESLint |
| `npm test` | Funciones puras (`node --test`) y rutas y componentes (Vitest) |
| `npm run db:test` | Tests pgTAP de la base (con `npx supabase start` corriendo) |
| `npm run db:reset` | Base local desde cero: migraciones + datos de prueba |
| `node scripts/variantes-img.mjs` | Versiones de 480 y 960 px de cada foto, para el celular |
| `python scripts/procesar-assets.py "../Branding y fotos"` | Regenera el logo y las fotos desde la carpeta de branding |

## Tests y CI

Cada cambio va en su rama y entra por **pull request** con la plantilla y su checklist.
El CI (`.github/workflows/ci.yml`) corre lint, tests y build, los tests de la base y los
de la Edge Function, y Vercel publica una preview del PR. Al 2026-11-11: 171 tests de
funciones, 127 de rutas y componentes, 219 de la base (pgTAP) y los de la Edge Function
(Deno).

## Documentación

| Archivo | Qué tiene |
|---|---|
| `CLAUDE.md` | Contexto rápido del proyecto y convenciones |
| `docs/CONTEXTO.md` | El restaurante, la consigna, las decisiones y por qué |
| `docs/ESTRUCTURA.md` | Qué contiene cada página y componente |
| `docs/BACKEND.md` | Supabase, Mercado Pago, mails y variables: cómo correrlo y cómo publicarlo |
| `docs/BITACORA.md` | Log de cambios |
| `docs/RUBRICA.md` | La rúbrica de corrección y qué cumple el proyecto hoy |
| `docs/PENDIENTES.md` | Lo que queda abierto |
| `docs/QA-MANUAL.md` | Checklist para verificar el sitio en un navegador |
| `docs/PRUEBA-DE-USUARIO.md` | La prueba de usuario contra producción (2026-11-10) |
| `docs/proceso/` | Registro del trabajo con IA, para la presentación de la materia |

## Estado (2026-11-11)

**Terminado y en producción.** Funcionalidad completa y probada pagando en producción
(incluida la devolución de la seña), pase de estética con el usuario y chequeo en
celular de todas las páginas. Los datos de prueba se borraron: quedan la cuenta admin
del local y dos cuentas de prueba para la corrección, que se pasan aparte.

Mercado Pago está en **modo de prueba**: se paga sin iniciar sesión en Mercado Pago, en
una ventana de incógnito, con una tarjeta de prueba.

Se descartaron, por decisión del usuario, el pedido para llevar (2026-11-01) y las gift
cards (2026-11-10). El mapa contra la rúbrica está en `docs/RUBRICA.md`; lo abierto, en
`docs/PENDIENTES.md`.
