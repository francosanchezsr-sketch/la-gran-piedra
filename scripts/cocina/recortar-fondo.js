// Deja transparente el fondo de un render, conservando la sombra proyectada
// como alfa en vez de como gris.
//
// El fondo del render viene blanco y la sombra es un gris suave sobre él. Un
// recorte duro dejaría la sombra como una mancha gris pegada a la imagen, que
// solo funciona si el sitio también es blanco. Aquí, en cambio, se inunda desde
// las esquinas —el marco oscuro de la maqueta frena la inundación— y a lo que
// queda fuera se le pone gris neutro con alfa proporcional a lo oscuro que
// estaba. Así la sombra sigue ahí y funciona sobre cualquier fondo.
//
// Con --sin-sombra se descarta también la sombra y queda solo la silueta. Es
// lo que conviene cuando la sombra del render no cuadra con su propia luz: sale
// más barato tirarla y ponerle una en CSS que arrastrar una que apunta al lado
// equivocado.
//
// Uso: node scripts/cocina/recortar-fondo.js entrada.png salida.png [--sin-sombra]

const sharp = require('sharp');

const UMBRAL_FUERA = 150;   // por debajo de esto ya es la maqueta, no el fondo
const BLANCO = 250;         // a partir de aquí el fondo es papel limpio: alfa 0
const GRIS_SOMBRA = 90;     // color de la sombra una vez separada del blanco

async function main() {
  const args = process.argv.slice(2);
  const sinSombra = args.includes('--sin-sombra');
  const [entrada, salida] = args.filter((a) => !a.startsWith('--'));
  if (!entrada || !salida) { console.error('uso: recortar-fondo.js entrada.png salida.png'); process.exit(1); }

  const { data, info } = await sharp(entrada).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const N = W * H;

  const lum = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const o = i * C;
    lum[i] = (data[o] * 299 + data[o + 1] * 587 + data[o + 2] * 114) / 1000;
  }

  const fuera = new Uint8Array(N);
  const pila = new Int32Array(N);
  let tope = 0;
  for (const p of [0, W - 1, (H - 1) * W, H * W - 1]) if (lum[p] >= UMBRAL_FUERA) { fuera[p] = 1; pila[tope++] = p; }
  while (tope) {
    const p = pila[--tope];
    const x = p % W;
    const vec = [];
    if (x > 0) vec.push(p - 1);
    if (x < W - 1) vec.push(p + 1);
    if (p >= W) vec.push(p - W);
    if (p < N - W) vec.push(p + W);
    for (const q of vec) if (!fuera[q] && lum[q] >= UMBRAL_FUERA) { fuera[q] = 1; pila[tope++] = q; }
  }

  const px = Buffer.alloc(N * 4);
  let transparentes = 0, conSombra = 0;
  for (let i = 0; i < N; i++) {
    const o = i * C, d = i * 4;
    if (!fuera[i]) {
      px[d] = data[o]; px[d + 1] = data[o + 1]; px[d + 2] = data[o + 2]; px[d + 3] = 255;
      continue;
    }
    // Fuera: el blanco desaparece del todo, lo oscuro sobrevive como sombra.
    const a = sinSombra ? 0 : Math.max(0, Math.min(255, Math.round((BLANCO - lum[i]) * 1.6)));
    px[d] = GRIS_SOMBRA; px[d + 1] = GRIS_SOMBRA; px[d + 2] = GRIS_SOMBRA + 3; px[d + 3] = a;
    if (a === 0) transparentes++; else conSombra++;
  }

  // Recorte al contenido: el render viene con mucho papel alrededor y el
  // sprite se usa escalado a ancho, así que el margen sobrante desplaza la
  // maqueta dentro de su caja.
  await sharp(px, { raw: { width: W, height: H, channels: 4 } })
    .trim({ threshold: 0 })
    .png({ compressionLevel: 9 })
    .toFile(salida);
  const dentro = N - transparentes - conSombra;
  console.log(`  ${W}x${H} — maqueta ${(dentro / N * 100).toFixed(1)}%, sombra ${(conSombra / N * 100).toFixed(1)}%, transparente ${(transparentes / N * 100).toFixed(1)}%`);
}

main().catch((e) => { console.error(e); process.exit(1); });
