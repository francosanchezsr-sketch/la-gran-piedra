// Lotes reales de la subdivisión "Enclave on 107" (McAllen, TX) — tomados del
// plat oficial (lotes 73-76 y 116-119) y del set arquitectónico permitido del
// Lote 17 (mismo tipo de lote/producto que 116-119: 33'x100'). maxft = 2,249
// ft², el total real construible por el set arquitectónico (1,635 living +
// 473 garage + 24 porche + 80 patio + 37 balcón), no una cifra estimada.
export const LOTES = [
  { id: 'L-73', x: 60,  y: 70,  w: 110, h: 150, frente: '32.5 ft', fondo: '80 ft',  orient: 'Este', maxft: 2249, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-74', x: 180, y: 70,  w: 110, h: 150, frente: '32.5 ft', fondo: '80 ft',  orient: 'Este', maxft: 2249, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-75', x: 300, y: 70,  w: 110, h: 150, frente: '32.5 ft', fondo: '80 ft',  orient: 'Este', maxft: 2249, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-76', x: 420, y: 70,  w: 110, h: 150, frente: '32.5 ft', fondo: '80 ft',  orient: 'Este', maxft: 2249, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-116', x: 60,  y: 250, w: 110, h: 170, frente: '33 ft', fondo: '100 ft', orient: 'Norte', maxft: 2249, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-117', x: 180, y: 250, w: 110, h: 170, frente: '33 ft', fondo: '100 ft', orient: 'Norte', maxft: 2249, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-118', x: 300, y: 250, w: 110, h: 170, frente: '33 ft', fondo: '100 ft', orient: 'Norte', maxft: 2249, pisos: '2 pisos', status: 'disponible' },
  { id: 'L-119', x: 420, y: 250, w: 110, h: 170, frente: '33 ft', fondo: '100 ft', orient: 'Norte', maxft: 2249, pisos: '2 pisos', status: 'disponible' },
] as const;

export type Lote = (typeof LOTES)[number];

// Las 3 opciones son combinaciones reales de los componentes del set
// arquitectónico del Lote 17 (no cifras inventadas): 906 ft² planta baja +
// 729 ft² planta alta = 1,635 ft² habitables + 473 ft² garage + 24 ft² pórtico
// (+ 80 ft² patio cubierto / + 37 ft² balcón según la variante).
export const PLANES = {
  A: { key: 'A', nombre: 'Enclave Compacta', ft2: 2132 },
  B: { key: 'B', nombre: 'Enclave con Patio', ft2: 2212 },
  C: { key: 'C', nombre: 'Enclave Completa', ft2: 2249 },
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
  { key: 'patio', nombre: 'Patio cubierto', corto: 'Patio cubierto', rango: '8×10 (real, set arquitectónico Lote 17)', area: '80', prop: '4:5', min: 80, nota: 'Ajustado al patio cubierto real de 80 ft² — no cabe uno más grande en un lote de 33’' },
  { key: 'cocinaext', nombre: 'Cocina exterior cubierta', corto: 'Cocina exterior', rango: '10×12 – 14×16', area: '120–224', prop: '5:6', min: 120, nota: 'Profundidad mínima 10 ft' },
  { key: 'primary', nombre: 'Primary suite', corto: 'Primary suite', rango: 'rec 14’2×13’6 · W.I.C. 10’6×5’6 · baño 5’6×15', area: '300–450', prop: '7:8', min: 300, nota: 'Basado en el master real del set arquitectónico (≈331 ft²)' },
  { key: 'dual', nombre: 'Dual primary / casita anexa', corto: 'Dual primary', rango: 'mínimo 380 ft²', area: '400–600', prop: '—', min: 380, nota: '' },
  { key: 'office', nombre: 'Home office junto a la entrada', corto: 'Home office', rango: '10×12 – 12×14', area: '120–168', prop: '5:6', min: 120, nota: '' },
  { key: 'bonus', nombre: 'Bonus / game room', corto: 'Bonus room', rango: '14×16 – 16×20', area: '224–320', prop: '4:5', min: 224, nota: '' },
  { key: 'scullery', nombre: 'Scullery oculta', corto: 'Scullery', rango: '8×10 – 10×12', area: '80–120', prop: '4:5', min: 80, nota: '' },
  { key: 'mudroom', nombre: 'Mudroom desde el garage', corto: 'Mudroom', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: '' },
  { key: 'cocinaexh', nombre: 'Cocina de exhibición con tragaluz', corto: 'Cocina exhibición', rango: '12×16 – 16×20', area: '192–320', prop: '3:4', min: 192, nota: 'Norte o este; evitar poniente' },
  { key: 'rec2', nombre: 'Recámara secundaria', corto: 'Recámara 2', rango: '10’6×10’0 (real, set arquitectónico Lote 17)', area: '105', prop: '21:20', min: 105, nota: 'Recámara 2/3 reales del townhouse — ya no se infla a 132–168 ft²' },

  // Variantes de floorplan (consumen del mismo presupuesto; algunas son mutuamente excluyentes o requieren otra zona)
  { key: 'cocinaabierta', nombre: 'Cocina concepto abierto', corto: 'Cocina abierta', rango: 'sin muros extra', area: '168', prop: '3:4', min: 168, nota: '', grupo: 'cocina' },
  { key: 'cocinacerrada', nombre: 'Cocina concepto cerrado', corto: 'Cocina cerrada', rango: '168 + 56 de muros', area: '224', prop: '3:4', min: 224, nota: 'Incluye muros y circulación extra', grupo: 'cocina' },
  { key: 'pasillo', nombre: 'Pasillo con ventanas', corto: 'Pasillo conector', rango: '4×20 – 4×30', area: '80–120', prop: '1:5 a 1:7.5', min: 80, nota: 'Cuenta como circulación, no como zona' },
  { key: 'masterpatio', nombre: 'Master con conexión al patio', corto: 'Master + patio', rango: 'recámara estándar', area: '224', prop: '—', min: 224, nota: 'Requiere Patio central', requiere: 'patio', grupo: 'master' },
  { key: 'masterbalcon', nombre: 'Master con balcón', corto: 'Master + balcón', rango: 'balcón real 4’3×8’8 (37 ft²)', area: '261', prop: 'balcón 1:2', min: 261, nota: 'Ajustado al balcón real del set arquitectónico (antes se inflaba a 60–96 ft²)', grupo: 'master' },
  { key: 'floatingoffice', nombre: 'Floating office', corto: 'Floating office', rango: '—', area: '80–120', prop: '4:5', min: 80, nota: '' },

  // Zonas opcionales (add-on sobre el presupuesto restante)
  { key: 'walkingcloset', nombre: 'Walking closet secundario', corto: 'Walking closet', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: 'El closet del master ya está incluido' },
  { key: 'alberca', nombre: 'Alberca con deck perimetral', corto: 'Alberca', rango: '12×24 – 16×32', area: '400–700', prop: '1:2', min: 400, nota: 'Incluye deck perimetral' },
  { key: 'bbq', nombre: 'Zona BBQ compacta', corto: 'Zona BBQ', rango: '8×8 – 10×10', area: '64–100', prop: '1:1', min: 64, nota: 'Distinta de la cocina exterior cubierta' },
  { key: 'sunkenlounge', nombre: 'Sunken lounge en el gran salón', corto: 'Sunken lounge', rango: '+100–150 sobre el salón', area: '100–150', prop: '—', min: 100, nota: 'Rebaje de piso, no es un cuarto nuevo' },
  { key: 'storage', nombre: 'Storage', corto: 'Storage', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: '' },
  { key: 'lavanderia', nombre: 'Lavandería independiente', corto: 'Lavandería', rango: '5’6×7’8 (real, set arquitectónico Lote 17)', area: '42', prop: '3:4', min: 42, nota: 'Junto al A/C, planta alta' },
];

export const FAQS = [
  { q: '¿Qué es exactamente una casa custom de La Gran Piedra?', a: 'Partes de un lote con reglas conocidas y de floorplans que ya validamos estructural y térmicamente. Sobre esa base decides fachada, interiores y qué módulos añadir. No es un catálogo cerrado ni un lienzo en blanco: es libertad con guardarraíles.' },
  { q: '¿Cuánto tiempo toma construir?', a: 'Entre 9 y 13 meses desde la firma, según el floorplan y los módulos. El calendario se comparte completo antes de arrancar y se actualiza cada semana.' },
  { q: '¿Puedo cambiar cosas después de configurar en la web?', a: 'Sí. El configurador es el punto de partida de la conversación, no un contrato. Todo se revisa con el arquitecto en la cita presencial en el lote.' },
  { q: '¿Cómo funcionan las sugerencias por IA al armar mis zonas?', a: 'Leemos tu brief y lo cruzamos con la orientación de tu lote y los pies cuadrados que te quedan disponibles. La IA solo filtra e interpreta: te propone módulos de nuestro catálogo que sí caben. No genera planos ni mueve muros.' },
  { q: '¿Los lotes son de ustedes?', a: 'Sí. Enclave on 107 en McAllen es nuestra subdivisión, lo que nos permite garantizar reglas de diseño y evitar sorpresas de servidumbres o permisos.' },
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

export const PASO_NOMBRES = ['Lote', 'Floorplan', 'Fachada', 'Brief', 'Interior y módulos', 'Tus datos', 'Resumen'];
export const PASO_HINTS = [
  'Elige un lote disponible para continuar',
  'Variantes curadas para tu lote',
  'Selecciona un estilo de fachada',
  'Escribe libremente, o sáltalo',
  'Elige tu paleta y arma tus zonas',
  'Solo pedimos datos al final',
  'Revisa y envía',
];
