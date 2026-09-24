/**
 * Datos de contacto y ajustes globales.
 * Un solo sitio que tocar cuando cambie un teléfono o una red social.
 */
export const sitio = {
  /** Sale de `site` en astro.config.mjs, para no escribirlo dos veces. */
  dominio: import.meta.env.SITE,
  artista: 'Sergio Rivera Martínez',
  marca: 'Sergio Rivera Martínez',

  email: 'sergioriveramartinez.art@gmail.com',

  /** Formato internacional sin signos, para el enlace de WhatsApp. */
  whatsapp: '34638040381',
  telefonoVisible: '638 04 03 81',

  instagram: {
    usuario: '@sergiorivera.art',
    url: 'https://instagram.com/sergiorivera.art',
  },

  /**
   * Galería que lo representa. Se nombra pero NO se enlaza: la web es su
   * canal propio y no debe mandar a los compradores a otro sitio.
   */
  galeria: {
    nombre: 'Galería Herraiz',
    ciudad: 'Madrid',
  },
} as const;

/** Enlace de WhatsApp con el mensaje ya escrito. */
export function whatsappUrl(mensaje: string): string {
  return `https://wa.me/${sitio.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}

/** Enlace de correo con asunto y cuerpo ya escritos. */
export function mailtoUrl(asunto: string, cuerpo = ''): string {
  const params = new URLSearchParams({ subject: asunto });
  if (cuerpo) params.set('body', cuerpo);
  return `mailto:${sitio.email}?${params.toString()}`;
}
