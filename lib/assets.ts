// Renders e iconos que vienen del proyecto de Claude Design, optimizados a
// webp/png chicos. Reemplazan a los diagramas SVG donde existe render real; el
// SVG sigue como respaldo para lo que todavía no tiene imagen.

// Isométricos de cada floorplan. TH (townhouse del Lote 17) todavía no tiene
// render, así que cae al diagrama SVG.
export const RENDER_PLAN: Record<string, string> = {
  B: '/floorplans/B.webp',
  C: '/floorplans/C.webp',
  D: '/floorplans/D.webp',
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
