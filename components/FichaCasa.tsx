'use client';

import FloorplanDiagram from '@/components/FloorplanDiagram';
import type { PlanDiagramKey } from '@/components/FloorplanDiagram';
import { ModuloIcon, CamaIcon, BanoIcon, CarroIcon, ICONOS_DE_PASTILLA } from '@/components/ConfigIcons';
import { RENDER_PLAN, RENDER_FACHADA, RENDER_PALETA, ICONO_ZONA, ICONO_TRAGALUZ } from '@/lib/assets';

export type ZonaEnFicha = { iconKey: string; nombre: string };

/**
 * ⚠ HOY NO SE RENDERIZA EN NINGÚN LADO.
 *
 * Vivía en el paso "Tu casa", que salió del recorrido: el resumen que el
 * cliente ve ahora es la carpeta del brief, y la lámina viaja adjunta en el
 * correo del arquitecto. Pero esa lámina del correo NO es este componente —
 * es `lib/lamina.tsx`, escrita aparte porque se rasteriza con satori, que no
 * entiende ni `cqw` ni container queries ni `aspectRatio`, que es de lo que
 * está hecho todo este archivo.
 *
 * Se conserva a propósito, por dos razones: es la referencia de diseño de la
 * que salió la del correo (paleta, orden de lectura, jerarquía), y es lo que
 * habría que retomar el día que la lámina vuelva a la pantalla. Si alguien
 * cambia el diseño de la lámina, aquí y en `lib/lamina.tsx` — o mejor, que
 * decida cuál de las dos sobrevive.
 *
 * LA FICHA DE LA CASA — la lámina que el cliente se lleva.
 *
 * Reemplaza a la mesa del arquitecto en el último paso. La mesa era papeles
 * sueltos sobre un escritorio: buena para "esto ya existe", mala para
 * enseñársela a alguien. Esta es una lámina compuesta, con jerarquía y con las
 * cifras arriba, que es como se presenta un anteproyecto.
 *
 * Se dibuja entera en unidades de contenedor (`cqw`), así que la lámina se
 * encoge completa y se lee igual en un teléfono que en un monitor — y sale
 * idéntica si algún día se imprime.
 *
 * Los iconos de zona son glifos NEGROS sobre transparente. Sobre la banda
 * oscura se invierten con `brightness(0) invert(1)`, que los deja blancos puros
 * sea cual sea su color de origen; lo mismo el logotipo, que viene en gris.
 */

const CARMIN = '#F2004B';
const PAPEL = '#FBFBFA';
const GRIS = '#6E7375';
// Las dos capas translúcidas de la cabecera. Van con alfa y no en plano para
// que el isométrico siga leyéndose por debajo: la lámina tiene que sentirse
// como una cinta puesta ENCIMA del plano, no como un recuadro que lo tapa. La
// del título es del mismo gris y más honda, para que se despegue de la cinta
// sin meter un color nuevo.
const CINTA = 'rgba(88, 93, 95, 0.84)';
// El mismo gris de la cinta, ya compuesto contra el papel: 0.84 de 88/93/95
// sobre 251/251/250. Es para los iconos de pastilla, que necesitan un color
// sólido detrás del glifo — con la cinta translúcida no se puede.
const CINTA_SOLIDA = '#727678';
const CINTA_TITULO = 'rgba(43, 47, 49, 0.84)';

function Rotulo({ children, color = GRIS, tam = '1.5cqw' }: { children: React.ReactNode; color?: string; tam?: string }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: tam, letterSpacing: '0.14em', textTransform: 'uppercase', color, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

/**
 * Una de las dos piezas grandes de abajo: la maqueta y su nombre.
 *
 * Iba dentro de un marco hexagonal y se quitó — el marco recortaba la maqueta
 * y le robaba la mitad del ancho a un sprite que ya viene recortado y con su
 * propio aire. Sin él la fachada se ve del tamaño que merece.
 */
function Pieza({ src, alt, vacio, escala = 1, foto = false }: { src: string | null; alt: string; vacio: string; escala?: number; foto?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Más alta que ancha de lo que pide la maqueta, y sin recortar: lo que
          sobra por abajo se mete bajo el pie de la lámina, que es translúcido y
          la deja ver. Mismo recurso que el isométrico bajo la banda de zonas. */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 0.95', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {src ? (
          <img
            src={src}
            alt={alt}
            style={{
              width: '100%', height: '100%', display: 'block',
              // Las maquetas vienen recortadas y con su propio aire: `contain`
              // las respeta. Una FOTO es rectangular y con `contain` deja dos
              // franjas de textura arriba y abajo, así que se encuadra a la
              // caja.
              objectFit: foto ? 'cover' : 'contain',
              objectPosition: 'center bottom',
              transform: `scale(${escala})`,
            }}
          />
        ) : (
          <span style={{ padding: '0 4cqw', textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.4cqw', letterSpacing: '0.1em', textTransform: 'uppercase', color: GRIS, lineHeight: 1.6 }}>
            {vacio}
          </span>
        )}
        {/* "Sin render que prometa lo que no se entrega" es promesa del sitio
            dos pantallas más abajo. Si aquí entra una imagen sintética, va
            rotulada — igual que en la tarjeta de Lugares disponibles. */}
        {src && foto ? (
          <span style={{ position: 'absolute', left: 0, top: 0, background: CINTA_TITULO, color: PAPEL, padding: '0.5cqw 1.2cqw', fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.25cqw', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Render
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Un nombre dentro de la cinta de abajo, alineado con su maqueta. */
function NombrePieza({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '2.8cqw', letterSpacing: '-0.015em', color: PAPEL, lineHeight: 1.12 }}>
      {children}
    </div>
  );
}

export default function FichaCasa({
  planKey, planNombre,
  loteForma, loteArea, direccion,
  ft2Living, ft2Total,
  recamaras, banos, cajones,
  zonas, tragaluces = [],
  fachadaKey, fachadaNombre, fachadaFija, fachadaImagen = null,
  interiorKey, interiorNombre,
  contacto,
}: {
  planKey: PlanDiagramKey | null;
  planNombre: string;
  /** "Lote regular" / "Lote irregular", tal como lo capturó el cliente. */
  loteForma: string;
  loteArea: string;
  direccion: string;
  ft2Living: number;
  ft2Total: number;
  recamaras: number;
  banos: number;
  /** 0 = sin cochera. */
  cajones: number;
  zonas: ZonaEnFicha[];
  tragaluces?: string[];
  fachadaKey: string | null;
  fachadaNombre: string;
  fachadaFija?: boolean;
  /**
   * Con qué se ilustra la fachada cuando el reglamento la trae puesta. En
   * Enclave la casa YA está diseñada, así que el hueco con "la trae puesta el
   * reglamento" dejaba la mitad de la lámina vacía justo en el proyecto del
   * que sí hay imagen. Se la pasa el configurador —la que la subdivisión
   * declara como render en `SUBDIVISIONES`— y no se elige aquí: la lámina no
   * sabe de subdivisiones.
   */
  fachadaImagen?: string | null;
  interiorKey: string | null;
  interiorNombre: string;
  contacto: string;
}) {
  const render = planKey ? RENDER_PLAN[planKey] : null;
  // Seis caben en la banda sin que los nombres se encimen. El tragaluz entra
  // como uno más: en el resto del configurador se elige igual que una zona.
  const enBanda: ZonaEnFicha[] = [
    ...zonas,
    ...(tragaluces.length ? [{ iconKey: '__tragaluz', nombre: `${tragaluces.length} tragaluz${tragaluces.length > 1 ? 'es' : ''}` }] : []),
  ].slice(0, 6);

  const cifras = [
    { rot: 'Living SQF', v: ft2Living.toLocaleString('es-MX') },
    { rot: 'Área total SQF', v: ft2Total.toLocaleString('es-MX') },
  ];
  // Cada cuenta con su glifo, el mismo de la barra de presupuesto: quien vio
  // la cama y el coche mientras configuraba los reconoce en la lámina.
  // Ahora que el baño tiene glifo propio, las recámaras y los baños dejaron de
  // ir en un mismo renglón: cada cuenta con su icono, que es como se leen en la
  // barra de presupuesto durante toda la configuración.
  const cuentas = [
    { k: 'rec', Icono: CamaIcon, t: `${recamaras} ${recamaras === 1 ? 'recámara' : 'recámaras'}` },
    { k: 'ban', Icono: BanoIcon, t: `${banos} ${banos === 1 ? 'baño' : 'baños'}` },
    { k: 'gar', Icono: CarroIcon, t: cajones ? `${cajones} ${cajones === 1 ? 'auto' : 'autos'} de cochera` : 'Sin cochera' },
  ];

  return (
    <div style={{ containerType: 'inline-size', width: '100%' }}>
      {/* Columna flex y no bloques apilados: la banda de zonas crece con lo que
          el cliente puso y la mitad de abajo se queda con lo que sobre, sin que
          nada se salga de la proporción de la lámina. */}
      <div
        style={{
          position: 'relative', width: '100%', aspectRatio: '1 / 1.45', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          // El mosaico isométrico del fondo del sitio, EN UNA SOLA PIEZA de
          // arriba abajo: las cintas grises van encima con alfa y la retícula
          // corre por debajo sin cortarse. En propiedades sueltas y no con el
          // atajo `background` — el atajo mete `background-image: none` y borra
          // la textura sin avisar (ver la nota en globals.css).
          backgroundColor: PAPEL,
          backgroundImage: "url('/textura-cubos.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '79.674px 138px',
        }}
      >

        {/* ---------------------------------------------- LA MITAD DE ARRIBA */}
        {/* Sin `overflow: hidden`: la maqueta se sale por abajo a propósito y la
            banda de zonas le pasa por encima. Lo que la contiene es el
            recuadro de la lámina, que sí recorta. */}
        <div style={{ position: 'relative', flex: '0 0 48%' }}>
          {/* El isométrico se mete BAJO las dos franjas, arriba y abajo: son
              translúcidas y la maqueta se sigue viendo a través. De ahí sale la
              profundidad de la lámina — una sola pieza con las cintas encima, y
              no tres bloques apilados. El fondo negativo la derrama sobre la
              banda de zonas. */}
          <div style={{ position: 'absolute', inset: '9cqw 3cqw -9cqw', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            {render ? (
              // Crece desde su borde de ARRIBA, así que todo lo que gana se va
              // hacia abajo: la maqueta se mete bajo la banda de zonas y se
              // sigue viendo a través de ella. Sin esto la maqueta cabía justa
              // en su recuadro y la banda le pasaba por un aire transparente,
              // sin cruzarla. Lo que se sale a los lados es margen del render.
              <img src={render} alt={`Plano ${planNombre}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: 'scale(1.14)', transformOrigin: 'center top' }} />
            ) : (
              <FloorplanDiagram planKey={planKey ?? 'A'} style={{ width: '82%', height: 'auto' }} />
            )}
          </div>

          {/* LA CINTA de las cifras: gris translúcido con las letras en blanco,
              y el isométrico viéndose por debajo.

              ARRANCA EN EL 48 %, donde termina el bloque del título, y no en
              cero con relleno. Corría por debajo del título, y como los dos son
              translúcidos las dos capas se sumaban: en esa mitad salía un
              rectángulo más oscuro que el resto de la cinta, con su escalón a
              la vista. Ahora se topan al filo y cada tono se ve una sola vez.
              El ancho del título es fijo por eso: si fuera `maxWidth` un nombre
              corto abriría un hueco entre las dos piezas. */}
          <div
            style={{
              position: 'absolute', left: '48%', right: 0, top: 0, zIndex: 1,
              background: CINTA, color: PAPEL,
              padding: '2cqw 3cqw 2.2cqw',
              display: 'flex', gap: '2cqw', alignItems: 'flex-start', justifyContent: 'space-between',
            }}
          >
            <div>
              {cifras.map((c) => (
                <div key={c.rot} style={{ marginBottom: '1cqw' }}>
                  <Rotulo tam="1.5cqw" color={PAPEL}>{c.rot}</Rotulo>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '3.4cqw', letterSpacing: '-0.015em', color: PAPEL, lineHeight: 1.05 }}>{c.v}</div>
                </div>
              ))}
            </div>
            {/* Las dos cuentas con su glifo. El icono va al DOBLE del texto y
                fuera del flujo de la línea: `flex: none` para que no lo apriete,
                y el texto en su propia caja con `flex: 1` alineada a la derecha.
                Antes el nombre iba suelto en la fila y, al crecer el glifo, la
                segunda línea de "3 recámaras · 3 baños" se le montaba encima. */}
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              {cuentas.map(({ k, Icono, t }) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '1.4cqw', marginBottom: '1.1cqw', justifyContent: 'flex-end' }}>
                  {/* El glifo abre el renglón y el nombre cierra contra el filo
                      derecho de la lámina. Va en blanco como el texto: la cinta
                      es oscura y el icono es tinta plana, así que se fuerza el
                      color. */}
                  <Icono size="5.8cqw" color={PAPEL} />
                  {/* Caja de ancho fijo y no `flex: 1`: con el flexible el texto
                      se estiraba hasta el filo izquierdo y despegaba cada glifo
                      de lo que nombra. Fijo, los dos caen en la misma vertical.

                      Bandera a la IZQUIERDA aunque el bloque esté anclado a la
                      derecha: alineado a la derecha, las dos líneas arrancaban
                      cada una en un punto distinto y ninguna coincidía con el
                      glifo. Así el renglón arranca donde arranca el icono. */}
                  <span style={{ width: '15.5cqw', flex: 'none', textAlign: 'left', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '2.2cqw', letterSpacing: '-0.005em', color: PAPEL, lineHeight: 1.25 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* EL TÍTULO: la misma cinta, más honda, encima. Baja más que ella
              —como en la referencia— así que identifica la lámina sin que las
              cifras y el nombre del plano compitan por el mismo renglón. */}
          <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 2, width: '48%', background: CINTA_TITULO, color: PAPEL, padding: '2cqw 3cqw 2.4cqw' }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '4.6cqw', letterSpacing: '-0.015em', lineHeight: 1.05 }}>
              {planNombre}
            </div>
            <div style={{ marginTop: '1.2cqw', fontSize: '1.75cqw', lineHeight: 1.6, color: '#D3D6D7' }}>
              {loteForma}<br />
              {loteArea}<br />
              {direccion.trim() || 'Dirección por confirmar'}
            </div>
          </div>
        </div>

        {/* ------------------------------------------ LA BANDA DE LAS ZONAS */}
        <div style={{ position: 'relative', zIndex: 1, flex: 'none', background: CINTA, padding: '2.6cqw 3cqw 2.4cqw' }}>
          {enBanda.length ? (
            <div style={{ display: 'flex', gap: '2cqw', alignItems: 'flex-start', justifyContent: enBanda.length > 3 ? 'space-between' : 'flex-start' }}>
              {enBanda.map((z) => {
                const icono = z.iconKey === '__tragaluz' ? ICONO_TRAGALUZ : ICONO_ZONA[z.iconKey];
                return (
                  <div key={z.iconKey} style={{ flex: enBanda.length > 3 ? 1 : '0 0 22%', minWidth: 0, textAlign: 'center' }}>
                    <div style={{ height: '6cqw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {icono ? (
                        <img
                          src={icono}
                          alt=""
                          aria-hidden="true"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)' }}
                        />
                      ) : (
                        <ModuloIcon moduleKey={z.iconKey} size={30} color={ICONOS_DE_PASTILLA.has(z.iconKey) ? CINTA_SOLIDA : '#FFFFFF'} />
                      )}
                    </div>
                    <div style={{ marginTop: '1cqw', fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.45cqw', letterSpacing: '0.08em', textTransform: 'uppercase', color: PAPEL, lineHeight: 1.4 }}>
                      {z.nombre}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Rotulo color="#D5D7D8">Sin zonas agregadas</Rotulo>
          )}
        </div>

        {/* LAS MAQUETAS, sobre la textura desnuda: el mosaico se ve completo
            entre la banda de iconos y la de nombres. */}
        <div style={{ flex: 1, minHeight: 0, padding: '3cqw 3cqw 0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '4cqw', alignItems: 'flex-start', marginBottom: '-10cqw' }}>
            <Pieza
              src={fachadaKey ? RENDER_FACHADA[fachadaKey] ?? null : fachadaImagen}
              foto={!fachadaKey && Boolean(fachadaImagen)}
              alt={fachadaKey ? `Fachada ${fachadaNombre}` : 'La casa modelo de la subdivisión'}
              vacio={fachadaFija ? 'La trae puesta el reglamento' : 'Sin elegir'}
              // La maqueta de fachada viene normalizada con su propio margen —
              // mismo lienzo cuadrado para los cuatro estilos— así que dentro de
              // una caja del mismo alto se ve más chica que la cocina, que llena
              // la suya. El empujón la deja pareja con la de al lado.
              escala={fachadaKey ? 1.18 : 1}
            />
            <Pieza
              src={interiorKey ? RENDER_PALETA[interiorKey] ?? null : null}
              alt={`Paleta ${interiorNombre}`}
              vacio="Sin elegir"
            />
          </div>

          {/* EL PIE, UNA SOLA PIEZA. Eran dos franjas de tonos distintos
              —los nombres en `CINTA`, el contacto en `CINTA_TITULO`— con una
              tira de textura entre ellas: tres cortes en la cuarta parte de
              abajo. Ahora es un solo bloque del gris de la banda de iconos,
              pegado al pie de las maquetas, con las dos filas adentro
              separadas por un filete y no por un cambio de color.

              `marginTop: auto` lo ancla contra el filo carmín y los márgenes
              negativos lo sacan del relleno lateral, para que llegue de filo a
              filo. */}
          <div
            style={{
              position: 'relative', zIndex: 1,
              marginTop: 'auto', marginLeft: '-3cqw', marginRight: '-3cqw',
              background: CINTA, padding: '2cqw 3cqw 2.4cqw',
            }}
          >
            <div style={{ display: 'flex', gap: '4cqw', alignItems: 'flex-start' }}>
              <NombrePieza>{fachadaKey ? fachadaNombre : (fachadaFija ? 'Fachada de la subdivisión' : 'Sin fachada')}</NombrePieza>
              <NombrePieza>{interiorKey ? interiorNombre : 'Sin paleta'}</NombrePieza>
            </div>
            {/* La única separación entre las dos filas: un filete claro sobre
                el mismo gris. Un segundo tono habría vuelto a partir la pieza
                en dos, que es justo lo que se quitó. */}
            <div
              style={{
                marginTop: '2cqw', paddingTop: '1.8cqw', borderTop: '1px solid rgba(251, 251, 250, 0.28)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '3cqw',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Rotulo color="#E2E5E6" tam="1.4cqw">Contacto cliente</Rotulo>
                <div style={{ marginTop: '0.6cqw', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '2.4cqw', color: PAPEL, lineHeight: 1.2 }}>
                  {contacto.trim() || 'Por capturar'}
                </div>
              </div>
              {/* La marca, no el logotipo escrito: en el pie de una lámina que
                  ya lleva el nombre en el contacto, el cubo identifica más
                  rápido y aguanta mejor el tamaño chico.

                  La versión PARA FONDO OSCURO (`logo-marca-oscuro.svg`): misma
                  pieza, con la mitad gris del cubo en blanco. La normal lleva
                  ahí un `#505759` que sobre esta cinta queda casi al mismo tono
                  y parte el cubo por la mitad. El carmín y el rosa no cambian. */}
              <img
                src="/logo-marca-oscuro.svg"
                alt="La Gran Piedra"
                style={{ height: '7cqw', width: 'auto', flex: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* El filo carmín del pie */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '1.6cqw', background: CARMIN }} />
      </div>
    </div>
  );
}
