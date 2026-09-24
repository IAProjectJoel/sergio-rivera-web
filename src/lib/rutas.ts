import type { GetStaticPaths } from 'astro';
import { coleccionesVisibles, todasLasObras } from './obras';

/**
 * Las dos versiones de idioma de una misma página comparten estas funciones,
 * así el catálogo se recorre una sola vez y no hay riesgo de que ES y EN
 * acaben generando listas distintas.
 */

export const rutasDeObras: GetStaticPaths = async () => {
  const obras = await todasLasObras();
  return obras.map((obra) => ({
    params: { slug: obra.id },
    props: { obra },
  }));
};

export const rutasDeColecciones: GetStaticPaths = async () => {
  const colecciones = await coleccionesVisibles();
  return colecciones.map((coleccion) => ({
    params: { slug: coleccion.id },
    props: { coleccion },
  }));
};
