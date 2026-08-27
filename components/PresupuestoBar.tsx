'use client';

import { Fragment } from 'react';

export type SegmentoPresupuesto = {
  key: string;
  label: string;
  ft2: number;
  color: string;
};

/**
 * Barra de presupuesto de área habitable, estilo barra de vida: el ancho total
 * es el máximo que permite el lote y cada segmento es lo que ya se comprometió.
 * Se muestra del paso 1 al 4 para que el usuario nunca pierda de vista cuánto
 * le queda mientras configura.
 */
export default function PresupuestoBar({
  max,
  segmentos,
  sinLote = false,
  salidas = [],
}: {
  max: number;
  segmentos: SegmentoPresupuesto[];
  sinLote?: boolean;
  /**
   * Qué puede hacer el cliente cuando no le cabe. Un "te pasas por 125 ft²"
   * a secas deja al comprador con un problema y sin salida; un arquitecto
   * dice por cuánto Y qué mover. Las calcula el configurador, que es quien
   * sabe qué tiene puesto — aquí solo se pintan.
   */
  salidas?: string[];
}) {
  const usados = segmentos.reduce((s, x) => s + x.ft2, 0);
  const libres = Math.max(0, max - usados);
  // Cuanto se pasa, cuando se pasa. Antes solo se enseñaba "0 libres" en rojo,
  // y eso esconde el tamaño del problema: con los ft² corregidos contra los
  // ocho sets de planos, el plano mas chico del catálogo (1,575) ya no cabe en
  // un lote de 50x95 — se pasa por 125 — y el cliente tiene que poder ver
  // cuanto le falta de terreno, no solo que se quedó sin margen.
  const sobregiro = Math.max(0, usados - max);
  const pct = (n: number) => (max > 0 ? (n / max) * 100 : 0);
  // Sobregiro: no debería pasar porque cada control valida antes, pero si
  // pasara hay que verlo, no esconderlo.
  const excedido = usados > max;

  if (sinLote) {
    return (
      <div style={{ padding: '14px 16px', background: '#F7F5F2', border: '1px solid #EAE7E3' }}>
        <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', color: '#6E7375', textTransform: 'uppercase' }}>
          Presupuesto SFT — captura tu lote para activarlo
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '14px 16px', background: '#fff', border: '1px solid #EAE7E3' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.12em', color: '#6E7375', textTransform: 'uppercase' }}>
          Presupuesto SFT
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '19px', letterSpacing: '-0.01em', color: excedido ? '#F2004B' : '#1C1E1F' }}>
            {excedido ? `−${sobregiro.toLocaleString('es-MX')}` : libres.toLocaleString('es-MX')}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: '#5C6163', textTransform: 'uppercase' }}>
            {excedido
              ? `ft² de más sobre los ${max.toLocaleString('es-MX')} que da tu lote`
              : `ft² habitables libres de ${max.toLocaleString('es-MX')}`}
          </span>
        </span>
      </div>

      {excedido && salidas.length ? (
        <div style={{ marginBottom: '10px', padding: '9px 11px', background: '#FFF7F9', borderLeft: '2px solid #F2004B' }}>
          <p style={{ margin: '0 0 5px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#8A2249', textTransform: 'uppercase' }}>
            Para que quepa
          </p>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            {salidas.map((t) => (
              <li key={t} style={{ fontSize: '11.5px', lineHeight: 1.55, color: '#5C6163' }}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(usados, max)}
        /* Sin `aria-valuetext` un lector anuncia "100%" justo cuando el cliente
           necesita oír lo contrario: que no le queda superficie. El porcentaje
           es la lectura correcta del número y la lectura equivocada del hecho. */
        aria-valuetext={excedido
          ? `Te pasas por ${sobregiro.toLocaleString('es-MX')} ft²: la casa pide ${usados.toLocaleString('es-MX')} y tu lote da ${max.toLocaleString('es-MX')}`
          : `${libres.toLocaleString('es-MX')} de ${max.toLocaleString('es-MX')} ft² habitables libres`}
        aria-label="Área habitable comprometida"
        style={{ position: 'relative', display: 'flex', height: '16px', background: '#F0EDE9', border: '1px solid #E4E1DD', overflow: 'hidden' }}
      >
        {segmentos.filter((s) => s.ft2 > 0).map((s) => (
    <Fragment key={s.key}>
          <span
            title={`${s.label}: ${s.ft2.toLocaleString('es-MX')} ft²`}
            /* Se anima `flex-basis` y no `width`. Sigue siendo una propiedad de
               layout, pero acotada al reparto interno de esta barra de 16px: el
               recálculo no sale de aquí. `scaleX` sería más barato y no sirve —
               deformaría el filo blanco que separa un segmento del siguiente,
               que es justo lo que hace legible el reparto. */
            style={{ background: s.color, borderRight: '1px solid rgba(255,255,255,0.55)', transition: 'flex-basis .25s cubic-bezier(.22,.61,.36,1)', flexBasis: pct(s.ft2) + '%', flexGrow: 0, flexShrink: 0 }}
          />
    </Fragment>
    ))}
        {/* muescas tipo barra de vida, cada 25% */}
        <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(90deg, transparent 0 calc(25% - 1px), rgba(28,30,31,0.16) calc(25% - 1px) 25%)' }} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '10px' }}>
        {segmentos.filter((s) => s.ft2 > 0).map((s) => (
    <Fragment key={s.key}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', color: '#5C6163', textTransform: 'uppercase' }}>
            <span style={{ width: '8px', height: '8px', background: s.color, display: 'block', flex: 'none' }} />
            {s.label} {s.ft2.toLocaleString('es-MX')}
          </span>
    </Fragment>
    ))}
        {libres > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', color: '#5C6163', textTransform: 'uppercase' }}>
            <span style={{ width: '8px', height: '8px', background: '#F0EDE9', border: '1px solid #E4E1DD', display: 'block', flex: 'none' }} />
            Libre {libres.toLocaleString('es-MX')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
