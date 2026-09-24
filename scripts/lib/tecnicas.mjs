/**
 * Cómo escribe Sergio las técnicas y cómo deben quedar en la web.
 *
 * Dos cosas distintas:
 *  - `normalizar` arregla tipografía (tildes, mayúscula inicial, el espacio
 *    que falta antes del paréntesis). No cambia lo que dice.
 *  - `traducir` da el equivalente en inglés. Sin esto, el esquema ponía
 *    "Oil on canvas" por defecto a TODO, y la web inglesa afirmaba óleo
 *    sobre lienzo en obras que son técnica mixta sobre madera.
 */

const EQUIVALENCIAS = [
  [/^óleo sobre lienzo\.?\s*técnica mixta\.?$/i, 'Óleo sobre lienzo. Técnica mixta', 'Oil on canvas. Mixed media'],
  [/^óleo sobre lienzo$/i, 'Óleo sobre lienzo', 'Oil on canvas'],
  [/^óleo sobre madera$/i, 'Óleo sobre madera', 'Oil on wood'],
  [/^óleo y acrílicos sobre lienzo$/i, 'Óleo y acrílicos sobre lienzo', 'Oil and acrylics on canvas'],
  [/^técnica mixta sobre lienzo$/i, 'Técnica mixta sobre lienzo', 'Mixed media on canvas'],
  [
    /^técnica mixta sobre madera\s*\(óleo y acrílicos\)$/i,
    'Técnica mixta sobre madera (óleo y acrílicos)',
    'Mixed media on wood (oil and acrylics)',
  ],
  [/^técnica mixta sobre madera$/i, 'Técnica mixta sobre madera', 'Mixed media on wood'],
  [/^técnica mixta$/i, 'Técnica mixta', 'Mixed media'],
  [
    /^impresi[oó]n gicl[ée]e intervenida a mano\s*\(técnica mixta\)$/i,
    'Impresión giclée intervenida a mano (técnica mixta)',
    'Hand-finished giclée print (mixed media)',
  ],
  [/^impresi[oó]n gicl[ée]e$/i, 'Impresión giclée', 'Giclée print'],
  [
    /^óleo sobre l[áa]mina para óleo encolada en tabla de madera$/i,
    'Óleo sobre lámina para óleo encolada en tabla',
    'Oil on oil-painting paper mounted on wood panel',
  ],
];

/** Tipografía: mayúscula inicial y espacio antes del paréntesis. */
function arreglarTipografia(texto) {
  return texto
    .trim()
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)/g, ')')
    .replace(/\s+/g, ' ')
    .replace(/^(.)/, (c) => c.toLocaleUpperCase('es'));
}

export function normalizar(tecnica) {
  const limpia = tecnica.trim().replace(/\s+/g, ' ');
  for (const [patron, es] of EQUIVALENCIAS) if (patron.test(limpia)) return es;
  return arreglarTipografia(limpia);
}

/** Devuelve el inglés, o null si no se conoce (entonces se muestra el español). */
export function traducir(tecnica) {
  const limpia = tecnica.trim().replace(/\s+/g, ' ');
  for (const [patron, , en] of EQUIVALENCIAS) if (patron.test(limpia)) return en;
  return null;
}

export const EDICIONES_EN = {
  'Prueba de autor (P/A) · única': "Artist's proof (A/P) · unique",
};

/** "Edición de 10" -> "Edition of 10" */
export function traducirEdicion(edicion) {
  if (!edicion) return null;
  if (EDICIONES_EN[edicion]) return EDICIONES_EN[edicion];
  const m = /^Edición de (\d+)$/.exec(edicion);
  return m ? `Edition of ${m[1]}` : null;
}
