# Estructura del sitio

## Rutas

| Ruta | Página | Qué tiene |
|---|---|---|
| `/` | Inicio | Los 7 bloques de la home |
| `/carta` | Carta | Carta del local activo + toggle. Acepta `?local=<id>` |
| `/reservas` | Reservas | Formulario maquetado. Acepta `?local=<id>` |
| `/nosotros` | Nosotros | Historia + un bloque por local + contacto |
| `*` | — | `app/not-found.jsx` — página 404 con links de vuelta |

## Inicio, bloque por bloque

1. **Navbar** — fija. Translúcida sobre el hero, bordo sólida al pasar 80px. En las
   demás rutas arranca sólida. Mobile: panel a pantalla completa.
2. **Hero** — `100svh`, foto de fondo con overlay bordo. Habla de la marca, no de un
   local. Logo, nombre, bajada y dos botones.
3. **Bienvenida** — texto + 3 fotos.
4. **Nuestros dos salones** — dos `LocalCard`. El bloque que resuelve la división.
5. **Destacados** — 4 `PlatoCard` sobre fondo bordo, dos de cada local.
6. **Visitanos** — dos `InfoLocal` con horarios, mapa y contacto.
7. **Footer** — bordo. Las dos direcciones, Instagram una vez.

## Componentes

| Componente | Props | Qué hace |
|---|---|---|
| `Navbar` | — | Navegación, estado de scroll, menú mobile |
| `Footer` | — | Links, redes, las dos direcciones |
| `Hero` | `titulo`, `bajada`, `imagen`, `alt`, `conLogo`, `compacto`, `acciones` | Portada. Completa en el Inicio, compacta en el resto |
| `Section` | `id`, `fondo`, `titulo`, `bajada`, `ancho`, `children` | Ancho máximo, padding vertical, color de fondo |
| `Boton` | `variante`, `tamano`, `to`, `href`, `onClick`, `children` | Link interno, externo o botón según las props |
| `LocalCard` | `local` | Tarjeta grande de un salón, con sus dos CTA |
| `SelectorLocal` | `locales`, `localActivoId`, `onChange` | Toggle. Controlado |
| `PlatoCard` | `nombre`, `descripcion`, `precio`, `imagen`, `etiquetaLocal?` | Card de plato |
| `GaleriaGrid` | `imagenes[]` | Grilla de 3 fotos, la del medio vertical |
| `InfoLocal` | `local` | Horarios, mapa y contacto de UN local |

**Regla:** ningún componente importa `locales.js` salvo `Footer`, que muestra las dos
direcciones en todas las páginas. Todos los demás reciben el local por props, y por eso
sumar un tercer local no obliga a tocarlos.

Aparte de eso, algunos componentes importan constantes que no son de local:
`Navbar` y `Hero` leen `MARCA` (logo y nombre de la marca), y `PlatoCard` usa
`formatearPrecio` de `menu.js` para que el formato de precio viva en un solo lugar.

## Datos

| Archivo | Qué exporta |
|---|---|
| `marca.js` | `MARCA` — nombre, bajada, ciudad, Instagram, email, logo |
| `locales.js` | `LOCALES`, `getLocal(id)`, `esIdDeLocal(id)`, `ID_LOCAL_POR_DEFECTO` |
| `menu.js` | `getCarta(idLocal)`, `getDestacados()`, `formatearPrecio(n)` |
| `textos.js` | `TEXTOS` — bienvenida, historia, condiciones de reserva |

Forma de un local:

```js
{ id, nombre, nombreCorto, tagline, descripcion, direccion, mapaEmbedUrl,
  telefono, whatsapp, cartaUrl, horarios: [{dia, franja}],
  franjasReserva: [string], imagenes: { hero, galeria: [{src, alt}] } }
```

`telefono`, `whatsapp` y `cartaUrl` pueden ser `null`. La UI esconde lo que falta.

## Estilos

- `src/styles/tokens.css` — todas las custom properties. **Ningún color literal
  fuera de acá.**
- `src/styles/global.css` — reset, base, foco visible, `prefers-reduced-motion`.
- Un `.module.css` por componente, al lado del `.jsx`.

## Imágenes

`public/img/{parrilla,restaurante,comunes}/`. Hoy son SVG placeholder generados por
`npm run placeholders`. Cuando lleguen las fotos reales se reemplazan los archivos
conservando los nombres y se actualizan las extensiones en `locales.js` y `menu.js`.
