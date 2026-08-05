'use client';

/**
 * Dibujo a escala del lote con sus retiros: la franja gris es lo que el
 * municipio obliga a dejar libre y el rectángulo rosa es lo único donde se
 * puede desplantar. Existe porque "retiro" no le dice nada a un comprador.
 */
export default function RetirosDiagrama({
  frente,
  fondo,
  retiros,
}: {
  frente: number;
  fondo: number;
  retiros: { frente: number; fondo: number; lados: number };
}) {
  const W = 210;
  const H = 155;
  // Espacio extra arriba para la calle, que va del lado del retiro frontal.
  const pad = 28;
  const util = { w: W - pad * 2, h: H - pad * 2 };

  // Escala para que el lote quepa manteniendo su proporción real.
  const k = Math.min(util.w / frente, util.h / fondo);
  const lw = frente * k;
  const lh = fondo * k;
  const x0 = (W - lw) / 2;
  const y0 = (H - lh) / 2;

  const bx = x0 + retiros.lados * k;
  const by = y0 + retiros.frente * k;
  const bw = Math.max(0, lw - retiros.lados * 2 * k);
  const bh = Math.max(0, lh - (retiros.frente + retiros.fondo) * k);

  const cota = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, fill: '#8A8F91' } as const;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '260px', height: 'auto', display: 'block' }}>
      {/* terreno completo */}
      <rect x={x0} y={y0} width={lw} height={lh} fill="#F0EDE9" stroke="#C9CBCC" strokeWidth={1} />
      {/* huella construible */}
      {bw > 0 && bh > 0 ? (
        <>
          <rect x={bx} y={by} width={bw} height={bh} fill="#FBD9E4" stroke="#F2004B" strokeWidth={1.2} />
          <text x={bx + bw / 2} y={by + bh / 2 + 3} textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize={8} fontWeight={800} fill="#8A2249">
            AQUÍ SÍ
          </text>
        </>
      ) : null}

      {/* cotas: lateral abajo, frontal y trasero a la izquierda */}
      <line x1={x0} y1={y0 + lh + 5} x2={bx} y2={y0 + lh + 5} stroke="#B7BABB" strokeWidth={0.8} />
      <text x={x0 + (bx - x0) / 2} y={y0 + lh + 14} textAnchor="middle" {...cota}>{retiros.lados}&apos;</text>

      <line x1={x0 - 5} y1={y0} x2={x0 - 5} y2={by} stroke="#B7BABB" strokeWidth={0.8} />
      <text x={x0 - 8} y={y0 + (by - y0) / 2 + 2} textAnchor="end" {...cota}>{retiros.frente}&apos;</text>

      <line x1={x0 - 5} y1={by + bh} x2={x0 - 5} y2={y0 + lh} stroke="#B7BABB" strokeWidth={0.8} />
      <text x={x0 - 8} y={by + bh + (y0 + lh - by - bh) / 2 + 2} textAnchor="end" {...cota}>{retiros.fondo}&apos;</text>

      {/* La calle va del lado del retiro frontal, que es contra lo que se mide */}
      <line x1={x0 - 4} y1={y0 - 7} x2={x0 + lw + 4} y2={y0 - 7} stroke="#C9CBCC" strokeWidth={2} />
      <text x={x0 + lw / 2} y={y0 - 11} textAnchor="middle" {...cota}>CALLE</text>
    </svg>
  );
}
