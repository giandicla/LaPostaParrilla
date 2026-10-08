## Qué cambia

<!-- Una o dos líneas: qué hace este PR y por qué. -->

## Entregable / criterio de la rúbrica

<!-- E1…E6 o criterio transversal que mueve. Ver docs/RUBRICA.md -->

## Checklist

- [ ] `npm run lint` limpio
- [ ] `npm run build` sin errores; las rutas que eran estáticas siguen estáticas
- [ ] Probado en la preview de Vercel (desktop y celular)
- [ ] Accesible: se puede usar con teclado, foco visible, labels y textos alternativos
- [ ] Sin colores literales fuera de `src/styles/tokens.css`; sin `'parrilla'` / `'restaurante'` a mano en componentes
- [ ] Si toca la base: migración nueva + test pgTAP (`npm run db:test`)
- [ ] Si toca la API: probada con requests reales (válidos e inválidos)
- [ ] Sin secretos en el código (claves solo en variables de entorno)
- [ ] Docs al día: `docs/RUBRICA.md`, `docs/BITACORA.md` y lo que corresponda
