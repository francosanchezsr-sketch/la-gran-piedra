'use client';

import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { ModuloIcon, CamaIcon, BanoIcon, CarroIcon } from '@/components/ConfigIcons';
import { ICONO_ZONA, ICONO_TRAGALUZ, RENDER_PLAN, RENDER_FACHADA, RENDER_PALETA } from '@/lib/assets';
import type { PlanDiagramKey } from '@/components/FloorplanDiagram';
import type { ZonaEnFicha } from '@/components/FichaCasa';
import { useT } from '@/components/ProveedorIdioma';

/**
 * LA CARPETA: el resumen del paso 3, en forma de carpeta que se abre.
 *
 * Reemplaza al duplicado en chico de la lámina del paso 5. Tenerlas las dos
 * era enseñar la misma información dos veces con dos vestidos distintos; esto
 * es otra cosa — un gesto, no una segunda lámina — así que el cliente lo
 * abre cuando quiere mirar, no lo carga todo el tiempo en pantalla.
 *
 * Va sobre dos referencias que mandó el cliente: una carpeta de Windows que
 * al pasar el cursor deja asomar los papeles de adentro, y un botón que al
 * pasar el cursor hace brincar un panel encima. Aquí son tres o cuatro
 * paneles los que brincan, en abanico y no apilados — "en forma radial".
 *
 * TODO EN `cqw`: el ancho lo pone quien use el componente (aquí, la columna
 * del paso 3) y el abanico entero escala con él, igual que la lámina de
 * `FichaCasa`. Es lo que hace que en un teléfono los paneles no se salgan de
 * la pantalla sin necesidad de una media query.
 */

const CARMIN = '#F2004B';
const CARMIN_HONDO = '#B4003B';
const VINO = '#8A2249';
const TINTA = '#1C1E1F';
const PAPEL = '#FBFBFA';
const CREMA = '#F1EEE9';
const GRIS = '#6E7375';
const GRIS_PAPEL = '#B7BABB';
const RIEL = '#E4E1DD';

// El brinco de la carpeta, no solo el de los paneles: en reposo mide el
// DOBLE, y al abrirse encoge al tamaño que ya tenía. Todo lo de dentro
// (pestaña, cuerpo, papeles) se mide en % de esta caja, así que un solo
// `transform: scale()` en `CarpetaTrigger` mueve el dibujo entero sin tener
// que recalcular una sola cifra interna.
/**
 * De dónde cuelga todo el abanico: paneles, sprites y áreas se anclan por su
 * filo de ABAJO a esta altura sobre el piso del lienzo, y de ahí suben con su
 * `translateY`. Estaba escrito a mano en cada uno; ahora vive aquí porque el
 * cálculo de qué le queda encima a la carpeta necesita la misma cifra, y dos
 * copias del mismo número es como empiezan a no coincidir.
 */
const ANCLA_ABANICO = 19; // cqw
// El alto que pide el abanico cuando NADA se hunde por debajo del piso. Lo que
// se hunde se le suma aparte, en `ALTO_EF`.
const ALTO_BASE = 58; // cqw

// Cuánto ocupa el rótulo de abajo de cada cosa, en cqw. Sirve para saber si
// ese texto termina encima de la carpeta.
const ROTULO_ZONA = 2.3;
const ROTULO_SPRITE = 3.1;
// Lo que se transparenta la carpeta para dejar leer un rótulo que le cayó
// encima.
const CARPETA_OPACA = 0.7;

const CARPETA_ANCHO_N = 19; // cqw
const CARPETA_ANCHO = `${CARPETA_ANCHO_N}cqw`;
// 19 / 1.364 — la proporción exacta del dibujo de referencia, medida sobre
// el video cuadro por cuadro. El ancho manda (es el que el abanico ya tiene
// calibrado) y el alto se acomoda para no deformar la figura.
const CARPETA_ALTO_N = 13.9; // cqw
const CARPETA_ALTO = `${CARPETA_ALTO_N}cqw`;

// Los DOS paneles de texto van fijos, uno a cada lado. Su filo interior deja
// libres los sprites, y de las zonas los separa la ALTURA: el anillo no sube
// hasta aquí (ver `ANILLO_DESDE`/`ANILLO_HASTA`).
// 25 y no 32: con 32, el filo exterior del panel caía en 37 + 16 = 53cqw del
// centro y la caja solo llega a 50 — los dos paneles se salían 3cqw por cada
// lado y se dibujaban encima de lo que hubiera al costado. Con 25 el filo cae
// en 49.5 y queda dentro, sin acercar el filo INTERIOR a los sprites (37 -
// 12.5 = 24.5, y el sprite más ancho llega a 20.5).
const TEXTO_ANCHO = 25;
const TEXTO_X = 37;
const TEXTO_POS = [
  { x: -TEXTO_X, y: -12 },
  { x: TEXTO_X, y: -12 },
];

// LOS TRES SPRITES — fachada, floorplan y paleta. El floorplan se queda
// SOLO y arriba —es el que manda, y por eso el más grande de los tres—;
// fachada y paleta bajan a su altura natural (sin subir nada, `y: 0`), más
// cerca de la carpeta, cerrando el hueco que quedaba vacío ahí.
const SPRITE_ANCHO = 13; // cqw -- fachada y paleta.
const FLOORPLAN_ANCHO = 20.4; // cqw -- más grande: es el único que queda solo en su franja (17 × 1.2).
const FLOORPLAN_Y = -22;
const SPRITE_DX = 14;
const SPRITE_POS = [
  { x: -SPRITE_DX, y: 0, w: SPRITE_ANCHO }, // fachada
  { x: 0, y: FLOORPLAN_Y, w: FLOORPLAN_ANCHO }, // floorplan
  { x: SPRITE_DX, y: 0, w: SPRITE_ANCHO }, // paleta
];

/**
 * LAS ZONAS — EN ANILLO ALREDEDOR DE LA CARPETA, de forma radial.
 *
 * Antes iban en dos columnas a los lados. El cliente las pidió repartidas
 * alrededor de la carpeta, así que ahora se colocan sobre una elipse centrada
 * en ella: se reparten por igual sobre un arco que entra por arriba a la
 * izquierda, baja, cruza por debajo de la carpeta y sube por la derecha.
 *
 * El arco NO cierra por arriba a propósito: ahí viven los sprites y los dos
 * paneles de texto. El hueco que queda es justo el que ellos ocupan.
 *
 * El RADIO no es fijo: sale de cuántas zonas hay. Se calcula el que hace falta
 * para que entre ficha y ficha quede su propio ancho más un respiro, y se
 * mantiene entre un mínimo —pegado a la carpeta, para cuando hay dos o tres— y
 * un máximo que no se sale de la caja. Así el anillo crece en vez de encimarse.
 */
// Centro de la carpeta visto desde el ancla del abanico: la carpeta se apoya
// en el piso y el ancla está `ANCLA_ABANICO` más arriba, así que su centro
// cae por DEBAJO del ancla. De aquí cuelga la elipse.
const CENTRO_CARPETA = CARPETA_ALTO_N / 2 - ANCLA_ABANICO;
const FLANCO_ANCHO = 11.4; // cqw -- el ancho de cada ficha de zona.
// Icono + aire + rótulo. Medido en pantalla sobre la ficha ya renderizada
// (22.9cqw agrandada 2.5× = 9.2): el 8.5 que había aquí se quedaba corto, y
// como de esta cifra salen el reparto del anillo y los topes de la caja, el
// error se notaba justo donde importa — una ficha agrandada asomaba 2cqw por
// debajo del componente.
const FLANCO_ALTO_ITEM = 9.2;
// El arco: 0° es a la derecha y se avanza en contra del reloj. De 150°
// (arriba a la izquierda) a 390° (= 30°, arriba a la derecha), pasando por
// abajo. Los 120° que faltan son el techo, reservado a sprites y paneles.
const ANILLO_DESDE = 150;
const ANILLO_HASTA = 390;
// Qué tan ovalada: más alta que ancha, porque en los costados las fichas se
// apilan en vertical y ahí el que manda es su alto, no su ancho.
const ANILLO_RY_FACTOR = 0.82;
const ANILLO_R_MIN = 19; // cqw -- pegado a la carpeta sin tocarla.
// Tope: el radio más el medio ancho de una ficha no puede pasar de la mitad
// de la caja (50cqw), o el anillo se saldría por los costados.
const ANILLO_R_MAX = 50 - FLANCO_ANCHO / 2 - 1;

// Cuánto crece un sprite o un área cuando el cursor se para encima.
const LUPA = 2.5;
// La ventana de texto crece mucho menos: es un bloque grande y ya se lee sin
// ayuda; con el 2.5 de los iconos taparía media lámina. Un 20 % basta para
// decir "es esta" sin robarle el sitio a nada.
const LUPA_VENTANA = 1.2;

/**
 * EL MANOJO DE GLOBOS: lo que crece empuja a lo que tiene cerca.
 *
 * Sin esto, el elemento bajo la lupa —dos y media veces su tamaño— se comía
 * a sus vecinos: el rótulo de un área quedaba escrito encima del de la de
 * abajo y no se leía ninguno de los dos.
 *
 * El empuje es por CERCANÍA, no por choque de cajas: cada vecino se aparta
 * en la dirección que lo aleja del que creció, y tanto más cuanto más cerca
 * esté. Un cálculo de "cuánto se encima exactamente" daría empujones secos y
 * en cruz; así el grupo entero se acomoda como los globos de un manojo
 * cuando uno se infla.
 */
// Cuánto se estorban dos elementos se mide entre sus BORDES y no entre sus
// centros: un panel de texto mide 32 cqw de ancho, así que estorba desde
// mucho antes de que su centro quede cerca. Medir de centro a centro los
// dejaba fuera del reparto —parecían clavados mientras todo lo demás se
// movía— y por eso el modelo pasó a contar el tamaño de cada uno.
const GLOBO_AIRE = 1.5; // cqw de respiro entre dos que ya no se tocan.
const GLOBO_EMPUJE = 13; // cqw como mucho, por lejos que haya que apartarse.
// Los paneles se apartan menos que un icono: son el marco de la lámina y
// mandarlos a volar desacomoda la lectura. Pero se mueven, y se nota.
const GLOBO_MASA_PANEL = 0.6;

/**
 * El alto de un sprite en cqw: la imagen guarda su proporción y debajo va el
 * rótulo. `ratio` viene como "ancho / alto" (lo que entiende `aspect-ratio`),
 * así que el alto de la imagen es ancho × (b / a).
 */
function altoSprite(anchoCqw: number, ratio: string): number {
  const [a, b] = ratio.split('/').map((n) => parseFloat(n.trim()));
  const alto = a && b ? anchoCqw * (b / a) : anchoCqw;
  return alto + 3.6; // el rótulo de abajo
}

/** Dónde cae cada zona: repartidas por igual sobre el arco del anillo. */
function posicionesZonas(total: number): { x: number; y: number; w: number }[] {
  if (total === 0) return [];

  // El anillo para un radio dado. `x`/`y` son los que usa el abanico: `y`
  // crece hacia abajo y marca el filo INFERIOR de la ficha, que cuelga medio
  // alto por debajo de su centro.
  const anillo = (rx: number) => {
    const ry = rx * ANILLO_RY_FACTOR;
    return Array.from({ length: total }, (_, i) => {
      const t = total === 1 ? 0.5 : i / (total - 1);
      const ang = ((ANILLO_DESDE + t * (ANILLO_HASTA - ANILLO_DESDE)) * Math.PI) / 180;
      const centro = CENTRO_CARPETA + ry * Math.sin(ang);
      return { x: rx * Math.cos(ang), y: -(centro - FLANCO_ALTO_ITEM / 2), w: FLANCO_ANCHO };
    });
  };

  // ¿Alguna ficha toca a otra? Se comparan sus cajas de verdad, no la
  // distancia entre centros: la elipse aprieta más en unos tramos que en
  // otros —en los costados mandan los altos y abajo los anchos—, así que una
  // cuenta de "cuánto arco le toca a cada una" se queda corta justo en las
  // esquinas. Fue lo que dejó dos pares encimados por 12px.
  const seEnciman = (pos: { x: number; y: number }[]) => {
    const HOLGURA = 1.2; // cqw de aire mínimo entre fichas.
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = Math.abs(pos[i].x - pos[j].x);
        const dy = Math.abs(pos[i].y - pos[j].y);
        if (dx < FLANCO_ANCHO + HOLGURA && dy < FLANCO_ALTO_ITEM + HOLGURA) return true;
      }
    }
    return false;
  };

  // Se abre el anillo hasta que ninguna toque a ninguna. Son trece zonas como
  // mucho y pasos de medio cqw: el bucle termina en unas cuantas vueltas.
  let rx = ANILLO_R_MIN;
  let pos = anillo(rx);
  while (seEnciman(pos) && rx < ANILLO_R_MAX) {
    rx = Math.min(ANILLO_R_MAX, rx + 0.5);
    pos = anillo(rx);
  }
  return pos;
}

/**
 * El mismo icono que ya usa el menú de zonas (`ZonasPanel`) y la lámina del
 * paso 5: casi todas las zonas tienen su propio PNG en `ICONO_ZONA`; las que
 * no —master + patio, master + balcón— caen al glifo de trazo. Repetir esta
 * regla en un tercer lugar era el riesgo: si aquí se dibujaba distinto, la
 * misma zona se veía con dos caras según por dónde la mirara el cliente.
 */
function ZonaIcono({ iconKey }: { iconKey: string }) {
  const src = iconKey === '__tragaluz' ? ICONO_TRAGALUZ : ICONO_ZONA[iconKey];
  return (
    // Cuadro por relleno, no por `aspect-ratio`: como hijo de una columna
    // flex, `aspect-ratio` no se estaba respetando (el cuadro salía más alto
    // que ancho) y eso desangraba `FLANCO_ALTO_ITEM`, el número del que
    // depende cuántos renglones caben antes de tocar el piso de los sprites.
    // El relleno-por-porcentaje SIEMPRE se calcula sobre el ANCHO del propio
    // elemento, sin importar el contexto — no depende de si es hijo de un
    // flex ni de si el padre tiene alto definido.
    <div style={{ width: '56%', position: 'relative' }}>
      <div style={{ paddingBottom: '100%' }} />
      <div style={{ position: 'absolute', inset: 0 }}>
        {src ? (
          <img src={src} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        ) : (
          <ModuloIcon moduleKey={iconKey} size="100%" />
        )}
      </div>
    </div>
  );
}

type Glifo = ComponentType<{ size?: number | string; color?: string }>;
type LineaTexto = { tipo?: 'texto'; fuerte?: boolean; texto: string; color?: string };
// La misma pareja cama/baño/coche que ya usan `PresupuestoBar` y el resumen
// del paso 3 en el propio configurador — no un icono nuevo dibujado aquí a
// propósito, para que "programa" se lea igual dondequiera que el cliente lo
// mire.
type LineaIconos = { tipo: 'iconos'; items: { key: string; Icono: Glifo; valor: number }[] };
type Panel = { tipo: 'texto'; rotulo: string; lineas: (LineaTexto | LineaIconos)[] };

export default function CarpetaHistorial({
  planKey, planNombre, loteForma, loteArea, direccion,
  ft2Living, ft2Total, recamaras, banos, cajones,
  fachadaKey, fachadaNombre, fachadaFija, fachadaImagen = null,
  interiorKey, interiorNombre,
  zonas, tragaluces = [],
}: {
  planKey: PlanDiagramKey | null;
  planNombre: string;
  loteForma: string;
  loteArea: string;
  direccion: string;
  ft2Living: number;
  ft2Total: number;
  recamaras: number;
  banos: number;
  cajones: number;
  fachadaKey: string | null;
  fachadaNombre: string;
  fachadaFija?: boolean;
  fachadaImagen?: string | null;
  interiorKey: string | null;
  interiorNombre: string;
  zonas: ZonaEnFicha[];
  tragaluces?: string[];
}) {
  const t = useT();
  /**
   * LA LUPA: qué elemento del abanico está agrandado, o `null`.
   *
   * Solo la llevan los sprites y las áreas. Los dos paneles de texto NO: son
   * ventanas para leer, y ampliarlas no enseña nada que no estuviera ya
   * escrito — crecer ahí solo taparía al resto.
   *
   * En táctil el toque hace de cursor: el primero agranda y el segundo
   * regresa, porque un dedo no tiene "salir del elemento".
   */
  const [enfocado, setEnfocado] = useState<string | null>(null);

  const [hover, setHover] = useState(false);
  // El clic fija la apertura — es lo que permite abrirla a golpe de dedo en
  // una pantalla táctil, donde no existe el cursor que la referencia asume.
  const [fija, setFija] = useState(false);
  const abierto = hover || fija;

  // Un respiro antes de cerrar: cruzar de la carpeta a un panel pasa un
  // instante fuera de los dos, y sin esto la carpeta se cerraba a medio
  // camino antes de que el cursor llegara al panel que iba a leer.
  // Cerrada no hay lupa que valga, sin importar lo que quedó guardado: se
  // deriva en vez de sincronizarse con un efecto, que aquí sería estado
  // duplicado. Y al abrir se limpia (ver `entra`), para que no reaparezca
  // agrandado un elemento que nadie está señalando.
  const conLupa = abierto ? enfocado : null;

  const cierre = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entra = () => { if (cierre.current) clearTimeout(cierre.current); setEnfocado(null); setHover(true); };
  const sale = () => { cierre.current = setTimeout(() => setHover(false), 160); };
  useEffect(() => () => { if (cierre.current) clearTimeout(cierre.current); }, []);

  // Un toque afuera la cierra si quedó fija. Sin esto, quien la abrió con un
  // toque —no hay cursor que "se vaya"— solo podía cerrarla tocándola de
  // nuevo, y en una pantalla larga ya se le había perdido de vista.
  const raiz = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!fija) return;
    const fuera = (e: PointerEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setFija(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [fija]);

  /** Los tres manejadores de la lupa, iguales para sprites y áreas. */
  const lupa = (clave: string) => ({
    onMouseEnter: () => setEnfocado(clave),
    onMouseLeave: () => setEnfocado((k) => (k === clave ? null : k)),
    onClick: () => setEnfocado((k) => (k === clave ? null : clave)),
  });
  /**
   * La capa que hace el zoom va POR DENTRO de la que posiciona, y no las dos
   * en un mismo `transform`: la de afuera ya trae el `translate` del abanico
   * y su propia transición con retardo escalonado, así que meter aquí el
   * `scale` heredaría ese retardo y la lupa se sentiría floja. Separadas,
   * cada una tiene su tiempo.
   */
  const capaLupa = (clave: string, factor = LUPA) => {
    const { dx, dy } = apartado(clave);
    // El acercamiento a la carpeta: solo cuando ESTE es el que está
    // agrandado. Va sumado al `translate` de esta misma capa —que corre
    // antes del `scale`, así que el viaje no se multiplica por el aumento— y
    // por eso vuelve solo a su sitio en cuanto el cursor se va, con la misma
    // transición y sin nada que deshacer a mano.
    const ax = conLupa === clave && viajeLupa ? viajeLupa.ax : 0;
    const ay = conLupa === clave && viajeLupa ? viajeLupa.ay : 0;
    // LO QUE CRECE TAMPOCO PUEDE SALIRSE. Al agrandarse, un elemento pegado a
    // un filo asoma por fuera del componente y, como flota, se dibuja encima
    // de la página. Si pasa, se corre lo justo para volver adentro: mejor
    // moverlo un poco que enseñarlo cortado o encima de un texto.
    const yo = conLupa === clave ? flotantes.find((e) => e.clave === clave) : undefined;
    let cx = 0;
    let cy = 0;
    if (yo) {
      // Un pelo más grandes que el modelo: el rótulo de abajo es texto real y
      // su alto depende de la fuente del navegador, así que el cálculo nunca
      // va a clavarlo al milímetro. El margen hace que el error caiga del
      // lado seguro — adentro.
      const MARGEN = 1.06;
      const hx = ((yo.ancho * factor) / 2) * MARGEN;
      const hy = ((yo.alto * factor) / 2) * MARGEN;
      const anclaEF = ANCLA_ABANICO + EXCEDENTE;
      const altoEF = ALTO_BASE + EXCEDENTE;
      const x = yo.cx + dx + ax;
      const y = yo.cy + dy + ay;
      cx = Math.min(50 - hx, Math.max(-(50 - hx), x)) - x;
      // `y` crece hacia abajo desde el ancla: el filo de abajo del elemento
      // está a `anclaEF - y - hy` del piso y el de arriba a `anclaEF - y + hy`.
      cy = Math.min(anclaEF - hy, Math.max(anclaEF + hy - altoEF, y)) - y;
    }
    return {
    // El apartarse va aquí y no en la capa de afuera a propósito: esa trae la
    // animación de apertura con su retardo escalonado, y el manojo tiene que
    // reaccionar al instante. `translate` antes que `scale` para que el
    // desplazamiento no se multiplique por el aumento.
    transform: `translate(${(dx + ax + cx).toFixed(2)}cqw, ${(dy + ay + cy).toFixed(2)}cqw) scale(${conLupa === clave ? factor : 1})`,
    // Crece desde su CENTRO, no desde el filo de abajo como la capa de
    // afuera: los sprites viven pegados al techo del lienzo y creciendo hacia
    // arriba se salían de cuadro — la mitad del aumento quedaba cortada.
    // Desde el centro el desborde se reparte y siempre se ve entero.
    transformOrigin: 'center center' as const,
    transition: 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    };
  };

  const enBanda: ZonaEnFicha[] = [
    ...zonas,
    ...(tragaluces.length ? [{ iconKey: '__tragaluz', nombre: `${tragaluces.length} tragaluz${tragaluces.length > 1 ? 'es' : ''}` }] : []),
  ];
  const posEnBanda = posicionesZonas(enBanda.length);

  /**
   * CUÁNTO SE SALE EL ABANICO POR DEBAJO, y cuánto hay que reservarle.
   *
   * Las zonas se reparten en renglones que arrancan abajo y suben; el de más
   * arriba tiene que quedar por debajo de los paneles de texto, así que con
   * muchas zonas los renglones de abajo se van hundiendo. Pasado cierto número
   * cruzan el piso del componente y, como son `position:absolute`, siguen
   * dibujándose encima de lo que haya debajo en la página — el brief, la
   * ventana de al lado, lo que toque. Medido con 12 zonas: casi 30cqw por
   * debajo del piso, encima del texto del paso.
   *
   * La caja no puede ignorar lo que dibuja. Se mide el renglón más bajo, se
   * sube TODO el conjunto —carpeta incluida, para que la composición no cambie
   * ni un pixel— y la caja crece lo mismo que se subió. Así el abanico siempre
   * cabe dentro de su propio espacio, con las zonas que sean.
   */
  // `y` positivo baja: el filo de abajo de esa ficha cae a `ANCLA_ABANICO - y`.
  const hundimiento = posEnBanda.reduce((max, pos) => Math.max(max, pos.y), 0);
  const EXCEDENTE = Math.max(0, hundimiento - ANCLA_ABANICO);
  const ANCLA_EF = `${ANCLA_ABANICO + EXCEDENTE}cqw`;
  const ALTO_EF = `${ALTO_BASE + EXCEDENTE}cqw`;
  const PISO_CARPETA = `${EXCEDENTE}cqw`;

  const paneles: Panel[] = [
    {
      // El nombre del plano se quitó de aquí: ahora es el sprite del
      // floorplan el que lo dice (y ya viene ampliado, más fácil de leer
      // que este texto) — repetirlo dos veces era la misma redundancia que
      // ya se había resuelto para fachada y paleta.
      tipo: 'texto', rotulo: t('Tu lote'),
      lineas: [
        { fuerte: true, texto: `${loteForma} · ${loteArea}` },
        { texto: direccion.trim() || t('Dirección por confirmar'), color: GRIS },
      ],
    },
    {
      // La fachada y la paleta se sacaron de aquí: ahora tienen su propio
      // sprite en el abanico, y repetirlas en texto era decir lo mismo dos
      // veces. Este panel se queda con lo que un sprite no puede mostrar —
      // los números.
      tipo: 'texto', rotulo: 'Programa',
      lineas: [
        {
          tipo: 'iconos',
          items: [
            { key: 'rec', Icono: CamaIcon, valor: recamaras },
            { key: 'ban', Icono: BanoIcon, valor: banos },
            { key: 'gar', Icono: CarroIcon, valor: cajones },
          ],
        },
        { texto: t('{hab} de {total} ft²').replace('{hab}', ft2Living.toLocaleString('es-MX')).replace('{total}', ft2Total.toLocaleString('es-MX')), color: GRIS },
      ],
    },
  ];

  // Los tres sprites: el mismo render que ya se usó para elegir cada uno, en
  // los pasos 1, 2 y 3. `RENDER_FACHADA`/`RENDER_PALETA` faltan cuando el
  // cliente no ha elegido todavía; `fachadaImagen` es el render de la
  // subdivisión, para cuando el reglamento ya trae puesta la fachada.
  const sprites: { key: string; src: string | null; foto?: boolean; caption: string; ratio: string }[] = [
    {
      key: 'fachada',
      src: fachadaKey ? RENDER_FACHADA[fachadaKey] ?? null : fachadaImagen,
      foto: !fachadaKey && Boolean(fachadaImagen),
      caption: fachadaKey ? t(fachadaNombre) : fachadaFija ? t('De la subdivisión') : t('Sin fachada'),
      ratio: '1 / 0.86',
    },
    {
      key: 'floorplan',
      src: planKey ? RENDER_PLAN[planKey] ?? null : null,
      caption: planNombre,
      ratio: '1100 / 821',
    },
    {
      key: 'paleta',
      src: interiorKey ? RENDER_PALETA[interiorKey] ?? null : null,
      caption: interiorKey ? t(interiorNombre) : t('Sin paleta'),
      ratio: '1 / 1',
    },
  ];

  /**
   * Todos los que flotan, con su centro y su tamaño en cqw. Es lo que hace
   * falta para saber quién le estorba a quién.
   *
   * El ancla vertical de cada uno es su filo de ABAJO (van con `bottom` más
   * un `translateY`), así que el centro está media altura más arriba — y
   * "arriba" aquí es más negativo.
   */
  type Globo = {
    clave: string; cx: number; cy: number; radio: number; masa: number; lupa: number;
    /** El `translateY` con el que nace, su alto y ancho totales, y cuánto de
     *  ese alto es el rótulo de abajo (0 en las ventanas, que no llevan). */
    y: number; alto: number; ancho: number; rotulo: number;
    /** Las zonas se acercan a la carpeta cuando se agrandan (ver `viajeLupa`);
     *  los sprites y las ventanas crecen en su sitio. */
    viaja?: boolean;
  };
  const radioDe = (w: number, h: number) => Math.hypot(w, h) / 2;
  const flotantes: Globo[] = [
    ...paneles.map((_, i) => {
      const alto = 26; // aproximado: el texto es variable y no hace falta al milímetro
      return {
        clave: `panel:${i}`,
        cx: TEXTO_POS[i].x,
        cy: TEXTO_POS[i].y - alto / 2,
        radio: radioDe(TEXTO_ANCHO, alto),
        masa: GLOBO_MASA_PANEL,
        lupa: LUPA_VENTANA,
        y: TEXTO_POS[i].y, alto, ancho: TEXTO_ANCHO, rotulo: 0,
      };
    }),
    ...sprites.map((sp, i) => {
      const alto = altoSprite(SPRITE_POS[i].w, sp.ratio);
      return {
        clave: `sprite:${sp.key}`,
        cx: SPRITE_POS[i].x,
        cy: SPRITE_POS[i].y - alto / 2,
        radio: radioDe(SPRITE_POS[i].w, alto),
        masa: 1,
        lupa: LUPA,
        y: SPRITE_POS[i].y, alto, ancho: SPRITE_POS[i].w, rotulo: ROTULO_SPRITE,
      };
    }),
    ...enBanda.map((z, i) => {
      const pos = posEnBanda[i];
      return pos
        ? {
            clave: `zona:${z.iconKey}:${z.nombre}`,
            cx: pos.x,
            cy: pos.y - FLANCO_ALTO_ITEM / 2,
            radio: radioDe(pos.w, FLANCO_ALTO_ITEM),
            masa: 1,
            lupa: LUPA,
            y: pos.y, alto: FLANCO_ALTO_ITEM, ancho: pos.w, rotulo: ROTULO_ZONA,
            viaja: true,
          }
        : null;
    }).filter(Boolean) as Globo[],
  ];

  /**
   * EL VIAJE A LA CARPETA de la zona que está agrandada.
   *
   * Todas hacen lo mismo: crecen y se van HACIA EL CENTRO, hasta quedar
   * PEGADAS A LA CARPETA. Cada una entra por su propia dirección —la de abajo
   * sube, la de la izquierda entra por la izquierda, la de la esquina entra en
   * diagonal—, así que el gesto se lee como un imán: la carpeta las llama.
   * Si un día se mostraran varias a la vez, cada una tendría su sitio
   * alrededor del filo, sin pelearse, porque cada una llega por su lado.
   *
   * Lo único que la detiene es la CARPETA. Antes también la frenaban los
   * sprites y las ventanas de texto, y por eso las de las esquinas de arriba
   * se quedaban a medio camino o acababan desterradas abajo. Ahora pasa por
   * encima de ellos: durante ese momento la ficha agrandada es lo que el
   * cliente está mirando, va al frente (`zIndex`) y lo de atrás sigue ahí
   * cuando suelta. Lo que NO puede es salirse del componente — de eso se
   * encarga el tope de `capaLupa`.
   */
  const AIRE_LUPA = 1.2; // cqw de respiro con el filo de la carpeta.
  const viajeLupa: { ax: number; ay: number } | null = (() => {
    const foco = conLupa ? flotantes.find((e) => e.clave === conLupa) : null;
    if (!foco?.viaja) return null;
    // Todo en el eje que ya usan los globos: `y` crece hacia ABAJO y el cero
    // está en el ancla del abanico.
    const carpeta = {
      cx: 0, cy: ANCLA_ABANICO - CARPETA_ALTO_N / 2,
      hx: CARPETA_ANCHO_N / 2, hy: CARPETA_ALTO_N / 2,
    };
    // El rótulo es texto real y mide un poco más que el modelo, así que la
    // ficha se cuenta con holgura: sin ella se montaba sobre el filo.
    const hx = ((foco.ancho * foco.lupa) / 2) * 1.06;
    const hy = ((foco.alto * foco.lupa) / 2) * 1.06;
    const despegada = (x: number, y: number) =>
      Math.abs(x - carpeta.cx) >= hx + carpeta.hx + AIRE_LUPA
      || Math.abs(y - carpeta.cy) >= hy + carpeta.hy + AIRE_LUPA;
    // Desde el centro de la carpeta hacia su sitio, de a poco: el primer
    // punto que ya no la invade es el más pegado que puede estar.
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const x = carpeta.cx + (foco.cx - carpeta.cx) * t;
      const y = carpeta.cy + (foco.cy - carpeta.cy) * t;
      if (despegada(x, y)) return { ax: x - foco.cx, ay: y - foco.cy };
    }
    // Ya está más lejos que eso: se queda donde está.
    return { ax: 0, ay: 0 };
  })();

  /**
   * Cuánto se aparta cada uno cuando otro está bajo la lupa. Sin lupa, el
   * mapa va vacío y todos se quedan donde el abanico los puso.
   */
  const empujes = new Map<string, { dx: number; dy: number }>();
  if (conLupa) {
    const foco = flotantes.find((e) => e.clave === conLupa);
    // Si el que creció SE VA —las zonas viajan a la carpeta—, nadie tiene de
    // qué apartarse: deja su hueco libre al crecer. Empujar igual era lo que
    // mandaba a sus dos vecinas una contra la otra, y a las de arriba contra
    // las ventanas de texto. El empuje se queda para lo que crece EN SU SITIO:
    // los sprites.
    if (foco && !foco.viaja) {
      // Cada uno ocupa su radio por lo que crece: 2.5 un icono, 1.2 una
      // ventana.
      const radioFoco = foco.radio * foco.lupa;
      // El que empuja crece en su sitio (lo asegura el `!foco.acerca` de
      // arriba), así que se mide desde donde está.
      for (const e of flotantes) {
        if (e.clave === conLupa) continue;
        const dx = e.cx - foco.cx;
        const dy = e.cy - foco.cy;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) continue;
        // Cuánto se meten uno en el otro. Si no se tocan, nadie se mueve.
        const encimado = radioFoco + e.radio + GLOBO_AIRE - dist;
        if (encimado <= 0) continue;
        const fuerza = Math.min(encimado, GLOBO_EMPUJE) * e.masa;
        let px = (dx / dist) * fuerza;
        let py = (dy / dist) * fuerza;
        // EL EMPUJÓN NO PUEDE SACARLO DE LA CAJA. Apartarse está bien;
        // apartarse hasta la calle, no: lo que sale del componente se dibuja
        // encima del texto de la página. Se le pone tope con su propio
        // tamaño y los filos del lienzo.
        const topeX = 50 - e.ancho / 2;
        px = Math.min(topeX, Math.max(-topeX, e.cx + px)) - e.cx;
        // `y` crece hacia abajo y el filo de abajo del elemento cae a
        // `anclaEF - (y + py)` sobre el piso: de ahí salen los dos topes.
        const anclaEF = ANCLA_ABANICO + EXCEDENTE;
        const altoEF = ALTO_BASE + EXCEDENTE;
        py = Math.min(anclaEF - e.y, Math.max(anclaEF - altoEF - e.y + e.alto, py));
        empujes.set(e.clave, { dx: px, dy: py });
      }
    }
  }
  /** El desplazamiento de un elemento, listo para meter en un `translate`. */
  const apartado = (clave: string) => empujes.get(clave) ?? { dx: 0, dy: 0 };

  /**
   * LA CARPETA SE TRANSPARENTA MIENTRAS ALGO ESTÁ AGRANDADO.
   *
   * Antes solo lo hacía cuando el cálculo decía que un rótulo le caía encima.
   * Ya no hace falta afinar tanto: desde que las zonas viajan hasta pegarse a
   * ella, lo que crece SIEMPRE termina sobre su filo o muy cerca, y la
   * carpeta —magenta lleno— se traga el icono y su nombre. Es lo que se ve en
   * la zona que el cliente señaló: la ficha encima del rojo, ilegible.
   *
   * Así que la regla es la simple: si hay algo bajo la lupa, la carpeta se
   * atenúa; en reposo se ve entera, que es como debe verse. Vale para
   * cualquier pieza —las zonas, los tres sprites— y para las que se agreguen
   * después, porque no mira QUÉ creció, solo si hay algo creciendo.
   */
  const carpetaTapada = conLupa !== null;

  return (
    <div
      ref={raiz}
      onMouseEnter={entra}
      onMouseLeave={sale}
      style={{
        position: 'relative', containerType: 'inline-size', width: '100%', maxWidth: '560px',
        // Alto fijo y no `auto`: los paneles son `position:absolute` y no
        // empujan el alto del contenedor. Sin reservarlo de antemano, abrir
        // la carpeta no movería nada — los paneles aparecerían flotando
        // fuera de su propia caja, y el punto donde el cursor deja de estar
        // "sobre el componente" quedaría mal calculado.
        //
        // Ya no depende de cuántas zonas hay: el corredor de las columnas es
        // el mismo ancho siempre (ver `posicionesZonas`), así que un solo
        // alto alcanza para cualquier cantidad.
        height: ALTO_EF, minHeight: '200px',
      }}
    >
      {paneles.map((p, i) => {
        const { x, y } = TEXTO_POS[i] ?? { x: 0, y: -12 };
        return (
          <div
            key={i}
            {...lupa(`panel:${i}`)}
            style={{
              position: 'absolute', left: '50%', bottom: ANCLA_EF,
              width: `${TEXTO_ANCHO}cqw`,
              transform: abierto
                ? `translate(calc(-50% + ${x}cqw), ${y}cqw) scale(1)`
                : 'translate(-50%, 0) scale(0.35)',
              transformOrigin: 'center bottom',
              opacity: abierto ? 1 : 0,
              pointerEvents: abierto ? 'auto' : 'none',
              // Cada panel sale un pelo después del anterior — el abanico se
              // abre en cascada y no de golpe, que es lo que lo hace leerse
              // como un despliegue y no como un parpadeo. `back-out` es la
              // curva con rebote: el panel se pasa un poco de su sitio final
              // y regresa, el "brinco" que pedía la referencia.
              transition: `transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 55}ms, opacity 260ms ease ${i * 55}ms`,
              zIndex: conLupa === `panel:${i}` ? 6 : 2,
            }}
          >
          {/* El vestido del panel va en su propia capa, igual que en los
              sprites y las áreas: la de afuera trae la animación de apertura
              con su retardo, y el apartarse tiene que ser inmediato. */}
          <div style={{
            ...capaLupa(`panel:${i}`, LUPA_VENTANA),
            background: PAPEL,
            border: '1px solid #EAE7E3',
            borderRadius: '10px',
            boxShadow: '0 12px 26px rgba(28,30,31,0.18)',
            padding: '3.2cqw 3.6cqw',
          }}>
            <p style={{ margin: '0 0 1.6cqw', fontFamily: "'IBM Plex Mono', monospace", fontSize: 'clamp(8px, 2.4cqw, 10px)', letterSpacing: '0.1em', color: GRIS, textTransform: 'uppercase' }}>{p.rotulo}</p>
            {p.lineas.map((l, j) => {
              if (l.tipo === 'iconos') {
                return (
                  // Se acomodan DENTRO de la ventana: la fila de recámaras,
                  // baños y cajones pide unos 29cqw y la ventana da 21, así
                  // que el coche se salía por el filo y quedaba cortado.
                  // Con `wrap` el que no cabe baja al renglón siguiente en vez
                  // de desbordarse, y los huecos se aprietan un poco para que
                  // quepan dos por renglón.
                  <div key={j} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.4cqw 2.6cqw', margin: j === 0 ? 0 : '1cqw 0 0' }}>
                    {l.items.map(({ key, Icono, valor }) => (
                      <span key={key} style={{ display: 'flex', alignItems: 'center', gap: '1cqw' }}>
                        <span style={{ width: '4cqw', aspectRatio: '1 / 1', display: 'inline-block' }}>
                          <Icono size="100%" color={TINTA} />
                        </span>
                        <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 'clamp(11px, 3cqw, 14px)', color: TINTA }}>{valor}</span>
                      </span>
                    ))}
                  </div>
                );
              }
              return (
                <p key={j} style={{ margin: j === 0 ? 0 : '0.5cqw 0 0', fontFamily: l.fuerte ? 'Archivo, sans-serif' : undefined, fontWeight: l.fuerte ? 800 : 400, fontSize: l.fuerte ? 'clamp(12px, 3.4cqw, 15px)' : 'clamp(10.5px, 3cqw, 12.5px)', lineHeight: 1.4, color: l.color ?? TINTA }}>
                  {l.texto}
                </p>
              );
            })}
          </div>
          </div>
        );
      })}

      {/* LOS TRES SPRITES — fachada, floorplan, paleta —, cada uno con su
          nombre debajo. Su propio piso, encima de las zonas: ver
          `SPRITE_POS`. */}
      {sprites.map((s, i) => (
        <div
          key={s.key}
          {...lupa(`sprite:${s.key}`)}
          style={{
            position: 'absolute', left: '50%', bottom: ANCLA_EF,
            width: `${SPRITE_POS[i].w}cqw`,
            transform: abierto
              ? `translate(calc(-50% + ${SPRITE_POS[i].x}cqw), ${SPRITE_POS[i].y}cqw) scale(1)`
              : 'translate(-50%, 0) scale(0.3)',
            transformOrigin: 'center bottom',
            opacity: abierto ? 1 : 0,
            // Cerrada no recibe cursor: el abanico no existe para el ratón
            // hasta que está desplegado.
            pointerEvents: abierto ? 'auto' : 'none',
            cursor: abierto ? 'pointer' : 'default',
            transition: `transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 55}ms, opacity 260ms ease ${i * 55}ms`,
            // El que está bajo la lupa pasa al frente, o crecería por debajo
            // de sus vecinos.
            zIndex: conLupa === `sprite:${s.key}` ? 6 : 2,
          }}
        >
        <div style={capaLupa(`sprite:${s.key}`)}>
          <div style={{ width: '100%', aspectRatio: s.ratio, overflow: 'hidden', borderRadius: '8px', background: s.src ? 'transparent' : CREMA, border: s.src ? undefined : `1px dashed ${RIEL}`, boxShadow: s.src ? '0 8px 18px rgba(28,30,31,0.2)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {s.src ? (
              <img src={s.src} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: s.foto ? 'cover' : 'contain', display: 'block' }} />
            ) : null}
          </div>
          {/* Sin piso en px (el techo de 8.6px alcanza para que no crezca de
              más en desktop) y una sola línea siempre: el nombre de una
              paleta puede ser largo ("Nogal + Mármol Crema"), y sin `nowrap`
              envuelve a dos en cuanto la caja se angosta — el doble del alto
              que `SPRITE_ROTULO_ALTO` da por sentado. Un piso en px se puede
              bajar; un salto de una línea a dos es un escalón, no una
              proporción, así que la única cura real es que nunca envuelva. */}
          <div style={{ marginTop: '0.7cqw', fontSize: 'min(2cqw, 8.6px)', lineHeight: 1.2, textAlign: 'center', color: TINTA, fontWeight: 700, textShadow: `0 1px 3px ${PAPEL}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.caption}</div>
        </div>
        </div>
      ))}

      {/* LAS ZONAS, cada una por su cuenta — sin tarjeta que las contenga.
          Nacen del mismo punto que los paneles (el filo de abajo, centradas)
          y suben en dos columnas a los lados de la carpeta, afuera del ancho
          de los sprites — nunca debajo de ellos, que es donde vivían antes.
          `posicionesZonas` es la que evita que se encimen: ver el comentario
          ahí arriba. */}
      {enBanda.map((z, i) => {
        const p = posEnBanda[i];
        if (!p) return null;
        return (
          <div
            key={z.iconKey + z.nombre}
            {...lupa(`zona:${z.iconKey}:${z.nombre}`)}
            style={{
              position: 'absolute', left: '50%', bottom: ANCLA_EF,
              width: `${p.w}cqw`,
              transform: abierto
                ? `translate(calc(-50% + ${p.x}cqw), ${p.y}cqw) scale(1)`
                : 'translate(-50%, 0) scale(0.3)',
              transformOrigin: 'center bottom',
              opacity: abierto ? 1 : 0,
              pointerEvents: abierto ? 'auto' : 'none',
              cursor: abierto ? 'pointer' : 'default',
              transition: `transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1) ${(paneles.length + sprites.length + i) * 40}ms, opacity 260ms ease ${(paneles.length + sprites.length + i) * 40}ms`,
              zIndex: conLupa === `zona:${z.iconKey}:${z.nombre}` ? 6 : 2,
              filter: 'drop-shadow(0 3px 6px rgba(28,30,31,0.22))',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6cqw', ...capaLupa(`zona:${z.iconKey}:${z.nombre}`) }}>
            <ZonaIcono iconKey={z.iconKey} />
            {/* Mismo motivo que el rótulo del sprite: sin piso en px y en una
                sola línea, para que su alto real nunca se despegue de
                `FLANCO_ALTO_ITEM` —la cifra fija que usa `posicionesZonas`
                para calcular cuántos renglones caben antes de tocar el piso
                de los sprites. */}
            <span style={{ maxWidth: '100%', fontSize: 'min(1.9cqw, 8.6px)', lineHeight: 1.2, textAlign: 'center', color: TINTA, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(z.nombre)}</span>
            </div>
          </div>
        );
      })}

      {/* LA CARPETA — el disparador, en dos capas.
          La de AFUERA solo posiciona: centrada y parada sobre el filo de
          abajo, del tamaño "actual" (el que tenía antes de este cambio), y
          nunca se mueve. La de ADENTRO (`CarpetaTrigger`) es la que escala:
          al doble en reposo, a este mismo tamaño en cuanto se abre. Separar
          las dos evitó el problema clásico de mezclar `translateX(-50%)` con
          `scale()` en un solo `transform` — la escala multiplica también la
          traslación y la carpeta se va de centro. */}
      <div
        style={{
          position: 'absolute', left: '50%', bottom: PISO_CARPETA, transform: 'translateX(-50%)',
          width: CARPETA_ANCHO, height: CARPETA_ALTO,
          // Se transparenta cuando un rótulo le cae encima, para dejarlo
          // leer. Solo durante el gesto de los globos: ver `carpetaTapada`.
          opacity: carpetaTapada ? CARPETA_OPACA : 1,
          transition: 'opacity 240ms ease',
          zIndex: 3,
        }}
      >
        <CarpetaTrigger
          abierto={abierto}
          onClick={() => setFija((f) => !f)}
          onFocus={entra}
          onBlur={sale}
        />
      </div>
    </div>
  );
}

/**
 * El dibujo de la carpeta, fiel a la referencia: una pestaña y un cuerpo al
 * frente (los únicos que no se mueven) y TRES papeles detrás que se asoman en
 * cascada — vino, gris, crema, cada uno un poco menos que el de atrás. En
 * reposo casi no se ven; al abrir suben y se escalonan, que es el gesto que
 * pedía el cliente. Los tres papeles y el cuerpo comparten el mismo radio de
 * esquina que la pestaña: es lo que los hace leerse como cortados de la misma
 * carpeta y no como tres rectángulos sueltos detrás.
 */
function CarpetaTrigger({
  abierto, onClick, onFocus, onBlur,
}: {
  abierto: boolean;
  onClick: () => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const t = useT();
  const CURVA = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  // Los papeles: dónde tienen el filo de arriba parados y dónde asomados.
  // En reposo los tres quedan por debajo del filo del frente (y=19 en el
  // lado bajo), así que no se ven hasta que suben.
  const papeles = [
    { x: 18, w: 204, alto: 54, color: VINO, borde: undefined, reposo: 33, fuera: -30, retraso: 0 },
    { x: 25, w: 190, alto: 50, color: GRIS_PAPEL, borde: undefined, reposo: 37, fuera: -17, retraso: 35 },
    { x: 32, w: 176, alto: 46, color: CREMA, borde: RIEL, reposo: 41, fuera: -4, retraso: 70 },
  ];
  return (
    <button
      type="button"
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-expanded={abierto}
      aria-label={abierto ? t('Ocultar el resumen de tu casa') : t('Ver el resumen de tu casa')}
      style={{
        display: 'block', width: '100%', height: '100%',
        // El brinco de tamaño: al doble parada, a su tamaño de siempre
        // abierta. Nace del filo de abajo — como si creciera desde donde se
        // apoya — para que el resto de la lámina (el abanico) no tenga que
        // saber que la carpeta cambió de tamaño.
        transform: `scale(${abierto ? 1 : 2})`,
        transformOrigin: 'center bottom',
        transition: `transform 480ms ${CURVA}`,
        border: 0, background: 'transparent', padding: 0, cursor: 'pointer',
        filter: abierto
          ? 'drop-shadow(0 10px 20px rgba(180, 0, 59, 0.34))'
          : 'drop-shadow(0 4px 10px rgba(180, 0, 59, 0.22))',
      }}
    >
      {/*
        LA FIGURA, medida sobre el video de referencia cuadro por cuadro en
        vez de dibujada a ojo (`scratchpad/medir2.js`): la caja mide
        240 x 176, la pestaña de atrás ocupa el 28 % izquierdo y baja al
        cuerpo con una curva entre el 28 % y el 37 %, y el FRENTE —lo que
        antes era un rectángulo simple— tiene su propio escalón: el filo de
        arriba va 13 px más abajo en el tercio izquierdo que en el resto, y
        sube entre el 34 % y el 43 % con la misma curva en S. Ese perfil
        escalonado del frente es lo que da la silueta de carpeta; sin él, el
        dibujo se lee como una caja con una lengüeta pegada.

        Va en SVG y no en cajas con `border-radius` porque ese escalón
        curvo no se puede describir con esquinas redondeadas.
      */}
      <svg viewBox="0 0 240 176" width="100%" height="100%" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="lgp-carpeta-frente" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CARMIN} />
            <stop offset="100%" stopColor="#D2004A" />
          </linearGradient>
        </defs>

        {/* ATRÁS: la pestaña y el cuerpo que la sostiene. Es lo único que
            asoma por encima del frente cuando la carpeta está parada. */}
        <path
          d="M 12,0 H 62 C 72,0 74,14 84,14 H 228 A 12 12 0 0 1 240,26 V 164 A 12 12 0 0 1 228,176 H 12 A 12 12 0 0 1 0,164 V 12 A 12 12 0 0 1 12,0 Z"
          fill={CARMIN_HONDO}
        />

        {/* LOS PAPELES, en cascada: el de más atrás sube más y sale primero.
            Se mueven con `transform` y no con `y` para que la transición la
            haga el compositor y no el layout. */}
        {papeles.map((h, i) => (
          <rect
            key={i}
            x={h.x} y={0} width={h.w} height={h.alto} rx={7}
            fill={h.color}
            stroke={h.borde}
            strokeWidth={h.borde ? 1 : undefined}
            style={{
              transform: `translateY(${abierto ? h.fuera : h.reposo}px)`,
              transition: `transform 480ms ${CURVA} ${h.retraso}ms`,
            }}
          />
        ))}

        {/* EL FRENTE, encima de todo: el escalón entre el 34 % y el 43 % es
            la parte que hay que respetar — es de donde sale la silueta. */}
        <path
          d="M 12,19 H 82 C 92,19 94,6 104,6 H 228 A 12 12 0 0 1 240,18 V 164 A 12 12 0 0 1 228,176 H 12 A 12 12 0 0 1 0,164 V 31 A 12 12 0 0 1 12,19 Z"
          fill="url(#lgp-carpeta-frente)"
        />
      </svg>
    </button>
  );
}
