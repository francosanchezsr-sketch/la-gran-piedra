'use client';

import { useT } from '@/components/ProveedorIdioma';

/**
 * Dibujo a escala del lote con sus retiros: la franja gris es lo que el
 * municipio obliga a dejar libre y el rectángulo rosa es lo único donde se
 * puede desplantar. Existe porque "retiro" no le dice nada a un comprador.
 */
export default function RetirosDiagrama({
  frente,
  fondo,
  retiros,
  coberturaMax,
}: {
  frente: number;
  fondo: number;
  retiros: { frente: number; fondo: number; lados: number };
  /**
   * Tope de ocupación de la ciudad, si publica uno (Alton: 0.35). Cuando ese
   * tope le gana a los retiros, el rectángulo rosa tiene que encogerse a lo
   * que el tope permite: dibujar el rectángulo de los retiros mientras el
   * número de al lado dice otra cosa promete superficie que no existe.
   */
  coberturaMax?: number | null;
}) {
  const t = useT();
  const W = 250;
  const H = 185;
  /**
   * Márgenes por lado, no un `pad` parejo: cada orilla carga cosas distintas
   * y con un solo número o sobraba aire en tres lados o no cabía en el cuarto.
   *
   *   arriba  — la calle
   *   izq     — las tres cotas de retiro, en columna
   *   der     — la medida del FONDO del lote
   *   abajo   — la medida del FRENTE
   *
   * El izquierdo son 8 de aire más `CANAL_COTAS`: la franja donde caben la
   * línea de cota y su número. Se reserva SIEMPRE, aunque el lote quede
   * centrado con hueco de sobra a los lados, porque en un lote ancho y poco
   * profundo el terreno se pega al margen y sin esa reserva las cifras se
   * saldrían del lienzo.
   *
   * Esa reserva le quita ancho útil al dibujo, pero solo se nota en lotes más
   * anchos que profundos: en todo lote residencial normal la escala la fija el
   * ALTO (`util.h / fondo`), así que el terreno se dibuja exactamente igual de
   * grande que antes de que volvieran las cotas.
   */
  const CANAL_COTAS = 22;
  const mIzq = 8 + CANAL_COTAS;
  const mDer = 38;
  const mArr = 18;
  const mAba = 30;
  const util = { w: W - mIzq - mDer, h: H - mArr - mAba };

  // Escala para que el lote quepa manteniendo su proporción real.
  const k = Math.min(util.w / frente, util.h / fondo);
  const lw = frente * k;
  const lh = fondo * k;
  const x0 = mIzq + (util.w - lw) / 2;
  const y0 = mArr + (util.h - lh) / 2;

  const bx = x0 + retiros.lados * k;
  const by = y0 + retiros.frente * k;
  const bw = Math.max(0, lw - retiros.lados * 2 * k);
  // Con el tope de cobertura mandando, el rectángulo se recorta desde el
  // fondo —donde de verdad se recorta una casa que no cabe— hasta que su
  // área en pies coincide con la cifra que se está enseñando al lado.
  const porRetiros = Math.max(0, frente - retiros.lados * 2) * Math.max(0, fondo - retiros.frente - retiros.fondo);
  const tope = coberturaMax ? frente * fondo * coberturaMax : Infinity;
  const recorte = porRetiros > 0 && tope < porRetiros ? tope / porRetiros : 1;
  // El envolvente que dejan los retiros: es lo que miden las cotas, y sigue
  // dibujado (punteado) cuando el tope obliga a construir menos que él.
  const bhRetiros = Math.max(0, lh - (retiros.frente + retiros.fondo) * k);
  const bh = bhRetiros * recorte;

  // Dos familias de números sobre el mismo dibujo, y no se pueden confundir:
  //
  //   `cota`  — los RETIROS. En gris y más chicos, porque son un dato del
  //             municipio: el cliente no los escribió ni los decide. Cambian
  //             solos al cambiar de ciudad en el menú de arriba.
  //   `medida`— el FRENTE y el FONDO del lote. Van por fuera, en tinta y con
  //             más peso, porque son exactamente lo que el cliente acaba de
  //             teclear arriba. Sin ellos el dibujo enseñaba 18′, 15′ y 5′
  //             junto a unos campos que decían 60 y 90, y no había manera de
  //             saber que esos números medían otra cosa.
  const cota = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, fill: '#8A8F91' } as const;
  const medida = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, fontWeight: 700, fill: '#1C1E1F' } as const;
  // Dónde corren las dos cotas del lote y qué tan largas son sus patitas de
  // remate. (`tope` a secas ya está tomado más arriba por el de cobertura.)
  const yFrente = y0 + lh + 12;
  const xFondo = x0 + lw + 14;
  const patita = 3;

  /**
   * LAS TRES COTAS DE RETIRO. Cuánto obliga a dejar libre la ciudad elegida:
   * de la calle a la casa, de la casa al fondo, y de la casa a cada lindero.
   *
   * Van todas contra el ENVOLVENTE de los retiros, no contra el rectángulo
   * rosa, y la diferencia importa: cuando la ciudad topa la cobertura
   * (Brownsville al 50 %) el rosa se recorta por el fondo y queda MÁS adentro
   * que el retiro. Medir de ahí al lindero daría un número que no es el retiro
   * de nadie. Por eso el fondo se mide desde `by + bhRetiros` —el punteado que
   * ya se dibuja— y no desde el filo del rosa.
   *
   * Las tres cifras se alinean a la derecha en una sola columna (`xTexto`), y
   * las dos verticales comparten la misma línea de cota (`xCota`): no chocan
   * porque una vive arriba del rosa y la otra abajo. La lateral cae justo a
   * media altura del rosa, que es la única banda donde esas dos no están.
   *
   * `COTA_MIN` es la piedad: un tramo de menos de 4 unidades no es una cota,
   * son dos patitas encimadas. Ahí no se dibuja nada — el retiro se sigue
   * viendo como separación entre el rosa y el filo gris.
   */
  const COTA_MIN = 4;
  const xCota = x0 - 8;
  const xTexto = x0 - 11;
  const patitaCota = 2.5;
  const yRetiroFin = by + bhRetiros;
  const yLateral = by + bh / 2;
  /**
   * Y la condición que manda sobre las tres: que exista envolvente.
   *
   * Si los retiros no caben en el lote —Alton pide 25′ de frente más 20′ de
   * fondo y alguien teclea un terreno de 36′— el envolvente se queda en cero y
   * las dos cotas verticales se encabalgan. La de fondo entonces dibujaba el
   * tramo que quedaba, 11 pies, con el rótulo "20′" al lado: un número puesto
   * sobre una raya que mide otra cosa. Sin envolvente no hay nada que acotar,
   * así que no se acota. Que el lote no da para esa ciudad se dice con letras
   * en las cifras de al lado, no con una cota que miente.
   */
  const hayEnvolvente = bw > 0 && bhRetiros > 0;
  const hayFrente = hayEnvolvente && by - y0 >= COTA_MIN;
  const hayFondo = hayEnvolvente && y0 + lh - yRetiroFin >= COTA_MIN;
  // El lateral pide además rosa suficiente: con una huella de menos de 14
  // unidades de alto su cifra se le montaba a la del frente.
  const hayLateral = hayEnvolvente && bx - x0 >= COTA_MIN && bh >= 14;

  /**
   * El rótulo de la huella, y por qué no es un `<text>` a secas.
   *
   * Decía "AQUÍ SÍ" y ahora dice "CONSTRUCCIÓN" — casi el doble de letras
   * dentro de un rectángulo que NO es fijo: se encoge con el frente del lote.
   * Medido en pantalla, la palabra ocupa 8.67 unidades del `viewBox` por cada
   * unidad de `fontSize`, así que a tamaño 8 pide 69.3. El rectángulo rosa da
   * 76 en un lote de 60×90 (cabe raspando) y 58 en uno de 50×95 (no cabe: se
   * saldría por los dos lados encima del filo del terreno).
   *
   * Dos salidas, en este orden:
   *
   *   1. GIRARLA. Si no cabe acostada pero sí parada, se pone vertical. Es lo
   *      que hace un plano de verdad con un cuarto angosto y largo, y no cuesta
   *      un solo punto de tamaño: en lote profundo sobra alto de sobra.
   *   2. ENCOGERLA, solo si tampoco cabe parada.
   *
   * Y si el rectángulo es tan chico que ni encogida se lee (`TAM_MIN`), no se
   * dibuja: una mancha de tinta ilegible dentro del rosa estorba más de lo que
   * dice, y el rosa ya se distingue solo por color contra el gris del terreno.
   */
  const ROTULO = t('CONSTRUCCIÓN');
  const ANCHO_POR_TAM = 8.67;
  const TAM_ROTULO = 8;
  const TAM_MIN = 4;
  const holgura = 6;
  const dispAcostada = bw - holgura;
  const dispParada = bh - holgura;
  const paradaGana = TAM_ROTULO * ANCHO_POR_TAM > dispAcostada && dispParada > dispAcostada;
  const tamRotulo = Math.min(TAM_ROTULO, (paradaGana ? dispParada : dispAcostada) / ANCHO_POR_TAM);
  const cxRotulo = bx + bw / 2;
  const cyRotulo = by + bh / 2;

  // 400px de tope — el doble del que tenía, a petición directa. Pero el tope
  // es eso, un TOPE, no una exigencia: el dibujo entra a la fila como un
  // elástico (`flex: 1 1 200px`) que crece hasta 400 cuando hay sitio y se
  // encoge cuando no.
  //
  // Sin esa elasticidad pedía sus 400px enteros aunque la fila midiera menos,
  // y entonces las dos cifras de al lado no cabían y se caían a un renglón
  // aparte. Eso pasaba en cualquier ventana angosta por más que el tablero
  // tuviera permiso para ser ancho: quien manda es el ancho REAL de la fila,
  // no el tope del tablero. Encogiéndose, el dibujo y las cifras se quedan
  // lado a lado, que es donde tienen que estar.
  //
  // `minWidth: 0` es lo que de verdad lo deja encoger: sin él un elemento de
  // flex se planta en su tamaño de contenido y no baja de ahí.
  //
  // Todo lo de adentro —el rectángulo del lote, el rosa de la huella, las
  // cotas y su texto— está en unidades del `viewBox` (210×155), así que crece
  // y se encoge con el mismo factor: es un solo `transform: scale()` a ojos
  // del navegador, no una maqueta que haya que volver a proporcionar a mano.
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ flex: '1 1 200px', minWidth: 0, width: '100%', maxWidth: '624px', height: 'auto', display: 'block' }}>
      {/* terreno completo */}
      <rect x={x0} y={y0} width={lw} height={lh} fill="#F0EDE9" stroke="#C9CBCC" strokeWidth={1} />
      {/* Lo que dejarían los retiros solos, cuando el tope de cobertura los
          vence. Punteado porque es una línea legal que aquí no se alcanza —
          y es contra ella contra la que están puestas las cotas. */}
      {recorte < 1 && bw > 0 && bhRetiros > 0 ? (
        <rect x={bx} y={by} width={bw} height={bhRetiros} fill="none" stroke="#C9CBCC" strokeWidth={1} strokeDasharray="3 2.5" />
      ) : null}
      {/* huella construible */}
      {bw > 0 && bh > 0 ? (
        <>
          <rect x={bx} y={by} width={bw} height={bh} fill="#FBD9E4" stroke="#F2004B" strokeWidth={1.2} />
          {tamRotulo >= TAM_MIN ? (
            <text
              x={cxRotulo}
              y={cyRotulo}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Archivo, sans-serif"
              fontSize={tamRotulo}
              fontWeight={800}
              fill="#8A2249"
              transform={paradaGana ? `rotate(-90 ${cxRotulo} ${cyRotulo})` : undefined}
            >
              {ROTULO}
            </text>
          ) : null}
        </>
      ) : null}

      {/* DE LA CALLE A LA CASA — el retiro de frente. */}
      {hayFrente ? (
        <>
          <line x1={xCota} y1={y0} x2={xCota} y2={by} stroke="#B4B8BA" strokeWidth={0.7} />
          <line x1={xCota - patitaCota} y1={y0} x2={xCota + patitaCota} y2={y0} stroke="#B4B8BA" strokeWidth={0.7} />
          <line x1={xCota - patitaCota} y1={by} x2={xCota + patitaCota} y2={by} stroke="#B4B8BA" strokeWidth={0.7} />
          <text x={xTexto} y={(y0 + by) / 2} textAnchor="end" dominantBaseline="central" {...cota}>{retiros.frente}&apos;</text>
        </>
      ) : null}

      {/* DE LA CASA AL FONDO — medido desde el envolvente, no desde el rosa. */}
      {hayFondo ? (
        <>
          <line x1={xCota} y1={yRetiroFin} x2={xCota} y2={y0 + lh} stroke="#B4B8BA" strokeWidth={0.7} />
          <line x1={xCota - patitaCota} y1={yRetiroFin} x2={xCota + patitaCota} y2={yRetiroFin} stroke="#B4B8BA" strokeWidth={0.7} />
          <line x1={xCota - patitaCota} y1={y0 + lh} x2={xCota + patitaCota} y2={y0 + lh} stroke="#B4B8BA" strokeWidth={0.7} />
          <text x={xTexto} y={(yRetiroFin + y0 + lh) / 2} textAnchor="end" dominantBaseline="central" {...cota}>{retiros.fondo}&apos;</text>
        </>
      ) : null}

      {/* DE LA CASA AL LINDERO — el mismo retiro de los dos lados, así que se
          acota una vez, del lado en que ya están las otras dos cifras. */}
      {hayLateral ? (
        <>
          <line x1={x0} y1={yLateral} x2={bx} y2={yLateral} stroke="#B4B8BA" strokeWidth={0.7} />
          <line x1={x0} y1={yLateral - patitaCota} x2={x0} y2={yLateral + patitaCota} stroke="#B4B8BA" strokeWidth={0.7} />
          <line x1={bx} y1={yLateral - patitaCota} x2={bx} y2={yLateral + patitaCota} stroke="#B4B8BA" strokeWidth={0.7} />
          <text x={xTexto} y={yLateral} textAnchor="end" dominantBaseline="central" {...cota}>{retiros.lados}&apos;</text>
        </>
      ) : null}

      {/* La calle va del lado del retiro frontal, que es contra lo que se mide */}
      <line x1={x0 - 4} y1={y0 - 7} x2={x0 + lw + 4} y2={y0 - 7} stroke="#C9CBCC" strokeWidth={2} />
      <text x={x0 + lw / 2} y={y0 - 11} textAnchor="middle" {...cota}>CALLE</text>

      {/* LAS MEDIDAS DEL LOTE: las mismas dos que el cliente escribió arriba.
          Van por fuera del terreno y de lado a lado completo, para que se lean
          como "todo este lado mide tanto" y no se confundan con los retiros,
          que son tramos cortos pegados al filo. */}
      <line x1={x0} y1={yFrente} x2={x0 + lw} y2={yFrente} stroke="#8A8F91" strokeWidth={0.8} />
      <line x1={x0} y1={yFrente - patita} x2={x0} y2={yFrente + patita} stroke="#8A8F91" strokeWidth={0.8} />
      <line x1={x0 + lw} y1={yFrente - patita} x2={x0 + lw} y2={yFrente + patita} stroke="#8A8F91" strokeWidth={0.8} />
      <text x={x0 + lw / 2} y={yFrente + 10} textAnchor="middle" {...medida}>{frente}&apos;</text>

      <line x1={xFondo} y1={y0} x2={xFondo} y2={y0 + lh} stroke="#8A8F91" strokeWidth={0.8} />
      <line x1={xFondo - patita} y1={y0} x2={xFondo + patita} y2={y0} stroke="#8A8F91" strokeWidth={0.8} />
      <line x1={xFondo - patita} y1={y0 + lh} x2={xFondo + patita} y2={y0 + lh} stroke="#8A8F91" strokeWidth={0.8} />
      <text x={xFondo + 5} y={y0 + lh / 2 + 3} textAnchor="start" {...medida}>{fondo}&apos;</text>
    </svg>
  );
}
