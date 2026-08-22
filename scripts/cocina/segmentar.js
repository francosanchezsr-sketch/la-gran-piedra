// Paso 1 de la cocina isométrica: partir el sprite en blanco en regiones.
//
// El dibujo es line art con planos casi lisos. En vez de sembrar coordenadas a
// ojo —que es como se hizo antes y por eso el piso se derramaba— aquí se
// levanta una barrera con el gradiente (Sobel) y se inunda todo lo que no es
// borde. Cada plano del dibujo cae en su propia región, incluidos los del
// marco oscuro, que un umbral de luminancia se habría comido.
//
// Salida: regiones.bin (Int32 por píxel) + regiones.json (área y centroide de
// cada una) + regiones-mapa.png para poder mirarlas y rotularlas.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ORIGEN = path.join(__dirname, '..', '..', '..', 'visuales', 'cocina en blanco.png');
const SALIDA = __dirname;

const UMBRAL_BORDE = 26;   // magnitud Sobel a partir de la cual hay barrera
const AREA_MINIMA = 900;   // por debajo de esto no es un plano, es ruido

async function main() {
  const img = sharp(ORIGEN).flatten({ background: '#ffffff' });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const N = W * H;

  const lum = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const o = i * C;
    lum[i] = (data[o] * 299 + data[o + 1] * 587 + data[o + 2] * 114) / 1000;
  }

  // Sobel
  const borde = new Uint8Array(N);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx =
        -lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1] +
         lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1];
      const gy =
        -lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1] +
         lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1];
      if (Math.hypot(gx, gy) / 4 > UMBRAL_BORDE) borde[i] = 1;
    }
  }
  // El marco del lienzo también es barrera, si no el fondo se cuela.
  for (let x = 0; x < W; x++) { borde[x] = 1; borde[(H - 1) * W + x] = 1; }
  for (let y = 0; y < H; y++) { borde[y * W] = 1; borde[y * W + W - 1] = 1; }

  // Inundación 4-conexa sobre lo que no es borde.
  const reg = new Int32Array(N).fill(-1);
  const info_reg = [];
  const pila = new Int32Array(N);
  let siguiente = 0;

  for (let s = 0; s < N; s++) {
    if (borde[s] || reg[s] !== -1) continue;
    const id = siguiente++;
    let tope = 0, area = 0, sx = 0, sy = 0, sl = 0;
    let minx = W, maxx = 0, miny = H, maxy = 0;
    pila[tope++] = s;
    reg[s] = id;
    while (tope) {
      const p = pila[--tope];
      const x = p % W, y = (p / W) | 0;
      area++; sx += x; sy += y; sl += lum[p];
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
      if (x > 0     && !borde[p - 1] && reg[p - 1] === -1) { reg[p - 1] = id; pila[tope++] = p - 1; }
      if (x < W - 1 && !borde[p + 1] && reg[p + 1] === -1) { reg[p + 1] = id; pila[tope++] = p + 1; }
      if (y > 0     && !borde[p - W] && reg[p - W] === -1) { reg[p - W] = id; pila[tope++] = p - W; }
      if (y < H - 1 && !borde[p + W] && reg[p + W] === -1) { reg[p + W] = id; pila[tope++] = p + W; }
    }
    info_reg.push({
      id, area,
      cx: Math.round(sx / area), cy: Math.round(sy / area),
      lum: +(sl / area).toFixed(1),
      caja: [minx, miny, maxx, maxy],
    });
  }

  const grandes = info_reg.filter((r) => r.area >= AREA_MINIMA).sort((a, b) => b.area - a.area);
  console.log(`Lienzo ${W}x${H} — ${info_reg.length} regiones, ${grandes.length} con área >= ${AREA_MINIMA}`);

  fs.writeFileSync(path.join(SALIDA, 'regiones.bin'), Buffer.from(reg.buffer));
  // Se guardan TODAS, no solo las grandes: las jaladeras y las varillas viven
  // en regiones de unos cientos de píxeles y hacen falta para detectarlas.
  fs.writeFileSync(path.join(SALIDA, 'regiones.json'),
    JSON.stringify({ W, H, areaMinima: AREA_MINIMA, regiones: grandes, todas: info_reg }));

  // Mapa para mirar: cada región grande con un color estable y su número encima.
  const vis = Buffer.alloc(N * 3, 255);
  const esGrande = new Set(grandes.map((r) => r.id));
  for (let i = 0; i < N; i++) {
    const r = reg[i];
    if (r < 0) { vis[i * 3] = 20; vis[i * 3 + 1] = 20; vis[i * 3 + 2] = 20; continue; }
    if (!esGrande.has(r)) continue;
    const h = (r * 2654435761) >>> 0;
    vis[i * 3] = 90 + (h & 127); vis[i * 3 + 1] = 90 + ((h >> 8) & 127); vis[i * 3 + 2] = 90 + ((h >> 16) & 127);
  }
  const base = await sharp(vis, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  const etiquetas = grandes.slice(0, 140).map((r) =>
    `<text x="${r.cx}" y="${r.cy}" font-size="26" font-weight="bold" fill="#000" stroke="#fff" stroke-width="4" paint-order="stroke" text-anchor="middle">${r.id}</text>`
  ).join('');
  const conTexto = await sharp(base)
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${etiquetas}</svg>`) }])
    .png().toBuffer();
  await sharp(conTexto).resize(1700).png().toFile(path.join(SALIDA, 'regiones-mapa.png'));

  console.log('\nLas 60 mayores:');
  for (const r of grandes.slice(0, 60)) {
    console.log(`  #${String(r.id).padStart(4)}  área ${String(r.area).padStart(8)}  centro (${String(r.cx).padStart(4)},${String(r.cy).padStart(4)})  lum ${String(r.lum).padStart(5)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
