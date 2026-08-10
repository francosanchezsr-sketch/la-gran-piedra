'use client';

import FloorplanDiagram from '@/components/FloorplanDiagram';
import type { PlanDiagramKey } from '@/components/FloorplanDiagram';
import { FachadaIcon, ModuloIcon } from '@/components/ConfigIcons';
import { PHOTO_BY_MODULE } from '@/lib/modulePhotos';
import { RENDER_PLAN, ICONO_ZONA } from '@/lib/assets';

export type ZonaEnMesa = { iconKey: string; nombre: string; razon: string | null };

/**
 * La configuración del cliente puesta sobre la mesa del arquitecto: el plano
 * grande abajo, las zonas encimadas como fotos sueltas, los colores como
 * muestras de pintura, y su petición en un papelito pegado.
 *
 * No es un resumen ordenado — para eso está la tabla. Esto es lo que el cliente
 * ve cuando quiere sentir que ya existe algo, y lo que dispara la frase "quiero
 * ver esto en persona".
 *
 * Todo se posiciona en porcentajes sobre un lienzo de proporción fija y las
 * tipografías van en `cqw`, así que la escena se encoge entera y sigue leyéndose
 * igual en un teléfono que en un monitor.
 */

function Hoja({
  left, top, width, rot, z, children, sombra = 'media', fondo = '#fff', padding = '2cqw',
}: {
  left: string; top: string; width: string; rot: number; z: number;
  children: React.ReactNode; sombra?: 'baja' | 'media' | 'alta'; fondo?: string; padding?: string;
}) {
  const sombras = {
    baja: '0 1cqw 2cqw rgba(28,30,31,0.10)',
    media: '0 1.6cqw 3.2cqw rgba(28,30,31,0.16)',
    alta: '0 2.4cqw 4.8cqw rgba(28,30,31,0.20)',
  };
  return (
    <div
      style={{
        position: 'absolute', left, top, width, zIndex: z,
        transform: `rotate(${rot}deg)`,
        background: fondo,
        padding,
        boxShadow: sombras[sombra],
        border: '1px solid rgba(28,30,31,0.07)',
      }}
    >
      {children}
    </div>
  );
}

function Rotulo({ children, tam = '1.15cqw' }: { children: React.ReactNode; tam?: string }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: tam, letterSpacing: '0.12em', color: '#A9ADAF', textTransform: 'uppercase', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export default function MesaArquitecto({
  planKey, planNombre, planMeta,
  loteId, loteMedida,
  fachadaKey, fachadaNombre,
  interior,
  zonas,
  brief,
  ft2Living, ft2Total,
  recamaras, banos,
}: {
  planKey: PlanDiagramKey | null;
  planNombre: string;
  planMeta: string;
  loteId: string;
  loteMedida: string;
  fachadaKey: string | null;
  fachadaNombre: string;
  interior: { nombre: string; c1: string; c2: string; c3: string } | null;
  zonas: ZonaEnMesa[];
  brief: string;
  ft2Living: number;
  ft2Total: number;
  recamaras: number;
  banos: number;
}) {
  const render = planKey ? RENDER_PLAN[planKey] : null;
  // Cuatro caben sin que la mesa se vuelva un tiradero; el resto se cuenta.
  const enMesa = zonas.slice(0, 4);
  const sobran = zonas.length - enMesa.length;

  // Posiciones fijas y a mano: un desorden aleatorio se ve aleatorio, uno
  // compuesto se ve como una mesa de trabajo de verdad.
  //
  // Cada pieza tiene su franja y ninguna pisa el texto de otra. Los papeles se
  // rozan por los bordes —eso es lo que los hace parecer papeles— pero los
  // nombres y las cifras siempre quedan libres. La inclinación es lo que da el
  // desorden; la posición no.
  //
  //   izquierda 3–24%  ·  centro 30–70%  ·  derecha 76–96%
  //   arriba 4–34%     ·  medio 40–70%   ·  abajo 74–96%
  const sitios = [
    { left: '3%', top: '4%', width: '20%', rot: -4.5 },
    { left: '3.5%', top: '40%', width: '20%', rot: 3.5 },
    { left: '76%', top: '4%', width: '20%', rot: 4 },
    { left: '76%', top: '40%', width: '20%', rot: -3 },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 10',
        containerType: 'inline-size',
        overflow: 'hidden',
        // Madera clara con la trama de un tapete de corte: la mesa no compite,
        // solo da a entender que esto está encima de algo.
        background:
          'radial-gradient(120% 90% at 50% 0%, #EFEAE2 0%, #E4DDD2 55%, #D9D1C4 100%)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(rgba(28,30,31,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(28,30,31,0.045) 1px, transparent 1px)',
          backgroundSize: '4cqw 4cqw',
        }}
      />

      {/* El plano: la hoja grande, la que va hasta abajo de todo.
          Sube y se estrecha para dejarle su franja a la ficha y a la paleta.
          Antes la ficha caía encima de su cajetín y tapaba el nombre del plano:
          en un escritorio real los papeles se encimarán, pero el nombre del
          plano es justo lo que nadie tapa. */}
      <Hoja left="30%" top="4%" width="40%" rot={-1.2} z={10} sombra="alta" padding="1.5cqw">
        <div style={{ background: '#FBFBFA', border: '1px solid #F0EDE9', overflow: 'hidden' }}>
          {render ? (
            <img src={render} alt={`Plano ${planNombre}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
          ) : (
            <FloorplanDiagram planKey={planKey ?? 'B'} />
          )}
        </div>
        {/* Cajetín, como en un plano de verdad */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5cqw', marginTop: '1.4cqw', paddingTop: '1.2cqw', borderTop: '1px solid #EAE7E3' }}>
          <div style={{ minWidth: 0 }}>
            <Rotulo>Floorplan</Rotulo>
            <div style={{ marginTop: '0.5cqw', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '2cqw', letterSpacing: '0.01em', textTransform: 'uppercase', color: '#1C1E1F' }}>
              {planNombre}
            </div>
          </div>
          <div style={{ flex: 'none', textAlign: 'right' }}>
            <Rotulo>Lote</Rotulo>
            <div style={{ marginTop: '0.5cqw', fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.4cqw', color: '#505759' }}>{loteId}</div>
          </div>
        </div>
      </Hoja>

      {/* Zonas: fotos sueltas encimadas.
          El icono va SIEMPRE pegado al nombre, en el pie de la foto, no dentro
          del recuadro de imagen. Cuando la zona tiene foto el icono seguía
          siendo lo que la identifica en el resto del configurador, y esconderlo
          rompía el hilo: aquí la zona se llama por su icono y por su nombre a la
          vez, igual que en la lista y en los chips. */}
      {enMesa.map((z, i) => {
        const sitio = sitios[i];
        const foto = PHOTO_BY_MODULE[z.iconKey];
        return (
          <Hoja key={z.iconKey} left={sitio.left} top={sitio.top} width={sitio.width} rot={sitio.rot} z={20 + i} padding="1cqw 1cqw 1.2cqw">
            <div style={{ width: '100%', aspectRatio: '4/3', background: '#F4F1ED', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {foto ? (
                <img src={foto} alt={z.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : ICONO_ZONA[z.iconKey] ? (
                <img src={ICONO_ZONA[z.iconKey]} alt="" aria-hidden="true" style={{ width: '46%', height: '46%', objectFit: 'contain', opacity: 0.28 }} />
              ) : (
                <ModuloIcon moduleKey={z.iconKey} size={26} color="#D5D7D8" />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7cqw', marginTop: '0.9cqw' }}>
              <span style={{ width: '2.1cqw', height: '2.1cqw', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ICONO_ZONA[z.iconKey] ? (
                  <img src={ICONO_ZONA[z.iconKey]} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                ) : (
                  <ModuloIcon moduleKey={z.iconKey} size={14} color="#1C1E1F" />
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '1.15cqw', letterSpacing: '0.07em', textTransform: 'uppercase', color: '#1C1E1F', lineHeight: 1.25 }}>
                {z.nombre}
              </span>
            </div>
          </Hoja>
        );
      })}

      {/* Ficha con los números duros: en su propia franja, debajo del plano */}
      <Hoja left="30%" top="74%" width="25%" rot={2.2} z={40} sombra="media" padding="1.4cqw 1.6cqw">
        <Rotulo>Ficha</Rotulo>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1cqw', marginTop: '0.6cqw' }}>
          <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '2.6cqw', letterSpacing: '-0.01em', color: '#1C1E1F' }}>
            {ft2Living.toLocaleString('es-MX')}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.1cqw', letterSpacing: '0.08em', color: '#8A8F91', textTransform: 'uppercase' }}>ft² habitables</span>
        </div>
        <div style={{ marginTop: '0.7cqw', fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.15cqw', letterSpacing: '0.05em', color: '#505759', textTransform: 'uppercase' }}>
          {recamaras} rec · {banos} baños · {ft2Total.toLocaleString('es-MX')} ft² construidos
        </div>
        <div style={{ marginTop: '0.5cqw', fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.05cqw', color: '#A9ADAF' }}>{loteMedida}</div>
      </Hoja>

      {/* Muestras de color, como abanico de pinturas */}
      {interior ? (
        <Hoja left="57%" top="75%" width="15%" rot={-3.5} z={41} sombra="media" padding="1.1cqw 1.1cqw 1.3cqw">
          <Rotulo>Interior</Rotulo>
          <div style={{ display: 'flex', gap: '0.5cqw', marginTop: '0.8cqw' }}>
            {[interior.c1, interior.c2, interior.c3].map((c, i) => (
              <span key={i} style={{ flex: 1, height: '3.4cqw', background: c, border: '1px solid rgba(28,30,31,0.08)' }} />
            ))}
          </div>
          <div style={{ marginTop: '0.8cqw', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '1.15cqw', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1C1E1F' }}>
            {interior.nombre}
          </div>
        </Hoja>
      ) : null}

      {/* Fachada: al margen del plano, no encima de su cajetín */}
      {fachadaKey ? (
        <Hoja left="76%" top="76%" width="20%" rot={2.8} z={42} sombra="baja" padding="1cqw 1.2cqw 1.2cqw">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1cqw' }}>
            <FachadaIcon styleKey={fachadaKey} size={22} />
            <div style={{ minWidth: 0 }}>
              <Rotulo tam="1cqw">Fachada</Rotulo>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: '1.15cqw', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#1C1E1F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fachadaNombre}
              </div>
            </div>
          </div>
        </Hoja>
      ) : null}

      {/* Su petición, en un papelito pegado: son sus palabras, no las nuestras */}
      {brief.trim() ? (
        <Hoja left="3%" top="74%" width="22%" rot={-2} z={43} sombra="media" fondo="#FDF6D8" padding="1.3cqw 1.4cqw">
          <Rotulo tam="1cqw">Tu petición</Rotulo>
          <p style={{ margin: '0.7cqw 0 0', fontSize: '1.25cqw', lineHeight: 1.5, color: '#5A5330' }}>
            “{brief.trim().slice(0, 120)}{brief.trim().length > 120 ? '…' : ''}”
          </p>
        </Hoja>
      ) : null}

      {sobran > 0 ? (
        <div style={{ position: 'absolute', right: '2.5%', bottom: '2%', zIndex: 50, fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.1cqw', letterSpacing: '0.08em', color: '#8A8F91', textTransform: 'uppercase' }}>
          +{sobran} zona{sobran > 1 ? 's' : ''} más en la ficha
        </div>
      ) : null}

      {/* Se recorta al ancho libre: sin tope se salía del escritorio. */}
      <div style={{ position: 'absolute', left: '2.5%', bottom: '2%', maxWidth: sobran > 0 ? '62%' : '86%', zIndex: 50 }}>
        <Rotulo tam="1.05cqw">{planMeta}</Rotulo>
      </div>
    </div>
  );
}
