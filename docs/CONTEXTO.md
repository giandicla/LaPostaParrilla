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

La carta del sitio es el PDF de la familia, mostrado hoja por hoja tal cual se
imprime. Cuando cambien precios hay que regenerar las hojas (ver `CLAUDE.md`).

## La consigna

Trabajo práctico de **Programación Web**. El profesor pidió:

1. Convertir todo a **React**.
2. Crear cuenta en **Vercel**.
3. **Enlazarla con GitHub**.
4. Aclararle a la IA: **"solo hacé el React del front"**.

El punto 4 es una restricción de diseño, no una formalidad: nada de backend, API
routes ni base de datos, aunque técnicamente se pueda.

Más adelante el profesor va a enseñar **pagos**; recién ahí se agregan.

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

Next incluye backend, pero **este proyecto no usa nada de eso**: no hay `app/api/`,
no hay Server Actions, no hay base de datos. Se usa como generador del front, que es
compatible con el "solo el React del front" que pidió la cátedra. Las cinco rutas
compilan como estáticas, y eso conviene verificarlo en cada build.

### Por qué CSS Modules y no Tailwind

Es CSS real, explicable en la defensa, sin clases mágicas en el JSX. Se puede
revisar con el profesor más adelante si prefiere otra cosa.

### Por qué el local activo va en la URL

En `/carta?local=parrilla` el estado vive en la query string, no en `useState`.
Así el link se puede compartir apuntando a una carta concreta, el botón "atrás"
funciona, y las cards del Inicio pueden linkear directo a la carta correcta.

### Por qué el formulario de reservas no guarda nada

La etapa actual es maqueta visual. El CRUD tiene su propio spec y su propia etapa.
Mezclarlos habría hecho que ninguna de las dos quedara bien.

## Las etapas

| Etapa | Qué | Estado |
|---|---|---|
| 1 | Boceto visual: 4 páginas maquetadas, dos locales, deploy | Hecha |
| 2 | Backend con Supabase: ingreso con Google, reservas reales, panel de admin, mails (partes 1 y 2 del spec del backend) | **En producción** desde el 2026-10-06. Falta Brevo para que salgan los mails de reservas |
| 2.3 | Admin de la carta y de los horarios (parte 3) | No empezada |
| 3 | Pagos (después de que el profesor lo enseñe) | No empezada |
