import { idiomas, langPorDefecto, prefijos, rutas, textos, type ClaveTexto, type Lang } from './ui';

export { idiomas, langPorDefecto, prefijos, rutas };
export type { Lang };

/** Traductor para un idioma dado: const t = useT(lang); t('nav.obras') */
export function useT(lang: Lang) {
  return function t(clave: ClaveTexto): string {
    return textos[lang][clave] ?? textos[langPorDefecto][clave] ?? clave;
  };
}

/** URL de una página estática en el idioma indicado. */
export function ruta(clave: keyof typeof rutas, lang: Lang): string {
  return rutas[clave][lang];
}

/** URL de una obra o colección concreta. */
export function rutaDe(tipo: keyof typeof prefijos, slug: string, lang: Lang): string {
  return prefijos[tipo][lang] + slug;
}

/** El otro idioma disponible (con dos idiomas basta; con tres se convierte en lista). */
export function otroIdioma(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}

/**
 * Elige el campo del idioma pedido y cae al español si la traducción no existe.
 * Así una obra sin traducir sigue apareciendo en inglés en vez de romper la página.
 */
export function campo<T>(es: T, en: T | undefined | null, lang: Lang): T {
  if (lang === 'en' && en !== undefined && en !== null && en !== ('' as unknown as T)) return en;
  return es;
}

/** Etiqueta de idioma para el atributo lang/hreflang. */
export const localeHtml: Record<Lang, string> = { es: 'es-ES', en: 'en' };
