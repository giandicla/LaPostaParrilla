# Estructura del sitio

## Rutas

| Ruta | Página | Qué tiene |
|---|---|---|
| `/` | Inicio | Los 8 bloques de la home |
| `/carta` | Carta | La carta completa del local activo en HTML (índice, secciones, vinos por cepa y bodega) + toggle. Acepta `?local=<id>` |
| `/reservas` | Reservas | Sin sesión: invita a ingresar. Con sesión: formulario real (franjas de la base, máx. 6 personas, días bloqueados). Acepta `?local=<id>` |
| `/ingresar` | Cuenta | Un solo botón, "Continuar con Google" (la primera vez crea la cuenta). Acepta `?volver=<ruta>` |
| `/mis-reservas` | Cuenta | Próximas y anteriores; cancelar hasta 2 h antes, después WhatsApp |
| `/admin` | Admin | Reservas por fecha, local y estado; confirmar, rechazar, cancelar, mover; notas internas; días bloqueados; tiempo real |
| `/admin/dia` | Admin | Lista del día para imprimir. Acepta `?fecha=` y `?local=` |
| `/nosotros` | Nosotros | Historia + un bloque por local + contacto |
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
| `RequiereSesion` | `admin?`, `mensaje?`, `children` | Muestra `children` solo con sesión (y rol admin si se pide); si no, explica y ofrece ingresar. Comodidad, no seguridad |
| `Campo` | `id`, `etiqueta`, `opcional?`, `ayuda?`, `error?`, `children(props)` | Etiqueta + control + error + ayuda. `children` es una función que recibe `id`, `aria-invalid` y `aria-describedby` para conectar el control con sus mensajes |
| `EstadoReserva` | `estado` | Etiqueta de pendiente / confirmada / rechazada / cancelada |
| `Icono` | `nombre` (`google` / `instagram` / `whatsapp`), `className?` | Logo de marca en SVG inline, decorativo (`aria-hidden`). Google con sus colores oficiales; los otros toman el color del texto |
| `PlatoCard` | `nombre`, `descripcion`, `imagen`, `etiquetaLocal?` | Foto de plato en retrato con el nombre encima. Sin precio, a propósito |
| `SeccionCarta` | `seccion`, `idAncla` | Una sección de la carta: platos (nombre, descripción, traducción EN/PT, uno o más precios) o vinos agrupados por bodega |
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
| `admin.js` | Listar y filtrar reservas, cambiar estado, mover, notas, bloqueos, suscripción en tiempo real |

## Validación (`src/validacion/`)

Funciones puras, sin React, con sus tests al lado (`npm test`).

| Archivo | Qué exporta |
|---|---|
| `reservas.js` | `LIMITES`, `validarNombre`, `validarTelefono`, `validarFecha`, `validarHora`, `validarPersonas`, `validarComentarios`, `validarMotivo`, `validarReserva(datos, contexto)` → `{ campo: mensaje }`, `hayErrores` |

Cada función devuelve el mensaje de error o `''`. La base repite las mismas reglas
(trigger `validar_contacto`), porque la validación del navegador se puede saltear.

## Datos

| Archivo | Qué exporta |
|---|---|
| `marca.js` | `MARCA` — nombre, bajada, ciudad, Instagram, email, logo (blanco) y logoOscuro (bordo) |
| `locales.js` | `LOCALES`, `getLocal(id)`, `esIdDeLocal(id)`, `ID_LOCAL_POR_DEFECTO` |
| `platos.js` | `getPlatosDestacados()` — los platos con foto de la home, por local |
| `carta.js` + `cartas.json` | `getCarta(idLocal)`, `formatearPrecio(n)`. Las cartas transcriptas de los PDF; la forma está documentada en `carta.js` |
| `textos.js` | `TEXTOS` — bienvenida, valores de la marca, historia, condiciones de reserva |

Forma de un local:

```js
{ id, nombre, nombreCorto, tagline, descripcion, direccion, mapaEmbedUrl,
  telefono, whatsapp, cartaPdf, horarios: [{dia, franja}],
  franjasReserva: [string], imagenes: { card, hero, galeria: [{src, alt}] } }
```

`telefono`, `whatsapp` y `cartaPdf` pueden ser `null`. La UI esconde lo que falta.

## Estilos

- `src/styles/tokens.css` — todas las custom properties. **Ningún color literal
  fuera de acá.**
- `src/styles/global.css` — reset, base, foco visible, `prefers-reduced-motion`.
- Un `.module.css` por componente, al lado del `.jsx`.

## Imágenes

Todo lo genera `scripts/procesar-assets.py` desde la carpeta `Branding y fotos/`:

| Carpeta | Qué hay |
|---|---|
| `public/img/{parrilla,restaurante,comunes}/` | Fotos reales en WebP, 1000–1638px de ancho |
| `public/logo/` | Logo vectorial en SVG: blanco, bordo, con y sin "Parrilla Patagónica", y el fogón solo (ornamento de los títulos, usado como máscara CSS) |
| `public/cartas/` | El PDF de cada carta, para descargar (con el WiFi tapado) |
| `app/icon.svg` | Favicon: el fogón blanco sobre bordo |

La lista de qué foto va a qué archivo está en el script (`FOTOS`). Para cambiar una
foto se cambia ahí y se vuelve a correr.
