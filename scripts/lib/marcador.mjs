import sharp from 'sharp';

/**
 * Imagen marcador con la proporción real del cuadro.
 * La usan tanto el generador de ejemplos como el importador, para las obras
 * cuya foto todavía no ha llegado.
 */
export async function crearMarcador({ destino, titulo, alto_cm, ancho_cm, tono = '#c3b5a1', anchoBase = 1400 }) {
  const w = anchoBase;
  const h = Math.round(anchoBase * (alto_cm / ancho_cm));
  const margen = Math.round(w * 0.045);
  const tituloPx = Math.round(w * 0.052);
  const notaPx = Math.round(w * 0.024);

  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${tono}"/>
      <stop offset="100%" stop-color="#8d7f6d"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="${margen}" y="${margen}" width="${w - margen * 2}" height="${h - margen * 2}"
        fill="none" stroke="#ffffff" stroke-opacity="0.34" stroke-width="${Math.max(1, Math.round(w * 0.0022))}"/>
  <text x="50%" y="47%" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="${tituloPx}"
        fill="#ffffff" fill-opacity="0.94" font-style="italic">${esc(titulo)}</text>
  <text x="50%" y="56%" text-anchor="middle"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${notaPx}"
        letter-spacing="${notaPx * 0.18}" fill="#ffffff" fill-opacity="0.72">${alto_cm} x ${ancho_cm} CM</text>
  <text x="50%" y="${h - margen * 1.6}" text-anchor="middle"
        font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${notaPx * 0.8}"
        letter-spacing="${notaPx * 0.26}" fill="#ffffff" fill-opacity="0.55">FOTO PENDIENTE</text>
</svg>`);

  await sharp(svg).jpeg({ quality: 86, mozjpeg: true }).toFile(destino);
  return { w, h };
}
