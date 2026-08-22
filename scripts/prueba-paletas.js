// Prueba visual: pinta el sprite con una paleta y guarda el resultado como
// imagen. No toca la app — es solo para ver si la técnica convence antes de
// invertir en la UI.
//
// El color se aplica en 'multiply' a través de la máscara de su zona: el tono
// tiñe la superficie pero las líneas, las sombras y el patrón del backsplash
// siguen viéndose debajo. Pintar con opacidad plana los borraría.
//
// Uso: node scripts/prueba-paletas.js

const sharp = require('sharp');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'cocina');
const BASE = path.join(DIR, 'base.webp');

// De atrás hacia adelante: los muros primero, los muebles al final. Con
// 'multiply' el orden casi no importa, pero así se lee igual que se construye.
const ZONAS_LISTAS = ['muros', 'backsplash', 'piso', 'countertop', 'gabinetes'];

const PRUEBAS = [
  {
    archivo: '_prueba-1-oliva-roble.png',
    nombre: 'Verde Oliva + Roble Claro',
    colores: { gabinetes: '#909383', countertop: '#D4C5B9', piso: '#CBB198', backsplash: '#F5F3F0', muros: '#FAFAF8' },
  },
  {
    archivo: '_prueba-4-negro-nogal.png',
    nombre: 'Negro + Nogal Medio',
    colores: { gabinetes: '#222021', countertop: '#8B6F47', piso: '#7C5C46', backsplash: '#3A3835', muros: '#E8E6E4' },
  },
  {
    archivo: '_prueba-6-azul-roble.png',
    nombre: 'Azul Oscuro + Roble Medio',
    colores: { gabinetes: '#2C3952', countertop: '#D4C5B9', piso: '#8D7062', backsplash: '#F5F3F0', muros: '#E8E6E4' },
  },
];

async function pintar(prueba, width, height) {
  const capas = [];
  for (const zona of ZONAS_LISTAS) {
    const color = prueba.colores[zona];
    if (!color) continue;
    // La máscara tiene que entrar como CANAL ALFA, no como imagen compuesta.
    // Un PNG en gris se carga con alfa 255 en todo el lienzo, así que
    // recortarlo con 'dest-in' no recorta nada y el color acaba multiplicando
    // la lámina entera. `joinChannel` sí la pega como transparencia.
    const mascara = await sharp(path.join(DIR, `mask-${zona}.png`))
      .resize(width, height)
      .greyscale()
      .raw()
      .toBuffer();
    const capa = await sharp({ create: { width, height, channels: 3, background: color } })
      .joinChannel(mascara, { raw: { width, height, channels: 1 } })
      .png()
      .toBuffer();
    capas.push({ input: capa, blend: 'multiply' });
  }

  await sharp(BASE)
    .composite(capas)
    .png({ compressionLevel: 9 })
    .toFile(path.join(DIR, prueba.archivo));
  console.log(`  ${prueba.nombre} -> ${prueba.archivo}`);
}

async function main() {
  const { width, height } = await sharp(BASE).metadata();
  console.log(`Lienzo ${width}x${height}. Pintando ${ZONAS_LISTAS.join(', ')}.`);
  console.log('Backsplash y muros quedan sin pintar: sus máscaras todavía no sirven.\n');
  for (const p of PRUEBAS) await pintar(p, width, height);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
