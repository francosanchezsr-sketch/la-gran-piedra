'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { useVentanaModal } from '@/lib/useVentanaModal';

// La hoja aterriza a los 780ms, pero el canto levantado espera 540 y tarda otros
// 400 en cerrarse: la fase no puede acabar antes que la última pieza del gesto,
// o el nodo se desmontaría con la esquina todavía a medio bajar.
const MS_ENTRADA = 940;
// El cierre son dos gestos encadenados: la hoja se dobla sobre sí misma (340ms)
// y a los 180 empieza el tirón que se la lleva (380 más). Total 560. Desmontarla
// antes la cortaría a media huida y volvería a parecer un parpadeo, que es justo
// lo que se quitó.
const MS_SALIDA = 560;

function prefiereMenosMovimiento() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * La ventana donde vive "Personaliza tu casa". Ocupa la pantalla entera y tapa
 * el sitio: mientras el cliente arma su casa no hay hero, ni FAQ, ni barra de
 * navegación compitiendo por su atención.
 *
 * Foco, Escape, `inert`, scroll de fondo y gesto de "atrás" los resuelve
 * `useVentanaModal`, que es el único sitio donde viven esas reglas. Lo que este
 * componente aporta encima es su puesta en escena —la hoja que alguien pone
 * sobre el escritorio, en `globals.css`— y la caja con cabecera y pie.
 *
 * La puesta en escena es de una sola capa: la ventana misma se posa. El telón
 * carmín que vivía aquí necesitaba una segunda capa por encima para tapar el
 * momento en que el contenido se materializaba detrás; una hoja que se posa no
 * tapa nada, así que ese nodo desapareció con él.
 */
export default function VentanaEnfocada({
  abierto,
  onCerrar,
  etiqueta,
  cabecera,
  children,
  pie,
}: {
  abierto: boolean;
  onCerrar: () => void;
  /** Nombre de la ventana para lectores de pantalla. */
  etiqueta: string;
  cabecera?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
}) {
  const cajaRef = useRef<HTMLDivElement | null>(null);
  // --- Fases de apertura y cierre ------------------------------------------
  // La ventana sigue montada mientras sale: si se desmontara con `abierto`,
  // no habría nada a lo que animarle la salida y se cortaría en seco.
  const [montado, setMontado] = useState(abierto);
  const [fase, setFase] = useState<'entra' | 'abierto' | 'sale'>(abierto ? 'abierto' : 'sale');

  useEffect(() => {
    const sinMovimiento = prefiereMenosMovimiento();
    if (abierto) {
      setMontado(true);
      if (sinMovimiento) { setFase('abierto'); return; }
      setFase('entra');
      const t = setTimeout(() => setFase('abierto'), MS_ENTRADA);
      return () => clearTimeout(t);
    }
    if (!montado) return;
    if (sinMovimiento) { setMontado(false); return; }
    setFase('sale');
    const t = setTimeout(() => setMontado(false), MS_SALIDA);
    return () => clearTimeout(t);
    // `montado` se lee pero no se observa a propósito: incluirlo relanzaría el
    // efecto en cuanto lo cambiamos y volvería a programar el mismo cierre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  // Foco, Escape, contención de Tab, `inert` del fondo, scroll bloqueado y el
  // gesto de "atrás" del teléfono: todo vive en el hook, compartido con el
  // visor de fotos de "La obra".
  useVentanaModal({ abierto, montado, cajaRef, onCerrar });

  if (!montado) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={etiqueta}
      // Sin fondo propio: el papel es la HOJA, no el marco. Mientras el fondo
      // vivía aquí, al abrir aparecía de golpe un muro opaco a pantalla
      // completa y la hoja se desvanecía encima — ese era el parpadeo en
      // blanco. Ahora detrás está la página, que es la mesa sobre la que cae.
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column' }}
    >
      <div
        ref={cajaRef}
        tabIndex={-1}
        className="lgp-ventana"
        data-fase={fase}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', outline: 'none', position: 'relative', background: '#FBFBFA' }}
      >
        {/* Las dos capas de la puesta en escena. Solo existen mientras dura el
            movimiento: con la ventana ya abierta no pintan nada y se llevarían
            por delante los clics de la esquina inferior derecha aunque fueran
            invisibles, así que se desmontan en vez de quedarse en opacidad 0.

            Van dentro de la caja para heredar su transformación: así viajan con
            la hoja sin que haya que duplicarles la animación, que es el tipo de
            duplicado que acaba desincronizándose al tocar un número. */}
        {fase === 'abierto' ? null : <span className="lgp-hoja-sombra" aria-hidden="true" />}

        {/* El dorso de la hoja. Solo existe al cerrar: es la cara de atrás que
            va quedando a la vista mientras el pliegue barre la hoja entera. */}
        {fase === 'sale' ? <span className="lgp-hoja-dorso" aria-hidden="true" /> : null}

        {/* El canto doblado se queda toda la sesión: es el dorso carmín de la
            hoja y, desde que la esquina está levantada, el sitio por donde se
            despega. Cierra la ventana igual que el "CERRAR ✕" de la cabecera,
            que sigue ahí — un triángulo de color no dice por sí solo lo que
            hace, y la salida tiene que estar escrita con palabras además de
            insinuada. */}
        <button
          type="button"
          className="lgp-hoja-canto"
          onClick={onCerrar}
          aria-label="Cerrar"
          title="Cerrar"
        />

        {cabecera ? (
          <div className="lgp-ventana-cabecera" style={{ flex: 'none', borderBottom: '1px solid #EAE7E3', background: '#fff' }}>{cabecera}</div>
        ) : null}

        {/* El paso ocupa lo que queda y se resuelve aquí dentro. El scroll
            interno es una válvula: en una pantalla de 320 px algo siempre se
            sale, y dejarlo inalcanzable sería peor que dejarlo desplazable.
            El `overflow` vive en la hoja de estilos, no aquí: en línea le
            ganaría a la regla que lo bloquea durante la guía del paso 3. */}
        <div className="lgp-ventana-cuerpo" style={{ flex: 1, minHeight: 0, overscrollBehavior: 'contain' }}>
          {children}
        </div>

        {pie ? (
          <div style={{ flex: 'none', borderTop: '1px solid #EAE7E3', background: '#fff' }}>{pie}</div>
        ) : null}
      </div>
    </div>
  );
}
