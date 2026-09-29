# Ledger crudo de la sesión 01

Este es el registro **tal como se escribió durante la ejecución**, sin editar. Es la
fuente de la que salió `sesion-01-2026-09-24.md`.

Se conserva porque muestra algo que un relato ordenado pierde: las decisiones fueron
tomadas **en el momento, sin saber cómo iban a salir**. Cada bloque `Ruling:` explica
qué se decidió, por qué, y qué costaba si estaba mal.

Está en taquigrafía y sin acentos porque se escribió para sobrevivir a la pérdida de
contexto de la sesión, no para leerse. Para la presentación conviene usar
`hallazgos.md`; esto es el respaldo verificable.

---

# SDD ledger — plan: docs/superpowers/plans/2026-09-24-boceto-visual.md

Spec: docs/superpowers/specs/2026-09-24-la-posta-web-design.md (leído — autoridad vinculante)
Base del branch: 03bd104 (main)

## Pre-flight scan

### Pares de tareas que comparten archivo o interfaz

| A | B | Produce → Consume | Hallazgo |
|---|---|---|---|
| 1 | 2 | `src/main.jsx` creado → modificado para importar estilos | OK |
| 1, 2 | 4 | `src/main.jsx` → reescrito con el router | OK — el main.jsx de T4 conserva los dos imports de estilos de T2 |
| 1 | 4 | `src/App.jsx` placeholder → layout real | OK, reemplazo intencional |
| 1 | 3 | `package.json` creado → se le agrega el script `placeholders` | OK — corregido en self-review para no pisar `lint` |
| 3 | 4,6,7,8,9,10,11,12 | `LOCALES`, `getLocal`, `esIdDeLocal`, `ID_LOCAL_POR_DEFECTO`, `getCarta`, `getDestacados`, `formatearPrecio`, `MARCA`, `TEXTOS` | OK — nombres verificados uno a uno contra cada uso |
| 3 | 7 | `public/img/<id>/card.svg` → `LocalCard` lo referencia | OK — el generador crea `card.svg` por local |
| 3 | 8 | `plato-1.svg`, `plato-2.svg` → `getDestacados()` arma `plato-${i+1}.svg` | OK — i∈{0,1} |
| 4 | 6,10,11,12 | Stubs de página → reemplazados por las páginas reales | OK |
| 5 | 6,7,8,9,10,11,12 | `Boton`, `Section` | OK |
| 5 | 6 | T5 pisa `Inicio.jsx` con un render de prueba | **Hallazgo 1** (abajo) |
| 6 | 7,8,9 | `Inicio.jsx` + `Inicio.module.css` → se les agregan secciones | OK, aditivo |
| 6 | 10,11,12 | `Hero` con `compacto` | OK — props verificadas |
| 9 | 12 | `GaleriaGrid`, `InfoLocal` | OK — `GaleriaGrid` se crea en T9 y se usa recién en T12; el plan lo dice |
| 13 | 14 | `docs/BITACORA.md` creado → se le agrega la verificación final | OK |

### Consistencia interna por tarea

| Tarea | ¿Su texto concuerda consigo mismo? |
|---|---|
| 1 | Sí. Borra `index.css`/`App.css` y reescribe los dos archivos que los importaban |
| 2 | Sí. `global.css` solo usa variables que `tokens.css` define |
| 3 | **Hallazgo 2** — la verificación espera un string exacto de moneda |
| 4 | Sí. Las 4 rutas del router coinciden con los 4 stubs creados |
| 5 | Sí |
| 6 | Sí. El `svh` del CSS es justamente lo que verifica el chequeo mobile |
| 7 | Sí. El grep de la verificación es coherente con lo que el componente hace |
| 8 | Sí |
| 9 | Sí. El caso "restaurante sin teléfono" está en el código y en la verificación |
| 10 | Sí. El fallback de `?local=` inválido está implementado y verificado |
| 11 | Sí. El grep anti-persistencia coincide con lo que el código no hace |
| 12 | Sí |
| 13 | Sí |
| 14 | **Hallazgo 3** — el grep de colores vs. la redacción de Global Constraints |

### Hallazgos y rulings

**Hallazgo 1 — T5 deja `Inicio.jsx` sucio.**
El paso de verificación de T5 pisa `Inicio.jsx` con un render de prueba y pide
restaurarlo. Su `git add` es acotado a `src/components/`, así que un descuido deja
el árbol sucio al entrar a T6.
`Ruling: aceptable, no se cambia el plan — T6 reescribe Inicio.jsx entero, así que
un resto de la prueba no puede sobrevivir. Se le avisa al implementer de T5 que
restaure antes de commitear. Si sale mal: un commit con un render de prueba, que T6
borra en el commit siguiente.`

**Hallazgo 2 — T3 espera `precio: $ 27.000` textual.**
`Intl.NumberFormat('es-AR')` usa espacio duro entre el signo y el número, y la
salida exacta puede variar según la versión de ICU de Node.
`Ruling: el criterio es semántico, no byte a byte — pesos argentinos, separador de
miles de punto, sin decimales. Un espacio duro en vez de uno común pasa igual. Si
sale mal: el implementer persigue un fallo que no existe y pierde una vuelta.`

**Hallazgo 3 — "ningún color literal" vs. los `rgba()` del plan.**
Global Constraints dice "Ningún color literal en un `.module.css`", pero el plan usa
`rgba()` para los velos del hero y las sombras, y el grep de T14 solo busca hex.
`Ruling: la restricción se lee como "ningún color hexadecimal"; los rgba() con alfa
quedan permitidos, porque son transparencias sobre foto y sombras, no colores de
marca, y un token no puede llevar un alfa variable. El grep de T14 queda como está.
Si sale mal: unas pocas transparencias fuera del sistema de tokens, cambiables a
mano.`

**Ruling — se trabaja en `main`, sin worktree.**
`El repo es nuevo, sin otros colaboradores, y la Task 1 del plan empuja main a
propósito para destrabar el enlace con Vercel, que era el problema original. Un
worktree con otro branch rompería justamente eso. El usuario aprobó el plan con ese
paso adentro. Si sale mal: se revierte con git, no hay nada publicado que dependa
del historial.`

**Ruling — el paso de Vercel de la Task 1 no lo hace un subagente.**
`El Step 9 es trabajo manual en el navegador (autorizar GitHub, importar el repo).
Ningún agente puede hacerlo. El implementer hace los pasos 1-8 y deja el push hecho;
el enlace con Vercel se lo paso al usuario para que lo haga él. Si sale mal: el
deploy queda pendiente unos minutos, sin bloquear ninguna tarea posterior.`

---

## Progreso

Task 1: implementado, commit fb63e53 (pusheado a origin/main). Review despachada.

**Ruling — se acepta el scaffold moderno de Vite en vez del que asumia el plan.**
`El plan asumia Vite 6 + ESLint; create-vite hoy entrega Vite 8.3 + oxlint, y el
script de lint quedo "lint": "oxlint". Se acepta: oxlint es devDependency propia del
scaffold de Vite, asi que no viola la restriccion de dependencias, y las tres
dependencias de runtime quedaron exactamente react, react-dom y react-router-dom.
Consecuencia a arrastrar: en la Task 3 NO hay que escribir "lint": "eslint ." como
dice el plan — hay que conservar el "lint": "oxlint" existente. En la Task 14,
npm run lint corre oxlint. Si sale mal: el lint no corre y se arregla cambiando una
linea de package.json.`
Task 1: minor (deferred): el mensaje de commit menciona el esqueleto de carpetas de
  public/img/, pero git no versiona directorios vacios — no estan en el repo remoto.
  Se resuelve solo en Task 3, cuando el generador escribe los SVG adentro.
Task 1: el item "no verificable desde el diff" era el enlace con Vercel (Step 9).
  Resuelto por el ruling previo: es trabajo manual del usuario, no un gap.
Task 1: complete (commits 03bd104..fb63e53, review clean)
Task 2: implementado, commit 2db67a5 (build + lint ok). Review despachada.
Task 2: complete (commits fb63e53..2db67a5, review clean)
Task 3: implementado, commit 8c7a81c. Reportado DONE_WITH_CONCERNS: warning de oxlint
  por import sin usar (`join` de node:path) en scripts/gen-placeholders.mjs.

**Ruling — el import sin usar es defecto del plan, se corrige antes de la review.**
`El script del plan importa join y nunca lo usa. El implementer hizo bien en no
desviarse del codigo provisto y reportarlo. Se quita join del import; dirname es lo
unico que el script usa. Se corrige por amend en vez de commit nuevo: un commit
"remove unused import" encima del commit que lo introdujo es ruido en el historial.
Si sale mal: el historial queda con un amend, sin consecuencias, nada estaba pusheado.`

**Ruling — se pushea a main despues de cada tarea.**
`El implementer dejo el commit local por prudencia. El repo es del usuario, recien
creado y sin otros colaboradores, y todo el sentido de enlazarlo a Vercel es que un
push a main redespliegue solo. Retener commits rompe ese flujo. Autorizacion
durable para el resto del proyecto. Si sale mal: se revierte con git revert; no hay
consumidores del branch.`
Task 3: review — spec OK, calidad aprobada, 2 Important + 1 Minor.

**Ruling — MARCA.nombreCorto: el codigo se queda como esta, no se cambia nada.**
`La linea de "Interfaces" del brief prometia MARCA.nombreCorto; el bloque de codigo
entrega nombreCompleto. Verifique todos los consumidores de MARCA en las 14 tareas:
usan nombre, bajada, ciudad, email, instagram, instagramUrl y logo. Nadie lee
nombreCorto. La documentacion estaba desactualizada, no el codigo. Si sale mal:
ningun consumidor lo pide, asi que no puede romper nada.`

**Ruling — card.svg sin campo que lo referencie: defecto real, se corrige.**
`El spec (linea 432) dice que las rutas de imagen se arman desde locales.js y no se
escriben en el JSX. La Task 7 del plan arma /img/${local.id}/card.svg inline en
LocalCard, lo que contradice esa regla. Se agrega imagenes.card a cada local y la
Task 7 tendra que consumir local.imagenes.card en vez de construir la ruta. El
reviewer tenia razon por un motivo mas fuerte del que podia ver: no tenia a la vista
el codigo de la Task 7. Si sale mal: una ruta de imagen duplicada entre data y JSX.`
Consecuencia a arrastrar: en el dispatch de la Task 7, LocalCard usa
  local.imagenes.card — NO la plantilla /img/${local.id}/card.svg del plan.

Task 3: minor (deferred): getDestacados() usa .slice(1,3) sin guarda — si un local
  llegara a tener menos platos, devuelve menos de 2 en silencio y rompe el invariante
  "dos por local" que promete su propio comentario. No se dispara con los datos
  actuales. Revisar si se agrega un tercer local.
Task 3: fix round 1/5 despachado (1 finding a corregir, 1 resuelto sin cambio).
Task 3: fix round 1/5 (1 addressed, 0 open; commits 1757c34..5321e10)
Task 3: complete (commits 2db67a5..5321e10, review clean)
Task 4: implementado, commit 1b2b3b5 (pusheado). DONE_WITH_CONCERNS: desviacion
  deliberada del codigo del brief en Navbar.jsx.

**Ruling — se acepta el ajuste de estado en render en vez del useEffect del plan.**
`El plan cerraba el menu mobile con useEffect(() => setMenuAbierto(false),
[pathname]). oxlint lo marca con react(set-state-in-effect). El implementer lo
reemplazo por el patron que la propia documentacion de React recomienda para esto:
guardar el pathname anterior en estado y comparar durante el render. Verifique el
codigo: es correcto y ademas mejor que lo que yo habia escrito — React reinicia el
render antes de pintar, asi que el menu cierra sin un frame intermedio abierto,
mientras que el efecto cierra despues del paint. El implementer hizo lo correcto al
desviarse y avisar. Si sale mal: el menu mobile no cierra al navegar, visible al
instante en cualquier prueba.`
Task 4: minor (deferred): Navbar.jsx usa estilos.itemReservar pero Navbar.module.css
  no define .itemReservar — CSS Modules lo resuelve a undefined y React omite la
  clase. No rompe nada visual, pero es codigo muerto. Venia asi en el plan.
  Para la Task 14: o se agrega la regla o se saca la referencia.
Task 4: minor (deferred): el panel mobile no maneja foco — no enfoca al abrir, no
  cierra con Escape, no devuelve el foco al boton al cerrar. No estaba pedido en el
  plan. Candidato para el pase de accesibilidad de la Task 14.
Task 4: complete (commits 5321e10..1b2b3b5, review clean)

**Ruling — la Task 5 no ejecuta su paso de verificacion con render de prueba.**
`El Step 5 de la Task 5 pide pisar Inicio.jsx con un render de prueba, mirarlo en el
navegador y restaurarlo. Ningun agente puede mirar un navegador, asi que el paso solo
aportaria el riesgo de dejar el arbol sucio sin aportar la verificacion. Se salta
entero: Inicio.jsx queda como el stub de la Task 4 y la Task 6 lo reescribe. La
verificacion de Boton y Section pasa a ser lectura de codigo contra los criterios
declarados, mas build y lint. Esto cierra el Hallazgo 1 del pre-flight. Si sale mal:
un defecto visual en un boton, que aparece apenas se renderiza la home en la Task 6.`
Task 5: implementado, commit fe278dc (pusheado). Sin concerns.
Task 5: review — spec OK, calidad aprobada. Spread de Boton verificado: {...resto}
  va DESPUES de type="button", asi que el submit de la Task 11 va a funcionar.

**Ruling — "Section" se queda en ingles; no se renombra a "Seccion".**
`El reviewer noto que el constraint pide nombres de componente en espanol y Section
esta en ingles. Es cierto, pero el plan entero ya mezcla a proposito: Hero, LocalCard,
PlatoCard y GaleriaGrid tambien usan terminos ingleses, mientras los de dominio
(Boton, SelectorLocal, InfoLocal) van en espanol. Renombrar solo Section dejaria una
inconsistencia peor que la actual, y obligaria a sobreescribir el brief en las 7
tareas que lo consumen — mucho riesgo de coordinacion por un cambio cosmetico. La
convencion real, que dejo asentada: terminos de dominio en espanol, primitivas
genericas de layout/UI con el termino ingles habitual. Si sale mal: el profesor hace
una observacion de nomenclatura; se renombra despues con un find-replace.`

Task 5: minor (deferred): un valor de enum mal escrito (variante="primary" en vez de
  "primario") resuelve a estilos[x] === undefined y se interpola como el string
  "undefined" en el className. No tira error ni rompe el layout: renderiza sin
  estilos, en silencio. Afecta a Boton y Section, y las 7 tareas que quedan pasan
  estos props a mano. Candidato a una guarda en la Task 14.
Task 5: complete (commits 1b2b3b5..fe278dc, review clean)
Task 6: implementado, commit 24fed1d (pusheado). Sin concerns.
Task 6: minor (deferred): key={parrafo.slice(0,24)} en Inicio.jsx funciona hoy pero
  colisiona en silencio si dos parrafos llegan a empezar igual. Se repite la misma
  forma en la Task 12 (historia). Cambiar a key por indice o por string completo.
Task 6: minor (deferred): height:100% redundante junto a aspect-ratio en
  .fotoBienvenida. Cosmetico.
Task 6: el reviewer noto que el alt "Detalle de la parrilla encendida" contiene la
  palabra parrilla. NO es violacion: el grep busca 'parrilla' entre comillas y el alt
  no matchea. Ademas la regla apunta a identificadores de local hardcodeados, no al
  sustantivo comun. Sin accion.
Task 6: complete (commits fe278dc..24fed1d, review clean)

=== CAMBIO DE STACK: el profesor exige Next.js ===

**Ruling — se migra a Next.js App Router AHORA, no al final.**
`El profesor definio que no puede ser Vite. La decision de stack la toma el, no el
plan, asi que el spec queda desactualizado y hay que enmendarlo. Se migra ya: existen
6 tareas de codigo, todas de presentacion, y lo caro (capa de datos, tokens, CSS
modules) pasa a Next sin tocarse. Migrar despues de 8 tareas mas costaria el doble,
porque cada pagina nueva se escribiria dos veces. Router: App Router — el profesor no
aclaro cual, es el estandar desde 2023 y lo que va a usar si despues enseña pagos.
Se migra en el mismo repo con un commit de migracion, no desde cero: el historial
muestra la decision, que es defendible en la entrega. Si sale mal: se pierde el
trabajo de una tarea de migracion, no el de las 6 anteriores.`
Task 6M: migracion a Next.js implementada, commit 0cfa385 (pusheado). Build estatico
  en / /carta /nosotros /reservas /_not-found. Las 6 verificaciones pasaron.
  Concern reportada: import de Link sin usar en app/not-found.jsx (defecto del brief).
Task 6M: review — spec OK, calidad aprobada. 1 Important + 1 Minor, ambos reales.

**Ruling — esActivo con startsWith crudo es un defecto del plan; se corrige.**
`El brief que yo escribi reemplazo NavLink por pathname.startsWith(ruta). NavLink
hacia matching por segmento: marcaba /carta activo en /carta/bebidas pero no en
/cartagena. startsWith crudo no distingue. Hoy no hay colision con las 4 rutas, asi
que no hay regresion visible, pero quedan 8 tareas que agregan rutas. Se cambia a
pathname === ruta || pathname.startsWith(ruta + "/"). Si sale mal: un link del navbar
queda marcado activo cuando no corresponde, visible a simple vista.`

Task 6M: minor incluido en el mismo fix: import de Link sin usar en app/not-found.jsx,
  codigo muerto que venia de mi plan.
Task 6M: fix round 1/5 despachado (2 findings).
Task 6M: fix round 1/5 (2 addressed, 0 open; commits 0cfa385..c11daed)
Task 6M: complete (commits c0025f9..c11daed, review clean)
Deploy desbloqueado tras reescribir autoria a gdiclaudio@itba.edu.ar (force push a429ab9).
Task 7: implementado, commit 87770c0 (pusheado). Sin concerns.
Task 7: minor (deferred): LocalCard lee local.horarios[0] sin guarda. Los dos locales
  actuales tienen horarios no vacios, asi que no se dispara. Riesgo latente si se
  agrega un tercer local sin horarios confirmados: primerHorario.dia tiraria.
Task 7: complete (commits a429ab9..87770c0, review clean)
Task 8: implementado, commit 461c23d (pusheado). Sin concerns. getDestacados() = 4 platos, 2 por local.
Task 8: minor (deferred): .grillaPlatos usa un breakpoint de 600px que no existe en
  ningun otro lado del proyecto. El resto usa 768px (Footer, Navbar, Section) y 900px
  (.grillaLocales, .bienvenida). Son tres valores distintos para la misma idea.
  Venia del plan, no es error del implementer. Para la Task 14: unificar.
Task 8: minor (deferred): --madera (#8B5E3C) sobre --crema en .precio da ~4.88:1.
  Pasa AA (4.5:1) pero con poco margen. Si en la Task 14 se toca tamaño o peso de esa
  tipografia, revisar de nuevo. Oscurecer --madera arreglaria todo el sitio de una.
Task 8: complete (commits 87770c0..461c23d, review clean)
Task 9: implementado, commit 817b3e2 (pusheado). Home completa: 7 bloques. Desviacion menor reportada: reset de lista en GaleriaGrid.module.css.
Task 9: minor (deferred): GaleriaGrid.module.css repite list-style:none y padding:0
  que global.css ya aplica a ul/ol. Redundante, inofensivo.
Task 9: minor (deferred): el contrato de GaleriaGrid (exactamente 3 imagenes, la 2da
  vertical) vive solo en un comentario del CSS. Conviene documentarlo en el .jsx.
Task 9: minor (deferred): GaleriaGrid degrada bien con 2 imagenes pero no con 4 — la
  4ta no tiene regla de columna ni aspect-ratio. Fuera de alcance hoy (siempre son 3).
Task 9: complete (commits 461c23d..817b3e2, review clean). Home con sus 7 bloques.
Task 10: implementado, commit 500bba1 (pusheado). /carta sigue estatica. Dos desviaciones: 'use client' en SelectorLocal (correcta) e inversion de max-width a min-width en su CSS.
Task 10: review — Needs work. 2 Important + 1 Minor, los tres defectos de mi plan.
  Las dos desviaciones del implementer se juzgaron correctas (la inversion del media
  query movio los valores, no solo la direccion).

**Ruling — ids de ancla con espacios: defecto real del plan, se corrige.**
`El plan interpolaba el nombre de categoria crudo en el id ("parrilla-De la
parrilla"). HTML prohibe espacios en un id. Hoy scrollea igual porque href e id salen
del mismo template, pero falla validacion y rompe cualquier querySelector. Como la
carta la edita la familia, la solucion tiene que aguantar acentos: se agrega un
slugify con normalize NFD. Si sale mal: el indice de categorias deja de scrollear,
visible al primer clic.`

**Ruling — el toggle sticky tapa el titulo al que se scrollea.**
`scroll-padding-top global esta dimensionado solo para la navbar (72px), pero
SelectorLocal tambien es sticky debajo de ella. Clic en una categoria deja el titulo
detras del toggle, que es exactamente lo que el indice deberia evitar. Se corrige con
scroll-margin-top en .categoria y no tocando el global, porque el offset extra es
propio de esta pagina. Si sale mal: se scrollea unos pixeles de mas o de menos.`

Task 10: fix round 1/5 despachado (3 findings).
Task 10: minor (deferred): aSlug puede devolver "" si una categoria fuera puramente
  simbolica, dando id="parrilla-". Valido como id pero colisionaria entre dos
  categorias asi. Ninguna de las 10 categorias reales lo dispara.
Task 10: fix round 1/5 (3 addressed, 0 open; commits 500bba1..a3e5faf)
Task 10: complete (commits 817b3e2..a3e5faf, review clean)
Task 11: implementado, commit 7b24ade (pusheado). Grep anti-persistencia limpio. Sin concerns.
Task 11: review — spec OK, aprobada con 1 Important + 2 Minor.

**Ruling — el reset silencioso de la hora al cambiar de local se corrige.**
`El select era no controlado y sus options van keyed por el string de hora. Las
franjas de los dos locales solo se superponen en parte (22:00 solo en uno, 19:30 solo
en el otro), asi que al cambiar de local el navegador cae en la primera opcion
disponible sin disparar evento. La hora elegida se convierte en otra, en silencio.
Eso es peor que un error, porque parece que funciono. Se pasa a select controlado con
placeholder y limpieza explicita. Sigue siendo maqueta: es estado de un input
controlado, no persistencia. Si sale mal: el usuario tiene que volver a elegir hora,
que es justamente lo que se busca.`

**Ruling — el input de fecha se queda SIN min, a proposito.**
`El reviewer noto que se puede pedir una fecha pasada. Es cierto, pero calcular la
fecha de hoy durante el render de una pagina prerenderizada estaticamente arriesga un
desajuste de hidratacion entre build y cliente, y sortearlo cuesta mas que el bug
mientras el formulario no envia nada. Va con la validacion real en la etapa del CRUD.
Si sale mal: alguien escribe una fecha pasada en un formulario que no guarda nada.`

Task 11: minor incluido en el fix: el anillo de foco de las tarjetas de local rodeaba
  solo el nombre y no la tarjeta entera, que es lo clickeable.
Task 11: fix round 1/5 despachado (2 findings, 1 diferido con ruling).
Task 11: fix round 1/5 (2 addressed, 0 open; commits 7b24ade..0a800f4). El min de
  fecha quedo fuera, como se habia decidido.
Task 11: complete (commits a3e5faf..0a800f4, review clean)
Task 12: implementado, commit 5546391 (pusheado). Sin concerns. Las 4 paginas del sitio completas.
Task 12: review — spec OK, Needs work por 1 Important.

**Ruling — el orden de lectura se arregla moviendo el markup, no agregando order.**
`El markup emitia la galeria antes que el texto y la alternancia se hacia con
order:2 en CSS. Para el segundo local, un lector de pantalla escuchaba tres fotos y
sus alt antes del encabezado que dice de que salon son. Se pone el texto primero en
el markup para los DOS locales y order solo mueve la galeria de lado. Descarte
alternar tambien el markup: eso haria coincidir cada bloque con su propio orden
visual, pero en mobile el primer local mostraria tres fotos antes de decir de quien
son. Encabezado primero es el orden correcto a cualquier ancho; izquierda/derecha es
decoracion encima. El CSS venia de mi brief, no lo invento el implementer. Si sale
mal: la galeria queda del lado equivocado en desktop, visible al instante.`

Task 12: fix round 1/5 despachado (1 finding).
Task 12: fix round 1/5 (1 addressed, 0 open; commits 5546391..09dce0e)
Task 12: complete (commits 0a800f4..09dce0e, review clean). Las 4 paginas construidas.
Task 13: implementado, commit 5348ad7 (pusheado). 4 discrepancias del brief corregidas contra el repo, incluida la version de Next (16.3.6, no 15).
Task 13: review — spec OK, Needs work por 1 Important: ESTRUCTURA.md afirmaba que
  solo Navbar, Footer y las paginas importan de src/data/. Falso: tambien Hero
  (MARCA) y PlatoCard (formatearPrecio).

**Ruling — se corrige el doc y ademas se reformula la regla, que estaba mal planteada.**
`La linea venia de mi brief y era falsa. Pero el problema de fondo es otro: la regla
util no es "quien toca src/data/" sino "quien sabe de los locales". Constantes de
marca y un formateador de precio no son datos de local. La regla verdadera y
verificable es: ningun componente importa locales.js salvo Footer, que muestra las
dos direcciones en todas las paginas. Eso es lo que sostiene que sumar un tercer local
no obligue a tocar componentes. Si sale mal: la documentacion describe mal el codigo,
que es justo lo que esta tarea existe para evitar.`

Task 13: fix round 1/5 despachado (1 finding + re-lectura de ESTRUCTURA.md).
Task 13: fix round 1/5 (1 addressed, 0 open; commits 941e767..3a14878)
Task 13: complete (commits 89edbef..3a14878, review clean)

**Ruling — la Task 14 se reinterpreta: los chequeos de navegador pasan al usuario.**
`El plan llenó la tarea final de verificaciones visuales (recorrer 4 paginas en 3
breakpoints, navegar con teclado, medir contraste en DevTools). Ningun agente puede
hacerlas, y fingir que si seria peor que no hacerlas. La tarea pasa a: (a) aplicar
los minors diferidos que son cambios de codigo de bajo riesgo, (b) correr todas las
verificaciones por grep y build, (c) dejar escrito un checklist de QA manual para que
lo corra el usuario en un navegador de verdad, incluido un celular real. Si sale mal:
queda un defecto visual que el checklist deberia atrapar.`

**Ruling — de los minors diferidos se aplican solo los de bajo riesgo visual.**
`Nadie puede verificar visualmente el resultado, asi que cambiar layouts a ciegas es
mal negocio. Se aplican: el breakpoint de 600px a 768px (una linea, alinea con el
resto), oscurecer --madera para darle margen al contraste (un token, mejora todo el
sitio), el contrato de GaleriaGrid como comentario en el .jsx, y Escape + manejo de
foco en el panel mobile (accesibilidad real, sin riesgo de layout). NO se tocan los
breakpoints de 421px ni 900px: son decisiones de layout que habria que ver para
validar. Quedan documentados en PENDIENTES.md. Si sale mal: el sitio queda con tres
breakpoints en vez de dos, que es exactamente donde esta hoy.`
Task 14: implementado, commit d94224c (pusheado). --madera #8B5E3C -> #7A5134 (6.02:1 sobre crema). Descubrimiento: sobre bordo-100 daba 4.48:1, por debajo de AA. Las 9 verificaciones limpias. QA-MANUAL.md escrito.
Task 14: review — spec OK, aprobada con 1 Important + 1 Minor. Los tres ratios de
  contraste se recomputaron de forma independiente y coinciden. Confirmado que el
  valor viejo daba 4.482:1 sobre bordo-100, POR DEBAJO de AA: el cambio cerro una
  falla real, no agrego margen.

**Ruling — se reabre la mitad del hallazgo de foco que no se corrigio.**
`PENDIENTES.md marco como resuelto el item completo del panel mobile, pero A4 solo
cubrio Escape y devolver el foco al cerrar. Enfocar hacia adentro al abrir nunca se
implemento, y la edicion borro esa clausula de la descripcion del propio hallazgo.
Un lector futuro creeria que el manejo de teclado esta completo. Es la misma clase de
error que el proyecto viene corrigiendo: documentacion silenciosamente equivocada es
peor que documentacion faltante. Se parte el item en dos. Si sale mal: queda anotado
como pendiente algo que en realidad se hizo, que es el error inofensivo de los dos.`

Task 14: minor (deferred): el chequeo de scroll horizontal del QA-MANUAL pide pegar
  una linea en la consola de DevTools. Es copiar y pegar con pasos, usable, pero es
  lo mas alejado de "observar" que tiene el documento.
Task 14: fix round 1/5 despachado (1 finding).

=== SESION CORTADA POR LIMITE DE USO ===
La re-review acotada del fix de la Task 14 (d94224c..295a637) murio con HTTP 429,
limite de sesion, no por un problema del trabajo. Pendientes al retomar:
  1. Re-review de d94224c..295a637 (fix documental, 2 archivos, doc-only).
  2. Review general de toda la rama. Paquete ya generado:
     .superpowers/sdd/2026-09-24-boceto-visual/review-7bd9b0b..295a637.diff
     Despacharla en el modelo mas capaz disponible.
Task 14: NO cerrada — le falta la re-review.

Fuera del plan: se creo docs/proceso/ a pedido del usuario (registro del trabajo con
IA para presentar en la materia). Commit fcad760. CLAUDE.md ahora obliga a mantenerlo.

=== SESION RETOMADA 2026-09-29, limite repuesto ===
Task 14: re-review del fix documental — ADDRESSED. La hice yo como controlador en
  vez de despachar un agente: son 2 archivos, solo documentacion, y el fix no lo
  escribi yo. Verificado contra Navbar.jsx: Escape cierra y devuelve foco (listener
  solo mientras esta abierto, con cleanup), y nada mueve el foco hacia adentro al
  abrir. PENDIENTES.md parte el item correctamente ([x] lo hecho, [ ] lo que falta).
Task 14: complete (commits 3a14878..295a637, review clean)
Todas las tareas del plan cerradas. Falta solo la review general de la rama.

=== REVIEW GENERAL DE LA RAMA ===
1 Critical + 4 Important + lista larga de "worth knowing".

CRITICAL: el panel mobile tapa al boton hamburguesa. .marca y .hamburguesa declaran
z-index:2 pero NO declaran position, asi que son static y su z-index se ignora. El
panel (fixed, inset:0, fondo opaco) pinta encima. En un celular no hay forma de
cerrar el menu: la X no se ve ni se puede tocar, y Escape no existe en un telefono.
Agravante: el panel solo cierra si cambia el pathname, asi que tocar el link de la
ruta en la que ya estas tampoco lo cierra.
Por que lo perdimos: el QA-MANUAL solo testea cerrar con Escape, nunca tocando la X.

**Ruling — se despacha UNA sola tanda de fixes con los 5 must-fix + extras baratos.**
`El proceso pide un solo despacho de correccion para los hallazgos de la review final,
no uno por hallazgo. Se incluyen ademas las grillas repeat(2,1fr) -> auto-fit (5
lineas) porque vuelven literalmente cierta la promesa del spec de que un tercer local
es solo datos, y las correcciones de documentacion que quedaron desactualizadas. Si
sale mal: se revierte un commit.`
