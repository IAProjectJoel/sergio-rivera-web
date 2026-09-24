// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Dirección principal: la misma que figura como "Primary domain" en
  // Netlify. www redirige aquí. Si algún día se cambia en Netlify, hay que
  // cambiarla también aquí para que las URL canónicas coincidan.
  // Es la única vez que se escribe el dominio: el resto lo lee de aquí.
  site: 'https://sergioriveramartinez.com',

  integrations: [
    sitemap({
      // Le dice a Google que cada página tiene su gemela en el otro idioma.
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-ES', en: 'en' },
      },
    }),
  ],

  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      // El español vive en la raíz (/obras), el inglés bajo /en/ (/en/works).
      prefixDefaultLocale: false,
    },
  },

  // Fuentes auto-alojadas: no hay ninguna petición a Google en producción
  // (mejor rendimiento en móvil y sin ceder datos de los visitantes).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-display',
      // Solo los cortes que se usan de verdad. Cada peso extra es un
      // fichero más que descargar en el móvil de un visitante.
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-body',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'Segoe UI', 'sans-serif'],
    },
  ],

  build: {
    inlineStylesheets: 'auto',
  },
});
