'use client';

import { Fragment } from 'react';

export type SegmentoPresupuesto = {
  key: string;
  label: string;
  ft2: number;
  color: string;
};

/**
 * Barra de presupuesto de área habitable, estilo barra de vida: el ancho total
 * es el máximo que permite el lote y cada segmento es lo que ya se comprometió.
 * Se muestra del paso 2 al 5 para que el usuario nunca pierda de vista cuánto
 * le queda mientras configura.
 */
export default function PresupuestoBar({
  max,
  segmentos,
  sinLote = false,
}: {
  max: number;
  segmentos: SegmentoPresupuesto[];
  sinLote?: boolean;
}) {
  const usados = segmentos.reduce((s, x) => s + x.ft2, 0);
  const libres = Math.max(0, max - usados);
  const pct = (n: number) => (max > 0 ? (n / max) * 100 : 0);
  // Sobregiro: no debería pasar porque cada control valida antes, pero si
  // pasara hay que verlo, no esconderlo.
  const excedido = usados > max;

  if (sinLote) {
    return (
      <div style={{ padding: '14px 16px', background: '#F7F5F2', border: '1px solid #EAE7E3' }}>
        <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#A9ADAF', textTransform: 'uppercase' }}>
          Presupuesto SFT — elige un lote en el paso 1 para activarlo
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px 16px', background: '#fff', border: '1px solid #EAE7E3' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', color: '#A9ADAF', textTransform: 'uppercase' }}>
          Presupuesto SFT
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '19px', letterSpacing: '-0.01em', color: excedido ? '#F2004B' : '#1C1E1F' }}>
            {libres.toLocaleString('es-MX')}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: '#8A8F91', textTransform: 'uppercase' }}>
            ft² habitables libres de {max.toLocaleString('es-MX')}
          </span>
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(usados, max)}
        aria-label="Área habitable comprometida"
        style={{ position: 'relative', display: 'flex', height: '16px', background: '#F0EDE9', border: '1px solid #E4E1DD', overflow: 'hidden' }}
      >
        {segmentos.filter((s) => s.ft2 > 0).map((s) => (
    <Fragment key={s.key}>
          <span
            title={`${s.label}: ${s.ft2.toLocaleString('es-MX')} ft²`}
            style={{ width: pct(s.ft2) + '%', background: s.color, borderRight: '1px solid rgba(255,255,255,0.55)', transition: 'width .25s cubic-bezier(.22,.61,.36,1)' }}
          />
    </Fragment>
    ))}
        {/* muescas tipo barra de vida, cada 25% */}
        <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(28,30,31,0.16) calc(25% - 1px) 25%)' }} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '10px' }}>
        {segmentos.filter((s) => s.ft2 > 0).map((s) => (
    <Fragment key={s.key}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', color: '#8A8F91', textTransform: 'uppercase' }}>
            <span style={{ width: '8px', height: '8px', background: s.color, display: 'block', flex: 'none' }} />
            {s.label} {s.ft2.toLocaleString('es-MX')}
          </span>
    </Fragment>
    ))}
        {libres > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', color: '#8A8F91', textTransform: 'uppercase' }}>
            <span style={{ width: '8px', height: '8px', background: '#F0EDE9', border: '1px solid #E4E1DD', display: 'block', flex: 'none' }} />
            Libre {libres.toLocaleString('es-MX')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
