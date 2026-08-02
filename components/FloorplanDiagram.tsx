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
          <rect x="14" y="14" width="272" height="162"></rect>
          <rect x="106" y="62" width="88" height="66"></rect>
          <line x1="14" y1="62" x2="106" y2="62"></line>
          <line x1="194" y1="128" x2="286" y2="128"></line>
          <line x1="106" y1="14" x2="106" y2="62"></line>
          <line x1="194" y1="128" x2="194" y2="176"></line>
        </g>
        <g fill="none" stroke="#C9CBCC" strokeWidth="1">
          <rect x="26" y="74" width="64" height="42"></rect>
          <rect x="26" y="26" width="64" height="24"></rect>
          <rect x="210" y="26" width="62" height="40"></rect>
          <rect x="210" y="140" width="62" height="24"></rect>
          <rect x="120" y="140" width="58" height="24"></rect>
        </g>
        <g fill="#F67599" opacity="0.5">
          <rect x="106" y="62" width="88" height="66"></rect>
        </g>
        <circle cx="150" cy="95" r="13" fill="none" stroke="#F2004B" strokeWidth="1.2"></circle>
        <text x="112" y="122" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="0.6" fill="#8A2249">PATIO + ÁRBOL</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 300 190" style={base}>
      <g fill="none" stroke="#505759" strokeWidth="1.6">
        <rect x="14" y="14" width="180" height="162"></rect>
        <rect x="212" y="86" width="74" height="90"></rect>
        <line x1="14" y1="104" x2="194" y2="104"></line>
        <line x1="104" y1="14" x2="104" y2="104"></line>
      </g>
      <g fill="none" stroke="#C9CBCC" strokeWidth="1">
        <rect x="26" y="26" width="62" height="60"></rect>
        <rect x="118" y="26" width="62" height="34"></rect>
        <rect x="26" y="118" width="70" height="44"></rect>
        <rect x="112" y="118" width="68" height="20"></rect>
        <rect x="222" y="98" width="54" height="34"></rect>
        <line x1="222" y1="150" x2="276" y2="150"></line>
      </g>
      <g fill="#F4DA40" opacity="0.45">
        <rect x="212" y="86" width="74" height="90"></rect>
      </g>
      <text x="219" y="170" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="0.6" fill="#7A6A12">CASITA</text>
    </svg>
  );
}
