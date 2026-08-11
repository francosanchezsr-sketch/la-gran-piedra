'use client';

import { useState, type ReactNode } from 'react';
import { FilaOpcion, PanelElegido } from '@/components/DecisionUI';

export type OpcionDecision = {
  key: string;
  nombre: string;
  descripcion?: string;
  meta?: string;
  /** Imagen del render; si no hay, se usa `visual`. */
  imagen?: string;
  /** Alternativa a `imagen`: un SVG o cualquier nodo. */
  visual?: ReactNode;
  /** Miniatura de la fila. Sin ella se cae a `imagen` y luego a la sigla. */
  miniatura?: ReactNode;
  /** Iniciales para la fila cuando no hay imagen ni miniatura. */
  sigla?: string;
  /** Cómo reacciona la miniatura al quedar elegida. Ver `FilaOpcion`. */
  visualTipo?: 'icono' | 'muestra';
  on: boolean;
  fija?: boolean;
  etiqueta?: string;
  onSelect: () => void;
};

/**
 * Esqueleto de los pasos de elección, calcado del prototipo de Claude Design:
 * una tarjeta de detalle arriba, la columna de "lo que llevas elegido" a la
 * derecha, y abajo la lista donde cada fila se elige sola — la franja carmín
 * entra por la derecha al pasar el cursor y cubre la fila al elegirla.
 *
 * La tarjeta muestra la opción sobre la que está el cursor; si no hay ninguna,
 * la elegida. Así se puede curiosear la lista sin cambiar nada.
 */
export default function PasoDecision({
  opciones,
  etiquetaOtras,
  tituloPanel,
  vacioPanel,
  accionPrimaria,
  accionSecundaria,
  onSecundaria,
  carrusel,
  exclusivo,
  nota,
}: {
  opciones: OpcionDecision[];
  etiquetaOtras: string;
  tituloPanel: string;
  vacioPanel: string;
  /** Texto del botón de elegir; solo se usa en modo carrusel. */
  accionPrimaria?: string;
  accionSecundaria?: string;
  onSecundaria?: () => void;
  /**
   * Modo carrusel: se pasa de una opción a otra con las flechas y se elige la
   * que está a la vista. Es para cuando lo que decide es la imagen grande —un
   * plano se compara viéndolo, no leyendo su nombre en una lista.
   */
  carrusel?: boolean;
  /**
   * De esta lista solo cabe una. Mientras haya algo elegido, el resto de las
   * filas queda bloqueado: para cambiar hay que quitar la actual con su "×" y
   * entonces elegir otra. Es lo que hace visible que la elección es única — con
   * el cambio directo, el cliente nunca se entera de que solo puede llevar una.
   */
  exclusivo?: boolean;
  nota?: ReactNode;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  if (!opciones.length) return null;

  const elegida = opciones.find((o) => o.on) ?? null;
  const iSeguro = Math.min(Math.max(idx, 0), opciones.length - 1);
  const foco = carrusel
    ? (opciones[iSeguro] ?? opciones[0])
    : (opciones.find((o) => o.key === hover) ?? elegida ?? opciones[0]);
  const mover = (paso: number) => setIdx((i) => (i + paso + opciones.length) % opciones.length);

  // La miniatura va sin caja: el `invert()` de la fila elegida se aplica sobre
  // lo que haya dentro, y un marco blanco se volvería un marco negro.
  const mini = (o: OpcionDecision) =>
    o.miniatura ?? (o.imagen ? (
      <img src={o.imagen} alt="" aria-hidden="true" loading="lazy" style={{ width: '36px', height: '36px', objectFit: 'cover', display: 'block', border: '1px solid #EAE7E3' }} />
    ) : (
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: '#8A8F91' }}>{o.sigla ?? o.nombre.slice(0, 2).toUpperCase()}</span>
    ));

  const flecha = (dir: -1 | 1, etiqueta: string, glifo: string) => (
    <button
      onClick={() => mover(dir)}
      aria-label={etiqueta}
      className="lgp-flecha"
      style={{ width: '38px', height: '38px', flex: 'none', borderRadius: '50%', border: '1px solid #DDD9D4', background: '#fff', cursor: 'pointer', fontSize: '17px', color: '#505759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {glifo}
    </button>
  );

  // En carrusel el visor tiene alto fijo, como en el prototipo: si cada plano
  // define su propio alto, pasar de uno a otro da un brinco de layout.
  const visualFoco = (
    <div
      className="lgp-decision-visual"
      style={
        carrusel
          ? { flex: 1, minWidth: 0, height: '420px', background: '#fff', border: '1px solid #EAE7E3', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }
          : { width: '230px', flex: 'none', background: '#fff', border: '1px solid #EAE7E3', overflow: 'hidden' }
      }
    >
      {foco.imagen ? (
        <img
          src={foco.imagen}
          alt={`Vista de ${foco.nombre}`}
          loading="lazy"
          style={carrusel ? { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' } : { width: '100%', height: 'auto', display: 'block' }}
        />
      ) : (
        foco.visual
      )}
    </div>
  );

  return (
    <div>
      {/* El carrusel va arriba, a todo lo ancho: el plano se decide viéndolo. */}
      {carrusel ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          {opciones.length > 1 ? flecha(-1, 'Plano anterior', '‹') : null}
          {visualFoco}
          {opciones.length > 1 ? flecha(1, 'Plano siguiente', '›') : null}
        </div>
      ) : null}

      <div className="lgp-decision-foco" style={{ border: '1px solid #EAE7E3', background: '#F7F5F2', padding: '26px', display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
        {carrusel ? null : visualFoco}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: '#1C1E1F' }}>{foco.nombre}</span>
            {foco.etiqueta ? (
              <span style={{ padding: '3px 7px', background: '#1C1E1F', color: '#FBFBFA', fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', letterSpacing: '0.1em' }}>{foco.etiqueta}</span>
            ) : null}
          </div>
          {foco.descripcion ? (
            <p style={{ margin: '0 0 12px', maxWidth: '46ch', fontSize: '13px', lineHeight: 1.6, color: '#505759' }}>{foco.descripcion}</p>
          ) : null}
          {foco.meta ? (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: '#8A8F91', textTransform: 'uppercase' }}>{foco.meta}</div>
          ) : null}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            {/* En carrusel no hay filas donde elegir, así que el botón va aquí. */}
            {carrusel && !foco.fija ? (
              foco.on ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 12px', border: '1px solid #EAE7E3', background: '#fff' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#F2004B', color: '#fff', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#8A8F91', textTransform: 'uppercase' }}>Plano elegido</span>
                </span>
              ) : (
                <button onClick={foco.onSelect} className="lgp-hover-zoom" style={{ padding: '10px 16px', background: '#F2004B', border: 0, color: '#fff', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  {accionPrimaria ?? 'Elegir'}
                </button>
              )
            ) : null}
            {accionSecundaria && onSecundaria ? (
              <button onClick={onSecundaria} className="lgp-hover-zoom" style={{ padding: '9px 14px', background: '#fff', border: '1px solid #DDD9D4', color: '#505759', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {accionSecundaria}
              </button>
            ) : null}
          </div>
        </div>

        <PanelElegido titulo={tituloPanel} vacio={vacioPanel} clave={elegida ? elegida.key : null}>
          <div style={{ fontWeight: 800, fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#1C1E1F', marginBottom: '4px' }}>{elegida?.nombre}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', color: '#8A8F91', textTransform: 'uppercase' }}>{elegida?.meta ?? 'Sin costo extra'}</div>
        </PanelElegido>
      </div>

      {carrusel ? null : (
    <>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#A9ADAF', textTransform: 'uppercase', marginBottom: '8px' }}>{etiquetaOtras}</div>
      {/* Con la elección hecha, decir por qué el resto ya no responde: un
          renglón apagado sin explicación se lee como que la página falla. */}
      {exclusivo && elegida ? (
        <p style={{ margin: '0 0 8px', maxWidth: '520px', fontSize: '12.5px', lineHeight: 1.55, color: '#8A8F91' }}>
          Solo puedes llevar una. Para cambiarla, quita <strong style={{ fontWeight: 600, color: '#1C1E1F' }}>{elegida.nombre}</strong> con su ✕ y elige otra.
        </p>
      ) : null}
      <div className="lgp-decision-lista" style={{ border: '1px solid #EAE7E3', maxWidth: '520px' }}>
        {opciones.map((o) => {
          // En una lista exclusiva, con algo elegido las demás no se pueden
          // tomar: primero se suelta la actual. Así el gesto de quitar deja de
          // ser decorativo y se vuelve el camino real para cambiar de opinión.
          const bloqueadaPorOtra = Boolean(exclusivo && elegida && !o.on);
          return (
          <FilaOpcion
            key={o.key}
            icono={mini(o)}
            tipoVisual={o.visualTipo ?? 'muestra'}
            nombre={o.nombre}
            estado={o.on ? (o.fija ? 'Incluido' : 'Elegido') : o.fija ? 'Incluido' : ''}
            on={o.on}
            disabled={o.fija || bloqueadaPorOtra}
            atenuada={bloqueadaPorOtra}
            title={bloqueadaPorOtra && elegida ? `Primero quita ${elegida.nombre} con su ✕` : undefined}
            onClick={o.onSelect}
            onEnter={() => setHover(o.key)}
            onLeave={() => setHover(null)}
          />
          );
        })}
      </div>
    </>
      )}

      {nota ? <div style={{ marginTop: '16px' }}>{nota}</div> : null}
    </div>
  );
}
