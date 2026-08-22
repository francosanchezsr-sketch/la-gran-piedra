'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FOTOS_OBRA } from '@/lib/obra';

import { Chevron, Lupa } from './IconosTira';
import VisorObra from './VisorObra';

/**
 * La tira de "La obra": fotos que se deslizan, con flechas para quien no
 * descubre el gesto, y visor a pantalla completa al tocar cualquiera.
 *
 * Las flechas **se retiran** en el extremo en vez de quedarse apagadas. Un
 * control desactivado obliga a leerlo para saber que no sirve; uno ausente ya
 * dijo lo mismo sin pedir nada. Y como la única función de la flecha es avisar
 * de que hay más, en el extremo no tiene nada que avisar.
 */
export default function TiraObra() {
  const tiraRef = useRef<HTMLDivElement | null>(null);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);

  const medir = useCallback(() => {
    const t = tiraRef.current;
    if (!t) return;
    // 2px de holgura: el scroll fraccionario de los navegadores deja restos que
    // dejarían la flecha puesta con la tira ya al tope.
    setPuedeIzq(t.scrollLeft > 2);
    setPuedeDer(t.scrollLeft + t.clientWidth < t.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const t = tiraRef.current;
    if (!t) return;
    medir();
    t.addEventListener('scroll', medir, { passive: true });
    // `scrollend` cierra el desplazamiento suave: el último `scroll` de una
    // animación puede llegar antes del fotograma final, y sin esto la flecha se
    // quedaba puesta con la tira ya al tope.
    t.addEventListener('scrollend', medir);
    // El ancho de las piezas es `clamp(...)` y `82vw` en móvil: al cambiar el
    // tamaño de la ventana cambia también si queda algo por desplazar. El
    // observador vigila la tira y su contenido, porque una foto que termina de
    // cargar también cambia cuánto queda por desplazar.
    const ro = new ResizeObserver(medir);
    ro.observe(t);
    for (const hijo of Array.from(t.children)) ro.observe(hijo);
    return () => {
      t.removeEventListener('scroll', medir);
      t.removeEventListener('scrollend', medir);
      ro.disconnect();
    };
  }, [medir]);

  const desplazar = (signo: 1 | -1) => {
    const t = tiraRef.current;
    if (!t) return;
    const pieza = t.querySelector<HTMLElement>('.lgp-obra-pieza');
    // Un salto por pieza, no por pantalla: con scroll-snap puesto, avanzar de
    // pantalla en pantalla deja la foto siguiente siempre a medias.
    const paso = pieza ? pieza.getBoundingClientRect().width + 18 : t.clientWidth * 0.8;
    const sinMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    t.scrollBy({ left: signo * paso, behavior: sinMovimiento ? 'auto' : 'smooth' });
    // Cinturón además del tirante: si el navegador no emite `scrollend` —o el
    // salto fue instantáneo—, esto vuelve a medir igual. Medir es leer dos
    // números y comparar; repetirlo no cuesta nada y evita que una flecha se
    // quede puesta señalando un extremo al que ya llegamos.
    requestAnimationFrame(medir);
    setTimeout(medir, 400);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={tiraRef}
        className="lgp-obra-tira"
        style={{ display: 'flex', gap: '18px', overflowX: 'auto', paddingBottom: '16px', scrollSnapType: 'x mandatory', scrollbarWidth: 'thin' }}
      >
        {FOTOS_OBRA.map((foto, i) => (
          <button
            key={foto.src}
            type="button"
            onClick={() => setAbierta(i)}
            className="lgp-obra-pieza lgp-obra-abrir"
            aria-label={`Ver a pantalla completa: ${foto.alt}`}
            style={{ flex: 'none', padding: 0, border: 0, background: '#F0EDE9', scrollSnapAlign: 'start', cursor: 'zoom-in' }}
          >
            <img
              src={foto.src}
              alt={foto.alt}
              /* La primera entra con la sección; las quince restantes solo si el
                 cliente decide deslizar. */
              loading={i === 0 ? undefined : 'lazy'}
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <span className="lgp-obra-lupa" aria-hidden="true"><Lupa /></span>
          </button>
        ))}
      </div>

      {puedeIzq ? (
        <button type="button" onClick={() => desplazar(-1)} className="lgp-tira-flecha" style={{ left: 'max(6px, calc((100% - var(--lgp-ancho)) / 2 - 22px))' }} aria-label="Ver fotos anteriores">
          <Chevron dir="izq" />
        </button>
      ) : null}

      {puedeDer ? (
        <button type="button" onClick={() => desplazar(1)} className="lgp-tira-flecha" style={{ right: '6px' }} aria-label="Ver más fotos">
          <Chevron dir="der" />
        </button>
      ) : null}

      <VisorObra
        fotos={FOTOS_OBRA}
        indice={abierta}
        onIr={setAbierta}
        onCerrar={() => setAbierta(null)}
      />
    </div>
  );
}
