'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useT, useIdioma } from '@/components/ProveedorIdioma';

/**
 * Lo que el trazador entrega cuando el cliente toca "Usar este lote".
 *
 * Ojo con lo que NO trae: no hay frente × fondo con los que volver a calcular
 * retiros. Sobre una forma irregular esa cuenta no significa nada — el offset
 * se hizo arista por arista sobre el contorno real, con sus curvas y sus
 * franjas de servicio — así que `zonaConstruible` llega YA calculada y aquí no
 * se recalcula. Rehacerla con un rectángulo equivalente sería tirar
 * precisamente el trabajo que justifica que el trazador exista.
 */
export type LoteTrazado = {
  areaLote: number;
  zonaConstruible: number;
  lados: { n: number; ft: number | null; nombre: string; tipo: string; curvo: boolean }[];
  frenteFt: number | null;
  ciudad: string | null;
  fuente: string | null;
  nota: string | null;
  retiros: { frente: number; esquina: number; trasero: number; lado: number; cochera: number };
  retirosDePlano: boolean;
  esquina: boolean;
  franjas: number;
  orientacionGrados: number | null;
  rectMax: { anchoFt: number; largoFt: number; areaFt2: number } | null;
  confianza: 'alta' | 'baja';
  fotoDataUrl: string | null;
};

// El alto de arranque: lo que mide la primera pantalla (subir foto) con holgura.
// Sale de un número y no de 0 para que el marco no dé un salto visible en
// cuanto la página de adentro reporte su medida real.
const ALTO_INICIAL = 420;

/**
 * El trazador de lote, empotrado dentro de "Personaliza tu casa".
 *
 * Va en un marco y no traducido a React a propósito: son ~3,300 líneas de
 * geometría calibradas contra 9 sets de planos construidos —el Lot 124 cuadra
 * al pie contra su plat aprobado— y reescribirlas movería números que hoy
 * están verificados. El archivo vive en `public/trazador/index.html`, se abre
 * solo para probarlo, y con `?embed=1` se apaga su propio chrome y entrega el
 * resultado por `postMessage`.
 *
 * El marco no scrollea: la página de adentro reporta su alto y este componente
 * se lo pone al iframe. Dos barras de scroll anidadas sobre un lienzo que se
 * arrastra con el dedo es exactamente lo que rompe el gesto de trazar.
 */
export default function TrazadorLote({
  onListo,
  onCambio,
}: {
  /** El cliente confirmó su lote. */
  onListo: (lote: LoteTrazado) => void;
  /** El trazador pide que la ventana suba: cambió de pantalla. */
  onCambio?: () => void;
}) {
  const t = useT();
  const [idioma] = useIdioma();
  const marcoRef = useRef<HTMLIFrameElement | null>(null);
  const [alto, setAlto] = useState(ALTO_INICIAL);

  // El listener se vuelve a poner en cada render del padre, porque sus
  // handlers se recrean. No hay hueco por donde se pierda un mensaje: quitar
  // y poner pasan en la misma tarea, y un `message` que llegue entre las dos
  // sigue en la cola. Guardarlos en refs para "suscribirse una sola vez"
  // sería más código para arreglar un problema que no existe.
  const alMensaje = useCallback((ev: MessageEvent) => {
    // Se sirve del mismo origen que la página, así que cualquier cosa que
    // venga de otro sitio no es el trazador. Y aun del mismo origen, solo se
    // escucha a ESTE marco: otra pestaña embebida no habla por él.
    if (ev.origin !== window.location.origin) return;
    if (marcoRef.current && ev.source !== marcoRef.current.contentWindow) return;
    const datos = ev.data as { tipo?: string; alto?: number; lote?: LoteTrazado } | null;
    if (!datos || typeof datos.tipo !== 'string') return;

    if (datos.tipo === 'lgp-trazador:alto' && typeof datos.alto === 'number') {
      // Un tope de cordura: si algo dentro se descontrolara y reportara un
      // alto absurdo, el marco no se lleva la página entera por delante.
      setAlto(Math.min(Math.max(datos.alto, 240), 5000));
    } else if (datos.tipo === 'lgp-trazador:arriba') {
      onCambio?.();
    } else if (datos.tipo === 'lgp-trazador:listo' && datos.lote) {
      onListo(datos.lote);
    }
  }, [onListo, onCambio]);

  useEffect(() => {
    window.addEventListener('message', alMensaje);
    return () => window.removeEventListener('message', alMensaje);
  }, [alMensaje]);

  return (
    <iframe
      ref={marcoRef}
      /* El idioma viaja en la URL, y la `key` vuelve a montar el marco cuando
         cambia: el trazador es HTML estático con su propio diccionario, y
         recargarlo es más limpio que pedirle que deshaga la traducción a
         media edición. Se pierde el trazo en curso, que es el precio de
         cambiar de idioma a medio camino. */
      key={idioma}
      src={`/trazador/index.html?embed=1&lang=${idioma}`}
      title={t('Traza la forma de tu lote')}
      style={{
        display: 'block',
        width: '100%',
        height: alto + 'px',
        border: 0,
        // El marco no puede scrollear por su cuenta: el alto lo fija la página
        // de adentro y quien scrollea es la ventana del configurador.
        overflow: 'hidden',
        background: 'transparent',
        // Sin transición el salto entre pantallas se lee como un parpadeo;
        // con una lenta, el contenido nuevo aparece antes que su espacio.
        transition: 'height 220ms cubic-bezier(.22,1,.36,1)',
      }}
      scrolling="no"
    />
  );
}
