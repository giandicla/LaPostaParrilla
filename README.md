# La Posta — Parrilla & Restaurante

Sitio web de La Posta, restaurante familiar en Villa La Angostura, Neuquén.
Trabajo práctico de Programación Web.

**Producción:** https://lapostaparrilla.vercel.app — desplegado en Vercel desde `main`.
Backend: Supabase (proyecto `la-posta`). Ingreso solo con Google.

## Correrlo

```bash
npm install
npm run dev
```

Abre en `http://localhost:3000`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción a `.next/` |
| `npm run start` | Sirve el build local, para revisar antes de pushear |
| `npm run db:test` | Tests pgTAP de la base (con `npx supabase start` corriendo) |
| `npm run db:reset` | Base local desde cero: migraciones + datos de prueba |
| `python scripts/procesar-assets.py "../Branding y fotos"` | Regenera el logo y las fotos desde la carpeta de branding |

## Stack

Next.js 16 (App Router) · React 19 · CSS Modules · Supabase (Postgres, Auth,
Realtime, Edge Functions)

Sin servidor propio: el front habla con Supabase desde el navegador y la seguridad
la pone la RLS de la base. Detalle en `docs/BACKEND.md`.

## Documentación

| Archivo | Qué tiene |
|---|---|
| `CLAUDE.md` | Contexto rápido del proyecto y convenciones |
| `docs/CONTEXTO.md` | El restaurante, la consigna, las decisiones y por qué |
| `docs/ESTRUCTURA.md` | Qué contiene cada página y componente |
| `docs/BITACORA.md` | Log de cambios |
| `docs/RUBRICA.md` | La rúbrica de corrección y qué cumple el proyecto hoy |
| `docs/PENDIENTES.md` | Lo que falta |
| `docs/QA-MANUAL.md` | Checklist para verificar el sitio en un navegador |
| `docs/proceso/` | Registro del trabajo con IA, para la presentación de la materia |

## Estado

En producción: sitio completo, ingreso con Google, reservas reales con seña por
Mercado Pago (modo de prueba), "Mis reservas", panel de admin con tiempo real, y la
carta en la base: `/carta` con la estética de la carta impresa (Parrilla · Vinos ·
Restaurante, los vinos compartidos) y el editor del panel (`/admin/carta`), servida
por una API propia (`/api/v1/carta`).

Próximo: gift cards y pedido para llevar (los otros dos cobros decididos), mails de
reservas (falta la cuenta de Brevo) y el pase de accesibilidad. El mapa completo
contra la rúbrica de corrección está en `docs/RUBRICA.md`.

## Cómo se trabaja

Cada cambio va en su rama y entra por **pull request**: la plantilla trae el
checklist, el CI (`.github/workflows/ci.yml`) corre lint, build, tests de la base
y de la Edge Function, y Vercel publica una preview del PR.
