/**
 * Genera imágenes marcador con la proporción real de cada cuadro.
 * Sirven para ver el catálogo funcionando antes de que lleguen las fotos
 * de Sergio. Se sustituyen borrando estos archivos y dejando los suyos
 * con el mismo nombre — no hay que tocar el contenido ni el código.
 *
 *   node scripts/generar-placeholders.mjs
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = join(aqui, '..', 'src', 'assets', 'obras');

/** [archivo, título, alto_cm, ancho_cm, tono] */
const piezas = [
  // Obra real, tomada de su ficha en Galería Herraiz.
  ['ferrari-rocher-01', 'Ferrari Rocher', 33, 41, '#c9b8a4'],
  ['galletas-para-el-viaje-01', 'Galletas para el viaje', 35, 41, '#cbbca6'],
  ['gata-o-cata-de-vinos-01', 'Gata o cata de vinos', 41, 33, '#bda98f'],
  ['healthy-life-01', 'Healthy life', 33, 41.5, '#c4bda6'],
  ['piopio-roja-y-la-aurora-roja-01', 'Piopío roja y la aurora roja', 41, 33, '#c7a894'],
  // Ejemplos, uno por sección, para poder ver la estructura completa.
  ['porsche-911-turbo-01', 'Porsche 911 Turbo', 46, 38, '#b9ae99'],
  ['seat-600-al-atardecer-01', 'Seat 600 al atardecer', 33, 41, '#c3a894'],
  ['kawasaki-kx-en-el-barro-01', 'Kawasaki KX en el barro', 38, 46, '#b5ad97'],
  ['air-max-del-92-01', 'Air Max del 92', 33, 41, '#c6b39d'],
  ['geronimo-01', 'Gerónimo', 55, 38, '#bfa88f'],
  ['tarde-de-vermut-01', 'Tarde de vermut', 41, 33, '#c9b49b'],
  ['lamina-seat-600-01', 'Lámina · Seat 600', 42, 29.7, '#cbc0ad'],
];

const ANCHO_BASE = 1400;

function escapar(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function lienzo({ titulo, alto_cm, ancho_cm, tono, w, h }) {
  const margen = Math.round(w * 0.045);
  const tituloPx = Math.round(w * 0.052);
  const notaPx = Math.round(w * 0.024);

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${tono}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#8d7f6d" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="${margen}" y="${margen}" width="${w - margen * 2}" height="${h - margen * 2}"
        fill="none" stroke="#ffffff" stroke-opacity="0.34" stroke-width="${Math.max(1, Math.round(w * 0.0022))}"/>
  <text x="50%" y="47%" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="${tituloPx}"
        fill="#ffffff" fill-opacity="0.94" font-style="italic">${escapar(titulo)}</text>
  <text x="50%" y="56%" text-anchor="middle"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${notaPx}"
        letter-spacing="${notaPx * 0.18}" fill="#ffffff" fill-opacity="0.72">${alto_cm} x ${ancho_cm} CM</text>
  <text x="50%" y="${h - margen * 1.6}" text-anchor="middle"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${notaPx * 0.8}"
        letter-spacing="${notaPx * 0.26}" fill="#ffffff" fill-opacity="0.55">FOTO PENDIENTE</text>
</svg>`);
}

await mkdir(destino, { recursive: true });

for (const [archivo, titulo, alto_cm, ancho_cm, tono] of piezas) {
  const proporcion = alto_cm / ancho_cm;
  const w = ANCHO_BASE;
  const h = Math.round(ANCHO_BASE * proporcion);

  const svg = lienzo({ titulo, alto_cm, ancho_cm, tono, w, h });
  const ruta = join(destino, `${archivo}.jpg`);

  await sharp(svg).jpeg({ quality: 86, mozjpeg: true }).toFile(ruta);
  console.log(`  ${archivo}.jpg  ${w}x${h}  (${alto_cm}x${ancho_cm} cm)`);
}

console.log(`\n${piezas.length} imagenes marcador en src/assets/obras/`);
