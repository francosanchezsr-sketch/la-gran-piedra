'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnimacionAlterna } from '@/components/DecisionUI';
import { CamaIcon, BanoIcon, CarroIcon } from '@/components/ConfigIcons';
import { useT } from '@/components/ProveedorIdioma';

export type SegmentoPresupuesto = {
  key: string;
  label: string;
  ft2: number;
  color: string;
};

/**
 * Barra de presupuesto de área habitable: el ancho total es el máximo que
 * permite el lote y lo lleno es lo que ya se comprometió. Se muestra del paso 1
 * al 4 para que el cliente nunca pierda de vista cuánto le queda mientras
 * configura.
 *
 * Son TRES rieles, no uno: lo habitable, el total construido y lo libre. Antes
 * eran dos franjas dentro de un solo riel y el cliente tenía que descifrar el
 * reparto de un tramo bicolor; ahora cada cifra tiene su propio riel y su
 * propio globo con el número vivo.
 *
 * Los dos primeros se miden contra la misma regla —el total que da el lote— y
 * por eso se comparan leyendo hacia abajo: el tramo oscuro del riel del total
 * es exactamente el riel de arriba.
 *
 * El TERCERO va al revés, y a propósito. Los tres rieles tienen que crecer en
 * la misma dirección: dos que avanzan y uno que retrocede se lee como si algo
 * estuviera mal. Así que este no pinta lo que queda libre, pinta lo que ya se
 * gastó del presupuesto habitable — se llena conforme el cliente ocupa y se
 * retrae cuando libera— y lo libre es el HUECO que deja. El globo va justo en
 * la punta de lo lleno, que es exactamente donde empieza ese hueco, así que
 * señala lo que nombra. Es el mismo trato de cualquier medidor de espacio:
 * la barra dice cuánto llevas, el número dice cuánto te queda.
 *
 * Su regla es el techo habitable del lote, no el total construido: la cochera,
 * el pórtico y el patio no compiten por el presupuesto del cliente, así que
 * meterlos en esta cuenta inflaría el porcentaje sin que él pueda hacer nada
 * al respecto. Con esta regla el hueco vale exactamente los ft² del globo.
 */
// Los colores del presupuesto. Los dos rieles que cuentan obra van en carmín,
// y se distinguen entre sí por TONO dentro del mismo color, no por colores
// distintos: si cada concepto tuviera el suyo, el total ocupado dejaría de
// leerse de un vistazo.
//
// El tercer riel va en tinta porque no cuenta obra: cuenta presupuesto. Es el
// medidor, y por eso se sale de la familia del carmín — el carmín dice cuánta
// casa hay, la tinta dice cuánto presupuesto llevas gastado.
const HABITABLE = '#8A2249';
const OCUPADO = '#F2004B';
const LIBRE = '#1C1E1F';
// Papel, del manual. Aquí solo se usa para perfilar la cifra del acuse cuando
// va en tinta; el fondo de la barra es blanco puro y este es el blanco del
// sistema, que es el que tiene que tocar la tipografía.
const PAPEL = '#FBFBFA';
// El canal vacío. El manual le tiene nombre y valor propios —Surco, para el
// canal de una barra de progreso— así que no hay nada que inventar. Antes el
// fondo de la barra ERA el color de lo libre, porque no había dónde más
// decirlo; ahora lo libre tiene riel propio y el hueco vuelve a ser hueco.
const RIEL = '#F0EDE9';
const FILETE = '#E4E1DD';

// La veta diagonal del relleno. No es un color nuevo —es el mismo relleno
// aclarado— porque en este sistema el carmín es la única voz: un segundo tono
// de verdad diría algo que no hay que decir.
const VETA = `linear-gradient(45deg,
  rgba(255,255,255,0.22) 25%, transparent 25%,
  transparent 50%, rgba(255,255,255,0.22) 50%,
  rgba(255,255,255,0.22) 75%, transparent 75%, transparent)`;
// El ladrillo del patrón. El viaje de la animación mide exactamente esto, así
// que la veta acaba en la misma figura en la que empezó.
const VETA_LADRILLO = 24;
// Lo que dura el viaje y cuántas vueltas da. Tres vueltas de 400ms son 1.2s:
// alcanza a verse después de que el riel terminó de crecer (280ms) y se apaga
// sola, sin dejar nada moviéndose en pantalla.
const VETA_MS = 400;
const VETA_VUELTAS = 3;

// Alto del riel, y del carril por el que viajan el título y el globo. El
// carril tiene que dar para el globo (16px) más su piquito (4), y es lo único
// que cada riel cuesta de más respecto a la barra vieja.
// El riel es mas bajo que los 16px de la barra vieja porque ahora son tres,
// pero no tanto como la referencia: a 1,000px de ancho un canal de 10px se
// vuelve un hilo, y el tramo bicolor del total deja de leerse.
const RIEL_ALTO = 12;
const CARRIL = 20;
// Media anchura del globo. Sirve para que no se salga por ninguna de las dos
// puntas: en 0 % se quedaría medio fuera por la izquierda y en 100 % por la
// derecha. Va fija a propósito — el número más largo que puede caer aquí son
// cinco caracteres ("2,249"), y medido en pantalla ese globo mide 61.3px de
// ancho — y así no hay que medir el DOM para colocarlo.
const GLOBO_MEDIO = 32;
// Lo que ocupa un carácter del título, en px, para saber dónde acaba y que el
// globo no se le siente encima cuando la cifra es chica. Archivo 700 a 11px en
// altas con 0.14em de interletrado da ~8.4px por letra; va holgado a propósito,
// porque de esto solo depende cuánto se separa el globo del título — si sobra
// un par de píxeles no se nota, y si faltaran se encimarían, que es lo único
// que aquí no puede pasar.
const TITULO_POR_LETRA = 8.8;

const SUAVE = 'cubic-bezier(.22,.61,.36,1)';

/**
 * EL ACUSE: la cifra que salta del riel cuando una decisión lo mueve.
 *
 * Los rieles ya crecían solos, pero crecer 15px dentro de un canal de 12px de
 * alto es un cambio que se pierde si el cliente estaba mirando el botón que
 * acaba de tocar. Así que el riel además CANTA lo que le pasó: "+531" en
 * carmín cuando algo costó, "−531" en tinta cuando algo devolvió espacio.
 *
 * Va grande a propósito —26px contra los 11 del globo— porque es lo único de
 * toda la barra que aparece y se va: dura un segundo, así que si hay que
 * buscarlo ya se fue.
 *
 * `ACUSE_MS` tiene que ir a la par de la duración de `lgpAcuse` en el CSS. Si
 * este número fuera el menor, la cifra se cortaría a media subida; si fuera el
 * mayor, se quedaría plantada en su último fotograma —invisible, pero ocupando
 * su sitio— hasta que el reloj la retire.
 */
const ACUSE_MS = 1000;
const ACUSE_TAM = 26;
/**
 * EL ANCLA ES LA BURBUJA. El acuse se dibuja DENTRO del globo de ft², así que
 * arranca literalmente encima de él y de ahí sale volando.
 *
 * Aquí vivían tres constantes y un `ResizeObserver`, y todo eso se fue. El
 * acuse se colocaba aparte, rehaciendo en aritmética el `clamp` con el que el
 * CSS coloca el globo, midiendo el ancho del riel y el aire que quedaba a la
 * derecha para decidir de qué costado ponerse. Dos cuentas para una sola
 * posición, y nunca daban igual: el hueco medido salía de 6px en una ventana
 * ancha y de 18px en una angosta. Ese era el desfase.
 *
 * Anidada, la cifra hereda la posición del globo por construcción — con
 * cualquier tope, a cualquier ancho, y hasta mientras el globo se desliza con
 * su transición de 280ms, porque se mueven juntos al ser el mismo elemento.
 */

let acuseSerie = 0;

/**
 * Vigila una cifra y devuelve cuánto cambió, durante un segundo.
 *
 * La primera lectura NO cuenta: el cliente que entra al paso 2 con una casa ya
 * armada no tiene por qué ver saltar "+1,583" sobre una barra que no acaba de
 * mover. Solo se anuncia lo que cambió estando él delante — que es exactamente
 * el criterio que ya usa la veta de los rieles.
 *
 * El `id` va aparte del delta porque dos decisiones seguidas pueden costar lo
 * mismo: sin él, agregar dos mudrooms de 48 ft² no volvería a montar el
 * elemento y el segundo acuse no se animaría.
 */
function useAcuse(valor: number) {
  const previo = useRef<number | null>(null);
  const [acuse, setAcuse] = useState<{ id: number; delta: number } | null>(null);

  useEffect(() => {
    const antes = previo.current;
    previo.current = valor;
    if (antes === null || antes === valor) return;
    acuseSerie += 1;
    const id = acuseSerie;
    setAcuse({ id, delta: valor - antes });
    const reloj = setTimeout(() => setAcuse((a) => (a && a.id === id ? null : a)), ACUSE_MS);
    return () => clearTimeout(reloj);
  }, [valor]);

  return acuse;
}

/**
 * La terna de cuentas con su glifo: cama, baño y coche, en ese orden, siempre
 * las tres. Que el coche aparezca en cero —y no que desaparezca— es a
 * propósito: "sin cochera" es una decisión que el cliente tomó y tiene que
 * poder verla, no una fila que se esfumó.
 */
function Cuentas({ recamaras, banos, cajones }: { recamaras: number | null; banos: number | null; cajones: number | null }) {
  const t = useT();
  const filas = [
    { k: 'rec', Icono: CamaIcon, n: recamaras, que: recamaras === 1 ? t('recámara') : t('recámaras') },
    { k: 'ban', Icono: BanoIcon, n: banos, que: banos === 1 ? t('baño') : t('baños') },
    { k: 'gar', Icono: CarroIcon, n: cajones, que: cajones === 1 ? t('lugar') : t('lugares') },
  ];
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {filas.map(({ k, Icono, n, que }) => (
        <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px' }} title={n === null ? t('Aún sin definir') : `${n} ${que}`}>
          <Icono size={21} color={n ? '#1C1E1F' : '#B7BABB'} />
          <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '15px', lineHeight: 1, color: n ? '#1C1E1F' : '#B7BABB' }}>
            {n === null ? '—' : n}
          </span>
        </span>
      ))}
    </span>
  );
}

type Tramo = { key: string; desde: number; ancho: number; color: string; titulo: string };

/**
 * Un riel con su título encima y su globo flotando en esa misma línea, justo
 * sobre la punta de lo lleno.
 *
 * Título y globo comparten carril —como en la referencia— y por eso el globo
 * lleva un tope por la izquierda: cuando la cifra es tan chica que caería sobre
 * el título, se corre lo justo para librarlo. El piquito no se corre nunca, así
 * que sigue apuntando al sitio de verdad.
 *
 * Se probó el título en su propia columna a la izquierda: no se cruzaban nunca,
 * pero se comía hasta 118px de riel y alejaba el nombre de la barra que nombra.
 */
function Riel({
  etiqueta, ft2, aviso, color, tramos, pct, descripcion, veta, acuse,
}: {
  etiqueta: string;
  ft2: number;
  /** Nombre de la animación de la veta, o `null` si no hay nada que anunciar. */
  veta: string | null;
  /** Reemplaza el número del globo cuando la cifra ya no es la noticia. */
  aviso?: string;
  color: string;
  tramos: Tramo[];
  /** Dónde termina lo lleno, 0–100. Es adonde apunta el piquito. */
  pct: number;
  descripcion: string;
  /** Lo que acaba de cambiar en este riel, mientras dure el acuse. */
  acuse?: { id: number; delta: number } | null;
}) {
  const tope = Math.max(0, Math.min(100, pct));
  // Dónde puede empezar el globo sin sentarse encima del título. Solo muerde
  // en el riel de lo libre, que es el único que llega a valer casi cero; en los
  // otros dos la cifra nunca baja tanto.
  const sangria = Math.round(etiqueta.length * TITULO_POR_LETRA + 12 + GLOBO_MEDIO);
  /**
   * Dónde queda el CENTRO del globo, ya con sus dos topes puestos: no se mete
   * bajo el título por la izquierda ni se sale del riel por la derecha.
   *
   * Se saca a una variable porque el acuse se cuelga de él —sale a su derecha,
   * pegado a su filo— y tiene que seguirlo a donde vaya. Si el acuse repitiera
   * la cuenta por su lado, en cuanto un tope mordiera a uno y no al otro los
   * dos se separarían.
   */
  const globoCentro = `clamp(min(${sangria}px, calc(100% - ${GLOBO_MEDIO}px)), ${tope}%, calc(100% - ${GLOBO_MEDIO}px))`;

  return (
    <div style={{ position: 'relative', paddingTop: `${CARRIL}px` }}>
      {/* El título del riel, arriba y a la izquierda. Archivo en altas, que es
          como el manual pide toda jerarquía; el mono de 9px queda para el dato
          y la leyenda, no para nombrar. Va del tamaño de los demás rótulos de
          control y no más grande: estos tres rieles cuelgan de "Presupuesto
          SFT", y un hijo que grita más que su padre desordena la lectura. */}
      <span style={{
        position: 'absolute', top: 0, left: 0, height: `${CARRIL - 4}px`,
        display: 'flex', alignItems: 'center',
        fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: 700,
        letterSpacing: '0.14em', color: '#1C1E1F', textTransform: 'uppercase',
        whiteSpace: 'nowrap', pointerEvents: 'none',
      }}>
        {etiqueta}
      </span>

      {/* El globo, recortado por las dos puntas para no salirse del riel y por
          la izquierda para no pisar el título. */}
      <span
        style={{
          position: 'absolute', top: 0, height: `${CARRIL - 4}px`,
          left: globoCentro,
          transform: 'translateX(-50%)',
          transition: `left .28s ${SUAVE}`,
          display: 'flex', alignItems: 'center', gap: '3px',
          background: color, color: '#fff',
          padding: '0 6px', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}
      >
        <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '11px', letterSpacing: '-0.01em', lineHeight: 1 }}>
          {aviso ?? ft2.toLocaleString('es-MX')}
        </span>
        {aviso ? null : (
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', letterSpacing: '0.06em', lineHeight: 1, opacity: 0.82 }}>ft²</span>
        )}
          {/* EL ACUSE, y su ancla es la burbuja misma: este elemento vive
              DENTRO del globo de ft², así que no hay nada que calcular ni que
              mantener sincronizado.

              Antes se colocaba aparte, rehaciendo en aritmética el `clamp` con
              el que el CSS coloca el globo. Las dos cuentas nunca daban igual
              —el hueco medido salía de 6px en una ventana ancha y de 18 en una
              angosta— y ese era el desfase. Anidado, la cifra hereda la
              posición del globo sea cual sea, incluso mientras el globo se
              desliza con su transición de 280ms: se mueven juntos porque son
              el mismo elemento.

              `left: 0` la pone justo encima de la burbuja, no a su lado, y de
              ahí sale volando. El `top` sube media altura de texto desde el
              centro del carril para que la cifra quede centrada en la línea
              del globo en vez de colgada de ella.

              `key={acuse.id}` es lo que lo hace funcionar dos veces seguidas:
              React vuelve a montar el elemento y la animación arranca de cero.
              Repetir la clase sin remontar no vuelve a disparar nada.

              `aria-hidden` porque no es información nueva: el riel ya lleva su
              `aria-valuetext` con las cifras al día, y un lector anunciando
              "+531" un segundo después llega tarde y estorba. */}
        {acuse ? (
          <span
            key={acuse.id}
            className="lgp-riel-acuse"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: `${(CARRIL - 4) / 2 - ACUSE_TAM / 2}px`,
              zIndex: 3,
              /* La cifra abre creciendo de 0.4 a su tamaño; con el origen en su
                 canto izquierdo ese canto se queda clavado en la burbuja y la
                 cifra crece hacia afuera, en vez de despegarse desde el centro
                 justo en los fotogramas que dicen de dónde salió. */
              transformOrigin: 'left center',
              display: 'flex', alignItems: 'baseline', gap: '3px',
              whiteSpace: 'nowrap', pointerEvents: 'none',
              fontFamily: 'Archivo, sans-serif', fontWeight: 800,
              fontSize: `${ACUSE_TAM}px`, letterSpacing: '-0.02em', lineHeight: 1,
              /* Cada cifra toma el color de SU riel: la de lo habitable sale en
                 Carmín Legible y la del total en Carmín de Marca, los mismos dos
                 tonos con los que están pintadas sus barras. Así se ve de qué
                 barra salió sin tener que seguirle el rastro.

                 Antes el color decía otra cosa —carmín si costaba, tinta si
                 devolvía— y esa lectura no se pierde: la sigue diciendo el signo,
                 que es donde estaba de todos modos el dato. */
              color,
              /* Contorno de papel para las dos cifras, la carmín y la de tinta.
                 Es lo que las despega de lo que van cruzando al subir: la barra
                 con su veta, el título del riel de arriba, el globo si les queda
                 de paso.

                 `paintOrder: 'stroke fill'` es lo que lo hace usable: sin él, el
                 contorno se dibuja ENCIMA del relleno y se come la mitad de su
                 grosor hacia adentro, así que a 26px en Archivo 800 el carmín
                 perdía peso y se veía más flaco que el globo del riel. Con la
                 orden invertida el contorno queda detrás y solo crece hacia
                 afuera. */
              WebkitTextStroke: `2.4px ${PAPEL}`,
              paintOrder: 'stroke fill',
            }}
          >
            {acuse.delta > 0 ? '+' : '−'}{Math.abs(acuse.delta).toLocaleString('es-MX')}
            {/* El "ft²" hereda el contorno del padre, y 1.2px alrededor de un
                tipo de 11px lo cierra hasta volverlo una mancha. Lleva el suyo,
                proporcional a su tamaño. */}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 400, letterSpacing: '0.04em', WebkitTextStroke: `1px ${PAPEL}` }}>ft²</span>
          </span>
        ) : null}
      </span>
      {/* El piquito, en la posición de verdad. Va aparte del globo justamente
          para eso: el globo se corre cuando toparía con el título o con una
          punta, y el piquito no, así que sigue señalando dónde termina lo
          lleno aunque el globo se haya tenido que apartar. */}
      <span
        style={{
          position: 'absolute', top: `${CARRIL - 4}px`, left: `${tope}%`,
          transform: 'translateX(-50%)',
          transition: `left .28s ${SUAVE}`,
          width: 0, height: 0, pointerEvents: 'none',
          borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
          borderTop: `4px solid ${color}`,
        }}
      />


      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(tope)}
        /* Sin `aria-valuetext` un lector anuncia "100 %" justo cuando el
           cliente necesita oír lo contrario: que no le queda superficie. El
           porcentaje es la lectura correcta del número y la lectura
           equivocada del hecho. */
        aria-valuetext={descripcion}
        aria-label={etiqueta}
        /* Canal en píldora con su filete, como la referencia. Es la única
           pieza del sistema con radio que no es un círculo: el manual pide
           canto vivo en todo, y aquí se cede porque la forma de la barra la
           eligió el cliente sobre un video. El color sí sale del manual — Surco
           para el canal, Filete Suave para el borde — y no del azul del video. */
        style={{
          position: 'relative', display: 'block', height: `${RIEL_ALTO}px`,
          background: RIEL, border: `1px solid ${FILETE}`,
          borderRadius: '999px', overflow: 'hidden',
        }}
      >
        {/* Muescas tipo barra de vida, cada cuarto de riel. Van DEBAJO del
            relleno: encima de una veta en movimiento solo serían ruido. Dan la
            escala de cada riel —dónde queda la mitad, dónde el último cuarto—
            sin obligar a leer el número. */}
        <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(28,30,31,0.14) calc(25% - 1px) 25%)' }} />
        {tramos.filter((t) => t.ancho > 0).map((t, i) => (
          <span
            key={t.key}
            title={t.titulo}
            /* Se animan `width` y `left`. Siguen siendo propiedades de
               layout, pero acotadas al reparto interno de un riel de 12px: el
               recálculo no sale de aquí. `scaleX` sería más barato y no
               sirve — deformaría el filo blanco que separa un tramo del
               siguiente, que es justo lo que hace legible el reparto. */
            data-veta=""
            style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${t.desde}%`, width: `${t.ancho}%`,
              background: t.color,
              backgroundImage: VETA,
              backgroundSize: `${VETA_LADRILLO}px ${VETA_LADRILLO}px`,
              animation: veta ? `${veta} ${VETA_MS}ms linear ${VETA_VUELTAS}` : undefined,
              transition: `width .28s ${SUAVE}, left .28s ${SUAVE}`,
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.55)' : undefined,
              /* La punta del relleno va redondeada como en la referencia. En el
                 riel del total son dos tramos y la píldora la forman entre los
                 dos: el primero redondea por la izquierda y el último por la
                 derecha. */
              borderRadius: tramos.length > 1
                ? (i === 0 ? '999px 0 0 999px' : '0 999px 999px 0')
                : '999px',
            }}
          />
        ))}
      </span>
    </div>
  );
}

export default function PresupuestoBar({
  max,
  segmentos,
  exteriores = 0,
  sinLote = false,
  salidas = [],
  recamaras = null,
  banos = null,
  cajones = null,
}: {
  max: number;
  segmentos: SegmentoPresupuesto[];
  /**
   * Los ft² de zonas exteriores —alberca, BBQ, el balcón del master— que van
   * dentro de `max` y de la franja de obra.
   *
   * Viajan aparte porque son la única parte de `max` que NO es capacidad del
   * lote sino decisión del cliente: una alberca no se desplanta dentro del
   * envolvente construible, se pone en el jardín, así que se le suma al total
   * en vez de restarle a la casa. Sin este dato el riel de lo habitable no
   * tiene manera de saber qué parte de su regla es lote y qué parte es jardín.
   */
  exteriores?: number;
  sinLote?: boolean;
  /**
   * Las tres cuentas que van con su glifo arriba a la izquierda: cuántas
   * recámaras, cuántos baños y cuántos lugares de cochera. Van SIEMPRE, con
   * lote o sin él —son la referencia fija contra la que el cliente lee la
   * barra— y por eso aceptan `null`: sin lote todavía no hay casa, y se dibuja
   * el glifo con un guión en lugar de esconderlo.
   */
  recamaras?: number | null;
  banos?: number | null;
  cajones?: number | null;
  /**
   * Qué puede hacer el cliente cuando no le cabe. Un "te pasas por 125 ft²"
   * a secas deja al comprador con un problema y sin salida; un arquitecto
   * dice por cuánto Y qué mover. Las calcula el configurador, que es quien
   * sabe qué tiene puesto — aquí solo se pintan.
   */
  salidas?: string[];
}) {
  const t = useT();
  // El contrato con el configurador no cambia: sigue mandando los mismos dos
  // conceptos, lo habitable y la obra que no se habita. Lo que cambió es cómo
  // se dibujan.
  const habitable = segmentos.find((s) => s.key === 'living');
  const obras = segmentos.filter((s) => s.key !== 'living');
  const ft2Habitable = habitable?.ft2 ?? 0;
  const ft2Obra = obras.reduce((s, x) => s + x.ft2, 0);
  const usados = ft2Habitable + ft2Obra;
  /**
   * El techo habitable: lo que el lote da para vivir, sin la obra que no se
   * habita. El configurador no lo manda aparte porque ya viaja dentro de `max`
   * —le suma la cochera, el pórtico y el patio para dibujar el total— así que
   * aquí se despeja en vez de pedir una prop nueva que diría lo mismo.
   */
  const techo = Math.max(0, max - ft2Obra);
  const libres = Math.max(0, max - usados);
  const pct = (n: number) => (max > 0 ? Math.max(0, Math.min(100, (n / max) * 100)) : 0);
  /**
   * LA REGLA DE LA CASA: el total que da el lote, sin lo que se puso en el
   * jardín. Es la regla del primer riel, y existe para arreglar un error.
   *
   * `max` crece cuando el cliente agrega una alberca, porque la alberca no le
   * quita un pie a la casa: se suma al total y al techo a la vez. Correcto para
   * el riel del total —de veras estás construyendo más— y desastroso para el de
   * lo habitable, que se medía contra ese mismo `max`: al poner una alberca de
   * 400 ft², los mismos 1,583 habitables pasaban del 87 % al 72 % del riel. La
   * barra del living se encogía sola por algo que ocurrió en el jardín.
   *
   * Con esta regla el riel de lo habitable solo se mueve cuando se mueve la
   * casa. El precio: cuando hay exteriores puestos, ese riel y el tramo oscuro
   * del riel del total dejan de medir lo mismo y ya no se leen hacia abajo como
   * uno solo. Sin exteriores —el caso normal— las dos reglas son idénticas y la
   * lectura vertical se conserva intacta.
   */
  const reglaCasa = Math.max(0, max - Math.max(0, exteriores));
  const pctCasa = (n: number) => (reglaCasa > 0 ? Math.max(0, Math.min(100, (n / reglaCasa) * 100)) : 0);
  /** Lo mismo, pero contra el techo habitable: la regla del tercer riel. */
  const pctTecho = (n: number) => (techo > 0 ? Math.max(0, Math.min(100, (n / techo) * 100)) : 0);
  // Rebasar ya no debería poder pasar: el plano que no cabe no se puede elegir,
  // y los cuartos y las zonas revalidan su tope. Queda como red por si una
  // configuración guardada de antes trae un plano que hoy ya no entra.
  //
  // Cuando pasa NO se enseña un número negativo. Se probó "−92 ft² de más" y es
  // jerga de obra: el cliente no lleva la cuenta de un presupuesto en ft², solo
  // quiere saber si lo que pidió cabe. Se le dice eso, y debajo qué mover.
  const excedido = usados > max;
  const etiquetaObra = obras[0]?.label ?? t('Cochera, pórtico y patio');

  /**
   * La veta solo viaja cuando el presupuesto espacial se movió de verdad.
   *
   * La firma junta las tres cifras que lo componen: lo habitable, la obra que
   * no se habita y el techo del lote. Si el configurador se vuelve a pintar por
   * cualquier otra razón —cambió el paso, se abrió un carrusel— la firma es la
   * misma y aquí no se mueve nada. Y en la primera pintura tampoco: el hook
   * devuelve `null` hasta que hay un cambio, así que la barra no recibe al
   * cliente animándose sola.
   */
  const veta = useAnimacionAlterna(`${ft2Habitable}|${ft2Obra}|${max}`, 'lgpVetaA', 'lgpVetaB');

  /**
   * Un acuse por riel, los tres, cada uno vigilando SU cifra.
   *
   * El tercero se sumó al final y su signo va AL REVÉS que los otros dos: su
   * cifra es lo que queda libre, así que agregar una recámara la baja y ahí
   * sale "−531". Y tiene que ser así, no invertido para que "+" siga
   * significando "costó": el acuse se dibuja DENTRO de la burbuja, pegado al
   * número que explica. Si la burbuja cae de 105 a 70 y a su lado apareciera
   * "+35", la cifra estaría contradiciendo a la que tiene debajo.
   *
   * El signo aquí dice una sola cosa, y la dice bien: este número subió o
   * bajó. Que el color ya no cargue el significado —desde que cada acuse toma
   * el tono de su riel— es lo que deja el signo libre para eso.
   */
  const acuseHabitable = useAcuse(ft2Habitable);
  const acuseTotal = useAcuse(usados);
  const acuseLibre = useAcuse(libres);

  if (sinLote) {
    return (
      <div style={{ padding: '14px 16px', background: '#F7F5F2', border: '1px solid #EAE7E3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#6E7375', textTransform: 'uppercase' }}>
          {t('Presupuesto SFT')} — {t('captura tu lote para activarlo')}
        </p>
        <Cuentas recamaras={recamaras} banos={banos} cajones={cajones} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px', background: '#fff', border: '1px solid #EAE7E3' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', color: '#6E7375', textTransform: 'uppercase' }}>
            {t('Presupuesto SFT')}
          </span>
          <Cuentas recamaras={recamaras} banos={banos} cajones={cajones} />
        </span>
        {/* El número grande que vivía aquí —lo construido— se fue: ahora lo
            lleva el globo del total, vivo y sobre su propio riel, y repetirlo
            en 19px al lado de tres globos era justo el amontone que había que
            quitar. El aviso de "no cabe" sí conserva su sitio y su peso: ahí la
            cifra deja de ser un número y pasa a ser noticia. */}
        {excedido ? (
          <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '15px', letterSpacing: '-0.01em', color: OCUPADO, textTransform: 'uppercase' }}>
            No cabe
          </span>
        ) : null}
      </div>

      {/* La caja solo aparece si hay algo que ofrecer. Un "PARA QUE QUEPA" con
          nada debajo es peor que no decir nada: promete una salida y no la da.
          Hoy el configurador no manda `salidas`, así que en la práctica no se
          dibuja — el aviso de "No cabe" de arriba sí, siempre. */}
      {excedido && salidas.length ? (
        <div style={{ marginBottom: '11px', padding: '9px 11px', background: '#FFF7F9', borderLeft: '2px solid #F2004B' }}>
          <p style={{ margin: '0 0 5px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#8A2249', textTransform: 'uppercase' }}>
            Para que quepa
          </p>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            {salidas.map((t) => (
              <li key={t} style={{ fontSize: '11.5px', lineHeight: 1.55, color: '#5C6163' }}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        <Riel
          etiqueta={t('Área habitable')}
          veta={veta}
          acuse={acuseHabitable}
          ft2={ft2Habitable}
          color={HABITABLE}
          pct={pctCasa(ft2Habitable)}
          tramos={[{ key: 'living', desde: 0, ancho: pctCasa(ft2Habitable), color: HABITABLE, titulo: t('Área habitable: {n} ft²').replace('{n}', ft2Habitable.toLocaleString('es-MX')) }]}
          descripcion={`${ft2Habitable.toLocaleString('es-MX')} ft² habitables de los ${reglaCasa.toLocaleString('es-MX')} que da tu lote para la casa`}
        />
        <Riel
          etiqueta={t('Total construido')}
          veta={veta}
          acuse={acuseTotal}
          ft2={usados}
          aviso={excedido ? 'No cabe' : undefined}
          color={OCUPADO}
          pct={pct(usados)}
          /* UN SOLO TONO, el carmín de la punta.
             Llevaba dos: el tramo oscuro repetía el riel de arriba y el claro
             era la obra que no se habita, para que la suma se leyera sin
             explicarla. Se quitó por decisión del cliente — y de paso resuelve
             una incoherencia que había quedado: desde que el riel de lo
             habitable se mide contra la regla de la casa, ese tramo oscuro ya
             no era idéntico al riel de arriba cuando había exteriores puestos,
             así que invitaba a una lectura vertical que había dejado de ser
             cierta.
             Lo que se pierde es el desglose dentro de la barra. El pie de
             abajo sigue diciendo cuánto de este total es cochera, pórtico y
             patio, y el globo dice el total: entre los dos sale la resta. */
          tramos={[
            { key: 'total', desde: 0, ancho: pct(usados), color: OCUPADO, titulo: t('{total} ft² construidos: {hab} habitables y {obra} de {que}')
              .replace('{total}', usados.toLocaleString('es-MX'))
              .replace('{hab}', ft2Habitable.toLocaleString('es-MX'))
              .replace('{obra}', ft2Obra.toLocaleString('es-MX'))
              .replace('{que}', t(etiquetaObra).toLowerCase()) },
          ]}
          descripcion={excedido
            ? t('No cabe: la casa pide {pide} ft² construidos y tu lote da {da}')
                .replace('{pide}', usados.toLocaleString('es-MX'))
                .replace('{da}', max.toLocaleString('es-MX'))
            : t('{total} ft² construidos de {max}, con {obra} de {que}')
                .replace('{total}', usados.toLocaleString('es-MX'))
                .replace('{max}', max.toLocaleString('es-MX'))
                .replace('{obra}', ft2Obra.toLocaleString('es-MX'))
                .replace('{que}', t(etiquetaObra).toLowerCase())}
        />
        {/* Se llena con lo GASTADO y el globo canta lo LIBRE. No es un
            despiste: el hueco que deja el relleno es, pie por pie, la cifra del
            globo, y el globo se para justo en el filo donde ese hueco empieza. */}
        <Riel
          etiqueta={t('Libre para tu casa')}
          veta={veta}
          acuse={acuseLibre}
          ft2={libres}
          color={LIBRE}
          pct={pctTecho(ft2Habitable)}
          tramos={[{ key: 'gastado', desde: 0, ancho: pctTecho(ft2Habitable), color: LIBRE, titulo: t('Gastado del presupuesto habitable: {usado} de {techo} ft² — quedan {libres}').replace('{usado}', ft2Habitable.toLocaleString('es-MX')).replace('{techo}', techo.toLocaleString('es-MX')).replace('{libres}', libres.toLocaleString('es-MX')) }]}
          descripcion={libres > 0
            ? `Te quedan ${libres.toLocaleString('es-MX')} ft² habitables libres: llevas gastados ${ft2Habitable.toLocaleString('es-MX')} de ${techo.toLocaleString('es-MX')}`
            : `No te queda área habitable libre: llevas gastados ${ft2Habitable.toLocaleString('es-MX')} de ${techo.toLocaleString('es-MX')} ft²`}
        />
      </div>

      {/* El pie de los rieles, en UNA línea.
          A la izquierda, el único concepto que no tiene riel propio: el tramo
          claro del riel del total. La leyenda de cuatro chips de la barra vieja
          se fue con ella —cada riel ya trae su rótulo al lado— y con ella se
          fueron las tres líneas en las que se envolvía en el teléfono.
          A la derecha, lo único que los tres globos no dicen: contra qué se
          están midiendo. Va aquí y no arriba porque es el largo de la regla, y
          la regla termina justo donde termina esta línea. */}
      <p style={{ margin: '8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', color: '#6E7375', textTransform: 'uppercase' }}>
        {ft2Obra > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: OCUPADO, display: 'block', flex: 'none' }} />
            {etiquetaObra} {ft2Obra.toLocaleString('es-MX')} ft²
          </span>
        ) : <span />}
        {/* Las dos reglas, dichas. Los dos primeros rieles se miden contra el
            total construido y el tercero contra el habitable, así que decir
            solo una dejaría al cliente calculando el porcentaje del tercero
            contra la cifra equivocada. */}
        <span>{t('Tu lote da')} {max.toLocaleString('es-MX')} ft² · {techo.toLocaleString('es-MX')} {t('habitables')}</span>
      </p>
    </div>
  );
}
