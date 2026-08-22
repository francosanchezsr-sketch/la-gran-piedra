// Construye el mapa de zonas por píxel y lo deja en zonas.bin.
//
// Tres pasadas, de más específico a más general:
//   1. las regiones enumeradas en zonas.js
//   2. los polígonos (mandan sobre lo anterior donde se pisan, porque el
//      backsplash se sustituye entero)
//   3. lo que quede —bordes, regiones chicas— toma la zona del píxel asignado
//      más cercano, con un BFS multiorigen. Así no quedan huecos, que es
//      justo lo que fallaba antes.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { ZONAS, POR_ID, POLIGONOS, JALADERAS, TRAZO_INTERIOR } = require('./zonas');

const D = __dirname;
const SIN = 255;

function dentroPoligono(px, py, pts) {
  let dentro = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

function construir(lum) {
  const meta = JSON.parse(fs.readFileSync(path.join(D, 'regiones.json')));
  const reg = new Int32Array(fs.readFileSync(path.join(D, 'regiones.bin')).buffer);
  const { W, H } = meta;
  const N = W * H;

  const zonaDeRegion = new Map();
  for (const [zona, ids] of Object.entries(POR_ID)) {
    const z = ZONAS.indexOf(zona);
    for (const id of ids) zonaDeRegion.set(id, z);
  }

  const zona = new Uint8Array(N).fill(SIN);
  // 1. por región
  for (let i = 0; i < N; i++) {
    const z = zonaDeRegion.get(reg[i]);
    if (z !== undefined) zona[i] = z;
  }
  // 1b. jaladeras: regiones chicas, alargadas y rodeadas de gabinete.
  const zNegro = ZONAS.indexOf('negro');
  const zAnfitriona = ZONAS.indexOf(JALADERAS.zonaAnfitriona);
  let nJaladeras = 0;
  const esJaladera = new Set();
  for (const r of meta.todas) {
    if (r.area < JALADERAS.areaMin || r.area > JALADERAS.areaMax) continue;
    const [x0, y0, x1, y1] = r.caja;
    const ancho = x1 - x0 + 1, alto = y1 - y0 + 1;
    const corto = Math.min(ancho, alto), largo = Math.max(ancho, alto);
    if (corto > JALADERAS.ladoCortoMax || largo > JALADERAS.ladoLargoMax) continue;
    if (largo / corto < JALADERAS.relacionMin) continue;
    // ¿de quién está rodeada? se mira un anillo alrededor de su caja
    let anfitriona = 0, otras = 0;
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const pts = [
        [x0 + t * ancho, y0 - 9], [x0 + t * ancho, y1 + 9],
        [x0 - 9, y0 + t * alto], [x1 + 9, y0 + t * alto],
      ];
      for (const [px, py] of pts) {
        const xi = Math.round(px), yi = Math.round(py);
        if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue;
        const z = zona[yi * W + xi];
        if (z === zAnfitriona) anfitriona++; else if (z !== SIN) otras++;
      }
    }
    if (anfitriona < (anfitriona + otras) * 0.75) continue;
    esJaladera.add(r.id);
    nJaladeras++;
    if (process.env.LGP_DEBUG) console.log(`      jaladera #${r.id} caja=${r.caja.join(',')} area=${r.area}`);
  }
  // Se engordan unos píxeles: el contorno con que están dibujadas es un trazo
  // aparte y, si se queda en la zona del gabinete, la jaladera negra sale con
  // un halo de madera alrededor.
  const marcaJaladera = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (esJaladera.has(reg[i])) marcaJaladera[i] = 1;
  const r = JALADERAS.dilatar;
  const dilatada = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (!marcaJaladera[i]) continue;
    const x = i % W, y = (i / W) | 0;
    for (let dy = -r; dy <= r; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx; if (xx < 0 || xx >= W) continue;
        if (dx * dx + dy * dy <= r * r) dilatada[yy * W + xx] = 1;
      }
    }
  }
  for (let i = 0; i < N; i++) if (dilatada[i]) zona[i] = zNegro;

  console.log(`  ${nJaladeras} jaladeras por forma`);

  // 2. por polígono, solo donde ninguna región grande reclamó el píxel. Al
  // revés —el polígono mandando— se comía la barra entera.
  for (const [nombre, polis] of Object.entries(POLIGONOS)) {
    const z = ZONAS.indexOf(nombre);
    for (const pts of polis) {
      let minx = W, maxx = 0, miny = H, maxy = 0;
      for (const [x, y] of pts) {
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
      for (let y = Math.max(0, miny); y <= Math.min(H - 1, maxy); y++)
        for (let x = Math.max(0, minx); x <= Math.min(W - 1, maxx); x++)
          if (zona[y * W + x] === SIN && dentroPoligono(x, y, pts)) zona[y * W + x] = z;
    }
  }
  // La región 0 no es solo el fondo. La sombra suave que el sprite proyecta
  // hacia afuera hace de puente y conecta el fondo blanco con la franja oscura
  // del canto inferior derecho —el grosor de la losa del piso—, así que las dos
  // cosas cayeron en la misma región. Se separan por luminancia: lo oscuro es
  // marco, lo claro es fondo y no se pinta.
  const fondo = new Uint8Array(N);
  const zMarco = ZONAS.indexOf('marco');
  for (let i = 0; i < N; i++) {
    if (reg[i] !== 0) continue;
    if (lum[i] < 165) zona[i] = zMarco; else fondo[i] = 1;
  }

  // 3. BFS multiorigen sobre lo que falta, sin invadir el fondo.
  const cola = new Int32Array(N);
  let cab = 0, fin = 0;
  for (let i = 0; i < N; i++) if (zona[i] !== SIN) cola[fin++] = i;
  while (cab < fin) {
    const p = cola[cab++];
    const z = zona[p];
    const x = p % W;
    const vec = [];
    if (x > 0) vec.push(p - 1);
    if (x < W - 1) vec.push(p + 1);
    if (p >= W) vec.push(p - W);
    if (p < N - W) vec.push(p + W);
    for (const q of vec) if (zona[q] === SIN && !fondo[q]) { zona[q] = z; cola[fin++] = q; }
  }

  // Vía 2: trazo oscuro que solo toca una pieza del mueble.
  const grandes = new Set(meta.regiones.map((r) => r.id));
  const T = TRAZO_INTERIOR, rT = T.radio;
  const zAnf = ZONAS.indexOf(T.zonaAnfitriona);
  const interior = new Uint8Array(N);
  let nTrazo = 0;
  for (let i = 0; i < N; i++) {
    if (zona[i] !== zAnf || lum[i] >= T.umbralOscuro) continue;
    if (grandes.has(reg[i])) continue;          // el interior liso de una cara no es trazo
    const x = i % W, y = (i / W) | 0;
    let unica = -1, varias = false;
    for (let dy = -rT; dy <= rT && !varias; dy++) {
      const yy = y + dy; if (yy < 0 || yy >= H) continue;
      for (let dx = -rT; dx <= rT; dx++) {
        const xx = x + dx; if (xx < 0 || xx >= W) continue;
        const id = reg[yy * W + xx];
        if (!grandes.has(id)) continue;
        if (unica === -1) unica = id; else if (id !== unica) { varias = true; break; }
      }
    }
    if (!varias && unica !== -1) { interior[i] = 1; nTrazo++; }
  }
  for (let i = 0; i < N; i++) if (interior[i]) zona[i] = zNegro;
  console.log(`  ${nTrazo} px de trazo interior a negro`);

  return { zona, W, H, fondo };
}

async function luminancia() {
  const { data, info } = await sharp(path.join(__dirname, '..', '..', '..', 'visuales', 'cocina en blanco.png'))
    .flatten({ background: '#ffffff' }).raw().toBuffer({ resolveWithObject: true });
  const N = info.width * info.height;
  const lum = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const o = i * info.channels;
    lum[i] = (data[o] * 299 + data[o + 1] * 587 + data[o + 2] * 114) / 1000;
  }
  return { lum, W: info.width, H: info.height };
}

async function main() {
  const { lum } = await luminancia();
  const { zona, W, H, fondo } = construir(lum);
  fs.writeFileSync(path.join(D, 'zonas.bin'), Buffer.from(zona.buffer));

  const cuenta = {};
  for (let i = 0; i < zona.length; i++) if (zona[i] !== SIN) cuenta[ZONAS[zona[i]]] = (cuenta[ZONAS[zona[i]]] || 0) + 1;
  const total = Object.values(cuenta).reduce((a, b) => a + b, 0);
  for (const z of ZONAS) console.log(`  ${z.padEnd(11)} ${String(cuenta[z] || 0).padStart(8)} px  ${(((cuenta[z] || 0) / total) * 100).toFixed(1)}%`);
  const huecos = Array.from(zona).filter((v, i) => v === SIN && !fondo[i]).length;
  console.log(`  ${'sin zona'.padEnd(11)} ${String(huecos).padStart(8)} px`);

  // Vista plana para revisar el reparto.
  const PRUEBA = { marco: [40, 40, 44], muro: [214, 208, 220], piso: [150, 150, 156],
    cubierta: [240, 232, 218], backsplash: [255, 120, 120], gabinete: [199, 147, 114], negro: [30, 30, 32] };
  const vis = Buffer.alloc(W * H * 3, 250);
  for (let i = 0; i < W * H; i++) {
    if (zona[i] === SIN) continue;
    const c = PRUEBA[ZONAS[zona[i]]];
    vis[i * 3] = c[0]; vis[i * 3 + 1] = c[1]; vis[i * 3 + 2] = c[2];
  }
  const b = await sharp(vis, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
  await sharp(b).resize(1500).png().toFile(path.join(D, 'zonas-prueba.png'));
  console.log('\nzonas-prueba.png');
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { construir, luminancia };
