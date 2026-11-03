# Ingreso con mail y contraseña, además de Google

Fecha: 2026-11-03 (sesión 09). Diseño acordado en el chat, por partes; maqueta de
`/ingresar` mostrada en el navegador y elegida por el usuario (opción B).

## Por qué

Pedido del usuario:

1. Que pueda tener cuenta alguien que no usa Google (Hotmail, Yahoo, mail del trabajo).
2. Que el login esté **completo** por si la cátedra lo pide: registrarse, ingresar,
   recuperar la contraseña.

**Historia:** en la sesión 02 la IA agregó mail y contraseña sin avisar que el
servidor de mails de fábrica de Supabase solo manda a los miembros del proyecto (y
pocos por hora): no llegaban la confirmación ni el "olvidé mi contraseña". El usuario
decidió quedarse solo con Google (`docs/proceso/sesion-02-2026-10-01.md`, sección 9;
`hallazgos.md`). **Lo que cambió:** desde la sesión 08 hay cuenta de Brevo con
remitente verificado (`gdiclaudio@itba.edu.ar`). Supabase Auth puede mandar sus
mails por el SMTP de Brevo, y eso destraba lo de entonces.

## Objetivos

- Crear cuenta con **nombre, mail y contraseña**. La cuenta se confirma con un mail
  antes de poder ingresar.
- Ingresar con mail y contraseña.
- **Olvidé mi contraseña**: un mail con un link para elegir una nueva.
- Google sigue igual, al lado de lo nuevo.
- Mails de cuentas **en castellano y con la estética de los mails de reservas**
  (bordo, arena, Baskerville en el título), saliendo desde el remitente de Brevo.
- **El teléfono se guarda siempre al reservar** (se saca la casilla "Guardarlo para
  la próxima" de `/reservas`), para todos, entren con Google o con mail.

## No objetivos

- Pedir el teléfono al crear la cuenta (lo decidió el usuario: se pide al reservar,
  como hoy).
- Cambiar el mail o la contraseña desde una página de "mi cuenta". Para cambiar la
  contraseña alcanza con "Olvidé mi contraseña".
- Ingreso con link mágico, código por mail, SMS u otros proveedores.
- Vincular solas a una cuenta las reservas que carga el local por mail (descartado en
  esta misma sesión: un mail mal tipeado le mostraría la reserva a un desconocido).
- Captcha.

## Anti-objetivos (fallaría aunque "funcione")

- Que la confirmación o el mail de recuperación **no lleguen** a un mail común
  (Hotmail, Gmail, Yahoo). Es exactamente lo que pasó en la sesión 02: se prueba con
  mails reales antes de mergear.
- Que se pueda crear una cuenta con mail desde la API sin confirmarla, o que el
  registro quede abierto sin que los mails funcionen.
- Mails de Supabase en inglés o con la plantilla de fábrica.
- Que la pantalla diga si un mail ya tiene cuenta o no (enumeración de cuentas).
- Una clave de Brevo escrita en el repo, en un doc o en el chat.

## Restricciones

- Todo pasa por `src/servicios/auth.js`; ningún componente importa supabase-js.
- `/ingresar` y las páginas nuevas siguen prerenderizándose como estáticas.
- Sin API routes nuevas: todo es Supabase Auth desde el navegador.
- Las previews usan la base de producción: el `config push` de Auth cambia
  producción en el acto. Se hace en la misma ventana que el merge, con OK explícito
  del usuario, como un `db push`.
- La clave SMTP la crea y la carga el usuario (👤). La IA no la ve ni la escribe.
- CLAUDE.md dice "Se ingresa solo con Google"; se actualiza en el mismo PR.

## Lo que decidió el usuario

- `/ingresar` con **dos pestañas: "Ingresar" y "Crear cuenta"** (opción B de la
  maqueta). El botón "Continuar con Google" aparece en las dos, arriba, separado por
  "o con tu mail".
- Pestaña Ingresar: mail, contraseña, botón "Ingresar" y link "Olvidé mi contraseña".
- Pestaña Crear cuenta: **nombre, mail, contraseña**. Sin teléfono.
- El teléfono se guarda siempre en el perfil al reservar (sin casilla).
- Las reservas del local no se vinculan a cuentas.

## Cómo (decisiones de la IA, revisables)

### Supabase Auth (`supabase/config.toml`, sube con `npx supabase config push`)

- `[auth.email] enable_signup = true`, `enable_confirmations = true` (ya está).
- `minimum_password_length = 8`.
- SMTP de Brevo **solo para producción**: un bloque `[remotes.<nombre>]` de
  `config.toml` (con el `project_id` de `la-posta`) que sobrescribe `[auth.email.smtp]`
  únicamente al hacer `config push`: `host = "smtp-relay.brevo.com"`, `port = 587`,
  `user = "c1039d001@smtp-brevo.com"` (el login SMTP de Brevo, no es secreto),
  `pass = "env(BREVO_SMTP_KEY)"`,
  `admin_email` = el remitente verificado, `sender_name = "La Posta"`. En local y en
  la CI los mails siguen cayendo en Mailpit y no hace falta la clave. La clave vive en
  `supabase/.env` (ignorado por git), que la CLI lee al hacer `config push`.
  *(Decisión de la IA después de la revisión: un SMTP en la sección común mandaría
  mails reales desde `supabase start`.)* Si la versión de la CLI no aplica bien ese
  bloque, se carga el SMTP a mano en el panel de Supabase (Auth → SMTP) y la sección
  queda fuera del `config.toml`; se verifica con `config push --dry-run` o leyendo la
  configuración remota antes de seguir.
- `[auth.rate_limit] email_sent` sube de 2 a 30 por hora (con SMTP propio se puede).
- Plantillas propias en `supabase/templates/`: `confirmacion.html` (asunto
  "Confirmá tu cuenta en La Posta") y `recuperacion.html` (asunto "Elegí una
  contraseña nueva"), con la estética de `supabase/functions/notificar-reserva/mensajes.ts`
  (mismo marco y colores), copiada a mano porque son plantillas Go de Supabase, no
  TypeScript. Son los únicos dos mails de cuentas que importan en este alcance.
- Redirect URLs: ya admiten `https://lapostaparrilla.vercel.app/**` y localhost.
  Las previews de Vercel **no** están en la lista: un link de confirmación pedido
  desde una preview vuelve a producción. Se acepta (ver Pruebas).

### Front

- `src/servicios/auth.js`: `crearCuenta({ nombre, mail, contrasena })`
  (`signUp` con `options.data.nombre` y `emailRedirectTo`), `ingresarConMail`,
  `pedirNuevaContrasena(mail)` (`resetPasswordForEmail` con `redirectTo` a la página
  de contraseña nueva) y `cambiarContrasena(contrasena)` (`updateUser`).
- El perfil se crea solo: el trigger `crear_perfil()` ya lee `raw_user_meta_data ->> 'nombre'`.
  No hace falta migración.
- `/ingresar`: las dos pestañas (accesibles: `role="tablist"`, flechas, foco
  visible). Después de crear la cuenta, la pestaña muestra "Te mandamos un mail a
  X para confirmar la cuenta" en vez del formulario. `?volver=` sigue funcionando en
  las dos vías.
- `/ingresar/contrasena` (nombre a elección del constructor): llega desde el link
  del mail, pide la contraseña nueva dos veces y, al guardar, deja la sesión iniciada
  y vuelve a `/mis-reservas`. Si se entra sin el link válido, explica que hay que
  pedir uno nuevo.
- Validación propia en `src/validacion/` (funciones puras con tests `node --test`),
  con el mismo patrón de `Campo`: mail, contraseña de 8+ caracteres, nombre (reusa
  `validarNombre`), contraseñas que coinciden.
- Mensajes de Supabase traducidos a castellano ("Invalid login credentials" →
  "El mail o la contraseña no son correctos", mail sin confirmar, límite de envíos).
  "Olvidé mi contraseña" responde siempre lo mismo, exista o no la cuenta.
- `/reservas`: se saca la casilla; el teléfono se guarda en el perfil si cambió.

### Casos a cuidar

- **Alguien que ya entró con Google crea cuenta con el mismo mail:** Supabase no
  avisa (para no revelar cuentas) y no se crea otra cuenta. La pantalla dice lo mismo
  que siempre ("te mandamos un mail"). Esa persona puede entrar con Google, o usar
  "Olvidé mi contraseña" para sumarle una contraseña a su cuenta. El constructor
  verifica este caso en la preview y lo documenta.
- **Alguien con cuenta de mail entra después con Google** (mismo mail): Supabase
  vincula las dos identidades a la misma cuenta; las reservas siguen ahí.
- El admin (`gdiclaudio@itba.edu.ar`) sigue entrando con Google; nada cambia para él.

## Pruebas

- `node --test`: validaciones nuevas y traducción de errores.
- pgTAP: un usuario creado con `raw_user_meta_data.nombre` tiene perfil con ese nombre
  y rol cliente.
- En local, los mails de Auth caen en Mailpit (http://127.0.0.1:54324): recorrido
  completo de registro, confirmación, ingreso, olvido y contraseña nueva.
- **Puesta en producción en dos pasos** *(decisión de la IA después de la revisión,
  para que el registro nunca quede abierto con mails que no llegan)*. Cada push con
  su OK del usuario:
  1. `config push` con SMTP, plantillas, límite de envíos y largo de contraseña, con
     `enable_signup` **todavía en false**. Prueba de entrega: una cuenta de prueba
     creada a mano desde el panel de Supabase con un mail del usuario que no sea de
     Google, y "Send password recovery" a esa cuenta **desde el panel** (con
     `enable_signup = false` el proveedor de mail entero queda apagado, también para
     ingresar: corrección de la revisión final): ver que lleguen, a qué carpeta y
     con la plantilla. (No se prueba con el mail de la facultad: ahí los mails de
     Brevo caen en spam, por eso el local dejó de recibir mails, PR #24. A los
     clientes les llegan bien, según el usuario.)
  2. Si llegan: `config push` con `enable_signup = true` y merge del PR. Prueba de
     punta a punta en producción: crear cuenta con Hotmail o Yahoo y con Gmail,
     confirmar, ingresar, olvido y contraseña nueva.
  - **Vuelta atrás:** si los mails no llegan (o caen en spam de forma pareja),
    `enable_signup` queda en false (o vuelve a false) y el PR no se mergea hasta
    resolver el remitente. Google sigue funcionando todo el tiempo.
- Documentar en `docs/QA-MANUAL.md` los pasos para la demo.
- **Cuentas de prueba en producción** *(decisión de la IA; el usuario no la definió)*:
  queda una, la de mail que no es de Google, para mostrar en la demo del 2026-11-12;
  las demás se borran desde el panel de Supabase (Authentication → Users) después de
  probar. Lo hace el usuario.

## Lo que hace el usuario (👤)

1. ✅ (2026-11-03) Clave SMTP creada en Brevo y escrita en `supabase/.env` como
   `BREVO_SMTP_KEY` (la IA solo verificó que está, sin leer el valor).
2. ✅ Login SMTP: `c1039d001@smtp-brevo.com`.
3. Dar el OK para cada `config push` (los dos pasos) y para el merge.
4. Probar el registro con un mail propio que no sea de Google.

## Lo que queda a criterio del constructor

- Nombre de la ruta de contraseña nueva y textos menores.
- Cómo se ve el aviso de "revisá tu mail" y si se ofrece reenviarlo.
- Orden exacto de los commits y del PR (uno solo, por rama).
- Actualizar `BACKEND.md`, `ESTRUCTURA.md`, `BITACORA.md`, `RUBRICA.md`,
  `PENDIENTES.md`, `CLAUDE.md` y el registro del proceso.
