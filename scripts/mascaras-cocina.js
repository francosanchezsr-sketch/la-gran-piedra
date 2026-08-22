// Genera una máscara por zona del sprite isométrico de cocina.
// Uso: node scripts/mascaras-cocina.js
//
// Dos técnicas, según lo que sea la zona:
//
// 1. INUNDACIÓN, para los muebles. Cada puerta y cada cajón es un área clara
//    cerrada por trazos; se rellena desde una semilla y se frena en el trazo.
//    Recorta al píxel, que es lo que hace falta cuando la silueta importa.
//
// 2. POLÍGONO, para el backsplash y los muros. Son planos lisos y grandes, y
//    el backsplash además es espiga: cientos de celdas diminutas que ninguna
//    semilla alcanza. No hace falta esquivar las líneas — como el color se
//    aplica en 'multiply', teñir la región entera deja las juntas a la vista,
//    solo más oscuras. Un cuadrilátero basta.
//
// Los gabinetes van en UNA sola máscara: alto, bajo e isla llevan siempre el
// mismo color, así que separarlos solo servía para equivocarse de grupo.

const sharp = require('sharp');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'cocina');
const ORIGEN = path.join(DIR, 'base.webp');

// Semillas en coordenadas de base.webp (1400 x 1475).
const POR_INUNDACION = {
  gabinetes: [
    // altos: puertas de izquierda a derecha y el módulo de repisas
    [150, 470], [200, 520], [250, 450], [300, 430], [345, 470], [390, 420],
    [420, 390], [470, 430], [520, 360], [560, 300], [600, 250], [640, 300],
    [600, 360], [660, 240], [700, 290], [560, 420],
    // bajos: cajones y puertas del muro largo
    [255, 960], [230, 880], [300, 900], [370, 855], [395, 910], [340, 990],
    [480, 800], [520, 840], [460, 870], [560, 780], [610, 760], [650, 800],
    [700, 720], [760, 690],
    // isla: frentes
    [780, 1080], [830, 1050], [880, 1120], [930, 1070], [980, 1060],
    [1020, 1010], [700, 1010], [740, 1060], [640, 1080],
  ],
  countertop: [
    // barra larga
    [260, 800], [340, 760], [420, 720], [500, 680], [560, 640], [620, 610],
    // cubierta de la isla
    [800, 830], [880, 800], [950, 860], [1020, 830], [740, 870],
  ],
  piso: [
    [400, 1230], [700, 1300], [1000, 1250], [1150, 1150], [250, 1100], [550, 1180],
  ],
  // Grifo y lámparas. No se pintan —se quedan metálicos— pero hay que
  // recortarlos de las demás zonas: la pantalla de la lámpara izquierda cae
  // encima del backsplash y se teñía con él.
  fixtures: [
    [690, 690], [660, 720], [720, 660], [900, 540], [870, 570], [930, 520],
    [905, 285], [688, 405],
  ],
};

// Cuando dos máscaras se pisan, manda la de más arriba en esta lista. Sin esto
// la cubierta de la isla acababa del color del gabinete, porque los gabinetes
// se pintan al final y tapaban lo que ya estaba bien.
const PRIORIDAD = ['fixtures', 'countertop', 'gabinetes', 'backsplash', 'muros', 'piso'];

// Cuadriláteros en las mismas coordenadas. Orden: los vértices tal como se
// recorren.
const POR_POLIGONO = {
  backsplash: [[62, 652], [700, 366], [700, 470], [62, 800]],
  muros: [
    // muro izquierdo (el de los gabinetes), de arriba abajo
    [[36, 404], [700, 92], [700, 372], [36, 690]],
    // muro derecho
    [[706, 92], [1368, 404], [1368, 1122], [706, 810]],
  ],
};

const UMBRAL_TRAZO = 118;
const TOLERANCIA = 46;

async function inundar(nombre, semillas, lum, width, height) {
  const dentro = new Uint8Array(width * height);
  let pintados = 0;
  let omitidas = 0;

  for (const [sx, sy] of semillas) {
    const inicio = sy * width + sx;
    if (dentro[inicio]) continue;
    const base = lum[inicio];
    if (base < UMBRAL_TRAZO) { omitidas++; continue; }
    const pila = [inicio];
    while (pila.length) {
      const p = pila.pop();
      if (dentro[p]) continue;
      const l = lum[p];
      if (l < UMBRAL_TRAZO || Math.abs(l - base) > TOLERANCIA) continue;
      dentro[p] = 255;
      pintados++;
      const x = p % width;
      if (x > 0) pila.push(p - 1);
      if (x < width - 1) pila.push(p + 1);
      if (p >= width) pila.push(p - width);
      if (p < width * (height - 1)) pila.push(p + width);
    }
  }

  await sharp(Buffer.from(dentro), { raw: { width, height, channels: 1 } })
    .blur(0.6)
    .png({ compressionLevel: 9 })
    .toFile(path.join(DIR, `mask-${nombre}.png`));

  const pct = ((pintados / (width * height)) * 100).toFixed(1);
  console.log(`  ${nombre.padEnd(12)} ${pct.padStart(5)}%  (inundación${omitidas ? `, ${omitidas} semillas sobre trazo` : ''})`);
}

async function poligonar(nombre, poligonos, width, height) {
  const lista = Array.isArray(poligonos[0][0]) ? poligonos : [poligonos];
  const paths = lista
    .map((pts) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="#fff"/>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#000"/>${paths}</svg>`;

  await sharp(Buffer.from(svg))
    .greyscale()
    .png({ compressionLevel: 9 })
    .toFile(path.join(DIR, `mask-${nombre}.png`));
  console.log(`  ${nombre.padEnd(12)}        (polígono, ${lista.length} cara${lista.length > 1 ? 's' : ''})`);
}

async function main() {
  const img = sharp(ORIGEN).ensureAlpha();
  const { width, height } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });

  const lum = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    lum[i] = (data[o] * 299 + data[o + 1] * 587 + data[o + 2] * 114) / 1000;
  }

  console.log(`Lienzo ${width}x${height}\n`);
  for (const [nombre, semillas] of Object.entries(POR_INUNDACION)) {
    await inundar(nombre, semillas, lum, width, height);
  }
  for (const [nombre, poligonos] of Object.entries(POR_POLIGONO)) {
    await poligonar(nombre, poligonos, width, height);
  }

  // Cada máscara le cede los píxeles a las que van antes en PRIORIDAD.
  console.log('\nResolviendo encimes:');
  const buffers = {};
  for (const z of PRIORIDAD) {
    buffers[z] = await sharp(path.join(DIR, `mask-${z}.png`)).greyscale().raw().toBuffer();
  }
  for (let i = 1; i < PRIORIDAD.length; i++) {
    const zona = PRIORIDAD[i];
    const mio = buffers[zona];
    let quitados = 0;
    for (let j = 0; j < i; j++) {
      const superior = buffers[PRIORIDAD[j]];
      for (let p = 0; p < mio.length; p++) {
        if (mio[p] > 24 && superior[p] > 24) { mio[p] = 0; quitados++; }
      }
    }
    await sharp(mio, { raw: { width, height, channels: 1 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(DIR, `mask-${zona}.png`));
    console.log(`  ${zona.padEnd(12)} cedió ${quitados.toLocaleString()} px`);
  }

  console.log('\nMáscaras en public/cocina/.');
}

main().catch((e) => { console.error(e); process.exit(1); });
