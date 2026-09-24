/**
 * Repasa las fichas ya escritas: arregla la tipografía de la técnica y
 * añade su traducción al inglés.
 *
 *   node scripts/normalizar-tecnicas.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizar, traducir, traducirEdicion } from './lib/tecnicas.mjs';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'obras');

let tocadas = 0;
const sinTraducir = new Set();

for (const archivo of await readdir(DIR)) {
  if (!archivo.endsWith('.json')) continue;
  const ruta = join(DIR, archivo);
  const obra = JSON.parse(await readFile(ruta, 'utf8'));
  const antes = JSON.stringify(obra);

  if (obra.tecnica) {
    obra.tecnica = normalizar(obra.tecnica);
    const en = traducir(obra.tecnica);
    if (en) obra.tecnica_en = en;
    else sinTraducir.add(obra.tecnica);
  }

  const edEn = traducirEdicion(obra.edicion);
  if (edEn) obra.edicion_en = edEn;

  if (JSON.stringify(obra) !== antes) {
    await writeFile(ruta, JSON.stringify(obra, null, 2) + '\n', 'utf8');
    tocadas++;
  }
}

console.log(`${tocadas} fichas actualizadas.`);
if (sinTraducir.size) {
  console.log('\nSin traducción (se mostrará el español en la web inglesa):');
  for (const t of sinTraducir) console.log(`  · ${t}`);
}
