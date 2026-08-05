import type { ReactElement, ReactNode } from 'react';

type IconProps = {
  size?: number;
  color?: string;
};

const base = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// Badge sólido (squircle negro + glifo blanco) — usado por los iconos de
// zona "rellenos" que reemplazan a los de línea para ciertos módulos.
function Squircle({ size = 26, color = '#1C1E1F', children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect x="1" y="1" width="22" height="22" rx="6" fill={color} />
      {children}
    </svg>
  );
}

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
  office: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="4" y="4.5" width="16" height="11" rx="1.4" />
      <path d="M9 20h6" />
      <path d="M12 15.5V20" />
    </svg>
  ),
  bonus: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M8 10.5h2M9 9.5v2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15" cy="9.7" r="0.95" fill="#fff" />
      <circle cx="16.6" cy="11.6" r="0.95" fill="#fff" />
      <path d="M6.8 8.5h10.4a2.3 2.3 0 0 1 2.28 2.62l-.5 3.5a2 2 0 0 1-3.6.98L14 14h-4l-1.38 1.6a2 2 0 0 1-3.6-.98l-.5-3.5A2.3 2.3 0 0 1 6.8 8.5z" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </Squircle>
  ),
  scullery: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M6 5.5v13M18 5.5v13" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 10.5h12M6 15h12" stroke="#fff" strokeWidth="1.4" />
      <rect x="7.6" y="6.3" width="2.6" height="3.4" rx="0.6" fill="#fff" />
      <rect x="11.2" y="6.3" width="2.6" height="3.4" rx="0.6" fill="#fff" />
      <rect x="9.4" y="10.9" width="2.6" height="3.4" rx="0.6" fill="#fff" />
      <rect x="13" y="10.9" width="2.6" height="3.4" rx="0.6" fill="#fff" />
    </Squircle>
  ),
  mudroom: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <rect x="5" y="6" width="14" height="2.2" rx="1.1" fill="#fff" />
      <path d="M8 8.2v1.3M12 8.2v1.3M16 8.2v1.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="5.5" y="14.5" width="13" height="2.2" rx="0.6" fill="#fff" />
      <path d="M6.5 16.7v2M17.5 16.7v2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </Squircle>
  ),
  rec2: Bed,
  // Cuarto sin uso asignado: un recuadro vacío con un signo de interrogación,
  // que es justamente lo que el cliente todavía no define.
  comodin: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <rect x="5.5" y="6" width="13" height="12" rx="1" fill="none" stroke="#fff" strokeWidth="1.4" strokeDasharray="2.6 2" />
      <path d="M10.1 10.4a1.95 1.95 0 1 1 2.4 1.9v1.2" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12.5" cy="15.6" r="0.85" fill="#fff" />
    </Squircle>
  ),
  cocinaabierta: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M6 18v-5.5A5.5 5.5 0 0 1 11.5 7H18v11z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 18a2 2 0 0 1 2-2" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12.4" cy="12" r="0.9" fill="#fff" />
      <circle cx="15.4" cy="12" r="0.9" fill="#fff" />
      <circle cx="12.4" cy="14.8" r="0.9" fill="#fff" />
      <circle cx="15.4" cy="14.8" r="0.9" fill="#fff" />
    </Squircle>
  ),
  cocinacerrada: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M6 18v-5.5A5.5 5.5 0 0 1 11.5 7H18v11z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 18h12" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12.4" cy="12" r="0.9" fill="#fff" />
      <circle cx="15.4" cy="12" r="0.9" fill="#fff" />
      <circle cx="12.4" cy="14.8" r="0.9" fill="#fff" />
      <circle cx="15.4" cy="14.8" r="0.9" fill="#fff" />
    </Squircle>
  ),
  masterpatio: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M5 15v-2.5a1.6 1.6 0 0 1 1.6-1.6H12a1.6 1.6 0 0 1 1.6 1.6V15" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.3 15h9.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4.3 15v3.3M13.7 15v3.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="16" y="9" width="4.2" height="9.3" rx="0.5" fill="none" stroke="#fff" strokeWidth="1.3" />
      <path d="M16 12.3h4.2" stroke="#fff" strokeWidth="1" />
      <path d="M14.5 18.8h3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </Squircle>
  ),
  masterbalcon: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M5 14v-2.3a1.6 1.6 0 0 1 1.6-1.6H12a1.6 1.6 0 0 1 1.6 1.6V14" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.3 14h16.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M17 14v5M20.7 14v5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M17 19h3.7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </Squircle>
  ),
  walkingcloset: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M5.5 7h13" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15 7h3.4a1 1 0 0 1 1 1v0" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 7v1.6" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 8.6c1.6-1.4 2.4-1.4 4 0" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.4 8.6h7.2l1.6 8.8H6.8z" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </Squircle>
  ),
  alberca: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <rect x="4" y="6.5" width="16" height="9" rx="1" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M6 10.7c1 0 1 1.1 2 1.1s1-1.1 2-1.1 1 1.1 2 1.1 1-1.1 2-1.1 1 1.1 2 1.1 1-1.1 2-1.1" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M17 15.5v3.2M19.3 15.5v3.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M17 17h2.3M17 18.7h2.3" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
    </Squircle>
  ),
  bbq: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M8.5 8.5c1-2.2 6-2.2 7 0" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.3 12.3a5.7 5.7 0 0 1 11.4 0z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.5 12.3h12.9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 14.3v3.2M12 14.3v3.2M16 14.3v3.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.5 19.3h7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </Squircle>
  ),
  sunkenlounge: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M5 9.5 12 5l7 4.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5 9.5v6.5L12 20l7-4V9.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8.3 11 12 13.3 15.7 11" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M12 13.3V17" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </Squircle>
  ),
  storage: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <rect x="6" y="12.3" width="12" height="5.7" rx="0.8" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M9.6 14.2h4.8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="6.8" y="6.3" width="10.4" height="4.7" rx="0.8" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M9.9 8.1h4.2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </Squircle>
  ),
};

// Icono del toggle "+ Tragaluz" en el detalle de módulo — no es una zona del
// catálogo (MODULOS), es un atributo que se puede agregar a la zona activa.
export function TragaluzIcon({ size, color = '#fff' }: IconProps) {
  return (
    <svg width={size ?? 14} height={size ?? 14} viewBox="0 0 24 24" stroke={color} strokeWidth={1.5} {...base}>
      <path d="M3 9.5 9.5 6l3.6 2v5.4l-3.6 2L3 13.4z" strokeLinejoin="round" />
      <path d="M13.1 8 20 4.8v5.4l-3.5 2" strokeLinejoin="round" />
      <path d="M13.1 13.4 20 10.2" />
    </svg>
  );
}

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
