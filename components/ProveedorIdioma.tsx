'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useIdiomaRaiz, traducir, type Idioma } from '@/lib/idioma';

/**
 * EL IDIOMA, DISPONIBLE EN TODA LA PÁGINA.
 *
 * El selector vive en la cabecera, pero el texto a traducir está repartido en
 * veinte componentes —los paneles del configurador, las ventanas, la carpeta,
 * el presupuesto—. Pasar el idioma de padre a hijo por toda esa cadena
 * obligaría a tocar cada componente intermedio solo para dejarlo pasar, así
 * que va por contexto: lo pone el proveedor una vez y lo toma quien lo
 * necesite con `useT()`.
 *
 * El contexto trae un valor por defecto en español. Es a propósito: un
 * componente que se renderice fuera del proveedor —una prueba, una página
 * nueva— sigue mostrando texto, no se cae.
 */
type Valor = { idioma: Idioma; setIdioma: (i: Idioma) => void; t: (texto: string) => string };

const Ctx = createContext<Valor>({
  idioma: 'es',
  setIdioma: () => {},
  t: (texto) => texto,
});

/**
 * El título de la pestaña. Lo escribe el servidor en inglés (ver
 * `app/layout.tsx`), que es el idioma de salida; aquí solo se cambia cuando
 * el visitante elige español, porque esa pestaña también es UI.
 */
const TITULO: Record<Idioma, string> = {
  en: 'La Gran Piedra | Custom Homes · Rio Grande Valley',
  es: 'La Gran Piedra | Casas Custom · Rio Grande Valley',
};

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useIdiomaRaiz();

  useEffect(() => {
    document.title = TITULO[idioma];
  }, [idioma]);

  const valor = useMemo<Valor>(
    () => ({ idioma, setIdioma, t: (texto: string) => traducir(texto, idioma) }),
    [idioma, setIdioma],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

/** El idioma actual y cómo cambiarlo. Para el selector de la cabecera. */
export function useIdioma() {
  const { idioma, setIdioma } = useContext(Ctx);
  return [idioma, setIdioma] as const;
}

/** Traduce una frase al idioma elegido. Lo que no esté en el diccionario sale
 *  en español, así que un texto sin traducir nunca deja un hueco en pantalla. */
export function useT() {
  return useContext(Ctx).t;
}
