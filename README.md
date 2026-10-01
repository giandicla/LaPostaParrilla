# La Posta — Parrilla & Restaurante

Sitio web de La Posta, restaurante familiar en Villa La Angostura, Neuquén.
Trabajo práctico de Programación Web.

**Producción:** desplegado en Vercel desde `main`.

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
| `python scripts/procesar-assets.py "../Branding y fotos"` | Regenera logo, fotos y hojas de carta desde la carpeta de branding |

## Stack

Next.js 16 (App Router) · React 19 · CSS Modules

Front puro: sin backend, sin base de datos.

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
