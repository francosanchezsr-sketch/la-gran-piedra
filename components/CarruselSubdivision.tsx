'use client';

import { useCallback, useEffect, useState } from 'react';

import { Lupa } from './IconosTira';
import VisorObra from './VisorObra';

const MS_TURNO = 5000;

export type ImagenSubdivision = { src: string; alt: string; tipo: 'foto' | 'render' };

/**
 * Las imágenes de la tarjeta de subdivisión, turnándose solas cada 5 segundos.
 *
 * Se funden en cruz en vez de deslizarse: la tarjeta lleva el nombre de la
 * subdivisión fijo encima, y un deslizamiento lo arrastraría o lo despegaría del
 * fondo. Fundir deja el rótulo quieto y cambia solo lo que hay detrás.
 *
 * Sobre el botón de pausa: no es un extra. Un carrusel que se mueve solo durante
 * más de cinco segundos tiene que poder detenerse (WCAG 2.2.2), porque el
 * movimiento periférico le arruina la lectura a quien tiene déficit de atención
 * y a quien lee despacio. También se detiene con el cursor encima y con el foco
 * del teclado dentro, y no arranca nunca si el sistema pide menos movimiento.
 */
export default function CarruselSubdivision({
  imagenes,
  className,
  style,
}: {
  imagenes: readonly ImagenSubdivision[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const [i, setI] = useState(0);
  const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false);
  const [pausadoPorRoce, setPausadoPorRoce] = useState(false);
  const [rotas, setRotas] = useState<string[]>([]);
  const [sinMovimiento, setSinMovimiento] = useState(false);
  const [abierta, setAbierta] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const leer = () => setSinMovimiento(mq.matches);
    leer();
    mq.addEventListener('change', leer);
    return () => mq.removeEventListener('change', leer);
  }, []);

  const vivas = imagenes.filter((im) => !rotas.includes(im.src));
  const total = vivas.length;
  // El índice se recorta y no se envuelve con módulo: si una imagen falla al
  // cargar mientras está puesta, el módulo saltaría a otra sin avisar.
  const actual = Math.min(i, Math.max(0, total - 1));

  // Con el visor abierto la rotación se detiene: si no, al cerrarlo el cliente
  // se encontraría la tarjeta enseñando otra imagen distinta de la que abrió.
  const andando = total > 1 && !pausadoPorUsuario && !pausadoPorRoce && !sinMovimiento && abierta === null;

  useEffect(() => {
    if (!andando) return;
    const t = setInterval(() => setI((n) => (n + 1) % total), MS_TURNO);
    return () => clearInterval(t);
  }, [andando, total]);

  const irA = useCallback((n: number) => {
    setI(n);
    // Elegir a mano es una decisión del cliente: la rotación automática deja de
    // mandar hasta que él la reanude. Un carrusel que te arrebata la imagen dos
    // segundos después de que la elegiste es el motivo por el que la gente los
    // detesta.
    setPausadoPorUsuario(true);
  }, []);

  const im = vivas[actual];
  if (!im) return null;

  return (
    <div
      className={className}
      style={style}
      onMouseEnter={() => setPausadoPorRoce(true)}
      onMouseLeave={() => setPausadoPorRoce(false)}
      onFocusCapture={() => setPausadoPorRoce(true)}
      onBlurCapture={() => setPausadoPorRoce(false)}
      /* Se anuncia como carrusel y los cambios automáticos no interrumpen al
         lector de pantalla: `aria-live` queda en "off" mientras la rotación
         corre, porque leerle una imagen nueva cada cinco segundos a alguien que
         está oyendo otra cosa es hostil. */
      role="group"
      aria-roledescription="carrusel"
      aria-label="Imágenes de la subdivisión"
    >
      {vivas.map((img, n) => (
        <img
          key={img.src}
          src={img.src}
          alt={n === actual ? img.alt : ''}
          aria-hidden={n === actual ? undefined : true}
          loading={n === 0 ? undefined : 'lazy'}
          decoding="async"
          onError={() => setRotas((r) => (r.includes(img.src) ? r : [...r, img.src]))}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: n === actual ? 1 : 0,
            transition: sinMovimiento ? 'none' : 'opacity 700ms cubic-bezier(0.22, 0.61, 0.36, 1)',
          }}
        />
      ))}

      {/* Abrir a pantalla completa. Va como botón propio y no envolviendo el
          conjunto para no tragarse los puntos ni la pausa, que tienen que
          seguir siendo pulsables por separado. */}
      <button
        type="button"
        onClick={() => setAbierta(actual)}
        className="lgp-carrusel-abrir"
        aria-label={`Ver a pantalla completa: ${im.alt}`}
      >
        <span className="lgp-obra-lupa" aria-hidden="true"><Lupa /></span>
      </button>

      {/* El rótulo del render va sobre la imagen y no en el pie: separado de
          ella dejaría de decir cuál de las dos es sintética. */}
      {im.tipo === 'render' ? (
        <span
          style={{
            position: 'absolute',
            left: '22px',
            top: '18px',
            zIndex: 3,
            padding: '5px 8px',
            background: 'rgba(28,30,31,0.82)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.14em',
            color: '#fff',
            textTransform: 'uppercase',
          }}
        >
          Render &mdash; no es foto de obra
        </span>
      ) : null}

      {total > 1 ? (
        <div style={{ position: 'absolute', right: '22px', top: '14px', zIndex: 3, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {vivas.map((img, n) => (
            <button
              key={img.src}
              type="button"
              onClick={() => irA(n)}
              aria-label={`Ver imagen ${n + 1} de ${total}`}
              aria-current={n === actual ? 'true' : undefined}
              className="lgp-carrusel-punto"
              data-on={n === actual ? '1' : '0'}
            >
              <span aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPausadoPorUsuario((p) => !p)}
            aria-label={pausadoPorUsuario ? 'Reanudar el cambio automático de imagen' : 'Detener el cambio automático de imagen'}
            className="lgp-carrusel-punto lgp-carrusel-pausa"
          >
            {pausadoPorUsuario ? (
              <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true" focusable="false"><path d="M1 0.5 8 5 1 9.5Z" fill="currentColor" /></svg>
            ) : (
              <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true" focusable="false"><path d="M0.5 0.5h2v9h-2zM5.5 0.5h2v9h-2z" fill="currentColor" /></svg>
            )}
          </button>
        </div>
      ) : null}

      <VisorObra
        fotos={vivas}
        indice={abierta}
        onIr={setAbierta}
        onCerrar={() => {
          // Al cerrar, la tarjeta se queda en la imagen que estaba viendo.
          if (abierta !== null) setI(abierta);
          setAbierta(null);
        }}
      />
    </div>
  );
}
