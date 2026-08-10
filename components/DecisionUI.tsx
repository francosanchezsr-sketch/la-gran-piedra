'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Las piezas visuales del prototipo de Claude Design. El movimiento vive en
 * `globals.css` (keyframes y reglas de `[data-opt-row]`); aquí va solo la
 * estructura. Ninguna toma decisiones de negocio: reciben qué mostrar y a quién
 * avisar cuando las tocan.
 */

/**
 * Alterna entre dos nombres de animación cada vez que cambia el valor. Reusar
 * el mismo nombre no vuelve a disparar la animación en CSS, así que el barrido
 * carmín solo se vería la primera vez.
 */
export function useAnimacionAlterna(valor: unknown, a: string, b: string): string | null {
  const [nombre, setNombre] = useState<string | null>(null);
  const anterior = useRef<unknown>(valor);
  const turno = useRef(false);
  useEffect(() => {
    if (anterior.current === valor) return;
    anterior.current = valor;
    turno.current = !turno.current;
    setNombre(turno.current ? a : b);
  }, [valor, a, b]);
  return nombre;
}

export function FilaOpcion({
  icono,
  tipoVisual = 'muestra',
  modo = 'toggle',
  nombre,
  estado,
  on,
  disabled,
  atenuada,
  title,
  onClick,
  onEnter,
  onLeave,
}: {
  icono?: ReactNode;
  /**
   * 'icono' invierte el dibujo a blanco cuando la fila queda elegida — funciona
   * con iconos monocromos. 'muestra' solo lo agranda y le pone un anillo, que
   * es lo que hay que hacerle a un render o a una paleta: invertir un color de
   * interior lo convertiría en otro color.
   */
  tipoVisual?: 'icono' | 'muestra';
  /**
   * Sin efecto sobre el gesto — el comportamiento es el mismo en toda tabla: el
   * "+" gira hasta volverse "×", y esa "×" es el único punto que deshace la
   * elección. Tocar el resto de la fila ya no la borra, porque un roce
   * accidental deshacía una decisión sin avisar.
   */
  modo?: 'toggle' | 'unico';
  nombre: string;
  estado?: string;
  on: boolean;
  disabled?: boolean;
  /** Baja la opacidad sin apagar la fila: "se puede, pero no ahorita". */
  atenuada?: boolean;
  title?: string;
  onClick: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  const marca = tipoVisual === 'icono' ? { 'data-zone-icon': on ? '1' : '0' } : { 'data-zone-swatch': on ? '1' : '0' };
  const quitable = on && !disabled;
  const elegible = !on && !disabled;
  return (
    <div
      data-opt-row
      aria-disabled={disabled || undefined}
      title={title}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ opacity: atenuada ? 0.55 : 1, cursor: elegible ? 'pointer' : 'default' }}
    >
      {/* Elegir: cubre la fila entera, y solo existe mientras NO esté elegida.
          `aria-disabled` en vez de `disabled` porque un botón deshabilitado no
          emite eventos de ratón en Chrome, y la tarjeta de detalle nunca
          mostraría qué es la zona que no cabe — justo lo que hay que poder leer
          para decidir si vale la pena hacerle espacio. */}
      {on ? null : (
        <button
          type="button"
          aria-disabled={disabled || undefined}
          aria-label={`Agregar ${nombre}`}
          onClick={() => { if (!disabled) onClick(); }}
          onFocus={onEnter}
          onBlur={onLeave}
          style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'transparent', border: 0, padding: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
      )}

      {icono ? (
        <span
          {...marca}
          style={{ width: '40px', height: '40px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 3 }}
        >
          {icono}
        </span>
      ) : null}
      <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: '12.5px' }}>{nombre}</span>
      {estado ? (
        <span style={{ flex: 'none', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9.5px', color: '#8A8F91', textTransform: 'uppercase' }}>{estado}</span>
      ) : null}
      {/* La franja solo se ofrece si la fila se puede tocar: prometer un "+"
          que no va a pasar nada es peor que no ofrecerlo. */}
      <span data-zone-strip="" data-on={on ? '1' : '0'} data-toggle={disabled ? '0' : '1'}>
        {/* Siempre el mismo signo. Al quedar elegida gira 45° y el "+" se lee
            como "×" — la transición del giro vive en `globals.css`. */}
        <span data-zone-glyph="" style={{ '--r': on ? '45deg' : '0deg' } as CSSProperties}>+</span>
        {/* Quitar: el único camino para deshacer. Es su propio blanco de 54 px
            justo sobre la "×", no la fila entera. */}
        {quitable ? (
          <button
            type="button"
            aria-label={`Quitar ${nombre}`}
            title={`Quitar ${nombre}`}
            onClick={onClick}
            onFocus={onEnter}
            onBlur={onLeave}
            style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '54px', height: '54px', maxHeight: '100%', borderRadius: '50%', zIndex: 4, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
          />
        ) : null}
      </span>
    </div>
  );
}

/**
 * Columna derecha de "lo que llevas elegido". Cuando cambia la elección, una
 * franja carmín barre la tarjeta y detrás queda el dato nuevo — es el acuse de
 * recibo del prototipo.
 */
export function PanelElegido({
  titulo,
  vacio,
  clave,
  children,
}: {
  titulo: string;
  /** Qué decir cuando todavía no hay nada elegido. */
  vacio: string;
  /** Cambiar este valor dispara el barrido. */
  clave: string | null;
  children?: ReactNode;
}) {
  const sweep = useAnimacionAlterna(clave, 'fxSweepA', 'fxSweepB');
  const texto = useAnimacionAlterna(clave, 'fxTextA', 'fxTextB');

  return (
    <div className="lgp-panel-elegido" style={{ width: '230px', flex: 'none', borderLeft: '1px solid #E4E1DD', paddingLeft: '20px', alignSelf: 'stretch' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#A9ADAF', textTransform: 'uppercase', marginBottom: '10px' }}>{titulo}</div>
      {clave ? (
        <div style={{ position: 'relative', overflow: 'hidden', background: '#fff', border: '1px solid #EAE7E3', padding: '12px 14px' }}>
          {sweep ? <span className="lgp-sweep" style={{ position: 'absolute', inset: 0, background: '#F2004B', animation: `${sweep} .75s cubic-bezier(.65,0,.35,1) both` }} /> : null}
          <div className="lgp-sweep-texto" style={{ position: 'relative', animation: texto ? `${texto} .75s ease both` : undefined }}>
            {children}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: '#A9ADAF', lineHeight: 1.5 }}>{vacio}</div>
      )}
    </div>
  );
}

/** Cifra de ft² que entra rebotando, con su regla debajo. */
export function CifraFt2({ etiqueta, valor, color, clave }: { etiqueta: string; valor: string; color: string; clave: string | null }) {
  const entra = useAnimacionAlterna(clave, 'ftInA', 'ftInB');
  const numero = useAnimacionAlterna(clave, 'ftNumA', 'ftNumB');
  const regla = useAnimacionAlterna(clave, 'ftRuleA', 'ftRuleB');
  return (
    <div className="lgp-paso-anim" style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', animation: entra ? `${entra} .35s ease both` : undefined }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#A9ADAF', textTransform: 'uppercase' }}>{etiqueta}</span>
        <span style={{ display: 'inline-block', fontWeight: 800, fontSize: '15px', letterSpacing: '-0.01em', color, animation: numero ? `${numero} .45s cubic-bezier(.22,1,.36,1) both` : undefined }}>{valor}</span>
      </div>
      <span style={{ display: 'block', height: '2px', background: color, transformOrigin: 'left center', animation: regla ? `${regla} .45s cubic-bezier(.22,1,.36,1) both` : undefined }} />
    </div>
  );
}
