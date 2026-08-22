// Versión de panel de los sprites de paleta.
//
// El sprite que deja `colorLGP` mide 1600px porque es el archivo maestro para
// web. El configurador lo enseña en un panel de ~460px, así que a 2x le basta
// con 900: servir el de 1600 en los seis manda 1.1 MB al paso 4 para dibujar
// medio megapíxel. Aquí se saca la versión que realmente se descarga.
//
//   node scripts/cocina/panel.js
//
// Se vuelve a correr cuando `colorLGP` regenere cualquier sprite.

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PALETAS } = require('./paletas.js');

const DIR = path.join(__dirname, '..', '..', 'public', 'cocina', 'paletas');
const ANCHO = 900;

(async () => {
  for (const p of PALETAS) {
    const origen = path.join(DIR, `cocina-${p.slug}.webp`);
    if (!fs.existsSync(origen)) {
      console.warn(`falta ${path.basename(origen)} — se salta`);
      continue;
    }
    const destino = path.join(DIR, `panel-${p.slug}.webp`);
    await sharp(origen).resize({ width: ANCHO }).webp({ quality: 82 }).toFile(destino);
    const kb = Math.round(fs.statSync(destino).size / 1024);
    console.log(`panel-${p.slug}.webp — ${kb} KB`);
  }
})();
