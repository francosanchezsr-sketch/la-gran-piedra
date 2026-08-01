export const LOTES = [
  { id: 'L-01', x: 40,  y: 60,  w: 96, h: 122, frente: '58 ft', fondo: '132 ft', orient: 'Sur',   maxft: 3100, pisos: '2 pisos', status: 'vendido' },
  { id: 'L-02', x: 142, y: 60,  w: 96, h: 122, frente: '58 ft', fondo: '132 ft', orient: 'Sur',   maxft: 3100, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-03', x: 244, y: 60,  w: 110, h: 122, frente: '66 ft', fondo: '132 ft', orient: 'Sur',  maxft: 3600, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-04', x: 360, y: 60,  w: 110, h: 122, frente: '66 ft', fondo: '132 ft', orient: 'Sur',  maxft: 3600, pisos: '1 piso',  status: 'reservado' },
  { id: 'L-05', x: 476, y: 60,  w: 96, h: 122, frente: '58 ft', fondo: '132 ft', orient: 'Sur',   maxft: 3100, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-06', x: 578, y: 60,  w: 96, h: 122, frente: '58 ft', fondo: '132 ft', orient: 'Sur',   maxft: 3100, pisos: '2 pisos', status: 'vendido' },
  { id: 'L-07', x: 680, y: 60,  w: 128, h: 122, frente: '78 ft', fondo: '132 ft', orient: 'Sur',  maxft: 4200, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-08', x: 40,  y: 248, w: 110, h: 128, frente: '66 ft', fondo: '138 ft', orient: 'Norte', maxft: 3700, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-09', x: 156, y: 248, w: 96, h: 128, frente: '58 ft', fondo: '138 ft', orient: 'Norte', maxft: 3200, pisos: '1 piso',  status: 'disponible' },
  { id: 'L-10', x: 258, y: 248, w: 96, h: 128, frente: '58 ft', fondo: '138 ft', orient: 'Norte', maxft: 3200, pisos: '2 pisos', status: 'reservado' },
  { id: 'L-11', x: 360, y: 248, w: 128, h: 128, frente: '78 ft', fondo: '138 ft', orient: 'Norte', maxft: 4300, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-12', x: 494, y: 248, w: 110, h: 128, frente: '66 ft', fondo: '138 ft', orient: 'Este',  maxft: 3700, pisos: '1 piso',  status: 'disponible' },
  { id: 'L-13', x: 610, y: 248, w: 96, h: 128, frente: '58 ft', fondo: '138 ft', orient: 'Este',  maxft: 3200, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-14', x: 712, y: 248, w: 96, h: 128, frente: '58 ft', fondo: '138 ft', orient: 'Este',  maxft: 3200, pisos: '2 pisos', status: 'vendido' },
] as const;

export type Lote = (typeof LOTES)[number];

export const PLANES = {
  A: { key: 'A', nombre: 'Corredor Norte', ft2: 2450 },
  B: { key: 'B', nombre: 'Patio Central', ft2: 2780 },
  C: { key: 'C', nombre: 'Casita Anexa', ft2: 3120 },
} as const;

export const FACHADAS = [
  { key: 'esc', nombre: 'Escandinavo moderno', desc: 'Volumen blanco, ventanal corrido, alero mínimo.', slot: 'RENDER FACHADA A' },
  { key: 'farm', nombre: 'Farm moderno', desc: 'Dos aguas marcadas, lámina negra, madera cálida.', slot: 'RENDER FACHADA B' },
  { key: 'piedra', nombre: 'Piedra blanca', desc: 'Muro de piedra caliza local y estuco liso.', slot: 'RENDER FACHADA C' },
  { key: 'negro', nombre: 'Híbrido negro', desc: 'Estuco carbón, celosía geométrica de concreto.', slot: 'RENDER FACHADA D' },
];

export const INTERIORES = [
  { key: 'nordico', nombre: 'Nórdico claro', desc: 'Roble blanqueado, lino, latón cepillado.', c1: '#F2F0EB', c2: '#D8D2C7', c3: '#505759' },
  { key: 'calida', nombre: 'Piedra cálida', desc: 'Micro-cemento arena, nogal, textiles crudos.', c1: '#E8E1D6', c2: '#B8A894', c3: '#3A3733' },
  { key: 'grafito', nombre: 'Grafito', desc: 'Grises profundos, acero negro, mármol veteado.', c1: '#D9D9D6', c2: '#6B6E70', c3: '#1C1E1F' },
  { key: 'carmin', nombre: 'Acento carmín', desc: 'Base neutra con un solo golpe de color de marca.', c1: '#F5F2EF', c2: '#505759', c3: '#F2004B' },
];

export const MODULOS = [
  { key: 'patio', nombre: 'Patio central techado con árbol', corto: 'Patio central', rango: '12×12 – 16×16', area: '144–256', prop: '1:1', min: 144, nota: 'Norte-sur ideal para ventilación cruzada' },
  { key: 'cocinaext', nombre: 'Cocina exterior cubierta', corto: 'Cocina exterior', rango: '10×12 – 14×16', area: '120–224', prop: '5:6', min: 120, nota: 'Profundidad mínima 10 ft' },
  { key: 'primary', nombre: 'Primary suite', corto: 'Primary suite', rango: 'rec 14×16 · closet 8×10 · baño 10×12', area: '300–450', prop: '7:8', min: 300, nota: '' },
  { key: 'dual', nombre: 'Dual primary / casita anexa', corto: 'Dual primary', rango: 'mínimo 380 ft²', area: '400–600', prop: '—', min: 380, nota: '' },
  { key: 'office', nombre: 'Home office junto a la entrada', corto: 'Home office', rango: '10×12 – 12×14', area: '120–168', prop: '5:6', min: 120, nota: '' },
  { key: 'bonus', nombre: 'Bonus / game room', corto: 'Bonus room', rango: '14×16 – 16×20', area: '224–320', prop: '4:5', min: 224, nota: '' },
  { key: 'scullery', nombre: 'Scullery oculta', corto: 'Scullery', rango: '8×10 – 10×12', area: '80–120', prop: '4:5', min: 80, nota: '' },
  { key: 'mudroom', nombre: 'Mudroom desde el garage', corto: 'Mudroom', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: '' },
  { key: 'cocinaexh', nombre: 'Cocina de exhibición con tragaluz', corto: 'Cocina exhibición', rango: '12×16 – 16×20', area: '192–320', prop: '3:4', min: 192, nota: 'Norte o este; evitar poniente' },
  { key: 'rec2', nombre: 'Recámara secundaria', corto: 'Recámara 2', rango: '11×12 – 12×14', area: '132–168', prop: '11:12', min: 132, nota: '' },
];

export const FAQS = [
  { q: '¿Qué es exactamente una casa custom de La Gran Piedra?', a: 'Partes de un lote con reglas conocidas y de floorplans que ya validamos estructural y térmicamente. Sobre esa base decides fachada, interiores y qué módulos añadir. No es un catálogo cerrado ni un lienzo en blanco: es libertad con guardarraíles.' },
  { q: '¿Cuánto tiempo toma construir?', a: 'Entre 9 y 13 meses desde la firma, según el floorplan y los módulos. El calendario se comparte completo antes de arrancar y se actualiza cada semana.' },
  { q: '¿Puedo cambiar cosas después de configurar en la web?', a: 'Sí. El configurador es el punto de partida de la conversación, no un contrato. Todo se revisa con el arquitecto en la cita presencial en el lote.' },
  { q: '¿Cómo funcionan las sugerencias por IA del paso 6?', a: 'Leemos tu brief y lo cruzamos con la orientación de tu lote y los pies cuadrados que te quedan disponibles. La IA solo filtra e interpreta: te propone módulos de nuestro catálogo que sí caben. No genera planos ni mueve muros.' },
  { q: '¿Los lotes son de ustedes?', a: 'Sí. Piedra Norte en Edinburg es nuestra subdivisión, lo que nos permite garantizar reglas de diseño y evitar sorpresas de servidumbres o permisos.' },
  { q: '¿Trabajan con financiamiento?', a: 'Trabajamos con prestamistas de construcción locales del Valle. Te conectamos, pero el crédito lo contratas tú directo — nosotros no cobramos comisión por eso.' },
  { q: '¿Qué incluye el smart home?', a: 'Clima por zonas, control de accesos, riego, iluminación e infraestructura de red, todo cableado desde obra gris. Sin adhesivos ni dispositivos improvisados al final.' },
  { q: '¿Construyen fuera del Rio Grande Valley?', a: 'Hoy operamos en McAllen, Edinburg y Mission. Tenemos visión de crecer a otros mercados de Texas — si tu terreno está fuera del Valle, escríbenos y lo evaluamos caso por caso.' },
];

export const NAV = [
  { label: 'Índice', id: 'index' },
  { label: 'Lugares', id: 'lugares' },
  { label: 'Personaliza', id: 'personaliza' },
  { label: 'Nosotros', id: 'nosotros' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contacto', id: 'contacto' },
];

export const PASO_NOMBRES = ['Lote', 'Floorplan', 'Fachada', 'Interior', 'Brief', 'Sugerencias IA', 'Tus datos', 'Resumen'];
export const PASO_HINTS = [
  'Elige un lote disponible para continuar',
  'Variantes curadas para tu lote',
  'Selecciona un estilo de fachada',
  'Selecciona una paleta de interiores',
  'Escribe libremente, o sáltalo',
  'Marca los módulos que quieras añadir',
  'Solo pedimos datos al final',
  'Revisa y envía',
];
