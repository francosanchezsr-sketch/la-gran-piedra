/**
 * Derivados JPEG de los renders, para la lámina que viaja adjunta en el
 * correo del arquitecto (`lib/lamina.tsx`).
 *
 * POR QUÉ EXISTE ESTE SCRIPT: la lámina del correo se rasteriza con
 * `ImageResponse` de Next (satori + resvg), y satori NO decodifica webp —
 * se probó en vivo y truena con `TypeError: u2 is not iterable`. Todos los
 * renders del sitio son webp, así que hace falta una copia en un formato que
 * sí lea. JPEG y no PNG porque son fotos/renders con degradados: a la mitad
 * del peso se ven igual, y el bundle de `ImageResponse` tiene tope de 500 KB
 * contando imágenes.
 *
 * Se quedan chicos a propósito (720 px de ancho): en la lámina cada render
 * ocupa una tarjeta de ~320 px, así que más resolución solo engorda el correo.
 *
 * No pisa lo que ya existe salvo que se le pida:
 *
 *   node scripts/renders-correo.js            # solo lo que falta
 *   node scripts/renders-correo.js --rehacer  # todos
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const PUBLIC = path.join(RAIZ, 'public');
const DESTINO = path.join(PUBLIC, 'correo');

const ANCHO = 720;
const CALIDAD = 82;

// Las mismas rutas de `lib/assets.ts`. Se listan por archivo y no por clave
// porque varias claves comparten render (TH y D son el mismo plano).
const FUENTES = [
  'fachadas/esc.webp',
  'fachadas/farm.webp',
  'fachadas/piedra.webp',
  'fachadas/negro.webp',
  'floorplans/A.webp',
  'floorplans/B.webp',
  'floorplans/C.webp',
  'floorplans/D.webp',
  'cocina/paletas/panel-nogal-marmol.webp',
  'cocina/paletas/panel-nogal-oscuro-blanco.webp',
  'cocina/paletas/panel-olivo-dorado.webp',
  'cocina/paletas/panel-crema-laton.webp',
  'cocina/paletas/panel-azul-acero-dorado.webp',
  'cocina/paletas/panel-blanco-cuarzo-gris.webp',
];

/** `fachadas/esc.webp` -> `public/correo/fachadas-esc.jpg` */
function destinoDe(rel) {
  return path.join(DESTINO, rel.replace(/\//g, '-').replace(/\.webp$/, '.jpg'));
}

(async () => {
  const rehacer = process.argv.includes('--rehacer');
  fs.mkdirSync(DESTINO, { recursive: true });

  let hechos = 0, saltados = 0, faltantes = 0;
  for (const rel of FUENTES) {
    const origen = path.join(PUBLIC, rel);
    const destino = destinoDe(rel);
    if (!fs.existsSync(origen)) { console.log(`· ${rel}: sin origen`); faltantes++; continue; }
    if (fs.existsSync(destino) && !rehacer) { saltados++; continue; }

    // Fondo blanco: los renders traen alfa y el JPEG no lo soporta — sin esto
    // el transparente sale negro.
    await sharp(origen)
      .resize({ width: ANCHO, withoutEnlargement: true })
      .flatten({ background: '#FFFFFF' })
      .jpeg({ quality: CALIDAD, mozjpeg: true })
      .toFile(destino);

    const kb = (fs.statSync(destino).size / 1024).toFixed(0);
    console.log(`✓ ${rel} → ${path.basename(destino)} (${kb} KB)`);
    hechos++;
  }
  console.log(`\n${hechos} hechos · ${saltados} ya estaban · ${faltantes} sin origen`);
})();
