# Registro del proceso de trabajo con IA

Esta carpeta documenta **cómo se construyó el sitio**, no qué hace. Existe porque la
cátedra pide usar IA y además registrar el proceso: dónde funcionó, dónde falló, y
qué salió distinto de lo esperado.

No es un diario de "le pedí X y me dio X". Lo interesante para la materia está en las
fricciones: las veces que la IA se equivocó y cómo se detectó, las veces que acertó
donde no se esperaba, y las decisiones que hubo que tomar a mitad de camino.

## Qué hay acá

| Archivo | Qué contiene |
|---|---|
| `README.md` | Este archivo: cómo funciona el registro |
| `sesion-01-2026-09-24.md` | Primera sesión: del repo vacío al sitio desplegado |
| `sesion-02-2026-10-01.md` | Segunda sesión (1 al 7/10): la marca real, la carta, el backend con Supabase, producción y el login con Google |
| `sesion-03-2026-10-08.md` | Tercera sesión: la rúbrica oficial, CI y PRs, validación de formularios |
| `sesion-04-2026-10-08.md` | Cuarta sesión: el rediseño descartado; reservas del local cargadas por el admin, la nueva página de reservas, la subida a producción, previews conectadas a la base y los vinos en las dos cartas |
| `sesion-05-2026-10-15.md` | Quinta sesión (15 y 18/10): la seña de la reserva con Mercado Pago, hecha con subagentes; credenciales de prueba, reintegro bloqueado en modo de prueba y el despliegue en una sola ventana |
| `sesion-06-2026-10-29.md` | Sexta sesión: qué falta según la rúbrica; la carta a la base, con API, panel del admin, estética del PDF e impresión. Ejecución en línea (sin subagentes por tarea) |
| `sesion-07-2026-11-01.md` | Séptima sesión: qué falta para la entrega (12/11), pase de accesibilidad, seña no reembolsable y cambios a las reservas pedidos tras probar producción |
| `sesion-08-2026-11-02.md` | Octava sesión (continuación de la 07): mails con Brevo y con la marca, rendimiento en el celular, las tres cartas con la misma estética |
| `sesion-09-2026-11-03.md` | Novena sesión: editar reservas desde el panel, ingreso con mail y contraseña, mails solo al cliente con remitente Gmail |
| `sesion-10-2026-11-04.md` | Décima sesión: el reembolso de la seña vuelve (pista de la ayudante), con las credenciales de prueba de la aplicación, confirmado por webhook y probado en producción |
| `sesion-11-2026-11-05.md` | Undécima sesión: tests de rutas y componentes, menores del ingreso y de la seña, estética del inicio |
| `sesion-12-2026-11-06.md` | Duodécima sesión: auditoría de seguridad (skill de Cloudflare, perfil deep) y sus arreglos |
| `sesion-13-2026-11-08.md` | Decimotercera sesión: los arreglos a producción y el captcha de Cloudflare Turnstile |
| `hallazgos.md` | Lo analítico: dónde falló la IA, dónde sorprendió, qué se aprendió |
| `metodo.md` | Cómo se organizó el trabajo y por qué |
| `ledger-sesion-01.md` | El registro crudo de la sesión, sin editar: las decisiones tal como se tomaron |

Los archivos de sesión son cronológicos y no se editan hacia atrás: si algo que se
dijo resultó equivocado, se corrige **en una entrada posterior**, dejando el error
visible. Un registro que se reescribe para quedar bien no sirve para lo que pide la
materia.

## Cómo se mantiene

**Al cierre de cada sesión de trabajo**, o cuando se pida explícitamente, se agrega
una entrada nueva con:

1. **Qué se pidió** — el pedido del usuario, en sus términos, resumido pero fiel.
2. **Qué se hizo** — las decisiones tomadas y por qué.
3. **Qué falló** — errores de la IA, con evidencia concreta (archivo, línea, commit).
4. **Qué sorprendió** — lo que salió mejor o distinto de lo esperado.
5. **Qué quedó abierto** — pendientes reales, no aspiracionales.

Si un hallazgo es lo bastante interesante como para contarlo en la presentación
final, además va a `hallazgos.md` con su contexto completo.

## Regla de honestidad

Este registro pierde todo su valor si se maquilla. Concretamente:

- **Los errores de la IA se registran con su evidencia**, no como "hubo un ajuste
  menor". Si un plan generado por IA tenía diez defectos, dice diez y cuáles.
- **Los aciertos también**, sobre todo los inesperados.
- **Las decisiones humanas se distinguen de las de la IA.** Cuando el usuario cambió
  el rumbo, eso se anota como tal.
- Los números son verificables: los commits existen, los archivos y líneas se pueden
  abrir.

## Para la presentación final

`hallazgos.md` es el material más útil para exponer: está organizado por tipo de
falla y acierto, no por cronología, y cada punto tiene un ejemplo concreto del
proyecto. Las sesiones sirven de respaldo cuando hace falta mostrar el contexto.
