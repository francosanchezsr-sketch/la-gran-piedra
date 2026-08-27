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
// el usuario subió en la pantalla previa — por eso el tipo es estructural.
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
  /**
   * En townhouse la fachada tampoco se elige: la subdivisión la trae ya
   * definida y aprobada, igual que el floorplan. Con esto el paso de fachada
   * desaparece del recorrido en vez de mostrarse apagado — un paso entero en
   * gris que nunca se puede tocar es peor que no tenerlo.
   */
  fachadaFija: boolean;
  /** Por qué no se elige. La UI nunca apaga algo sin decir esto. */
  motivoFachada: string;
}> = {
  townhouse: {
    // La casa viene diseñada por default; el floorplan no se elige.
    planes: ['TH'],
    // Sin patio central ni alberca: no hay servidumbre lateral ni trasera que
    // los admita en un lote de 32.5'–33' de frente pegado a sus vecinos.
    zonasBloqueadas: ['alberca', 'masterpatio'],
    motivo: 'No permitido por reglas de la subdivisión en lotes townhouse',
    fachadaFija: true,
    motivoFachada: 'La casa del townhouse se entrega con su fachada ya diseñada y aprobada por la subdivisión',
  },
  libre: {
    planes: ['B', 'C', 'D'],
    zonasBloqueadas: [],
    motivo: '',
    fachadaFija: false,
    motivoFachada: '',
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
    // Las imágenes de la tarjeta de "Lugares disponibles", en orden.
    //
    // El `tipo` no es decorativo: gobierna el rótulo. La foto de acceso es obra
    // real y no lleva ninguno; el render sí, y dice que es un render. La sección
    // vecina promete "sin render que prometa lo que no se entrega", así que una
    // imagen sintética sin marcar aquí contradiría al sitio dos pantallas más
    // abajo. Quien añada una imagen aquí declara qué es.
    imagenes: [
      { src: '/subdivision/enclave-entrada.jpg', alt: 'Acceso de Enclave on 107', tipo: 'foto' },
      { src: '/subdivision/casa-modelo-render.jpg', alt: 'Render del townhouse modelo de Enclave on 107: fachadas en madera, estuco blanco y cochera negra', tipo: 'render' },
    ],
  },
] as const;

export type SubdivisionKey = (typeof SUBDIVISIONES)[number]['key'];

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

// Componentes no habitables. El garage es la pieza que más mueve el cálculo,
// por eso se elige aparte.
//
// Los siete sets de `planos para base de datos/` que traen tabla de áreas dan
// un garage de dos autos entre 393 y 431 ft². Ninguno llega a 500. La mediana
// es 418.55 (Lot 76) y se redondea a 419.
//
//   Lot 124 393 · Imperial Oaks 404 · Shary 406 · Lot 76 418.55
//   Lot 77 425.78 · Montecito 37 427 · New Frontier 430.90
//
// El 500 que había aquí no sale de ningún plano: estaba 16 % arriba del garage
// más grande que LGP ha construido, y ese exceso se le restaba al presupuesto
// habitable del cliente. El townhouse del Lote 17 sigue con su 473 propio.
export const GARAGE_2_AUTOS = 419;
export const GARAGE_1_AUTO = 250; // de data.ts original — ningún set trae cochera de un auto
export const GARAGE_2_TOWNHOUSE = 473;

// Pórtico / entrada cubierta. Rango real de los siete sets: 34.67 (Lot 77) a
// 80 (Shary 200), mediana 62.24 (Lot 76). El 24 que había aquí está por debajo
// del pórtico más chico que existe en los planos.
export const PORCHE = 62;

// Patio cubierto. Los SIETE sets con tabla de áreas lo traen — no hay uno solo
// sin él. Rango 86.88 a 125 ft², mediana 103.33. Ocupa huella y no es habitable,
// así que tenía que entrar al cálculo: antes no existía y esos ft² se le
// prometian al cliente como área habitable.
export const PATIO_CUBIERTO = 103;

// Clóset del equipo de aire. Cuatro de los ocho sets le dan uno interior
// (10.0 a 16.1 ft², mínimo 3'-0" x 3'-4"), y los planos piden además 30" libres
// de servicio frente a los controles (IRC M1305). Vive DENTRO del habitable:
// no se resta aparte, se declara para que el arquitecto lo reserve.
export const CLOSET_AC = 11;

// Retiros (setbacks) por default. SIGUEN SIENDO UN SUPUESTO — el plat de cada
// subdivisión manda sobre la ordenanza municipal, y ni siquiera es constante
// dentro de una misma subdivisión — pero ya no son inventados: son la mediana
// de los cinco site plans acotados de `planos para base de datos/`.
//
//   frente  10, 18, 18, 20, 20  -> mediana 18   (Lot 124, Lot 76, Lot 77, Montecito 37, New Frontier)
//   fondo   15, 15, 15, 20, 20  -> mediana 15
//   lados    5,  5,  5,  6,  6  -> mediana 5
//
// El 25 de frente que había aquí NO aparece en ninguno de los cinco: el máximo
// observado es 20. Con 25 el envolvente se sub-estimaba ~5 ft x el ancho del lote.
export const RETIROS_DEFAULT = { frente: 18, fondo: 15, lados: 5 };

export type Retiros = { frente: number; fondo: number; lados: number };

// Huella construible en planta baja: el terreno menos los retiros. Es el tope
// LEGAL de lo que se puede desplantar — no lo que de verdad se desplanta.
export function huellaConstruible(frenteFt: number, fondoFt: number, r: Retiros) {
  const ancho = Math.max(0, frenteFt - r.lados * 2);
  const largo = Math.max(0, fondoFt - r.frente - r.fondo);
  return Math.round(ancho * largo);
}

// ---------- lo que de verdad se desplanta ----------
// EL ENVOLVENTE NUNCA SE LLENA. Los recortes de patio, el hueco del pórtico y
// la entrada cubierta se comen entre 16 % y 20 % en un lote apretado. Con sus
// retiros reales:
//
//   Lot 77   1,993 ft² desplantados de 2,480 de envolvente  -> 80.4 %
//   Lot 76   2,080 de 2,480                                  -> 83.9 %
//   Lot 124  2,231 de 3,078 (lote en esquina, más holgado)   -> 72.5 %
//   Mont. 37 2,265 de ~4,320 (lote grande)                   -> 52.4 %
//
// NO es un solo número, y tratarlo como tal fue el error original. Son dos, y
// la diferencia entre ellos es exactamente la lección del Lot 76:
//
//   `tipica` (0.82) — lo que LGP construye normalmente en un lote apretado.
//   `techo`  (0.839) — lo máximo que se ha llenado NUNCA, que es el Lot 76.
//
// Y el Lot 76 salió con los clósets chicos justamente por eso: su programa
// exigía más de lo que el lote daba cómodo, y el clóset fue lo que cedió. Por
// eso el presupuesto se calcula con `tipica` y el `techo` se enseña aparte, con
// su advertencia — no como una meta a la que empujar al cliente.
export const OCUPACION = { tipica: 0.82, techo: 0.839 };

// Lo que cada lote llegó a ocupar de su envolvente, con los retiros de su plat.
// Sirve para poder decirle al cliente "tu caso se parece a este".
export const OCUPACION_REAL = [
  { proyecto: 'Montecito 37', nota: '60×130, holgado', valor: 0.524 },
  { proyecto: 'Lot 124', nota: 'esquina con chaflán', valor: 0.725 },
  { proyecto: 'Lot 77', nota: '50×95', valor: 0.804 },
  { proyecto: 'Lot 76', nota: '50×95, el más lleno', valor: 0.839 },
] as const;

// Los siete sets con tabla de áreas, para poder contrastar contra ellos.
// habitable / huella cae SIEMPRE entre 71.3 % y 76.2 % (media 74.2): tres
// despachos, cuatro años, ocho geometrías de lote, ±3 puntos. Es el hallazgo
// más estable de todo el análisis.
export const SETS_CONSTRUIDOS = [
  { id: 'lot76',  nombre: 'Lot 76',            hab: 1511.83, huella: 2079.51 },
  { id: 'lot77',  nombre: 'Lot 77',            hab: 1420.75, huella: 1993.49 },
  { id: 'lot124', nombre: 'Lot 124',           hab: 1681,    huella: 2231 },
  { id: 'mc37',   nombre: 'Montecito 37',      hab: 1672,    huella: 2265 },
  { id: 'nf24',   nombre: 'New Frontier 24',   hab: 1860.88, huella: 2459.90 },
  { id: 'io',     nombre: 'Imperial Oaks',     hab: 1672,    huella: 2242 },
  { id: 'shary',  nombre: 'Shary Estates 200', hab: 1850,    huella: 2428 },
] as const;

// Se derivan, nunca se escriben a mano: redondear una banda a mano ya produjo
// una vez un mensaje que se contradecía solo ("sale al 71.3 %, por debajo del
// mínimo de 71.3 %").
export const BANDA_HABITABLE = {
  min: Math.min(...SETS_CONSTRUIDOS.map((s) => s.hab / s.huella)),
  max: Math.max(...SETS_CONSTRUIDOS.map((s) => s.hab / s.huella)),
};

// El habitable de las siete casas: 1,420.75 a 1,860.88. Sirve para avisar
// cuando el lote deja de ser lo que limita la casa — en un lote de 70x140 la
// cuenta da 4,680 ft² habitables, más del doble de la casa más grande que LGP
// ha construido. Ahí el límite ya no es el terreno sino el presupuesto de obra,
// y decirlo es más honesto que enseñar un número que nadie ha construido.
export const HABITABLE_CONSTRUIDO = {
  min: Math.min(...SETS_CONSTRUIDOS.map((s) => s.hab)),
  max: Math.max(...SETS_CONSTRUIDOS.map((s) => s.hab)),
};

// Las siete huellas caen entre 1,993 y 2,460 ft² sobre lotes de 4,750 a 7,600.
// El tamaño de la casa lo fija el programa, no el terreno: por eso este rango
// sirve de prueba de cordura de cualquier combinación que arme el cliente.
export const HUELLA_CONSTRUIDA = {
  min: Math.min(...SETS_CONSTRUIDOS.map((s) => s.huella)),
  max: Math.max(...SETS_CONSTRUIDOS.map((s) => s.huella)),
};

/**
 * Los ft² que la casa apoya de verdad en el suelo, a partir del envolvente
 * legal. No es lo mismo que `huellaConstruible`: aquella dice hasta dónde deja
 * el municipio, esta dice hasta dónde llega una casa de LGP.
 */
export function huellaDesplantada(envolventeFt2: number, modo: 'tipica' | 'techo' = 'tipica') {
  return Math.round(envolventeFt2 * OCUPACION[modo]);
}

/**
 * Qué porcentaje del envolvente exige una huella dada. Es la cadena corrida al
 * revés, que es como la corre un arquitecto: no "cuánto cabe aquí" sino "esto
 * que el cliente pidió, ¿qué le exige al terreno?". Arriba de `techo` no cabe;
 * cerca de `techo` cabe pero apretado, y eso hay que decirlo.
 */
export function ocupacionExigida(huellaFt2: number, envolventeFt2: number) {
  return envolventeFt2 > 0 ? huellaFt2 / envolventeFt2 : Infinity;
}

// Cuartos y baños que el usuario puede sumar o quitar en el paso 5.
//
// La recámara pasó de 105 a 132 ft². El 105 salía de UN set (el Lote 17,
// 10'6"x10'0") y resultó ser el cuarto MÁS CHICO de los once medidos en los
// ocho sets — no el estándar. Las once: 105.4, 122.8, 128.4, 130.3, 132.0,
// 132.2, 138.1, 140.7, 140.7, 142.2, 157.5. Mediana 132.2.
//
// El baño pasó de 50 a 55: mediana de seis baños estándar (41.8 a 68.0).
//
// Los dos son el CUARTO SOLO. El clóset va aparte (ver CLOSET_RECAMARA) y la
// circulación para llegar tampoco está incluida.
export const EXTRAS = {
  recamara: { key: 'recamara', nombre: 'Recámara', living: 132, nota: 'Mediana de 11 recámaras de los sets construidos', max: 3 },
  bano:     { key: 'bano',     nombre: 'Baño',     living: 55,  nota: 'Mediana de 6 baños estándar de los sets construidos', max: 3 },
} as const;

// Clóset de recámara. PISO ABSOLUTO 15.3 ft² — el del Lot 76, que el cliente
// marcó como error por chico (7'-8" x 2'-0", el único bajo 2'-3½" de fondo en
// los ocho sets). Lo recomendado es la mediana de los otros siete: 18.3.
export const CLOSET_RECAMARA = { min: 15.3, recomendado: 18.3 };
export const CLOSET_MASTER = { min: 40.4, recomendado: 50.1 };

// ---------- dos plantas ----------
// Del Lot 17 (Enclave on 107), el único set de dos plantas de la base. Es UN
// caso, no un estándar — pero es lo único medido que existe y sin ello una casa
// de dos plantas sale sistemáticamente más barata de lo que cuesta.
//
// La escalera se paga DOS VECES: abajo los escalones, arriba el hueco con
// barandal. 11'-2" x 7'-2" = 80 ft² por planta, 160 en total — casi el 10 % del
// habitable de esa casa.
export const ESCALERA_POR_PLANTA = 80;

// Y el habitable NO se parte 50/50: el Lot 17 hace 906 abajo y 729 arriba
// porque living, dining y foyer van a doble altura y se comen 177 ft² de planta
// alta. Un vacío se paga dos veces: ocupa abajo y quita arriba.
export const REPARTO_PLANTA_BAJA = 906 / 1635; // 0.554

// El balcón del Lot 17 es CANTILEVER: 37 ft² de exterior con cero huella. Es la
// única zona exterior de toda la base que no gasta lote.
export const BALCON = 37;

/**
 * Cuánto crece de verdad una casa al ganar una recámara: no solo el cuarto y su
 * clóset, también su parte de sala, cocina, baño y pasillo. Se cobra la DENSIDAD
 * DEL PLANO ELEGIDO, que es la proporción que ese plano ya tiene.
 *
 * `EXTRAS.recamara.living` (132) es el CUARTO SOLO — unidad de presupuesto, no
 * predictor. Usarlo para agregar cuartos da casas que no existen: 11 recámaras
 * salían en 2,704 ft² cuando por densidad son ~4,900. En las nueve casas
 * construidas cada recámara arrastra entre 463 y 560 ft².
 */
export function ftPorRecamara(planKey: keyof typeof PLANES) {
  const p = PLANES[planKey];
  return Math.round(p.living / p.rec);
}

export const FACHADAS = [
  // Las `key` NO se renombran aunque el nombre visible sí: son lo que se guarda
  // en localStorage, así que cambiarlas dejaría inservible la configuración a
  // medias de cualquier cliente que vuelva. 'piedra' y 'negro' ya no describen
  // su estilo, pero son identificadores, no texto de pantalla.
  { key: 'esc', nombre: 'Escandinavo', desc: 'Volumen blanco, ventanal corrido, alero mínimo.', slot: 'RENDER FACHADA A' },
  { key: 'farm', nombre: 'Farm style', desc: 'Dos aguas marcadas, lámina negra, madera cálida.', slot: 'RENDER FACHADA B' },
  { key: 'piedra', nombre: 'Moderno', desc: 'Muro de piedra caliza local y estuco liso.', slot: 'RENDER FACHADA C' },
  { key: 'negro', nombre: 'Mediterráneo', desc: 'Estuco carbón, celosía geométrica de concreto.', slot: 'RENDER FACHADA D' },
];

// Paletas de interior. Son las seis que el cliente aprobó, y cada una tiene su
// maqueta de cocina ya renderizada — la cocina es la vitrina donde se ve la
// paleta, no el único cuarto al que aplica: de aquí salen carpintería, piedra y
// piso de toda la casa.
//
// `key` es el `slug` de `scripts/cocina/paletas.js`, que es también el nombre
// del archivo del sprite. Un solo identificador para el dato, la imagen y el
// guardado en `localStorage`: si mañana se regenera una paleta, no hay dos
// nombres que sincronizar.
//
// c1/c2/c3 son los tres materiales que definen la paleta de un vistazo
// —gabinete, cubierta y piso—, extraídos de esos mismos hex. Es la muestra
// preliminar de la fila; la maqueta es la que enseña el resultado.
//
// SUPUESTO VISIBLE: los hex vienen muestreados de los bocetos a color del
// cliente, no de una carta de color suya. Los renders ya se aprobaron sobre esa
// muestra, pero el valor exacto sigue pendiente de confirmar.
export const INTERIORES = [
  { key: 'nogal-marmol', nombre: 'Nogal + Mármol Crema', desc: 'Nogal cálido, mármol crema veteado y loseta gris. Herrajes en negro mate.', c1: '#BD8E70', c2: '#EFE7DA', c3: '#9B9B9F' },
  { key: 'nogal-oscuro-blanco', nombre: 'Nogal Oscuro + Blanco', desc: 'Nogal oscuro contra cuarzo blanco y loseta gris. Herrajes en negro mate.', c1: '#6B4726', c2: '#FAFAF8', c3: '#B9B9BC' },
  { key: 'olivo-dorado', nombre: 'Verde Olivo + Dorado', desc: 'Verde olivo con cuarzo crema, duela de madera y herrajes en dorado cepillado.', c1: '#6E7458', c2: '#DCD3C4', c3: '#A97E56' },
  { key: 'crema-laton', nombre: 'Crema + Latón', desc: 'Tono sobre tono: gabinete crema, cuarzo arena liso, duela y latón champagne.', c1: '#D5CEC2', c2: '#E2D9C6', c3: '#A97E56' },
  { key: 'azul-acero-dorado', nombre: 'Azul Acero + Dorado', desc: 'Azul acero con cuarzo gris liso, duela de madera y herrajes dorados.', c1: '#6E88A8', c2: '#C9C9CB', c3: '#A97E56' },
  { key: 'blanco-cuarzo-gris', nombre: 'Blanco + Cuarzo Gris', desc: 'Se invierte el esquema: el mueble es lo claro y la piedra lo oscuro. Herrajes negro mate.', c1: '#E2E0DC', c2: '#9B9B99', c3: '#CCCAC6' },
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
  { key: 'bonus', nombre: 'Game room', corto: 'Game room', rango: '14×16 – 16×20', area: '224–320', prop: '4:5', min: 224, nota: '' },
  { key: 'scullery', nombre: 'Walking pantry', corto: 'Walking pantry', rango: '8×10 – 10×12', area: '80–120', prop: '4:5', min: 80, nota: '' },
  { key: 'mudroom', nombre: 'Mudroom desde el garage', corto: 'Mudroom', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: '' },
  // 'rec2' se quitó del catálogo de zonas: las recámaras se suben y bajan con
  // el contador del paso 3, y tenerlas también aquí eran dos formas distintas
  // de pedir lo mismo, con el mismo costo en ft².
  // Cuarto sin uso asignado: gym, visitas, taller, lo que el cliente decida.
  // Se dimensiona al mínimo de un cuarto habitable (70 ft², 7 ft en cualquier
  // dimensión) porque lo que importa aquí es cuánta área living se lleva; el
  // uso final se define con el arquitecto a partir del brief.
  { key: 'comodin', nombre: 'Comodín room', corto: 'Comodín room', rango: '7×10 mínimo — gym, visitas, taller, lo que decidas', area: '70+', prop: '7:10', min: 70, nota: 'Cuéntanos en el brief para qué lo quieres y el arquitecto lo aterriza contigo' },

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
  { q: '¿Qué pasa con lo que escribo en el brief?', a: 'Llega tal cual al arquitecto, con tus palabras. No lo resumimos ni lo interpretamos: es lo que se platica contigo en la cita. Las zonas las eliges tú en el paso 4, con el presupuesto de pies cuadrados a la vista.' },
  { q: '¿Los lotes son de ustedes?', a: 'Sí. Enclave on 107 en McAllen es nuestra subdivisión, lo que nos permite garantizar reglas de diseño y evitar sorpresas de servidumbres o permisos.' },
  { q: '¿Trabajan con financiamiento?', a: 'Trabajamos con prestamistas de construcción locales del Valle. Te conectamos, pero el crédito lo contratas tú directo — nosotros no cobramos comisión por eso.' },
  { q: '¿Qué incluye el smart home?', a: 'Clima por zonas, control de accesos, riego, iluminación e infraestructura de red, todo cableado desde obra gris. Sin adhesivos ni dispositivos improvisados al final.' },
  { q: '¿Construyen fuera del Rio Grande Valley?', a: 'Hoy operamos en McAllen, Edinburg y Mission. Tenemos visión de crecer a otros mercados de Texas — si tu terreno está fuera del Valle, escríbenos y lo evaluamos caso por caso.' },
];

// WhatsApp del negocio, para el botón del cierre de la página.
//
// El número vive en variable de entorno y no en el código por una razón dura:
// hoy NO hay número real. El `(956) 000 0000` del pie es relleno, y un botón de
// WhatsApp que abre un chat con un número inventado es peor que no tener botón
// — el cliente escribe, nadie contesta, y la primera impresión ya se gastó.
// Mientras `NEXT_PUBLIC_LGP_WHATSAPP` esté vacía el botón no se dibuja en
// producción; en desarrollo sí aparece, apagado y diciendo qué le falta, para
// que no se olvide.
//
// Formato: código de país y dígitos, que es lo que pide wa.me (`19561234567`).
// `whatsappHref` limpia todo lo que no sea dígito, así que también acepta
// "+1 (956) 123-4567" tal como se copia del teléfono.
export const WHATSAPP = (process.env.NEXT_PUBLIC_LGP_WHATSAPP ?? '').replace(/\D/g, '');

// El mensaje ya escrito le quita al cliente el trabajo de arrancar la
// conversación, y de paso le dice a quien contesta de dónde viene.
export const WHATSAPP_MENSAJE =
  'Hola, los encontré en su página y quiero platicar sobre mi casa.';

export function whatsappHref(mensaje: string = WHATSAPP_MENSAJE): string | null {
  if (!WHATSAPP) return null;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}

export const NAV = [
  { label: 'Índice', id: 'index' },
  { label: 'Lugares', id: 'lugares' },
  { label: 'Personaliza', id: 'personaliza' },
  { label: 'Nosotros', id: 'nosotros' },
  { label: 'FAQ', id: 'faq' },
  { label: 'Contacto', id: 'contacto' },
];

// El brief va después de las zonas: solo tiene sentido comentar sobre una
// combinación que el usuario ya armó.
// El resumen va ANTES de pedir datos: el cliente ve lo que armó y decide si le
// gusta, y solo entonces se le piden nombre y teléfono. Pedirlos antes de
// enseñarle el resultado es cobrar por adelantado.
// El lote dejó de ser un paso: quien entra por la subdivisión ya lo trae
// resuelto, y quien trae el suyo lo captura en una pantalla previa, antes de
// que el contador empiece. El configurador arranca donde empieza la casa.
export const PASO_NOMBRES = ['Floorplan', 'Fachada', 'Interior y zonas', 'Brief', 'Tu casa', 'Tus datos'];
export const PASO_HINTS = [
  'Variantes curadas para tu lote',
  'Selecciona un estilo de fachada',
  'Elige tu paleta y arma tus zonas',
  'Comenta o pide algo especial, o sáltalo',
  'Así quedó tu casa',
  'Solo pedimos datos al final',
];
