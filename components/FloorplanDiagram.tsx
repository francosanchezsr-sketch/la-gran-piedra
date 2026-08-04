export type PlanDiagramKey = 'TH' | 'B' | 'C' | 'D';

type FloorplanDiagramProps = {
  planKey: PlanDiagramKey;
  style?: React.CSSProperties;
};

export default function FloorplanDiagram({ planKey, style }: FloorplanDiagramProps) {
  const base = { width: '100%', height: 'auto', display: 'block' as const, ...style };

  // TH — townhouse real del Lote 17: 27' de frente x 65'6" de fondo, garage al
  // frente y dos plantas. Se dibujan las dos plantas lado a lado porque la
  // huella es angosta y profunda.
  if (planKey === 'TH') {
    return (
      <svg viewBox="0 0 300 190" style={base}>
        <g fill="none" stroke="#505759" strokeWidth="1.6">
          <rect x="42" y="14" width="80" height="162"></rect>
          <rect x="178" y="14" width="80" height="162"></rect>
        </g>
        <g fill="none" stroke="#C9CBCC" strokeWidth="1">
          <rect x="52" y="24" width="60" height="40"></rect>
          <rect x="52" y="72" width="60" height="30"></rect>
          <rect x="52" y="110" width="60" height="26"></rect>
          <rect x="188" y="24" width="60" height="34"></rect>
          <rect x="188" y="66" width="60" height="30"></rect>
          <rect x="188" y="104" width="60" height="40"></rect>
        </g>
        <g fill="#D5D7D8" opacity="0.55"><rect x="52" y="144" width="60" height="24"></rect></g>
        <g fill="#F67599" opacity="0.45"><rect x="188" y="152" width="60" height="16"></rect></g>
        <text x="55" y="159" fontFamily="IBM Plex Mono, monospace" fontSize="7" letterSpacing="0.4" fill="#6B6E70">GARAGE</text>
        <text x="191" y="163" fontFamily="IBM Plex Mono, monospace" fontSize="7" letterSpacing="0.4" fill="#8A2249">BALCÓN</text>
        <text x="52" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" letterSpacing="0.5" fill="#8A8F91">PLANTA BAJA</text>
        <text x="188" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" letterSpacing="0.5" fill="#8A8F91">PLANTA ALTA</text>
      </svg>
    );
  }

  // D — dos pisos en lote sin restricción: huella más ancha, escalera central.
  if (planKey === 'D') {
    return (
      <svg viewBox="0 0 300 190" style={base}>
        <g fill="none" stroke="#505759" strokeWidth="1.6">
          <rect x="20" y="14" width="120" height="162"></rect>
          <rect x="160" y="14" width="120" height="162"></rect>
        </g>
        <g fill="none" stroke="#C9CBCC" strokeWidth="1">
          <rect x="32" y="26" width="60" height="52"></rect>
          <rect x="32" y="92" width="60" height="42"></rect>
          <rect x="104" y="26" width="24" height="52"></rect>
          <rect x="172" y="26" width="46" height="46"></rect>
          <rect x="230" y="26" width="38" height="46"></rect>
          <rect x="172" y="86" width="46" height="46"></rect>
          <rect x="230" y="86" width="38" height="46"></rect>
        </g>
        <g fill="#D5D7D8" opacity="0.55"><rect x="32" y="146" width="96" height="20"></rect></g>
        <g fill="none" stroke="#505759" strokeWidth="1">
          <path d="M104 92h24M104 100h24M104 108h24M104 116h24M104 124h24"></path>
          <rect x="104" y="86" width="24" height="46"></rect>
        </g>
        <text x="35" y="160" fontFamily="IBM Plex Mono, monospace" fontSize="7" letterSpacing="0.4" fill="#6B6E70">GARAGE</text>
        <text x="20" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" letterSpacing="0.5" fill="#8A8F91">PLANTA BAJA</text>
        <text x="160" y="186" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" letterSpacing="0.5" fill="#8A8F91">PLANTA ALTA · 4 REC</text>
      </svg>
    );
  }

  if (planKey === 'B') {
    return (
      <svg viewBox="0 0 300 190" style={base}>
        <g fill="none" stroke="#505759" strokeWidth="1.6">
          <rect x="14" y="14" width="108" height="162"></rect>
          <rect x="188" y="14" width="98" height="162"></rect>
          <line x1="14" y1="88" x2="122" y2="88"></line>
          <line x1="188" y1="96" x2="286" y2="96"></line>
        </g>
        <g fill="none" stroke="#C9CBCC" strokeWidth="1">
          <rect x="26" y="100" width="54" height="64"></rect>
          <rect x="26" y="26" width="84" height="50"></rect>
          <rect x="200" y="26" width="74" height="56"></rect>
          <rect x="200" y="120" width="74" height="44"></rect>
        </g>
        {/* Corredor techado (banda gris) cruzando dos patios de 6'x6' */}
        <g fill="#E4E1DD" opacity="0.9">
          <rect x="122" y="14" width="66" height="162"></rect>
        </g>
        <g fill="#F67599" opacity="0.5">
          <rect x="133" y="26" width="44" height="44"></rect>
          <rect x="133" y="120" width="44" height="44"></rect>
        </g>
        <g fill="none" stroke="#8A2249" strokeWidth="1">
          <rect x="133" y="26" width="44" height="44"></rect>
          <rect x="133" y="120" width="44" height="44"></rect>
        </g>
        <text x="136" y="52" fontFamily="IBM Plex Mono, monospace" fontSize="7" letterSpacing="0.3" fill="#8A2249">6&apos;×6&apos;</text>
        <text x="136" y="146" fontFamily="IBM Plex Mono, monospace" fontSize="7" letterSpacing="0.3" fill="#8A2249">6&apos;×6&apos;</text>
        <g fill="none" stroke="#8A8F91" strokeWidth="1" strokeDasharray="3 3">
          <path d="M155 70v50"></path>
        </g>
        <text x="126" y="100" fontFamily="IBM Plex Mono, monospace" fontSize="6.5" letterSpacing="0.3" fill="#6B6E70">CORREDOR TECHADO</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 300 190" style={base}>
      <g fill="none" stroke="#505759" strokeWidth="1.6">
        <rect x="14" y="14" width="272" height="162"></rect>
      </g>
      <g fill="none" stroke="#C9CBCC" strokeWidth="1">
        <rect x="26" y="26" width="86" height="58"></rect>
        <rect x="26" y="118" width="86" height="58"></rect>
        <rect x="188" y="26" width="74" height="58"></rect>
        <rect x="188" y="118" width="74" height="58"></rect>
      </g>
      <g fill="#F4DA40" opacity="0.4">
        <rect x="122" y="58" width="56" height="74"></rect>
      </g>
      <rect x="122" y="58" width="56" height="74" fill="none" stroke="#7A6A12" strokeWidth="1.2"></rect>
      <circle cx="150" cy="95" r="9" fill="none" stroke="#7A6A12" strokeWidth="1.2"></circle>
      <path d="M150 86v-8M143 79l7 7 7-7" stroke="#7A6A12" strokeWidth="1"></path>
      <text x="127" y="146" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" letterSpacing="0.4" fill="#7A6A12">PATIO CENTRAL</text>
    </svg>
  );
}
