# Ingreso con mail y contraseña — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** sumar crear cuenta, ingresar y recuperar la contraseña con mail y contraseña al lado de Google, con los mails de Supabase Auth saliendo por el SMTP de Brevo, y guardar siempre el teléfono al reservar.

**Architecture:** todo es Supabase Auth desde el navegador (sin API routes). `src/servicios/auth.js` suma cuatro funciones; `/ingresar` pasa a dos pestañas y aparece `/ingresar/contrasena`. Las validaciones son funciones puras en `src/validacion/cuenta.js`. La configuración de Auth (SMTP, plantillas, largo de contraseña) vive en `supabase/config.toml` y sube con `npx supabase config push`; el SMTP va en un bloque `[remotes.produccion]` para que en local los mails sigan cayendo en Mailpit.

**Tech Stack:** Next.js 16 (App Router) + React 19 + CSS Modules, JavaScript; `@supabase/supabase-js` ^2.117 (flujo implícito, `detectSessionInUrl` por defecto); Supabase CLI 2.119; `node --test`; pgTAP.

**Spec:** `docs/superpowers/specs/2026-11-03-ingreso-con-mail-design.md`

## Global Constraints

- Rama `feat/ingreso-con-mail` (sale de `main`), un solo PR. No mergear sin OK del usuario.
- Código, nombres y textos en castellano rioplatense; commits en inglés.
- Ningún componente importa `@supabase/supabase-js`: todo por `src/servicios/`.
- `/ingresar` y `/ingresar/contrasena` siguen **estáticas** en `npm run build`.
- Contraseña: **mínimo 8 caracteres** (`minimum_password_length = 8`).
- Login SMTP: `c1039d001@smtp-brevo.com`; host `smtp-relay.brevo.com`; puerto `587`; clave `env(BREVO_SMTP_KEY)` desde `supabase/.env` (la IA nunca lee ni imprime el valor); remitente `gdiclaudio@itba.edu.ar`, nombre `La Posta`.
- Asuntos: "Confirmá tu cuenta en La Posta" y "Elegí una contraseña nueva".
- Colores solo de `src/styles/tokens.css` en el sitio; en las plantillas de mail, los mismos hex que `supabase/functions/notificar-reserva/mensajes.ts` (`C`).
- Nunca decir si un mail ya tiene cuenta (crear cuenta y "olvidé" responden siempre igual).
- Cada `config push` a producción con OK explícito del usuario en el chat.

## Review Focus

1. **Mail que ya tiene cuenta con Google** usado en "Crear cuenta": Supabase devuelve un usuario sin `identities` y no manda nada; la pantalla tiene que mostrar el mismo "Te mandamos un mail" (Task 4, test de la función que decide el mensaje).
2. **Mail sin confirmar que intenta ingresar** (`email_not_confirmed`): mensaje claro que diga revisar el mail, no "algo salió mal" (Task 2).
3. **Link de recuperación vencido o abierto en otro navegador**: `/ingresar/contrasena` sin sesión explica que hay que pedir otro, con link a "Olvidé mi contraseña" (Task 5, verificación en Mailpit).
4. **Mail con mayúsculas o espacios** ("  Ana@Hotmail.com "): se recorta y se manda en minúsculas, si no Supabase lo trata como otro (Task 1).
5. **Contraseñas que no coinciden o de 7 caracteres** en contraseña nueva: error en el campo antes de llamar a Supabase (Task 1 y Task 5).

---

### Task 1: Validación de cuenta

**Files:**
- Create: `src/validacion/cuenta.js`
- Test: `src/validacion/cuenta.test.js`

**Interfaces:**
- Consumes: `validarNombre` de `src/validacion/reservas.js`.
- Produces: `LIMITES_CUENTA = { contrasena: { min: 8, max: 72 } }`; `normalizarMail(valor) → string`; `validarMailCuenta(valor) → string` (obligatorio); `validarContrasena(valor) → string`; `validarRepeticion(contrasena, repetida) → string`; `validarCuenta(datos, { modo }) → { campo: mensaje }` con `modo` `'ingresar' | 'crear' | 'olvide' | 'nueva'` (campos: ingresar = mail, contrasena; crear = nombre, mail, contrasena; olvide = mail; nueva = contrasena, repetida). Mismo estilo que `validarReserva`: `''` si está bien.

- [ ] **Step 1: Write the failing tests** (`node:test` + `node:assert/strict`, como `reservas.test.js`)
  - `normalizarMail('  Ana@Hotmail.com ')` → `'ana@hotmail.com'`.
  - `validarMailCuenta('')` → `'Escribí tu mail.'`; `validarMailCuenta('ana@')` → `'Ese mail no parece válido. Ejemplo: nombre@gmail.com'`; `validarMailCuenta('ana@hotmail.com')` → `''`.
  - `validarContrasena('1234567')` → `'La contraseña tiene que tener al menos 8 caracteres.'`; 73 caracteres → `'La contraseña puede tener hasta 72 caracteres.'`; `'12345678'` → `''`.
  - `validarRepeticion('abcdefgh', 'abcdefgi')` → `'Las contraseñas no coinciden.'`.
  - `Object.keys(validarCuenta({ nombre: '', mail: 'x', contrasena: '1' }, { modo: 'crear' }))` → `['nombre', 'mail', 'contrasena']`; con `modo: 'olvide'` → `['mail']`; con `modo: 'ingresar'` y contraseña de 3 caracteres → sin error de largo (al ingresar solo se exige que no esté vacía: `'Escribí tu contraseña.'` si está vacía).
- [ ] **Step 2:** `npm test` → FAIL (módulo no existe).
- [ ] **Step 3:** implementar en `src/validacion/cuenta.js`. Reusa la regex de mail de `reservas.js` (exportarla como `MAIL` desde ahí si hace falta, sin cambiar su comportamiento).
- [ ] **Step 4:** `npm test` → PASS, todos.
- [ ] **Step 5:** commit `feat: account form validation`.

### Task 2: Mensajes de error de Auth en castellano

**Files:**
- Modify: `src/servicios/supabase.js` (objeto `ERRORES_AUTH`)
- Test: `src/servicios/supabase.test.js` (nuevo)

**Interfaces:**
- Produces: `mensajeDeError(error)` traduce además estos `error.code` de Supabase Auth:
  - `invalid_credentials` → `'El mail o la contraseña no son correctos.'`
  - `email_not_confirmed` → `'Todavía no confirmaste tu cuenta: revisá tu mail (y la carpeta de spam).'`
  - `over_email_send_rate_limit` → `'Mandamos demasiados mails seguidos. Probá de nuevo en unos minutos.'`
  - `weak_password` → `'La contraseña tiene que tener al menos 8 caracteres.'`
  - `same_password` → `'La contraseña nueva tiene que ser distinta de la anterior.'`
  - `signup_disabled` / `email_provider_disabled` → `'Por ahora solo se puede crear la cuenta con Google.'`
  - `email_address_invalid` → `'Ese mail no parece válido. Ejemplo: nombre@gmail.com'`

- [ ] **Step 1:** tests: para cada código, `mensajeDeError({ code })` devuelve el texto de arriba; `mensajeDeError({ code: 'provider_disabled' })` sigue igual.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** sumar las claves a `ERRORES_AUTH`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** commit `feat: spanish messages for auth errors`.

### Task 3: Servicio de cuenta

**Files:**
- Modify: `src/servicios/auth.js` (cambia también el comentario de arriba: ya no es "solo con Google")

**Interfaces:**
- Consumes: `normalizarMail` (Task 1), `resultado` de `supabase.js`.
- Produces:
  - `crearCuenta({ nombre, mail, contrasena }, volverA) → { cuentaNueva: boolean }`: `signUp` con `options.data.nombre` (lo lee el trigger `crear_perfil()`) y `emailRedirectTo: urlDeVuelta(volverA)`. `cuentaNueva` es `false` cuando `data.user.identities` viene vacío (mail ya registrado); la UI **no** lo muestra distinto (Review Focus 1), queda para el log de pruebas.
  - `ingresarConMail({ mail, contrasena }) → sesion` (`signInWithPassword`).
  - `pedirNuevaContrasena(mail) → void` (`resetPasswordForEmail` con `redirectTo: urlDeVuelta('/ingresar/contrasena')`).
  - `cambiarContrasena(contrasena) → void` (`updateUser({ password })`).
  - Todas normalizan el mail con `normalizarMail` antes de llamar.

- [ ] **Step 1:** implementar las cuatro funciones siguiendo el estilo de `ingresarConGoogle`.
- [ ] **Step 2:** `npm run lint` limpio.
- [ ] **Step 3:** commit `feat: email and password functions in the auth service`.

### Task 4: `/ingresar` con dos pestañas

**Files:**
- Modify: `app/ingresar/page.jsx`, `app/ingresar/page.module.css`
- Create: `src/components/PestanasCuenta/PestanasCuenta.jsx` + `.module.css` (las pestañas accesibles), `src/components/FormularioCuenta/FormularioCuenta.jsx` + `.module.css` (los formularios de ingresar, crear y olvidé)

**Interfaces:**
- Consumes: Tasks 1-3, `Campo`, `Boton`, `useSesion`, `destinoSeguro` (queda en la página).
- Produces: `PestanasCuenta({ pestanas: [{ id, etiqueta }], activa, alCambiar, children })` con `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, flechas izquierda/derecha e Inicio/Fin, solo la activa con `tabIndex=0`. `FormularioCuenta({ modo, volver, alCambiarModo })` con `modo` `'ingresar' | 'crear' | 'olvide'`.

Comportamiento (copia exacta):
- Arriba de las dos pestañas, el botón actual "Continuar con Google" y debajo un separador "o con tu mail".
- Ingresar: Mail, Contraseña, botón "Ingresar", link-botón "Olvidé mi contraseña" (cambia a modo `olvide` dentro de la misma pestaña, con "Volver" a ingresar).
- Crear cuenta: Nombre, Mail, Contraseña (ayuda "Al menos 8 caracteres."), botón "Crear cuenta". Al terminar, en lugar del formulario: "Te mandamos un mail a **{mail}** para confirmar la cuenta. Si no lo ves, revisá la carpeta de spam." — siempre, haya o no cuenta previa.
- Olvidé: Mail, botón "Mandar el mail". Al terminar: "Si hay una cuenta con **{mail}**, te llega un mail para elegir una contraseña nueva."
- `?volver=` llega a `crearCuenta` y a la redirección después de `ingresarConMail` (la que ya hace el `useEffect` con sesión).
- Bajada: "Para reservar y ver o cancelar tus reservas." Letra chica: "Solo usamos tu nombre y tu mail para gestionar tus reservas."
- Errores: mensaje por campo con `Campo` al enviar (foco al primero, como `EditarReserva`); errores de Supabase en `formulario.error` con `role="alert"`.

- [ ] **Step 1:** test puro de la decisión de mensajes, si se extrae (`mensajeTrasCrear(mail) → string`) en `src/validacion/cuenta.js` con su test: el texto es idéntico para `cuentaNueva` true y false.
- [ ] **Step 2:** implementar componentes y página.
- [ ] **Step 3:** `npm run lint` y `npm run build`: `/ingresar` sigue `○ (Static)`.
- [ ] **Step 4:** verificación en el navegador (dev server + Supabase local), escritorio y 375 px: pestañas con teclado, errores por campo, crear cuenta deja el mail en Mailpit (http://127.0.0.1:54324).
- [ ] **Step 5:** commit `feat: sign in page with email and password tabs`.

### Task 5: `/ingresar/contrasena`

**Files:**
- Create: `app/ingresar/contrasena/page.jsx` + `page.module.css` (puede reusar `../page.module.css`)

**Interfaces:**
- Consumes: `cambiarContrasena` (Task 3), `validarCuenta(..., { modo: 'nueva' })` (Task 1), `useSesion`.

Comportamiento:
- Mientras `cargando`: el lugar reservado (sin saltos de layout, como `RequiereSesion`).
- Con sesión (el link del mail la abre): título "Contraseña nueva", campos "Contraseña nueva" y "Repetila", botón "Guardar". Al guardar: `router.replace('/mis-reservas')`.
- Sin sesión: "El link venció o ya se usó. Pedí uno nuevo desde Ingresar → Olvidé mi contraseña." con link a `/ingresar`.

- [ ] **Step 1:** implementar.
- [ ] **Step 2:** `npm run build`: la ruta es `○ (Static)`.
- [ ] **Step 3:** verificación con Mailpit: "Olvidé" → link del mail → contraseña nueva → queda en `/mis-reservas` con sesión; abrir el mismo link otra vez → mensaje de link vencido.
- [ ] **Step 4:** commit `feat: choose a new password page`.

### Task 6: El teléfono se guarda siempre al reservar

**Files:**
- Modify: `app/reservas/page.jsx:254-270` y `:368-370`

- [ ] **Step 1:** sacar la casilla `guardarTelefono`; guardar en el perfil siempre que `telefono !== perfil?.telefono` (mismo `actualizarPerfil` y `recargarPerfil`).
- [ ] **Step 2:** `npm run lint` y `npm test` limpios.
- [ ] **Step 3:** commit `feat: always save the phone when booking`.

### Task 7: Configuración de Auth, plantillas y test de perfil

**Files:**
- Modify: `supabase/config.toml`
- Create: `supabase/templates/confirmacion.html`, `supabase/templates/recuperacion.html`
- Create: `supabase/tests/database/13_perfil_registro_con_mail.test.sql`

Valores:
- `[auth] minimum_password_length = 8`; `[auth.rate_limit] email_sent = 30`; `[auth.email] enable_signup = true` (el comentario de "solo con Google" se reemplaza); `enable_confirmations = true` sigue.
- `[auth.email.template.confirmation]` `subject = "Confirmá tu cuenta en La Posta"`, `content_path = "./supabase/templates/confirmacion.html"`; `[auth.email.template.recovery]` `subject = "Elegí una contraseña nueva"`, `content_path = "./supabase/templates/recuperacion.html"`.
- Bloque de producción (`project_id = "dagxitkhqbztgetoultt"`): `[remotes.produccion]` y `[remotes.produccion.auth.email.smtp]` con `enabled = true`, host, puerto, `user`, `pass = "env(BREVO_SMTP_KEY)"`, `admin_email = "gdiclaudio@itba.edu.ar"`, `sender_name = "La Posta"`; y `[remotes.produccion.auth.email] enable_signup = false` (**primer paso de la puesta en producción**; Task 9 lo pasa a `true`).
- Plantillas: mismo marco que `plantilla()` de `mensajes.ts` (logo `{{ .SiteURL }}/logo/logo-mail-blanco.png`, banda bordo, franja oliva, título Baskerville en mayúsculas, pie arena "La Posta · Villa La Angostura"). Botón con `{{ .ConfirmationURL }}`: "Confirmar mi cuenta" / "Elegir contraseña nueva". Texto de confirmación: "Hola, gracias por crear tu cuenta en La Posta. Para empezar a reservar, confirmá tu mail." Recuperación: "Pediste elegir una contraseña nueva. Si no fuiste vos, ignorá este mail: tu contraseña no cambia." Tercera persona/voseo como los de reservas.

- [ ] **Step 1:** test pgTAP: insertar en `auth.users` con `raw_user_meta_data = '{"nombre":"Ana López"}'` → `perfiles.nombre = 'Ana López'`, `rol = 'cliente'`, `telefono` null.
- [ ] **Step 2:** `npx supabase stop` + `npx supabase start` (toma la config nueva) y `npm run db:test` → PASS.
- [ ] **Step 3:** recorrido completo en local con Mailpit: crear cuenta → mail con la plantilla en castellano → confirmar → queda ingresado; salir; ingresar con contraseña; ingresar con contraseña mala (mensaje de Task 2); ingresar sin confirmar (mensaje de Task 2).
- [ ] **Step 4:** `npx supabase config push --dry-run` (o el equivalente de la CLI) contra el proyecto vinculado: confirmar que el diff muestra el SMTP de Brevo y `enable_signup = false` para producción, **sin** imprimir la clave. Si la CLI no aplica `[remotes]`, sacar el SMTP de `config.toml` y dejar anotado que se carga a mano en el panel (lo hace el usuario).
- [ ] **Step 5:** commit `feat: auth mail templates and brevo smtp for production` (sin `supabase/.env`).

### Task 8: Docs y registro

**Files:**
- Modify: `CLAUDE.md` (regla "Se ingresa solo con Google" → Google o mail y contraseña, mails de Auth por Brevo; `'use client'` suma `ingresar/contrasena`), `docs/BACKEND.md` (Auth, SMTP en `[remotes.produccion]`, `BREVO_SMTP_KEY` en `supabase/.env`, sección "Mails"), `docs/ESTRUCTURA.md` (rutas y componentes nuevos), `docs/BITACORA.md`, `docs/RUBRICA.md` (cuentas completas; conteo de tests), `docs/PENDIENTES.md`, `docs/QA-MANUAL.md` (pasos para la demo), `docs/proceso/hallazgos.md` (entrada nueva: por qué ahora sí funciona, con referencia a la de la sesión 02, sin editar la vieja).

- [ ] **Step 1:** actualizar los docs.
- [ ] **Step 2:** `npm run lint`, `npm test`, `npm run build`, `npm run db:test` en verde.
- [ ] **Step 3:** commit `docs: email and password sign in`; push y PR con la plantilla y el checklist.

### Task 9: Puesta en producción en dos pasos (con el usuario)

- [ ] **Step 1:** pedir OK y correr `npx supabase config push` (SMTP, plantillas, límites; `enable_signup` en false en producción).
- [ ] **Step 2 (👤):** el usuario crea en el panel de Supabase (Authentication → Users → Add user → Create new user, con "Auto confirm") una cuenta con su mail que no es de Google, y después usa "Olvidé mi contraseña" desde la preview del PR (el link del mail vuelve a producción, que todavía no tiene `/ingresar/contrasena`: para esta prueba alcanza con que el mail llegue con la plantilla). Anotar: llegó / carpeta / plantilla bien. La confirmación de cuenta se prueba en el Step 4.
- [ ] **Step 3:** si llegó: cambiar `[remotes.produccion.auth.email] enable_signup = true`, commit, pedir OK y `config push`. Si no llegó: parar, dejar `false` y no mergear.
- [ ] **Step 4:** con OK, merge del PR. Prueba de punta a punta en producción: crear cuenta con Hotmail/Yahoo y con Gmail, confirmar, ingresar, olvidé, contraseña nueva, reservar (el teléfono queda guardado).
- [ ] **Step 5 (👤):** borrar las cuentas de prueba menos la de mail no Google, que queda para la demo.
