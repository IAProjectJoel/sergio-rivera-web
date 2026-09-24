export const idiomas = { es: 'Español', en: 'English' } as const;
export type Lang = keyof typeof idiomas;
export const langPorDefecto: Lang = 'es';

/**
 * Rutas estáticas con slug propio por idioma.
 * Añadir una página nueva = una línea aquí + su archivo en src/pages/.
 */
export const rutas = {
  inicio: { es: '/', en: '/en/' },
  obras: { es: '/obras', en: '/en/works' },
  sobreMi: { es: '/sobre-mi', en: '/en/about' },
  contacto: { es: '/contacto', en: '/en/contact' },
} as const;

/** Prefijos de las rutas dinámicas (obra y colección). */
export const prefijos = {
  obra: { es: '/obra/', en: '/en/work/' },
  coleccion: { es: '/coleccion/', en: '/en/collection/' },
} as const;

export const textos = {
  es: {
    'nav.inicio': 'Inicio',
    'nav.obras': 'Obra',
    'nav.sobreMi': 'Sobre mí',
    'nav.contacto': 'Contacto',
    'nav.menu': 'Menú',
    'nav.cerrar': 'Cerrar',

    'inicio.intro':
      'Realismo al óleo sobre la nostalgia, lo retro y lo clásico: los coches que soñábamos, los juguetes que perdimos, las tardes de dibujos animados.',
    'inicio.destacadas': 'Obra destacada',
    'inicio.colecciones': 'Series',
    'inicio.verTodo': 'Ver toda la obra',
    'inicio.sobreMi': 'Sobre el artista',

    'obras.titulo': 'Obra',
    'obras.subtitulo': 'Pintura original y prints. Lo que sigue esperando casa y lo que ya la encontró.',
    'obras.vacio': 'Todavía no hay obra publicada en esta selección.',
    'obras.contador.una': 'obra',
    'obras.contador.varias': 'obras',

    'filtro.serie': 'Serie',
    'filtro.todas': 'Todas',
    'filtro.estado': 'Disponibilidad',
    'filtro.estado.todas': 'Todas',
    'filtro.estado.disponible': 'Disponibles',
    'filtro.estado.vendida': 'Vendidas',

    'estado.disponible': 'Disponible',
    'estado.reservada': 'Reservada',
    'estado.vendida': 'Vendida',
    'estado.no_venta': 'No disponible',
    'estado.soldout': 'Vendida',

    'obra.medidas': 'Medidas',
    'obra.tecnica': 'Técnica',
    'obra.anio': 'Año',
    'obra.precio': 'Precio',
    'obra.serie': 'Serie',
    'obra.tipo': 'Tipo',
    'obra.unica': 'Obra única',
    'obra.lamina': 'Lámina / print',
    'obra.edicion': 'Edición',
    'obra.enmarcada': 'Enmarcada',
    'obra.sinEnmarcar': 'Sin enmarcar',
    'obra.consultar': 'Consultar precio',
    'obra.interesa': 'Me interesa esta obra',
    'obra.whatsapp': 'Preguntar por WhatsApp',
    'obra.email': 'Escribir un correo',
    'obra.vendidaNota':
      'Esta obra ya encontró su casa. Si te ha gustado, escríbeme: siempre hay algo nuevo en el caballete.',
    'obra.reservadaNota': 'Esta obra está reservada pendiente de confirmación.',
    'obra.volver': 'Volver a la obra',
    'obra.tambien': 'También te puede interesar',
    'obra.ampliar': 'Ampliar imagen',

    'coleccion.obras': 'Obra de esta serie',
    'coleccion.subseries': 'Dentro de esta serie',

    'contacto.titulo': 'Contacto',
    'contacto.intro':
      'Para preguntar por una obra, contarme una idea o simplemente saludar. Respondo yo mismo.',
    'contacto.whatsapp': 'WhatsApp',
    'contacto.email': 'Correo',
    'contacto.instagram': 'Instagram',
    'contacto.galeria': 'Representado por',
    'contacto.form.titulo': 'Escríbeme',
    'contacto.form.nombre': 'Tu nombre',
    'contacto.form.email': 'Tu correo',
    'contacto.form.mensaje': 'Tu mensaje',
    'contacto.form.enviar': 'Enviar mensaje',
    'contacto.form.o': 'o',
    'contacto.form.porWhatsapp': 'enviarlo por WhatsApp',

    'footer.derechos': 'Todos los derechos reservados.',
    'footer.obraOriginal': 'Obra original',

    'meta.inicio.desc':
      'Obra original de Sergio Rivera Martínez, pintor madrileño. Realismo al óleo: coches, motos, sneakers, nostalgia y nativos americanos. Originales y láminas a la venta.',
    'meta.obras.desc':
      'Catálogo de obra de Sergio Rivera Martínez: pintura original y prints, con medidas y precio.',
    'meta.sobreMi.desc':
      'Sergio Rivera Martínez, pintor de Madrid. Del grafiti de Majadahonda al realismo al óleo. Biografía y exposiciones.',
    'meta.contacto.desc':
      'Contacta con Sergio Rivera Martínez para preguntar por una obra o contarle una idea.',
  },

  en: {
    'nav.inicio': 'Home',
    'nav.obras': 'Work',
    'nav.sobreMi': 'About',
    'nav.contacto': 'Contact',
    'nav.menu': 'Menu',
    'nav.cerrar': 'Close',

    'inicio.intro':
      'Oil realism about nostalgia, the retro and the classic: the cars we dreamed of, the toys we lost, the afternoons of cartoons.',
    'inicio.destacadas': 'Selected work',
    'inicio.colecciones': 'Series',
    'inicio.verTodo': 'See all work',
    'inicio.sobreMi': 'About the artist',

    'obras.titulo': 'Work',
    'obras.subtitulo': 'Original paintings and prints. What is still waiting for a home, and what has already found one.',
    'obras.vacio': 'No work published in this selection yet.',
    'obras.contador.una': 'work',
    'obras.contador.varias': 'works',

    'filtro.serie': 'Series',
    'filtro.todas': 'All',
    'filtro.estado': 'Availability',
    'filtro.estado.todas': 'All',
    'filtro.estado.disponible': 'Available',
    'filtro.estado.vendida': 'Sold',

    'estado.disponible': 'Available',
    'estado.reservada': 'Reserved',
    'estado.vendida': 'Sold',
    'estado.no_venta': 'Not for sale',
    'estado.soldout': 'Sold',

    'obra.medidas': 'Size',
    'obra.tecnica': 'Medium',
    'obra.anio': 'Year',
    'obra.precio': 'Price',
    'obra.serie': 'Series',
    'obra.tipo': 'Type',
    'obra.unica': 'One of a kind',
    'obra.lamina': 'Print',
    'obra.edicion': 'Edition',
    'obra.enmarcada': 'Framed',
    'obra.sinEnmarcar': 'Unframed',
    'obra.consultar': 'Ask for the price',
    'obra.interesa': "I'm interested in this piece",
    'obra.whatsapp': 'Ask on WhatsApp',
    'obra.email': 'Send an email',
    'obra.vendidaNota':
      'This piece has already found its home. If you liked it, write to me: there is always something new on the easel.',
    'obra.reservadaNota': 'This piece is on hold pending confirmation.',
    'obra.volver': 'Back to the work',
    'obra.tambien': 'You may also like',
    'obra.ampliar': 'Enlarge image',

    'coleccion.obras': 'Work in this series',
    'coleccion.subseries': 'Within this series',

    'contacto.titulo': 'Contact',
    'contacto.intro':
      'To ask about a piece, share an idea or just say hello. I answer myself.',
    'contacto.whatsapp': 'WhatsApp',
    'contacto.email': 'Email',
    'contacto.instagram': 'Instagram',
    'contacto.galeria': 'Represented by',
    'contacto.form.titulo': 'Write to me',
    'contacto.form.nombre': 'Your name',
    'contacto.form.email': 'Your email',
    'contacto.form.mensaje': 'Your message',
    'contacto.form.enviar': 'Send message',
    'contacto.form.o': 'or',
    'contacto.form.porWhatsapp': 'send it on WhatsApp',

    'footer.derechos': 'All rights reserved.',
    'footer.obraOriginal': 'Original work',

    'meta.inicio.desc':
      'Original work by Sergio Rivera Martínez, painter from Madrid. Oil realism: cars, motorcycles, sneakers, nostalgia and Native Americans. Originals and prints for sale.',
    'meta.obras.desc':
      'Catalogue of work by Sergio Rivera Martínez: original paintings and prints, with sizes and prices.',
    'meta.sobreMi.desc':
      'Sergio Rivera Martínez, painter from Madrid. From the graffiti of Majadahonda to oil realism. Biography and exhibitions.',
    'meta.contacto.desc':
      'Get in touch with Sergio Rivera Martínez to ask about a piece or share an idea.',
  },
} as const;

export type ClaveTexto = keyof (typeof textos)['es'];
