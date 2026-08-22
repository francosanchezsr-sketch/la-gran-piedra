'use client';

import { useEffect, useRef, useState } from 'react';

import { useVentanaModal } from '@/lib/useVentanaModal';
import type { FotoObra } from '@/lib/obra';

import { Chevron, Cruz } from './IconosTira';

/**
 * La foto a pantalla completa.
 *
 * No reusa el telón carmín de `VentanaEnfocada` a propósito: la franja significa
 * *elegido*, y abrir una foto no es una decisión. Gastarla aquí la dejaría sin
 * significado en el único sitio donde la tiene, que es la fila de opción.
 *
 * El fondo es tinta y no papel porque aquí manda la fotografía: cualquier
 * superficie clara alrededor le roba contraste. El manual admite blanco *o*
 * negro como dominante, así que esto no sale de la identidad.
 */
export default function VisorObra({
  fotos,
  indice,
  onIr,
  onCerrar,
}: {
  /** `readonly` para que también acepte listas declaradas con `as const`, como
   *  las imágenes de la subdivisión en `lib/data.ts`. */
  fotos: readonly FotoObra[];
  /** `null` = cerrado. */
  indice: number | null;
  onIr: (i: number) => void;
  onCerrar: () => void;
}) {
  const cajaRef = useRef<HTMLDivElement | null>(null);
  const abierto = indice !== null;
  // El montaje va un fotograma por detrás para que la entrada tenga de dónde
  // animarse; el hook necesita saber cuándo la caja ya está en el DOM.
  const [montado, setMontado] = useState(abierto);
  useEffect(() => { if (abierto) setMontado(true); else setMontado(false); }, [abierto]);

  useVentanaModal({ abierto, montado, cajaRef, onCerrar });

  const hayPrevia = indice !== null && indice > 0;
  const haySiguiente = indice !== null && indice < fotos.length - 1;

  // Flechas del teclado: en un visor de fotos es el gesto que todo el mundo
  // prueba primero. Escape ya lo cubre el hook.
  useEffect(() => {
    if (indice === null) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && indice > 0) { e.preventDefault(); onIr(indice - 1); }
      if (e.key === 'ArrowRight' && indice < fotos.length - 1) { e.preventDefault(); onIr(indice + 1); }
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [indice, fotos.length, onIr]);

  if (indice === null) return null;
  const foto = fotos[indice];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${indice + 1} de ${fotos.length}: ${foto.alt}`}
      className="lgp-visor"
      /* Tinta sólida, no translúcida: con un 4% de transparencia el hero y la
         cabecera seguían leyéndose por debajo y le competían a la foto, que es
         lo único que esta pantalla existe para enseñar. */
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#1C1E1F' }}
    >
      <div
        ref={cajaRef}
        tabIndex={-1}
        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', outline: 'none' }}
      >
        {/* Cabecera: el conteo a la izquierda como dato, el cierre a la derecha
            donde el pulgar lo busca. */}
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.14)' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', paddingLeft: '6px' }}>
            {String(indice + 1).padStart(2, '0')} / {String(fotos.length).padStart(2, '0')}
          </span>
          <button type="button" onClick={onCerrar} className="lgp-visor-btn" aria-label="Cerrar la foto">
            <Cruz />
            <span style={{ fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em' }}>Cerrar</span>
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px, 2vw, 28px)' }}>
          {/* `key` fuerza el remontaje al cambiar de foto: sin él la imagen
              nueva hereda la animación ya consumida de la anterior y entra
              sin transición. */}
          <img
            key={foto.src}
            src={foto.src}
            alt={foto.alt}
            className="lgp-visor-img"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />

          {hayPrevia ? (
            <button
              type="button"
              onClick={() => onIr(indice - 1)}
              className="lgp-visor-btn lgp-visor-flecha"
              style={{ left: 'clamp(8px, 2vw, 20px)' }}
              aria-label="Foto anterior"
            >
              <Chevron dir="izq" />
            </button>
          ) : null}

          {haySiguiente ? (
            <button
              type="button"
              onClick={() => onIr(indice + 1)}
              className="lgp-visor-btn lgp-visor-flecha"
              style={{ right: 'clamp(8px, 2vw, 20px)' }}
              aria-label="Foto siguiente"
            >
              <Chevron dir="der" />
            </button>
          ) : null}
        </div>

        <p style={{ flex: 'none', margin: 0, padding: '12px 18px calc(14px + env(safe-area-inset-bottom))', maxWidth: '70ch', fontSize: '13px', lineHeight: 1.5, color: 'rgba(255,255,255,0.72)' }}>
          {foto.alt}
        </p>
      </div>
    </div>
  );
}
