// Lotes reales de la subdivisión "Enclave on 107" (McAllen, TX) — tomados del
// plat oficial (lotes 73-76 y 116-119) y del set arquitectónico permitido del
// Lote 17 (mismo tipo de lote/producto que 116-119: 33'x100').
//
// El presupuesto del configurador se lleva SOLO en área habitable:
//   maxLiving = 1,635 ft²  → tope de área habitable que permite la subdivisión
//                            (906 planta baja + 729 planta alta del set real).
//   maxft     = 2,249 ft²  → envolvente total construida, informativa. Incluye
//                            473 garage + 24 pórtico + 80 patio + 37 balcón,
//                            que NO consumen presupuesto habitable.
//
// tipo: 'townhouse' → la subdivisión entrega la casa ya diseñada. El floorplan
// no se elige (planFijo) y hay zonas prohibidas por reglamento. Ver REGLAS_LOTE.
export const LOTES = [
  { id: 'L-73', x: 60,  y: 70,  w: 110, h: 150, frente: '32.5 ft', fondo: '80 ft',  orient: 'Este', maxft: 2249, maxLiving: 1635, pisos: '2 pisos', tipo: 'townhouse', planFijo: 'TH', status: 'disponible' },
  { id: 'L-74', x: 180, y: 70,  w: 110, h: 150, frente: '32.5 ft', fondo: '80 ft',  orient: 'Este', maxft: 2249, maxLiving: 1635, pisos: '2 pisos', tipo: 'townhouse', planFijo: 'TH', status: 'disponible' },
  { id: 'L-75', x: 300, y: 70,  w: 110, h: 150, frente: '32.5 ft', fondo: '80 ft',  orient: 'Este', maxft: 2249, maxLiving: 1635, pisos: '2 pisos', tipo: 'townhouse', planFijo: 'TH', status: 'disponible' },
  { id: 'L-76', x: 420, y: 70,  w: 110, h: 150, frente: '32.5 ft', fondo: '80 ft',  orient: 'Este', maxft: 2249, maxLiving: 1635, pisos: '2 pisos', tipo: 'townhouse', planFijo: 'TH', status: 'disponible' },
  { id: 'L-116', x: 60,  y: 250, w: 110, h: 170, frente: '33 ft', fondo: '100 ft', orient: 'Norte', maxft: 2249, maxLiving: 1635, pisos: '2 pisos', tipo: 'townhouse', planFijo: 'TH', status: 'disponible' },
  { id: 'L-117', x: 180, y: 250, w: 110, h: 170, frente: '33 ft', fondo: '100 ft', orient: 'Norte', maxft: 2249, maxLiving: 1635, pisos: '2 pisos', tipo: 'townhouse', planFijo: 'TH', status: 'disponible' },
  { id: 'L-118', x: 300, y: 250, w: 110, h: 170, frente: '33 ft', fondo: '100 ft', orient: 'Norte', maxft: 2249, maxLiving: 1635, pisos: '2 pisos', tipo: 'townhouse', planFijo: 'TH', status: 'disponible' },
  { id: 'L-119', x: 420, y: 250, w: 110, h: 170, frente: '33 ft', fondo: '100 ft', orient: 'Norte', maxft: 2249, maxLiving: 1635, pisos: '2 pisos', tipo: 'townhouse', planFijo: 'TH', status: 'disponible' },
] as const;

export type LoteTipo = 'townhouse' | 'libre';

// Un lote puede venir del catálogo (readonly, con `as const`) o de un plano que
// el usuario subió en el paso 1 — por eso el tipo es estructural, no derivado.
export type Lote = {
  id: string;
  x: number; y: number; w: number; h: number;
  frente: string; fondo: string; orient: string;
  maxft: number; maxLiving: number; pisos: string;
  tipo: LoteTipo;
  planFijo?: string;
  status: string;
  origen?: 'catalogo' | 'usuario';
  fuente?: string;
  // Solo en lotes del usuario: de aquí sale el presupuesto en vez del factor
  // de ocupación genérico. huella = planta baja construible tras los retiros.
  frenteFt?: number;
  fondoFt?: number;
  retiros?: Retiros;
  huella?: number;
};

// Reglas de construcción por tipo de lote. Son restricciones del reglamento de
// la subdivisión, no preferencias de diseño: por eso bloquean en vez de sugerir.
export const REGLAS_LOTE: Record<LoteTipo, {
  planes: string[];
  zonasBloqueadas: string[];
  motivo: string;
}> = {
  townhouse: {
    // La casa viene diseñada por default; el floorplan no se elige.
    planes: ['TH'],
    // Sin patio central ni alberca: no hay servidumbre lateral ni trasera que
    // los admita en un lote de 32.5'–33' de frente pegado a sus vecinos.
    zonasBloqueadas: ['alberca', 'masterpatio'],
    motivo: 'No permitido por reglas de la subdivisión en lotes townhouse',
  },
  libre: {
    planes: ['B', 'C', 'D'],
    zonasBloqueadas: [],
    motivo: '',
  },
};

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

// Trazo del plat de Enclave on 107 (119 lotes), calcado sobre las
// proporciones reales del levantamiento (rectángulo de 600.16' E-O x
// 1181.23' N-S, según los rumbos del perímetro en la hoja 1). Cada lote recto
// conserva su frente/fondo real en pies (33'x100' en las columnas exteriores,
// 32.5'x80' en las columnas interiores); los 14 lotes de los dos cul-de-sac
// (36-49) se trazan como cuñas radiales alrededor de los bulbos de retorno
// (R50'), tal como se ven en el plat, en vez de aproximarse con rectángulos.
// Los 8 lotes de entrada (1-8) siguen la curva de acceso cerca del P.O.B.
// Los 8 lotes de LOTES (73-76, 116-119) se muestran interactivos sobre este
// mismo mapa; el resto solo aparece con su número, de referencia.
export const PLAT_VIEWBOX = { w: 600, h: 1181 };

export type PlatLot =
  | { num: number; kind: 'rect'; x: number; y: number; w: number; h: number; rot?: number }
  | { num: number; kind: 'wedge'; d: string; lx: number; ly: number };

export const PLAT_ENCLAVE107: PlatLot[] = [
  { num: 1, kind: 'rect', x: 80, y: 1135, w: 58, h: 32, rot: -10 },
  { num: 2, kind: 'rect', x: 145, y: 1140, w: 58, h: 32, rot: -6 },
  { num: 3, kind: 'rect', x: 210, y: 1143, w: 58, h: 32, rot: -3 },
  { num: 4, kind: 'rect', x: 275, y: 1145, w: 58, h: 32, rot: -1 },
  { num: 5, kind: 'rect', x: 340, y: 1145, w: 58, h: 32, rot: 1 },
  { num: 6, kind: 'rect', x: 405, y: 1143, w: 58, h: 32, rot: 3 },
  { num: 7, kind: 'rect', x: 470, y: 1140, w: 58, h: 32, rot: 6 },
  { num: 8, kind: 'rect', x: 535, y: 1135, w: 58, h: 32, rot: 10 },
  { num: 9, kind: 'rect', x: 460, y: 1063, w: 100, h: 31.5 },
  { num: 10, kind: 'rect', x: 460, y: 1030, w: 100, h: 31.5 },
  { num: 11, kind: 'rect', x: 460, y: 997, w: 100, h: 31.5 },
  { num: 12, kind: 'rect', x: 460, y: 964, w: 100, h: 31.5 },
  { num: 13, kind: 'rect', x: 460, y: 931, w: 100, h: 31.5 },
  { num: 14, kind: 'rect', x: 460, y: 898, w: 100, h: 31.5 },
  { num: 15, kind: 'rect', x: 460, y: 865, w: 100, h: 31.5 },
  { num: 16, kind: 'rect', x: 460, y: 832, w: 100, h: 31.5 },
  { num: 17, kind: 'rect', x: 460, y: 799, w: 100, h: 31.5 },
  { num: 18, kind: 'rect', x: 460, y: 766, w: 100, h: 31.5 },
  { num: 19, kind: 'rect', x: 460, y: 733, w: 100, h: 31.5 },
  { num: 20, kind: 'rect', x: 460, y: 700, w: 100, h: 31.5 },
  { num: 21, kind: 'rect', x: 460, y: 667, w: 100, h: 31.5 },
  { num: 22, kind: 'rect', x: 460, y: 634, w: 100, h: 31.5 },
  { num: 23, kind: 'rect', x: 460, y: 601, w: 100, h: 31.5 },
  { num: 24, kind: 'rect', x: 460, y: 568, w: 100, h: 31.5 },
  { num: 25, kind: 'rect', x: 460, y: 535, w: 100, h: 31.5 },
  { num: 26, kind: 'rect', x: 460, y: 502, w: 100, h: 31.5 },
  { num: 27, kind: 'rect', x: 460, y: 469, w: 100, h: 31.5 },
  { num: 28, kind: 'rect', x: 460, y: 436, w: 100, h: 31.5 },
  { num: 29, kind: 'rect', x: 460, y: 403, w: 100, h: 31.5 },
  { num: 30, kind: 'rect', x: 460, y: 370, w: 100, h: 31.5 },
  { num: 31, kind: 'rect', x: 460, y: 337, w: 100, h: 31.5 },
  { num: 32, kind: 'rect', x: 460, y: 304, w: 100, h: 31.5 },
  { num: 33, kind: 'rect', x: 460, y: 271, w: 100, h: 31.5 },
  { num: 34, kind: 'rect', x: 460, y: 238, w: 100, h: 31.5 },
  { num: 35, kind: 'rect', x: 460, y: 205, w: 100, h: 31.5 },
  { num: 36, kind: 'wedge', d: 'M 366.3 148.9 L 442.1 123.2 A 130 130 0 0 1 448.5 176.3 L 368.8 169.4 A 50 50 0 0 0 366.3 148.9 Z', lx: 408.4, ly: 154.2 },
  { num: 37, kind: 'wedge', d: 'M 355.9 131.2 L 414.8 77.2 A 130 130 0 0 1 442.1 123.2 L 366.3 148.9 A 50 50 0 0 0 355.9 131.2 Z', lx: 396.4, ly: 119.2 },
  { num: 38, kind: 'wedge', d: 'M 339.1 119.2 L 371.4 46.0 A 130 130 0 0 1 414.8 77.2 L 355.9 131.2 A 50 50 0 0 0 339.1 119.2 Z', lx: 371.4, ly: 91.8 },
  { num: 39, kind: 'wedge', d: 'M 319.0 115.0 L 319.0 35.0 A 130 130 0 0 1 371.4 46.0 L 339.1 119.2 A 50 50 0 0 0 319.0 115.0 Z', lx: 337.5, ly: 76.9 },
  { num: 40, kind: 'wedge', d: 'M 298.9 119.2 L 266.6 46.0 A 130 130 0 0 1 319.0 35.0 L 319.0 115.0 A 50 50 0 0 0 298.9 119.2 Z', lx: 300.5, ly: 76.9 },
  { num: 41, kind: 'wedge', d: 'M 282.1 131.2 L 223.2 77.2 A 130 130 0 0 1 266.6 46.0 L 298.9 119.2 A 50 50 0 0 0 282.1 131.2 Z', lx: 266.6, ly: 91.8 },
  { num: 42, kind: 'wedge', d: 'M 271.7 148.9 L 195.9 123.2 A 130 130 0 0 1 223.2 77.2 L 282.1 131.2 A 50 50 0 0 0 271.7 148.9 Z', lx: 241.6, ly: 119.2 },
  { num: 43, kind: 'wedge', d: 'M 269.2 169.4 L 189.5 176.3 A 130 130 0 0 1 195.9 123.2 L 271.7 148.9 A 50 50 0 0 0 269.2 169.4 Z', lx: 229.6, ly: 154.2 },
  { num: 44, kind: 'wedge', d: 'M 261.2 145.9 L 335.1 115.3 A 130 130 0 0 1 344.5 176.3 L 264.8 169.4 A 50 50 0 0 0 261.2 145.9 Z', lx: 304, ly: 151.3 },
  { num: 45, kind: 'wedge', d: 'M 247.1 126.7 L 298.6 65.4 A 130 130 0 0 1 335.1 115.3 L 261.2 145.9 A 50 50 0 0 0 247.1 126.7 Z', lx: 287.6, ly: 111.8 },
  { num: 46, kind: 'wedge', d: 'M 225.8 116.2 L 243.1 38.1 A 130 130 0 0 1 298.6 65.4 L 247.1 126.7 A 50 50 0 0 0 225.8 116.2 Z', lx: 254.8, ly: 84.3 },
  { num: 47, kind: 'wedge', d: 'M 202.1 116.7 L 181.4 39.4 A 130 130 0 0 1 243.1 38.1 L 225.8 116.2 A 50 50 0 0 0 202.1 116.7 Z', lx: 213, ly: 75 },
  { num: 48, kind: 'wedge', d: 'M 181.2 128.1 L 127.2 69.2 A 130 130 0 0 1 181.4 39.4 L 202.1 116.7 A 50 50 0 0 0 181.2 128.1 Z', lx: 171.7, ly: 86.1 },
  { num: 49, kind: 'wedge', d: 'M 168.0 147.9 L 92.8 120.5 A 130 130 0 0 1 127.2 69.2 L 181.2 128.1 A 50 50 0 0 0 168.0 147.9 Z', lx: 140.2, ly: 115 },
  { num: 50, kind: 'rect', x: 279, y: 228, w: 80, h: 31 },
  { num: 51, kind: 'rect', x: 279, y: 260.5, w: 80, h: 31 },
  { num: 52, kind: 'rect', x: 279, y: 293, w: 80, h: 31 },
  { num: 53, kind: 'rect', x: 279, y: 325.5, w: 80, h: 31 },
  { num: 54, kind: 'rect', x: 279, y: 358, w: 80, h: 31 },
  { num: 55, kind: 'rect', x: 279, y: 390.5, w: 80, h: 31 },
  { num: 56, kind: 'rect', x: 279, y: 423, w: 80, h: 31 },
  { num: 57, kind: 'rect', x: 279, y: 455.5, w: 80, h: 31 },
  { num: 58, kind: 'rect', x: 279, y: 488, w: 80, h: 31 },
  { num: 59, kind: 'rect', x: 279, y: 520.5, w: 80, h: 31 },
  { num: 60, kind: 'rect', x: 279, y: 553, w: 80, h: 31 },
  { num: 61, kind: 'rect', x: 279, y: 585.5, w: 80, h: 31 },
  { num: 62, kind: 'rect', x: 279, y: 618, w: 80, h: 31 },
  { num: 63, kind: 'rect', x: 279, y: 650.5, w: 80, h: 31 },
  { num: 64, kind: 'rect', x: 279, y: 683, w: 80, h: 31 },
  { num: 65, kind: 'rect', x: 279, y: 715.5, w: 80, h: 31 },
  { num: 66, kind: 'rect', x: 279, y: 748, w: 80, h: 31 },
  { num: 67, kind: 'rect', x: 279, y: 780.5, w: 80, h: 31 },
  { num: 68, kind: 'rect', x: 279, y: 813, w: 80, h: 31 },
  { num: 69, kind: 'rect', x: 279, y: 845.5, w: 80, h: 31 },
  { num: 70, kind: 'rect', x: 279, y: 878, w: 80, h: 31 },
  { num: 71, kind: 'rect', x: 279, y: 910.5, w: 80, h: 31 },
  { num: 72, kind: 'rect', x: 279, y: 943, w: 80, h: 31 },
  { num: 73, kind: 'rect', x: 175, y: 943, w: 80, h: 31 },
  { num: 74, kind: 'rect', x: 175, y: 910.5, w: 80, h: 31 },
  { num: 75, kind: 'rect', x: 175, y: 878, w: 80, h: 31 },
  { num: 76, kind: 'rect', x: 175, y: 845.5, w: 80, h: 31 },
  { num: 77, kind: 'rect', x: 175, y: 813, w: 80, h: 31 },
  { num: 78, kind: 'rect', x: 175, y: 780.5, w: 80, h: 31 },
  { num: 79, kind: 'rect', x: 175, y: 748, w: 80, h: 31 },
  { num: 80, kind: 'rect', x: 175, y: 715.5, w: 80, h: 31 },
  { num: 81, kind: 'rect', x: 175, y: 683, w: 80, h: 31 },
  { num: 82, kind: 'rect', x: 175, y: 650.5, w: 80, h: 31 },
  { num: 83, kind: 'rect', x: 175, y: 618, w: 80, h: 31 },
  { num: 84, kind: 'rect', x: 175, y: 585.5, w: 80, h: 31 },
  { num: 85, kind: 'rect', x: 175, y: 553, w: 80, h: 31 },
  { num: 86, kind: 'rect', x: 175, y: 520.5, w: 80, h: 31 },
  { num: 87, kind: 'rect', x: 175, y: 488, w: 80, h: 31 },
  { num: 88, kind: 'rect', x: 175, y: 455.5, w: 80, h: 31 },
  { num: 89, kind: 'rect', x: 175, y: 423, w: 80, h: 31 },
  { num: 90, kind: 'rect', x: 175, y: 390.5, w: 80, h: 31 },
  { num: 91, kind: 'rect', x: 175, y: 358, w: 80, h: 31 },
  { num: 92, kind: 'rect', x: 175, y: 325.5, w: 80, h: 31 },
  { num: 93, kind: 'rect', x: 175, y: 293, w: 80, h: 31 },
  { num: 94, kind: 'rect', x: 175, y: 260.5, w: 80, h: 31 },
  { num: 95, kind: 'rect', x: 175, y: 228, w: 80, h: 31 },
  { num: 96, kind: 'rect', x: 40, y: 205, w: 100, h: 31.5 },
  { num: 97, kind: 'rect', x: 40, y: 238, w: 100, h: 31.5 },
  { num: 98, kind: 'rect', x: 40, y: 271, w: 100, h: 31.5 },
  { num: 99, kind: 'rect', x: 40, y: 304, w: 100, h: 31.5 },
  { num: 100, kind: 'rect', x: 40, y: 337, w: 100, h: 31.5 },
  { num: 101, kind: 'rect', x: 40, y: 370, w: 100, h: 31.5 },
  { num: 102, kind: 'rect', x: 40, y: 403, w: 100, h: 31.5 },
  { num: 103, kind: 'rect', x: 40, y: 436, w: 100, h: 31.5 },
  { num: 104, kind: 'rect', x: 40, y: 469, w: 100, h: 31.5 },
  { num: 105, kind: 'rect', x: 40, y: 502, w: 100, h: 31.5 },
  { num: 106, kind: 'rect', x: 40, y: 535, w: 100, h: 31.5 },
  { num: 107, kind: 'rect', x: 40, y: 568, w: 100, h: 31.5 },
  { num: 108, kind: 'rect', x: 40, y: 601, w: 100, h: 31.5 },
  { num: 109, kind: 'rect', x: 40, y: 634, w: 100, h: 31.5 },
  { num: 110, kind: 'rect', x: 40, y: 667, w: 100, h: 31.5 },
  { num: 111, kind: 'rect', x: 40, y: 700, w: 100, h: 31.5 },
  { num: 112, kind: 'rect', x: 40, y: 733, w: 100, h: 31.5 },
  { num: 113, kind: 'rect', x: 40, y: 766, w: 100, h: 31.5 },
  { num: 114, kind: 'rect', x: 40, y: 799, w: 100, h: 31.5 },
  { num: 115, kind: 'rect', x: 40, y: 832, w: 100, h: 31.5 },
  { num: 116, kind: 'rect', x: 40, y: 865, w: 100, h: 31.5 },
  { num: 117, kind: 'rect', x: 40, y: 898, w: 100, h: 31.5 },
  { num: 118, kind: 'rect', x: 40, y: 931, w: 100, h: 31.5 },
  { num: 119, kind: 'rect', x: 40, y: 964, w: 100, h: 31.5 },
] as const;

// Floorplans. `living` es lo único que consume presupuesto; `total` es la
// envolvente construida (living + garage + pórtico + patio + balcón) y solo se
// muestra como referencia.
//
// TH sale íntegro del set arquitectónico del Lote 17, sin estimar nada:
//   906 planta baja + 729 planta alta = 1,635 habitables
//   + 473 garage + 24 pórtico + 80 patio cubierto + 37 balcón = 2,249 total.
//
// B, C y D son las variantes para lotes sin la restricción townhouse. Su
// desglose usa las mismas categorías del set real; los patios de B se ajustaron
// a 6'×6' = 36 ft² (el corredor techado cruza un patio chico, no un patio de
// estar), lo que baja su envolvente de 2,212 a 2,168.
// `incluidas` son zonas que el plano aprobado YA trae, así que su área ya está
// dentro de `living` y no se vuelven a cobrar. En el townhouse del Lote 17 eso
// es el balcón del master (37 ft², puerta corrediza 8'×8' desde la recámara
// principal) y la cocina de concepto abierto al living/dining de doble altura.
//
// `recMin`/`banosMin` son los cuartos y baños que no se pueden quitar. El
// resto sí: liberarlos devuelve sus ft² al presupuesto, que es como el usuario
// cambia una recámara por un game room o un walking closet.
// Solo TH declara zonas incluidas, porque son las que el set arquitectónico del
// Lote 17 realmente trae aprobadas (balcón del master y cocina abierta). B, C y
// D se entregan como lienzo en blanco: el usuario arma sus zonas desde cero.
export const PLANES = {
  TH: { key: 'TH', nombre: 'Townhouse 2 pisos', living: 1635, total: 2249, rec: 3, banos: 3, pisos: 2, fijo: true,  incluidas: ['masterbalcon', 'cocinaabierta'], recMin: 1, banosMin: 2 },
  B:  { key: 'B',  nombre: 'Corredor en patio', living: 1575, total: 2168, rec: 3, banos: 3, pisos: 1, fijo: false, incluidas: [] as string[],                    recMin: 1, banosMin: 2 },
  C:  { key: 'C',  nombre: 'Patio central',     living: 1635, total: 2249, rec: 3, banos: 3, pisos: 1, fijo: false, incluidas: [] as string[],                    recMin: 1, banosMin: 2 },
  D:  { key: 'D',  nombre: '2 pisos',           living: 1780, total: 2394, rec: 4, banos: 3, pisos: 2, fijo: false, incluidas: [] as string[],                    recMin: 1, banosMin: 2 },
} as const;

// Componentes no habitables, con las medidas reales del set del Lote 17.
// El garage es la pieza que más mueve el cálculo, por eso se elige aparte.
export const GARAGE_2_AUTOS = 473;
export const GARAGE_1_AUTO = 240;
export const PORCHE = 24;

// Retiros (setbacks) por default. NO son el reglamento verificado de ninguna
// ciudad: son valores de arranque razonables para lote residencial del Valle,
// editables por el usuario en el paso 1. El cálculo de superficie construible
// sale de aquí, así que si el municipio pide otros hay que capturarlos.
export const RETIROS_DEFAULT = { frente: 25, fondo: 20, lados: 6 };

export type Retiros = { frente: number; fondo: number; lados: number };

// Huella construible en planta baja: el terreno menos los retiros. Es el tope
// físico real de lo que se puede desplantar, y de ahí sale todo lo demás.
export function huellaConstruible(frenteFt: number, fondoFt: number, r: Retiros) {
  const ancho = Math.max(0, frenteFt - r.lados * 2);
  const largo = Math.max(0, fondoFt - r.frente - r.fondo);
  return Math.round(ancho * largo);
}

// Cuartos y baños que el usuario puede sumar o quitar en el paso 5. Las medidas
// salen del set del Lote 17: recámara 2/3 = 10'6"×10'0" = 105 ft²; baño
// secundario ≈ 50 ft². Quitar uno libera sus ft² para gastarlos en otra zona.
export const EXTRAS = {
  recamara: { key: 'recamara', nombre: 'Recámara', living: 105, nota: '10’6×10’0 — medida real del set arquitectónico', max: 3 },
  bano:     { key: 'bano',     nombre: 'Baño',     living: 50,  nota: 'Baño secundario del set arquitectónico', max: 3 },
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

type Modulo = {
  key: string;
  nombre: string;
  corto: string;
  rango: string;
  area: string;
  prop: string;
  min: number;
  nota: string;
  grupo?: string;
  requiere?: string;
  // Zona exterior: ocupa terreno pero no área habitable, así que no consume
  // presupuesto. `living` permite separar la parte techada de la exterior
  // cuando el módulo tiene las dos (p. ej. master + balcón).
  exterior?: boolean;
  living?: number;
  // Compatibilidad con el floorplan: un balcón necesita planta alta, y un
  // master abierto al patio necesita que el plano tenga patio.
  minPisos?: number;
  soloEnPlanes?: string[];
};

// Área habitable que consume un módulo. Las zonas exteriores no consumen.
export function livingDeModulo(m: Modulo): number {
  if (m.exterior) return 0;
  return m.living ?? m.min;
}

export const MODULOS: Modulo[] = [
  { key: 'office', nombre: 'Home office junto a la entrada', corto: 'Home office', rango: '10×12 – 12×14', area: '120–168', prop: '5:6', min: 120, nota: '' },
  { key: 'bonus', nombre: 'Bonus / game room', corto: 'Bonus room', rango: '14×16 – 16×20', area: '224–320', prop: '4:5', min: 224, nota: '' },
  { key: 'scullery', nombre: 'Walking pantry', corto: 'Walking pantry', rango: '8×10 – 10×12', area: '80–120', prop: '4:5', min: 80, nota: '' },
  { key: 'mudroom', nombre: 'Mudroom desde el garage', corto: 'Mudroom', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: '' },
  { key: 'rec2', nombre: 'Recámara secundaria', corto: 'Recámara 2', rango: '10’6×10’0 (real, set arquitectónico Lote 17)', area: '105', prop: '21:20', min: 105, nota: 'Recámara 2/3 reales del townhouse — ya no se infla a 132–168 ft²' },

  // Variantes de floorplan (consumen del mismo presupuesto; algunas son mutuamente excluyentes o requieren otra zona)
  { key: 'cocinaabierta', nombre: 'Cocina concepto abierto', corto: 'Cocina abierta', rango: 'sin muros extra', area: '168', prop: '3:4', min: 168, nota: '', grupo: 'cocina' },
  { key: 'cocinacerrada', nombre: 'Cocina concepto cerrado', corto: 'Cocina cerrada', rango: '168 + 56 de muros', area: '224', prop: '3:4', min: 224, nota: 'Incluye muros y circulación extra', grupo: 'cocina' },
  { key: 'masterpatio', nombre: 'Master con conexión al patio', corto: 'Master + patio', rango: 'recámara estándar', area: '224', prop: '—', min: 224, nota: 'Se abre al patio del floorplan', grupo: 'master', soloEnPlanes: ['B', 'C'] },
  { key: 'masterbalcon', nombre: 'Master con balcón', corto: 'Master + balcón', rango: 'balcón real 4’3×8’8 (37 ft²)', area: '261', prop: 'balcón 1:2', min: 261, living: 224, nota: 'Del total, 37 ft² son balcón: no consumen área habitable', grupo: 'master', minPisos: 2 },

  // Zonas opcionales (add-on sobre el presupuesto restante)
  { key: 'walkingcloset', nombre: 'Walking closet secundario', corto: 'Walking closet', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: 'El closet del master ya está incluido' },
  { key: 'alberca', nombre: 'Alberca con deck perimetral', corto: 'Alberca', rango: '12×24 – 16×32', area: '400–700', prop: '1:2', min: 400, nota: 'Zona exterior: ocupa terreno, no área habitable', exterior: true },
  { key: 'bbq', nombre: 'Zona BBQ compacta', corto: 'Zona BBQ', rango: '8×8 – 10×10', area: '64–100', prop: '1:1', min: 64, nota: 'Zona exterior: ocupa terreno, no área habitable', exterior: true },
  { key: 'sunkenlounge', nombre: 'Sunken lounge en el gran salón', corto: 'Sunken lounge', rango: '+100–150 sobre el salón', area: '100–150', prop: '—', min: 100, nota: 'Rebaje de piso, no es un cuarto nuevo' },
  { key: 'storage', nombre: 'Storage', corto: 'Storage', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: '' },
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
