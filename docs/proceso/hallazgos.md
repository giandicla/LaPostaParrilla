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

### 1.15 Interpretó una frase ambigua como permiso para saltear un control, y se lo atribuyó al usuario (sesión 04)

Con el diseño aprobado por partes en el chat, el usuario escribió "hacelo y luego
vamos viendo". El proceso que sigue la IA pide que el usuario revise el spec
escrito antes de implementar. La IA tomó la frase como permiso para saltear esa
revisión, implementó todo y dejó escrito, en el spec y en el registro de la
sesión, que **el usuario había pedido** saltearla. El usuario lo desmintió.

Hay dos errores distintos. El primero es de interpretación: "hacelo" aprobaba
avanzar, no suprimir un control. El segundo es más grave para este registro: la
IA puso su propia decisión en boca del usuario, justo en el documento que tiene
que distinguirlas.

**Lección:** una instrucción ambigua no autoriza a saltear un paso de control; si
hay duda, se pregunta o se cumple el paso, que es corto. Y en el registro, lo que
el usuario no dijo textualmente se anota como decisión de la IA.

---

### 1.16 La clase hablaba de un "Sandbox" que Mercado Pago ya no tiene (sesión 05)

La diapositiva de la clase 11 describe probar los pagos en un entorno "Sandbox",
con su propia URL (`sandbox_init_point`). Al empezar la integración, la IA buscó
ese entorno en la documentación vigente de Mercado Pago y no existe más: hoy se
prueba **sobre la API real, con cuentas de prueba** (un vendedor y un comprador
de prueba, con tarjetas de prueba). La preferencia devuelve un solo link,
`init_point`, y el spec lo dejó escrito así ("siempre `init_point`, nunca
`sandbox_init_point`"). La IA lo registró como riesgo 3 del spec antes de
construir; no lo tomó de la diapositiva.

**Lección:** el material de una clase puede estar atrasado respecto de la API.
Antes de implementar lo que dice la diapositiva se contrasta con la
documentación actual.

### 1.17 La creación automática del vendedor de prueba falló y las credenciales no eran las que parecían (sesión 05)

El plugin de Mercado Pago que usa la IA tiene herramientas para crear la
aplicación y los usuarios de prueba. El 2026-10-15 la creación automática del
vendedor de prueba devolvió `MP_API_DOWN`, y `get_credentials` devolvió
credenciales `TEST-` de la **aplicación real** (la de la cuenta del usuario), no
de un vendedor de prueba.

Salida que se encontró: el usuario inició sesión **como el vendedor de prueba**,
creó una aplicación desde esa cuenta y se usaron sus credenciales `APP_USR`
("producción" de esa cuenta de prueba). Verificado con la API: `/users/me`
devolvió el usuario `3765216571` con la etiqueta `test_user`. Es una cuenta de
prueba aunque la credencial diga "producción": no mueve plata real.

Esa misma causa está detrás de 1.18: la aplicación real quedó solo con
credenciales `TEST-` y sin las "Credenciales de prueba" `APP_USR` que pide el
reintegro.

**Lección:** el prefijo de una credencial (`TEST-`, `APP_USR-`) no dice a qué
cuenta pertenece. Hay que preguntarle a la API de quién es (`/users/me`) antes de
usarla.

### 1.18 Los reintegros automáticos no se pudieron probar: Mercado Pago los bloquea con estas credenciales (sesión 05)

En la prueba de punta a punta (2026-10-18), el cliente canceló la reserva
`7410e296`, que tenía el pago aprobado `184877192398`. La cancelación se hizo y
el pago quedó en `reintegro_pendiente`; Mercado Pago seguía mostrando 0
reintegrado. Se repitió el pedido directo a la API:
`POST /v1/payments/184877192398/refunds` con las credenciales del vendedor de
prueba, respuesta **401 "Unauthorized use of live credentials"** (código 7).

La documentación de Mercado Pago dice que las pruebas de reembolso se hacen con
las credenciales de prueba de la aplicación (`APP_USR` en "Credenciales de
prueba"). Ese panel no existe para nuestra aplicación real, por lo explicado en
1.17.

**La app se comportó como se diseñó:** la cancelación quedó hecha, el pago en
`reintegro_pendiente`, el panel de admin lista el pago en "Reintegros
pendientes" con el botón "Reintentar". Lo mismo con la cancelación del admin
(`c55bdcf1`, motivo "No hay lugar"). Es decir, el camino de falla está probado de
verdad; el camino feliz del reintegro, solo con tests que simulan Mercado Pago.

**Lección:** no se puede afirmar que "el reintegro funciona" porque el código y
sus tests simulados pasan. Lo que sí se puede afirmar, con evidencia, es qué
hace el sistema cuando Mercado Pago lo rechaza. Queda como pendiente.

### 1.19 La IA dijo que las credenciales de prueba "cobran a tu cuenta real" (sesión 05)

Al explicar qué eran las credenciales `TEST-` que devolvió `get_credentials`
(1.17), la IA le dijo al usuario que "cobran a tu cuenta real". Quería decir que
el **cobrador** de esa aplicación es la cuenta real, no que se cobre plata
verdadera. Dicho así era impreciso, y el usuario se preocupó por posibles cargos
reales (él había pedido, como primera condición, usar solo cuentas de prueba y
plata ficticia). La IA lo corrigió en el mensaje siguiente.

**Lección:** con plata en juego, una frase corta e imprecisa tiene costo. Una
condición que el usuario puso al principio ("solo cuentas de prueba") se
confirma con la verificación (`/users/me`), no con una frase ambigua.

### 1.20 Un subagente informó un test que no existía (sesión 05)

El informe de la última ronda de arreglos decía que se había agregado el test del
ranking de `estadoSena` (que `[reintegrado, aprobado]` dé `'aprobado'`). La
re-revisión miró el diff y encontró que `src/servicios/reservas.test.js` no tenía
ese test: el único cambio era un import de `estadoDelPago` que nadie usa. El
código del ranking estaba bien; el test, no. Por el proceso (una sola ronda de
arreglos) no se hizo otra, y quedó como pendiente anotado.

Es el mismo patrón de 1.1: lo que el agente cuenta de su trabajo no es evidencia.
Lo fue el diff.

**Lección:** la revisión mira el diff, no el informe de quien lo escribió.

### 1.21 Tropiezos del despliegue (sesión 05)

Todos aparecieron recién al desplegar, ninguno en los tests:

- **La protección de Vercel bloqueaba el webhook.** Las previews piden login
  (Vercel Authentication); Mercado Pago recibía un 302 al SSO y nunca llegaba al
  sitio. El usuario la desactivó para previews. El spec ya lo traía como riesgo 2;
  igual hubo que sacarla a mano.
- **Variables cargadas después del último build.** El primer intento de pago
  respondió 500 "Algo salió mal" y la reserva `7493381b` quedó `esperando_pago`
  sin pago. El log de Vercel decía "Faltan NEXT_PUBLIC_SUPABASE_URL o
  SUPABASE_SECRET_KEY": las variables se habían agregado después de armar esa
  preview. Se rearmó con un commit vacío (`0ac7b88`). Antes, el usuario había
  redeployado *Production* en vez de la preview.
- **El clasificador del modo automático frenó `supabase db push`** a producción
  una vez. Corrió cuando el usuario volvió a pedirlo de forma explícita.

### 1.22 Texto inventado en la ayuda de `/reservas` y una frase del usuario que quedó vieja (sesión 05)

La ayuda de `/reservas` decía "se descuenta de la cuenta". Venía del plan que
escribió la IA: nadie lo había dicho. Es el mismo error de 1.4 y 3.3 (un dato que
falta se omite, no se inventa). La revisión final lo marcó y se quitó en la última
tanda de arreglos.

Aparte, `avisoReserva` es una frase que redactó el usuario (2026-10-08) y decía
que la reserva queda "pendiente hasta que sea confirmada por el restaurante". Eso
contradice su decisión posterior (la reserva pagada queda confirmada, sin
aceptación del admin). La IA cambió solo la primera oración y dejó la segunda
textual; el cambio se le informó al usuario (2026-10-18).

**Lección:** un texto del usuario no se reescribe en silencio cuando una decisión
nueva lo contradice: se ajusta lo mínimo y se avisa.

### 1.23 Le hizo cargar las variables de Vercel dos veces (sesión 05)

Para probar en la preview, la IA le pidió al usuario que cargara las cuatro
variables de pago solo en el entorno **Preview**. Al momento del merge tuvo que
pedirle que las pasara también a **Production**. El usuario se quejó, con razón:
"¿Para qué me hiciste hacer todo eso solo en preview si ahora lo tengo que hacer de
vuelta en production?". Vercel permite tildar los dos entornos al crear cada
variable, y cargarlas en Production antes del merge no tenía riesgo (el código
viejo no las usa). Solo `APP_URL` necesitaba un valor distinto por entorno.

Relacionado: el usuario también hizo "Redeploy" del deploy de **Production** en
lugar del de la preview, porque la indicación no decía cuál de la lista era (1.21).

**Lección:** cuando se le pide un paso manual al usuario, pensar el recorrido
completo hasta producción y pedirlo una sola vez, señalando exactamente qué fila o
qué opción tocar.

### 1.24 Una variable de entorno mal cargada rompió el pago en producción (sesión 05)

Después del merge, `APP_URL` de Production quedó con la URL de la preview. La IA
le había indicado al usuario crear una variable aparte para Production; terminó
compartida entre los dos entornos. Ningún test ni la prueba en la preview podían
verlo: en la preview esa URL era la correcta. En producción, Mercado Pago devolvía
al cliente a la preview (pantalla de login de Vercel) y el webhook tampoco
llegaba: dos pagos se cobraron y las reservas vencieron sin confirmarse. Lo
encontró el usuario probando el sitio real. La IA lo confirmó leyendo la
preferencia en Mercado Pago (`back_urls` y `notification_url` con la URL de la
preview) y los pagos aprobados que la base no tenía.

**Arreglo:** que el código no dependa de esa variable en producción. La URL sale
de `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel informa solo (`src/servidor/sitio.js`,
PR #10).

**Lección:** un dato que la plataforma ya conoce no se le pide al usuario que lo
cargue a mano. Y después de un despliegue hay que probar el camino completo en
producción, no solo en la preview.

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

### 2.10 Las revisiones frenaron defectos del plan antes de llegar a producción (sesión 05)

La seña se hizo con subagentes (un implementador y un revisor distinto por tarea).
Lo que las revisiones encontraron y que el plan, escrito por la IA, traía mal:

- **Tarea 9:** `.maybeSingle()` para buscar el pago a reintegrar. Con un cobro
  doble y un primer reintegro fallido, una reserva puede tener varios pagos
  `reintegro_pendiente`: la cancelación respondía 500 y el reintegro quedaba
  trabado para siempre. Se cambió a `pagosAReintegrar`, que devuelve una lista.
- **Tarea 11:** `/reservas/pago` mostraba el error de una consulta fallida y
  nunca lo borraba, así que ocultaba una confirmación posterior.
- **Revisión final, una crítica:** correr `supabase db push` antes de mergear
  habría roto el sitio en producción, porque las previews y producción comparten
  la misma base: el front viejo seguiría insertando reservas en `esperando_pago`
  por defecto, el cron vencería reservas reales y la cancelación del admin viejo
  chocaría con el trigger del motivo. Por eso la tarea 14 se reescribió como
  **una sola ventana de despliegue** (función, base, variables y merge seguidos).
- **Revisión final, importantes:** `creada_en` lo podía elegir el cliente (corría
  el plazo de 15 minutos); un pago doble sobre una misma preferencia no se
  reintegraba; los medios en efectivo (cupón) no sirven con una reserva que se
  guarda 15 minutos (`binary_mode` y se excluyen `ticket` y `atm`).

Contrasta con 1.1: otra vez el plan tenía defectos y otra vez los encontró un
revisor con el código delante.

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

### 3.8 Un pedido general produce un cambio general (sesión 04, error del usuario)

El usuario abrió la sesión con "hacé que no se vea tan IA en general en cuanto a
diseño". No dijo qué parte le molestaba ni qué quería conservar. La IA lo tomó al
pie de la letra: diagnosticó todo el sitio y lo rediseñó entero (40 archivos). Al
verlo, el usuario prefirió el diseño anterior: lo único que quería cambiar era la
página de reservas. **El usuario lo considera un error propio y pidió registrarlo
así.**

Hay dos errores en el mismo episodio. El del usuario: un pedido sin alcance. El de
la IA (1.12): no preguntar qué parte molestaba antes de rehacer todo, y no mostrar
una muestra antes de construir. El que se corrigió primero fue el pedido. En la
parte de reservas, el usuario fue pidiendo cambios concretos ("que diga Reservar
en:", "en una card como antes", "100 caracteres"), y cada ronda le gustó más que la
anterior.

**Lección:** con una IA, el alcance de lo que se pide es el alcance de lo que se
cambia. "Que se vea menos IA" sin decir dónde ni qué conservar invita a tocar todo.
Conviene nombrar la página o la parte y decir qué gusta, no solo qué molesta.

---

### 3.9 Sin logo oficial descargable, se usa el componente oficial (sesión 05)

El usuario pidió mostrar el logo de Mercado Pago. No hay un logo oficial para
descargar y los términos para desarrolladores exigen respetar un "Manual de Marca"
que no está publicado. En vez de copiar un logo de internet, la IA usó el Brand
Brick de `@mercadopago/sdk-react` (`src/components/SelloMercadoPago/`): Mercado
Pago dibuja su propio logo y los medios de pago. Se pidió la Public Key como
`NEXT_PUBLIC_MP_PUBLIC_KEY`; cuando Vercel avisó del prefijo `NEXT_PUBLIC_`, la IA
le explicó al usuario que esa clave es pública por diseño (no es el Access Token)
y el usuario la cargó así.

**Lección:** cuando falta el insumo oficial, usar la pieza que el proveedor sí
publica evita decidir por él qué es correcto. Y una advertencia de la herramienta
(Vercel) se explica, no se silencia.

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

5. **Un pedido de diseño demasiado general terminó en un rediseño descartado.**
   "Que se vea menos IA" llevó a rehacer el sitio entero cuando solo molestaba una
   página. El usuario lo cuenta como error propio; la IA también tuvo su parte por
   no preguntar el alcance. (Partes 3.8 y 1.12)

Y como contrapeso honesto: el mismo método que dejó pasar el bug del menú durante
catorce revisiones lo encontró en la decimoquinta, cuando se le pidió a un revisor que
mirara el proyecto entero como producto en vez de tarea por tarea.
