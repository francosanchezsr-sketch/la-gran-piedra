/**
 * Normaliza los cuatro isométricos de fachada que vienen del render
 * (`visuales/fachada/*.png`) a un set coherente para la UI del paso 2.
 *
 * Los originales llegan recortados sobre transparencia, pero con encuadres y
 * escalas distintas: puestos uno junto a otro se leen como cuatro capturas
 * sueltas, no como un catálogo. Aquí se les da el mismo margen y el mismo
 * lienzo cuadrado, para que lo único que cambie entre tarjeta y tarjeta sea la
 * casa. La transparencia se conserva: la maqueta se apoya en el fondo de la
 * tarjeta, igual que los iconos de zona.
 *
 * Encima va el zócalo: una franja gris oscuro en la base de cada volumen. Sin
 * ella la maqueta blanca sobre tarjeta blanca no tiene dónde apoyarse y flota;
 * con ella los cuatro estilos comparten el mismo remate abajo y la fila se lee
 * como un catálogo. Ver `zocalo()`.
 *
 * Salen dos tamaños por estilo. El grande es el render tal cual, para la
 * tarjeta de foco. El chico (`-mini`) es otro dibujo, no el mismo achicado: a
 * 30 px una maqueta blanca sobre placa blanca desaparece, así que va con menos
 * aire y con las líneas oscurecidas para que el volumen todavía se lea.
 *
 *   node scripts/fachadas-iso.js
 */
const sharp = require('sharp');
const path = require('path');

const ORIGEN = path.join(__dirname, '..', '..', 'visuales', 'fachada');
const DESTINO = path.join(__dirname, '..', 'public', 'fachadas');

// Aire alrededor de la casa, en proporción a su lado mayor.
const MARGEN = 0.14;
const LADO = 640;
// La miniatura pelea contra 30 px: casi todo el aire se va, y el contraste
// sube para que la línea del canto no se disuelva en el blanco de la placa.
const MARGEN_MINI = 0.03;
const LADO_MINI = 128;
const CONTRASTE_MINI = 1.75;

// Zócalo: la franja gris oscuro que se le pinta a la maqueta en la base, para
// que el volumen blanco se apoye en algo y no flote sobre la tarjeta. Va como
// color plano —no como sombreado sobre el dibujo— y llega hasta la última
// fila de píxel de la silueta: si se queda un pelo arriba, el antialias del
// contorno deja un filo claro y el zócalo se lee despegado del canto.
// Alto en proporción al lienzo; en la miniatura va proporcionalmente más
// gruesa, porque a 30 px un zócalo "a escala" se pierde.
const ZOCALO = { alto: 0.026, gris: [92, 94, 96] };
const ZOCALO_MINI = { alto: 0.045, gris: [74, 76, 78] };

// Los nombres del render no son las claves del configurador (ver FACHADAS en
// lib/data.ts): 'piedra' es el moderno y 'negro' el mediterráneo.
const MAPA = [
  ['escandinavo', 'esc'],
  ['farm', 'farm'],
  ['moderno', 'piedra'],
  ['mediterraneo', 'negro'],
];

/**
 * Pinta el zócalo sobre un buffer RGBA crudo, in place.
 *
 * La base no es una sola línea: garage, pórtico y casa se apoyan a distintas
 * profundidades del isométrico, así que la franja se calcula columna por
 * columna sobre el canto inferior de la silueta.
 *
 * El único caso que hay que descartar son los aleros volados: en las columnas
 * donde el techo sobresale del muro, el píxel más bajo es el filo del alero,
 * no un apoyo, y pintarlo deja una raya oscura colgando bajo el techo. Se
 * detectan cortando el canto en tramos donde pega un brinco y descartando los
 * que quedan por encima de todos sus vecinos: un volumen que toca el suelo
 * nunca cuelga por arriba de lo que tiene a los lados.
 */
function zocalo(data, info, { alto, gris }) {
  const { width: W, height: H, channels: C } = info;
  const h = Math.max(2, Math.round(H * alto));
  const SALTO = Math.max(3, Math.round(h * 0.35));

  // Dos cantos por columna: el opaco manda para medir dónde se apoya cada
  // volumen (el antialias es demasiado ruidoso para eso), y el translúcido
  // marca hasta dónde hay que bajar el relleno para no dejar filo claro.
  const canto = new Int32Array(W).fill(-1);
  const pie = new Int32Array(W).fill(-1);
  for (let x = 0; x < W; x++) {
    for (let y = H - 1; y >= 0; y--) {
      const a = data[(y * W + x) * C + 3];
      if (pie[x] < 0 && a >= 24) pie[x] = y;
      if (a >= 128) { canto[x] = y; break; }
    }
  }

  const tramos = [];
  let ini = -1;
  for (let x = 0; x < W; x++) {
    const corta = canto[x] < 0 || (ini >= 0 && Math.abs(canto[x] - canto[x - 1]) > SALTO);
    if (corta && ini >= 0) { tramos.push([ini, x - 1]); ini = -1; }
    if (canto[x] >= 0 && ini < 0) ini = x;
  }
  if (ini >= 0) tramos.push([ini, W - 1]);

  const altura = tramos.map(([a, b]) => {
    let suma = 0;
    for (let x = a; x <= b; x++) suma += canto[x];
    return suma / (b - a + 1);
  });

  tramos.forEach(([a, b], k) => {
    const vecinos = [altura[k - 1], altura[k + 1]].filter((v) => v !== undefined);
    // En pantalla "más abajo" es y mayor: el tramo cuelga si todos sus vecinos
    // bajan más que él.
    if (vecinos.length && vecinos.every((v) => v > altura[k] + h)) return;

    for (let x = a; x <= b; x++) {
      const abajo = Math.max(pie[x], canto[x]);
      for (let y = abajo; y > canto[x] - h && y >= 0; y--) {
        const i = (y * W + x) * C;
        if (data[i + 3] < 24) continue;
        // Solo el color: el alfa se respeta para no comerse el borde suave.
        for (let ch = 0; ch < 3; ch++) data[i + ch] = gris[ch];
      }
    }
  });
}

async function procesar(archivo, clave) {
  const src = path.join(ORIGEN, `${archivo}.png`);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  // El encuadre se calcula con el volumen construido (lo opaco y claro), no
  // con la sombra — si la sombra entra en el cálculo, la casa se descentra
  // hacia el lado contrario al sol.
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      if (data[i + 3] > 200 && data[i] > 200 && data[i + 1] > 200 && data[i + 2] > 200) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) throw new Error(`Sin volumen detectable en ${archivo}`);

  const cx = Math.round((x0 + x1) / 2);
  const cy = Math.round((y0 + y1) / 2);
  const casa = Math.max(x1 - x0 + 1, y1 - y0 + 1);

  // Lienzo cuadrado centrado en la casa, con el mismo aire en los cuatro.
  const recorte = async (margen, destino) => {
    const lado = Math.round(casa * (1 + margen * 2));
    const izq = Math.round(cx - lado / 2);
    const arr = Math.round(cy - lado / 2);

    // En dos pasadas: sharp aplica `extend` después de `extract`, así que el
    // recorte tiene que ver el lienzo ya crecido.
    const crecido = await sharp(data, { raw: { width: W, height: H, channels: C } })
      .extend({
        // El recorte puede salirse del original; lo que falte se rellena con
        // transparencia, no con negro.
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

  const grande = await (await recorte(MARGEN, LADO)).raw().toBuffer({ resolveWithObject: true });
  zocalo(grande.data, grande.info, ZOCALO);
  await sharp(grande.data, { raw: grande.info })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(path.join(DESTINO, `${clave}.webp`));

  // El contraste se sube a mano sobre el píxel y no con `linear()`, que también
  // tocaría el alfa y le comería el borde a la maqueta. El blanco se queda en
  // blanco: solo se oscurece lo que ya era gris.
  const mini = await (await recorte(MARGEN_MINI, LADO_MINI)).raw().toBuffer({ resolveWithObject: true });
  for (let p = 0; p < mini.info.width * mini.info.height; p++) {
    const i = p * mini.info.channels;
    for (let ch = 0; ch < 3; ch++) {
      mini.data[i + ch] = Math.max(0, Math.round(255 - (255 - mini.data[i + ch]) * CONTRASTE_MINI));
    }
  }
  zocalo(mini.data, mini.info, ZOCALO_MINI);
  await sharp(mini.data, { raw: mini.info })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(path.join(DESTINO, `${clave}-mini.webp`));

  console.log(`${archivo} → ${clave}.webp + ${clave}-mini.webp  (caja ${x1 - x0 + 1}×${y1 - y0 + 1})`);
}

if (require.main === module) {
  (async () => {
    for (const [archivo, clave] of MAPA) await procesar(archivo, clave);
  })();
}

// Se exporta para el pipeline de Higgsfield (`scripts/fachadas-hd.js`), que
// necesita el mismo zócalo pero sobre el render en resolución nativa.
module.exports = { zocalo, ZOCALO, ZOCALO_MINI, MARGEN, LADO, MAPA };
