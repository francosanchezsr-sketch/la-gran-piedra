// Renderiza el sprite con las 6 paletas y sus dos variantes.
// Uso: node scripts/render-paletas.js

const sharp = require('sharp');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'cocina');
const BASE = path.join(DIR, 'base.webp');
const SALIDA = path.join(DIR, 'render');

const ZONAS = ['muros', 'backsplash', 'piso', 'countertop', 'gabinetes'];

// gabinetes = cabinetUpper y cabinetLower, que siempre van del mismo color.
const P = [
  ['1-oliva-roble', 'Verde Oliva + Roble', 'A Roble Claro',
    { gabinetes: '#909383', countertop: '#D4C5B9', piso: '#CBB198', backsplash: '#F5F3F0', muros: '#FAFAF8' },
    'B Travertino Crudo',
    { gabinetes: '#909383', countertop: '#D8D2C4', piso: '#D8D2C4', backsplash: '#E8E2D6', muros: '#FAFAF8' }],
  ['2-gris-marmol', 'Gris + Mármol Blanco', 'A Mármol Blanco',
    { gabinetes: '#B3B1AF', countertop: '#E6E4E5', piso: '#E6E4E5', backsplash: '#F2F0F1', muros: '#FAFAF8' },
    'B Concreto Pulido',
    { gabinetes: '#B3B1AF', countertop: '#E0DEDD', piso: '#DCDAD8', backsplash: '#F0EEEC', muros: '#FAFAF8' }],
  ['3-blanco-marmol-roble', 'Blanco + Mármol + Roble', 'A Roble Claro',
    { gabinetes: '#F7F5F6', countertop: '#E8E6E7', piso: '#CAAF93', backsplash: '#F2F0F1', muros: '#FAFAF8' },
    'B Calacatta Claro',
    { gabinetes: '#F7F5F6', countertop: '#E8E6E7', piso: '#E5E3E4', backsplash: '#F2F0F1', muros: '#FAFAF8' }],
  ['4-negro-nogal', 'Negro + Madera Nogal', 'A Nogal Medio',
    { gabinetes: '#222021', countertop: '#8B6F47', piso: '#7C5C46', backsplash: '#3A3835', muros: '#E8E6E4' },
    'B Basalto/Grafito',
    { gabinetes: '#222021', countertop: '#3A3835', piso: '#3A3835', backsplash: '#4A4844', muros: '#E8E6E4' }],
  ['5-greige-maple', 'Greige + Maple + Mármol', 'A Maple Claro',
    { gabinetes: '#DBD1C6', countertop: '#E9E7E8', piso: '#CEB093', backsplash: '#F2F0EE', muros: '#FAFAF8' },
    'B Travertino Greige',
    { gabinetes: '#DBD1C6', countertop: '#E0D8CC', piso: '#E0D8CC', backsplash: '#EEEAE5', muros: '#FAFAF8' }],
  ['6-azul-roble', 'Azul Oscuro + Roble', 'A Roble Medio-Cálido',
    { gabinetes: '#2C3952', countertop: '#D4C5B9', piso: '#8D7062', backsplash: '#F5F3F0', muros: '#E8E6E4' },
    'B Concreto Gris Cálido',
    { gabinetes: '#2C3952', countertop: '#B8B0A4', piso: '#B8B0A4', backsplash: '#D4CCB8', muros: '#E8E6E4' }],
];

async function pintar(colores, archivo, width, height) {
  const capas = [];
  for (const zona of ZONAS) {
    const color = colores[zona];
    if (!color) continue;
    const mascara = await sharp(path.join(DIR, `mask-${zona}.png`))
      .resize(width, height).greyscale().raw().toBuffer();
    const capa = await sharp({ create: { width, height, channels: 3, background: color } })
      .joinChannel(mascara, { raw: { width, height, channels: 1 } })
      .png().toBuffer();
    capas.push({ input: capa, blend: 'multiply' });
  }
  await sharp(BASE).composite(capas).png({ compressionLevel: 9 }).toFile(path.join(SALIDA, archivo));
}

async function main() {
  const fs = require('fs');
  fs.mkdirSync(SALIDA, { recursive: true });
  const { width, height } = await sharp(BASE).metadata();
  for (const [slug, nombre, nA, cA, nB, cB] of P) {
    await pintar(cA, `${slug}-A.png`, width, height);
    await pintar(cB, `${slug}-B.png`, width, height);
    console.log(`  ${nombre}  ->  ${slug}-A.png (${nA}) · ${slug}-B.png (${nB})`);
  }
  console.log(`\n12 renders en public/cocina/render/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
