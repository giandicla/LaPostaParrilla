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
| `hallazgos.md` | Lo analítico: dónde falló la IA, dónde sorprendió, qué se aprendió |
| `metodo.md` | Cómo se organizó el trabajo y por qué |

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
