/**
 * Los dos iconos de la tira y del visor, dibujados.
 *
 * Van en SVG y no como carácter tipográfico ("‹", "×") porque un glifo hereda la
 * métrica de la fuente: cambia de grosor y de centrado con cada peso y cada
 * tamaño, y nunca cae exactamente en el centro óptico del botón. Mismo trazo de
 * 2px y mismo remate cuadrado que el resto del sistema, que no tiene curvas.
 */
export function Chevron({ dir }: { dir: 'izq' | 'der' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" focusable="false">
      <path
        d={dir === 'izq' ? 'M9.5 2 4 7.5 9.5 13' : 'M5.5 2 11 7.5 5.5 13'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Cruz() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" focusable="false">
      <path d="M1.5 1.5 11.5 11.5M11.5 1.5 1.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export function Lupa() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" focusable="false">
      <path d="M6.25 1.5a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5ZM9.75 9.75 13.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M4 6.25h4.5M6.25 4v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}
