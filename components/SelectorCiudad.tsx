'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { PresetRetiros } from '@/lib/data';
import { useT } from '@/components/ProveedorIdioma';

/**
 * El selector de ciudad del paso del lote.
 *
 * Antes eran chips en fila: con cuatro ciudades cabían, con seis se envuelven
 * en dos renglones y la pregunta deja de leerse de un vistazo. Un menú resuelve
 * el sitio y además dice algo que la fila no decía — cuál está elegida se ve
 * sin recorrer todas.
 *
 * La lista trae TODAS las ciudades, la elegida incluida. En la referencia la
 * seleccionada se saca de la lista; aquí se queda y va marcada, porque este es
 * un control de formulario y no un filtro: quien lo abre muchas veces está
 * comparando, y desaparecer la opción activa obliga a recordar de dónde venía.
 *
 * El disparador lleva el MISMO gesto que las dos tarjetas de "sube tu lote"
 * que tiene encima (`.lgp-tarjeta-tinta`): en reposo es una hoja con filo de
 * tinta, y se llena de negro al pasar el cursor, al apretar y mientras la lista
 * está abierta. No se reimplanta el efecto, se reusa la clase — son vecinos en
 * la misma tarjeta y tenían que moverse igual.
 *
 * Por eso el disparador ya NO se pinta de negro por tener ciudad elegida: el
 * relleno quedó reservado para el gesto, igual que en esas tarjetas. Cuál está
 * elegida lo dice su nombre en el rótulo, que es más claro que un fondo.
 *
 * Colores del manual: Tinta para el panel y el relleno, Papel para el rótulo,
 * Carmín para la marca de la elegida. Canto vivo, como los campos de frente y
 * fondo que van justo debajo — una píldora aquí sería la única forma redondeada
 * de toda la tarjeta.
 */

// Los tonos de la lista. El panel es tinta y las filas se aclaran al pasar el
// cursor con blanco a muy baja alfa: es el mismo relleno, no un color nuevo.
const TINTA = '#1C1E1F';
const PAPEL = '#FBFBFA';
const CARMIN = '#F2004B';

export default function SelectorCiudad({
  opciones,
  valor,
  onElegir,
}: {
  opciones: PresetRetiros[];
  /** `null` mientras el cliente no ha contestado. */
  valor: string | null;
  onElegir: (id: string) => void;
}) {
  const t = useT();
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement | null>(null);
  const idPanel = useId();
  const elegida = opciones.find((o) => o.id === valor) ?? null;

  /**
   * Cerrar al tocar fuera y con Escape.
   *
   * Los dos escuchas viven en el documento y no en la caja: un clic en
   * cualquier otro sitio de la pantalla tiene que cerrar esto, y un menú que
   * se queda abierto tapando los campos de abajo es peor que no tenerlo.
   * `mousedown` y no `click` para que cierre en el mismo gesto en que el
   * cliente empieza a tocar otra cosa.
   */
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  return (
    <div ref={caja} style={{ position: 'relative', maxWidth: '340px', marginBottom: '18px' }}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-haspopup="listbox"
        /* Sin `lgp-hover-zoom`: las tarjetas de arriba no crecen, se llenan.
           El levantón que acompaña al relleno ya viene en la propia clase. */
        className="lgp-tarjeta-tinta"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          width: '100%', minHeight: '44px', padding: '0 14px',
          fontFamily: 'Archivo, sans-serif', fontSize: '13px', fontWeight: 700,
          letterSpacing: '0.06em', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span>{elegida ? elegida.ciudad : t('Elige tu ciudad')}</span>
        {/* La flecha gira media vuelta al abrir, como en la referencia. Es lo
            único que dice "esto se despliega" sin gastar una palabra. */}
        <svg
          viewBox="0 0 12 8" width="11" height="7" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ flex: 'none', transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .22s cubic-bezier(.22,.61,.36,1)' }}
        >
          <path d="M1 1.8 6 6.4l5-4.6" />
        </svg>
      </button>

      <div
        id={idPanel}
        role="listbox"
        aria-label={t('Ciudad de tu lote')}
        className={'lgp-selector-panel' + (abierto ? ' lgp-selector-abierto' : '')}
        style={{ background: TINTA }}
      >
        {opciones.map((c) => {
          const on = c.id === valor;
          return (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={on}
              /* Con el panel cerrado las filas salen del tabulador: si no,
                 el foco se metía en un menú invisible y el cliente tecleaba a
                 ciegas. */
              tabIndex={abierto ? 0 : -1}
              onClick={() => { onElegir(c.id); setAbierto(false); }}
              className="lgp-selector-opcion"
              style={{ color: on ? PAPEL : 'rgba(251,251,250,0.74)' }}
            >
              {/* El punto carmín es quien dice cuál está tomada — el mismo
                  recurso que usan las dos tarjetas de "sube tu lote". */}
              <span
                aria-hidden="true"
                style={{
                  width: '7px', height: '7px', flex: 'none', borderRadius: '50%',
                  background: on ? CARMIN : 'transparent',
                  boxShadow: on ? 'none' : 'inset 0 0 0 1px rgba(251,251,250,0.32)',
                }}
              />
              {c.ciudad}
            </button>
          );
        })}
      </div>
    </div>
  );
}
