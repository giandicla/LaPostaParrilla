# Cómo se organizó el trabajo

Describe el método usado para construir el sitio con IA. Sirve para explicar en la
presentación por qué el proceso tiene la forma que tiene.

## El ciclo

```
Idea del usuario
      ↓
Preguntas que cambian el resultado   ← solo las que lo cambian
      ↓
Diseño presentado y aprobado
      ↓
Especificación escrita (el "qué" y el "por qué")
      ↓
Plan de implementación (el "cómo", con el código de cada archivo)
      ↓
┌─────────── por cada tarea ───────────┐
│  Agente implementador                │
│         ↓                            │
│  Agente revisor (otro, independiente)│
│         ↓                            │
│  ¿Encontró algo? → corrección        │
│         ↓         → re-revisión      │
│  Tarea cerrada                       │
└──────────────────────────────────────┘
      ↓
Revisión general de toda la rama
```

## Las tres capas de documentos, y por qué son tres

| Documento | Responde | Cuándo cambia |
|---|---|---|
| **Especificación** | Qué se construye y por qué | Cuando cambia una decisión de fondo |
| **Plan** | Cómo, paso por paso, con el código | Cuando la especificación cambia |
| **Ledger** | Qué pasó realmente y qué se decidió sobre la marcha | Continuamente, durante la ejecución |

La separación importa: cuando el profesor exigió Next.js, **se enmendó la
especificación** —dejando registrado que Vite cayó por la consigna y no por un motivo
técnico— y a partir de ahí se reescribió el plan. Si hubiera existido un solo
documento, ese cambio habría borrado el rastro de la decisión original.

## Por qué un agente por tarea, y no uno solo para todo

Cada agente implementador arranca **sin el historial de la conversación**. Recibe:

1. Una línea sobre dónde encaja su tarea en el proyecto.
2. El texto completo de su tarea, con el código exacto a escribir.
3. Las interfaces de tareas anteriores que necesita conocer.
4. Las restricciones globales del proyecto.
5. Los comandos con los que se va a verificar su trabajo.

Nada más. No recibe los reportes de tareas anteriores ni el resumen de lo hecho.

**La ventaja:** un contexto limpio no arrastra suposiciones. **El costo:** hay que
escribir bien cada encargo, porque lo que no está en él, el agente no lo sabe.

## Por qué el revisor es otro agente

El revisor recibe el diff, los requisitos y el reporte del implementador — pero no
participó en escribir el código. Se le indica qué decisiones ya están cerradas (para
que no las vuelva a discutir) y nunca qué conclusión sacar sobre lo que sí tiene que
juzgar.

Todos los defectos listados en `hallazgos.md` los encontró un revisor, no el autor.

## Qué se verifica por comando

Las reglas importantes del proyecto se convirtieron en comandos que fallan:

```bash
# Los locales son datos, no rutas: ningún componente escribe un id a mano
grep -rn "'parrilla'\|\"parrilla\"\|'restaurante'\|\"restaurante\"" src/ app/ --include=*.jsx

# Esta etapa no persiste nada
grep -rn "localStorage\|sessionStorage\|fetch(\|axios" src/ app/

# Los colores salen de tokens.css
grep -rn "#[0-9a-fA-F]\{3,6\}" src/ app/ --include=*.module.css

# Solo estos cuatro archivos son componentes de cliente
grep -rln "use client" app/ src/components/
```

Los cuatro tienen que devolver lo esperado en cada tarea. Una regla escrita en prosa
se olvida; una que rompe un comando, no.

## Lo que este método no cubre

**Nada visual.** Ningún agente abre un navegador. El sitio puede compilar, pasar
todas las verificaciones y verse mal, y el método no lo detectaría.

Por eso la última tarea no intentó fingir esa verificación: escribió
`docs/QA-MANUAL.md`, un checklist para que lo corra una persona en un navegador real
y en un celular real.
