# Contexto del proyecto

## El restaurante

**La Posta** es un negocio gastronómico familiar en **Villa La Angostura**, Neuquén.
Son **dos locales bajo la misma marca**:

| | Parrilla | Restaurante |
|---|---|---|
| Propuesta | Brasas, cordero al asador, mesas largas | Pizzas, pastas caseras, fogón a leña |
| Teléfono | +54 9 2944 96-6199 | +54 9 2944 86-1339 |
| Dirección | Av. Arrayanes 263 — uno al lado del otro | Av. Arrayanes 263 |
| Horario | Todos los días, 12 a 23 | Todos los días, 12 a 23 |
| Nombre | La Posta Parrilla | La Posta II Restaurante |
| Carta | PDF de 6 hojas (comida y vinos) | PDF de 2 hojas |

Comparten dueños, identidad visual, nombre e Instagram (`@lapostavla`).
El local es de madera, acogedor, de montaña. La identidad sale del **manual de
marca** (`Branding y fotos/Branding.LaPosta.pdf`): bordo `#600003` y blanco como
principales, arena `#CBC1B1` secundario, oliva `#757036` destacado; Baskerville
para títulos y Gill Sans Nova para textos. (En la sesión 1 se había usado `#5F0004`,
medido de un logo JPEG chico; el manual lo corrigió.)

La carta vive en la base desde la sesión 06 (2026-10-29): el admin la edita en
`/admin/carta` y el sitio la muestra con la estética de las cartas impresas. Los
vinos son una carta aparte, compartida por los dos locales. El sitio no imprime ni
descarga la carta (decisión del usuario). Antes (sesión 02) la carta era el PDF de la
familia, y después una transcripción a JSON.

## La consigna

Trabajo práctico de **Programación Web**. El profesor pidió:

1. Convertir todo a **React**.
2. Crear cuenta en **Vercel**.
3. **Enlazarla con GitHub**.
4. Aclararle a la IA: **"solo hacé el React del front"**.

El punto 4 es una restricción de diseño, no una formalidad: nada de backend, API
routes ni base de datos, aunque técnicamente se pueda.

Más adelante el profesor va a enseñar **pagos**; recién ahí se agregan.

**Actualización (2026-10-08):** la consigna avanza clase a clase y el punto 4 era
la restricción de *esa* etapa. La grilla de corrección oficial pide CI/CD, API
interna, CRUD en Supabase, checkout con webhook y demo pública (ver
`docs/RUBRICA.md`). Ese día se dio en clase **webhooks y Mercado Pago**.

Repositorio: `https://github.com/giandicla/LaPostaParrilla`

## Las decisiones y por qué

### Por qué "un sitio, dos salones"

Se evaluaron tres formas de dividir el sitio:

| Patrón | Por qué no / sí |
|---|---|
| **A — Un sitio, dos salones** ✅ | La marca manda. Una sola home. La división aparece solo donde cambia la info: carta, reservas, contacto. Menos código y navegación simple, que además se defiende mejor en el TP. |
| B — Hub + sub-sitios (`/parrilla`, `/restaurante`) | Casi el doble de trabajo, y obliga a elegir antes de ver nada, lo que hace perder visitantes. |
| C — Selector global persistente en el navbar | Solo sirve si el contenido es casi idéntico. Acá las cartas son distintas, así que esconder un local detrás del otro empobrece el sitio. |

**Consecuencia:** los locales son **datos, no rutas**. Un array `LOCALES` y
componentes que iteran. Sumar un tercer local es agregar un objeto.

### Por qué Next.js

Lo pidió el profesor. El proyecto arrancó en Vite y se migró en la tarea 6M; el
detalle está en la sección 2.bis del spec.

Next incluye backend, pero **hasta ahora el proyecto no lo usa**: no hay
`app/api/` ni Server Actions. La base es Supabase y el front le habla desde el
navegador, con la RLS como seguridad (ver `docs/BACKEND.md`). Las once rutas
compilan como estáticas, y eso conviene verificarlo en cada build. Con la API del
catálogo y los pagos (E4, E6) entra código de servidor.

*(Actualizado en la sesión 04: antes decía "no hay base de datos", que dejó de ser
cierto en la sesión 02.)*

### Por qué CSS Modules y no Tailwind

Es CSS real, explicable en la defensa, sin clases mágicas en el JSX. Se puede
revisar con el profesor más adelante si prefiere otra cosa.

### Por qué el local activo va en la URL

En `/carta?local=parrilla` el estado vive en la query string, no en `useState`.
Así el link se puede compartir apuntando a una carta concreta, el botón "atrás"
funciona, y las cards del Inicio pueden linkear directo a la carta correcta.

### Por qué las reservas del local no tienen cuenta

Las reservas de la web son de un cliente con cuenta de Google. Las que toma el
local (teléfono, WhatsApp, en la puerta) las carga el admin desde el panel, a nombre
de alguien que no tiene cuenta. Por eso una reserva tiene `origen` (`web` o
`local`): las del local no tienen `usuario_id`, entran confirmadas y pueden ser de
hasta 40 personas. Ver `docs/superpowers/specs/2026-10-08-reservas-admin-design.md`.

*(Hasta la sesión 02, esta sección explicaba por qué el formulario era una maqueta
que no guardaba nada.)*

## Las etapas

| Etapa | Qué | Estado |
|---|---|---|
| 1 | Boceto visual: 4 páginas maquetadas, dos locales, deploy | Hecha |
| 2 | Backend con Supabase: ingreso con Google, reservas reales, panel de admin, mails (partes 1 y 2 del spec del backend) | **En producción** desde el 2026-10-06. Falta Brevo para que salgan los mails de reservas |
| 2.3 | Admin de la carta y de los horarios (parte 3) | **Carta en producción** desde el 2026-10-29 (API propia, editor con arrastre, vinos compartidos). Faltan las franjas y los horarios |
| 3 | Pagos con Mercado Pago: seña de la reserva, gift cards, pedido para llevar (decisión del usuario, 2026-10-08) | **Seña en producción** desde el 2026-10-18 (modo de prueba). Faltan gift cards y pedido para llevar |
