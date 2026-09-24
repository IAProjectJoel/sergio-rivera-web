# Web de Sergio Rivera Martínez

Catálogo de obra original con ficha por cuadro, series, estado de venta
(incluido el **punto rojo de "vendida"**), español e inglés, y panel de
administración para que Sergio lo mantenga solo.

- **Stack**: Astro 7 estático. Sin base de datos, sin servidor que mantener.
- **Dominio**: `sergioriveramartinez.com` (ya lo tiene el cliente).
- **Venta**: catálogo + consulta por WhatsApp/correo. Sin pasarela de pago
  todavía — ver *Cuando llegue el momento de cobrar online*.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # genera dist/
```

---

## Cómo se añade una obra

Cada cuadro es **un archivo JSON** en `src/content/obras/`. El nombre del
archivo es la URL: `ferrari-rocher.json` → `/obra/ferrari-rocher`.

```json
{
  "titulo": "Ferrari Rocher",
  "titulo_en": "Ferrari Rocher",
  "coleccion": "nostalgia",
  "anio": 2024,
  "tecnica": "Óleo sobre lienzo",
  "alto_cm": 33,
  "ancho_cm": 41,
  "enmarcada": false,
  "precio_eur": 990,
  "estado": "disponible",
  "imagenes": ["/src/assets/obras/ferrari-rocher-01.jpg"],
  "destacada": true,
  "orden": 1
}
```

Lo único obligatorio es `titulo` e `imagenes`. Las medidas son opcionales: de algunas obras antiguas ya no se pueden saber, y se publican sin ellas. Si falta
algo o está mal escrito, **el build falla y avisa** en vez de publicar una
ficha rota.

| Campo | Para qué |
|---|---|
| `estado` | `disponible` · `reservada` · `vendida` · `no_venta`. De aquí sale el punto rojo, el filtro y el botón. |
| `tipo` | `original` (por defecto) o `print`. |
| `edicion` | Solo prints: "Prueba de autor (P/A) · única" o "Edición de 10". Es lo que dice si la lámina es pieza única o no. |
| `precio_eur` | Si se deja vacío, la web pone "Consultar precio". **En las vendidas no se muestra nunca**, aunque esté guardado. |
| `imagenes` | La primera es la principal; las demás salen como miniaturas. |
| `destacada` | La saca en la portada. |
| `orden` | Número más bajo, aparece antes. |
| `publicada` | `false` la esconde sin borrarla. |
| `*_en` | Traducción. Si falta, se muestra el español. |

### Marcar una obra como vendida

Cambiar `"estado": "disponible"` por `"estado": "vendida"`. Eso solo hace
aparecer el punto rojo sobre la foto y la etiqueta VENDIDA, **oculta el precio**
(quien compra no quiere que se sepa cuánto pagó) y la obra entra en el filtro
"Vendidas". El botón de compra pasa a preguntar por obra parecida.

### Las series

Siete, definidas en `src/content/colecciones/`. Porsche cuelga de Coches:

```
Coches ──> Porsche
Motos
Nostalgia
Sneakers
Nativos americanos
Prints
```

Crear una nueva es un archivo JSON. Para que sea subserie, se le pone `padre`:

```json
{ "nombre": "Porsche", "padre": "coches", "orden": 1, "visible": true }
```

Y en cada obra, `"coleccion": "porsche"`. Sin tocar código: la serie sale sola
en la portada, en el filtro y en `/coleccion/porsche`.

**El anidamiento cuenta hacia arriba**: filtrar por Coches trae también los
Porsche, y la página de Coches los lista. Solo se admite un nivel — si algún
día hace falta una subserie de una subserie, hay que tocar `src/lib/obras.ts`.

---

## Importar un lote desde WhatsApp

Sergio manda las obras por WhatsApp: foto, datos, foto, datos. Para no
teclearlo a mano hay un importador que lee la exportación del chat.

**1. Exportar el chat con los archivos.** En el chat con Sergio:

- *iPhone*: toca su nombre arriba → **Exportar chat** → **Adjuntar archivos**.
- *Android*: ⋮ → **Más** → **Exportar chat** → **Incluir archivos**.

Sale un `.zip`. Descomprímelo donde sea:

```bash
Expand-Archive chat.zip -DestinationPath C:\temp\chat-sergio
```

**2. Analizar.** El script lee `_chat.txt`, empareja cada foto con el mensaje
de datos que la acompaña e intenta sacar título, técnica, medidas, año y precio:

```bash
npm run importar -- "C:\temp\chat-sergio"
```

Escribe `importacion/revision.csv` y saca por pantalla una tabla con lo que ha
entendido, marcando con ⚠ lo que no ha podido.

**3. Revisar.** Abre ese CSV con Excel (está en UTF-8 con punto y coma, se abre
bien en español). Corrige lo que haga falta, **borra las filas que no sean
obras** (mensajes sueltos del chat que se hayan colado) y rellena la columna
`coleccion` con la serie de cada una. Guarda.

> **Reanalizar no borra tu revisión.** Si vuelves a lanzar el paso 2 con otra
> exportación del mismo chat, el script empareja las filas por el texto del
> mensaje de Sergio y **conserva todo lo que hayas corregido a mano**,
> actualizando solo las fotos. Es el caso normal: primero llega el chat sin
> archivos y luego el mismo chat con ellos. Para descartar la revisión y
> empezar de cero, `--desde-cero`.

**4. Confirmar.** Copia las fotos a `src/assets/obras/` y escribe los JSON:

```bash
npm run importar -- "C:\temp\chat-sergio" --confirmar
```

Luego `npm run build`: si falta algún dato obligatorio, falla y te dice cuál.

Va en dos pasos a propósito. Los datos llegan en texto libre y aquí se están
fijando los precios de una web real — el script propone, una persona confirma.
Lo que sabe entender: `33x41`, `33 x 41 cm`, `41 × 33,5`, `990€`, `1.200 €`,
un número suelto como precio, todo junto en una línea separado por comas, y
los datos puestos antes o después de la foto. No confunde el `92` de "Air Max
del 92" con el año.

### Sobre la calidad de las fotos

WhatsApp recomprime lo que se manda desde la galería a 2048 px de lado largo y
~1,3 bits por píxel. Sirve para publicar, pero el zoom de la ficha —que está ahí para que se
vea la pincelada— enseña antes los artefactos del JPEG que el óleo.

Cuando se pueda, pedirle a Sergio que las reenvíe como 📎 → **Documento**:
llegan sin tocar. Reimportar entonces es repetir los mismos dos pasos con la
exportación nueva; los archivos se llaman igual (`<slug>-01.jpg`), así que se
sustituyen solos y no hay que tocar ninguna ficha.

---

## Las fotos

Van en `src/assets/obras/`. Astro las convierte a WebP/AVIF en varios tamaños
y sirve a cada móvil el que le toca — por eso las fotos **originales deben ser
grandes** (2000 px de lado largo o más); reducirlas antes solo empeora el
resultado.

Las 36 obras publicadas llevan **su foto real**, importada del chat. Para
cambiar una: dejar la nueva con el mismo nombre (`<slug>-01.jpg`). Si una obra
nueva llega sin foto, el importador le pone un marcador con su proporción real.

El texto alternativo se genera solo a partir de la ficha
("Ferrari Rocher — Óleo sobre lienzo, 33 × 41 cm"), así que no hay que
escribirlo a mano.

---

## Panel de administración

`/admin` monta [Sveltia CMS](https://github.com/sveltia/sveltia-cms): Sergio
entra con GitHub, sube fotos, crea obras y marca vendidas desde el móvil. Cada
cambio se guarda en el repositorio y dispara un despliegue.

Para probarlo en local no hace falta ningún servidor aparte: con `npm run dev`
en marcha, abrir `http://localhost:4321/admin/` **en Chrome o Edge**, pulsar
*Work with Local Repository* y elegir la carpeta `web/`. Los cambios se
escriben directamente en los archivos del proyecto.

---

## Publicar

Publicada en **sergioriveramartinez.com**, con dominio registrado en Wix y
hospedaje en Netlify. El DNS de Wix apunta a Netlify con un registro A a
`75.2.60.5` y un CNAME de `www`.

Netlify construye desde este repositorio: cada cambio en `main` reconstruye y
publica solo. El comando y la versión de Node salen de `netlify.toml`, no de
la configuración del panel de Netlify.

---

## Qué está preparado para Google

- Datos estructurados `VisualArtwork` + `Offer` en cada ficha, con precio y
  disponibilidad (`InStock` / `SoldOut`). Google puede mostrar la obra
  enriquecida en los resultados.
- `hreflang` cruzado entre las dos versiones de cada página.
- `sitemap-index.xml` y `robots.txt`.
- Fuentes auto-alojadas: cero peticiones a Google Fonts, sin aviso de cookies
  por ese motivo.
- Títulos y descripciones por página, generados de la ficha cuando no hay
  descripción escrita.

---

## Cuando llegue el momento de cobrar online

La ficha ya tiene precio y estado, que es lo que necesita una pasarela. Añadir
Stripe es sustituir el botón de `src/components/ConsultaObra.astro` por un
enlace de pago. Antes hacen falta: datos fiscales de Sergio, política de
envíos, condiciones de venta, devoluciones y aviso de cookies.

---

## Nota sobre OneDrive

El proyecto vive dentro de OneDrive, que intenta sincronizar `node_modules/`
(miles de archivos) y ralentiza todo. Conviene excluir del sincronizado
`web/node_modules`, `web/dist` y `web/.astro`, o mover el proyecto fuera de
OneDrive y dejar que GitHub haga de copia de seguridad.
