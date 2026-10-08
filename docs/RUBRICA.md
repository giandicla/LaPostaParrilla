# Rúbrica de corrección — qué tenemos y qué falta

La grilla oficial de la cátedra (PW 2026 Q1, "Autoevaluación del Trabajo Práctico").
**Hay que sacar EXCELENTE en los 5 criterios transversales; si no, el TP está
desaprobado.** Además se evalúan los entregables E1 a E6, con su ponderación.

Este archivo se actualiza cada vez que un ítem cambia de estado. Lo más fino de cada
pendiente vive en `docs/PENDIENTES.md`; acá va el mapa contra la rúbrica.

Leyenda: ✅ cumple Excelente · 🟡 parcial (nivel probable entre paréntesis) · ❌ falta

Última revisión: **2026-10-08** (sesión 03).

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
| E2 | Landing + vistas responsivas | 15% | 🟡 (Bueno) | 8 páginas maquetadas, semánticas, mobile first, marca real, foco visible, `prefers-reduced-motion` | Hallazgos de accesibilidad abiertos en `PENDIENTES.md`: el panel mobile no mueve ni atrapa el foco; breakpoints sueltos (600/421px). Correr Lighthouse / axe y dejar los números registrados |
| E3 | Formularios dinámicos con fetch + validación | 15% | ✅ (a confirmar en la preview, ya conectada a la base) | `/reservas`: franjas y días bloqueados pedidos a la base, horarios filtrados en vivo, errores de la base traducidos, pantalla de éxito. **Validación propia** (`src/validacion/reservas.js`, con tests en `node --test`): mensaje por campo al salir de él, revalida mientras se corrige, resumen y foco al primer error al enviar, `aria-invalid` + `aria-describedby`, contador de caracteres. Admin: mover, bloquear días y **nueva reserva del local** validados igual. Más de 6 personas: "Reservar por WhatsApp" con el mensaje armado. **La base repite las reglas** (trigger `validar_contacto`, tests pgTAP 03 y 04) | Probarlo a mano con sesión en la preview |
| E4 | Catálogo navegable + API básica | 20% | 🟡 (Regular) | `/carta`: dos cartas completas en HTML (con la carta de vinos compartida, `vinos.json`), índice por sección, toggle de local en la URL. PRs con plantilla y checklist | **No hay API interna**: la carta es un JSON importado. Faltaría además lógica de catálogo (búsqueda, filtros, agotado) |
| E5 | CRUD en Supabase + admin | 20% | ✅ / 🟡 | Tablas con RLS y migraciones, 62 asserts pgTAP en 4 archivos; reservas: crear (cliente y admin, con reservas del local sin cuenta), listar, cancelar, confirmar/rechazar/mover; notas; días bloqueados; tiempo real; panel admin | Para que el CRUD sea "completo" y no solo de reservas: carta en tablas editable desde el admin (etapa 2.3 ya planificada) |
| E6 | Checkout + webhook | 20% | ❌ | Nada | Integrar **Mercado Pago** (checkout + webhook que actualice la base) con pruebas. Definir qué se cobra |

## Criterios transversales (todos tienen que ser Excelente)

| Criterio | Peso | Estado | Qué hay | Qué falta |
|---|---|---|---|---|
| Funcionalidad | 40% | 🟡 | Reservas reales en producción, login con Google, admin con tiempo real | Pagos (E6). Mails de reservas: falta `BREVO_API_KEY`, hoy la UI promete "te avisamos por mail" y no sale nada |
| Código / Estructura | 20% | ✅ / 🟡 | Componentes por carpeta, capa `src/servicios/`, datos separados, migraciones, lint limpio. Tests en los tres niveles: funciones puras del front (`node --test`, 23), base (pgTAP, 62) y Edge Function (Deno, 11) | Sostenerlo en lo nuevo (API, pagos); no hay tests de componentes React |
| Interfaz / Accesibilidad | 15% | 🟡 | Marca real, contraste calculado, teclado en navbar | Los hallazgos de E2 y E3 |
| Despliegue | 15% | ✅ | https://lapostaparrilla.vercel.app, estable, deploy automático; previews por PR conectadas a la base; migraciones aplicadas con `supabase db push` | Mantener |
| Documentación | 10% | ✅ / 🟡 | `CLAUDE.md`, `README.md` y `docs/` al día (en la sesión 04 se corrigieron `CONTEXTO.md` y esta rúbrica), registro del proceso con IA, specs por feature | Documentar API y pagos cuando existan |

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
3. E4 — API de la carta + lógica del catálogo.
4. ~~E3 — validación propia y accesible en los formularios~~ (sesión 03, PR #2).
5. E6 — Mercado Pago: checkout + webhook + pruebas, en este orden: seña de la
   reserva, gift cards, pedido para llevar.
6. E5 — carta editable desde el admin.
7. E2 — pase de accesibilidad (foco del menú, Lighthouse/axe) y QA manual.
8. Demo — guion de la demo y preparación de la defensa técnica.
