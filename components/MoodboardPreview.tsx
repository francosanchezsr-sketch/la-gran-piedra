'use client';

import MoodboardCollage, { type InteriorRef, type ModuloRef } from '@/components/MoodboardCollage';

type ResumenRow = { k: string; v: string };

export default function MoodboardPreview({
  open,
  onClose,
  planKey,
  planNombre,
  interior,
  modulosSeleccionados,
  brief,
  resumen,
}: {
  open: boolean;
  onClose: () => void;
  planKey: 'A' | 'B' | 'C' | null;
  planNombre: string;
  interior: InteriorRef;
  modulosSeleccionados: ModuloRef[];
  brief: string;
  resumen: ResumenRow[];
}) {
  if (!open) return null;

  return (
    <div
      data-nofx="1"
      style={{
        position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '22px', background: 'rgba(28,30,31,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        animation: 'lgpIn .22s ease both', overflowY: 'auto',
      }}
    >
      <div style={{ width: 'min(920px,100%)', maxHeight: '92vh', overflowY: 'auto', background: '#FBFBFA', border: '1px solid #EAE7E3', boxShadow: '0 28px 80px rgba(28,30,31,0.28)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '26px 26px 0' }}>
          <div>
            <p style={{ margin: '0 0 6px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: '22px', letterSpacing: '-0.01em' }}>
              EL <em style={{ fontStyle: 'italic' }}>PLANO</em>
            </p>
            <p style={{ margin: 0, maxWidth: '520px', fontSize: '13px', lineHeight: 1.6, color: '#8A8F91' }}>
              {brief ? brief : 'Aún no escribiste tu brief en el paso 4 — esto es un resumen visual de lo que llevas elegido.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="lgp-hover-zoom"
            style={{ flex: 'none', padding: '10px 16px', background: '#1C1E1F', border: 0, color: '#FBFBFA', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Cerrar ✕
          </button>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <MoodboardCollage
            planKey={planKey}
            planNombre={planNombre}
            interior={interior}
            modulosSeleccionados={modulosSeleccionados}
          />
        </div>

        <div style={{ margin: '26px 0 0', borderTop: '1px solid #EAE7E3' }}>
          <p style={{ margin: 0, padding: '18px 26px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.16em', color: '#A9ADAF', textTransform: 'uppercase' }}>Tu progreso</p>
          <div style={{ padding: '10px 26px 26px' }}>
            {resumen.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F4F1ED' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#A9ADAF', textTransform: 'uppercase', flex: 'none' }}>{r.k}</span>
                <span style={{ fontSize: '13px', lineHeight: 1.5, textAlign: 'right', color: '#1C1E1F' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
