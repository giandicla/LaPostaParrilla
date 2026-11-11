// Versiones chicas de las fotos, para que el celular no baje la grande.
// node scripts/variantes-img.mjs
//
// Por cada public/img/<carpeta>/<foto>.webp genera <foto>-480.webp y
// <foto>-960.webp (si la original es más ancha) y escribe en
// src/data/imagenes.js el ancho de cada foto, que usa srcSetDe(). Correrlo
// después de scripts/procesar-assets.py o de agregar una foto.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RAIZ = 'public/img';
const ANCHOS = [480, 960];
const ES_VARIANTE = /-\d+\.webp$/;

const anchos = {};
for (const carpeta of fs.readdirSync(RAIZ)) {
  // En la raíz también hay archivos sueltos (compartir.jpg): solo carpetas
  if (!fs.statSync(path.join(RAIZ, carpeta)).isDirectory()) continue;
  for (const archivo of fs.readdirSync(path.join(RAIZ, carpeta))) {
    if (!archivo.endsWith('.webp') || ES_VARIANTE.test(archivo)) continue;
    const origen = path.join(RAIZ, carpeta, archivo);
    const { width } = await sharp(origen).metadata();
    const src = `/img/${carpeta}/${archivo}`;
    anchos[src] = [];
    for (const ancho of ANCHOS.filter((a) => a < width)) {
      const destino = origen.replace(/\.webp$/, `-${ancho}.webp`);
      await sharp(origen).resize({ width: ancho }).webp({ quality: 74 }).toFile(destino);
      anchos[src].push(ancho);
    }
    anchos[src].push(width);
  }
}

fs.writeFileSync('src/data/imagenes.js', `// Generado por scripts/variantes-img.mjs: no editar a mano.
// Anchos disponibles de cada foto; el último es la original.
const ANCHOS = ${JSON.stringify(anchos, null, 2)};

// srcSet de una foto de public/img: las versiones chicas y la original. Una
// ruta que no está en la lista (por ejemplo, un SVG) no lleva srcSet.
export function srcSetDe(src) {
  const anchos = ANCHOS[src];
  if (!anchos) return undefined;
  const ultimo = anchos.length - 1;
  return anchos
    .map((ancho, i) => \`\${i === ultimo ? src : src.replace(/\\.webp$/, \`-\${ancho}.webp\`)} \${ancho}w\`)
    .join(', ');
}
`);
console.log(Object.keys(anchos).length, 'fotos');
