'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Todo lo que una ventana modal tiene que cumplir, en un solo sitio.
 *
 * Vivía dentro de `VentanaEnfocada` y funcionaba, pero en cuanto apareció una
 * segunda ventana —el visor de fotos de "La obra"— duplicarlo habría dejado dos
 * copias de reglas que se arreglan una sola vez. En particular la del `inert`,
 * que tiene una trampa nada obvia y que ya costó un error.
 *
 *  - Escape cierra.
 *  - El foco entra al abrir y no se sale mientras esté abierta.
 *  - Al cerrar, el foco vuelve a donde estaba.
 *  - El fondo no hace scroll.
 *  - El fondo deja de existir para la tecnología de apoyo.
 *  - El botón/gesto de "atrás" del teléfono cierra la ventana en vez de sacar
 *    al cliente del sitio.
 */
export function useVentanaModal({
  abierto,
  montado,
  cajaRef,
  onCerrar,
}: {
  abierto: boolean;
  /** La caja ya está en el DOM. Ver la nota del efecto de entrada del foco. */
  montado: boolean;
  cajaRef: RefObject<HTMLElement | null>;
  onCerrar: () => void;
}) {
  const focoPrevioRef = useRef<HTMLElement | null>(null);
  // Distingue un cierre nuestro de uno provocado por el botón atrás, para no
  // sacar dos entradas del historial por el mismo cierre.
  const cerrandoPorHistorialRef = useRef(false);
  // `onCerrar` suele llegar como función nueva en cada render. Si los efectos
  // dependieran de ella, se desmontarían y volverían a montar constantemente —
  // y como la limpieza del efecto de historial llama a `history.back()`, la
  // ventana se cerraría sola al primer re-render.
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;

  // --- Bloqueo del scroll de fondo -----------------------------------------
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    const previoTouch = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = previo;
      document.body.style.touchAction = previoTouch;
    };
  }, [abierto]);

  // --- Atrás del navegador y del teléfono ----------------------------------
  useEffect(() => {
    if (!abierto) return;
    window.history.pushState({ lgpVentana: true }, '');
    const alVolver = () => {
      cerrandoPorHistorialRef.current = true;
      onCerrarRef.current();
    };
    window.addEventListener('popstate', alVolver);
    return () => {
      window.removeEventListener('popstate', alVolver);
      // Si se cerró con la ✕ o con Escape, la entrada que empujamos sigue en el
      // historial y hay que sacarla; si se cerró con "atrás", el navegador ya
      // la sacó él solo.
      if (cerrandoPorHistorialRef.current) {
        cerrandoPorHistorialRef.current = false;
      } else if (window.history.state?.lgpVentana) {
        window.history.back();
      }
    };
  }, [abierto]);

  // --- El fondo deja de existir para la tecnología de apoyo ----------------
  // La trampa de Tab solo gobierna el teclado. Sin `inert`, el resto de la
  // página sigue en el árbol de accesibilidad: un lector de pantalla podía
  // recorrer el hero y "La obra" por debajo de una ventana que los tapa.
  //
  // ORDEN IMPORTANTE: este efecto va ANTES del de foco y no es cosmético. React
  // ejecuta las limpiezas en el mismo orden en que se declararon los efectos, y
  // el de foco devuelve el foco al elemento que abrió la ventana. Si `inert`
  // todavía estuviera puesto en ese instante, ese elemento seguiría inerte y
  // `focus()` no haría nada en silencio: al cerrar el visor, el foco se perdía
  // al `<body>` y quien navega con teclado quedaba en el principio de la página.
  useEffect(() => {
    if (!abierto || !montado) return;
    const dialogo = cajaRef.current?.closest('[role="dialog"]') ?? cajaRef.current;
    if (!dialogo) return;

    // Marcar solo los hijos de <body> no sirve: la ventana se renderiza dentro
    // del mismo árbol que la página, así que el contenedor que la contiene
    // queda excluido y con él toda la página. Hay que subir nivel por nivel
    // desde la ventana y apagar a los hermanos de cada ancestro.
    const inertados: HTMLElement[] = [];
    let nodo: Element | null = dialogo;
    while (nodo && nodo.parentElement && nodo !== document.body) {
      for (const hermano of Array.from(nodo.parentElement.children)) {
        if (hermano !== nodo && hermano instanceof HTMLElement && !hermano.hasAttribute('inert')) {
          hermano.setAttribute('inert', '');
          inertados.push(hermano);
        }
      }
      nodo = nodo.parentElement;
    }
    return () => inertados.forEach((n) => n.removeAttribute('inert'));
  }, [abierto, montado, cajaRef]);

  // --- Escape y trampa de foco ---------------------------------------------
  useEffect(() => {
    if (!abierto) return;
    focoPrevioRef.current = document.activeElement as HTMLElement | null;

    const enfocables = () =>
      Array.from(
        cajaRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((e) => !e.hasAttribute('disabled') && e.offsetParent !== null);

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCerrarRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const caja = cajaRef.current;
      if (!caja) return;
      const lista = enfocables();
      if (!lista.length) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement;

      // Contención de verdad, no solo envoltura. Comprobar únicamente si el
      // activo es el primero o el último deja pasar cualquier foco que ya esté
      // fuera de la caja: el Tab siguiente se iba a la página de atrás.
      if (!caja.contains(activo)) {
        e.preventDefault();
        (e.shiftKey ? ultimo : primero).focus();
        return;
      }
      if (e.shiftKey && (activo === primero || activo === caja)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      focoPrevioRef.current?.focus?.();
    };
  }, [abierto, cajaRef]);

  // --- Entrada del foco ----------------------------------------------------
  // Va aparte y observa `montado` porque en el commit donde `abierto` pasa a
  // `true` el componente todavía puede devolver `null` y la ref ser `null`:
  // enfocar ahí no hacía nada, y el efecto no volvía a correr. El resultado era
  // que el foco se quedaba en el botón que abrió la ventana y el primer Tab se
  // iba al contenido de atrás. Separarlo evita además que la devolución del
  // foco del efecto de arriba se dispare al re-ejecutarse.
  useEffect(() => {
    if (!abierto || !montado) return;
    // El primer foco va a la caja, no al primer botón: leerle "Cerrar" a
    // alguien que acaba de abrir la ventana no le dice dónde está.
    cajaRef.current?.focus();
  }, [abierto, montado, cajaRef]);
}
