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
  cocinaabierta: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="7" y="9" width="10" height="6" rx="1" />
      <path d="M3 12h2M19 12h2" />
    </svg>
  ),
  cocinacerrada: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <rect x="8" y="9" width="8" height="6" />
    </svg>
  ),
  pasillo: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M8 3v18" />
      <path d="M16 3v18" />
      <rect x="10" y="9" width="4" height="6" />
    </svg>
  ),
  masterpatio: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      <path d="M3 15h18" />
      <circle cx="19" cy="6" r="2.4" />
    </svg>
  ),
  masterbalcon: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M3 14v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
      <path d="M3 14h18" />
      <path d="M3 14v6M8 14v6M13 14v6M18 14v6M23 14v6" />
    </svg>
  ),
  floatingoffice: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M4 9h16" />
      <path d="M7 9V6.5A1.5 1.5 0 0 1 8.5 5h7A1.5 1.5 0 0 1 17 6.5V9" />
      <path d="M6 9v3M18 9v3" />
    </svg>
  ),
  walkingcloset: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M12 4.5a1.6 1.6 0 0 1 1.6 1.6" />
      <path d="M12 6.1 4 11h16z" />
      <path d="M6 11v7M18 11v7" />
    </svg>
  ),
  alberca: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="3" y="5" width="18" height="14" rx="1.4" />
      <path d="M5 11c1.4 0 1.4 2 2.8 2s1.4-2 2.8-2 1.4 2 2.8 2 1.4-2 2.8-2 1.4 2 2.8 2" />
    </svg>
  ),
  bbq: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <circle cx="12" cy="11" r="7" />
      <path d="M7.5 11h9M9 8l6 6M15 8l-6 6" />
      <path d="M9 18l-1.5 3M15 18l1.5 3" />
    </svg>
  ),
  sunkenlounge: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M6 10h12v7H6z" />
    </svg>
  ),
  storage: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M3 8l9-4.5L21 8v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M3 8l9 4.5L21 8" />
      <path d="M12 12.5V19" />
    </svg>
  ),
  lavanderia: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="4" y="3" width="16" height="18" rx="1.4" />
      <circle cx="12" cy="13" r="5" />
      <circle cx="12" cy="13" r="2.2" />
      <path d="M7 6.5h.01M10 6.5h.01" />
    </svg>
  ),
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
