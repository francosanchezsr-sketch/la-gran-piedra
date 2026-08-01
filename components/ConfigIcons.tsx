import type { ReactElement } from 'react';

type IconProps = {
  size?: number;
  color?: string;
};

const base = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Bed({ size = 26, color = '#505759' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      <path d="M3 15h18" />
      <path d="M5 11V8a1.5 1.5 0 0 1 1.5-1.5H10A1.5 1.5 0 0 1 11.5 8v3" />
      <path d="M3 18v2M21 18v2" />
    </svg>
  );
}

const MODULE_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  patio: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M12 19v-6" />
      <circle cx="12" cy="9.5" r="3.6" />
    </svg>
  ),
  cocinaext: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M6 14a6 6 0 0 1 12 0" />
      <path d="M5 14h14" />
      <path d="M7.5 14 6 19" />
      <path d="M16.5 14 18 19" />
      <path d="M12 7V4" />
    </svg>
  ),
  primary: Bed,
  dual: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="2.5" y="3" width="12" height="12" rx="1.5" />
      <rect x="9.5" y="9" width="12" height="12" rx="1.5" />
    </svg>
  ),
  office: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="4" y="4.5" width="16" height="11" rx="1.4" />
      <path d="M9 20h6" />
      <path d="M12 15.5V20" />
    </svg>
  ),
  bonus: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="2.5" y="8.5" width="19" height="9" rx="4.5" />
      <path d="M7.3 13h3" />
      <path d="M8.8 11.5v3" />
      <circle cx="16" cy="11.6" r="0.9" fill={color} stroke="none" />
      <circle cx="18.1" cy="13.7" r="0.9" fill={color} stroke="none" />
    </svg>
  ),
  scullery: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="4.5" y="2.5" width="15" height="19" rx="1.4" />
      <path d="M4.5 9h15" />
      <path d="M4.5 15.5h15" />
    </svg>
  ),
  mudroom: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M5 4.5h14" />
      <circle cx="8.5" cy="8" r="1.3" />
      <circle cx="15.5" cy="8" r="1.3" />
      <path d="M8.5 9.3v5l-2 4.7" />
      <path d="M15.5 9.3v3.6l2 5.6" />
    </svg>
  ),
  cocinaexh: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M4 10.5 12 4l8 6.5" />
      <rect x="5" y="10.5" width="14" height="9.5" rx="1.2" />
      <circle cx="12" cy="3" r="0" fill="none" />
      <path d="M12 6.5V9" />
    </svg>
  ),
  rec2: Bed,
};

export function ModuloIcon({ moduleKey, size, color }: { moduleKey: string; size?: number; color?: string }) {
  const Icon = MODULE_ICONS[moduleKey];
  if (!Icon) return null;
  return <Icon size={size} color={color} />;
}

const FACHADA_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  esc: ({ size = 40, color = '#8A8F91' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.4} {...base}>
      <path d="M3 9.5h18" />
      <rect x="3" y="9.5" width="18" height="9.5" />
      <rect x="7.5" y="12.5" width="6.5" height="6.5" />
    </svg>
  ),
  farm: ({ size = 40, color = '#8A8F91' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.4} {...base}>
      <path d="M4 10 12 4l8 6" />
      <rect x="5" y="10" width="14" height="9" />
      <path d="M12 10v9" />
    </svg>
  ),
  piedra: ({ size = 40, color = '#8A8F91' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.4} {...base}>
      <path d="M4 10 12 4l8 6" />
      <rect x="5" y="10" width="14" height="9" />
      <path d="M7 14.3h3M11.3 14.3h3M15.6 14.3h2.4" />
      <path d="M7 17h3.6M12 17h3.6" />
    </svg>
  ),
  negro: ({ size = 40, color = '#8A8F91' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.4} {...base}>
      <path d="M3 9.5h18" />
      <rect x="3" y="9.5" width="18" height="9.5" />
      <path d="M14 9.5v9.5" />
      <path d="M15.2 10.7l4 4M19.2 10.7l-4 4" />
    </svg>
  ),
};

export function FachadaIcon({ styleKey, size, color }: { styleKey: string; size?: number; color?: string }) {
  const Icon = FACHADA_ICONS[styleKey];
  if (!Icon) return null;
  return <Icon size={size} color={color} />;
}
