'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FilaOpcion, useAnimacionAlterna } from '@/components/DecisionUI';

export type OpcionDecision = {
  key: string;
  nombre: string;
  descripcion?: string;
  meta?: string;
  /** Imagen del render; si no hay, se usa `visual`. */
  imagen?: string;
  /** Alternativa a `imagen`: un SVG o cualquier nodo. */
  visual?: ReactNode;
  /** Miniatura de la fila. Sin ella se cae a `imagen` y luego a la sigla. */
  miniatura?: ReactNode;
  /** Iniciales para la fila cuando no hay imagen ni miniatura. */
  sigla?: string;
  /** Cómo reacciona la miniatura al quedar elegida. Ver `FilaOpcion`. */
  visualTipo?: 'icono' | 'muestra';
  /**
   * Pone detrás la retícula de cubos del fondo de la página.
   *
   * Es para maquetas recortadas —los isométricos de floorplan y de fachada
   * vienen con fondo transparente— y no para un `visual` que llena su caja,
   * como una paleta de franjas de color: ahí la textura no se vería.
   * Se declara y no se deduce de `imagen`, porque la fachada dibuja su render
   * dentro de `visual` y una deducción la dejaría fuera sin avisar.
   */
  texturaFondo?: boolean;
  on: boolean;
  fija?: boolean;
  etiqueta?: string;
  onSelect: () => void;
};

/**
 * Esqueleto de los pasos de elección, calcado del prototipo de Claude Design:
 * una tarjeta de detalle arriba, la columna de "lo que llevas elegido" a la
 * derecha, y abajo la lista donde cada fila se elige sola — la franja carmín
 * entra por la derecha al pasar el cursor y cubre la fila al elegirla.
 *
 * La tarjeta muestra la opción sobre la que está el cursor; si no hay ninguna,
 * la elegida. Así se puede curiosear la lista sin cambiar nada.
 */
export default function PasoDecision({
  opciones,
  etiquetaOtras,
  accionPrimaria,
  pieza,
  etiquetaElegido,
  accionSecundaria,
  onSecundaria,
  carrusel,
  lateral,
  exclusivo,
  nota,
  visualAncho,
  visualAlto,
  acuseEscuadras,
}: {
  opciones: OpcionDecision[];
  etiquetaOtras: string;
  /**
   * Ancho y alto de la tarjeta de foco fuera del carrusel. Los 230px de default
   * alcanzan para una paleta de tres franjas, pero no para un render donde lo
   * que se decide es el volumen de la casa: ahí la imagen tiene que ser lo
   * bastante grande para apreciar el estilo, que es justo lo que se está
   * eligiendo. En pantalla chica el ancho se va al 100% y el alto lo recorta
   * `globals.css`; por eso la imagen va con `max-height`, no con alto fijo.
   */
  visualAncho?: number;
  visualAlto?: number;
  /**
   * Cambia el acuse de la tarjeta de foco: en vez del barrido carmín, las
   * escuadras de registro que se cierran sobre las esquinas del render.
   *
   * Va donde la imagen es el contenido y no un adorno —el floorplan y la
   * fachada—, porque taparla con una cortina justo al elegirla esconde lo
   * único que el cliente quería ver de cerca. Antes esta bandera simplemente
   * apagaba el acuse, y el resultado era que elegir un plano o una fachada no
   * confirmaba nada.
   *
   * A diferencia del barrido, las escuadras no son un instante: se quedan
   * mientras la opción a la vista sea la elegida. En el carrusel eso convierte
   * el acuse en estado — al volver a pasar por tu plano, están puestas.
   */
  acuseEscuadras?: boolean;
  /** Texto del botón de elegir; solo se usa en modo carrusel. */
  accionPrimaria?: string;
  /**
   * Cómo se llama la pieza que se está eligiendo, para las etiquetas del
   * carrusel. Van dos y no una derivada de la otra porque el español tiene
   * género: "plano elegido" pero "fachada elegida", y una sola cadena con un
   * sufijo pegado produciría "fachada elegido".
   *
   * `pieza` va en minúscula porque solo la leen los lectores de pantalla en el
   * `aria-label` de las flechas.
   */
  pieza?: string;
  etiquetaElegido?: string;
  accionSecundaria?: string;
  onSecundaria?: () => void;
  /**
   * Modo carrusel: se pasa de una opción a otra con las flechas y se elige la
   * que está a la vista. Es para cuando lo que decide es la imagen grande —un
   * plano se compara viéndolo, no leyendo su nombre en una lista.
   */
  carrusel?: boolean;
  /**
   * Modo lateral: la tabla de opciones a la izquierda y la maqueta a la
   * derecha, en columnas, en vez de la tarjeta de foco encima de la lista.
   *
   * Es para cuando la lista es corta y la maqueta es el resultado de lo que se
   * elige: con la tarjeta arriba, el cursor está en la fila de abajo y el
   * cambio ocurre fuera del campo de visión — se recorre la lista entera sin
   * enterarse de que algo se estaba actualizando. Al lado, el ojo alcanza las
   * dos cosas sin mover la cabeza.
   *
   * No cambia una sola línea de cómo se elige: es la misma `FilaOpcion`, el
   * mismo `exclusivo` y la misma "✕" para quitar. Solo cambia dónde se dibuja
   * cada bloque.
   */
  lateral?: boolean;
  /**
   * De esta lista solo cabe una. Mientras haya algo elegido, el resto de las
   * filas queda bloqueado: para cambiar hay que quitar la actual con su "×" y
   * entonces elegir otra. Es lo que hace visible que la elección es única — con
   * el cambio directo, el cliente nunca se entera de que solo puede llevar una.
   */
  exclusivo?: boolean;
  nota?: ReactNode;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  // Sentido del último viaje de la cinta (1 hacia adelante, -1 hacia atrás) y
  // la pieza que se está yendo. `saliente` lleva un contador propio y no solo
  // la opción: si vuelves sobre tus pasos, la misma opción sale dos veces
  // seguidas y sin ese número React reusaría el nodo sin relanzar el viaje.
  const [dir, setDir] = useState<1 | -1>(1);
  const [saliente, setSaliente] = useState<{ o: OpcionDecision; n: number } | null>(null);
  const pasada = useRef(0);
  // Contador del soltado. Las escuadras se desmontan en cuanto la elección
  // desaparece, así que sin esto no hay nodo al que animarle la salida: para
  // el DOM, quitar es que las marcas dejen de existir de un fotograma al otro.
  // Este contador monta un juego de escuadras aparte que solo existe mientras
  // dura su despedida y se desmonta solo al terminarla. Es contador y no
  // booleano porque quitar dos veces seguidas tiene que relanzar la animación,
  // y con un `true` repetido React reusaría el nodo sin volver a dispararla.
  const [soltando, setSoltando] = useState(0);
  const claveElegida = opciones.find((o) => o.on)?.key ?? null;
  const claveAnterior = useRef(claveElegida);
  useEffect(() => {
    // Solo el paso de algo a nada. Cambiar de una opción a otra no es soltar:
    // ahí las escuadras se quedan puestas sobre la nueva.
    if (claveAnterior.current && !claveElegida) setSoltando((n) => n + 1);
    claveAnterior.current = claveElegida;
  }, [claveElegida]);
  // El acuse de la elección en la tarjeta de foco: el barrido carmín cruza —el
  // mismo gesto que la franja de la fila, en grande— y la pieza se asienta.
  // Sin esto, elegir en la lista de abajo cambiaba la tarjeta de arriba sin que
  // nada avisara que la elección quedó hecha. Va antes del `return` de lista
  // vacía porque un hook no puede quedar detrás de una salida temprana.
  const asienta = useAnimacionAlterna(opciones.find((o) => o.on)?.key ?? null, 'lgpElegidaA', 'lgpElegidaB');
  // El viaje de la cinta y el rebote del sprite, ambos por nombre alterno y no
  // por remontaje. La diferencia no es de estilo: si el nodo se remontara, el
  // rebote —que vive dentro de la cinta— se dispararía cada vez que el cliente
  // pasa por el plano que ya eligió, y el acuse dejaría de significar "acabas
  // de elegir" para significar "aquí estás".
  const cinta = useAnimacionAlterna(carrusel ? idx : null, 'lgpCintaA', 'lgpCintaB');
  const rebote = useAnimacionAlterna(
    acuseEscuadras ? (opciones.find((o) => o.on)?.key ?? null) : null,
    'lgpSpriteReboteA',
    'lgpSpriteReboteB',
  );
  const elegida = opciones.find((o) => o.on) ?? null;
  const iSeguro = Math.min(Math.max(idx, 0), opciones.length - 1);

  // Con la elección hecha, la tarjeta se congela: pasar el cursor por las otras
  // filas ya no cambia la imagen. Es coherencia, no capricho — en estos pasos la
  // lista es exclusiva, así que esas filas ya están bloqueadas y no se pueden
  // tomar. Enseñar en grande una fachada que el cliente no puede elegir sin
  // antes quitar la suya es ofrecerle algo que la propia fila le está negando.
  // Para cambiar de opinión, el camino sigue siendo el mismo: quitar la actual
  // con su "×", y ahí la tarjeta vuelve a responder al cursor.
  //
  // Solo aplica donde el acuse es de escuadras —floorplan, fachada y paleta de
  // interior—, que son los tres pasos donde la lista es exclusiva y lo que se
  // enseña en grande es una maqueta. En las zonas se puede llevar más de una,
  // así que curiosear la lista con el cursor sigue siendo el mecanismo que deja
  // ver qué es cada cosa antes de decidir, y ahí no se toca.
  const fijado = Boolean(acuseEscuadras && elegida);
  const foco = carrusel
    ? (opciones[iSeguro] ?? opciones[0])
    : fijado && elegida
      ? elegida
      : (opciones.find((o) => o.key === hover) ?? elegida ?? opciones[0]);
  // La maqueta que entra al panel al pasar el cursor por otra fila. Sin acuse,
  // cambiar de fila cambiaba la imagen de un fotograma al otro y el panel se
  // leía como un error de dibujado, no como una respuesta a lo que el cursor
  // acababa de hacer.
  //
  // Cuelga de la clave de la opción a la vista y no del `hover`: así el
  // regreso a la elegida —al salir de la lista— también entra, y en cambio
  // elegir la que ya se estaba viendo no la vuelve a lanzar. Ese instante es
  // del acuse de elección, y dos animaciones sobre el mismo nodo se pisan.
  const entra = useAnimacionAlterna(lateral ? foco?.key ?? null : null, 'lgpSpriteEntraA', 'lgpSpriteEntraB');

  if (!opciones.length) return null;

  const mover = (paso: 1 | -1) => {
    pasada.current += 1;
    setDir(paso);
    setSaliente({ o: opciones[iSeguro] ?? opciones[0], n: pasada.current });
    setIdx((i) => (i + paso + opciones.length) % opciones.length);
  };

  // La miniatura va sin caja: el `invert()` de la fila elegida se aplica sobre
  // lo que haya dentro, y un marco blanco se volvería un marco negro.
  const mini = (o: OpcionDecision) =>
    o.miniatura ?? (o.imagen ? (
      <img src={o.imagen} alt="" aria-hidden="true" loading="lazy" style={{ width: '36px', height: '36px', objectFit: 'cover', display: 'block', border: '1px solid #EAE7E3' }} />
    ) : (
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#5C6163' }}>{o.sigla ?? o.nombre.slice(0, 2).toUpperCase()}</span>
    ));

  // Con la elección hecha, el carrusel se cierra: las flechas dejan de mover.
  // Es la misma ley que ya gobernaba la lista de fachadas cuando era lista
  // (`exclusivo`): de aquí solo cabe una, y para cambiarla hay que soltar la
  // que llevas. Con las flechas libres, esa regla era invisible — el cliente
  // podía recorrer los planos con uno ya elegido y nada le decía que elegir
  // otro sustituía al primero.
  //
  // `!elegida.fija` no es defensa de más: en un lote donde la subdivisión
  // impone el plano no hay botón de quitar, así que bloquear las flechas
  // dejaría un control apagado sin ninguna forma de encenderlo. Hoy esos lotes
  // traen un solo plano y las flechas ni se dibujan, pero la regla de la casa
  // es que nada se apaga sin salida, no que hoy no se note.
  const carruselCerrado = Boolean(carrusel && acuseEscuadras && elegida && !elegida.fija);

  const flecha = (dir: -1 | 1, etiqueta: string, glifo: string) => (
    <button
      // `aria-disabled` y no `disabled`: un botón deshabilitado no emite
      // eventos de ratón en Chrome y se quedaría sin el `title` que explica por
      // qué no responde. El clic se corta en el propio manejador.
      onClick={() => { if (!carruselCerrado) mover(dir); }}
      aria-label={etiqueta}
      aria-disabled={carruselCerrado || undefined}
      title={carruselCerrado && elegida ? `Primero quita ${elegida.nombre}` : undefined}
      className="lgp-flecha"
      style={{ width: '44px', height: '44px', flex: 'none', borderRadius: '50%', border: '1px solid #DDD9D4', background: '#fff', cursor: carruselCerrado ? 'not-allowed' : 'pointer', opacity: carruselCerrado ? 0.38 : 1, fontSize: '17px', color: '#505759', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity .18s ease' }}
    >
      {glifo}
    </button>
  );

  const acusa = Boolean(asienta && foco.on && !acuseEscuadras);

  // Las escuadras NO dependen de `asienta`, y esa es la diferencia de fondo con
  // el barrido: el barrido es un instante que hay que volver a disparar, y las
  // escuadras son el estado de "esta es la elegida". Por eso salen también al
  // entrar al paso con algo ya escogido —una sesión retomada, o volver atrás—
  // donde un acuse que solo se dispara al cambiar no diría nada.
  const registra = Boolean(acuseEscuadras && foco.on);

  // En carrusel el visor manda el alto y no cada pieza: si cada plano definiera
  // el suyo, pasar de uno a otro daría un brinco de layout.
  //
  // Los 420px de antes dejaban la maqueta de fachada —que es cuadrada— en 366px
  // dentro de un marco de 936 de ancho: chica en el paso donde el cliente está
  // decidiendo cómo se va a ver su casa desde la calle, y con los dos costados
  // vacíos. Con `62vh` la pieza crece con la pantalla en vez de quedarse en un
  // número que solo era correcto en el monitor donde se escribió. El `clamp`
  // pone los topes: nunca tan baja que no se aprecie, nunca tan alta que el
  // botón de elegir se vaya fuera de la ventana.
  const visualFoco = (
    <div
      className="lgp-decision-visual"
      data-textura={foco.texturaFondo ? '1' : undefined}
      style={
        carrusel
          ? { position: 'relative', flex: 1, minWidth: 0, height: 'clamp(340px, 62vh, 680px)', ...(foco.texturaFondo ? null : { background: '#fff' }), border: '1px solid #EAE7E3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }
          : lateral
            // Ancho completo de su columna y alto que crece con la pantalla: en
            // el panel lateral la maqueta es el contenido, no una miniatura al
            // lado del texto. Los topes del `clamp` son los de siempre — nunca
            // tan baja que no se aprecie el acabado, nunca tan alta que la
            // lista de al lado quede colgando.
            ? { position: 'relative', width: '100%', height: visualAlto ? `${visualAlto}px` : 'clamp(320px, 52vh, 520px)', ...(foco.texturaFondo ? null : { background: '#fff' }), border: '1px solid #EAE7E3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }
            : { position: 'relative', width: `${visualAncho ?? 230}px`, height: visualAlto ? `${visualAlto}px` : undefined, flex: 'none', ...(foco.texturaFondo ? null : { background: '#fff' }), border: '1px solid #EAE7E3', overflow: 'hidden' }
      }
    >
      {/* La pieza que se va, mientras dura su viaje. Se desmonta sola al
          terminar la animación: fuera de la transición no queda nada en el
          árbol. Solo en carrusel — en una lista no hay banda que arrastre. */}
      {carrusel && saliente ? (
        <span
          key={saliente.n}
          className="lgp-decision-cinta-saliente"
          aria-hidden="true"
          onAnimationEnd={() => setSaliente(null)}
          style={{ ['--dir' as string]: dir, animation: 'lgpCintaSale .5s cubic-bezier(.34,.34,.58,1) both' }}
        >
          {saliente.o.imagen ? (
            <img src={saliente.o.imagen} alt="" loading="lazy" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
          ) : (
            saliente.o.visual
          )}
        </span>
      ) : null}

      {/* La cinta: es la que viaja. Envuelve a la caja para que el rebote de la
          selección y el arrastre de la banda no se peleen por la misma
          propiedad `animation` del mismo nodo. */}
      <div
        className="lgp-decision-cinta"
        style={{ ['--dir' as string]: dir, animation: carrusel && cinta ? `${cinta} .5s cubic-bezier(.34,.34,.58,1) both` : undefined }}
      >
        {/* La caja intermedia es la que se asienta: animar el contenedor movería
            también el barrido, que tiene que cruzar recto. Y ahora también es la
            que rebota al disparo, por la misma razón — el marco, su filete y las
            escuadras tienen que quedarse clavados donde están. */}
        <div
          className="lgp-decision-visual-caja"
          style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            // El orden es la precedencia, y no es arbitrario: el acuse de la
            // elección le gana a la entrada, porque en ese instante lo que hay
            // que contar es "quedó elegida" y no "llegó otra maqueta".
            animation: acusa
              ? `${asienta} .58s cubic-bezier(.22,1,.36,1) both`
              : acuseEscuadras && rebote && elegida
                ? `${rebote} .52s cubic-bezier(.22,1,.36,1) .3s both`
                : entra
                  ? `${entra} .34s cubic-bezier(.22,1,.36,1) both`
                  : undefined,
          }}
        >
          {foco.imagen ? (
            <img
              src={foco.imagen}
              alt={`Vista de ${foco.nombre}`}
              loading="lazy"
              style={carrusel || lateral || visualAlto ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' } : { width: '100%', height: 'auto', display: 'block' }}
            />
          ) : (
            foco.visual
          )}
        </div>
      </div>
      {/* Se remonta con cada elección (`key`): un mismo nombre de animación no
          se vuelve a disparar sobre un nodo que ya la corrió. */}
      {acusa ? <span key={asienta} className="lgp-decision-barrido" aria-hidden="true" /> : null}
      {/* Las escuadras se montan y desmontan con la elección, así que la
          animación de entrada la dispara el propio montaje: no hace falta el
          truco del nombre alterno que sí necesita el barrido. */}
      {registra ? (
        <span className="lgp-escuadras" aria-hidden="true">
          <span /><span /><span /><span />
        </span>
      ) : null}
      {/* Las escuadras que se despiden. Solo para el acuse de escuadras, y solo
          en el instante de soltar: `onAnimationEnd` las desmonta. Las cuatro
          salen a la vez —sin el escalonado de la entrada— porque encuadrar es
          un gesto deliberado y en secuencia, y soltar es una sola cosa que
          pasa de golpe. */}
      {acuseEscuadras && soltando ? (
        <span
          key={soltando}
          className="lgp-escuadras"
          data-suelta="1"
          aria-hidden="true"
          onAnimationEnd={() => setSoltando(0)}
        >
          <span /><span /><span /><span />
        </span>
      ) : null}
      {/* El disparo. Cuelga de `asienta` y NO de `registra`, y la diferencia
          importa: `asienta` solo cambia cuando cambia la elección, así que el
          nodo sobrevive a que el cliente recorra el carrusel y no vuelve a
          destellar al pasar por su plano ya escogido. `elegida` lo apaga al
          quitar una fachada — un flash de cámara al borrar diría lo contrario
          de lo que pasó. */}
      {acuseEscuadras && asienta && elegida ? (
        <span key={asienta} className="lgp-fogonazo" aria-hidden="true" />
      ) : null}
    </div>
  );

  // Las acciones salen de la columna de texto para poder colocarse a la derecha
  // de la banda en modo carrusel. Sin esto, el bloque quedaba pegado bajo una
  // descripción de dos líneas y el resto del ancho —más de la mitad de la
  // banda— se quedaba en blanco. Fuera del carrusel siguen debajo del texto,
  // que es donde tienen sentido junto a una tarjeta angosta.
  const acciones = (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: carrusel ? 0 : '16px' }}>
            {/* En carrusel no hay filas donde elegir, así que el botón va aquí. */}
            {carrusel && !foco.fija ? (
              foco.on ? (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '44px', padding: '0 12px', border: '1px solid #EAE7E3', background: '#fff' }}>
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#F2004B', color: '#fff', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#5C6163', textTransform: 'uppercase' }}>{etiquetaElegido ?? 'Plano elegido'}</span>
                  </span>
                  {/* Sin esto, el carrusel no tenía cómo deshacer: con el plano
                      puesto solo quedaba la etiqueta de arriba, que informa pero
                      no se toca. El gesto de deshacer de este sistema es la "✕"
                      —el mismo que la fila de opción— así que aquí va la misma
                      "✕", no una papelera ni un "cambiar".

                      Y dice "Quitar" y no "Elegir otro" a propósito: lo que el
                      botón hace es dejar el paso sin plano. Para poner otro hay
                      que ir a él y elegirlo, igual que con la fachada. Prometer
                      en la etiqueta un salto que no ocurre es la clase de
                      detalle que le enseña al cliente a desconfiar del resto.

                      `foco.onSelect` ya alterna sobre el mismo plano, así que no
                      hace falta ninguna vía nueva: es el camino que existía y al
                      que no se podía llegar. */}
                  <button
                    onClick={foco.onSelect}
                    aria-label={`Quitar ${foco.nombre}`}
                    className="lgp-hover-zoom lgp-btn lgp-btn-fantasma"
                    style={{ gap: '8px', padding: '0 16px' }}
                  >
                    <span aria-hidden="true" style={{ fontSize: '12px', lineHeight: 1 }}>✕</span>
                    Quitar
                  </button>
                </>
              ) : (
                <button onClick={foco.onSelect} className="lgp-hover-zoom lgp-btn lgp-btn-carmin" style={{ padding: '0 18px' }}>
                  {accionPrimaria ?? 'Elegir'}
                </button>
              )
            ) : null}
            {accionSecundaria && onSecundaria ? (
              <button onClick={onSecundaria} className="lgp-hover-zoom" style={{ padding: '9px 14px', background: '#fff', border: '1px solid #DDD9D4', color: '#505759', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {accionSecundaria}
              </button>
            ) : null}
    </div>
  );

  // La tarjeta de foco. En lateral se apila —maqueta arriba, nombre y
  // descripción debajo— porque su columna es angosta y ponerle el texto al
  // costado dejaría la maqueta del tamaño de una miniatura, que es justo lo
  // contrario de para qué está el panel.
  const tarjetaFoco = (
    <div
      className="lgp-decision-foco"
      data-lateral={lateral ? '1' : undefined}
      style={{ border: '1px solid #EAE7E3', background: '#F7F5F2', padding: lateral ? '18px' : '26px', display: 'flex', flexDirection: lateral ? 'column' : 'row', gap: lateral ? '14px' : '20px', alignItems: carrusel ? 'center' : lateral ? 'stretch' : 'flex-start', justifyContent: carrusel ? 'space-between' : undefined, marginBottom: lateral ? 0 : '20px' }}
    >
      {carrusel ? null : visualFoco}

      <div style={{ flex: lateral ? 'none' : 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
          <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: '#1C1E1F' }}>{foco.nombre}</span>
          {foco.etiqueta ? (
            <span style={{ padding: '3px 7px', background: '#1C1E1F', color: '#FBFBFA', fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', letterSpacing: '0.1em' }}>{foco.etiqueta}</span>
          ) : null}
        </div>
        {foco.descripcion ? (
          <p style={{ margin: lateral ? 0 : '0 0 12px', maxWidth: '46ch', fontSize: '13px', lineHeight: 1.6, color: '#505759' }}>{foco.descripcion}</p>
        ) : null}
        {foco.meta ? (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: '#5C6163', textTransform: 'uppercase' }}>{foco.meta}</div>
        ) : null}
        {carrusel || lateral ? null : acciones}
      </div>

      {carrusel ? <div style={{ flex: 'none' }}>{acciones}</div> : null}
    </div>
  );

  // La tabla de opciones. Es la misma en los dos modos: no hay una rama de
  // selección para el lateral y otra para el resto.
  const tabla = (
    <>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#6E7375', textTransform: 'uppercase', marginBottom: '8px' }}>{etiquetaOtras}</div>
      {/* Con la elección hecha, decir por qué el resto ya no responde: un
          renglón apagado sin explicación se lee como que la página falla. */}
      {exclusivo && elegida ? (
        <p style={{ margin: '0 0 8px', maxWidth: '520px', fontSize: '12.5px', lineHeight: 1.55, color: '#5C6163' }}>
          Solo puedes llevar una. Para cambiarla, quita <strong style={{ fontWeight: 600, color: '#1C1E1F' }}>{elegida.nombre}</strong> con su ✕ y elige otra.
        </p>
      ) : null}
      <div className="lgp-decision-lista" style={{ border: '1px solid #EAE7E3', maxWidth: lateral ? undefined : '520px' }}>
        {opciones.map((o) => {
          // En una lista exclusiva, con algo elegido las demás no se pueden
          // tomar: primero se suelta la actual. Así el gesto de quitar deja de
          // ser decorativo y se vuelve el camino real para cambiar de opinión.
          const bloqueadaPorOtra = Boolean(exclusivo && elegida && !o.on);
          return (
          <FilaOpcion
            key={o.key}
            icono={mini(o)}
            tipoVisual={o.visualTipo ?? 'muestra'}
            nombre={o.nombre}
            estado={o.on ? (o.fija ? 'Incluido' : 'Elegido') : o.fija ? 'Incluido' : ''}
            on={o.on}
            disabled={o.fija || bloqueadaPorOtra}
            atenuada={bloqueadaPorOtra}
            title={bloqueadaPorOtra && elegida ? `Primero quita ${elegida.nombre} con su ✕` : undefined}
            onClick={o.onSelect}
            onEnter={() => setHover(o.key)}
            onLeave={() => setHover(null)}
          />
          );
        })}
      </div>
    </>
  );

  // El lateral no lleva la línea de "solo puedes llevar una" del carrusel: ahí
  // no hay flechas que bloquear, y la tabla ya trae la suya.
  if (lateral) {
    return (
      <div>
        <div className="lgp-decision-lateral">
          {/* La tabla va primera en el DOM y a la izquierda: es donde se
              actúa. Al apilarse en pantalla chica, el CSS sube el panel por
              encima —ahí el orden de lectura sí es maqueta y luego lista,
              porque una tabla que empuja la imagen fuera de la pantalla deja
              de tener con qué compararse. */}
          <div style={{ minWidth: 0 }}>{tabla}</div>
          <div className="lgp-decision-lateral-panel">{tarjetaFoco}</div>
        </div>
        {nota ? <div style={{ marginTop: '16px' }}>{nota}</div> : null}
      </div>
    );
  }

  return (
    <div>
      {/* El carrusel va arriba, a todo lo ancho: el plano se decide viéndolo. */}
      {carrusel ? (
        <div className="lgp-carrusel-fila" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          {opciones.length > 1 ? flecha(-1, `${pieza ?? 'plano'} anterior`, '‹') : null}
          {visualFoco}
          {opciones.length > 1 ? flecha(1, `${pieza ?? 'plano'} siguiente`, '›') : null}
        </div>
      ) : null}

      {tarjetaFoco}

      {/* Nada apagado sin explicación. Las flechas en gris sin una línea que
          diga por qué se leen como que la página falla, y el cliente que quiere
          comparar se queda golpeando un botón muerto. Dice además dónde está la
          salida, que es el botón que tiene justo encima. */}
      {carruselCerrado && elegida ? (
        <p style={{ margin: '-8px 0 20px', maxWidth: '520px', fontSize: '12.5px', lineHeight: 1.55, color: '#5C6163' }}>
          Solo puedes llevar una. Para ver las demás, quita{' '}
          <strong style={{ fontWeight: 600, color: '#1C1E1F' }}>{elegida.nombre}</strong> con su ✕.
        </p>
      ) : null}

      {carrusel ? null : tabla}

      {nota ? <div style={{ marginTop: '16px' }}>{nota}</div> : null}
    </div>
  );
}
