'use client';

type PlatLot = { num: number; x: number; y: number; w: number; h: number };

type OurLot = {
  id: string;
  x: number; y: number; w: number; h: number;
  fill: string; stroke: string; textFill: string;
  onClick: () => void;
};

export default function SubdivisionOverview({
  open,
  onClose,
  nombre,
  zona,
  direccion,
  totalLotes,
  plat,
  ourLotes,
}: {
  open: boolean;
  onClose: () => void;
  nombre: string;
  zona: string;
  direccion: string;
  totalLotes: number;
  plat: readonly PlatLot[];
  ourLotes: readonly OurLot[];
}) {
  if (!open) return null;

  const ourByNum = new Map(ourLotes.map((l) => [Number(l.id.replace('L-', '')), l]));

  return (
    <div
      data-nofx="1"
      style={{
        position: 'fixed', inset: 0, zIndex: 96, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '22px', background: 'rgba(28,30,31,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        animation: 'lgpIn .22s ease both', overflowY: 'auto',
      }}
    >
      <div style={{ width: 'min(960px,100%)', maxHeight: '92vh', overflowY: 'auto', background: '#FBFBFA', border: '1px solid #EAE7E3', boxShadow: '0 28px 80px rgba(28,30,31,0.28)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', padding: '26px 26px 0' }}>
          <div>
            <p style={{ margin: '0 0 6px', fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.01em', textTransform: 'uppercase' }}>{nombre}</p>
            <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.08em', color: '#8A8F91', textTransform: 'uppercase' }}>{zona} · {direccion}</p>
            <p style={{ margin: '8px 0 0', maxWidth: '520px', fontSize: '13px', lineHeight: 1.6, color: '#8A8F91' }}>
              Mapa de orientación de los {totalLotes} lotes de la subdivisión. Solo los lotes en rosa son parte de nuestro catálogo actual — el resto se muestra únicamente como referencia.
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

        <div style={{ padding: '20px 26px 0' }}>
          <svg viewBox="0 0 930 850" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {plat.map((p) => {
              const ours = ourByNum.get(p.num);
              if (ours) {
                return (
                  <g key={p.num} onClick={() => { ours.onClick(); onClose(); }} style={{ cursor: 'pointer' }}>
                    <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={ours.fill} stroke={ours.stroke} strokeWidth={2} />
                    <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 4} textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize={11} fontWeight={800} fill={ours.textFill}>{p.num}</text>
                  </g>
                );
              }
              return (
                <g key={p.num}>
                  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="#F4F1ED" stroke="#DEDFDF" strokeWidth={1} />
                  <text x={p.x + p.w / 2} y={p.y + p.h / 2 + 3} textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize={9} fill="#B7BABB">{p.num}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', padding: '16px 26px 26px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#8A8F91', textTransform: 'uppercase' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><span style={{ width: '9px', height: '9px', background: '#F2004B', display: 'block' }}></span>Nuestro catálogo</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><span style={{ width: '9px', height: '9px', background: '#F4F1ED', border: '1px solid #DEDFDF', display: 'block' }}></span>Fuera de catálogo (referencia)</span>
        </div>
      </div>
    </div>
  );
}
