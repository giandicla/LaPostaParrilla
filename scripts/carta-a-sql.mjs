// Genera la carga inicial de la carta (supabase/migrations/…_carta_datos.sql)
// desde src/data/cartas.json y src/data/vinos.json. Se corrió una vez, en la
// sesión 06, cuando la carta pasó a la base; desde ahí la carta se edita en el
// panel y los JSON ya no existen.
//
//   node scripts/carta-a-sql.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf8'));
const CARTAS = leer('../src/data/cartas.json');
const VINOS = leer('../src/data/vinos.json');
const DESTINO = new URL('../supabase/migrations/20261029120100_carta_datos.sql', import.meta.url);

const texto = (valor) => (valor == null ? 'null' : `'${String(valor).replaceAll("'", "''")}'`);
const numeros = (valores) => (valores ? `'{${valores.join(',')}}'` : 'null');
const textos = (valores) => (valores ? `array[${valores.map(texto).join(', ')}]` : 'null');
const seccionRef = (idLocal, slug) =>
  `(select id from public.carta_secciones where local_id ${idLocal ? `= ${texto(idLocal)}` : 'is null'} and slug = ${texto(slug)})`;

// Ítems de una sección, en el orden del JSON (los vinos, bodega por bodega)
function filas(seccion) {
  if (seccion.items) return seccion.items.map((item) => ({ ...item }));
  return seccion.bodegas.flatMap(({ bodega, region, vinos }) => vinos.map((vino) => ({ ...vino, bodega, region })));
}

function sqlDeSecciones(idLocal, secciones) {
  const lineas = [];
  secciones.forEach((seccion, i) => {
    lineas.push(
      `insert into public.carta_secciones (slug, local_id, titulo, grupo, nota, tamanos, orden) values (` +
        [texto(seccion.id), texto(idLocal), texto(seccion.titulo), texto(seccion.grupo), texto(seccion.nota),
          textos(seccion.tamanos), i + 1].join(', ') + ');'
    );
    const items = filas(seccion);
    if (items.length === 0) return;
    lineas.push(
      'insert into public.carta_items (seccion_id, nombre, descripcion, traduccion, detalle, bodega, region, precio, precios, orden) values'
    );
    lineas.push(
      items.map((item, j) => '  (' + [seccionRef(idLocal, seccion.id), texto(item.nombre), texto(item.descripcion),
        texto(item.traduccion), texto(item.detalle), texto(item.bodega), texto(item.region),
        item.precio ?? 'null', numeros(item.precios), j + 1].join(', ') + ')').join(',\n') + ';'
    );
  });
  return lineas;
}

const sql = [
  '-- Carga inicial de la carta, generada por scripts/carta-a-sql.mjs desde',
  '-- src/data/cartas.json y src/data/vinos.json (sesión 06). No editar a mano.',
  '',
];
for (const [idLocal, carta] of Object.entries(CARTAS)) {
  sql.push(`-- ${idLocal}`, `update public.locales set cubierto = ${carta.cubierto} where id = ${texto(idLocal)};`);
  sql.push(...sqlDeSecciones(idLocal, carta.secciones), '');
}
sql.push('-- Vinos y copas: compartidos por los dos locales', ...sqlDeSecciones(null, VINOS.secciones), '');

writeFileSync(DESTINO, sql.join('\n'));
console.log(`Escrito ${DESTINO.pathname}`);
