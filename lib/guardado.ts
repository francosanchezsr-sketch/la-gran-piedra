import type { Lote } from '@/lib/data';

// El cliente invierte varios minutos armando su casa. Hoy una recarga, un
// cambio de app en el teléfono o una batería que se acaba lo borraba todo, y no
// había forma de volver: el configurador no guardaba nada en ningún lado.
//
// Se guarda solo lo que el cliente decidió. El archivo que sube de su lote NO
// viaja aquí a propósito: un PDF en base64 revienta la cuota de localStorage y
// además es dato suyo que no tiene por qué quedarse en el navegador de un
// equipo prestado.

// v2: al desaparecer el paso de lote, los pasos se recorrieron (7 → 6). Un
// guardado viejo traería un número de paso que ya significa otra cosa, así que
// se cambia la clave en vez de restaurarlo en la pantalla equivocada.
export const CLAVE_GUARDADO = 'lgp-configuracion-v2';

export type ConfigGuardada = {
  v: 1;
  guardadoEn: number;
  paso: number;
  loteId: string | null;
  lotePropio: Lote | null;
  plan: string | null;
  fachada: string | null;
  interior: string | null;
  modulos: string[];
  tragaluces: string[];
  recamarasExtra: number;
  banosExtra: number;
  planLivingSel: number | null;
  garage2: boolean;
  brief: string;
  lead: { nombre: string; correo: string; tel: string };
};

/** Un guardado viejo ya no representa lo que el cliente quiere hoy. */
const VIGENCIA_MS = 1000 * 60 * 60 * 24 * 30;

export function leerGuardado(): ConfigGuardada | null {
  if (typeof window === 'undefined') return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_GUARDADO);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as ConfigGuardada;
    if (datos?.v !== 1) return null;
    if (!datos.guardadoEn || Date.now() - datos.guardadoEn > VIGENCIA_MS) {
      window.localStorage.removeItem(CLAVE_GUARDADO);
      return null;
    }
    return datos;
  } catch {
    return null;
  }
}

export function escribirGuardado(datos: Omit<ConfigGuardada, 'v' | 'guardadoEn'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CLAVE_GUARDADO,
      JSON.stringify({ ...datos, v: 1, guardadoEn: Date.now() } satisfies ConfigGuardada),
    );
  } catch {
    // Cuota llena o almacenamiento bloqueado (modo privado). No es motivo para
    // romperle el configurador a nadie: simplemente no se guarda.
  }
}

export function borrarGuardado(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CLAVE_GUARDADO);
  } catch {
    /* nada que hacer */
  }
}

/** Si no eligió ni lote ni plano, no hay nada que valga la pena retomar. */
export function valeLaPenaRetomar(d: ConfigGuardada | null): boolean {
  return Boolean(d && (d.loteId || d.lotePropio) && (d.plan || d.paso > 1));
}
