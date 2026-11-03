# Rúbrica de corrección — qué tenemos y qué falta

La grilla oficial de la cátedra (PW 2026 Q1, "Autoevaluación del Trabajo Práctico").
**Hay que sacar EXCELENTE en los 5 criterios transversales; si no, el TP está
desaprobado.** Además se evalúan los entregables E1 a E6, con su ponderación.

Este archivo se actualiza cada vez que un ítem cambia de estado. Lo más fino de cada
pendiente vive en `docs/PENDIENTES.md`; acá va el mapa contra la rúbrica.

Leyenda: ✅ cumple Excelente · 🟡 parcial (nivel probable entre paréntesis) · ❌ falta

Última revisión: **2026-11-02** (sesión 08: mails con Brevo, rendimiento, cartas unificadas).

---

## Lo que dice la consigna, además de la grilla

- Entregables del cronograma: CI/CD, landing semántica y responsive, formularios
  dinámicos, catálogo y API, base de datos y pagos, demo final.
- Desarrollo **continuo, con commits y entregas alineadas** a las etapas.
- **Revisiones de código en cada PR.** Recursos sugeridos: Vercel, Next.js,
  Supabase y **Mercado Pago API**.
- **Defensa técnica y demo pública en vivo**, con preguntas técnicas.

> **El alcance avanza clase a clase.** El "solo el front en React" del principio era
> la consigna de esa etapa, no del TP entero. El 2026-10-08 la cátedra dio
> **webhooks e integración con Mercado Pago**: desde ahí entra código de servidor
> para la API interna (E4) y el webhook de pagos (E6).

---

## Entregables

| # | Entregable | Peso | Estado | Qué hay | Qué falta para Excelente |
|---|---|---|---|---|---|
| E1 | Repo + pipeline + preview | 10% | ✅ | Repo en GitHub, deploy automático a Vercel desde `main`. **CI** en `.github/workflows/ci.yml`: lint + tests + build, tests pgTAP de la base, tests Deno de la Edge Function. Plantilla de PR con checklist. Todo cambio por rama + PR desde la sesión 03 (PRs #1 a #7). **Preview de Vercel en cada PR, conectada a la base** desde la sesión 04 | Mantenerlo. Nota: las previews usan la base de producción |
| E2 | Landing + vistas responsivas | 15% | ✅ (sesión 07) | 8 páginas maquetadas, semánticas, mobile first, marca real, foco visible, `prefers-reduced-motion`. **Pase de accesibilidad (2026-11-01):** foco del menú mobile movido y atrapado, escala de breakpoints única, contraste corregido. **Lighthouse** (celular y escritorio): Accesibilidad, Buenas prácticas y SEO **100** en inicio, carta, nosotros y reservas; **axe**: 0 violaciones en las 5 páginas públicas. Números en `docs/QA-MANUAL.md` | Rendimiento en celular: los saltos de layout y el peso de las fotos se resolvieron (2026-11-02); el LCP sigue alto en la simulación de celular |
| E3 | Formularios dinámicos con fetch + validación | 15% | ✅ (a confirmar en la preview, ya conectada a la base) | `/reservas`: franjas y días bloqueados pedidos a la base, horarios filtrados en vivo, errores de la base traducidos, pantalla de éxito. **Validación propia** (`src/validacion/reservas.js`, con tests en `node --test`): mensaje por campo al salir de él, revalida mientras se corrige, resumen y foco al primer error al enviar, `aria-invalid` + `aria-describedby`, contador de caracteres. Admin: mover, bloquear días y **nueva reserva del local** validados igual. Más de 6 personas: "Reservar por WhatsApp" con el mensaje armado. **La base repite las reglas** (trigger `validar_contacto`, tests pgTAP 03 y 04) | Probarlo a mano con sesión en la preview |
| E4 | Catálogo navegable + API básica | 20% | ✅ (en producción desde el 2026-10-29, probado por el usuario) | Criterio Excelente de la grilla, textual: **"Catálogo + API interna, lógica funcional y checklist en PRs"**. La carta vive en la base y se sirve por una **API propia**: `GET /api/v1/carta?local=` (pública, cacheada) y escrituras del admin (`POST/PATCH/DELETE` en `items`, bodegas y cubierto) con Zod, códigos HTTP y errores en castellano. **Lógica:** armado de la carta (secciones propias + compartidas, vinos por bodega, orden), validación en front, API y base, permisos de admin. `/carta` lee la API con la estética de la carta impresa; índice por sección y toggle de local. PRs con plantilla y checklist | Probarlo en la preview. **Nota (sesión 06):** la versión anterior de esta fila decía que faltaban "búsqueda, filtros, agotado". Esa lista la había escrito la IA, no la cátedra; el usuario decidió no hacerlos (`hallazgos.md` 1.25) |
| E5 | CRUD en Supabase + admin | 20% | ✅ (en producción desde el 2026-10-29, probado por el usuario) | Reservas: crear (cliente y admin, con reservas del local sin cuenta; una por turno), listar (Mis reservas paginada), **modificar desde la web** (fecha, hora y personas, hasta 1 hora antes), cancelar, confirmar/rechazar/mover; notas; días bloqueados; tiempo real. **Carta (sesión 06):** tablas `carta_secciones` y `carta_items` con RLS, trigger de reglas y funciones de orden; `/admin/carta` (editor v2): una caja para agregar o editar, con buscador y categoría desplegable; la carta abajo con arrastre (mouse, dedo y teclado), Editar y Eliminar; los vinos como carta aparte, compartida. pgTAP: 9 archivos, 150 asserts | Editar franjas y horarios desde el panel (etapa 2.3) |
| E6 | Checkout + webhook | 20% | ✅ (seña de la reserva) | **Seña de la reserva con Mercado Pago** (Checkout Pro): la preferencia se crea en el servidor (`POST /api/v1/pagos`, monto leído de la base, nunca del navegador); **webhook firmado** (`POST /api/webhooks/mercadopago`, HMAC-SHA256 de `x-signature`); el estado real sale de `GET /v1/payments/:id`; **conciliación** por `external_reference` con `acreditar_pago()`, idempotente (Mercado Pago repite avisos) y con manejo de pago tardío y de cobro doble; **cancelación** con política de seña (`POST /api/v1/reservas/:id/cancelacion`): si cancela el cliente no se devuelve; si cancela el local o el pago llega tarde, queda en "Señas a devolver" para el local; vencimiento a los 15 minutos con `pg_cron`. Tests: pgTAP 7 archivos / 97 asserts, `node --test` 64, Deno 13. **Probado de punta a punta en la preview de Vercel** el 2026-10-18 (pago aprobado y rechazado con reintento, cancelación del cliente y del admin). Detalle en `docs/BACKEND.md` | **Sin reembolso automático, a propósito** (decisión del usuario, 2026-11-01): en modo de prueba la API de reembolsos responde 401 "Unauthorized use of live credentials" (`hallazgos.md` 1.18) y no se usan cuentas con plata real; como no se podía probar, se sacó y se explica en la defensa. Pedido para llevar: descartado. Gift cards: en evaluación |

## Criterios transversales (todos tienen que ser Excelente)

| Criterio | Peso | Estado | Qué hay | Qué falta |
|---|---|---|---|---|
| Funcionalidad | 40% | 🟡 | Reservas reales en producción, login con Google **o con mail y contraseña** (crear cuenta con confirmación por mail y recuperación de contraseña, 2026-11-03), admin con tiempo real, **seña con Mercado Pago** (2026-10-18), **carta editable desde el panel** con API propia y vinos compartidos (2026-10-29) | Gift cards (en evaluación). Los mails de reservas salen desde el 2026-11-02 (Brevo) |
| Código / Estructura | 20% | ✅ / 🟡 | Componentes por carpeta, capa `src/servicios/`, datos separados, migraciones, lint limpio. Tests en los tres niveles: funciones puras del front y del servidor (`node --test`, 100), base (pgTAP, 171 en 11 archivos) y Edge Function (Deno, 18). El código de servidor de pagos y de la carta vive aparte, en `src/servidor/`, y recibe la base (y Mercado Pago) por parámetro para testearse sin red | No hay tests de componentes React ni de las rutas (ver `PENDIENTES.md`) |
| Interfaz / Accesibilidad | 15% | ✅ | Marca real, contraste calculado y verificado con axe, teclado y foco atrapado en el menú, Lighthouse Accesibilidad 100 en las páginas públicas | LCP en celular (ver `QA-MANUAL.md`) |
| Despliegue | 15% | ✅ | https://lapostaparrilla.vercel.app, estable, deploy automático; previews por PR conectadas a la base; migraciones aplicadas con `supabase db push` | Mantener |
| Documentación | 10% | ✅ | `CLAUDE.md`, `README.md` y `docs/` al día, registro del proceso con IA (hasta la sesión 08, con lo que hubo que pedir de nuevo), specs por feature, pagos y variables de entorno documentados en `docs/BACKEND.md`, checklist de QA de la seña | Mantenerlo |

---

## Decisiones

Tomadas por el usuario el 2026-10-08 (sesión 03):

1. **Qué se cobra con Mercado Pago: las tres cosas.** El local hace take away.
   - **Seña de la reserva.**
   - **Gift cards** (voucher de regalo).
   - **Pedido para llevar** (carrito sobre la carta) — refuerza también E4.
2. **Flujo rama + PR + CI desde ahora.** Cada tarea en su rama, PR con el checklist
   de `.github/pull_request_template.md`, CI en GitHub Actions y preview de Vercel.
   No se mergea sin el OK del usuario.
3. **API y webhook:** se implementan siguiendo lo que da la cátedra (clase del
   2026-10-08). Dónde viven exactamente (Route Handlers de Next o Edge Functions)
   se decide al diseñar E4/E6.

## Plan sugerido (orden)

1. ~~E1 — CI en GitHub Actions + plantilla de PR con checklist~~ (sesión 03); desde acá, todo por PR.
2. Documentación — README y CONTEXTO al día.
3. ~~E4 — API de la carta + lógica del catálogo~~ (sesión 06).
4. ~~E3 — validación propia y accesible en los formularios~~ (sesión 03, PR #2).
5. E6 — Mercado Pago: checkout + webhook + pruebas, en este orden: ~~seña de la
   reserva~~ (sesión 05, 2026-10-18), gift cards (en evaluación), ~~pedido para
   llevar~~ (descartado por el usuario, 2026-11-01).
6. ~~E5 — carta editable desde el admin~~ (sesión 06; editor v2 el mismo día, sin PDF).
7. ~~E2 — pase de accesibilidad (foco del menú, Lighthouse/axe)~~ (sesión 07); QA manual.
8. Demo — guion de la demo y preparación de la defensa técnica. **Lo pide el usuario
   cuando quiera** (2026-11-02): no adelantarlo.
