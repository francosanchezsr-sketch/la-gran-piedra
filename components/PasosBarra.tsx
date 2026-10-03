'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * La barra de pasos: un riel con un punto por paso, y una franja carmín que
 * lo recorre.
 *
 * Reemplaza a la fila de rectángulos planos que había antes (cinco o seis
 * bloques pegados, cada uno con su propio color de fondo). Aquella fila
 * decía "en cuál vas" con un color de más; esta lo dice con un recorrido —
 * más cerca de cómo el cliente ya lee la barra de presupuesto, que también es
 * un riel que se llena.
 *
 * SOLO ANIMA AL AVANZAR. Volver atrás, cargar una configuración guardada o
 * reiniciar cambian el ancho de la franja sin transición — el efecto es la
 * recompensa de decir "siguiente", no un adorno que se repite cada vez que la
 * barra se pinta. El truco es un `ref` con la posición anterior: solo cuando
 * la nueva posición es mayor se enciende `transition`, y se apaga otra vez
 * después de la duración del recorrido.
 */

const CARMIN = '#F2004B';
const TINTA = '#1C1E1F';
const PAPEL = '#FBFBFA';
const RIEL = '#E4E1DD';
const GRIS = '#6E7375';
const GRIS_CLARO = '#B7BABB';

const DURACION_MS = 620;

export type PasoBarra = {
  n: number;
  etiqueta: number;
  permitido: boolean;
  ariaLabel: string;
  ariaCurrent?: 'step';
};

export default function PasosBarra({ pasos }: { pasos: PasoBarra[] }) {
  const total = pasos.length;
  // La posición del paso actual, 1-indexada — es lo único que hace falta para
  // calcular tanto el ancho de la franja como el color de cada punto. `pasos`
  // ya trae el actual marcado con `ariaCurrent`, así que no se duplica esa
  // lógica aquí.
  // 0 cuando ningún paso de la lista es el actual — pasa en la previa, que
  // vive fuera de `pasosDelRecorrido` y por eso no aparece aquí como
  // `ariaCurrent`. `findIndex` da -1 y suma 1: da 0, no un paso fantasma.
  // `|| 1` se probó y fue el bug — en JS `0 || 1` es `1`, así que la previa
  // encendía el punto 1 como si ya estuviera en marcha.
  const posActual = pasos.findIndex((p) => p.ariaCurrent === 'step') + 1;
  const fraccion = posActual > 1 && total > 1 ? (posActual - 1) / (total - 1) : 0;

  const posAnterior = useRef(posActual);
  const [avanzando, setAvanzando] = useState(false);
  useEffect(() => {
    if (posActual > posAnterior.current) {
      setAvanzando(true);
      const t = setTimeout(() => setAvanzando(false), DURACION_MS);
      posAnterior.current = posActual;
      return () => clearTimeout(t);
    }
    posAnterior.current = posActual;
  }, [posActual]);

  const transicion = avanzando ? `all ${DURACION_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1)` : 'none';

  return (
    <div style={{ position: 'relative', width: '100%', padding: '11px 0' }}>
      {/* EL RIEL. Grosor fijo, de filo a filo — los puntos se paran encima, no
          lo ensanchan. */}
      <div style={{ position: 'relative', height: '5px', borderRadius: '999px', background: RIEL }}>
        <div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${fraccion * 100}%`,
            borderRadius: '999px',
            background: CARMIN,
            transition: transicion,
          }}
        />
      </div>

      {/* LOS PUNTOS, uno por paso, del primero al último filo a filo con el
          riel: el paso 1 nace en el 0 % y el último cierra en el 100 %, así
          que la franja llega exactamente a cada uno cuando le toca. */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', justifyContent: 'space-between' }} role="list">
        {pasos.map((p, i) => {
          const posicion = i + 1;
          const hecho = posicion < posActual;
          const actual = posicion === posActual;
          const relleno = hecho ? CARMIN : actual ? TINTA : PAPEL;
          const texto = hecho || actual ? '#fff' : p.permitido ? GRIS : GRIS_CLARO;
          const borde = hecho || actual ? relleno : RIEL;
          return (
            <div
              key={p.n}
              role="listitem"
              aria-label={p.ariaLabel}
              aria-current={p.ariaCurrent}
              // El punto que se acaba de encender rebota una vez — el mismo
              // gesto de "recién desbloqueado" que usa el resto del
              // configurador (`lgp-guia-entra`), para que este avance se lea
              // como la misma familia de feedback y no como un efecto aparte.
              className={actual && avanzando ? 'lgp-guia-entra' : undefined}
              style={{
                width: '26px', height: '26px', borderRadius: '50%', flex: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: relleno, border: `2px solid ${borde}`, color: texto,
                fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '11px',
                boxShadow: `0 0 0 3px ${PAPEL}`,
                transition: transicion,
              }}
            >
              {p.etiqueta}
            </div>
          );
        })}
      </div>
    </div>
  );
}
