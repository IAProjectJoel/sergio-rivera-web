import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * ESTADO DE UNA OBRA
 * De este único campo salen: el sello SOLD OUT, el filtro "Vendidas",
 * si se muestra el botón de compra y si el precio aparece o no.
 * Añadir un estado nuevo aquí lo propaga a toda la web.
 */
export const ESTADOS = ['disponible', 'reservada', 'vendida', 'no_venta'] as const;
export type Estado = (typeof ESTADOS)[number];

/**
 * CAMPOS VACÍOS
 *
 * El panel no omite los campos que se dejan en blanco: los escribe igual,
 * los números como `null` y los textos como `""`. Este esquema solo aceptaba
 * que faltaran, así que en cuanto Sergio editó una obra desde el panel la
 * compilación empezó a fallar y la web se quedó congelada en la versión
 * anterior, sin que nadie se enterara.
 *
 * Aquí se traduce "vacío" a "ausente" antes de validar, en vez de obligar al
 * panel a escribir de otra forma.
 */
const comoAusente = (valor: unknown) => (valor === null || valor === '' ? undefined : valor);

const opcional = <T extends z.ZodTypeAny>(esquema: T) =>
  z.preprocess(comoAusente, esquema.optional());

/** Igual, pero para campos con valor por defecto. */
const conDefecto = <T extends z.ZodTypeAny>(esquema: T) => z.preprocess(comoAusente, esquema);

/**
 * OBRAS
 * Un archivo JSON por cuadro en src/content/obras/.
 * Sergio los crea desde el panel (/admin) sin tocar código.
 */
const obras = defineCollection({
  loader: glob({ base: './src/content/obras', pattern: '**/*.json' }),
  schema: z.object({
    titulo: z.string(),
    titulo_en: opcional(z.string()),

    /**
     * Serie a la que pertenece. Si es una subserie (ej: "porsche"), la obra
     * aparece también al filtrar por su serie madre ("coches").
     * Opcional: una obra puede no pertenecer a ninguna.
     */
    coleccion: opcional(reference('colecciones')),

    /**
     * Original pintado a mano o lámina/reproducción.
     * Cambia el texto de la ficha: una lámina no es "obra única" y su
     * "vendida" no significa lo mismo, porque se puede reimprimir.
     */
    tipo: conDefecto(z.enum(['original', 'print']).default('original')),

    /**
     * Solo para prints. Texto libre porque no todos son iguales:
     * "Prueba de autor (P/A) — única", "3/10"... Una P/A es pieza única
     * y una tirada de 10 no lo es; decirlo mal sería mentir sobre la obra.
     */
    edicion: opcional(z.string()),
    edicion_en: opcional(z.string()),

    anio: opcional(z.number().int().min(1980).max(2100)),

    tecnica: conDefecto(z.string().default('Óleo sobre lienzo')),
    /**
     * Sin valor por defecto a propósito. Tenía "Oil on canvas" y eso hacía
     * que la web inglesa afirmara óleo sobre lienzo en obras que son técnica
     * mixta sobre madera. Si falta, se muestra el español: peor traducido,
     * pero cierto.
     */
    tecnica_en: opcional(z.string()),

    /**
     * Medidas en centímetros. Alto x Ancho, como se citan en el mundo del arte.
     * Opcionales: de algunas obras antiguas ya no hay forma de saberlas, y es
     * mejor publicarlas sin medidas que no publicarlas. Si falta una de las
     * dos, la web no muestra ninguna.
     */
    alto_cm: opcional(z.number().positive()),
    ancho_cm: opcional(z.number().positive()),
    profundidad_cm: opcional(z.number().positive()),
    enmarcada: z.boolean().default(false),

    precio_eur: opcional(z.number().nonnegative()),
    estado: z.enum(ESTADOS).default('disponible'),

    /**
     * Rutas a las fotos, la primera es la principal.
     * Viven en src/assets/obras/ para que Astro las optimice y sirva en AVIF/WebP.
     * Ej: "/src/assets/obras/ferrari-rocher-01.jpg"
     */
    imagenes: z.array(z.string()).min(1),

    descripcion: opcional(z.string()),
    descripcion_en: opcional(z.string()),

    /** Aparece en la portada. */
    destacada: z.boolean().default(false),

    /** Menor = antes. Empata por año descendente. */
    orden: z.number().default(0),

    /** Oculta la obra sin borrarla (borradores, obra en curso). */
    publicada: z.boolean().default(true),
  }),
});

/**
 * COLECCIONES / SERIES
 * Crear una sección nueva = un archivo JSON aquí y etiquetar las obras.
 * Cero código.
 *
 * Admiten un nivel de anidamiento vía `padre`: "Porsche" cuelga de "Coches",
 * de modo que un Porsche cuenta también como coche en filtros y listados.
 */
const colecciones = defineCollection({
  loader: glob({ base: './src/content/colecciones', pattern: '**/*.json' }),
  schema: z.object({
    nombre: z.string(),
    nombre_en: opcional(z.string()),

    /** Serie madre. Vacío = serie principal. */
    padre: opcional(reference('colecciones')),
    descripcion: opcional(z.string()),
    descripcion_en: opcional(z.string()),
    /** Foto de portada de la sección. Si se omite, usa la primera obra. */
    portada: opcional(z.string()),
    orden: z.number().default(0),
    visible: z.boolean().default(true),
  }),
});

/**
 * PÁGINAS DE TEXTO (biografía, etc.)
 * Markdown, una por idioma: sobre-mi.md / sobre-mi.en.md
 */
const paginas = defineCollection({
  loader: glob({ base: './src/content/paginas', pattern: '**/*.md' }),
  schema: z.object({
    titulo: z.string(),
    lang: z.enum(['es', 'en']),
    clave: z.string(),
    subtitulo: opcional(z.string()),
    retrato: opcional(z.string()),
    exposiciones: z.array(z.string()).default([]),
  }),
});

export const collections = { obras, colecciones, paginas };
