'use client';

import { useEffect, useState } from 'react';

/**
 * ¿El cliente lleva un rato sin tocar nada?
 *
 * Existe para las luces del tutorial (`.lgp-guia-luz`): señalan cuál es el
 * botón que toca, y encendidas desde el primer instante acompañan al cliente
 * mientras decide, cuando no hace falta ayuda — la luz es para quien se quedó
 * parado, no para quien va bien. Con esto solo aparecen tras un momento sin
 * señal de vida y se apagan en cuanto la hay.
 *
 * Señal de vida es TOCAR: un clic, un toque en la pantalla o una tecla. Y nada
 * más, por decisión del cliente:
 *
 *  - El **scroll** no cuenta. Quien scrollea casi siempre está buscando qué
 *    hacer —que es justo cuando la luz sirve—, y además el configurador
 *    scrollea solo al cambiar de etapa: contarlo dejaba la luz apagada por
 *    movimientos que no hizo nadie.
 *  - **Mover el cursor** tampoco. Pasar el ratón por encima no es decidir, y
 *    bastaba rozar el trackpad para apagar el aviso de quien sí estaba perdido.
 */
export function useOcioso(ms = 1500): boolean {
  const [ocioso, setOcioso] = useState(false);

  useEffect(() => {
    let temporizador: number | undefined;
    const marcarActividad = () => {
      window.clearTimeout(temporizador);
      // React ignora un `set` al mismo valor, así que esto solo repinta dos
      // veces por ciclo: al encender y al apagar.
      setOcioso(false);
      temporizador = window.setTimeout(() => setOcioso(true), ms);
    };
    // En captura: un clic que algo detiene en el camino (`stopPropagation`)
    // sigue siendo actividad, y así se cuenta igual.
    const eventos = ['pointerdown', 'keydown', 'touchstart'] as const;
    eventos.forEach((e) => window.addEventListener(e, marcarActividad, { passive: true, capture: true }));
    // Arranca el reloj: quien abre y no toca nada también acaba viendo la luz.
    marcarActividad();
    return () => {
      window.clearTimeout(temporizador);
      eventos.forEach((e) => window.removeEventListener(e, marcarActividad, { capture: true }));
    };
  }, [ms]);

  return ocioso;
}
