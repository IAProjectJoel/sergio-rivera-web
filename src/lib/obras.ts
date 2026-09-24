import { getCollection, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { campo, type Lang } from '@/i18n/utils';

export type Obra = CollectionEntry<'obras'>;
export type Coleccion = CollectionEntry<'colecciones'>;

/**
 * Todas las fotos de src/assets/obras/ cargadas de una vez.
 * Permite que el contenido guarde una ruta de texto (cómodo para el panel)
 * y aun así Astro optimice la imagen en el build.
 */
const ficheros = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpeg,jpg,png,webp,avif}',
  { eager: true },
);

export function resolverImagen(ruta: string): ImageMetadata | undefined {
  return ficheros[ruta]?.default;
}

/** La foto principal de una obra (la primera de la lista). */
export function portada(obra: Obra): ImageMetadata | undefined {
  return resolverImagen(obra.data.imagenes[0]!);
}

export function imagenesDe(obra: Obra): ImageMetadata[] {
  return obra.data.imagenes
    .map(resolverImagen)
    .filter((img): img is ImageMetadata => Boolean(img));
}

/* ------------------------------------------------------------------ */
/* Presentación                                                        */
/* ------------------------------------------------------------------ */

/**
 * "41 × 33 cm" — se cita alto × ancho, como en el mundo del arte.
 * null si la obra no tiene medidas: quien la muestre decide qué poner.
 */
export function medidas(obra: Obra, lang: Lang = 'es'): string | null {
  const { alto_cm, ancho_cm, profundidad_cm } = obra.data;
  if (alto_cm === undefined || ancho_cm === undefined) return null;
  const base = `${num(alto_cm, lang)} × ${num(ancho_cm, lang)}`;
  return profundidad_cm ? `${base} × ${num(profundidad_cm, lang)} cm` : `${base} cm`;
}

/** El decimal va con coma en español y con punto en inglés (29,7 / 29.7). */
function num(n: number, lang: Lang): string {
  if (Number.isInteger(n)) return String(n);
  return lang === 'es' ? String(n).replace('.', ',') : String(n);
}

/**
 * Precio visible, o null.
 *
 * Una obra vendida NUNCA muestra precio, aunque el dato exista: quien
 * compra no suele querer que se sepa cuánto pagó. La regla vive aquí para
 * que se cumpla en toda la web sin depender de que nadie deje el campo vacío.
 */
export function precio(obra: Obra, lang: Lang): string | null {
  if (obra.data.estado === 'vendida') return null;
  if (obra.data.precio_eur === undefined) return null;
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(obra.data.precio_eur);
}

export function tituloDe(obra: Obra, lang: Lang): string {
  return campo(obra.data.titulo, obra.data.titulo_en, lang);
}

export function tecnicaDe(obra: Obra, lang: Lang): string {
  return campo(obra.data.tecnica, obra.data.tecnica_en, lang);
}

export function descripcionDe(obra: Obra, lang: Lang): string | undefined {
  return campo(obra.data.descripcion, obra.data.descripcion_en, lang);
}

export function nombreColeccion(col: Coleccion, lang: Lang): string {
  return campo(col.data.nombre, col.data.nombre_en, lang);
}

export function descripcionColeccion(col: Coleccion, lang: Lang): string | undefined {
  return campo(col.data.descripcion, col.data.descripcion_en, lang);
}

/**
 * Texto alternativo generado a partir de los datos de la ficha.
 * Mejor para accesibilidad y para Google que lo que se suele escribir a mano,
 * y una cosa menos que Sergio tenga que rellenar.
 */
export function textoAlt(obra: Obra, lang: Lang): string {
  const m = medidas(obra, lang);
  return `${tituloDe(obra, lang)} — ${tecnicaDe(obra, lang)}${m ? `, ${m}` : ''}`;
}

/** Se puede comprar / preguntar por ella. */
export function estaALaVenta(obra: Obra): boolean {
  return obra.data.estado === 'disponible';
}

export function estaVendida(obra: Obra): boolean {
  return obra.data.estado === 'vendida';
}

/** Una lámina, no un original: se puede reeditar, así que no es pieza única. */
export function esPrint(obra: Obra): boolean {
  return obra.data.tipo === 'print';
}

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */

/** Menor `orden` primero; a igualdad, la más reciente antes. */
function porOrden(a: Obra, b: Obra): number {
  if (a.data.orden !== b.data.orden) return a.data.orden - b.data.orden;
  return (b.data.anio ?? 0) - (a.data.anio ?? 0);
}

export async function todasLasObras(): Promise<Obra[]> {
  const obras = await getCollection('obras', ({ data }) => data.publicada);
  return obras.sort(porOrden);
}

export async function obrasDestacadas(limite = 6): Promise<Obra[]> {
  const obras = await todasLasObras();
  const destacadas = obras.filter((o) => o.data.destacada);
  // Si nadie ha marcado ninguna como destacada, la portada no se queda vacía.
  return (destacadas.length ? destacadas : obras).slice(0, limite);
}

export async function coleccionesVisibles(): Promise<Coleccion[]> {
  const cols = await getCollection('colecciones', ({ data }) => data.visible);
  return cols.sort((a, b) => a.data.orden - b.data.orden);
}

/** Series principales: las que no cuelgan de ninguna otra. */
export async function coleccionesRaiz(): Promise<Coleccion[]> {
  return (await coleccionesVisibles()).filter((c) => !c.data.padre);
}

/** Subseries de una serie dada (ej: Porsche dentro de Coches). */
export async function subcolecciones(slug: string): Promise<Coleccion[]> {
  return (await coleccionesVisibles()).filter((c) => c.data.padre?.id === slug);
}

/**
 * Los slugs que cuentan como "pertenecer" a una serie: ella misma y sus hijas.
 * Es lo que hace que un Porsche aparezca también al filtrar por Coches.
 */
export async function slugsDeFamilia(slug: string): Promise<string[]> {
  const hijas = await subcolecciones(slug);
  return [slug, ...hijas.map((h) => h.id)];
}

export async function obrasDeColeccion(slug: string): Promise<Obra[]> {
  const [obras, familia] = await Promise.all([todasLasObras(), slugsDeFamilia(slug)]);
  return obras.filter((o) => o.data.coleccion && familia.includes(o.data.coleccion.id));
}

/** Otras obras para el pie de la ficha: primero las de su misma serie. */
export async function obrasRelacionadas(obra: Obra, limite = 3): Promise<Obra[]> {
  const obras = (await todasLasObras()).filter((o) => o.id !== obra.id);
  const mismaSerie = obras.filter((o) => o.data.coleccion?.id === obra.data.coleccion?.id);
  const resto = obras.filter((o) => o.data.coleccion?.id !== obra.data.coleccion?.id);
  return [...mismaSerie, ...resto].slice(0, limite);
}
