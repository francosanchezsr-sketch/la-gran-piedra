type FloorplanDiagramProps = {
  planKey: 'A' | 'B' | 'C';
  style?: React.CSSProperties;
};

export default function FloorplanDiagram({ planKey, style }: FloorplanDiagramProps) {
  const base = { width: '100%', height: 'auto', display: 'block' as const, ...style };

  if (planKey === 'A') {
    return (
      <svg viewBox="0 0 300 190" style={base}>
        <g fill="none" stroke="#505759" strokeWidth="1.6">
          <rect x="14" y="14" width="272" height="162"></rect>
          <line x1="14" y1="96" x2="180" y2="96"></line>
          <line x1="180" y1="14" x2="180" y2="176"></line>
          <line x1="96" y1="96" x2="96" y2="176"></line>
          <line x1="232" y1="96" x2="286" y2="96"></line>
        </g>
        <g fill="none" stroke="#C9CBCC" strokeWidth="1">
          <rect x="26" y="26" width="60" height="40"></rect>
          <rect x="112" y="26" width="54" height="26"></rect>
          <rect x="106" y="110" width="60" height="52"></rect>
          <rect x="26" y="110" width="56" height="30"></rect>
          <rect x="196" y="110" width="76" height="20"></rect>
          <line x1="196" y1="40" x2="272" y2="40"></line>
        </g>
        <g fill="#F67599" opacity="0.5">
          <rect x="196" y="26" width="76" height="56"></rect>
        </g>
        <text x="204" y="58" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="0.6" fill="#8A2249">PATIO</text>
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
        <g fill="#F67599" opacity="0.5">
          <rect x="122" y="14" width="66" height="162"></rect>
        </g>
        <g fill="none" stroke="#8A2249" strokeWidth="1">
          <rect x="134" y="30" width="16" height="16" rx="2"></rect>
          <rect x="134" y="144" width="16" height="16" rx="2"></rect>
        </g>
        <circle cx="142" cy="38" r="3" fill="#8A2249"></circle>
        <circle cx="142" cy="152" r="3" fill="#8A2249"></circle>
        <line x1="122" y1="60" x2="188" y2="60" stroke="#8A2249" strokeWidth="1"></line>
        <line x1="122" y1="130" x2="188" y2="130" stroke="#8A2249" strokeWidth="1"></line>
        <text x="129" y="98" fontFamily="IBM Plex Mono, monospace" fontSize="7.5" letterSpacing="0.4" fill="#8A2249">CORREDOR</text>
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
