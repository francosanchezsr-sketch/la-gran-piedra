'use client';

import { Fragment, type ReactNode } from 'react';

export type OpcionDecision = {
  key: string;
  nombre: string;
  descripcion?: string;
  meta?: string;
  /** Imagen del render; si no hay, se usa `visual`. */
  imagen?: string;
  /** Alternativa a `imagen`: un SVG o cualquier nodo. */
  visual?: ReactNode;
  /** Miniatura de la fila compacta. Sin ella se cae a `imagen` y luego a la sigla. */
  miniatura?: ReactNode;
  /** Iniciales para la fila compacta cuando no hay imagen ni miniatura. */
  sigla?: string;
  on: boolean;
  fija?: boolean;
  etiqueta?: string;
  onSelect: () => void;
};

/**
 * Esqueleto común de los pasos de elección: una tarjeta enfocada con la opción
 * actual y el resto como filas compactas. Es el patrón del mockup — cambiar de
 * paso no debe sentirse como entrar a otra pantalla, y no hay que comparar seis
 * tarjetas a la vez para tomar una decisión.
 */
export default function PasoDecision({
  opciones,
  etiquetaOtras,
  accionPrimaria,
  accionSecundaria,
  onSecundaria,
  nota,
}: {
  opciones: OpcionDecision[];
  etiquetaOtras: string;
  accionPrimaria: string;
  accionSecundaria?: string;
  onSecundaria?: () => void;
  nota?: ReactNode;
}) {
  if (!opciones.length) return null;
  // La enfocada es la elegida; si no hay ninguna, la primera.
  const foco = opciones.find((o) => o.on) ?? opciones[0];
  const otras = opciones.filter((o) => o.key !== foco.key);

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid ' + (foco.on ? '#F2004B' : '#EAE7E3'), boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div className="lgp-decision-foco" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 300px) 1fr', gap: '22px', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#FBFBFA', border: '1px solid #F0EDE9', overflow: 'hidden' }}>
            {foco.imagen ? (
              <img src={foco.imagen} alt={`Vista de ${foco.nombre}`} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
            ) : (
              foco.visual
            )}
          </div>

          <div>
            <p style={{ display: 'flex', alignItems: 'center', gap: '9px', margin: '0 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '17px', letterSpacing: '-0.005em' }}>
              {foco.nombre}
              {foco.etiqueta ? (
                <span style={{ padding: '3px 7px', background: '#1C1E1F', color: '#FBFBFA', fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', fontWeight: 400, letterSpacing: '0.1em' }}>{foco.etiqueta}</span>
              ) : null}
            </p>
            {foco.descripcion ? (
              <p style={{ margin: '0 0 10px', maxWidth: '46ch', fontSize: '13.5px', lineHeight: 1.6, color: '#8A8F91' }}>{foco.descripcion}</p>
            ) : null}
            {foco.meta ? (
              <p style={{ margin: '0 0 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.06em', color: '#505759', textTransform: 'uppercase' }}>{foco.meta}</p>
            ) : null}

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {foco.fija ? (
                <span style={{ padding: '13px 20px', background: '#F7F5F2', border: '1px solid #EAE7E3', color: '#8A8F91', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                  Incluido en tu lote
                </span>
              ) : (
                <button onClick={foco.onSelect} className="lgp-hover-zoom" style={{ padding: '13px 20px', background: foco.on ? '#F7F5F2' : '#F2004B', border: foco.on ? '1px solid #EAE7E3' : 0, color: foco.on ? '#8A8F91' : '#fff', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: foco.on ? 'default' : 'pointer' }}>
                  {foco.on ? '✓ Elegido' : accionPrimaria}
                </button>
              )}
              {accionSecundaria && onSecundaria ? (
                <button onClick={onSecundaria} className="lgp-hover-zoom" style={{ padding: '13px 20px', background: 'transparent', border: '1px solid #DDD9D4', color: '#505759', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  {accionSecundaria}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {otras.length ? (
          <div style={{ padding: '4px 20px 18px', borderTop: '1px solid #F0EDE9' }}>
            <p style={{ margin: '14px 0 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', color: '#A9ADAF', textTransform: 'uppercase' }}>{etiquetaOtras}</p>
            {otras.map((o) => (
    <Fragment key={o.key}>
              <button onClick={o.onSelect} disabled={o.fija} className="lgp-hover-zoom" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 12px', marginBottom: '6px', background: '#FBFBFA', border: '1px solid #F0EDE9', textAlign: 'left', cursor: o.fija ? 'default' : 'pointer' }}>
                <span style={{ width: '34px', height: '34px', flex: 'none', borderRadius: '6px', overflow: 'hidden', background: '#fff', border: '1px solid #EAE7E3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {o.miniatura ? (
                    o.miniatura
                  ) : o.imagen ? (
                    <img src={o.imagen} alt="" aria-hidden="true" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', fontWeight: 700, color: '#8A8F91' }}>{o.sigla ?? o.nombre.slice(0, 2).toUpperCase()}</span>
                  )}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: '13.5px' }}>{o.nombre}</span>
                  {o.meta ? (
                    <span style={{ display: 'block', marginTop: '2px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.06em', color: '#B7BABB', textTransform: 'uppercase' }}>{o.meta}</span>
                  ) : null}
                </span>
                {o.etiqueta ? (
                  <span style={{ flex: 'none', fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', letterSpacing: '0.1em', color: '#8A8F91' }}>{o.etiqueta}</span>
                ) : null}
              </button>
    </Fragment>
    ))}
          </div>
        ) : null}
      </div>

      {nota ? <div style={{ marginTop: '16px' }}>{nota}</div> : null}
    </div>
  );
}
