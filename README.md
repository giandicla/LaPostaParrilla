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
| `python scripts/procesar-assets.py "../Branding y fotos"` | Regenera logo, fotos y PDF de las cartas desde la carpeta de branding |

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
| `docs/PENDIENTES.md` | Lo que falta |
| `docs/QA-MANUAL.md` | Checklist para verificar el sitio en un navegador |
| `docs/proceso/` | Registro del trabajo con IA, para la presentación de la materia |

## Estado

**Etapa 1 — boceto visual.** Las cuatro páginas están maquetadas.
El formulario de reservas es maqueta: todavía no guarda ni envía nada.
El CRUD es la etapa 2 y los pagos la 3.
