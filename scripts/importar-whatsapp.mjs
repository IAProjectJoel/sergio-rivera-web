/**
 * Importa el catálogo desde una exportación de chat de WhatsApp.
 *
 * WhatsApp exporta "_chat.txt" con los mensajes EN ORDEN, así que la
 * correspondencia foto -> datos ya viene resuelta: solo hay que emparejar
 * cada foto (o álbum de fotos) con el mensaje de texto que la acompaña.
 *
 * Entiende cómo escribe Sergio:
 *   - [SOLD] en el mensaje   -> estado "vendida"
 *   - (enmarcado)/(enmarcada) -> enmarcada: true
 *   - "Ahora serie [Motos]"   -> asigna esa serie a todo lo que venga detrás
 *   - álbumes de varias fotos -> una obra con varias imágenes
 *   - prints: "P/A" o "Serie de /10" -> tipo print + edición
 *
 * Va en dos pasos a propósito. Los datos llegan en texto libre y aquí se
 * están fijando los precios de una web real: el script propone, una persona
 * revisa, y solo entonces se escribe nada.
 *
 *   1) node scripts/importar-whatsapp.mjs <carpeta>
 *   2) node scripts/importar-whatsapp.mjs <carpeta> --confirmar
 */
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { crearMarcador } from './lib/marcador.mjs';
import { normalizar, traducir, traducirEdicion } from './lib/tecnicas.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR_IMPORT = join(raiz, 'importacion');
const CSV = join(DIR_IMPORT, 'revision.csv');
const DIR_FOTOS = join(raiz, 'src', 'assets', 'obras');
const DIR_OBRAS = join(raiz, 'src', 'content', 'obras');

const [, , carpeta, ...flags] = process.argv;
const confirmar = flags.includes('--confirmar');

if (!carpeta) {
  console.error('Uso: node scripts/importar-whatsapp.mjs <carpeta-del-export> [--confirmar]');
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* 1. Leer el chat exportado                                           */
/* ------------------------------------------------------------------ */

const CABECERA_IOS =
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+[\d:.]+(?:\s*[AaPp]\.?\s?[Mm]\.?)?\]\s*([^:]{1,60}?):\s*(.*)$/;
const CABECERA_ANDROID =
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+[\d:.]+(?:\s*[AaPp]\.?\s?[Mm]\.?)?\s+-\s+([^:]{1,60}?):\s*(.*)$/;

/**
 * Adjunto CON archivo: el export se hizo incluyendo los archivos.
 * Capturan CUALQUIER extensión, no solo imágenes: una nota de voz .opus que
 * no se reconozca como adjunto acaba contando como texto, y entonces se
 * empareja con la foto anterior y genera una obra fantasma.
 *
 * Tampoco se anclan al final de línea: una foto con pie de foto lleva texto
 * detrás, y anclando se perdería la obra entera.
 */
const ADJUNTO_CON_ARCHIVO = [
  /<(?:adjunto|attached|archivo adjunto):\s*([^>]+)>/i, // iOS
  /^\s*([^\s].*?\.[A-Za-z0-9]{2,5})\s*\((?:archivo adjunto|file attached)\)/i, // Android
];

/** Adjunto SIN archivo: se exportó "sin archivos" y solo queda el hueco. */
const ADJUNTO_OMITIDO =
  /<\s*(?:imagen|image|foto|photo|v[ií]deo|video|gif|sticker|documento|document|audio|multimedia|media)\s*(?:omitid[oa]s?|omitted)\s*>/i;

/** Ruido del propio WhatsApp que no aporta nada. */
const IGNORAR =
  /<\s*(?:mensaje de [aá]lbum|album message|mensaje de voz omitido|voice message omitted|se elimin[oó] este mensaje|this message was deleted)\s*>/i;

const EXT_IMAGEN = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

/**
 * Marcador de sección: un mensaje corto con el nombre entre corchetes.
 * "Ahora serie [ Motos ]", "Y ahora la de [Sneakers]", "Venga última
 * categoría [Indians]". No exige la palabra "serie" porque Sergio no siempre
 * la pone; se exige en cambio que el mensaje sea corto y no traiga datos de
 * obra, para no confundirlo con un "[SOLD]" dentro de una ficha.
 */
const MARCA_SECCION = /\[\s*([^\]]{2,40}?)\s*\]/;

function esMarcaDeSeccion(cuerpo) {
  if (cuerpo.length > 90 || cuerpo.includes('\n')) return false;
  if (/\d\s*[x×]\s*\d|€|euros?\b/i.test(cuerpo)) return false;
  const m = MARCA_SECCION.exec(cuerpo);
  if (!m) return false;
  return !VENDIDA_SUELTA.test(m[1]);
}

const VENDIDA_SUELTA = /^\s*(?:sold(?:\s*out)?|vendid[oa])\s*$/i;

/**
 * ¿El marcador mira hacia atrás o hacia delante?
 * "Esa ha sido ya la serie de [X]" cierra lo anterior;
 * "Y ahora la de [X]" abre lo siguiente.
 */
const RETROSPECTIVO = /\b(esa|esas|eso|esta ha sido|ha sido|han sido|fue|fueron|era|eran|hasta aqu[ií]|acab[oó])\b/i;

/** Cómo llama Sergio a cada sección -> slug de la colección en la web. */
const SECCIONES = {
  'porsche y coches': 'coches',
  'porsche': 'porsche',
  'coches': 'coches',
  'cars': 'coches',
  'sneakers': 'sneakers',
  'zapatillas': 'sneakers',
  'motos': 'motos',
  'nostalgia': 'nostalgia',
  'prints': 'prints',
  'indians': 'nativos-americanos',
  'indios': 'nativos-americanos',
  'nativos americanos': 'nativos-americanos',
};

function limpiar(linea) {
  return linea.replace(/[\u200e\u200f\ufeff]/g, '');
}

function parsearChat(texto) {
  const mensajes = [];

  for (const cruda of texto.split(/\r?\n/)) {
    const linea = limpiar(cruda);
    const m = CABECERA_IOS.exec(linea) ?? CABECERA_ANDROID.exec(linea);
    if (m) mensajes.push({ autor: m[2].trim(), texto: m[3] });
    else if (mensajes.length && linea.trim()) mensajes.at(-1).texto += '\n' + linea;
  }

  return mensajes.map((msg) => {
    const cuerpo = msg.texto;
    const primera = cuerpo.split('\n')[0].trim();

    if (IGNORAR.test(primera)) return { ...msg, tipo: 'ruido' };

    for (const patron of ADJUNTO_CON_ARCHIVO) {
      const m = patron.exec(primera);
      if (m) {
        const archivo = m[1].trim();
        return EXT_IMAGEN.has(extname(archivo).toLowerCase())
          ? { ...msg, tipo: 'foto', archivo }
          : { ...msg, tipo: 'ruido' };
      }
    }

    // "<imagen omitida>" — a veces con una nota detrás entre paréntesis.
    if (ADJUNTO_OMITIDO.test(primera)) {
      const nota = /\)\s*$/.test(primera) ? /\(([^)]*)\)\s*$/.exec(primera)?.[1] ?? '' : '';
      return { ...msg, tipo: 'foto', archivo: null, nota };
    }

    if (esMarcaDeSeccion(cuerpo)) {
      const sec = MARCA_SECCION.exec(cuerpo);
      return {
        ...msg,
        tipo: 'seccion',
        seccion: sec[1].trim(),
        retrospectivo: RETROSPECTIVO.test(cuerpo),
      };
    }

    return { ...msg, tipo: 'texto' };
  });
}

/* ------------------------------------------------------------------ */
/* 2. Agrupar: fotos seguidas + el texto que las describe               */
/* ------------------------------------------------------------------ */

function agrupar(mensajes) {
  const obras = [];
  let fotos = [];
  let notas = [];
  let seccion = '';

  for (const msg of mensajes) {
    if (msg.tipo === 'ruido') continue;

    if (msg.tipo === 'seccion') {
      const slug = SECCIONES[msg.seccion.toLowerCase()] ?? '';
      if (!slug) {
        console.warn(`  ! sección desconocida: "${msg.seccion}" — asígnala a mano en el CSV`);
      } else if (msg.retrospectivo) {
        // "Esa ha sido ya la serie de [Porsche y coches]": cierra lo anterior.
        for (const o of obras) if (!o.seccion) o.seccion = slug;
        seccion = '';
      } else {
        seccion = slug;
      }
      fotos = [];
      notas = [];
      continue;
    }

    if (msg.tipo === 'foto') {
      // Varias fotos seguidas son un álbum: una sola obra con varias imágenes.
      fotos.push(msg.archivo);
      if (msg.nota) notas.push(msg.nota);
      continue;
    }

    // Un texto solo cuenta como ficha si venía precedido de al menos una foto.
    // Lo demás es conversación suelta y se descarta.
    if (msg.texto.trim() && fotos.length) {
      obras.push({ fotos: [...fotos], texto: msg.texto.trim(), seccion, notas: [...notas] });
      fotos = [];
      notas = [];
    }
  }

  return obras;
}

/* ------------------------------------------------------------------ */
/* 3. Entender el texto libre                                          */
/* ------------------------------------------------------------------ */

const TECNICAS =
  /(óleo|oleo|acrílic|acrilic|técnica mixta|tecnica mixta|mixta|grafito|lápiz|lapiz|carboncillo|spray|aerosol|giclée|giclee|gouache|acuarela|tinta|collage|pastel|impresi[oó]n)/i;
const VENDIDA = /\[?\s*(sold(?:\s*out)?|vendid[oa])\s*\]?/i;
const ENMARCADA = /\(?\s*enmarcad[oa]\s*\)?/i;
const RUIDO_RESTO = /^(cm|cms|cm\.|mm|€|eur|euros|aprox|x|×|[.,;:\-–—·]+)$/i;

function parsearDatos(texto) {
  const campos = {
    titulo: '',
    tecnica: '',
    alto_cm: '',
    ancho_cm: '',
    anio: '',
    precio_eur: '',
    estado: 'disponible',
    enmarcada: 'no',
    tipo: 'original',
    edicion: '',
  };

  let trabajo = texto;

  if (VENDIDA.test(trabajo)) {
    campos.estado = 'vendida';
    trabajo = trabajo.replace(new RegExp(VENDIDA.source, 'gi'), ' ');
  }
  if (ENMARCADA.test(trabajo)) {
    campos.enmarcada = 'si';
    trabajo = trabajo.replace(new RegExp(ENMARCADA.source, 'gi'), ' ');
  }

  // Prints: prueba de autor (única) o tirada numerada. Son cosas distintas
  // y la ficha no puede decir lo mismo de las dos.
  const pa = /prueba de autor|\bP\/A\b/i.test(trabajo);
  const tirada = /(?:serie|edici[oó]n)\s*de\s*\/?\s*(\d+)/i.exec(trabajo);
  if (pa || tirada || /impresi[oó]n\s+gicl[ée]e|gicl[ée]e/i.test(trabajo)) {
    campos.tipo = 'print';
    if (pa) campos.edicion = 'Prueba de autor (P/A) · única';
    else if (tirada) {
      campos.edicion = `Edición de ${tirada[1]}`;
      // Se quita del texto: ya está recogido como edición, y si se deja
      // acaba pegado al título ("Serie de /10 Breakin the rules").
      trabajo = trabajo.replace(tirada[0], ' ');
    }
  }

  let lineas = trabajo
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Si vino todo seguido, las comas hacen de saltos de línea.
  if (lineas.length === 1 && lineas[0].includes(',') && !/\d,\d/.test(lineas[0])) {
    lineas = lineas[0]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Se clasifica por PRIORIDAD, no de arriba abajo. Si no, en
  // "Porsche 1986 911 carrera" el 1986 del título se toma como año de la
  // obra y el "2026" de la línea siguiente acaba convertido en precio.
  const pendientes = lineas.map((l) => ({ texto: l, usada: false }));

  const tomar = (predicado, accion) => {
    for (const p of pendientes) {
      if (p.usada) continue;
      const m = predicado(p.texto);
      if (m) {
        accion(m, p);
        return true;
      }
    }
    return false;
  };

  // 1. Una línea que es SOLO un año: así lo escribe Sergio, y así un año
  //    metido dentro del título nunca se confunde con el de la obra.
  tomar(
    (l) => /^\s*(19[89]\d|20[0-4]\d)\s*$/.exec(l),
    (m, p) => {
      campos.anio = m[1];
      p.usada = true;
    },
  );

  // 2. Medidas.
  tomar(
    (l) => /(\d{1,3}(?:[.,]\d+)?)\s*[x×]\s*(\d{1,3}(?:[.,]\d+)?)/i.exec(l),
    (m, p) => {
      campos.alto_cm = m[1].replace(',', '.');
      campos.ancho_cm = m[2].replace(',', '.');
      p.texto = p.texto.replace(m[0], ' ');
      if (!p.texto.replace(/[\s.,;:cm]/gi, '')) p.usada = true;
    },
  );

  // 3. Precio con símbolo o con la palabra euros.
  tomar(
    (l) => /(\d[\d.  ]{0,8})\s*(?:€|eur\b|euros\b)/i.exec(l),
    (m, p) => {
      campos.precio_eur = m[1].replace(/[.  ]/g, '');
      p.texto = p.texto.replace(m[0], ' ');
      if (!p.texto.trim()) p.usada = true;
    },
  );

  // 4. Sin símbolo: una línea que es solo un número, ya descartado el año.
  if (!campos.precio_eur) {
    tomar(
      (l) => /^\s*(\d{2,5})\s*$/.exec(l),
      (m, p) => {
        campos.precio_eur = m[1];
        p.usada = true;
      },
    );
  }

  const sobrantes = [];
  for (const p of pendientes) {
    if (p.usada) continue;
    const queda = p.texto.replace(/^[\s\-–—·,.]+|[\s\-–—·,.]+$/g, '').trim();
    if (queda && !RUIDO_RESTO.test(queda)) sobrantes.push(queda);
  }

  // La técnica puede venir en dos líneas ("Óleo sobre lienzo." + "Técnica mixta.")
  const tecnicas = sobrantes.filter((s) => TECNICAS.test(s));
  if (tecnicas.length) {
    campos.tecnica = tecnicas.join('. ').replace(/\.\s*\./g, '.').replace(/\.$/, '');
    for (const t of tecnicas) sobrantes.splice(sobrantes.indexOf(t), 1);
  }

  // Las comillas se quitan de los dos extremos y en cualquier número: hay
  // títulos que él escribe entre comillas y otros donde solo cierra.
  campos.titulo = (sobrantes[0] ?? '').replace(/["“”]/g, '').trim();
  return campos;
}

function hacerSlug(titulo, indice) {
  const base = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || `obra-${String(indice + 1).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/* CSV: punto y coma y BOM, para que Excel en español lo abra bien     */
/* ------------------------------------------------------------------ */

const COLUMNAS = [
  'fotos',
  'slug',
  'titulo',
  'tecnica',
  'alto_cm',
  'ancho_cm',
  'anio',
  'precio_eur',
  'estado',
  'enmarcada',
  'tipo',
  'edicion',
  'coleccion',
  'revisar',
  'texto_original',
];

function celda(v) {
  const s = String(v ?? '');
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function escribirCsv(filas) {
  const lineas = [COLUMNAS.join(';')];
  for (const f of filas) lineas.push(COLUMNAS.map((c) => celda(f[c])).join(';'));
  return '\ufeff' + lineas.join('\r\n') + '\r\n';
}

function leerCsv(texto) {
  const sinBom = texto.replace(/^\ufeff/, '');
  const filas = [];
  let campo = '';
  let fila = [];
  let entreComillas = false;

  for (let i = 0; i < sinBom.length; i++) {
    const c = sinBom[i];
    if (entreComillas) {
      if (c === '"' && sinBom[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ';') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }

  const cabecera = filas.shift();
  return filas
    .filter((f) => f.some((v) => v.trim()))
    .map((f) => Object.fromEntries(cabecera.map((c, i) => [c.trim(), (f[i] ?? '').trim()])));
}

/* ------------------------------------------------------------------ */
/* Paso 1: analizar                                                    */
/* ------------------------------------------------------------------ */

/** Columnas que escribe una persona al revisar y que no se deben pisar. */
const REVISADAS = [
  'slug', 'titulo', 'tecnica', 'alto_cm', 'ancho_cm', 'anio',
  'precio_eur', 'estado', 'enmarcada', 'tipo', 'edicion', 'coleccion',
];

/**
 * Si ya hay un CSV revisado, se conserva lo corregido a mano y solo se
 * refrescan las fotos. Es el caso normal: primero llega el chat sin
 * archivos, luego el mismo chat con ellos. Sin esto, reanalizar borraría
 * la revisión y al confirmar quedarían fichas duplicadas.
 *
 * Se emparejan las filas por el texto original del mensaje de Sergio, que
 * es lo único que no cambia entre una exportación y otra.
 */
async function fusionarConRevision(filas) {
  if (!existsSync(CSV) || flags.includes('--desde-cero')) return { filas, conservadas: 0 };

  const previas = leerCsv(await readFile(CSV, 'utf8'));
  const porTexto = new Map(previas.map((p) => [p.texto_original, p]));

  let conservadas = 0;
  const fusionadas = filas.map((f) => {
    const previa = porTexto.get(f.texto_original);
    if (!previa) return f;
    conservadas++;
    const mezcla = { ...f };
    for (const c of REVISADAS) if (previa[c]) mezcla[c] = previa[c];
    return mezcla;
  });

  return { filas: fusionadas, conservadas };
}

async function analizar() {
  const archivos = await readdir(carpeta);
  const chat = archivos.find((f) => /\.txt$/i.test(f));
  if (!chat) {
    console.error(`No hay ningún .txt en ${carpeta}.`);
    process.exit(1);
  }

  const mensajes = parsearChat(await readFile(join(carpeta, chat), 'utf8'));
  const grupos = agrupar(mensajes);

  if (!grupos.length) {
    console.error('No se encontró ninguna obra (una foto seguida de sus datos).');
    process.exit(1);
  }

  const vistos = new Set();
  const filas = grupos.map((g, i) => {
    const d = parsearDatos(g.texto);

    let slug = hacerSlug(d.titulo, i);
    if (vistos.has(slug)) {
      // Cinco obras se llaman "Breakin the rules": se distinguen por medidas.
      const sufijo = d.alto_cm && d.ancho_cm ? `-${d.alto_cm}x${d.ancho_cm}`.replace('.', '') : '';
      let candidato = slug + sufijo;
      let n = 2;
      while (vistos.has(candidato)) candidato = `${slug}${sufijo}-${n++}`;
      slug = candidato;
    }
    vistos.add(slug);

    // Dentro de "coches", las que llevan Porsche en el título van a su subserie.
    let coleccion = g.seccion;
    if (coleccion === 'coches' && /porsche/i.test(d.titulo)) coleccion = 'porsche';

    const avisos = [];
    if (!d.titulo) avisos.push('falta título');
    if (!d.alto_cm || !d.ancho_cm) avisos.push('sin medidas (se publica sin ellas)');
    if (!d.precio_eur && d.estado !== 'vendida') avisos.push('sin precio');
    if (!coleccion) avisos.push('sin serie');

    const conArchivo = g.fotos.filter(Boolean);
    if (!conArchivo.length) avisos.push('FOTO PENDIENTE');
    else {
      const perdidas = conArchivo.filter((f) => !existsSync(join(carpeta, f)));
      if (perdidas.length) avisos.push(`no se encuentra: ${perdidas.join(', ')}`);
    }

    return {
      fotos: g.fotos.map((f) => f ?? '(pendiente)').join(' | '),
      slug,
      ...d,
      coleccion,
      revisar: avisos.join(' | '),
      texto_original: (g.texto + (g.notas.length ? ' ⟨' + g.notas.join(' / ') + '⟩' : '')).replace(/\n/g, ' ⏎ '),
    };
  });

  const { filas: finales, conservadas } = await fusionarConRevision(filas);

  await mkdir(DIR_IMPORT, { recursive: true });
  await writeFile(CSV, escribirCsv(finales), 'utf8');

  const sinFoto = finales.filter((f) => f.revisar.includes('FOTO PENDIENTE')).length;
  const conFoto = finales.length - sinFoto;
  const vendidas = finales.filter((f) => f.estado === 'vendida').length;

  console.log(`\n  ${finales.length} obras encontradas.`);
  console.log(`  ${vendidas} marcadas [SOLD], ${finales.length - vendidas} a la venta.`);
  if (conFoto) console.log(`  ${conFoto} con foto en la carpeta.`);
  if (sinFoto) console.log(`  ${sinFoto} SIN foto (ese chat se exportó sin archivos).`);
  if (conservadas) console.log(`  ${conservadas} conservan la revisión que ya habías hecho.`);
  console.log('');


  console.table(
    finales.map((f) => ({
      slug: f.slug.slice(0, 30),
      serie: f.coleccion || '—',
      medidas: f.alto_cm ? `${f.alto_cm}x${f.ancho_cm}` : '—',
      anio: f.anio || '—',
      precio: f.precio_eur ? f.precio_eur + '€' : f.estado === 'vendida' ? 'VENDIDA' : '—',
      marco: f.enmarcada === 'si' ? '▣' : '',
      revisar: f.revisar ? '⚠' : '',
    })),
  );

  console.log(`\n  Revisa  importacion/revision.csv  y luego --confirmar.\n`);
}

/* ------------------------------------------------------------------ */
/* Paso 2: confirmar y escribir                                        */
/* ------------------------------------------------------------------ */

/** Campos de la ficha que se deciden fuera del chat y no se deben pisar. */
const CONSERVAR = [
  'destacada',
  'publicada',
  'descripcion',
  'descripcion_en',
  'titulo_en',
  'profundidad_cm',
];

async function aplicar() {
  if (!existsSync(CSV)) {
    console.error('No existe importacion/revision.csv. Lanza primero el paso 1.');
    process.exit(1);
  }

  const filas = leerCsv(await readFile(CSV, 'utf8'));
  await mkdir(DIR_FOTOS, { recursive: true });
  await mkdir(DIR_OBRAS, { recursive: true });

  let escritas = 0;
  let marcadores = 0;
  const saltadas = [];

  for (const [i, f] of filas.entries()) {
    // Solo es imprescindible poder nombrarla. Sin medidas se publica igual:
    // de algunas obras antiguas ya no hay forma de saberlas.
    const faltan = ['slug', 'titulo'].filter((c) => !f[c]);
    if (faltan.length) {
      saltadas.push(`${f.slug || '(sin slug)'}: falta ${faltan.join(', ')}`);
      continue;
    }

    const origenes = (f.fotos || '')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s && s !== '(pendiente)');

    const imagenes = [];

    if (origenes.length) {
      for (const [n, nombre] of origenes.entries()) {
        const origen = join(carpeta, nombre);
        if (!existsSync(origen)) continue;
        const destino = join(DIR_FOTOS, `${f.slug}-${String(n + 1).padStart(2, '0')}.jpg`);

        // Si viene girada por EXIF hay que enderezarla; si no, se copia tal
        // cual para no recomprimir un JPEG que ya pasó por WhatsApp.
        const meta = await sharp(origen).metadata();
        const esJpeg = ['.jpg', '.jpeg'].includes(extname(origen).toLowerCase());
        if ((meta.orientation && meta.orientation !== 1) || !esJpeg) {
          await sharp(origen).rotate().jpeg({ quality: 92, mozjpeg: true }).toFile(destino);
        } else {
          await copyFile(origen, destino);
        }
        imagenes.push(`/src/assets/obras/${basename(destino)}`);
      }
    }

    // Sin foto: marcador con la proporción real, que se sustituye luego
    // dejando la foto de Sergio con el mismo nombre.
    if (!imagenes.length) {
      const destino = join(DIR_FOTOS, `${f.slug}-01.jpg`);
      await crearMarcador({
        destino,
        titulo: f.titulo,
        alto_cm: Number(f.alto_cm) || 5,
        ancho_cm: Number(f.ancho_cm) || 4,
      });
      imagenes.push(`/src/assets/obras/${basename(destino)}`);
      marcadores++;
    }

    // Tipografía arreglada y traducción, para que la web inglesa no
    // afirme "Oil on canvas" de una técnica mixta sobre madera.
    const tecnicaEs = normalizar(f.tecnica || 'Óleo sobre lienzo');
    const tecnicaEn = traducir(tecnicaEs);
    const edicionEn = traducirEdicion(f.edicion);

    const obra = {
      titulo: f.titulo,
      ...(f.coleccion ? { coleccion: f.coleccion } : {}),
      ...(f.tipo === 'print' ? { tipo: 'print' } : {}),
      ...(f.edicion ? { edicion: f.edicion } : {}),
      ...(edicionEn ? { edicion_en: edicionEn } : {}),
      ...(f.anio ? { anio: Number(f.anio) } : {}),
      tecnica: tecnicaEs,
      ...(tecnicaEn ? { tecnica_en: tecnicaEn } : {}),
      ...(f.alto_cm && f.ancho_cm
        ? { alto_cm: Number(f.alto_cm), ancho_cm: Number(f.ancho_cm) }
        : {}),
      enmarcada: f.enmarcada === 'si',
      ...(f.precio_eur ? { precio_eur: Number(f.precio_eur) } : {}),
      estado: f.estado || 'disponible',
      imagenes,
      orden: i + 1,
    };

    // Si la ficha ya existe, se conservan los campos que NO vienen del chat:
    // la selección de destacadas, si está publicada, las descripciones y las
    // traducciones del título. Sin esto, reimportar con fotos de mejor
    // calidad deshacía la portada que Sergio ya había aprobado.
    const rutaJson = join(DIR_OBRAS, `${f.slug}.json`);
    const previa = existsSync(rutaJson) ? JSON.parse(await readFile(rutaJson, 'utf8')) : {};
    const conservados = Object.fromEntries(
      CONSERVAR.filter((c) => previa[c] !== undefined).map((c) => [c, previa[c]]),
    );
    const final = { destacada: false, ...conservados, ...obra };

    await writeFile(rutaJson, JSON.stringify(final, null, 2) + '\n', 'utf8');
    escritas++;
  }

  console.log(`\n  ${escritas} obras escritas en src/content/obras/.`);
  if (marcadores) console.log(`  ${marcadores} con imagen marcador, a la espera de la foto real.`);
  if (saltadas.length) {
    console.log(`\n  ${saltadas.length} saltadas:`);
    for (const s of saltadas) console.log(`    · ${s}`);
  }
  console.log(`\n  Ahora: npm run build\n`);
}

await (confirmar ? aplicar() : analizar());
