'use client';

import { Fragment, useState } from 'react';
import { ModuloIcon } from '@/components/ConfigIcons';
import { ICONO_ZONA } from '@/lib/assets';

export type ZonaMod = {
  iconKey: string;
  nombre: string;
  nombreLargo: string;
  nota: string;
  rango: string;
  min: number;
  costoLiving: number;
  on: boolean;
  incluida: boolean;
  disabled: boolean;
  disabledReason: string | null;
  bloqueadaPorReglamento: boolean;
  sugerida: boolean;
  sustituyeA: string | null;
  onToggle: () => void;
};

/** Atajo para hacer espacio cuando el presupuesto ya está en cero. */
export type LiberarEspacio = {
  etiqueta: string;
  ft2: number;
  onLiberar: () => void;
};

function Icono({ k, size }: { k: string; size: number }) {
  if (ICONO_ZONA[k]) {
    return <img src={ICONO_ZONA[k]} alt="" aria-hidden="true" style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} />;
  }
  return <ModuloIcon moduleKey={k} size={Math.round(size * 0.8)} />;
}

/**
 * Zonas de una en una: en vez de un catálogo de 15 opciones donde el usuario
 * tiene que decidir qué mirar, se le hace una pregunta a la vez y se le dice
 * qué le cuesta y con cuánto se queda. El catálogo completo sigue a un clic
 * para quien prefiera navegarlo.
 *
 * Solo se pregunta por lo que hoy cabe. Preguntar once veces seguidas por algo
 * que no entra en el presupuesto no es una decisión, es un callejón sin salida:
 * lo que no cabe se agrupa aparte, con lo que costaría y cómo hacerle espacio.
 *
 * La lógica de presupuesto, bloqueos y toggles vive fuera: aquí solo se
 * decide QUÉ preguntar y en qué orden.
 */
export default function ZonasGuiadas({
  mods,
  ft2Rest,
  verTodas,
  onVerTodas,
  liberar,
}: {
  mods: ZonaMod[];
  ft2Rest: number;
  verTodas: boolean;
  onVerTodas: (v: boolean) => void;
  liberar?: LiberarEspacio | null;
}) {
  const [saltadas, setSaltadas] = useState<string[]>([]);

  const puestas = mods.filter((m) => m.on && !m.incluida);
  const incluidas = mods.filter((m) => m.incluida);
  // Candidatas: las que el usuario podría agregar hoy o cuando libere espacio.
  // Las bloqueadas por reglamento o por el floorplan no aparecen — no son una
  // decisión suya, y ofrecérselas solo para negárselas es ruido.
  const candidatas = mods.filter(
    (m) => !m.on && !m.incluida && !m.bloqueadaPorReglamento && !m.disabledReason?.includes('piso') && !m.disabledReason?.includes('patio al que'),
  );
  // Se pregunta solo por lo que cabe; el resto se muestra como lista de espera.
  const preguntables = candidatas.filter((m) => !m.disabled);
  const sinEspacio = candidatas
    .filter((m) => m.disabled && !m.bloqueadaPorReglamento)
    .sort((a, b) => a.costoLiving - b.costoLiving);

  const pendientes = preguntables.filter((m) => !saltadas.includes(m.iconKey));
  const actual = pendientes[0] ?? null;
  const siguientes = pendientes.slice(1, 4);

  const total = preguntables.length;
  const revisadas = total - pendientes.length;

  const decidir = (agregar: boolean) => {
    if (!actual) return;
    if (agregar && !actual.disabled) actual.onToggle();
    setSaltadas((prev) => (prev.includes(actual.iconKey) ? prev : prev.concat([actual.iconKey])));
  };
  const reiniciar = () => setSaltadas([]);

  const chip = (m: ZonaMod, quitable: boolean) => (
    <span key={m.iconKey} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 9px 5px 5px', background: m.incluida ? '#F7F5F2' : '#FFF7F9', border: '1px solid ' + (m.incluida ? '#EAE7E3' : '#F8C9D6'), fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#505759' }}>
      <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Icono k={m.iconKey} size={14} />
      </span>
      {m.nombre}
      {quitable ? (
        <button onClick={m.onToggle} title={`Quitar ${m.nombre}`} style={{ marginLeft: '2px', padding: 0, width: '14px', height: '14px', lineHeight: 1, border: 0, background: 'transparent', color: '#8A8F91', fontSize: '13px', cursor: 'pointer' }}>×</button>
      ) : (
        <span style={{ marginLeft: '2px', fontSize: '8px', letterSpacing: '0.08em', color: '#8A8F91' }}>INCL</span>
      )}
    </span>
  );

  // Lo que no cabe hoy: se lista con su costo y con cuánto falta, para que el
  // número de la barra de presupuesto tenga una consecuencia entendible.
  const listaEspera = sinEspacio.length ? (
    <div style={{ marginTop: '18px', padding: '16px 16px 10px', background: '#FBFBFA', border: '1px solid #F0EDE9' }}>
      <p style={{ margin: '0 0 4px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.12em', color: '#A9ADAF', textTransform: 'uppercase' }}>
        Necesitan más espacio del que te queda
      </p>
      <p style={{ margin: '0 0 12px', fontSize: '12px', lineHeight: 1.6, color: '#8A8F91' }}>
        Te quedan {ft2Rest.toLocaleString('es-MX')} ft² habitables libres.
        {liberar ? ` ${liberar.etiqueta} devuelve ${liberar.ft2} ft².` : ''}
      </p>
      {sinEspacio.map((m) => (
        <div key={m.iconKey} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: '1px solid #F0EDE9' }}>
          <span style={{ width: '24px', height: '24px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.45 }}>
            <Icono k={m.iconKey} size={19} />
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: '12.5px', color: '#505759' }}>{m.nombre}</span>
          <span style={{ flex: 'none', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.06em', color: '#B7BABB', textTransform: 'uppercase' }}>
            Faltan {(m.costoLiving - ft2Rest).toLocaleString('es-MX')} ft²
          </span>
        </div>
      ))}
      {liberar ? (
        <button onClick={liberar.onLiberar} className="lgp-hover-zoom" style={{ display: 'block', width: '100%', padding: '13px', margin: '12px 0 6px', background: 'transparent', border: '1px solid #F2004B', color: '#F2004B', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
          {liberar.etiqueta} · +{liberar.ft2} ft²
        </button>
      ) : null}
    </div>
  ) : null;

  return (
    <div>
      {/* Progreso: cuántas decisiones van y cuántas faltan */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', color: '#A9ADAF', textTransform: 'uppercase' }}>
          {total === 0 ? 'Sin espacio libre' : actual ? `Zona ${revisadas + 1} de ${total}` : `${total} de ${total} revisadas`}
        </span>
        <span style={{ display: 'flex', gap: '4px' }}>
          {preguntables.map((m, i) => (
            <span key={m.iconKey} style={{ width: '12px', height: '3px', display: 'block', background: i < revisadas ? '#F2004B' : i === revisadas ? '#1C1E1F' : '#EAE7E3' }} />
          ))}
        </span>
        <button onClick={() => onVerTodas(!verTodas)} style={{ marginLeft: 'auto', padding: '5px 10px', background: 'transparent', border: '1px solid #E4E1DD', color: '#8A8F91', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
          {verTodas ? 'Ver una a la vez' : 'Ver todas'}
        </button>
      </div>

      {/* Lo que ya lleva */}
      {puestas.length || incluidas.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '16px' }}>
          {incluidas.map((m) => chip(m, false))}
          {puestas.map((m) => chip(m, true))}
        </div>
      ) : null}

      {/* La decisión de ahorita */}
      {actual ? (
        <div style={{ background: '#fff', border: '1px solid #EAE7E3', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ padding: '30px 22px 24px', textAlign: 'center', background: '#FBFBFA', borderBottom: '1px solid #F0EDE9' }}>
            <span style={{ display: 'inline-flex', width: '74px', height: '74px', marginBottom: '16px', borderRadius: '14px', background: '#fff', border: '1px solid #EAE7E3', alignItems: 'center', justifyContent: 'center' }}>
              <Icono k={actual.iconKey} size={46} />
            </span>
            <p style={{ margin: '0 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '19px', letterSpacing: '-0.005em' }}>
              {/* Sin artículo: los nombres del catálogo ya son sintagmas
                  ("Zona BBQ", "Walking pantry") y anteponerles "un" chueca la
                  frase en la mitad de los casos. */}
              ¿Agregas {actual.nombre}?
            </p>
            <p style={{ margin: '0 0 12px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', fontSize: '13px', lineHeight: 1.6, color: '#8A8F91' }}>
              {actual.nota || actual.nombreLargo}
            </p>
            <p style={{ margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', letterSpacing: '0.06em', color: '#8A2249', textTransform: 'uppercase' }}>
              {actual.costoLiving === 0
                ? `No usa ft² habitables · te quedan ${ft2Rest.toLocaleString('es-MX')} libres`
                : `Usa ${actual.costoLiving.toLocaleString('es-MX')} ft² · deja ${Math.max(0, ft2Rest - actual.costoLiving).toLocaleString('es-MX')} libres`}
            </p>
            {actual.sustituyeA ? (
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#8A8F91' }}>Sustituye a {actual.sustituyeA}</p>
            ) : null}
          </div>

          {siguientes.length ? (
            <div style={{ padding: '14px 16px 4px' }}>
              <p style={{ margin: '0 0 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', letterSpacing: '0.1em', color: '#A9ADAF', textTransform: 'uppercase' }}>Lo que sigue</p>
              {siguientes.map((m) => (
    <Fragment key={m.iconKey}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', background: '#FBFBFA', border: '1px solid #F0EDE9', marginBottom: '6px' }}>
                  <span style={{ width: '26px', height: '26px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <Icono k={m.iconKey} size={20} />
                  </span>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: '13px' }}>{m.nombre}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#B7BABB' }}>{m.costoLiving} ft²</span>
                </div>
    </Fragment>
    ))}
            </div>
          ) : null}

          <div style={{ padding: '14px 16px 18px' }}>
            <button onClick={() => decidir(true)} className="lgp-hover-zoom" style={{ display: 'block', width: '100%', padding: '15px', marginBottom: '8px', background: '#F2004B', border: 0, color: '#fff', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Sí, agregar
            </button>
            <button onClick={() => decidir(false)} className="lgp-hover-zoom" style={{ display: 'block', width: '100%', padding: '15px', background: 'transparent', border: '1px solid #E4E1DD', color: '#505759', fontFamily: 'Archivo, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}>
              No, gracias
            </button>
          </div>
        </div>
      ) : total === 0 ? (
        /* Nada cabe: en vez de once preguntas con la misma respuesta, se dice
           por qué y se ofrece el único camino real, que es liberar espacio. */
        <div style={{ background: '#fff', border: '1px solid #EAE7E3', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
          <div style={{ padding: '30px 22px 24px', textAlign: 'center', background: '#FBFBFA', borderBottom: '1px solid #F0EDE9' }}>
            <p style={{ margin: '0 0 8px', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '19px', letterSpacing: '-0.005em' }}>
              Tu casa ya usa todo el espacio del lote
            </p>
            <p style={{ margin: '0 auto', maxWidth: '440px', fontSize: '13px', lineHeight: 1.6, color: '#8A8F91' }}>
              El plano con los cuartos que llevas ocupa todos los ft² habitables que
              permite este lote, así que no queda presupuesto para zonas nuevas.
              {sinEspacio.length
                ? ' Abajo está lo que podrías agregar y cuánto espacio te falta para cada cosa.'
                : ' Puedes seguir al brief y platicarlo con el arquitecto.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ padding: '26px 22px', background: '#F4FBF6', border: '1px solid #CFE8D8', textAlign: 'center' }}>
          <p style={{ margin: '0 0 6px', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '15px' }}>Ya viste todas las zonas</p>
          <p style={{ margin: '0 0 14px', fontSize: '13px', lineHeight: 1.6, color: '#6B8F79' }}>
            Llevas {puestas.length} {puestas.length === 1 ? 'agregada' : 'agregadas'} y te quedan {ft2Rest.toLocaleString('es-MX')} ft² habitables libres.
          </p>
          <button onClick={reiniciar} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #CFE8D8', color: '#6B8F79', fontFamily: 'Archivo, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Volver a repasarlas
          </button>
        </div>
      )}

      {listaEspera}
    </div>
  );
}
