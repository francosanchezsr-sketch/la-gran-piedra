'use client';

import { useEffect, useRef, useState } from 'react';
import { IDIOMAS, type Idioma } from '@/lib/idioma';

/**
 * EL SELECTOR DE IDIOMA de la cabecera.
 *
 * Un botón con el idioma actual y una flecha; al tocarlo se despliegan los
 * dos. Va pegado al "Agenda una cita" y no dentro de un menú escondido: para
 * el cliente internacional —la mitad del negocio— encontrarlo es lo primero
 * que tiene que pasar, antes de leer nada.
 *
 * El botón dice LANGUAGE o IDIOMA —no "ES"/"EN" ni una banderita—. Dos letras
 * sueltas no dicen de qué son, y una bandera nombra países, no idiomas: aquí
 * el inglés no es el de ninguno en particular. La palabra además hace doble
 * trabajo, porque está en el idioma en el que se está viendo el sitio: quien
 * lee IDIOMA ya sabe en cuál está parado sin abrir nada. El idioma activo se
 * marca otra vez dentro del desplegable, con fondo y negrita.
 *
 * El aspecto no es propio: es `.lgp-btn .lgp-btn-fantasma`, el registro que el
 * sistema reserva para "explorar, no avanzar" —filete y texto, que se rellenan
 * de tinta al tocarlo—. Es el mismo botón que el resto del sitio, no uno
 * parecido.
 */
export default function SelectorIdioma({
  idioma,
  onCambiar,
}: {
  idioma: Idioma;
  onCambiar: (i: Idioma) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement | null>(null);

  // Se cierra al tocar fuera o con Escape. Las dos salidas hacen falta: una
  // para el dedo y otra para el teclado.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return (
    <div ref={caja} style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={idioma === 'es' ? 'Idioma del sitio' : 'Site language'}
        /* El gesto de los demás botones del sitio: crece un punto y suelta
           sombra al acercarse el cursor. Sin él este sería el único control de
           la cabecera que no reacciona. */
        className="lgp-hover-zoom lgp-btn lgp-btn-fantasma lgp-idioma-btn"
        style={{ gap: '8px' }}
      >
        {idioma === 'es' ? 'Idioma' : 'Language'}
        {/* La flecha gira al abrir: dice si lo que ves es el menú desplegado
            o el botón en reposo, sin añadir una sola palabra. */}
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease' }}>
          <path d="M5 9l7 7 7-7" />
        </svg>
      </button>

      {abierto ? (
        <ul
          role="listbox"
          aria-label={idioma === 'es' ? 'Idiomas' : 'Languages'}
          style={{
            position: 'absolute', top: '100%', right: '14px', zIndex: 70,
            margin: '6px 0 0', padding: 0, listStyle: 'none', minWidth: '132px',
            background: '#FBFBFA', border: '1px solid #DDD9D4',
            boxShadow: '0 10px 22px rgba(28,30,31,0.12)',
          }}
        >
          {IDIOMAS.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                role="option"
                aria-selected={i.id === idioma}
                onClick={() => { onCambiar(i.id); setAbierto(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '12px', width: '100%', padding: '10px 12px',
                  background: i.id === idioma ? '#F1EEE9' : 'transparent',
                  border: 0, cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'Archivo, sans-serif', fontSize: '13px',
                  fontWeight: i.id === idioma ? 700 : 400, color: '#1C1E1F',
                }}
              >
                {i.nombre}
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#6E7375' }}>{i.corto}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
