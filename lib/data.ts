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
  /**
   * Cómo se nombran las medidas del lote en pantalla. Existe porque un lote
   * TRAZADO no tiene frente × fondo: tiene cinco lados, una curva y un canto
   * diagonal, y escribir "— × —" ahí se lee como un dato que se perdió. Solo
   * lo llenan los lotes que no son rectángulos; el resto sigue armando la
   * cadena con frente y fondo como siempre.
   */
  medida?: string;
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
    planes: ['A', 'B', 'C', 'D'],
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
// principal). La cocina de concepto abierto también viene en ese plano, pero
// dejó de ser una zona del catálogo —el cliente no elige entre abierta y
// cerrada— así que ya no se declara aquí.
//
// `recMin`/`banosMin` son los cuartos y baños que no se pueden quitar. El
// resto sí: liberarlos devuelve sus ft² al presupuesto, que es como el usuario
// cambia una recámara por un game room o un walking closet.
// Solo TH declara zonas incluidas, porque son las que el set arquitectónico del
// Lote 17 realmente trae aprobadas. B, C y D se entregan como lienzo en blanco:
// el usuario arma sus zonas desde cero.
export const PLANES = {
  TH: { key: 'TH', nombre: 'Townhouse 2 pisos', living: 1635, total: 2249, rec: 3, banos: 3, pisos: 2, fijo: true,  incluidas: ['masterbalcon'], recMin: 1, banosMin: 2 },
  B:  { key: 'B',  nombre: 'Corredor en patio', living: 1575, total: 2168, rec: 3, banos: 3, pisos: 1, fijo: false, incluidas: [] as string[],                    recMin: 1, banosMin: 2 },
  C:  { key: 'C',  nombre: 'Patio central',     living: 1635, total: 2249, rec: 3, banos: 3, pisos: 1, fijo: false, incluidas: [] as string[],                    recMin: 1, banosMin: 2 },
  D:  { key: 'D',  nombre: '2 pisos',           living: 1780, total: 2394, rec: 4, banos: 3, pisos: 2, fijo: false, incluidas: [] as string[],                    recMin: 1, banosMin: 2 },
  // El plano compacto. Su patio son los 86.88 ft² del recorte en U trasero del
  // Lot 76 — el más chico de los siete sets con tabla de áreas— y por eso es el
  // que más casa deja sobre el mismo terreno: 16 ft² más que el patio cubierto
  // mediano, 21 más que el patio central y 113 más que los dos patios.
  A:  { key: 'A',  nombre: 'Patio techado atrás', living: 1512, total: 2081, rec: 3, banos: 2, pisos: 1, fijo: false, incluidas: [] as string[],                   recMin: 1, banosMin: 1 },
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
export const GARAGE_2_TOWNHOUSE = 473;

// Cochera de uno y de tres autos: NINGÚN set de la base trae una. Los siete
// medidos son de dos autos. Así que estos dos números no son medidos — se
// derivan de la geometría que sí lo está, y salen marcados como supuesto en
// pantalla.
//
// El fondo es el mismo para las tres: un coche mide lo que mide. De los siete
// sets, ancho interior típico 19'-8" y área mediana 419 ft² → fondo 21'-4"
// (419 ÷ 19.667). Ese fondo cae dentro del rango medido de 20'-0" a 21'-11".
//
//   Cajón suelto = 9'-10" × 21'-4" = 209 ft²  (medio ancho interior medido)
//
//   1 auto  12'-0" × 21'-4" = 256   el ancho no se puede sacar partiendo el
//                                   doble a la mitad: dos coches comparten la
//                                   circulación del centro y uno solo no. 12'-0"
//                                   es la puerta de 9' que sí está medida
//                                   (Montecito 14) más sus jambas. SUPUESTO.
//   3 autos 29'-6" × 21'-4" = 628   los 419 medidos más un cajón. SUPUESTO,
//                                   pero el más firme de los dos: solo extiende
//                                   el módulo que ya está en los planos.
export const GARAGE_1_AUTO = 256;
export const GARAGE_3_AUTOS = 628;

/**
 * Las tres cocheras que se le ofrecen al cliente. El configurador enseñaba
 * "2 autos" en el resumen como si fuera una elección y nunca hubo dónde
 * cambiarlo; esta tabla es lo que alimenta ese control.
 */
export const CAJONES_GARAGE = [
  {
    cajones: 1,
    titulo: 'Un auto',
    ft2: GARAGE_1_AUTO,
    medida: '12′ × 21′4″',
    nota: 'Lo que más te deja de casa. Un solo coche bajo techo.',
    supuesto: true,
  },
  {
    cajones: 2,
    titulo: 'Dos autos',
    ft2: GARAGE_2_AUTOS,
    medida: '19′8″ × 21′4″',
    nota: 'Lo que llevan las siete casas que ya construimos. Es lo normal aquí.',
    supuesto: false,
  },
  {
    cajones: 3,
    titulo: 'Tres autos',
    ft2: GARAGE_3_AUTOS,
    medida: '29′6″ × 21′4″',
    nota: 'Dos coches y un lugar de sobra para camioneta, taller o bodega.',
    supuesto: true,
  },
] as const;

/** ft² de cochera según cuántos cajones pidió el cliente. */
export function garageFt2(cajones: number): number {
  return (CAJONES_GARAGE.find((g) => g.cajones === cajones) ?? CAJONES_GARAGE[1]).ft2;
}

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

// ---------- retiros por ciudad del Rio Grande Valley ----------
// NO hay un solo número correcto para el RGV. Sobre un mismo lote la zona
// construible se mueve más de 1,000 ft² según qué juego se aplique, así que
// preguntar la ciudad no es un lujo: es la diferencia entre un número que
// sirve y uno decorativo.
//
// ⚠️ ESTA TABLA ESTÁ DUPLICADA a propósito en `public/trazador/index.html`
// (`PRESETS_RETIROS`), porque ese archivo se sirve como HTML estático y no
// puede importar de aquí. **Si se corrige un número, se corrige en los dos**
// — si divergen, el mismo lote da dos áreas distintas según por qué camino
// entre el cliente, que es justo la contradicción que esta tabla vino a
// quitar. El trazador usa además `esquina` y `cochera`, que solo tienen
// sentido sobre una forma trazada; el camino rectangular usa los tres de
// `Retiros`.
//
// Lo que MANDA no es la ordenanza sino el plat: las Reglas de Subdivisión de
// Hidalgo County exigen que los retiros cumplan con el plano de la
// subdivisión. Por eso la ciudad es un punto de partida declarado, no una
// respuesta — y por eso cada renglón lleva su `fuente`.
export type PresetRetiros = {
  id: string;
  ciudad: string;
  /** Cómo se le habla al cliente: "Ya aparté lo que McAllen te obliga a dejar". */
  nombreCorto: string | null;
  retiros: Retiros;
  /** Fracción del lote que la ciudad deja cubrir. null = sin tope publicado. */
  coberturaMax: number | null;
  fuente: string;
  /** La salvedad de esa ciudad. Sale impresa en el resultado, nunca se calla. */
  nota: string | null;
};

export const PRESETS_RETIROS: PresetRetiros[] = [
  {
    id: 'mcallen',
    ciudad: 'McAllen',
    nombreCorto: 'McAllen',
    retiros: { frente: 25, fondo: 10, lados: 6 },
    coberturaMax: null,
    fuente: 'Ordenanza de McAllen, distrito R-1 (§ 138-356)',
    nota: 'La ordenanza dice "o más si hay servidumbre" en cada retiro — manda el mayor, nunca la suma.',
  },
  {
    id: 'mission',
    ciudad: 'Mission',
    nombreCorto: 'Mission',
    retiros: { frente: 20, fondo: 10, lados: 6 },
    coberturaMax: null,
    fuente: 'Código de Mission, distrito R-1 (§ 1.371)',
    nota: null,
  },
  {
    id: 'alton',
    ciudad: 'Alton',
    nombreCorto: 'Alton',
    retiros: { frente: 25, fondo: 20, lados: 6 },
    coberturaMax: 0.35,
    fuente: 'UDC de Alton 2024, tabla § 3.6.3, distrito R-1',
    nota: 'Alton además topa la construcción al 35 % del lote — en un lote chico ese tope manda sobre los retiros. El frente sube a 40′ si tu calle es colectora o mayor.',
  },
  {
    id: 'edinburg-hh',
    ciudad: 'Edinburg',
    nombreCorto: 'Edinburg',
    retiros: { frente: 10, fondo: 15, lados: 5 },
    coberturaMax: null,
    // El chip dice solo "Edinburg", pero estos números salen del plano
    // aprobado de UNA subdivisión, no de la ordenanza municipal. La salvedad
    // vive aquí y en `fuente`, y las dos salen impresas en pantalla.
    nota: 'Estos números salen del plano aprobado de una subdivisión de Edinburg, no de una regla general de la ciudad — otra subdivisión puede pedir otra cosa.',
    fuente: 'Plano aprobado del Lot 124, 4701 S Brazos Rd',
  },
  {
    id: 'san-juan',
    ciudad: 'San Juan',
    nombreCorto: 'San Juan',
    // OJO: estos números NO son de San Juan. Son los de McAllen R-1, y están
    // aquí como punto de partida declarado mientras no se verifique la
    // ordenanza propia de San Juan.
    //
    // Su tabla vive en el eCode360 de la ciudad (código SA6471, "District Use
    // and Area Regulations") y ese sitio bloquea la consulta automática, así
    // que no se pudo leer la fuente oficial. Inventar el número era la otra
    // salida y no es una salida: en este proyecto un retiro sin fuente no se
    // publica. Se hace lo que ya hace "No estoy seguro" — partir de la
    // ordenanza verificada más cercana y decirlo en pantalla.
    //
    // Para cerrarlo hace falta una de dos: abrir el eCode a mano en un
    // navegador, o pedirle la tabla a Planificación de San Juan.
    retiros: { frente: 25, fondo: 10, lados: 6 },
    coberturaMax: null,
    fuente: 'supuesto — referencia de McAllen R-1 (§ 138-356); la ordenanza de San Juan no está verificada',
    nota: 'San Juan publica su propia tabla de retiros y todavía no la hemos verificado contra la fuente oficial. Partimos de McAllen R-1, la ordenanza verificada más cercana del mismo condado, y lo confirmamos con tu plano antes de mover un solo número.',
  },
  {
    id: 'brownsville',
    ciudad: 'Brownsville',
    nombreCorto: 'Brownsville',
    // Verificado en la UDC de la ciudad: frente 25′, lado 5′, trasero 5′, y
    // tope de cobertura del 50 % contando cocheras y bodegas.
    retiros: { frente: 25, fondo: 5, lados: 5 },
    coberturaMax: 0.5,
    fuente: 'UDC de Brownsville (25 nov 2020), § 4.3, distrito R-1',
    // Dos salvedades que no se pueden callar. La segunda es la que más pesa:
    // Brownsville es Cameron County, y toda la lógica de este proyecto sobre
    // "el plat manda" viene de las Reglas de Subdivisión de Hidalgo, que allá
    // no aplican. El plano de la subdivisión sigue mandando, pero por otra
    // regla.
    nota: 'Brownsville topa la construcción al 50 % del lote, contando cochera y bodegas — en un lote chico ese tope manda sobre los retiros. En lote de esquina el frente de la calle secundaria baja a 20′. Y ojo: Brownsville es Cameron County, no Hidalgo, así que aquí manda el plat de tu subdivisión bajo las reglas de ese condado.',
  },
];

// El que no sabe su ciudad NUNCA se queda atorado: se le da el juego
// verificado de la ciudad más grande del Valle como punto de partida y se
// declara como supuesto. Es lo que hace un arquitecto en anteproyecto — no
// inventarse una regla nueva, y tampoco detener el trabajo.
export const PRESET_NO_SE: PresetRetiros = {
  id: 'noSe',
  ciudad: 'No estoy seguro',
  nombreCorto: null,
  retiros: PRESETS_RETIROS[0].retiros,
  coberturaMax: null,
  fuente: 'referencia de McAllen R-1 (§ 138-356) — supuesto, no tu ciudad',
  nota: 'No identificaste tu ciudad: partimos de McAllen R-1, la ordenanza verificada más común del Valle. Lo confirmamos con tu plano — en otra ciudad el número puede moverse más de 1,000 ft².',
};

export const OPCIONES_CIUDAD: PresetRetiros[] = [...PRESETS_RETIROS, PRESET_NO_SE];

export function presetPorId(id: string | null): PresetRetiros | null {
  if (!id) return null;
  return OPCIONES_CIUDAD.find((p) => p.id === id) ?? null;
}

// La ZONA CONSTRUIBLE en planta baja: el terreno menos los retiros. Es el tope
// LEGAL de lo que se puede desplantar — no lo que de verdad se desplanta.
//
// En pantalla esto se llama SIEMPRE "zona construible", nunca "huella": es el
// mismo nombre que usa el trazador (`zonaConstruible`), y antes cada camino le
// decía distinto a la misma cifra. La función conserva `huella` en su nombre
// por historia; el rótulo no la sigue.
//
// `coberturaMax` es el tope de ocupación que publican algunas ciudades (Alton
// topa al 35 % del lote). Cuando existe compite con los retiros y manda el
// más restrictivo de los dos: son dos reglas sobre la misma cosa, no dos
// recortes que se sumen.
export function huellaConstruible(
  frenteFt: number,
  fondoFt: number,
  r: Retiros,
  coberturaMax?: number | null,
) {
  const ancho = Math.max(0, frenteFt - r.lados * 2);
  const largo = Math.max(0, fondoFt - r.frente - r.fondo);
  const porRetiros = ancho * largo;
  const tope = coberturaMax ? frenteFt * fondoFt * coberturaMax : Infinity;
  return Math.round(Math.min(porRetiros, tope));
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
  // `max` es cuántos se pueden AGREGAR sobre la casa de arranque (1 recámara y
  // 1 baño). Cinco lleva el programa hasta seis recámaras, que es donde la
  // calculadora del arquitecto avisa que su desglose empieza a fallar: de seis
  // en adelante una casa ya no tiene UNA sola sala ni UN solo comedor, y
  // seguir sumando de a 170 ft² produciría una casa que no existe. Ahí el
  // programa deja de ser configurable y pasa a ser una plática con el
  // arquitecto. El tope real, antes que éste, es el presupuesto del lote.
  recamara: { key: 'recamara', nombre: 'Recámara', living: 121, nota: 'Recámara de 11 x 11 pies; las once medidas van de 105 a 157', max: 5 },
  bano:     { key: 'bano',     nombre: 'Baño',     living: 55,  nota: 'Mediana de 6 baños estándar de los sets construidos', max: 5 },
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
// ---------- la casa se calcula desde el programa ----------
//
// ANTES el floorplan traía la casa hecha: elegir "Patio central" te daba 1,635
// ft², 3 recámaras y 3 baños, y lo único que podías hacer era agregar encima.
// Eso ponía el programa al revés. El floorplan es la IDEA ORGANIZADORA —dónde
// va el patio, si la casa sube— y el programa lo arma el cliente en el paso de
// cuartos y zonas. El arquitecto acomoda lo demás.
//
// El modelo sale de `scripts/programa.py` de la skill `arquitecto`, que arma la
// casa cuarto por cuarto con las medianas de los nueve sets construidos y le
// suma su 11.5 % de circulación y muros. Sobre esa calculadora el habitable es
// LINEAL en recámaras y baños, y estos tres números la reproducen exacta:
//
//   1 rec / 2 baños  1,242    3 rec / 1 baño   1,521
//   3 rec / 2 baños  1,582    3 rec / 3 baños  1,644
//   6 rec / 2 baños  2,093
//
// La prueba que importa: 3 recámaras y 3 baños dan 1,643, y el "Patio central"
// que LGP construyó de verdad tiene 1,635. El modelo cae a 8 ft² de la casa
// que existe.
// Lo que TODA casa lleva, tenga una recámara o seis. Son las medianas de los
// nueve sets, cada una con cuántos cuartos reales la sostienen: un n de 11 es
// un estándar, un n de 2 es una referencia, y eso hay que poder decirlo si
// alguien pregunta de dónde sale un número.
//
// El `n` es cuántos cuartos reales sostienen cada mediana. NO se enseña en
// pantalla: es un diagnóstico del banco de planos, útil para decidir si un
// número aguanta una decisión de obra, y al cliente que está comprando una
// casa no le dice nada — "solo 2 casos medidos" junto a su medio baño solo
// siembra duda sobre un número que de todos modos no puede evaluar. Vive aquí
// para quien tenga que justificar el dato.
export const NUCLEO_PIEZAS = [
  { nombre: 'Sala',              ft2: 267, n: 5, nota: 'Mucha dispersión: de 204 a 334 ft²' },
  { nombre: 'Comedor',           ft2: 140, n: 4, nota: null },
  { nombre: 'Cocina',            ft2: 126, n: 3, nota: 'El dato más flojo de la base — es referencia, no estándar' },
  { nombre: 'Lavandería',        ft2: 50,  n: 4, nota: null },
  { nombre: 'Despensa',          ft2: 13,  n: 3, nota: null },
  { nombre: 'Clóset del aire',   ft2: 11,  n: 4, nota: 'Va adentro; si no se reserva, termina estorbando' },
] as const;

// El vestíbulo NO va en el núcleo: crece con la casa. Es el espacio que
// reparte hacia los cuartos, así que no tiene sentido cobrarlo entero en una
// casa de una recámara — ahí la entrada se resuelve contra la sala.
//
// Los 74 ft² de mediana salen de casas de tres recámaras, así que se reparten
// entre esas tres: cada recámara carga con su tercio, la principal incluida. En
// una casa de tres el total vuelve a dar 74, que es de donde salió.
export const VESTIBULO_POR_RECAMARA = 74 / 3;

// ---------- lo que una casa grande tiene y una chica no ----------
//
// El desglose cuarto por cuarto suma UNA sala, UN comedor y UNA cocina por más
// recámaras que se agreguen, y por eso se rompe en programas grandes: contra la
// densidad real de las casas construidas (531 ft² por recámara) se quedaba 19 %
// corto en cinco recámaras y 24 % en seis. Una casa de seis recámaras no tiene
// una sola sala.
//
// Se cierra agregando las estancias que ese programa SÍ tendría. Van con el
// mínimo medido de la base y no con la mediana —una segunda sala es más chica
// que la principal— y con eso los cinco tamaños vuelven a caer dentro del 15 %
// de la densidad: 3 rec −3 %, 4 rec 10 %, 5 rec 10 %, 6 rec 12 %.
export const SALA_SEGUNDA = 204;    // sala más chica de los nueve sets (203.6)
export const COMEDOR_DIARIO = 127;  // comedor más chico de los nueve sets (127.4)

/** Las estancias extra que exige un programa de este tamaño. */
export function estanciasDeProgramaGrande(recamaras: number) {
  const out: { nombre: string; ft2: number }[] = [];
  if (recamaras >= 5) out.push({ nombre: 'Segunda sala', ft2: SALA_SEGUNDA });
  if (recamaras >= 6) out.push({ nombre: 'Comedor de diario', ft2: COMEDOR_DIARIO });
  return out;
}

// La primera recámara no es una recámara cualquiera: es la principal, con su
// clóset y su baño. Por eso la casa de una recámara no cuesta lo mismo que
// sumarle una recámara a otra casa.
export const SUITE_PRINCIPAL = { recamara: 187, closet: 50, bano: 95 };
// La recámara secundaria: 121 ft² = 11'-0" x 11'-0".
//
// NO es la mediana. Las once recámaras medidas van de 105.4 a 157.5 con mediana
// 132.2, y ese 132 era lo que se cobraba antes. Se bajó a 121 por decisión del
// cliente, y el número no se inventó: los 11'-0" de ancho caen dentro del rango
// medido (9'-2" a 12'-5½") y los 11'-0" de fondo son exactamente el fondo más
// chico de los once (Lot 77 rec. 3). Es un cuarto más ajustado que la mediana y
// bastante por encima del piso de 105 del Lot 17.
//
// Lo que implica, dicho de frente: el modelo promete un poco MÁS casa por lote
// que antes. Contra la densidad medida de 531 ft² por recámara se queda 13 %
// corto a cinco recámaras y 15 % a seis — justo en el umbral que la skill del
// arquitecto marca para enseñar los dos números. De tres para abajo sigue
// clavado: 3 recámaras y 3 baños dan 1,583 contra los 1,635 del Lote 17
// construido, que además está hecho en medidas mínimas.
export const RECAMARA_EXTRA = { cuarto: 121, closet: 18.3 };
export const BANO_EXTRA = 54.5;

// Circulación y muros: 11.5 % del habitable. La suma de los cuartos NUNCA da el
// habitable — omitirlo produce casas que no existen. Va como divisor y no como
// porcentaje sumado porque el 11.5 % se mide sobre el total, no sobre la suma.
export const CIRCULACION = 0.115;

export const NUCLEO_SUMA = NUCLEO_PIEZAS.reduce((s, x) => s + x.ft2, 0);

/**
 * MEDIDA COMPACTA — el mismo programa, apretado.
 *
 * Sale del set completo del **Lot 35 4-Plex Apartments** (Atwood Village,
 * 918 N. Blair Ave., Edinburg; 2GC Construcción y Diseño, 26 de mayo de 2023).
 * Es vivienda de renta, así que cada cuarto está llevado al mínimo que se
 * construye de verdad — justo lo que hace falta cuando el lote no da para las
 * medianas de casa.
 *
 * El ancla dura es la tabla de la hoja índice: la unidad de 2 recámaras y 2
 * baños mide **902 SF** y la de 2 recámaras con estudio **1,087 SF**. La de 902
 * mide 31'-9" x 28'-5", que da 902.3 — cuadra al pie.
 *
 * Los cuartos salen de las cadenas de cotas de la hoja 1.2:
 *
 *   Sala        12'-2" x 10'-1"   Recámara 1   11'-0" x 10'-1"
 *   Comedor     12'-4" x  9'-0"   Recámara 2    9'-6" x  9'-10"
 *   Cocina      12'-4" x  9'-4"   Baño          5'-4" x  7'-8"
 *   Lavandería   3'-7" x  6'-2"   Clóset        4'-4" x  ~5'
 *
 * Para comparar: la recámara secundaria de la casa cotiza 121 ft² y aquí son
 * 93; la sala mediana son 267 y aquí 123.
 */
export const COMPACTO = {
  sala: 123, comedor: 111, cocina: 115, lavanderia: 22, despensa: 8, closetAire: 9,
  masterRecamara: 111, masterCloset: 22, masterBano: 41,
  recamara: 93, closet: 22, bano: 41,
  vestibuloPorRecamara: 15,
} as const;

/**
 * Circulación de la medida compacta: 18.2 %, contra el 11.5 % de la casa.
 *
 * NO es un supuesto libre: es el factor que hace que el desglose reproduzca las
 * dos áreas que el plano imprime. Con él, 2 recámaras y 2 baños dan 914 ft²
 * contra los 902 impresos, y 3 cuartos con 2 baños dan 1,073 contra 1,087. Los
 * dos dentro del 1.5 %. Un departamento gasta más pasillo por pie que una casa
 * — este set tiene un HALL corrido que sirve a los dos dormitorios— y por eso
 * el factor sube.
 */
export const CIRCULACION_COMPACTA = 0.182;

/**
 * Debajo de esto el lote se considera apretado y el configurador cambia a la
 * medida compacta. Son 2,000 ft² de zona construible: con los retiros típicos
 * del Valle eso es un lote de unos 4,600 ft², que es donde LGP ya ha
 * construido y donde el modelo de medianas contestaba "no cabe".
 */
export const UMBRAL_COMPACTO = 2000;

/**
 * El habitable que pide un programa, armado pieza por pieza.
 *
 * Con 3 recámaras y 3 baños da 1,583 ft² contra los 1,635 del townhouse del
 * Lote 17, que tiene ese mismo programa y está construido: 52 ft² por debajo,
 * que es el lado correcto. Con la recámara a mediana (132) daba 1,643, 8 ft²
 * por encima — y ese exceso era justo lo que impedía armar en el configurador
 * la casa que el arquitecto ya había firmado.
 */
export function habitableDelPrograma(
  recamaras: number,
  banos: number,
  medida: 'holgada' | 'compacta' = 'holgada',
) {
  const rec = Math.max(1, recamaras);
  const ban = Math.max(1, banos);
  if (medida === 'compacta') {
    const c = COMPACTO;
    const crudoC =
      c.sala + c.comedor + c.cocina + c.lavanderia + c.despensa + c.closetAire
      + c.masterRecamara + c.masterCloset + c.masterBano
      + rec * c.vestibuloPorRecamara
      + (rec - 1) * (c.recamara + c.closet)
      + (ban - 1) * c.bano;
    return Math.round(crudoC / (1 - CIRCULACION_COMPACTA));
  }
  const crudo =
    NUCLEO_SUMA
    + SUITE_PRINCIPAL.recamara + SUITE_PRINCIPAL.closet + SUITE_PRINCIPAL.bano
    + rec * VESTIBULO_POR_RECAMARA
    + (rec - 1) * (RECAMARA_EXTRA.cuarto + RECAMARA_EXTRA.closet)
    + (ban - 1) * BANO_EXTRA
    + estanciasDeProgramaGrande(rec).reduce((s, x) => s + x.ft2, 0);
  return Math.round(crudo / (1 - CIRCULACION));
}

/** Lo que cuesta una recámara más: el cuarto, su clóset, su parte del vestíbulo
 *  y su parte de la circulación. */
export const FT2_POR_RECAMARA = Math.round((RECAMARA_EXTRA.cuarto + RECAMARA_EXTRA.closet + VESTIBULO_POR_RECAMARA) / (1 - CIRCULACION));
/** Lo que cuesta un baño más, ya con su parte de circulación. */
export const FT2_POR_BANO = Math.round(BANO_EXTRA / (1 - CIRCULACION));
/** Lo indispensable: núcleo + suite principal + su baño, con circulación. */
export const FT2_INDISPENSABLE = habitableDelPrograma(1, 1);

/**
 * Las tres cifras de arriba, pero para la medida que toque.
 *
 * En medida compacta la casa mínima baja de 1,089 a 705 ft² y la recámara de
 * 185 a 132: es la diferencia entre las medianas de nueve casas de LGP y las
 * cotas del 4-plex de Atwood Village. Van como funciones y no como constantes
 * para que el contador, la barra y el filtro de planos no puedan quedarse con
 * una medida distinta de la del presupuesto.
 */
export type Medida = 'holgada' | 'compacta';

export function ft2Indispensable(medida: Medida = 'holgada') {
  return habitableDelPrograma(1, 1, medida);
}
export function ft2PorRecamara(medida: Medida = 'holgada') {
  return habitableDelPrograma(2, 1, medida) - habitableDelPrograma(1, 1, medida);
}
export function ft2PorBano(medida: Medida = 'holgada') {
  return habitableDelPrograma(1, 2, medida) - habitableDelPrograma(1, 1, medida);
}

/**
 * De qué está hecho el costo de un cuarto más, para poder enseñarlo.
 *
 * Los 185 de una recámara se parecían demasiado a los 187 de la principal y se
 * leían como si al cliente le estuvieran cobrando un master cada vez. No es
 * eso: es un cuarto normal de 121 más su clóset y más lo que arrastra de
 * pasillo y muros. Las tres cifras suman exactamente lo que se descuenta.
 */
export const DESGLOSE_RECAMARA = [
  { que: 'el cuarto', ft2: RECAMARA_EXTRA.cuarto },
  { que: 'su clóset', ft2: Math.round(RECAMARA_EXTRA.closet) },
  { que: 'pasillos y muros', ft2: FT2_POR_RECAMARA - RECAMARA_EXTRA.cuarto - Math.round(RECAMARA_EXTRA.closet) },
] as const;

export const DESGLOSE_BANO = [
  { que: 'el baño', ft2: Math.round(BANO_EXTRA) },
  { que: 'muros y pasillo', ft2: FT2_POR_BANO - Math.round(BANO_EXTRA) },
] as const;

// ---------- lo que cuesta la idea de cada plano ----------
//
// Es lo ÚNICO que el floorplan cobra ahora. Un patio es un vacío: ocupa suelo y
// no es habitable, así que se descuenta de la capacidad del lote igual que el
// patio cubierto. La escalera del plano de dos plantas sí es habitable y se
// suma al programa — y se paga en las DOS plantas.
/**
 * `cobro` — de dónde salen los ft² de la idea del plano:
 *   'patio'   del suelo del lote, porque un patio ocupa terreno y no se habita.
 *   'ninguno' de ningún lado: el número existe y se enseña, pero no se resta.
 *
 * La escalera es 'ninguno' y ese es el arreglo del 31 de agosto de 2026. Antes
 * era 'habitable' y se le cobraban 160 ft² al presupuesto. Estaba mal por dos
 * veces: `habitableDelPrograma()` se construyó con los OCHO planos de una
 * planta, y el techo contra el que se compara —los 1,635 del Lote 17, o el
 * reparto 906/1635 que usa `maxLivingPara` para dos plantas— sale de una casa
 * que YA tiene su escalera adentro. Cobrarla aparte era contarla dos veces.
 *
 * Lo destapó el cliente con el plano en la mano: el Lote 17 mete 3 recámaras y
 * 3 baños en 1,635 ft² —MASTER BEDROOM, BEDROOM 2, BEDROOM 3, MASTER BATHROOM,
 * BATHRM 2, BATHRM 3, tabla de áreas del set firmado— y el configurador le
 * contestaba que no cabían. La escalera sigue enseñándose en la tarjeta y en
 * `notaDosPlantas()`, porque el dato es cierto y vale saberlo; lo que ya no
 * hace es descontarse.
 */
export const IDEA_PLAN: Record<string, { que: string; etiqueta: string; ft2: number; cobro: 'patio' | 'ninguno'; fuente: string; supuesto: boolean }> = {
  A: {
    que: 'Un patio techado atrás, pegado a la sala — el que más casa deja',
    etiqueta: 'Patio techado atrás',
    ft2: 87,
    cobro: 'patio',
    fuente: 'Recorte en U trasero del Lot 76: 86.88 ft², el patio más chico de los siete sets con tabla de áreas.',
    supuesto: false,
  },
  B: {
    que: 'Dos patios chicos con un corredor techado entre las alas',
    // Cómo se nombra en la tarjeta. El número solo —"200 ft²"— no se puede
    // leer: el cliente no tiene manera de saber si son los pies de la casa,
    // del patio o del lote. Un número sin sustantivo no es un dato.
    etiqueta: 'Dos patios',
    ft2: 200,
    cobro: 'patio',
    fuente: 'Cada patio sale del recorte en U de Lot 76, Lot 77 y New Frontier (87 a 112 ft²); que sean dos es un supuesto nuestro.',
    supuesto: true,
  },
  C: {
    que: 'Un patio en el centro, abierto a la sala y a la recámara principal',
    etiqueta: 'Un patio',
    ft2: 108,
    cobro: 'patio',
    fuente: 'Patio central del Lot 124, acotado: 10 pies de ancho, 108 ft².',
    supuesto: false,
  },
  D: {
    que: 'La casa sube: la planta alta libera suelo y la escalera se paga dos veces',
    etiqueta: 'Escalera, arriba y abajo',
    ft2: ESCALERA_POR_PLANTA * 2,
    cobro: 'ninguno',
    fuente: 'Escalera del Lot 17: 80 ft² abajo y otros 80 arriba de hueco con barandal. Es un solo set medido.',
    supuesto: false,
  },
  TH: {
    que: 'La casa del townhouse ya viene diseñada por la subdivisión',
    etiqueta: 'Escalera, arriba y abajo',
    ft2: ESCALERA_POR_PLANTA * 2,
    cobro: 'ninguno',
    fuente: 'Escalera del Lot 17, que es este mismo townhouse.',
    supuesto: false,
  },
};

/**
 * El patio de la casa, contado UNA vez.
 *
 * El patio de la idea del plano y `PATIO_CUBIERTO` no son dos huecos: son el
 * mismo. En el Lote 124 la tabla de áreas trae un solo renglón —`patio_cubierto:
 * 108 ft², tipo PATIO CENTRAL`— y ese 108 es el que el plano "Patio central"
 * cobra como su idea.
 *
 * Cuando el plano declara su patio, ése manda. La mediana de 103 es el respaldo
 * de cuando todavía no hay plano elegido, o de un plano que no organiza la casa
 * alrededor de un patio (el de dos plantas) — porque patio cubierto lo traen
 * los SIETE sets con tabla, ninguno se construyó sin uno.
 */
export function patioDeLaCasa(planKey: string | null): number {
  const idea = planKey ? IDEA_PLAN[planKey] : null;
  if (idea && idea.cobro === 'patio') return idea.ft2;
  return PATIO_CUBIERTO;
}

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
  { key: 'masterpatio', nombre: 'Master con conexión al patio', corto: 'Master + patio', rango: 'recámara estándar', area: '224', prop: '—', min: 224, nota: 'Se abre al patio del floorplan', grupo: 'master', soloEnPlanes: ['B', 'C'] },
  { key: 'masterbalcon', nombre: 'Master con balcón', corto: 'Master + balcón', rango: 'balcón real 4’3×8’8 (37 ft²)', area: '261', prop: 'balcón 1:2', min: 261, living: 224, nota: 'Del total, 37 ft² son balcón: no consumen área habitable', grupo: 'master', minPisos: 2 },

  // Zonas opcionales (add-on sobre el presupuesto restante)
  // El medio baño salió del núcleo el 31 de agosto de 2026 y llegó aquí.
  //
  // Estaba cobrándose como indispensable y no lo es: de los NUEVE planos de la
  // base solo DOS lo traen — el half bath del Lot 124 (26.3 ft²) y el POWDER
  // de 6'-0" x 5'-10" de Montecito 37 (35). Era la pieza con menos respaldo de
  // todo el núcleo y la única que se le cobraba a todos.
  //
  // Lo destapó el townhouse del Lote 17: su set trae MASTER BATHROOM, BATHRM 2
  // y BATHRM 3 y ningún medio baño, así que un cliente que pedía "3 baños"
  // acababa pagando cuatro piezas sanitarias. Con esto fuera, el programa de
  // 3 recámaras y 3 baños cabe en los 1,635 ft² del plano aprobado, que es lo
  // que el arquitecto ya había construido.
  //
  // Cuesta 35 y no 31 porque aquí las zonas se cobran a secas, sin pasar por
  // la circulación de `habitableDelPrograma()`: 31 de mediana con su parte de
  // pasillo y muros son los mismos 35 del POWDER medido. Moverlo de sitio no
  // le cambia el precio al cliente.
  { key: 'mediobano', nombre: 'Medio baño de visitas', corto: 'Medio baño', rango: "5×5 – 6×6", area: '26–35', prop: '5:6', min: 35, nota: '' },
  { key: 'walkingcloset', nombre: 'Walking closet secundario', corto: 'Walking closet', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: 'El closet del master ya está incluido' },
  { key: 'alberca', nombre: 'Alberca con deck perimetral', corto: 'Alberca', rango: '12×24 – 16×32', area: '400–700', prop: '1:2', min: 400, nota: 'Zona exterior: ocupa terreno, no área habitable', exterior: true },
  { key: 'bbq', nombre: 'Zona BBQ compacta', corto: 'Zona BBQ', rango: '8×8 – 10×10', area: '64–100', prop: '1:1', min: 64, nota: 'Zona exterior: ocupa terreno, no área habitable', exterior: true },
  { key: 'sunkenlounge', nombre: 'Sunken lounge en el gran salón', corto: 'Sunken lounge', rango: '+100–150 sobre el salón', area: '100–150', prop: '—', min: 100, nota: 'Rebaje de piso, no es un cuarto nuevo' },
  { key: 'storage', nombre: 'Storage', corto: 'Storage', rango: '6×8 – 8×10', area: '48–80', prop: '3:4', min: 48, nota: '' },
];

export const FAQS = [
  { q: '¿Qué es exactamente una casa custom de La Gran Piedra?', a: 'Partes de un lote con reglas conocidas y de floorplans que ya validamos estructural y térmicamente. Sobre esa base decides fachada, interiores y qué módulos añadir. No es un catálogo cerrado ni un lienzo en blanco: es libertad con guardarraíles.' },
  { q: '¿Cuánto tiempo toma construir?', a: 'Entre 5 y 9 meses desde la firma, según el floorplan y los módulos. El calendario se comparte completo antes de arrancar y se actualiza cada semana.' },
  { q: '¿Puedo cambiar cosas después de configurar en la web?', a: 'Sí. El configurador es el punto de partida de la conversación, no un contrato. Todo se revisa con el arquitecto en la cita presencial en el lote.' },
  { q: '¿Qué pasa con lo que escribo en el brief?', a: 'Llega tal cual al arquitecto, con tus palabras. No lo resumimos ni lo interpretamos: es lo que se platica contigo en la cita. Las zonas las eliges tú en el paso 4, con el presupuesto de pies cuadrados a la vista.' },
  { q: '¿Trabajan con financiamiento?', a: 'Trabajamos con prestamistas de construcción locales del Valle. Te conectamos, pero el crédito lo contratas tú directo — nosotros no cobramos comisión por eso.' },
  { q: '¿Qué incluye el smart home?', a: 'En función de tus necesidades pensamos cómo hacer tu casa smart.' },
];

// EL TELÉFONO DE LA GRAN PIEDRA. Dato real, dado por el cliente.
//
// Vive en el código y no en una variable de entorno, y es a propósito: no es
// un secreto —va impreso en la página, es como quieren que les llamen— y
// atarlo a la configuración de Vercel es lo que tuvo el botón de WhatsApp sin
// dibujarse durante meses. La variable sigue existiendo para poder cambiarlo
// sin tocar código, pero ya no hace falta para que el botón exista.
//
// Durante mucho tiempo aquí hubo un `(956) 000 0000` de relleno y la regla
// era dura: un botón de WhatsApp que abre un chat con un número inventado es
// peor que no tener botón, porque el cliente escribe, nadie contesta, y la
// primera impresión ya se gastó. La regla sigue en pie; lo que cambió es que
// ahora el número es de verdad.
export const TELEFONO = '(956) 450 3175';
/** Para `tel:` y `wa.me`: código de país y dígitos, sin nada más. */
export const TELEFONO_E164 = '19564503175';

// Formato: código de país y dígitos, que es lo que pide wa.me (`19561234567`).
// `whatsappHref` limpia todo lo que no sea dígito, así que también acepta
// "+1 (956) 123-4567" tal como se copia del teléfono.
function soloDigitos(n: string) { return n.replace(/\D/g, ''); }

// wa.me exige código de país: con los diez dígitos pelones el enlace abre un
// chat con un número que no existe, y eso pasó — la variable de entorno traía
// "9564503175" sin el 1. Un número de diez dígitos es de Estados Unidos, que
// es donde está el negocio, así que se le antepone aquí en vez de confiar en
// cómo quedó capturado.
export const WHATSAPP = (() => {
  const n = soloDigitos(process.env.NEXT_PUBLIC_LGP_WHATSAPP || TELEFONO_E164);
  return n.length === 10 ? `1${n}` : n;
})();

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
// "Tu casa" salió del recorrido: la lámina que ocupaba ese paso entero
// ahora solo viaja por correo al arquitecto, y el resumen que el cliente ve
// es la carpeta del brief. Un paso menos para llegar a enviar.
export const PASO_NOMBRES = ['Floorplan', 'Fachada', 'Interior y zonas', 'Brief', 'Tus datos'];
export const PASO_HINTS = [
  'Variantes curadas para tu lote',
  'Selecciona un estilo de fachada',
  'Elige tu paleta y arma tus zonas',
  'Comenta o pide algo especial, o sáltalo',
  'Solo pedimos datos al final',
];

