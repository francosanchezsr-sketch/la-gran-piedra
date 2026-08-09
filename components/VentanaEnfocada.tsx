'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * La ventana donde vive "Personaliza tu casa". Ocupa la pantalla entera y tapa
 * el sitio: mientras el cliente arma su casa no hay hero, ni FAQ, ni barra de
 * navegación compitiendo por su atención.
 *
 * Los modales que ya existían fallaban en todo lo que un modal tiene que
 * cumplir, así que aquí se resuelve de una vez:
 *
 *  - Escape cierra.
 *  - El foco entra al abrir y no se sale mientras esté abierta.
 *  - Al cerrar, el foco vuelve a donde estaba.
 *  - El fondo no hace scroll.
 *  - Anunciada como diálogo para lectores de pantalla.
 *  - El botón/gesto de "atrás" del teléfono cierra la ventana en vez de sacar
 *    al cliente del sitio. Sin esto, un deslizamiento en el paso 5 le borra
 *    todo el trabajo — y en Android es el gesto más usado que existe.
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
  const focoPrevioRef = useRef<HTMLElement | null>(null);
  // Distingue un cierre nuestro de uno provocado por el botón atrás, para no
  // sacar dos entradas del historial por el mismo cierre.
  const cerrandoPorHistorialRef = useRef(false);

  // --- Bloqueo del scroll de fondo -----------------------------------------
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    const previoTouch = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = previo;
      document.body.style.touchAction = previoTouch;
    };
  }, [abierto]);

  // --- Atrás del navegador y del teléfono ----------------------------------
  useEffect(() => {
    if (!abierto) return;
    window.history.pushState({ lgpVentana: true }, '');
    const alVolver = () => {
      cerrandoPorHistorialRef.current = true;
      onCerrar();
    };
    window.addEventListener('popstate', alVolver);
    return () => {
      window.removeEventListener('popstate', alVolver);
      // Si se cerró con la ✕ o con Escape, la entrada que empujamos sigue en el
      // historial y hay que sacarla; si se cerró con "atrás", el navegador ya
      // la sacó él solo.
      if (cerrandoPorHistorialRef.current) {
        cerrandoPorHistorialRef.current = false;
      } else if (window.history.state?.lgpVentana) {
        window.history.back();
      }
    };
  }, [abierto, onCerrar]);

  // --- Escape, trampa de foco y devolución del foco ------------------------
  useEffect(() => {
    if (!abierto) return;
    focoPrevioRef.current = document.activeElement as HTMLElement | null;

    const enfocables = () =>
      Array.from(
        cajaRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((e) => !e.hasAttribute('disabled') && e.offsetParent !== null);

    // El primer foco va a la caja, no al primer botón: leerle "Cerrar" a
    // alguien que acaba de abrir la ventana no le dice dónde está.
    cajaRef.current?.focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrar();
        return;
      }
      if (e.key !== 'Tab') return;
      const lista = enfocables();
      if (!lista.length) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement;
      if (e.shiftKey && (activo === primero || activo === cajaRef.current)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      focoPrevioRef.current?.focus?.();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={etiqueta}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#FBFBFA' }}
    >
      <div
        ref={cajaRef}
        tabIndex={-1}
        className="lgp-ventana"
        style={{ display: 'flex', flexDirection: 'column', height: '100%', outline: 'none' }}
      >
        {cabecera ? (
          <div style={{ flex: 'none', borderBottom: '1px solid #EAE7E3', background: '#fff' }}>{cabecera}</div>
        ) : null}

        {/* El paso ocupa lo que queda y se resuelve aquí dentro. El scroll
            interno es una válvula: en una pantalla de 320 px algo siempre se
            sale, y dejarlo inalcanzable sería peor que dejarlo desplazable. */}
        <div className="lgp-ventana-cuerpo" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          {children}
        </div>

        {pie ? (
          <div style={{ flex: 'none', borderTop: '1px solid #EAE7E3', background: '#fff' }}>{pie}</div>
        ) : null}
      </div>
    </div>
  );
}
