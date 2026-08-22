'use client';

import { useState } from 'react';
import { ModuloIcon } from '@/components/ConfigIcons';
import { ICONO_ZONA, ICONO_TRAGALUZ } from '@/lib/assets';
import { FilaOpcion, CifraFt2, useAnimacionAlterna } from '@/components/DecisionUI';
import type { ZonaMod, LiberarEspacio } from '@/components/ZonasGuiadas';

function Icono({ k, size }: { k: string; size: number }) {
  if (ICONO_ZONA[k]) {
    return <img src={ICONO_ZONA[k]} alt="" aria-hidden="true" style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
  }
  return <ModuloIcon moduleKey={k} size={Math.round(size * 0.8)} />;
}

/** Una zona ya puesta, con el barrido carmín cuando acaba de entrar. */
function ZonaPuesta({ m }: { m: ZonaMod }) {
  const sweep = useAnimacionAlterna(m.on ? m.iconKey : null, 'fxSweepA', 'fxSweepB');
  const texto = useAnimacionAlterna(m.on ? m.iconKey : null, 'fxTextA', 'fxTextB');
  return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: '5px 0' }}>
      {sweep ? <span className="lgp-sweep" style={{ position: 'absolute', inset: 0, background: '#F2004B', animation: `${sweep} .75s cubic-bezier(.65,0,.35,1) both` }} /> : null}
      <div className="lgp-sweep-texto" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '9px', animation: texto ? `${texto} .75s ease both` : undefined }}>
        <span style={{ width: '22px', height: '22px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icono k={m.iconKey} size={22} />
        </span>
        <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: '11.5px', color: '#1C1E1F' }}>{m.nombre}</span>
        <span style={{ flex: 'none', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#5C6163' }}>
          {m.incluida ? 'INCL' : m.costoLiving === 0 ? 'EXT' : `${m.costoLiving} ft²`}
        </span>
      </div>
    </div>
  );
}

/**
 * El paso de zonas del prototipo de Claude Design: la tarjeta de detalle a la
 * izquierda reacciona a la zona que tienes debajo del cursor, la columna
 * derecha lleva la cuenta de lo que ya pusiste, y la lista de abajo es donde se
 * agrega — cada fila con su franja carmín.
 *
 * Lo que no cabe no se esconde ni se apaga en seco: se atenúa y dice cuántos
 * ft² le faltan, para que el número del presupuesto tenga consecuencia visible.
 */
export default function ZonasPanel({
  mods,
  ft2Rest,
  liberar,
  tragaluces,
  maxTragaluces,
  orientacionHint,
  onToggleTragaluz,
  onVerGuiado,
}: {
  mods: ZonaMod[];
  ft2Rest: number;
  liberar?: LiberarEspacio | null;
  tragaluces: string[];
  maxTragaluces: number;
  orientacionHint: string;
  onToggleTragaluz: (key: string) => void;
  onVerGuiado: () => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const puestas = mods.filter((m) => m.on);
  // Las bloqueadas por el reglamento o por el plano no son una decisión del
  // cliente: no se listan como si lo fueran.
  const candidatas = mods.filter(
    (m) => !m.on && !m.bloqueadaPorReglamento && !m.disabledReason?.includes('piso') && !m.disabledReason?.includes('patio al que'),
  );
  const listadas = candidatas.slice().sort((a, b) => Number(a.disabled) - Number(b.disabled) || a.costoLiving - b.costoLiving);

  // La tarjeta nunca queda vacía: sin cursor encima muestra la primera de la
  // lista. En un teléfono no hay hover, y un panel en blanco no ayuda a nadie.
  const foco = mods.find((m) => m.iconKey === hover) ?? listadas[0] ?? puestas[0] ?? null;
  const cabe = foco ? !foco.disabled : false;
  const tragaluzPuesto = foco ? tragaluces.includes(foco.iconKey) : false;
  const tragaluzLleno = tragaluces.length >= maxTragaluces;
  const colorCifra = !foco ? '#8A8F91' : foco.on ? '#8A8F91' : cabe ? '#F2004B' : '#B7BABB';

  const cifra = foco
    ? foco.on
      ? { etiqueta: 'Ya la llevas', valor: foco.incluida ? 'Incluida' : `${foco.costoLiving.toLocaleString('es-MX')} ft²` }
      : foco.costoLiving === 0
        ? { etiqueta: 'Zona exterior', valor: '0 ft² habitables' }
        : cabe
          ? { etiqueta: 'Usa', valor: `${foco.costoLiving.toLocaleString('es-MX')} ft²` }
          : { etiqueta: 'Te faltan', valor: `${(foco.costoLiving - ft2Rest).toLocaleString('es-MX')} ft²` }
    : null;

  const estadoFila = (m: ZonaMod) => {
    if (m.incluida) return 'Incluida';
    if (m.on) return 'Puesta';
    if (m.costoLiving === 0) return 'Exterior';
    if (m.disabled) return `Faltan ${(m.costoLiving - ft2Rest).toLocaleString('es-MX')} ft²`;
    return `${m.costoLiving.toLocaleString('es-MX')} ft²`;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', color: '#6E7375', textTransform: 'uppercase' }}>
          {puestas.length} {puestas.length === 1 ? 'zona' : 'zonas'} · {ft2Rest.toLocaleString('es-MX')} ft² libres
        </span>
        <button onClick={onVerGuiado} style={{ marginLeft: 'auto', padding: '5px 10px', background: 'transparent', border: '1px solid #E4E1DD', color: '#5C6163', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Guiarme una por una
        </button>
      </div>

      {/* Altura fija a propósito. Antes la tarjeta crecía o se encogía según la
          zona que tuviera el cursor encima, la lista de abajo se movía con
          ella, y el cursor quedaba sobre otra fila: eso disparaba otro cambio
          de altura y la pantalla entraba en un brinco sin fin. */}
      <div className="lgp-decision-foco lgp-zona-detalle" style={{ border: '1px solid #EAE7E3', background: '#F7F5F2', padding: '26px', display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <span style={{ width: '76px', height: '76px', flex: 'none', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {foco ? <Icono k={foco.iconKey} size={76} /> : null}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {cifra ? (
            <div style={{ marginBottom: '10px' }}>
              <CifraFt2 etiqueta={cifra.etiqueta} valor={cifra.valor} color={colorCifra} clave={foco ? foco.iconKey : null} />
            </div>
          ) : null}
          {foco ? (
            <>
              <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.02em', textTransform: 'uppercase', color: '#1C1E1F', marginBottom: '6px' }}>{foco.nombre}</div>
              <p style={{ margin: '0 0 4px', maxWidth: '46ch', fontSize: '13px', lineHeight: 1.6, color: '#505759' }}>{foco.nota || foco.nombreLargo}</p>
              {foco.sustituyeA ? (
                <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: '#5C6163' }}>Sustituye a {foco.sustituyeA}</p>
              ) : null}
              {foco.sugerida && foco.razon ? (
                <p style={{ margin: '8px 0 0', fontSize: '11.5px', lineHeight: 1.5, color: '#8A2249' }}>De tu brief: {foco.razon}</p>
              ) : null}
              {/* El tragaluz es un atributo de una zona que ya llevas, así que
                  vive aquí, junto a la zona, y no como una lista aparte. */}
              {foco.on && !foco.incluida ? (
                <div style={{ marginTop: '14px' }}>
                  <button
                    onClick={() => onToggleTragaluz(foco.iconKey)}
                    disabled={!tragaluzPuesto && tragaluzLleno}
                    title={!tragaluzPuesto && tragaluzLleno ? `Máximo ${maxTragaluces} tragaluces.` : undefined}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: tragaluzPuesto ? '#1C1E1F' : '#fff', border: '1px solid ' + (tragaluzPuesto ? '#1C1E1F' : '#DDD9D4'), color: tragaluzPuesto ? '#FBFBFA' : !tragaluzPuesto && tragaluzLleno ? '#B7BABB' : '#505759', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: !tragaluzPuesto && tragaluzLleno ? 'not-allowed' : 'pointer' }}
                  >
                    <img src={ICONO_TRAGALUZ} alt="" aria-hidden="true" style={{ width: 16, height: 16, objectFit: 'contain', filter: tragaluzPuesto ? 'invert(1) brightness(3)' : undefined }} />
                    {tragaluzPuesto ? 'Con tragaluz' : 'Agregar tragaluz'}
                  </button>
                  <p style={{ margin: '7px 0 0', fontSize: '11px', lineHeight: 1.5, color: '#6E7375' }}>
                    {orientacionHint} {tragaluces.length}/{maxTragaluces} usados.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ minHeight: '76px', fontSize: '12.5px', color: '#C4C0BA', lineHeight: 1.6 }}>No queda ninguna zona por decidir.</div>
          )}
        </div>

        <div className="lgp-panel-elegido" style={{ width: '230px', flex: 'none', borderLeft: '1px solid #E4E1DD', paddingLeft: '20px', alignSelf: 'stretch' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#6E7375', textTransform: 'uppercase', marginBottom: '10px' }}>Zonas agregadas</div>
          {puestas.length ? (
            /* Se recorta y se desplaza por dentro: con ocho zonas puestas esta
               columna estiraba la tarjeta entera y el paso se volvía un tobogán. */
            <div className="lgp-zonas-puestas" style={{ background: '#fff', border: '1px solid #EAE7E3', padding: '4px 12px', overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {puestas.map((m) => (
                <ZonaPuesta key={m.iconKey} m={m} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#6E7375', lineHeight: 1.5 }}>Ninguna agregada. Elige una de la lista.</div>
          )}
        </div>
      </div>

      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#6E7375', textTransform: 'uppercase', marginBottom: '8px' }}>Otras zonas</div>
      {/* La lista tampoco crece sin fin: se desplaza dentro de su propia caja
          para que el paso conserve su altura. */}
      <div className="lgp-decision-lista lgp-zonas-lista" style={{ border: '1px solid #EAE7E3', maxWidth: '520px', overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {puestas.filter((m) => !m.incluida).map((m) => (
          <FilaOpcion
            key={m.iconKey}
            icono={<Icono k={m.iconKey} size={34} />}
            tipoVisual="icono"
            nombre={m.nombre}
            estado={estadoFila(m)}
            on
            onClick={m.onToggle}
            onEnter={() => setHover(m.iconKey)}
            onLeave={() => setHover(null)}
          />
        ))}
        {listadas.map((m) => (
          <FilaOpcion
            key={m.iconKey}
            icono={<Icono k={m.iconKey} size={34} />}
            tipoVisual="icono"
            nombre={m.nombre}
            estado={estadoFila(m)}
            on={false}
            disabled={m.disabled}
            atenuada={m.disabled}
            title={m.disabledReason ?? undefined}
            onClick={m.onToggle}
            onEnter={() => setHover(m.iconKey)}
            onLeave={() => setHover(null)}
          />
        ))}
      </div>

      {/* Si hay algo que no cabe, la salida está aquí y no escondida en los
          contadores de arriba. */}
      {liberar && listadas.some((m) => m.disabled) ? (
        <button onClick={liberar.onLiberar} className="lgp-hover-zoom" style={{ display: 'block', maxWidth: '520px', width: '100%', padding: '13px', marginTop: '12px', background: 'transparent', border: '1px solid #F2004B', color: '#F2004B', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
          {liberar.etiqueta} · +{liberar.ft2} ft²
        </button>
      ) : null}
    </div>
  );
}
