# Estructura del sitio

## Rutas

| Ruta | Página | Qué tiene |
|---|---|---|
| `/` | Inicio | Los 8 bloques de la home |
| `/carta` | Carta | La carta del local activo, pedida a `GET /api/v1/carta`, dibujada como la carta impresa del local (`HojaCarta`): índice de secciones arriba, una sección abajo de la otra, vinos por cepa y bodega, cubierto al pie. Mientras carga, "Cargando la carta…"; si falla, mensaje y WhatsApp del local. Acepta `?local=<id>` y anclas (`#parrilla-entradas`) |
| `/reservas` | Reservas | "Reservar en:" con la foto de cada salón y, debajo, el formulario en una card (nombre, teléfono, fecha, hora, personas, comentarios hasta 100). Sin sesión: los salones y "Ingresar con Google". Con más de 6 personas el botón pasa a "Reservar por WhatsApp" con el mensaje armado. El admin no la usa: lo lleva al panel. Acepta `?local=<id>` |
| `/reservas/pago` | Reservas | Adonde vuelve el cliente desde Mercado Pago (`?reserva=<id>`). No decide nada con la URL: espera (tiempo real + consulta cada 5 s) a que la reserva figure `confirmada`, o muestra pago rechazado con "Reintentar", reserva cancelada o vencida, o pago tardío con reintegro |
| `/ingresar` | Cuenta | Un solo botón, "Continuar con Google" (la primera vez crea la cuenta). Acepta `?volver=<ruta>` |
| `/mis-reservas` | Cuenta | Próximas y anteriores; `esperando_pago` con "Pagar seña" y el tiempo que falta; cancelar hasta 1 h antes (con reintegro de la seña), después WhatsApp. El admin no la usa: lo lleva al panel |
| `/admin` | Admin | Nueva reserva (del local: sin cuenta, confirmada, hasta 40 personas, mail opcional); reservas por fecha, local y estado, con el estado de la seña; cancelar (pide el motivo, "No hay lugar" por defecto) y mover; "Reintegros pendientes" con "Reintentar"; notas internas; días bloqueados, enteros o por turno; tiempo real. `?local=<id>` abre "Nueva reserva" con ese salón |
| `/admin/dia` | Admin | Lista del día para imprimir. Acepta `?fecha=` y `?local=` |
| `/admin/carta` | Admin | Editar la carta: un local (sus secciones y el cubierto) o "Vinos" (las secciones compartidas, por bodega). Por ítem: precio(s), nombre, descripción, traducción (detalle en vinos), subir, bajar, borrar; "Agregar" al final de cada sección. En vinos: región y subir/bajar de cada bodega. Links a imprimir cada local. Acepta `?vista=<id del local o vinos>` |
| `/admin/carta/imprimir` | Admin | La carta de un local en hoja oficio a dos columnas, con el marco del local en cada hoja; abre la ventana de imprimir ("Guardar como PDF"). Acepta `?local=<id>` |
| `/nosotros` | Nosotros | Historia + un bloque por local + contacto |
| `/api/v1/pagos` | API | `POST`: crea el pago y la preferencia de Checkout Pro de la seña y devuelve el `initPoint`. Requiere sesión (token de Supabase) |
| `/api/v1/reservas/[id]/cancelacion` | API | `POST`: cancela la reserva (cliente o admin, con la sesión de quien llama) y reintegra la seña; también reintenta un reintegro pendiente |
| `/api/webhooks/mercadopago` | API | `POST`: avisos de Mercado Pago. Valida la firma, consulta el pago real y concilia en la base |
| `/api/v1/carta` | API | `GET ?local=<id>`: la carta de un local (sus secciones + las compartidas). Pública, cacheada 1 minuto; `&fresca=1` sin caché (el panel) |
| `/api/v1/carta/items` y `/items/[id]` | API | `POST` crea un ítem; `PATCH` lo edita o lo mueve (`mover`); `DELETE` lo borra. Solo admin |
| `/api/v1/carta/secciones/[id]/bodegas` | API | `PATCH`: región de una bodega o moverla entera. Solo admin |
| `/api/v1/carta/locales/[id]` | API | `PATCH`: el cubierto. Solo admin |
| `*` | — | `app/not-found.jsx` — página 404 con links de vuelta |

## Inicio, bloque por bloque

1. **Navbar** — fija. Translúcida sobre el hero, bordo sólida al pasar 80px. En las
   demás rutas arranca sólida. Mobile: panel a pantalla completa.
2. **Hero** — `100svh`, foto del cordero al asador con velo bordo. Habla de la
   marca, no de un local. Logo vectorial dentro de un marco fino (como la portada
   del manual), bajada y dos botones. El `h1` queda oculto visualmente: el logo ya
   dice el nombre.
3. **Bienvenida** — texto + 3 fotos.
4. **Lo que nos mueve** — fondo oliva. Los tres valores del manual de marca, textuales.
5. **Nuestros dos salones** — fondo arena, dos `LocalCard`. El bloque que resuelve la división.
6. **Algunos de nuestros platos** — 8 `PlatoCard` con foto sobre fondo bordo, cuatro
   de cada local. **Sin precio**: los precios están en la carta.
7. **Visitanos** — dos `InfoLocal` con horarios, mapa y contacto.
8. **Footer** — bordo. Las dos direcciones, Instagram una vez.

## Componentes

| Componente | Props | Qué hace |
|---|---|---|
| `Navbar` | — | Navegación, estado de scroll, menú mobile |
| `Footer` | — | Links, redes, las dos direcciones |
| `Hero` | `titulo`, `bajada`, `imagen`, `alt`, `conLogo`, `compacto`, `acciones` | Portada. Completa en el Inicio, compacta en el resto |
| `Section` | `id`, `fondo` (`crema`/`arena`/`bordo`/`oliva`), `titulo`, `bajada`, `ancho`, `children` | Ancho máximo, padding vertical, color de fondo. El título lleva el fogón del logo encima |
| `Boton` | `variante` (`primario`/`claro`/`contorno`/`texto`), `tamano`, `to`, `href`, `onClick`, `children` | Link interno, externo o botón según las props |
| `LocalCard` | `local` | Tarjeta grande de un salón, con sus dos CTA |
| `SelectorLocal` | `locales`, `localActivoId`, `onChange` | Toggle. Controlado |
| `SesionProvider` | `children` | Contexto de sesión: `useSesion()` → `sesion`, `perfil`, `cargando`, `esAdmin`, `recargarPerfil()` |
| `RequiereSesion` | `admin?`, `soloClientes?`, `mensaje?`, `sinSesion?`, `children` | Muestra `children` solo con sesión (y rol admin si se pide); si no, explica y ofrece ingresar, o muestra `sinSesion`. Con `soloClientes`, al admin lo lleva a `/admin` con la misma query. Comodidad, no seguridad |
| `NuevaReservaLocal` | `idLocalInicial`, `alGuardar(mensaje)`, `alCerrar` | Formulario del panel para cargar una reserva que tomó el local |
| `Campo` | `id`, `etiqueta`, `opcional?`, `ayuda?`, `error?`, `children(props)` | Etiqueta + control + error + ayuda. `children` es una función que recibe `id`, `aria-invalid` y `aria-describedby` para conectar el control con sus mensajes |
| `EstadoReserva` | `estado` | Etiqueta de esperando pago / pendiente / confirmada / rechazada / cancelada / vencida |
| `SelloMercadoPago` | — | Cartel oficial de Mercado Pago (Brand Brick de `@mercadopago/sdk-react`) bajo el botón de pagar la seña: Mercado Pago dibuja su logo y los medios de pago. Necesita `NEXT_PUBLIC_MP_PUBLIC_KEY`; sin ella no se muestra |
| `Icono` | `nombre` (`google` / `instagram` / `whatsapp`), `className?` | Logo de marca en SVG inline, decorativo (`aria-hidden`). Google con sus colores oficiales; los otros toman el color del texto |
| `PlatoCard` | `nombre`, `descripcion`, `imagen`, `etiquetaLocal?` | Foto de plato en retrato con el nombre encima. Sin precio, a propósito |
| `SeccionCarta` | `seccion`, `idAncla` | Una sección de la carta: platos (nombre, descripción, traducción EN/PT, uno o más precios) o vinos agrupados por bodega. La fuente y el filete del título los toma de la hoja que la contiene |
| `HojaCarta` | `local`, `cubierto`, `columnas` (1 o 2), `children` | La hoja de la carta impresa: marco recto (parrilla) o redondeado (restaurante) según `local.carta.estilo`, logo, `local.carta.bajada` y el cubierto al pie. Dos columnas para imprimir |
| `EditorItemCarta` | `seccion`, `item?`, `bodegas?`, `primero`, `ultimo`, `alCambiar`, `alCancelar?` | Un ítem en `/admin/carta`, con su validación; sin `item`, el formulario para agregar (en vinos pide bodega y región) |
| `GaleriaGrid` | `imagenes[]` | Grilla de 3 fotos, la del medio vertical |
| `InfoLocal` | `local` | Horarios, mapa y contacto de UN local |

**Regla:** ningún componente importa `locales.js` salvo `Footer`, que muestra las dos
direcciones en todas las páginas. Todos los demás reciben el local por props, y por eso
sumar un tercer local no obliga a tocarlos.

Aparte de eso, algunos componentes importan constantes que no son de local:
`Navbar`, `Footer` y `Hero` leen `MARCA` (logo y nombre de la marca).

## Servicios (`src/servicios/`)

La única capa que habla con Supabase. Detalle en `docs/BACKEND.md`.

| Archivo | Qué exporta |
|---|---|
| `supabase.js` | El cliente, `backendDisponible`, `mensajeDeError(error)` (errores de Postgres/Auth en castellano) |
| `auth.js` | Ingresar con Google, salir, escuchar la sesión, leer y actualizar el perfil |
| `reservas.js` | Franjas, días bloqueados, crear / listar / cancelar reservas, utilidades de fecha en hora argentina |
| `admin.js` | Listar y filtrar reservas, mover, notas, bloqueos (por día o por turno), reintegros pendientes, suscripción en tiempo real |
| `pagos.js` | `iniciarPago`, `cancelarReserva`, `reintentarReintegro`: llaman a las rutas de `app/api/` con el token de la sesión (el Access Token de Mercado Pago nunca llega al navegador) |
| `carta.js` | `leerCarta(idLocal, { fresca })` (pública) y, para el admin, `crearItem`, `editarItem`, `borrarItem`, `moverItem`, `editarBodega`, `cambiarCubierto`: llaman a `app/api/v1/carta` |

## Servidor (`src/servidor/`)

Código de los Route Handlers de pagos. **Ningún componente lo importa.** Recibe la
base y Mercado Pago por parámetro, así se testea sin red (`npm test`). Detalle y
variables de entorno en `docs/BACKEND.md`.

| Archivo | Qué hace |
|---|---|
| `avisos.js` | Procesa un aviso de pago ya firmado: lee el pago real en Mercado Pago, concilia con `acreditar_pago` y reintegra un pago tardío o duplicado |
| `base.js` | La base vista desde pagos: leer reserva, crear pago, acreditar, pagos a reintegrar. Usa la clave secreta |
| `cancelaciones.js` | Cancela con la sesión de quien llama y reintegra cada pago aprobado (puede haber más de uno) |
| `carta.js` | `armarCarta` (de las filas de la base a la carta que dibuja la web; la forma está documentada ahí) y los casos de uso de las rutas de la carta, que exigen admin para escribir |
| `carta-base.js` | La carta vista desde las rutas: leer las filas, escribir con el cliente de quien llama, errores de la base en castellano |
| `esquemas.js` | Esquemas Zod de lo que llega a las rutas (400 si no cumple) y `leerCuerpo` |
| `firma.js` | Valida `x-signature` del webhook (HMAC-SHA256 en tiempo constante) |
| `mercadopago.js` | Cliente del SDK oficial: crear preferencia, leer pago, reintegrar |
| `pagos.js` | `iniciarPagoDeSena`: valida la reserva, crea el pago y la preferencia |
| `preferencia.js` | Cuerpo de la preferencia (función pura) y el plazo de 15 minutos |
| `reintegros.js` | Reembolso total con clave de idempotencia `reintegro-<id de Mercado Pago>` |
| `sitio.js` | `urlDelSitio`: la URL pública para la vuelta y el webhook. En producción, el dominio que informa Vercel (`VERCEL_PROJECT_PRODUCTION_URL`); en previews y local, `APP_URL` |
| `respuestas.js` | `ErrorHttp`, `json` y `manejar`: errores JSON uniformes, sin stack trace al cliente |
| `supabase.js` | Cliente con la clave secreta y cliente con el token de quien llama |

## Validación (`src/validacion/`)

Funciones puras, sin React, con sus tests al lado (`npm test`).

| Archivo | Qué exporta |
|---|---|
| `reservas.js` | `LIMITES`, `validarNombre`, `validarTelefono`, `limpiarTelefono` (filtra mientras se escribe), `validarFecha`, `validarHora`, `validarPersonas`, `validarComentarios`, `validarMotivo`, `validarReserva(datos, contexto)` → `{ campo: mensaje }`, `hayErrores` |
| `carta.js` | `LIMITES_CARTA`, `validarNombreItem`, `validarPrecio` (acepta `6000`, `6.000` y `$ 6.000`), `validarPrecios(valores, tamanos)`, `validarTexto`, `aEntero` |

Cada función devuelve el mensaje de error o `''`. La base repite las mismas reglas
(trigger `validar_contacto`), porque la validación del navegador se puede saltear.

## Datos

| Archivo | Qué exporta |
|---|---|
| `marca.js` | `MARCA` — nombre, bajada, ciudad, Instagram, email, logo (blanco) y logoOscuro (bordo) |
| `locales.js` | `LOCALES`, `getLocal(id)`, `esIdDeLocal(id)`, `ID_LOCAL_POR_DEFECTO` |
| `platos.js` | `getPlatosDestacados()` — los platos con foto de la home, por local |
| `carta.js` | `formatearPrecio(n)`. La carta ya no está acá: vive en la base (tablas `carta_secciones` y `carta_items`, desde la sesión 06) |
| `textos.js` | `TEXTOS` — bienvenida, valores de la marca, historia, condiciones de reserva |

Forma de un local:

```js
{ id, nombre, tagline, descripcion, direccion, mapaEmbedUrl,
  telefono, whatsapp, carta: { estilo, bajada }, horarios: [{dia, franja}],
  franjasReserva: [string], imagenes: { card, hero, galeria: [{src, alt}] } }
```

`telefono` y `whatsapp` pueden ser `null`. La UI esconde lo que falta. `carta.estilo` es
`'recto'` o `'redondeado'`: el marco y los títulos de su carta impresa.

## Estilos

- `src/styles/tokens.css` — todas las custom properties. **Ningún color literal
  fuera de acá.**
- `src/styles/global.css` — reset, base, foco visible, `prefers-reduced-motion`.
- `src/styles/fuentesCarta.js` — las fuentes de la hoja de la carta (Oswald, Pathway
  Gothic One, Old Standard TT), parecidas a las de las cartas impresas.
- Un `.module.css` por componente, al lado del `.jsx`.

## Imágenes

Todo lo genera `scripts/procesar-assets.py` desde la carpeta `Branding y fotos/`:

| Carpeta | Qué hay |
|---|---|
| `public/img/{parrilla,restaurante,comunes}/` | Fotos reales en WebP, 1000–1638px de ancho |
| `public/logo/` | Logo vectorial en SVG: blanco, bordo, con y sin "Parrilla Patagónica", y el fogón solo (ornamento de los títulos, usado como máscara CSS) |
| `app/icon.svg` | Favicon: el fogón blanco sobre bordo |

La lista de qué foto va a qué archivo está en el script (`FOTOS`). Para cambiar una
foto se cambia ahí y se vuelve a correr.
