import type { APIRoute } from 'astro';

// Generado, no estático: así la URL del sitemap sale del mismo `site` que
// el resto de la web y no puede quedarse apuntando a otro dominio.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
