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

// Subdivisiones (zonas) donde La Gran Piedra tiene lotes propios. Hoy solo
// "Enclave on 107" está armada con datos reales; el arreglo existe para que
// más subdivisiones puedan agregarse después sin rehacer la UI del selector.
export const SUBDIVISIONES = [
  {
    key: 'enclave107',
    nombre: 'Enclave on 107',
    zona: 'McAllen norte · corredor S.H. 107',
    direccion: 'S.H. 107, McAllen, TX 78504',
    totalLotes: 119,
    lotes: LOTES,
  },
] as const;

export type SubdivisionKey = (typeof SUBDIVISIONES)[number]['key'];

// Mapa esquemático de TODO el plat de Enclave on 107 (119 lotes), solo para
// dar contexto de ubicación — es un diagrama de orientación, no un trazo a
// escala del plat legal. Los 8 lotes de LOTES (73-76, 116-119) se muestran
// interactivos sobre este mismo mapa; el resto solo aparece con su número.
export const PLAT_ENCLAVE107 = [
  { num: 96, x: 40, y: 110, w: 90, h: 25 },
  { num: 97, x: 40, y: 137, w: 90, h: 25 },
  { num: 98, x: 40, y: 164, w: 90, h: 25 },
  { num: 99, x: 40, y: 191, w: 90, h: 25 },
  { num: 100, x: 40, y: 218, w: 90, h: 25 },
  { num: 101, x: 40, y: 245, w: 90, h: 25 },
  { num: 102, x: 40, y: 272, w: 90, h: 25 },
  { num: 103, x: 40, y: 299, w: 90, h: 25 },
  { num: 104, x: 40, y: 326, w: 90, h: 25 },
  { num: 105, x: 40, y: 353, w: 90, h: 25 },
  { num: 106, x: 40, y: 380, w: 90, h: 25 },
  { num: 107, x: 40, y: 407, w: 90, h: 25 },
  { num: 108, x: 40, y: 434, w: 90, h: 25 },
  { num: 109, x: 40, y: 461, w: 90, h: 25 },
  { num: 110, x: 40, y: 488, w: 90, h: 25 },
  { num: 111, x: 40, y: 515, w: 90, h: 25 },
  { num: 112, x: 40, y: 542, w: 90, h: 25 },
  { num: 113, x: 40, y: 569, w: 90, h: 25 },
  { num: 114, x: 40, y: 596, w: 90, h: 25 },
  { num: 115, x: 40, y: 623, w: 90, h: 25 },
  { num: 116, x: 40, y: 650, w: 90, h: 25 },
  { num: 117, x: 40, y: 677, w: 90, h: 25 },
  { num: 118, x: 40, y: 704, w: 90, h: 25 },
  { num: 119, x: 40, y: 731, w: 90, h: 25 },
  { num: 35, x: 770, y: 110, w: 90, h: 22 },
  { num: 34, x: 770, y: 134.4, w: 90, h: 22 },
  { num: 33, x: 770, y: 158.8, w: 90, h: 22 },
  { num: 32, x: 770, y: 183.2, w: 90, h: 22 },
  { num: 31, x: 770, y: 207.6, w: 90, h: 22 },
  { num: 30, x: 770, y: 232, w: 90, h: 22 },
  { num: 29, x: 770, y: 256.4, w: 90, h: 22 },
  { num: 28, x: 770, y: 280.8, w: 90, h: 22 },
  { num: 27, x: 770, y: 305.2, w: 90, h: 22 },
  { num: 26, x: 770, y: 329.6, w: 90, h: 22 },
  { num: 25, x: 770, y: 354, w: 90, h: 22 },
  { num: 24, x: 770, y: 378.4, w: 90, h: 22 },
  { num: 23, x: 770, y: 402.8, w: 90, h: 22 },
  { num: 22, x: 770, y: 427.2, w: 90, h: 22 },
  { num: 21, x: 770, y: 451.6, w: 90, h: 22 },
  { num: 20, x: 770, y: 476, w: 90, h: 22 },
  { num: 19, x: 770, y: 500.4, w: 90, h: 22 },
  { num: 18, x: 770, y: 524.8, w: 90, h: 22 },
  { num: 17, x: 770, y: 549.2, w: 90, h: 22 },
  { num: 16, x: 770, y: 573.6, w: 90, h: 22 },
  { num: 15, x: 770, y: 598, w: 90, h: 22 },
  { num: 14, x: 770, y: 622.4, w: 90, h: 22 },
  { num: 13, x: 770, y: 646.8, w: 90, h: 22 },
  { num: 12, x: 770, y: 671.2, w: 90, h: 22 },
  { num: 11, x: 770, y: 695.6, w: 90, h: 22 },
  { num: 10, x: 770, y: 720, w: 90, h: 22 },
  { num: 9, x: 770, y: 744.4, w: 90, h: 22 },
  { num: 95, x: 330, y: 130, w: 80, h: 20 },
  { num: 94, x: 330, y: 151.7, w: 80, h: 20 },
  { num: 93, x: 330, y: 173.4, w: 80, h: 20 },
  { num: 92, x: 330, y: 195.1, w: 80, h: 20 },
  { num: 91, x: 330, y: 216.8, w: 80, h: 20 },
  { num: 90, x: 330, y: 238.5, w: 80, h: 20 },
  { num: 89, x: 330, y: 260.2, w: 80, h: 20 },
  { num: 88, x: 330, y: 281.9, w: 80, h: 20 },
  { num: 87, x: 330, y: 303.6, w: 80, h: 20 },
  { num: 86, x: 330, y: 325.3, w: 80, h: 20 },
  { num: 85, x: 330, y: 347, w: 80, h: 20 },
  { num: 84, x: 330, y: 368.7, w: 80, h: 20 },
  { num: 83, x: 330, y: 390.4, w: 80, h: 20 },
  { num: 82, x: 330, y: 412.1, w: 80, h: 20 },
  { num: 81, x: 330, y: 433.8, w: 80, h: 20 },
  { num: 80, x: 330, y: 455.5, w: 80, h: 20 },
  { num: 79, x: 330, y: 477.2, w: 80, h: 20 },
  { num: 78, x: 330, y: 498.9, w: 80, h: 20 },
  { num: 77, x: 330, y: 520.6, w: 80, h: 20 },
  { num: 76, x: 330, y: 542.3, w: 80, h: 20 },
  { num: 75, x: 330, y: 564, w: 80, h: 20 },
  { num: 74, x: 330, y: 585.7, w: 80, h: 20 },
  { num: 73, x: 330, y: 607.4, w: 80, h: 20 },
  { num: 50, x: 430, y: 130, w: 80, h: 20 },
  { num: 51, x: 430, y: 151.7, w: 80, h: 20 },
  { num: 52, x: 430, y: 173.4, w: 80, h: 20 },
  { num: 53, x: 430, y: 195.1, w: 80, h: 20 },
  { num: 54, x: 430, y: 216.8, w: 80, h: 20 },
  { num: 55, x: 430, y: 238.5, w: 80, h: 20 },
  { num: 56, x: 430, y: 260.2, w: 80, h: 20 },
  { num: 57, x: 430, y: 281.9, w: 80, h: 20 },
  { num: 58, x: 430, y: 303.6, w: 80, h: 20 },
  { num: 59, x: 430, y: 325.3, w: 80, h: 20 },
  { num: 60, x: 430, y: 347, w: 80, h: 20 },
  { num: 61, x: 430, y: 368.7, w: 80, h: 20 },
  { num: 62, x: 430, y: 390.4, w: 80, h: 20 },
  { num: 63, x: 430, y: 412.1, w: 80, h: 20 },
  { num: 64, x: 430, y: 433.8, w: 80, h: 20 },
  { num: 65, x: 430, y: 455.5, w: 80, h: 20 },
  { num: 66, x: 430, y: 477.2, w: 80, h: 20 },
  { num: 67, x: 430, y: 498.9, w: 80, h: 20 },
  { num: 68, x: 430, y: 520.6, w: 80, h: 20 },
  { num: 69, x: 430, y: 542.3, w: 80, h: 20 },
  { num: 70, x: 430, y: 564, w: 80, h: 20 },
  { num: 71, x: 430, y: 585.7, w: 80, h: 20 },
  { num: 72, x: 430, y: 607.4, w: 80, h: 20 },
  { num: 49, x: 150, y: 55, w: 55, h: 40 },
  { num: 48, x: 220, y: 25, w: 55, h: 40 },
  { num: 47, x: 290, y: 15, w: 55, h: 40 },
  { num: 46, x: 355, y: 20, w: 55, h: 40 },
  { num: 45, x: 415, y: 35, w: 55, h: 40 },
  { num: 44, x: 470, y: 60, w: 55, h: 40 },
  { num: 43, x: 530, y: 60, w: 50, h: 38 },
  { num: 42, x: 585, y: 40, w: 50, h: 38 },
  { num: 41, x: 640, y: 25, w: 50, h: 38 },
  { num: 40, x: 695, y: 18, w: 50, h: 38 },
  { num: 39, x: 750, y: 22, w: 50, h: 38 },
  { num: 38, x: 800, y: 40, w: 50, h: 38 },
  { num: 37, x: 840, y: 65, w: 50, h: 38 },
  { num: 36, x: 860, y: 95, w: 50, h: 38 },
  { num: 1, x: 150, y: 800, w: 58, h: 34 },
  { num: 2, x: 215, y: 795, w: 58, h: 34 },
  { num: 3, x: 280, y: 790, w: 58, h: 34 },
  { num: 4, x: 345, y: 787, w: 58, h: 34 },
  { num: 5, x: 410, y: 787, w: 58, h: 34 },
  { num: 6, x: 475, y: 790, w: 58, h: 34 },
  { num: 7, x: 540, y: 795, w: 58, h: 34 },
  { num: 8, x: 620, y: 780, w: 58, h: 34 },
] as const;

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
