/**
 * Segunda vuelta de los isométricos de fachada: toma el re-render de calidad
 * que sale de Higgsfield (`nano_banana_pro`, 4800×3584, fondo blanco) y lo
 * convierte en el sprite que consume el paso 2 del configurador.
 *
 * El paso previo (`fachadas-iso.js`) sigue siendo el que define el encuadre y
 * el zócalo sobre el render original del cliente; ese resultado es el que se le
 * manda a Higgsfield como referencia. Aquí ya no se pinta nada: el zócalo viene
 * dibujado dentro del render, así que el trabajo es recortar el fondo y
 * normalizar lienzo y tamaños con los mismos números que la primera vuelta,
 * para que los cuatro estilos sigan siendo comparables entre sí.
 *
 * El ciclo completo, de principio a fin:
 *
 *   node scripts/fachadas-iso.js                  # sprite base + zócalo
 *   node scripts/fachadas-hd.js ref <carpeta>     # referencias para Higgsfield
 *   ... generar en Higgsfield (ver abajo) ...
 *   node scripts/fachadas-hd.js <render.png> <clave>
 *
 * Los renders crudos de Higgsfield se guardan en `visuales/fachada/hd/*.webp`
 * (webp sin pérdida, idéntico al png original) para poder volver a recortar sin
 * volver a generar. La generación va con `nano_banana_pro`, `4:3`, `4k`, una
 * sola referencia, y el prompt tiene que hacer tres cosas o el sprite no sirve:
 * enumerar pieza por pieza la geometría que no se toca, exigir el zócalo
 * charcoal #5C5E60 en la base de cada volumen, y prohibir explícitamente la
 * sombra proyectada — la referencia trae una y el modelo la copia si no se le
 * dice que no. Sin fondo blanco limpio el recorte de abajo no tiene de dónde
 * agarrarse.
 *
 * El recorte del fondo se hace inundando desde las cuatro esquinas sobre lo
 * casi-blanco. Funciona porque la maqueta trae contorno gris en todo su
 * perímetro: la inundación se frena sola en la línea, sin máscara a mano. Si el
 * porcentaje que imprime baja mucho de ~20% es que el render salió con el
 * contorno abierto y hay que repetir la generación, no aflojar el umbral.
 */
const sharp = require('sharp');
const path = require('path');

const DESTINO = path.join(__dirname, '..', 'public', 'fachadas');

// Mismo encuadre que `fachadas-iso.js`: si cambia allá, cambia aquí.
const MARGEN = 0.14;
const LADO = 640;
const MARGEN_MINI = 0.03;
const LADO_MINI = 128;
// Más contraste que en la primera vuelta (allá era 1.75): el re-render trae la
// línea más fina y más clara, y a 30-40 px con 1.75 la maqueta se despinta.
const CONTRASTE_MINI = 3;

// Arriba de esto se considera fondo. El blanco del papel sale en 250-255 y la
// cara más clara de la maqueta ronda 245, así que el margen es estrecho a
// propósito: lo que salva el recorte no es el umbral, es el contorno gris.
const FONDO = 248;

function recortarFondo(data, info) {
  const { width: W, height: H, channels: C } = info;
  const fondo = new Uint8Array(W * H);
  const pila = [];
  const claro = (p) => {
    const i = p * C;
    return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114 >= FONDO;
  };
  const meter = (p) => { if (!fondo[p] && claro(p)) { fondo[p] = 1; pila.push(p); } };

  for (let x = 0; x < W; x++) { meter(x); meter((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { meter(y * W); meter(y * W + W - 1); }

  while (pila.length) {
    const p = pila.pop();
    const x = p % W, y = (p - x) / W;
    if (x > 0) meter(p - 1);
    if (x < W - 1) meter(p + 1);
    if (y > 0) meter(p - W);
    if (y < H - 1) meter(p + W);
  }

  let dentro = 0;
  for (let p = 0; p < W * H; p++) {
    if (fondo[p]) data[p * C + 3] = 0;
    else dentro++;
  }
  return dentro / (W * H);
}

async function procesar(render, clave) {
  const { data, info } = await sharp(render).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pct = recortarFondo(data, info);
  const { width: W, height: H, channels: C } = info;

  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > 128) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error('El recorte se comió la maqueta entera');

  const cx = Math.round((x0 + x1) / 2);
  const cy = Math.round((y0 + y1) / 2);
  const casa = Math.max(x1 - x0 + 1, y1 - y0 + 1);

  const recorte = async (margen, destino) => {
    const lado = Math.round(casa * (1 + margen * 2));
    const izq = Math.round(cx - lado / 2);
    const arr = Math.round(cy - lado / 2);
    const crecido = await sharp(data, { raw: { width: W, height: H, channels: C } })
      .extend({
        top: Math.max(0, -arr),
        left: Math.max(0, -izq),
        bottom: Math.max(0, arr + lado - H),
        right: Math.max(0, izq + lado - W),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    return sharp(crecido)
      .extract({ left: Math.max(0, izq), top: Math.max(0, arr), width: lado, height: lado })
      .resize(destino, destino);
  };

  await (await recorte(MARGEN, LADO))
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(DESTINO, `${clave}.webp`));

  // Igual que en la primera vuelta: el contraste del mini se sube sobre el
  // píxel y no con `linear()`, que también tocaría el alfa.
  const mini = await (await recorte(MARGEN_MINI, LADO_MINI)).raw().toBuffer({ resolveWithObject: true });
  for (let p = 0; p < mini.info.width * mini.info.height; p++) {
    const i = p * mini.info.channels;
    for (let ch = 0; ch < 3; ch++) {
      mini.data[i + ch] = Math.max(0, Math.round(255 - (255 - mini.data[i + ch]) * CONTRASTE_MINI));
    }
  }
  await sharp(mini.data, { raw: mini.info })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(path.join(DESTINO, `${clave}-mini.webp`));

  console.log(`${path.basename(render)} → ${clave}.webp + ${clave}-mini.webp  (maqueta ${(pct * 100).toFixed(1)}% del render, caja ${x1 - x0 + 1}×${y1 - y0 + 1})`);
}

/**
 * Genera las referencias que se le suben a Higgsfield: el render original del
 * cliente con el zócalo ya pintado, aplanado sobre blanco y con un poco de aire
 * alrededor. Se hace en resolución nativa —no reescalando el sprite de 640— para
 * que el modelo tenga de dónde sacar detalle.
 */
async function referencias(destino) {
  const { zocalo, ZOCALO, MARGEN: M, LADO: L, MAPA } = require('./fachadas-iso.js');
  for (const [archivo, clave] of MAPA) {
    const origen = path.join(__dirname, '..', '..', 'visuales', 'fachada', `${archivo}.png`);
    const { data, info } = await sharp(origen).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H, channels: C } = info;

    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * C;
        if (data[i + 3] > 200 && data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    // El zócalo se mide en píxeles del sprite final y se convierte a píxeles del
    // original, para que en la referencia se vea del mismo grosor que en la web.
    const escala = (L / (1 + M * 2)) / Math.max(x1 - x0 + 1, y1 - y0 + 1);
    zocalo(data, info, { alto: Math.round(L * ZOCALO.alto) / escala / H, gris: ZOCALO.gris });

    const salida = path.join(destino, `ref-${clave}.png`);
    await sharp(data, { raw: info })
      .flatten({ background: '#ffffff' })
      .trim({ threshold: 2 })
      .extend({ top: 60, bottom: 60, left: 60, right: 60, background: '#ffffff' })
      .png()
      .toFile(salida);
    console.log(`ref-${clave}.png`);
  }
}

if (require.main === module) {
  const [a, b] = process.argv.slice(2);
  if (a === 'ref') {
    if (!b) { console.error('uso: node scripts/fachadas-hd.js ref <carpeta>'); process.exit(1); }
    referencias(b);
  } else if (a && b) {
    procesar(a, b);
  } else {
    console.error('uso: node scripts/fachadas-hd.js <render.png> <clave>  |  ref <carpeta>');
    process.exit(1);
  }
}
