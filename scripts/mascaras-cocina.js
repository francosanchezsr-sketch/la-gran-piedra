// Genera una máscara por zona del sprite isométrico de cocina.
//
// El dibujo es line art: cada superficie es un área clara cerrada por trazos
// oscuros. Rellenando por inundación desde una semilla dentro de cada superficie
// y frenando al llegar a un trazo, se recorta la zona al píxel — mucho más
// preciso que dibujar polígonos a ojo encima de una perspectiva isométrica.
//
// Salida: public/cocina/mask-<zona>.png, blanco = zona, negro = fuera.
// Uso: node scripts/mascaras-cocina.js

const sharp = require('sharp');
const path = require('path');

const ORIGEN = path.join(__dirname, '..', 'public', 'cocina', 'base.webp');
const DESTINO = path.join(__dirname, '..', 'public', 'cocina');

// Semillas en coordenadas de base.webp (1400 x 1475). Cada superficie del
// dibujo es un área cerrada distinta, así que una puerta y su vecina necesitan
// su propia semilla.
const ZONAS = {
  cabinetUpper: [
    [150, 470], [200, 520], [300, 430], [345, 470],
    [420, 390], [470, 430], [560, 300], [600, 250],
    [660, 300], [700, 250], [600, 360], [660, 400],
  ],
  cabinetLower: [
    [230, 900], [255, 960], [370, 855], [395, 910],
    [480, 800], [520, 840], [610, 760], [650, 800],
    [780, 1080], [880, 1120], [980, 1060], [1030, 1000],
    [700, 1000], [760, 960],
  ],
  countertop: [
    [260, 800], [420, 720], [560, 640], [680, 580],
    [800, 830], [950, 880], [1050, 820],
  ],
  backsplash: [
    [200, 700], [300, 640], [420, 560], [520, 500], [620, 440],
  ],
  floor: [
    [400, 1230], [700, 1300], [1000, 1250], [1150, 1150], [250, 1100],
  ],
  wallBackground: [
    [90, 560], [110, 700], [1150, 620], [1250, 800], [900, 380],
  ],
};

// Un píxel es "trazo" cuando es claramente más oscuro que la superficie: ahí se
// detiene la inundación.
const UMBRAL_TRAZO = 118;
// Cuánto puede alejarse un píxel del tono de su semilla sin dejar de ser la
// misma superficie. Holgado porque el dibujo tiene sombreado suave.
const TOLERANCIA = 46;

async function main() {
  const img = sharp(ORIGEN).ensureAlpha();
  const { width, height } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });

  const lum = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    lum[i] = (data[o] * 299 + data[o + 1] * 587 + data[o + 2] * 114) / 1000;
  }

  for (const [zona, semillas] of Object.entries(ZONAS)) {
    const dentro = new Uint8Array(width * height);
    let pintados = 0;

    for (const [sx, sy] of semillas) {
      const inicio = sy * width + sx;
      if (dentro[inicio]) continue;
      const base = lum[inicio];
      if (base < UMBRAL_TRAZO) {
        console.warn(`  ! ${zona}: la semilla (${sx},${sy}) cayó sobre un trazo, se omite`);
        continue;
      }
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

    const pct = ((pintados / (width * height)) * 100).toFixed(1);
    await sharp(Buffer.from(dentro), { raw: { width, height, channels: 1 } })
      // Un desenfoque mínimo cierra los trazos de un píxel que quedan como
      // costura entre superficies de la misma zona.
      .blur(0.6)
      .png({ compressionLevel: 9 })
      .toFile(path.join(DESTINO, `mask-${zona}.png`));
    console.log(`  ${zona}: ${pintados.toLocaleString()} px (${pct}% del lienzo)`);
  }

  console.log(`\nLienzo ${width}x${height}. Máscaras en public/cocina/.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
