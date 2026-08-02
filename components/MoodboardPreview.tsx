'use client';

import FloorplanDiagram from '@/components/FloorplanDiagram';
import { ModuloIcon } from '@/components/ConfigIcons';
import { PHOTO_BY_MODULE } from '@/lib/modulePhotos';

type ModuloRef = {
  iconKey: string;
  nombre: string;
  razon: string | null;
};

type InteriorRef = {
  nombre: string;
  c1: string;
  c2: string;
  c3: string;
} | null;

type ResumenRow = { k: string; v: string };

function ZoneCard({ modulo, tilt }: { modulo: ModuloRef; tilt: number }) {
  const photo = PHOTO_BY_MODULE[modulo.iconKey];
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE7E3',
        boxShadow: '0 14px 26px rgba(28,30,31,0.12)',
        padding: '10px 10px 12px',
        transform: `rotate(${tilt}deg)`,
        width: '100%',
        maxWidth: '220px',
      }}
    >
      <div style={{ width: '100%', aspectRatio: '4/3', background: '#F7F5F2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={modulo.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <ModuloIcon moduleKey={modulo.iconKey} size={34} color="#B7BABB" />
        )}
      </div>
      <div style={{ marginTop: '9px', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {modulo.nombre}
      </div>
    </div>
  );
}

function Connector({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        minWidth: '18px',
        height: 0,
        borderTop: '1px dashed #C9CBCC',
        marginTop: '30px',
        transform: side === 'left' ? 'rotate(3deg)' : 'rotate(-3deg)',
      }}
    />
  );
}

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

  const shown = modulosSeleccionados.slice(0, 4);
  const extra = modulosSeleccionados.length - shown.length;
  const left = shown.slice(0, 2);
  const right = shown.slice(2, 4);

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

        <div className="lgp-moodboard-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr 220px', alignItems: 'center', gap: '4px', padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            {left.map((m, i) => (
              <div key={m.iconKey} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <ZoneCard modulo={m} tilt={i % 2 === 0 ? -3 : 2} />
                <Connector side="left" />
              </div>
            ))}
          </div>

          <div>
            <div style={{ border: '1px solid #EAE7E3', background: '#fff', padding: '18px 18px 10px' }}>
              <FloorplanDiagram planKey={planKey ?? 'A'} />
            </div>
            <p style={{ margin: '10px 0 0', textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#8A8F91', textTransform: 'uppercase' }}>
              {planNombre}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            {right.map((m, i) => (
              <div key={m.iconKey} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Connector side="right" />
                <ZoneCard modulo={m} tilt={i % 2 === 0 ? 3 : -2} />
              </div>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <p style={{ margin: '18px 20px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#B7BABB', textTransform: 'uppercase', textAlign: 'center' }}>
            Aún no agregas módulos en el paso 5 — vuelve y elige algunos para verlos aquí.
          </p>
        ) : null}
        {extra > 0 ? (
          <p style={{ margin: '10px 20px 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#B7BABB', textTransform: 'uppercase', textAlign: 'center' }}>
            +{extra} módulo{extra > 1 ? 's' : ''} más en tu resumen
          </p>
        ) : null}

        <div style={{ padding: '30px 26px 0' }}>
          <p style={{ margin: '0 0 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.16em', color: '#A9ADAF', textTransform: 'uppercase' }}>Gama cromática</p>
          <div style={{ display: 'flex', gap: '14px' }}>
            {interior ? (
              [interior.c1, interior.c2, interior.c3].map((c, i) => (
                <div key={i} style={{ width: '52px', height: '52px', borderRadius: '999px', background: c, border: '1px solid rgba(28,30,31,0.08)' }} />
              ))
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: '#B7BABB' }}>Sin elegir todavía (paso 4)</p>
            )}
          </div>
          {interior ? (
            <p style={{ margin: '10px 0 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#8A8F91', textTransform: 'uppercase' }}>{interior.nombre}</p>
          ) : null}
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
