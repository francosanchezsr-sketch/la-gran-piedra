'use client';

import { useCallback, useEffect, useState } from 'react';
import { EN } from '@/lib/diccionario-en';

/**
 * EL SITIO EN DOS IDIOMAS — español e inglés.
 *
 * El negocio busca clientes locales e internacionales, y hasta ahora el sitio
 * solo hablaba español. Esto es el mecanismo; la traducción se escribe a mano,
 * frase por frase, y NO se delega a un traductor automático: el cliente lo
 * decidió así y la razón es buena. Quien entra aquí está tomando la decisión
 * de compra más cara de su vida, y "it was never so easy and satisfying to
 * design your house" —lo que devuelve una máquina— no suena a la constructora
 * que le va a cobrar esa casa.
 *
 * CÓMO SE USA: el diccionario va del ESPAÑOL al inglés, no de claves
 * inventadas. `t('Agenda una cita')` devuelve la frase inglesa cuando el
 * idioma es `en`, y la misma frase en español cuando es `es`. Dos razones:
 *
 *  - El código se sigue leyendo. `t('Agenda una cita')` dice qué sale en
 *    pantalla; `t('header.cta')` obliga a abrir otro archivo para saberlo.
 *  - Lo que todavía no está traducido NO desaparece ni muestra una clave
 *    cruda: sale en español. El sitio se traduce por etapas sin romperse en
 *    ninguna, que es lo que permite empezar por el recorrido del cliente.
 */
export type Idioma = 'es' | 'en';

const LLAVE = 'lgp-idioma';

export const IDIOMAS: { id: Idioma; nombre: string; corto: string }[] = [
  { id: 'es', nombre: 'Español', corto: 'ES' },
  { id: 'en', nombre: 'English', corto: 'EN' },
];

/** El diccionario vive aparte: ver `lib/diccionario-en.ts`. */

export function traducir(texto: string, idioma: Idioma): string {
  if (idioma === 'es') return texto;
  return EN[texto] ?? texto;
}

/**
 * El idioma elegido, recordado entre visitas.
 *
 * Arranca SIEMPRE en INGLÉS, también para quien ya eligió español, y cambia
 * en el primer pintado del navegador. Son dos decisiones distintas:
 *
 *  - Que el idioma de salida sea el inglés lo pidió el cliente: el negocio
 *    busca comprador internacional, y quien llega de fuera no debería tener
 *    que encontrar un botón antes de entender la primera pantalla. Quien
 *    prefiera español lo elige una vez y se le recuerda.
 *  - Que el PRIMER render sea siempre el mismo —sin leer `localStorage`— es
 *    técnico: el servidor no sabe qué eligió este visitante, y si el primer
 *    render leyera el almacenamiento, el HTML del servidor y el del cliente
 *    no coincidirían. Eso es un error de hidratación de React y deja la
 *    página a medio montar.
 */
export function useIdiomaRaiz(): [Idioma, (i: Idioma) => void] {
  const [idioma, setIdiomaEstado] = useState<Idioma>('en');

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(LLAVE);
      // La regla de "no llames a setState dentro de un efecto" existe para
      // evitar renders en cascada; aquí es justo lo que hay que hacer, y una
      // sola vez: el servidor no puede leer `localStorage`, así que el idioma
      // guardado solo se puede aplicar ya montado. Sin esto, o no se recuerda
      // la elección o se rompe la hidratación.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (guardado === 'en' || guardado === 'es') setIdiomaEstado(guardado);
    } catch {
      // Navegador con el almacenamiento bloqueado: se queda en inglés.
    }
  }, []);

  const setIdioma = useCallback((i: Idioma) => {
    setIdiomaEstado(i);
    try {
      window.localStorage.setItem(LLAVE, i);
    } catch {
      // Igual que arriba: no poder recordarlo no impide cambiarlo ahora.
    }
    // El idioma del documento también cambia: de él dependen el corrector del
    // navegador, los lectores de pantalla y el "¿traducir esta página?".
    document.documentElement.lang = i;
  }, []);

  return [idioma, setIdioma];
}
