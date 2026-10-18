# Pendientes

## Datos que tiene que pasar la familia

### Parrilla
- [x] Dirección — `Av. Arrayanes 263, Q8407 Villa La Angostura, Neuquén` (compartida)
- [x] Mapa de Google (por ahora uno solo para los dos: la ficha de La Posta Parrilla Patagónica)
- [x] Horarios — todos los días 12 a 23, igual en temporada alta y baja
- [x] Franjas de reserva — 12:00 a 13:00 y 20:00 a 21:00, cada 15 minutos
- [x] Teléfono / WhatsApp — `+54 9 2944 96-6199`
- [x] Carta en PDF (reemplazó al link de Canva)

### Restaurante
- [x] Nombre exacto: **La Posta II Restaurante**
- [x] Dirección — `Av. Arrayanes 263, Q8407 Villa La Angostura, Neuquén` (compartida)
- [x] Mapa de Google (por ahora uno solo para los dos: la ficha de La Posta Parrilla Patagónica)
- [x] Horarios — todos los días 12 a 23, igual en temporada alta y baja
- [x] Franjas de reserva — 12:00 a 13:00 y 20:00 a 21:00, cada 15 minutos
- [x] Teléfono / WhatsApp — `+54 9 2944 86-1339`
- [x] Carta en PDF
- [x] Confirmado: la foto `Trucha con salsa.jpg` es la trucha al roquefort

### Los dos
- [ ] Tagline real (los actuales son borrador)
- [x] Carta en PDF
- [x] Fotos en alta: salón, parrilla, platos
- [x] La red y clave del WiFi quedan tapadas en las dos cartas de la web
      (decisión del usuario, 2026-10-01). En las cartas impresas siguen.

### De la marca
- [x] Email — `lapostavla@gmail.com` (compartido)
- [x] Apertura — diciembre de 2020 (`MARCA.apertura`)
- [ ] Historia real de la familia (el texto de `/nosotros` sigue siendo borrador)
- [x] Logo vectorial (`Logo.ai`) y manual de marca

Todos están marcados en el código. Para encontrarlos:

```bash
grep -rn "PENDIENTE" src/
```

## Assets

- [x] Reemplazar los SVG placeholder de `public/img/` por las fotos reales.
- [x] Reemplazar `public/logo.jpg` por la versión en alta (ahora SVG en `public/logo/`).
- [ ] **Cada vez que la familia cambie la carta**, reemplazar el PDF en
      `Branding y fotos/` y correr `python scripts/procesar-assets.py "../Branding y fotos"`.
      Las hojas del sitio son una foto del PDF, no se actualizan solas.

## Decisiones a tomar

- [ ] Consultar con el profesor si prefiere otra forma de estilos (CSS Modules vs
      Tailwind vs CSS plano).
- [x] Definir si la carta del sitio se mantiene a mano o se enlaza al Canva.
      Resuelto en la sesión 02 por el usuario: la carta es el PDF, tal cual,
      hoja por hoja. Se borraron los platos de ejemplo.

## Hallazgos diferidos de la etapa 1

Cosas que salieron en revisiones durante la construcción y se dejaron a propósito
para más adelante, porque no bloquean la maqueta visual. Ninguna es una regresión
introducida por esta tarea de documentación; quedan acá para que no se pierdan.

- [x] `getDestacados()` en `src/data/menu.js` usaba `.slice(1, 3)` sin guarda:
      con los datos de ese momento devolvía Empanadas y Tabla de ahumados para la
      parrilla, dos entradas que no representan la propuesta del local (brasas,
      cordero). Resuelto en la revisión final: se eliminó el `.slice` y se agregó
      `destacado: true` a mano en dos platos por local en `CARTAS`
      (`src/data/menu.js`); `getDestacados()` ahora filtra por ese flag en vez de
      tomar una posición fija, así que ya no puede devolver menos de lo esperado
      en silencio ni platos que no representen la cocina del local.
- [ ] `LocalCard` lee `local.horarios[0]` sin verificar que el array tenga
      elementos. Un tercer local sin horarios cargados rompería el render.
- [ ] El proyecto usaba tres breakpoints distintos para la misma idea: 600px en la
      grilla de platos, 768px en navbar y footer, 900px en las grillas de locales y
      bienvenida. La tarea 14 lo resolvió a medias: la grilla de platos pasó a
      768px, igual que navbar y footer (900px queda aparte, para las grillas de
      locales) — pero quedaron otros dos 600px/421px sin tocar ni explicar:
      `app/reservas/page.module.css` sigue cambiando de layout a los 600px
      (`.fila` y `.opcionesLocal`), y `SelectorLocal.module.css` tiene su propio
      breakpoint en 421px para el tamaño de los botones del selector. Reabierto en
      la revisión final: ninguno de los dos se tocó, porque no forman parte de los
      hallazgos de esta pasada; falta decidir si se unifican con 768px o si hay una
      razón real (contenido más angosto) para dejarlos aparte.
- [x] `--madera` sobre `--crema` daba un contraste de ~4.88:1 en los precios. Pasa
      AA (mínimo 4.5:1) pero con poco margen. Resuelto en la tarea 14: se oscureció
      el token a `#7A5134` (~6.02:1 sobre `--crema`).
- [ ] El input de fecha de `/reservas` no tiene `min`, así que se puede pedir una
      fecha pasada. Se difirió a propósito: calcular la fecha de hoy durante el
      render de una página prerenderizada arriesga un desajuste de hidratación, y el
      formulario todavía no envía nada. Va junto con la validación real del CRUD.
- [x] El panel mobile del navbar ahora cierra con Escape y devuelve el foco al botón
      hamburguesa al cerrarse. Resuelto en la tarea 14.
- [ ] Al abrirse, el panel mobile todavía no mueve el foco hacia adentro. Quien lo
      abre con teclado queda con el foco en el botón, detrás del panel. Se dejó
      pendiente a propósito en la etapa 1: mover el foco bien exige también atraparlo
      dentro del panel mientras está abierto, y eso es más trabajo del que justifica
      una maqueta.
- [x] El contrato de `GaleriaGrid` (exactamente 3 imágenes, la segunda vertical)
      vivía solo en un comentario del CSS. Resuelto en la tarea 14: ahora también
      está documentado en el `.jsx`.
- [x] `aSlug` en `app/carta/page.jsx` podía devolver cadena vacía. Ya no aplica:
      la carta escrita a mano (y `aSlug` con ella) se eliminó en la sesión 02.

## Diseño: que no parezca hecho por IA

Pedido del usuario (2026-10-08). Diagnóstico de la IA mirando el sitio en producción;
el pase se hace en una sesión con el plugin de UI/UX cargado.

**Actualización (sesión 04):** el pase general se hizo y **el usuario lo descartó**:
prefiere el diseño actual (PR #5 cerrado, rama `feat/diseno-propio`). Lo que sí se
rehízo fue `/reservas`, que era lo único que no lo convencía. Los puntos de abajo
quedan como referencia; no se trabajan sin que el usuario lo pida.

- [ ] **Todas las secciones usan la misma plantilla**: ornamento centrado + título en
      mayúsculas centrado + rayita + bajada centrada + grilla pareja de tarjetas. El
      ritmo es idéntico de arriba a abajo. Variar: bloques asimétricos, foto a sangre
      con texto al costado, títulos alineados a la izquierda.
- [ ] **Tarjetas por todos lados** con sombra, borde redondeado y etiqueta tipo chip
      ("LA PARRILLA") en la esquina: es el patrón de cualquier template.
- [ ] **El hero** (logo dentro de un marco fino + dos botones centrados sobre una foto
      con velo) es la portada de restaurante más genérica posible.
- [ ] **Tríadas**: "Lo que nos mueve" en tres columnas iguales, tres valores. Los
      textos del manual son reales, pero la maqueta los hace sonar a relleno.
- [ ] **Botones** todos en mayúsculas con letterspacing, en todas las secciones.
- [ ] **Fotos que cargan tarde**: los platos de La Posta II y la card del restaurante
      se ven como rectángulos vacíos mientras cargan. Falta un color de fondo o un
      blur de la foto como placeholder.
- [ ] **Falta textura humana**: no hay gente, familia, reseñas, Instagram, ni detalles
      de la carta impresa (papel, tipografía de menú). Todo es foto de producto.

## Etapas futuras

### Etapa 2 — Backend con Supabase (partes 1 y 2)
- [x] Spec: `docs/superpowers/specs/2026-10-01-backend-supabase-design.md`
- [x] Capa de servicios aislada (`src/servicios/`)
- [x] Cuentas (Google + email), reservas reales, mis reservas, panel de admin,
      notas, días bloqueados, lista del día, tiempo real, mails con Brevo
- [x] Tests: 33 pgTAP de la base, 7 de la lógica de mails, recorrido Playwright
- [x] Proyecto remoto `la-posta`: migraciones, función, secretos, auth y variables en Vercel
- [x] Credenciales de Google OAuth (cuenta de la facultad)
- [ ] 👤 Cuenta de Brevo, remitente verificado y API key (solo para los mails de reservas: el ingreso es con Google y no manda mails)
- [x] Primer admin en producción: gdiclaudio@itba.edu.ar
- [ ] Si las previews (que usan la base de producción) empiezan a ensuciar datos
      reales: proyecto de Supabase aparte para pruebas.
- [ ] Panel: editar los datos de una reserva ya cargada (nombre, teléfono, mail,
      personas). Hoy solo se mueve de fecha y hora.
- [ ] El link de "Imprimir" del panel abre otra página: probar la impresión real
      en la computadora del local

### Etapa 2.3 — Admin de contenido (parte 3)
- [ ] Pasar `cartas.json` a tablas, con interruptor "agotado"
- [ ] Editar franjas de reserva y horarios de atención desde el panel

### Etapa 3 — Pagos
- [x] **Seña de la reserva con Mercado Pago** (2026-10-18): Checkout Pro, webhook
      firmado, conciliación, vencimiento a los 15 minutos, bloqueo por turno. Spec:
      `docs/superpowers/specs/2026-10-15-sena-reservas-mercadopago-design.md`;
      detalle en `docs/BACKEND.md`; probada en la preview (PR #8).
- [ ] Gift cards (spec propio)
- [ ] Pedido para llevar (spec propio)

**Pendientes que dejó la seña**

- [ ] **Reintegro en modo de prueba.** Mercado Pago responde 401 "Unauthorized use of
      live credentials" al reembolsar con las credenciales del vendedor de prueba
      (`hallazgos.md` 1.18). Salidas: una aplicación con credenciales de prueba propias
      (`APP_USR` en "Credenciales de prueba"; la real solo tiene `TEST-`), o devolver
      los pagos a mano desde el panel del vendedor de prueba. Reservas cuyo
      pago quedó en `reintegro_pendiente`: `7410e296` (cancelada por el cliente) y
      `c55bdcf1` (cancelada por el admin). Hasta resolverlo, el reintegro automático no está probado
      contra Mercado Pago.
- [ ] **Falta el test del ranking de `estadoSena`** (que `[reintegrado, aprobado]` dé
      `'aprobado'`): el informe del arreglo decía que estaba y no estaba
      (`hallazgos.md` 1.20). Además, `src/servicios/reservas.test.js` importa
      `estadoDelPago` sin usarlo.
- [ ] **Volver a prender la Vercel Authentication en las previews** (se apagó para
      que el webhook de Mercado Pago llegara) cuando termine de probarse.
- [ ] **Next.js / `npm audit`:** 8 vulnerabilidades altas, anteriores a la seña
      (`next`, la cadena de `eslint-config-next`, `sharp`, `source-map-js`). Subir
      Next.
- [ ] Limpiar las reservas y pagos de prueba que quedaron en la base de producción
      (las previews la comparten) y anotarlo en `BITACORA.md`.

**Menores diferidos de las revisiones** (no bloquean; una línea cada uno):

- [ ] `cancelar_reserva` lee sin `for update`: un webhook o el cron concurrentes podrían
      pisar los chequeos (el dinero lo cubre `marcar_reintegro`).
- [ ] Un `p_motivo` de más de 120 caracteres da el error crudo `23514` en vez de un
      mensaje en castellano (el front ya limita a 120).
- [ ] `acreditar_pago` no compara el monto cobrado con el de la preferencia (en
      Checkout Pro lo fija el servidor); sumar un chequeo en `avisos.js`.
- [ ] `pagos.reserva_id` es `on delete cascade`: borrar un usuario borra sus registros
      de plata; evaluar `restrict`.
- [ ] Los reintegros de cobros duplicados que fallan solo se loguean (`console.warn`), no
      aparecen en el panel; un pago que quedó en `reintegro_pendiente` tras un
      reintegro exitoso con marcado fallido no se cura solo (sí con "Reintentar").
- [ ] Mail de cancelación: la línea de reintegro sale para cualquier cancelación web del
      admin, también de filas viejas `pendiente` que nunca pagaron; condicionarla a
      `confirmada`.
- [ ] `/reservas/pago` deja de consultar cuando la reserva pasa a `vencida`: un pago
      tardío cuyo aviso llega después no se ve hasta recargar.
- [ ] Tests faltantes: rutas y adaptadores (`base.js`, `supabase.js`) sin tests;
      pruebas pgTAP de bloqueo global por turno, borde de las 17:00 y cancelaciones
      del admin sin motivo.
- [ ] El texto "1 hora" de la ayuda de `/reservas` está escrito a mano; el control de
      puedePagar usa el reloj del navegador (el servidor igual lo valida).
- [ ] `esUrlPublica` no reconoce `[::1]` ni IPs de la red local.
- [ ] El plan (`docs/superpowers/plans/…`) todavía nombra `pagoAReintegrar`; el código
      usa `pagosAReintegrar`.
