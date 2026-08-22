/**
 * Genera `public/textura-cubos.svg`: la misma retícula isométrica de cubos que
 * el canvas del fondo de la página, pero estática y en un mosaico que repite.
 *
 * Se genera y no se dibuja a mano por una razón concreta: los números tienen que
 * salir del canvas, no parecerse a los del canvas. Si el fondo cambia de escala
 * o de color, se corrige aquí y las dos superficies siguen siendo la misma
 * textura. Escritas a mano, divergen en cuanto alguien toque una de las dos.
 *
 *   node scripts/textura-cubos.js
 */
const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

// --- Los mismos valores que `HomeConfigurator.tsx` usa en el canvas ---------
const S = 46;
const W = S * Math.cos(Math.PI / 6);
const PAPEL = [251, 251, 250]; // #FBFBFA, el lienzo de la página
const ALFA = 0.42; // `globalAlpha` del canvas
const CARAS = [
  { rgb: [255, 255, 255] }, // tapa
  { rgb: [238, 238, 238] }, // cara izquierda
  { rgb: [229, 229, 229] }, // cara derecha
];

// El canvas pinta con alfa sobre el papel. Aquí no hay alfa que aplicar en
// tiempo real, así que se compone ahora y el SVG sale con el color final.
const componer = (rgb) =>
  '#' +
  rgb
    .map((c, i) => Math.round(c * ALFA + PAPEL[i] * (1 - ALFA)).toString(16).padStart(2, '0'))
    .join('');

// Geometría de un cubo centrado en (0,0), en el mismo orden que el canvas.
const caras = (cx, cy) => [
  [[cx, cy - S], [cx + W, cy - S / 2], [cx, cy], [cx - W, cy - S / 2]],
  [[cx - W, cy - S / 2], [cx, cy], [cx, cy + S], [cx - W, cy + S / 2]],
  [[cx + W, cy - S / 2], [cx, cy], [cx, cy + S], [cx + W, cy + S / 2]],
];

const dx = 2 * W;
const dy = 1.5 * S;
// El mosaico tiene que abarcar dos filas: las impares van desplazadas media
// celda, así que con una sola fila el patrón no cerraría al repetirse.
const anchoMosaico = dx;
const altoMosaico = 2 * dy;

const n = (v) => Math.round(v * 1000) / 1000;

let cuerpo = '';
// Se dibuja un vecindario mayor que el mosaico y se recorta con el viewBox: los
// cubos del borde tienen que entrar cortados para que al repetir encajen.
for (let f = -2; f <= 3; f++) {
  for (let c = -2; c <= 3; c++) {
    const cx = c * dx + (Math.abs(f % 2) ? W : 0);
    const cy = f * dy;
    caras(cx, cy).forEach((pts, i) => {
      const d = pts.map((p) => `${n(p[0])},${n(p[1])}`).join(' ');
      cuerpo += `    <polygon points="${d}" fill="${componer(CARAS[i].rgb)}"/>\n`;
    });
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n(anchoMosaico)}" height="${n(altoMosaico)}" viewBox="0 0 ${n(anchoMosaico)} ${n(altoMosaico)}">
  <rect width="100%" height="100%" fill="#fbfbfa"/>
  <g shape-rendering="crispEdges">
${cuerpo}  </g>
</svg>
`;

const salida = join(__dirname, '..', 'public', 'textura-cubos.svg');
writeFileSync(salida, svg);
console.log(`escrito ${salida}`);
console.log(`mosaico ${n(anchoMosaico)} x ${n(altoMosaico)} px`);
console.log('caras:', CARAS.map((c) => componer(c.rgb)).join(' '));
