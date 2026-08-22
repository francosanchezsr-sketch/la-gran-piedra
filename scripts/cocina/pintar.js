// Pinta el sprite isométrico de cocina con una paleta, a color sólido.
//
// El método NO es teñir por transparencia. Multiplicar un color sobre el dibujo
// en blanco deja todo lavado y con el gris del papel asomando — que es justo lo
// que se veía en los renders anteriores. Aquí se hace al revés: el dibujo
// aporta únicamente la FORMA de la luz, y el color lo pone el material.
//
// Para cada píxel se toma su claridad perceptual en el sprite (Lp), se le resta
// la claridad del plano dominante de su zona (La) y esa diferencia se suma
// sobre la claridad del material (L0), todo en OKLab:
//
//     L_salida = L0 + GANANCIA * (Lp - La)
//
// En OKLab y no en HSL porque bajarle luz a un nogal en HSL lo manda al morado,
// y este dibujo es casi todo sombra. La diferencia se recorta entre un suelo y
// un techo relativos al propio material: el suelo impide que las líneas del
// trazo caigan a negro —quedan como madera oscura, igual que en la versión a
// color— y el techo impide que los brillos se quemen a blanco. El resultado es
// color sólido en todos lados: no queda un solo píxel sin material.
//
// Encima van dos texturas que el sprite en blanco no trae y la versión a color
// sí: las juntas de loseta del piso y el veteado de la piedra.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { ZONAS, PENDIENTE } = require('./zonas');
const { PALETAS, FIJOS, VETEADOS } = require('./paletas');
const { construir, luminancia } = require('./mapa-zonas');
const { hexAOklab, oklabARgb, rgbAOklab } = require('./color');

const ORIGEN = path.join(__dirname, '..', '..', '..', 'visuales', 'cocina en blanco.png');
const DESTINO = path.join(__dirname, '..', '..', 'public', 'cocina', 'paletas');

const SUELO = 0.34;   // el trazo no baja de L0*0.34 — nunca llega a negro
const TECHO = 0.42;   // ni el brillo sube mas de L0+0.42

// Cuánto del claroscuro del sprite se traslada, por zona. Uno es "tal cual".
// El piso va a la mitad a propósito: el dibujo trae sombras duras de las
// lámparas que la versión a color no tiene, y a plena ganancia se pelean con
// las juntas de la loseta. Se bajan sin apagarlas — el piso sigue leyendo con
// luz, que es lo que se pidió.
const GANANCIA = { gabinete: 1.0, cubierta: 1.0, backsplash: 0.9, piso: 0.5, muro: 1.0, marco: 1.0, negro: 0.9 };

// Rejilla de loseta del piso. Isométrico real, así que las dos familias de
// juntas llevan pendiente +/- tan(30 grados). El paso se mide en horizontal.
const LOSETA = { paso: 430, grosor: 5.5, suavizado: 2.4, oscurecer: 0.075, ancla: [1200, 1600] };

// Duela de madera, para las paletas cuyo piso no es loseta. La diferencia con
// la loseta no es el color: es que la tabla solo tiene junta corrida en UNA de
// las dos direcciones del isométrico —la larga— y en la otra lleva topes
// cortos, escalonados tabla por tabla. Sin ese escalonado se lee como cuadrícula
// otra vez. Encima va un grano fino, estirado a lo largo de la tabla.
const DUELA = {
  ancho: 168,        // ancho de tabla, medido en horizontal
  largo: 1450,       // largo de tabla
  grosor: 4.0,
  suavizado: 2.2,
  oscurecer: 0.055,
  tope: 0.040,       // los topes marcan menos que la junta corrida
  grano: 0.026,
  escalaGrano: 0.055,
};

// El backsplash del sprite es loseta en espiga; en la versión a color es una
// losa corrida de piedra. En vez de borrar la espiga a mano se aplana: dentro
// de esa zona no se usa la luminancia del dibujo sino una versión desenfocada
// de ella, así que el detalle de las celdas desaparece y sobrevive solo el
// degradado general de luz. Encima entra el veteado y queda la losa.
const DESENFOQUE_LOSA = 17;

// --- ruido de valor, para el veteado ----------------------------------------
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
function ruido(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  const arriba = a + (b - a) * sx;
  const abajo = c + (d - c) * sx;
  return arriba + (abajo - arriba) * sy;
}
function turbulencia(x, y, octavas) {
  let v = 0, amp = 1, f = 1, norma = 0;
  for (let o = 0; o < octavas; o++) { v += amp * ruido(x * f, y * f); norma += amp; amp *= 0.5; f *= 2; }
  return v / norma;
}

// Claridad OKLab de un gris 0..255. Se cachea: son 256 valores y se piden
// millones de veces.
const L_GRIS = new Float32Array(256);
for (let i = 0; i < 256; i++) L_GRIS[i] = rgbAOklab(i, i, i)[0];

// Aplana una zona: caja acotada, todo lo de fuera puesto al valor medio de la
// zona para que no le sangre el vecino, y dos pasadas de caja móvil (que es un
// gaussiano suficientemente bueno y cuesta O(n)).
function aplanarZona(lum, zona, W, H, zi, radio) {
  let x0 = W, y0 = H, x1 = 0, y1 = 0, suma = 0, n = 0;
  for (let i = 0; i < W * H; i++) {
    if (zona[i] !== zi) continue;
    const x = i % W, y = (i / W) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
    suma += lum[i]; n++;
  }
  if (!n) return null;
  const media = suma / n;
  x0 = Math.max(0, x0 - radio * 2); y0 = Math.max(0, y0 - radio * 2);
  x1 = Math.min(W - 1, x1 + radio * 2); y1 = Math.min(H - 1, y1 + radio * 2);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  let buf = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y0 + y) * W + (x0 + x);
      buf[y * w + x] = zona[i] === zi ? lum[i] : media;
    }
  const tmp = new Float32Array(w * h);
  for (let pasada = 0; pasada < 2; pasada++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let x = -radio; x <= radio; x++) acc += buf[y * w + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[y * w + x] = acc / (radio * 2 + 1);
        acc += buf[y * w + Math.min(w - 1, x + radio + 1)] - buf[y * w + Math.max(0, x - radio)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -radio; y <= radio; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        buf[y * w + x] = acc / (radio * 2 + 1);
        acc += tmp[Math.min(h - 1, y + radio + 1) * w + x] - tmp[Math.max(0, y - radio) * w + x];
      }
    }
  }
  const plano = new Float32Array(W * H);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) plano[(y0 + y) * W + (x0 + x)] = buf[y * w + x];
  return plano;
}

function anclasPorZona(zona, lum, N) {
  const ancla = {};
  for (const z of ZONAS) {
    const zi = ZONAS.indexOf(z);
    const vals = [];
    for (let i = 0; i < N; i += 3) if (zona[i] === zi) vals.push(lum[i]);
    if (!vals.length) { ancla[z] = 200; continue; }
    vals.sort((a, b) => a - b);
    ancla[z] = vals[Math.floor(vals.length / 2)];
  }
  return ancla;
}

function pintar(paleta, mapa, lum, origen, canales, ancla, losa) {
  const duela = paleta.suelo === 'duela';
  const { zona, W, H, fondo } = mapa;
  const N = W * H;
  const colores = Object.assign({}, FIJOS, paleta.colores);

  const base = {};
  for (const z of ZONAS) {
    const oklab = hexAOklab(colores[z]);
    base[z] = {
      L0: oklab[0], a0: oklab[1], b0: oklab[2],
      La: L_GRIS[Math.round(ancla[z])],
      suelo: oklab[0] * SUELO,
      techo: Math.min(0.985, oklab[0] + TECHO),
    };
  }

  const veta = VETEADOS[paleta.piedra] || VETEADOS.ninguna;
  const zPiso = ZONAS.indexOf('piso');
  const zCubierta = ZONAS.indexOf('cubierta');
  const zBacksplash = ZONAS.indexOf('backsplash');
  const cA = LOSETA.ancla[1] + PENDIENTE * LOSETA.ancla[0];
  const cB = LOSETA.ancla[1] - PENDIENTE * LOSETA.ancla[0];
  const pasoY = LOSETA.paso * PENDIENTE;   // separación medida en vertical

  const salida = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    const oo = i * canales;
    if (fondo[i] || zona[i] === 255) {
      // Fuera de la maqueta se conserva tal cual: la sombra proyectada y la
      // transparencia del original.
      salida[o] = origen[oo]; salida[o + 1] = origen[oo + 1]; salida[o + 2] = origen[oo + 2];
      salida[o + 3] = canales === 4 ? origen[oo + 3] : 255;
      continue;
    }
    const z = zona[i];
    const nombre = ZONAS[z];
    const m = base[nombre];
    const crudo = z === zBacksplash && losa ? losa[i] : lum[i];
    const Lp = L_GRIS[Math.max(0, Math.min(255, Math.round(crudo)))];
    let L = m.L0 + GANANCIA[nombre] * (Lp - m.La);
    let kv = 1;

    const x = i % W, y = (i / W) | 0;

    if (z === zPiso && duela) {
      // Coordenadas del plano del piso: u cruza las tablas, v corre a lo largo.
      const u = (y + PENDIENTE * x - cA);
      const v = (y - PENDIENTE * x - cB);
      const anchoY = DUELA.ancho * PENDIENTE;
      const largoY = DUELA.largo * PENDIENTE;
      const banda = Math.floor(u / anchoY);

      let du = (u / anchoY) % 1; if (du < 0) du += 1;
      const dJunta = Math.min(du, 1 - du) * anchoY;
      const tJunta = 1 - Math.min(1, Math.max(0, (dJunta - DUELA.grosor / 2) / DUELA.suavizado));
      if (tJunta > 0) L -= DUELA.oscurecer * tJunta;

      // Topes: cada tabla arranca en un punto distinto, si no salen alineados.
      const desfase = hash2(banda, 7717) * largoY;
      let dv = ((v - desfase) / largoY) % 1; if (dv < 0) dv += 1;
      const dTope = Math.min(dv, 1 - dv) * largoY;
      const tTope = 1 - Math.min(1, Math.max(0, (dTope - DUELA.grosor / 2) / DUELA.suavizado));
      if (tTope > 0) L -= DUELA.tope * tTope;

      // Grano: ruido comprimido a lo ancho y estirado a lo largo.
      const g = turbulencia(u * DUELA.escalaGrano, v * DUELA.escalaGrano * 0.06 + banda * 13.7, 3);
      L += DUELA.grano * (g - 0.5);
    }

    if (z === zPiso && !duela && LOSETA.oscurecer > 0) {
      // Distancia a la junta más cercana de cada familia, en vertical.
      let dA = ((y + PENDIENTE * x - cA) / pasoY) % 1; if (dA < 0) dA += 1;
      let dB = ((y - PENDIENTE * x - cB) / pasoY) % 1; if (dB < 0) dB += 1;
      const a = Math.min(dA, 1 - dA) * pasoY;
      const b = Math.min(dB, 1 - dB) * pasoY;
      const d = Math.min(a, b);
      const t = 1 - Math.min(1, Math.max(0, (d - LOSETA.grosor / 2) / LOSETA.suavizado));
      if (t > 0) L -= LOSETA.oscurecer * t;
    }

    if ((z === zCubierta || z === zBacksplash) && veta.tono !== 0) {
      // Mármol: turbulencia metida dentro de un seno. El seno da bandas
      // paralelas y el ruido se las retuerce hasta que serpentean.
      const t = turbulencia(x * veta.escalaRuido, y * veta.escalaRuido, 4);
      const v = Math.sin((x + y * 0.62) * veta.escalaVena + t * veta.turbulencia * Math.PI);
      const fuerza = Math.pow(Math.abs(v), veta.nitidez);
      L += veta.tono * fuerza + veta.grano * (t - 0.5);
      kv = 1 - 0.3 * fuerza;
    }

    L = Math.max(m.suelo, Math.min(m.techo, L));
    // La croma sube un poco en sombra y baja en el brillo, como en un material
    // real; si no, las sombras salen grises y los brillos saturados.
    const k = Math.max(0.45, Math.min(1.18, 1 + 0.19 * (m.La - Lp)));
    const rgb = oklabARgb(L, m.a0 * k * kv, m.b0 * k * kv);
    salida[o] = rgb[0]; salida[o + 1] = rgb[1]; salida[o + 2] = rgb[2];
    salida[o + 3] = 255;
  }
  return salida;
}

async function main() {
  fs.mkdirSync(DESTINO, { recursive: true });
  const { lum, W, H } = await luminancia();
  const mapa = construir(lum);
  const leido = await sharp(ORIGEN).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ancla = anclasPorZona(mapa.zona, lum, W * H);
  const losa = aplanarZona(lum, mapa.zona, W, H, ZONAS.indexOf('backsplash'), DESENFOQUE_LOSA);

  const soloEste = process.argv[2];
  for (const paleta of PALETAS) {
    if (soloEste && paleta.slug !== soloEste) continue;
    const px = pintar(paleta, mapa, lum, leido.data, leido.info.channels, ancla, losa);
    const crudo = { raw: { width: W, height: H, channels: 4 } };
    const nombre = `${paleta.id}-${paleta.slug}`;
    await sharp(px, crudo).png({ compressionLevel: 9 }).toFile(path.join(DESTINO, `${nombre}.png`));
    await sharp(px, crudo).resize(1400).webp({ quality: 90 }).toFile(path.join(DESTINO, `${nombre}.webp`));
    console.log(`  ${paleta.nombre.padEnd(24)} -> ${nombre}.png + .webp`);
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { pintar, anclasPorZona };
