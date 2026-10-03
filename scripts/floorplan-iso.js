/**
 * Normaliza los isométricos de floorplan (`visuales/floorplan/*.png`) al set
 * que consume el carrusel del paso 1: `public/floorplans/<CLAVE>.webp`.
 *
 * Los tres primeros llegaron recortados sobre transparencia y a 1200 x 896. El
 * del patio techado llegó al doble de tamaño y **sobre fondo negro**, así que
 * aquí se le levanta el alfa: el dibujo es blanco y gris sobre negro puro, de
 * modo que el propio brillo sirve de máscara. La rampa va de 10 a 48 —por
 * debajo de 10 es fondo, por encima de 48 ya es dibujo (el gris más oscuro de
 * las cuatro maquetas anda en 96)— y ese tramo intermedio es el antialias del
 * render, que se conserva en vez de recortarse a filo de navaja.
 *
 * Ese mismo render venía además MÁS CLARO que los otros tres: sus sombras más
 * hondas se quedaban en 115 de brillo, donde las de B, C y D llegan a 68. Al
 * lado de ellos se veía desteñido. Por eso lleva `tono`, un ajuste de niveles
 * que baja el punto de negro y compensa con gamma para no ensuciar los blancos
 * — ver `igualaTono()`. Los tres primeros no lo llevan: son la referencia.
 *
 * Todo termina en 1100 x 821, que es la medida de los tres que ya estaban: el
 * carrusel y la lámina asumen esa proporción y una maqueta más grande se vería
 * de otro tamaño en la misma tarjeta.
 *
 * No pisa lo que ya existe salvo que se le pida:
 *
 *   node scripts/floorplan-iso.js              # solo lo que falta
 *   node scripts/floorplan-iso.js A --rehacer  # rehace uno
 *   node scripts/floorplan-iso.js --rehacer    # todos
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ORIGEN = path.join(__dirname, '..', '..', 'visuales', 'floorplan');
const DESTINO = path.join(__dirname, '..', 'public', 'floorplans');

const ANCHO = 1100;
const ALTO = 821;

// Qué archivo es qué plano. Los nombres del render son de estudio, no claves.
const PLANOS = [
  // `tono.negro` es el brillo que en ESTE render hace de sombra más honda, y
  // que hay que llevar a 68 —el de los otros tres— para que la maqueta no se
  // vea desteñida al lado de ellos. La gamma levanta los medios que el
  // estirón se lleva de más: sin ella los muros interiores salían sucios.
  { clave: 'A', archivo: 'patio estandar.png', tono: { negro: 115, gamma: 0.88 } },
  { clave: 'B', archivo: 'corredor pasillo.png' },
  { clave: 'C', archivo: 'patio central.png' },
  { clave: 'D', archivo: '2 pisos.png' },
];

// Umbrales de la máscara, en brillo de 0 a 255.
const FONDO = 10;
const DIBUJO = 48;

// El punto de negro de los tres primeros, medido sobre sus píxeles opacos
// (percentil 2 de luminancia). Es el ancla contra la que se iguala el resto.
const NEGRO_REFERENCIA = 68;

/**
 * Iguala el tono de un render al de los tres primeros: estira el rango para
 * que su sombra más honda caiga en `NEGRO_REFERENCIA` y aplica gamma para que
 * los medios no se vayan de más. El blanco no se toca — los cuatro renders
 * comparten el mismo papel.
 */
function igualaTono(data, px, { negro, gamma }) {
  const escala = (255 - NEGRO_REFERENCIA) / (255 - negro);
  for (let i = 0; i < px; i++) {
    const j = i * 4;
    if (data[j + 3] === 0) continue;
    for (let c = 0; c < 3; c++) {
      const estirado = Math.max(0, Math.min(255, NEGRO_REFERENCIA + (data[j + c] - negro) * escala));
      data[j + c] = Math.round(255 * Math.pow(estirado / 255, gamma));
    }
  }
}

/** Levanta el alfa de un render sobre negro. Devuelve un buffer PNG. */
async function recortaDelNegro(archivo, tono) {
  const { data, info } = await sharp(archivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = info.width * info.height;
  for (let i = 0; i < px; i++) {
    const j = i * 4;
    const brillo = Math.max(data[j], data[j + 1], data[j + 2]);
    if (brillo <= FONDO) data[j + 3] = 0;
    else if (brillo < DIBUJO) data[j + 3] = Math.round(((brillo - FONDO) / (DIBUJO - FONDO)) * 255);
  }
  // El tono se iguala DESPUÉS de recortar: así el negro del fondo, que ya es
  // transparente, no arrastra la cuenta.
  if (tono) igualaTono(data, px, tono);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

(async () => {
  const rehacer = process.argv.includes('--rehacer');
  fs.mkdirSync(DESTINO, { recursive: true });

  const solo = process.argv.slice(2).filter((a) => !a.startsWith('--'));

  for (const { clave, archivo, tono } of PLANOS) {
    if (solo.length && !solo.includes(clave)) continue;
    const origen = path.join(ORIGEN, archivo);
    const destino = path.join(DESTINO, `${clave}.webp`);
    if (!fs.existsSync(origen)) { console.log(`· ${clave}: sin origen (${archivo})`); continue; }
    if (fs.existsSync(destino) && !rehacer) { console.log(`· ${clave}: ya estaba`); continue; }

    const meta = await sharp(origen).metadata();
    const entrada = meta.hasAlpha ? await fs.promises.readFile(origen) : await recortaDelNegro(origen, tono);

    await sharp(entrada)
      .resize(ANCHO, ALTO, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 90 })
      .toFile(destino);

    console.log(`✓ ${clave}: ${archivo} → ${path.basename(destino)}${meta.hasAlpha ? '' : ' (recortado del negro)'}`);
  }
})();
