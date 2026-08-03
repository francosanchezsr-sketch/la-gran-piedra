'use client';

type PlatLot =
  | { num: number; kind: 'rect'; x: number; y: number; w: number; h: number; rot?: number }
  | { num: number; kind: 'wedge'; d: string; lx: number; ly: number };

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
          <svg viewBox="0 0 600 1181" style={{ width: '100%', height: 'auto', maxHeight: '64vh', display: 'block', margin: '0 auto' }}>
            {/* Calles privadas y bulbos de retorno (R50'), de contexto — el trazo de cada lote va encima */}
            <rect x={140} y={165} width={35} height={890} fill="#EDEEEE" />
            <rect x={355} y={165} width={35} height={890} fill="#EDEEEE" />
            <rect x={255} y={198} width={24} height={857} fill="#E4E6E5" />
            <circle cx={215} cy={165} r={50} fill="#EDEEEE" />
            <circle cx={319} cy={165} r={50} fill="#EDEEEE" />

            {plat.map((p) => {
              const ours = ourByNum.get(p.num);
              const fill = ours ? ours.fill : '#F4F1ED';
              const stroke = ours ? ours.stroke : '#DEDFDF';
              const textFill = ours ? ours.textFill : '#B7BABB';
              const onClick = ours ? () => { ours.onClick(); onClose(); } : undefined;

              if (p.kind === 'wedge') {
                return (
                  <g key={p.num} onClick={onClick} style={ours ? { cursor: 'pointer' } : undefined}>
                    <path d={p.d} fill={fill} stroke={stroke} strokeWidth={ours ? 2 : 1} />
                    <text x={p.lx} y={p.ly + (ours ? 4 : 3)} textAnchor="middle" fontFamily={ours ? 'Archivo, sans-serif' : "'IBM Plex Mono', monospace"} fontSize={ours ? 10 : 8.5} fontWeight={ours ? 800 : 400} fill={textFill}>{p.num}</text>
                  </g>
                );
              }
              const transform = p.rot ? `rotate(${p.rot} ${p.x + p.w / 2} ${p.y + p.h / 2})` : undefined;
              return (
                <g key={p.num} onClick={onClick} style={ours ? { cursor: 'pointer' } : undefined} transform={transform}>
                  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={fill} stroke={stroke} strokeWidth={ours ? 2 : 1} />
                  <text x={p.x + p.w / 2} y={p.y + p.h / 2 + (ours ? 4 : 3)} textAnchor="middle" fontFamily={ours ? 'Archivo, sans-serif' : "'IBM Plex Mono', monospace"} fontSize={ours ? 10 : 8.5} fontWeight={ours ? 800 : 400} fill={textFill}>{p.num}</text>
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
