# Pendientes

## Datos que tiene que pasar la familia

### Parrilla
- [ ] Dirección exacta
- [ ] URL de embed del mapa de Google
- [ ] Horarios reales por día, con días de cierre y temporada baja
- [ ] Franjas horarias de reserva
- [x] Teléfono / WhatsApp — `+54 9 2944 96-6199`
- [x] Link de la carta en Canva

### Restaurante
- [ ] Nombre exacto con el que se lo conoce
- [ ] Dirección exacta
- [ ] URL de embed del mapa de Google
- [ ] Horarios reales por día
- [ ] Franjas horarias de reserva
- [ ] Teléfono / WhatsApp
- [ ] Link del segundo Canva

### Los dos
- [ ] Tagline real (los actuales son borrador)
- [ ] Carta en PDF
- [ ] Fotos en alta: salón, parrilla, platos

### De la marca
- [ ] Email de contacto real
- [ ] Año de fundación e historia real de la familia
- [ ] Logo en alta resolución o vectorial (el actual es 150×150px)

Todos están marcados en el código. Para encontrarlos:

```bash
grep -rn "PENDIENTE" src/
```

## Assets

- [ ] Reemplazar los SVG placeholder de `public/img/` por las fotos reales,
      conservando los nombres de archivo y actualizando las extensiones en
      `src/data/locales.js` y `src/data/menu.js`.
- [ ] Reemplazar `public/logo.jpg` por la versión en alta.

## Decisiones a tomar

- [ ] Consultar con el profesor si prefiere otra forma de estilos (CSS Modules vs
      Tailwind vs CSS plano).
- [ ] Definir si la carta del sitio se mantiene a mano o se enlaza directo al Canva.
      Hoy conviven las dos: platos de ejemplo + botón al Canva.

## Hallazgos diferidos de la etapa 1

Cosas que salieron en revisiones durante la construcción y se dejaron a propósito
para más adelante, porque no bloquean la maqueta visual. Ninguna es una regresión
introducida por esta tarea de documentación; quedan acá para que no se pierdan.

- [ ] `getDestacados()` en `src/data/menu.js` usa `.slice(1, 3)` sin guarda. Con los
      datos actuales devuelve 2 platos por local, pero si un local llegara a tener
      menos platos devolvería menos, en silencio, rompiendo el invariante de "dos
      por local" que promete su propio comentario.
- [ ] `LocalCard` lee `local.horarios[0]` sin verificar que el array tenga
      elementos. Un tercer local sin horarios cargados rompería el render.
- [ ] El proyecto usa tres breakpoints distintos para la misma idea: 600px en la
      grilla de platos, 768px en navbar y footer, 900px en las grillas de locales y
      bienvenida. Conviene unificar.
- [ ] `--madera` sobre `--crema` da un contraste de ~4.88:1 en los precios. Pasa AA
      (mínimo 4.5:1) pero con poco margen. Oscurecer el token arreglaría todo el
      sitio de una vez.
- [ ] El input de fecha de `/reservas` no tiene `min`, así que se puede pedir una
      fecha pasada. Se difirió a propósito: calcular la fecha de hoy durante el
      render de una página prerenderizada arriesga un desajuste de hidratación, y el
      formulario todavía no envía nada. Va junto con la validación real del CRUD.
- [ ] El panel mobile del navbar no maneja foco: no enfoca al abrirse, no cierra con
      Escape, no devuelve el foco al botón al cerrar.
- [ ] El contrato de `GaleriaGrid` (exactamente 3 imágenes, la segunda vertical)
      vive solo en un comentario del CSS; convendría documentarlo en el `.jsx`.
- [ ] `aSlug` en `app/carta/page.jsx` podría devolver cadena vacía si una categoría
      fuera puramente simbólica, produciendo ids que colisionan. Ninguna categoría
      real lo dispara.

## Etapas futuras

### Etapa 2 — CRUD de reservas
- [ ] Escribir el spec
- [ ] Capa de servicios aislada, para que el backend real entre después sin
      reescribir componentes
- [ ] Listado de reservas (el contenedor ya está previsto al final de `/reservas`)
- [ ] Panel de administración: listar, editar, confirmar, cancelar
- [ ] Tests (la etapa 1 no tiene, por ser maqueta sin lógica)

### Etapa 3 — Pagos
- [ ] Esperar a que el profesor lo enseñe
