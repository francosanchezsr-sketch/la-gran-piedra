'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useT } from '@/components/ProveedorIdioma';

/**
 * LA VENTANA DE ACUSE: "ya te oímos".
 *
 * Aparece encima de la página cuando el cliente acaba de mandar algo y no se
 * puede permitir la duda de si salió. Por eso flota en vez de escribirse en
 * la página: el acuse en línea se lo puede perder quien ya estaba haciendo
 * scroll, y este no.
 *
 * Dentro no hay más que el mensaje y una ✕ arriba a la derecha. Nada de
 * "aceptar" ni de botones secundarios: la acción ya ocurrió, no hay nada que
 * decidir, y ponerle opciones a un aviso lo convierte en una pregunta.
 *
 * Las otras dos salidas —Escape y tocar fuera— no se dibujan pero existen,
 * porque son las que espera cualquiera que use teclado o venga de cerrar
 * otra ventana. Es el mismo trato que `VentanaEnfocada` y el selector de
 * idioma.
 */
export default function VentanaAviso({
  abierto,
  onCerrar,
  titulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  /** El mensaje. Corto: esta ventana se lee de un vistazo o no sirve. */
  titulo: string;
  /** Lo que va debajo, si hace falta. Casi nunca hace falta. */
  children?: ReactNode;
}) {
  const t = useT();
  const cerrarRef = useRef<HTMLButtonElement | null>(null);
  // A dónde devolver el foco al cerrar: si no se guarda, el teclado vuelve al
  // principio del documento y el cliente pierde el lugar donde estaba.
  const antes = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;
    antes.current = document.activeElement as HTMLElement | null;
    cerrarRef.current?.focus();

    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', tecla);

    // La página de atrás no debe moverse mientras esto está encima: si se
    // scrollea, el aviso parece pegado a una página que ya no es la suya.
    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', tecla);
      document.body.style.overflow = scrollPrevio;
      antes.current?.focus?.();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="lgp-aviso-telon"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '22px',
        /* Tinta translúcida y no sólida: el cliente tiene que seguir viendo
           la página que acaba de usar — es la prueba de que su mensaje salió
           de ahí y no de otro lado. */
        background: 'rgba(15,16,17,0.52)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="lgp-aviso-panel"
        style={{
          position: 'relative', width: '100%', maxWidth: '430px',
          padding: '34px 30px 32px', background: '#FBFBFA',
          border: '1px solid #E4E1DD', boxShadow: '0 24px 60px rgba(28,30,31,0.26)',
        }}
      >
        <button
          ref={cerrarRef}
          type="button"
          onClick={onCerrar}
          aria-label={t('Cerrar')}
          className="lgp-aviso-x"
          style={{
            position: 'absolute', top: '6px', right: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px',
            background: 'transparent', border: 0, color: '#5C6163', cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p style={{
          margin: 0, paddingRight: '34px',
          fontSize: 'clamp(19px,2.3vw,25px)', lineHeight: 1.32,
          letterSpacing: '-0.012em', textWrap: 'pretty',
        }}>
          {titulo}
        </p>
        {children}
      </div>
    </div>
  );
}
