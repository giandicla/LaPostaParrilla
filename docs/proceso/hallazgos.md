# Hallazgos sobre el trabajo con IA

Organizado por tipo, no por orden cronológico. Cada punto tiene un ejemplo concreto
del proyecto, con archivo o commit, para que se pueda verificar.

---

## Parte 1 — Dónde falló la IA

### 1.1 El hallazgo principal: el plan generado por IA tenía diez defectos reales

El asistente escribió una especificación y un plan de implementación de ~4600 líneas
con el código de cada archivo. Ese plan **se revisó a sí mismo antes de ejecutarlo** y
se declaró limpio.

Durante la ejecución, las revisiones encontraron **diez defectos que venían del plan
mismo**, no de los agentes que lo implementaron:

| # | Defecto | Dónde |
|---|---|---|
| 1 | Import sin usar (`join` de `node:path`) que hacía fallar el linter | `scripts/gen-placeholders.mjs` |
| 2 | Se generaban imágenes `card.svg` sin ningún campo en los datos que las referenciara | `locales.js` / `LocalCard` |
| 3 | Al migrar, el link activo del navbar usaba `startsWith` crudo: marcaría `/carta` activo en `/cartagena` | `Navbar.jsx` |
| 4 | Los ids de ancla de la carta se armaban con el nombre de categoría crudo, con espacios — HTML inválido | `app/carta/page.jsx` |
| 5 | El índice de categorías dejaba el título detrás del toggle pegajoso al hacer clic | `app/carta/page.module.css` |
| 6 | En Nosotros, el orden del DOM y el orden visual no coincidían: un lector de pantalla oía las fotos antes del nombre del salón | `app/nosotros/page.jsx` |
| 7 | `ESTRUCTURA.md` afirmaba que solo dos componentes importan de `src/data/`. Son cuatro | `docs/ESTRUCTURA.md` |
| 8 | Claves de React derivadas de un recorte de texto (`parrafo.slice(0,24)`), que colisionan en silencio | Inicio y Nosotros |
| 9 | Tres breakpoints distintos (600/768/900px) para la misma idea | Varios `.module.css` |
| 10 | `--madera` sobre el fondo rosado daba 4.48:1, **por debajo del mínimo de accesibilidad** | `tokens.css` |

**Lo importante no es que hubiera diez defectos.** Es que la autorevisión del plan no
encontró ninguno. Los encontró la revisión posterior, con código real delante y un
agente distinto mirándolo.

**Conclusión para la materia:** una IA revisando su propio plan, en la misma sesión y
sin el código escrito, no es una verificación. La verificación necesita (a) código
real, (b) un revisor que no escribió lo que revisa.

### 1.2 Falló al asumir datos personales sin preguntar

El asistente configuró el repositorio con `gianfrancodicla@gmail.com`, tomado de la
configuración de Claude Code, sin preguntar qué cuenta correspondía. El repositorio
era de la cuenta de la facultad.

**Consecuencia:** Vercel bloqueó el despliegue por autoría no autorizada, y hubo que
reescribir la autoría de 13 commits.

**Patrón:** la IA tenía un dato disponible y lo usó como si fuera el correcto, sin
verificar que aplicara a este contexto.

### 1.3 Falló al escribir documentación sobre su propio código

`ESTRUCTURA.md` afirmaba una regla sobre qué componentes importan datos. Era falsa, y
el agente que escribió el archivo la transcribió del plan sin chequearla contra el
código — a pesar de que en su reporte afirmó haber verificado "props de componentes
contra el código".

Lo detectó la revisión, que corrió el `grep` ella misma.

**Patrón:** un agente puede afirmar de buena fe que verificó algo que no verificó.
Las afirmaciones de verificación no son verificación.

### 1.4 Describió versiones y rutas que no existían

El plan decía "Next.js 15"; lo instalado era 16.3.6. Decía que el servidor de
desarrollo corre en el puerto 5173 (el de Vite); en Next es el 3000. Decía que las
rutas desconocidas redirigen al inicio; en realidad hay una página 404.

Los tres los detectó el agente que escribía la documentación, porque se le dio una
instrucción explícita: **"si el brief no coincide con el repositorio, gana el
repositorio"**.

### 1.5 No puede verificar nada visual

Ningún agente puede abrir un navegador. Todo lo visual —responsive, contraste real,
navegación por teclado, que las cosas no se superpongan— quedó sin verificar.

Se sustituyó por lectura de código contra criterios explícitos, lo que **sirve pero
no equivale**. Por eso existe `docs/QA-MANUAL.md`: el checklist que tiene que correr
una persona en un navegador de verdad.

**Conclusión:** en un trabajo de frontend, una parte grande de la verificación sigue
siendo humana, y conviene que el proceso lo diga en vez de disimularlo.

---

## Parte 2 — Dónde funcionó mejor de lo esperado

### 2.1 Los implementadores se negaron a "arreglar" el código que recibían

Varias veces un agente recibió código del plan que tenía un problema, y en vez de
corregirlo en silencio **lo implementó como estaba y lo reportó**.

- El import sin usar que rompía el linter: *"lo dejé como está en vez de editar
  código provisto por el brief; la instrucción era específica sobre qué podía
  sobrescribir, y esto no estaba"*.
- Las clases CSS referenciadas pero no definidas: reportadas, no parcheadas.

**Por qué importa:** si los agentes hubieran "mejorado" el código a su criterio,
esos defectos habrían quedado ocultos en vez de subir a una decisión.

### 2.2 Se desviaron del plan cuando el plan estaba mal, y lo dijeron

Lo inverso del punto anterior, y lo notable es que distinguieran los dos casos.

- Un agente reemplazó un `useEffect` que el linter rechazaba por el patrón que
  recomienda la documentación de React, y avisó. Al revisarlo resultó **mejor que lo
  que decía el plan**: el menú cierra antes de pintar, sin un frame intermedio.
- Otro invirtió un media query de `max-width` a `min-width` por consistencia con el
  resto del proyecto, y movió los valores correctamente. La revisión lo verificó
  declaración por declaración.

### 2.3 Calcularon en vez de estimar

- El color de marca se obtuvo **muestreando el píxel real del logo** (`#5F0004`), no
  a ojo.
- Los ratios de contraste se computaron con la fórmula de luminancia relativa de
  WCAG, y la revisión **los recomputó de forma independiente** antes de aceptarlos.
  Ahí apareció que el valor viejo estaba por debajo del mínimo, no solo con poco
  margen.
- Un agente verificó con un script descartable que los enlaces y los ids de la carta
  coincidían en las diez categorías, en vez de deducirlo leyendo el código.

### 2.4 El ciclo de revisión atrapó cosas que un humano difícilmente vería

Dos ejemplos que no son errores de sintaxis ni los marca un linter:

- **El horario que cambiaba solo.** En reservas, elegir las 22:00 en un local y
  cambiar al otro hacía que el navegador cayera en la primera opción disponible, en
  silencio, sin disparar ningún evento. El formulario parecía funcionar.
- **El orden de lectura invertido.** En Nosotros, la galería estaba antes que el
  texto en el HTML y se movía por CSS. Visualmente correcto; para un lector de
  pantalla, las fotos antes del nombre del salón.

---

## Parte 3 — Lo que se aprendió sobre el método

### 3.1 Separar quien escribe de quien revisa cambia el resultado

Todos los defectos de la Parte 1 los encontró un agente **distinto** del que escribió
el código, con instrucciones de buscar problemas y sin saber qué se pretendía que
saliera bien.

Cuando la instrucción al revisor incluía "no marques esto, ya está decidido", se le
dijo qué estaba cerrado y por qué — pero nunca qué conclusión sacar sobre lo abierto.

### 3.2 Las reglas verificables por comando valen más que las reglas escritas

La regla "los locales son datos, no rutas" se convirtió en un `grep` que corre en cada
tarea. Lo mismo con "esta etapa no persiste nada" y "los colores salen de tokens".

Una regla en prosa se olvida. Una regla que falla un comando, no.

### 3.3 Un dato que falta se omite, no se inventa

El restaurante todavía no tiene teléfono ni link de carta cargados. En vez de poner un
placeholder que parezca real, la interfaz **esconde el botón de WhatsApp y dice
"Teléfono a confirmar"**.

Esto se sostuvo en todo el proyecto y se verificó en cada revisión. Cuando lleguen los
datos reales, se escriben en un archivo y aparecen solos.

### 3.4 Migrar temprano costó una tarea; migrar tarde habría costado ocho

El cambio de Vite a Next llegó con seis tareas hechas. Migrar en ese momento costó una
tarea. Postergarlo hasta el final habría significado escribir cada página pendiente
dos veces.

### 3.5 El registro tiene que escribirse mientras pasa

Este documento se pudo escribir porque hubo un ledger que anotó cada decisión con su
razón **en el momento**. Reconstruirlo al final, de memoria, habría perdido justo lo
más interesante: por qué se decidió algo cuando todavía no se sabía cómo iba a salir.

---

## Para la presentación

Si hay que elegir tres cosas para contar:

1. **La IA escribió un plan con diez defectos y no los vio al revisarse a sí misma.**
   Los encontró un revisor separado, con el código escrito. (Parte 1.1)
2. **Los agentes distinguieron entre "esto está mal en el plan, lo reporto" y "esto
   está mal en el plan, lo corrijo y aviso".** Esa distinción es más difícil de lo que
   parece y salió bien. (Parte 2.1 y 2.2)
3. **Lo visual sigue sin poder verificarse por IA.** El sitio compila, pasa todas las
   verificaciones automáticas, y aun así nadie confirmó todavía que se vea bien.
   (Parte 1.5)
