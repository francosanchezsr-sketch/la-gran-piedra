// Renders e iconos que vienen del proyecto de Claude Design, optimizados a
// webp/png chicos. Reemplazan a los diagramas SVG donde existe render real; el
// SVG sigue como respaldo para lo que todavía no tiene imagen.

// Isométricos de cada floorplan. El townhouse del Lote 17 no tiene render
// propio y usa el mismo isométrico de dos pisos que el plan D.
export const RENDER_PLAN: Record<string, string> = {
  TH: '/floorplans/D.webp',
  B: '/floorplans/B.webp',
  C: '/floorplans/C.webp',
  D: '/floorplans/D.webp',
};

// Maquetas isométricas de cada estilo de fachada, normalizadas por
// `scripts/fachadas-iso.js` desde `visuales/fachada/`: mismo lienzo cuadrado,
// mismo margen, fondo transparente y el mismo zócalo gris oscuro en la base,
// para que entre una y otra solo cambie la casa. Reemplazan a los pictogramas de línea, que a cuatro estilos distintos
// les daban cuatro casitas casi iguales.
export const RENDER_FACHADA: Record<string, string> = {
  esc: '/fachadas/esc.webp',
  farm: '/fachadas/farm.webp',
  piedra: '/fachadas/piedra.webp',
  negro: '/fachadas/negro.webp',
};

// Versión para 30–40 px: la misma maqueta con menos aire y más contraste. A ese
// tamaño la grande se disuelve en el blanco de la fila.
export const RENDER_FACHADA_MINI: Record<string, string> = {
  esc: '/fachadas/esc-mini.webp',
  farm: '/fachadas/farm-mini.webp',
  piedra: '/fachadas/piedra-mini.webp',
  negro: '/fachadas/negro-mini.webp',
};

// Iconos de zona. Los que no están aquí siguen usando el squircle SVG.
export const ICONO_ZONA: Record<string, string> = {
  alberca: '/zonas/alberca.png',
  bbq: '/zonas/bbq.png',
  comodin: '/zonas/comodin.png',
  bonus: '/zonas/bonus.png',
  mudroom: '/zonas/mudroom.png',
  office: '/zonas/office.png',
  storage: '/zonas/storage.png',
  sunkenlounge: '/zonas/sunkenlounge.png',
  walkingcloset: '/zonas/walkingcloset.png',
  scullery: '/zonas/scullery.png',
};

// El tragaluz no es una zona del catálogo, es un atributo — por eso va aparte.
export const ICONO_TRAGALUZ = '/zonas/tragaluz.png';

// Maquetas de cocina de cada paleta de interior, una por `key` de `INTERIORES`.
// Salen de `.claude/skills/colorLGP` (recoloreo por zonas → re-render →
// recorte a sprite con alfa) y `scripts/cocina/panel.js` las baja a los 900px
// que el panel realmente dibuja: el maestro de 1600 son 1.1 MB entre las seis
// para pintar medio megapíxel.
export const RENDER_PALETA: Record<string, string> = {
  'nogal-marmol': '/cocina/paletas/panel-nogal-marmol.webp',
  'nogal-oscuro-blanco': '/cocina/paletas/panel-nogal-oscuro-blanco.webp',
  'olivo-dorado': '/cocina/paletas/panel-olivo-dorado.webp',
  'crema-laton': '/cocina/paletas/panel-crema-laton.webp',
  'azul-acero-dorado': '/cocina/paletas/panel-azul-acero-dorado.webp',
  'blanco-cuarzo-gris': '/cocina/paletas/panel-blanco-cuarzo-gris.webp',
};
