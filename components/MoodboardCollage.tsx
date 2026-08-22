'use client';

import FloorplanDiagram from '@/components/FloorplanDiagram';
import type { PlanDiagramKey } from '@/components/FloorplanDiagram';
import { ModuloIcon } from '@/components/ConfigIcons';
import { PHOTO_BY_MODULE } from '@/lib/modulePhotos';

export type ModuloRef = {
  iconKey: string;
  nombre: string;
  razon: string | null;
};

export type InteriorRef = {
  nombre: string;
  c1: string;
  c2: string;
  c3: string;
} | null;

function ZoneCard({ modulo, tilt, compact }: { modulo: ModuloRef; tilt: number; compact?: boolean }) {
  const photo = PHOTO_BY_MODULE[modulo.iconKey];
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #EAE7E3',
        boxShadow: compact ? '0 10px 18px rgba(28,30,31,0.12)' : '0 14px 26px rgba(28,30,31,0.12)',
        padding: compact ? '6px 6px 8px' : '10px 10px 12px',
        transform: `rotate(${tilt}deg)`,
        width: '100%',
        maxWidth: compact ? '130px' : '220px',
      }}
    >
      <div style={{ width: '100%', aspectRatio: '4/3', background: '#F7F5F2', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={modulo.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <ModuloIcon moduleKey={modulo.iconKey} size={compact ? 22 : 34} color="#B7BABB" />
        )}
      </div>
      <div style={{ marginTop: compact ? '6px' : '9px', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: compact ? '8px' : '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
        minWidth: '10px',
        height: 0,
        borderTop: '1px dashed #C9CBCC',
        marginTop: '24px',
        transform: side === 'left' ? 'rotate(3deg)' : 'rotate(-3deg)',
      }}
    />
  );
}

export default function MoodboardCollage({
  planKey,
  planNombre,
  interior,
  modulosSeleccionados,
  compact = false,
}: {
  planKey: PlanDiagramKey | null;
  planNombre: string;
  interior: InteriorRef;
  modulosSeleccionados: ModuloRef[];
  compact?: boolean;
}) {
  const shown = modulosSeleccionados.slice(0, 4);
  const extra = modulosSeleccionados.length - shown.length;
  const left = shown.slice(0, 2);
  const right = shown.slice(2, 4);
  const colWidth = compact ? '130px' : '220px';

  return (
    <div>
      <div
        className="lgp-moodboard-grid"
        style={{ display: 'grid', gridTemplateColumns: `${colWidth} 1fr ${colWidth}`, alignItems: 'center', gap: '4px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '12px' : '20px', alignItems: 'center' }}>
          {left.map((m, i) => (
            <div key={m.iconKey} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <ZoneCard modulo={m} tilt={i % 2 === 0 ? -3 : 2} compact={compact} />
              <Connector side="left" />
            </div>
          ))}
        </div>

        <div>
          <div style={{ border: '1px solid #EAE7E3', background: '#fff', padding: compact ? '10px 10px 4px' : '18px 18px 10px' }}>
            <FloorplanDiagram planKey={planKey ?? 'B'} />
          </div>
          <p style={{ margin: '10px 0 0', textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#5C6163', textTransform: 'uppercase' }}>
            {planNombre}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '12px' : '20px', alignItems: 'center' }}>
          {right.map((m, i) => (
            <div key={m.iconKey} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Connector side="right" />
              <ZoneCard modulo={m} tilt={i % 2 === 0 ? 3 : -2} compact={compact} />
            </div>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p style={{ margin: '14px 0 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#6E7375', textTransform: 'uppercase', textAlign: 'center' }}>
          Aún no agregas zonas — elige algunas para verlas aquí.
        </p>
      ) : null}
      {extra > 0 ? (
        <p style={{ margin: '10px 0 0', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#6E7375', textTransform: 'uppercase', textAlign: 'center' }}>
          +{extra} zona{extra > 1 ? 's' : ''} más en tu resumen
        </p>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'center', gap: compact ? '10px' : '14px', marginTop: compact ? '18px' : '26px' }}>
        {interior ? (
          [interior.c1, interior.c2, interior.c3].map((c, i) => (
            <div key={i} style={{ width: compact ? '30px' : '52px', height: compact ? '30px' : '52px', borderRadius: '50%', background: c, border: '1px solid rgba(28,30,31,0.08)' }} />
          ))
        ) : (
          <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: '#6E7375', textTransform: 'uppercase' }}>Sin paleta elegida</p>
        )}
      </div>
    </div>
  );
}
