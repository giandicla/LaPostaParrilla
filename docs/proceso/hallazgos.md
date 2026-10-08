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

### 1.2 El checklist de verificación estaba escrito de forma que ocultaba un bug

**Este es el hallazgo más interesante de todo el proyecto.**

Después de que las catorce tareas pasaran su revisión individual, una revisión general
de toda la rama encontró un bug **Critical**: en un celular no se podía cerrar el
menú.

La causa es una regla de CSS fácil de pasar por alto. El botón hamburguesa declaraba
`z-index: 2` pero no declaraba `position`. Sin `position`, el `z-index` **se ignora
por completo**. El panel del menú, que es `position: fixed` con fondo opaco, quedaba
pintado encima del botón: la X no se veía ni se podía tocar.

Lo que hace al caso valioso no es el bug, es **por qué sobrevivió a catorce
revisiones**:

El checklist de QA manual que la propia IA había escrito decía:

> Con el panel abierto, apretá `Escape` y confirmá que se cierra.

Escape **funcionaba**. Lo que nunca se testeaba era cerrar el menú tocando la X —
que es la única forma que existe en un teléfono, donde no hay tecla Escape.

Es decir: **la IA escribió el código con el bug, y después escribió el checklist de
verificación de manera que ese bug no se podía encontrar.** No por mala fe: verificó
lo que sabía que había implementado (Escape), no lo que un usuario real iba a hacer
(tocar la X).

Había además un agravante que confirma el patrón: el panel solo cerraba al cambiar de
ruta, así que tocar el link de la página en la que ya estabas tampoco lo cerraba. Un
usuario de celular quedaba encerrado.

**Conclusión para la materia:** cuando la misma fuente escribe el código y su plan de
pruebas, las pruebas tienden a cubrir lo que el autor pensó, no lo que falta. Un
checklist de verificación **hereda los puntos ciegos de quien lo escribe**. Esto vale
igual para una persona; la IA simplemente lo hace a mayor velocidad y con más
confianza aparente.

### 1.3 Eligió mal el contenido destacado, y nadie lo notó hasta el final

La home tiene un bloque de platos destacados. La IA lo implementó tomando una
**rebanada por posición** del menú de cada local (`.slice(1, 3)`), en vez de marcar
cuáles destacar.

Resultado, en el bloque estrella de una parrilla: *empanadas* y *tabla de ahumados*.
Dos entradas. Ni cordero al asador ni bife de chorizo — justo lo que el propio texto
del local promete.

El código era correcto: devolvía cuatro platos, dos por local, con el formato
esperado. Todas las verificaciones automáticas pasaban. **Lo que estaba mal era el
criterio**, y ninguna verificación técnica puede detectar eso.

Lo encontró la revisión final porque tenía instrucción de mirar el proyecto como
producto, no como código.

### 1.4 Falló al asumir datos personales sin preguntar

El asistente configuró el repositorio con `gianfrancodicla@gmail.com`, tomado de la
configuración de Claude Code, sin preguntar qué cuenta correspondía. El repositorio
era de la cuenta de la facultad.

**Consecuencia:** Vercel bloqueó el despliegue por autoría no autorizada, y hubo que
reescribir la autoría de 13 commits.

**Patrón:** la IA tenía un dato disponible y lo usó como si fuera el correcto, sin
verificar que aplicara a este contexto.

### 1.5 Falló al escribir documentación sobre su propio código

`ESTRUCTURA.md` afirmaba una regla sobre qué componentes importan datos. Era falsa, y
el agente que escribió el archivo la transcribió del plan sin chequearla contra el
código — a pesar de que en su reporte afirmó haber verificado "props de componentes
contra el código".

Lo detectó la revisión, que corrió el `grep` ella misma.

**Patrón:** un agente puede afirmar de buena fe que verificó algo que no verificó.
Las afirmaciones de verificación no son verificación.

### 1.6 Describió versiones y rutas que no existían

El plan decía "Next.js 15"; lo instalado era 16.3.6. Decía que el servidor de
desarrollo corre en el puerto 5173 (el de Vite); en Next es el 3000. Decía que las
rutas desconocidas redirigen al inicio; en realidad hay una página 404.

Los tres los detectó el agente que escribía la documentación, porque se le dio una
instrucción explícita: **"si el brief no coincide con el repositorio, gana el
repositorio"**.

### 1.7 No puede verificar nada visual

Ningún agente puede abrir un navegador. Todo lo visual —responsive, contraste real,
navegación por teclado, que las cosas no se superpongan— quedó sin verificar.

Se sustituyó por lectura de código contra criterios explícitos, lo que **sirve pero
no equivale**. Por eso existe `docs/QA-MANUAL.md`: el checklist que tiene que correr
una persona en un navegador de verdad.

**Conclusión:** en un trabajo de frontend, una parte grande de la verificación sigue
siendo humana, y conviene que el proceso lo diga en vez de disimularlo.

### 1.8 Midió bien, pero midió la fuente equivocada (sesión 02)

En la sesión 1 el asistente midió el bordo del logo con un script en vez de
estimarlo: `#5F0004`. Se registró como acierto (2.3). Cuando llegó el manual de
marca, el bordo oficial resultó ser `#600003`: una unidad de diferencia por canal,
efecto de la compresión JPEG de un logo de 150px.

El error es chico en el color y grande en el método: **medir un derivado no
reemplaza a la fuente**. El dato correcto no estaba disponible en la sesión 1, pero
el registro lo presentó como "el color real", sin marcar que venía de un JPEG de baja
calidad. Corregido en `src/styles/tokens.css` (sesión 02).

### 1.9 El login con Google: la IA dijo que no se podía y lo resolvió un compañero (sesión 02)

**El error más visible de la segunda sesión.** Al configurar el ingreso con Google,
la IA le aseguró al usuario que, sin publicar la app en Google, **solo podrían
entrar los mails cargados como usuarios de prueba**, y que para abrirla a todos
había que armar una **página de privacidad** y pasar por la publicación. Cuando el
usuario preguntó si se podía hacer como lo había hecho un compañero, la IA instaló
la CLI de Google para investigar y concluyó que **por ese lado no se podía**.

Lo destrabó el compañero: su conversación mostraba el camino (cliente creado en la
consola, `supabase config push`, **sin publicar nada**). Con eso el usuario ingresó,
y después entró **con una cuenta personal de Google que nunca había registrado como
usuario de prueba**. La restricción que la IA había anunciado no existía en la
práctica, y el trabajo extra que proponía (privacidad, publicación) sobraba.

Lo que falló no fue un dato técnico aislado (lo de la CLI de Google era cierto),
sino el método: **afirmar una limitación sin probarla** y **buscar la respuesta
investigando en vez de preguntar** por la experiencia que ya tenía alguien al lado.
La prueba que desmintió a la IA le llevó un minuto al usuario.
Detalle completo: `sesion-02-2026-10-01.md`, sección 10.

### 1.10 No advirtió que los mails de confirmación no iban a llegar (sesión 02)

La IA propuso registro con email y contraseña además de Google, y no avisó que el
servidor de mails de fábrica de Supabase solo entrega a los miembros del equipo
del proyecto: ningún cliente iba a recibir la confirmación. Salió a la luz cuando
el usuario preguntó por esos mails, ya en producción. El usuario decidió quedarse
solo con Google (`sesion-02-2026-10-01.md`, sección 9).

---

### 1.11 Una regla escrita por la IA quedó vieja y nadie la marcó como provisoria (sesión 03)

`CLAUDE.md` decía, como regla dura, "no se escriben API routes", y `CONTEXTO.md` "no
hay base de datos". Venían de la consigna de la etapa 1 ("solo hacé el React del
front"). La rúbrica oficial pide API interna y webhook de pagos. Si no se cruzaba la
rúbrica con los docs, la IA de una sesión futura habría seguido la regla vieja y
rechazado justo lo que se evalúa. El README tenía el mismo problema: decía "el
formulario es maqueta" con las reservas en producción hacía dos días.

**Lección:** una restricción que depende de la etapa tiene que escribirse con su
fecha y su motivo ("hasta que se dé X en clase"), no como regla permanente. Los
archivos de contexto para la IA son código: se desactualizan y hay que revisarlos.

---

### 1.12 Un rediseño aprobado por escrito que el usuario descartó al verlo (sesión 04)

La IA diagnosticó por qué el sitio "se ve hecho por IA" y propuso una dirección
nueva ("la carta y el cartel": fondo blanco, hero partido, sin tarjetas ni
sombras). El usuario la aprobó con un "si", la IA rediseñó **todo el sitio de una
vez** (40 archivos, [PR #5](https://github.com/giandicla/LaPostaParrilla/pull/5)) y,
al verlo, el usuario contestó: "La anterior versión me gustaba más". El PR se
cerró sin mergear. De todo el rediseño, lo único que quería cambiar era la página
de reservas.

Un texto con decisiones de diseño ("fondo papel", "hero partido") no se puede
juzgar como el resultado. El "si" aprobó una descripción, no un sitio.

**Lección:** en diseño visual hay que mostrar antes de construir: una página
rehecha, o una maqueta de una sección, y recién después extenderlo al resto. Y
preguntar qué parte molesta antes de proponer un rediseño general.

---

### 1.13 Una comparación con null que la migración nueva habría vuelto un agujero (sesión 04)

`cancelar_reserva()` (sesión 02) verificaba el dueño con `r.usuario_id <> auth.uid()`.
Era correcto mientras `usuario_id` no podía ser nulo. Para las reservas del local,
la sesión 04 lo hizo opcional: con `null`, la comparación da `null`, el `if` no
frena y **cualquier cliente habría podido cancelar una reserva del local**
conociendo su id. Se vio al planear la migración. Antes de arreglarlo se escribió
el test y se lo vio fallar ("caught: no exception", en
`04_reservas_del_local.test.sql`). Después se cambió a `is distinct from`.

**Lección:** al relajar un `not null`, hay que revisar cada comparación con esa
columna en funciones `security definer`: `<>` y `=` con `null` no dan falso, dan
`null`.

---

### 1.14 "Mis reservas" del admin mostraba las reservas de todos (sesión 02, visto en la 04)

`obtenerMisReservas()` no filtraba por usuario: confiaba en la RLS, que a un
cliente le devuelve solo las suyas pero a un admin le devuelve todas. Desde la
sesión 02, el admin veía en "Mis reservas" las reservas de todos los clientes. Se
encontró al leer el código para sacarle esa página al admin. Ahora filtra por
`usuario_id`.

**Lección:** la RLS es el piso de seguridad, no el filtro de la pantalla. "Lo mío"
se pide explícitamente, aunque para la mayoría de los usuarios dé igual.

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

### 2.5 Corrección de 1.7: esta vez sí verificó lo visual (sesión 02)

El punto 1.7 dice que ningún agente puede abrir un navegador. En la sesión 02 el
asistente encontró Playwright instalado en la máquina y lo usó: capturas de las
cuatro páginas en desktop (1440px) y mobile (390px), y una prueba del visor de carta
por código — clic en las flechas, teclado, miniaturas, swipe táctil simulado y
reinicio de hoja al cambiar de local, con cero errores de consola.

Lo que 1.7 describía no era un límite de la IA sino **del entorno de esa sesión**.
Las capturas además encontraron problemas reales que la lectura de código no
mostraba: la bajada del hero partida en una línea incómoda y las flechas del visor
fuera de la pantalla en desktop (la hoja mide más que la ventana). Las dos se
corrigieron.

Y también mostraron sus propias trampas (ver `sesion-02-2026-10-01.md`, "Qué
falló"): una captura con la ventana mal dimensionada, otra contra un servidor viejo,
y un falso positivo de imágenes rotas. **Una captura también hay que leerla con
desconfianza.**

### 2.6 El recorrido de punta a punta encontró lo que los tests de la base no podían (sesión 02)

Los 33 tests de la base probaban las reglas (quién ve qué, cuándo se puede
cancelar). Todos en verde. El recorrido con Playwright, sobre el sitio real,
encontró **cuatro bugs de interfaz** que ningún test de la base podía ver: una
condición de carrera que vaciaba la lista del panel, una fila que se remontaba y
perdía un formulario abierto, un aviso de día bloqueado desactualizado y un navbar
que no entraba en tablets (ver `sesion-02-2026-10-01.md`, sección 8).

La lección es de capas: la seguridad se prueba en la base; la experiencia, en el
navegador. Ninguna reemplaza a la otra.

### 2.7 Prueba de mutación para compensar un TDD incompleto (sesión 02)

Los tests de la base se escribieron antes que la migración, pero nunca se los vio
fallar antes de implementar. Un test que nunca falló no prueba nada: podría pasar
siempre. Se rompieron dos reglas a propósito (índice único y política de notas) y
fallaron justo los tests que debían. Es una forma barata de recuperar la garantía
que da el "rojo primero" cuando no se hizo.

---

### 2.8 Corrigió su propio diseño aprobado antes de que hiciera daño (sesión 03)

El diseño de la validación, aprobado por el usuario, decía "un `check` de formato de
teléfono en la base". Al escribir la migración, la IA vio que un `check` se evalúa
en cada update: una reserva vieja de producción con teléfono corto ya no se podría
confirmar. Lo cambió por un trigger que solo corre al insertar o al cambiar el
teléfono, lo avisó, y escribió un test que lo demuestra
(`supabase/tests/database/03_validacion_contacto.test.sql`). La aprobación del
usuario no se usó como excusa para seguir con algo que estaba mal.

---

### 2.9 Un diagnóstico de diseño con un criterio explícito encontró lo que faltaba (sesión 04)

La sesión 03 diagnosticó a ojo "por qué se ve hecho por IA". La sesión 04 lo
repitió con el plugin de diseño, que trae una lista concreta de señales de diseño
generado, y sin leer el diagnóstico anterior.

| Señal | Sesión 03 (a ojo) | Sesión 04 (con el plugin) |
|---|---|---|
| Misma plantilla en todas las secciones | Sí | Sí |
| Tarjetas con sombra y chip | Sí | Sí |
| Hero genérico con velo | Sí | Sí |
| Botones en mayúsculas espaciadas | Sí | Sí |
| Tríada de valores en tres columnas | Sí | No |
| **Fondo crema** `#F6F2EC`, casi igual al `#F4F1EA` que el plugin marca como la señal número 1 | **No** | Sí |
| Puntos medios como separador ("A · B · C") | No | Sí |
| Zoom o saltito en cada tarjeta y botón | No | Sí |
| Selector en forma de píldora con sombra | No | Sí |
| Fotos que cargan como huecos | Sí | No |
| Falta de gente y reseñas | Sí | No |

El crema lo agregó la IA en la sesión 02, en el mismo commit que aplicó el manual de
marca (`fa1efdf`), aunque el manual pide "bordo + blanco". Mirando a ojo, la IA no
reconoció como señal algo que ella misma había elegido por defecto.

**Lección:** para que una IA revise su propio trabajo hay que darle un criterio
externo (una lista, una rúbrica, el manual). Pero un diagnóstico correcto no
garantiza un resultado que guste: ver 1.12.

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

### 3.6 Lo que está impreso no siempre es para publicar (sesión 02)

La carta de la parrilla tiene impresas la red y la clave del WiFi del local. El
pedido era mostrar la carta "tal cual". El asistente la tapó igual, en las imágenes
y en el PDF descargable, y lo avisó para que el usuario decida.

Es una decisión que el pedido literal no cubría: el papel está pensado para quien
está sentado en la mesa; la web, para cualquiera. Vale como ejemplo de que "tal cual"
tiene límites que conviene marcar en vez de ejecutar a ciegas.

**Y la segunda mitad del hallazgo:** la tapó en una sola carta. La misma clave estaba
en la carta de La Posta II, y la encontró el usuario, no la IA. Detectar un problema
por observación (mirar una captura) y no generalizarlo con una búsqueda en todos los
archivos dejó el arreglo a medias, y lo publicó. Cuando aparece un problema en un
archivo, la pregunta siguiente es **dónde más está**.

### 3.7 Ante un test que falla, primero mirar la evidencia (sesión 02)

En el recorrido de Playwright hubo más fallos **del test** que del sitio. La
diferencia la hizo mirar la base y los logs antes de tocar código: cuando un paso
falló, la base mostraba la reserva confirmada (el sitio funcionaba, el selector del
test estaba mal); cuando Realtime "falló", su log mostraba que se estaba
reiniciando. Corregir el código a ciegas habría metido cambios innecesarios.

---

## Para la presentación

Si hay que elegir tres cosas para contar:

1. **La IA escribió el checklist de pruebas de manera que su propio bug no se podía
   encontrar.** Testeaba cerrar el menú con Escape —que funcionaba— y nunca tocando
   la X, que es la única forma en un celular. El bug sobrevivió catorce revisiones.
   (Parte 1.2)
2. **La IA escribió un plan con diez defectos y no los vio al revisarse a sí misma.**
   Los encontró un revisor separado, con el código ya escrito. (Parte 1.1)
3. **Hay errores que ninguna verificación automática puede detectar.** Los platos
   destacados de la parrilla eran dos entradas: el código era correcto, el criterio
   estaba mal. (Parte 1.3)
4. **La IA dijo que el login con Google tenía una restricción que no existía, y el
   camino lo encontró un compañero.** La IA afirmó que sin publicar la app solo
   entrarían usuarios de prueba y propuso trabajo extra para evitarlo; siguiendo lo
   que había hecho un compañero, el usuario entró con una cuenta cualquiera sin
   registrarla. Lección: una limitación se prueba antes de recomendar cómo
   esquivarla. (Parte 1.9)

Y como contrapeso honesto: el mismo método que dejó pasar el bug del menú durante
catorce revisiones lo encontró en la decimoquinta, cuando se le pidió a un revisor que
mirara el proyecto entero como producto en vez de tarea por tarea.
