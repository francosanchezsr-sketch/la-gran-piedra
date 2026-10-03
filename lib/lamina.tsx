/**
 * LA LÁMINA QUE VIAJA ADJUNTA en el correo del arquitecto.
 *
 * Es la hermana de `components/FichaCasa.tsx` —la lámina que el cliente veía
 * en pantalla— pero NO es el mismo código, y no puede serlo: `FichaCasa` está
 * escrita para el navegador (todo en `cqw`, container queries, `aspectRatio`,
 * sombras) y esto se rasteriza con satori, que solo entiende flexbox y un
 * puñado de propiedades. Traducirla fue la única vía; lo que sí se respeta es
 * la paleta y el orden de lectura, para que el arquitecto reconozca la misma
 * lámina que arma el cliente.
 *
 * DOS LÍMITES DE SATORI QUE MANDAN SOBRE EL DISEÑO:
 *
 * 1. `display` solo puede ser `flex` o `none`. Cualquier div con más de un
 *    hijo lleva `display: flex` explícito o no dibuja.
 * 2. No decodifica webp — por eso los renders se leen de `public/correo/`,
 *    los derivados JPEG que genera `scripts/renders-correo.js`. Si esa
 *    carpeta no existe, la lámina sale sin renders en vez de tronar.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Ficha } from '@/lib/ficha';

const TINTA = '#1C1E1F';
const GRIS = '#6E7375';
const LINEA = '#EAE7E3';
const PAPEL = '#FBFBFA';
const CARMIN = '#F2004B';

export const LAMINA_ANCHO = 1000;
export const LAMINA_ALTO = 1414; // proporción carta, para que se imprima bien

/** Los mismos renders del sitio, en su copia JPEG (ver el comentario de arriba). */
function archivoDe(tipo: 'plan' | 'fachada' | 'interior', clave: string | null): string | null {
  if (!clave) return null;
  if (tipo === 'plan') {
    // TH y D comparten maqueta, igual que en `RENDER_PLAN`.
    const f = clave === 'TH' ? 'D' : clave;
    return `floorplans-${f}.jpg`;
  }
  if (tipo === 'fachada') return `fachadas-${clave}.jpg`;
  return `cocina-paletas-panel-${clave}.jpg`;
}

/** Lee un render y lo deja listo para `<img src>`. Si falta, devuelve null. */
async function dataUri(archivo: string | null): Promise<string | null> {
  if (!archivo) return null;
  try {
    const buf = await readFile(join(process.cwd(), 'public', 'correo', archivo));
    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch {
    // Falta el derivado: se corre `node scripts/renders-correo.js`. Mientras
    // tanto la lámina sale sin ese render, que es mejor que no salir.
    return null;
  }
}

function Rotulo({ children }: { children: string }) {
  return (
    <div style={{ display: 'flex', fontSize: 15, letterSpacing: 2, color: GRIS, textTransform: 'uppercase' }}>{children}</div>
  );
}

/**
 * Una tarjeta de render con su nombre debajo.
 *
 * Cuando no hay imagen el hueco dice "sin render" y NO algo como "sin
 * fachada": en un lote de la subdivisión la fachada está perfectamente
 * definida —la trae el reglamento— y lo único que falta es la maqueta. El
 * nombre de abajo sigue diciendo la verdad.
 */
function Sprite({ src, titulo }: { src: string | null; titulo: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: 296 }}>
      <div style={{ display: 'flex', width: 296, height: 210, background: '#F1EEE9', border: `1px solid ${LINEA}`, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} width={296} height={210} style={{ objectFit: 'cover' }} alt="" />
        ) : (
          <div style={{ display: 'flex', fontSize: 16, color: GRIS }}>sin render</div>
        )}
      </div>
      <div style={{ display: 'flex', marginTop: 8, fontSize: 17, fontWeight: 700, color: TINTA }}>{titulo}</div>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${LINEA}` }}>
      <div style={{ display: 'flex', fontSize: 15, letterSpacing: 1, color: GRIS, textTransform: 'uppercase' }}>{k}</div>
      <div style={{ display: 'flex', fontSize: 18, color: TINTA }}>{v}</div>
    </div>
  );
}

/**
 * El JSX de la lámina. Se separa de la ruta para que se pueda previsualizar
 * sin mandar un correo (ver el GET de `/api/enviar-resumen`).
 */
export async function laminaJSX(f: Ficha, fechaTexto: string) {
  const c = f.claves ?? { plan: null, fachada: null, interior: null };
  const [imgFachada, imgPlan, imgPaleta] = await Promise.all([
    dataUri(archivoDe('fachada', c.fachada)),
    dataUri(archivoDe('plan', c.plan)),
    dataUri(archivoDe('interior', c.interior)),
  ]);

  const zonasTexto = f.zonas.length ? f.zonas.map((z) => z.nombre).join(' · ') : 'Ninguna';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PAPEL, padding: 56, color: TINTA }}>
      {/* CABECERA: de quién es esta casa y cuándo se armó. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 18, borderBottom: `3px solid ${TINTA}` }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 16, letterSpacing: 3, color: CARMIN, textTransform: 'uppercase' }}>La Gran Piedra</div>
          <div style={{ display: 'flex', fontSize: 42, fontWeight: 700, marginTop: 6 }}>{f.cliente.nombre || 'Sin nombre'}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 15, color: GRIS }}>{fechaTexto}</div>
      </div>

      {/* LOS TRES RENDERS, en el mismo orden que en el configurador. */}
      <div style={{ display: 'flex', gap: 26, marginTop: 30 }}>
        <Sprite src={imgFachada} titulo={f.fachada} />
        <Sprite src={imgPlan} titulo={f.plan.nombre} />
        <Sprite src={imgPaleta} titulo={f.interior.nombre} />
      </div>

      {/* LOS NÚMEROS. */}
      <div style={{ display: 'flex', gap: 40, marginTop: 34 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 430 }}>
          <Rotulo>Tu lote</Rotulo>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
            <Dato k="Lote" v={f.lote.id} />
            <Dato k="Medida" v={f.lote.medida} />
            <Dato k="Orientación" v={f.lote.orientacion} />
            {f.lote.ubicacion ? <Dato k="Ubicación" v={f.lote.ubicacion} /> : null}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: 430 }}>
          <Rotulo>Programa</Rotulo>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
            <Dato k="Recámaras" v={String(f.cuartos.recamaras)} />
            <Dato k="Baños" v={String(f.cuartos.banos)} />
            <Dato k="Cochera" v={f.garage} />
            <Dato k="Habitable" v={`${f.totales.living.toLocaleString('es-MX')} de ${f.presupuesto.maxLiving.toLocaleString('es-MX')} ft²`} />
          </div>
        </div>
      </div>

      {/* ÁREAS ADICIONALES — el mismo nombre que ve el cliente en pantalla.
          Con sus ft² al lado: en la lámina el arquitecto las lee de un
          vistazo, y es lo que va a acomodar sobre el plano. */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
        <Rotulo>Áreas adicionales</Rotulo>
        {f.zonas.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
            {f.zonas.map((z) => (
              <div key={z.nombre} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${LINEA}` }}>
                <div style={{ display: 'flex', fontSize: 18, color: TINTA }}>
                  {z.nombre}{z.exterior ? '  ·  exterior' : ''}{z.incluida ? '  ·  incluida' : ''}
                </div>
                <div style={{ display: 'flex', fontSize: 18, color: z.exterior ? GRIS : TINTA }}>
                  {z.exterior ? '0 ft² habitables' : `${z.ft2.toLocaleString('es-MX')} ft²`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', marginTop: 10, fontSize: 19, color: GRIS }}>{zonasTexto}</div>
        )}
      </div>

      {/* EL PRESUPUESTO, cuadrado: de dónde salió cada pie cuadrado. Es la
          cuenta que el configurador le fue enseñando al cliente, para que el
          arquitecto vea el mismo desglose y no tenga que rehacerlo. */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26 }}>
        <Rotulo>Cómo se reparte</Rotulo>
        <div style={{ display: 'flex', gap: 40, marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 430 }}>
            <Dato k="Tope del lote" v={`${f.presupuesto.maxLiving.toLocaleString('es-MX')} ft²`} />
            <Dato k="Floorplan" v={`${f.presupuesto.plan.toLocaleString('es-MX')} ft²`} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: 430 }}>
            <Dato k="Cuartos" v={`${f.presupuesto.cuartos.toLocaleString('es-MX')} ft²`} />
            <Dato k="Libre" v={`${f.presupuesto.libre.toLocaleString('es-MX')} ft²`} />
          </div>
        </div>
      </div>

      {/* EL BRIEF, tal cual lo escribió. Es lo único de la lámina con sus
          palabras, así que va entrecomillado y con su propio bloque. */}
      {f.brief.trim() ? (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30, padding: 22, background: '#F7F5F2', borderLeft: `4px solid ${CARMIN}` }}>
          <Rotulo>Lo que pidió</Rotulo>
          <div style={{ display: 'flex', marginTop: 10, fontSize: 19, lineHeight: 1.5 }}>{`“${f.brief.trim()}”`}</div>
        </div>
      ) : null}

      {/* PIE: cómo contestarle. */}
      <div style={{ display: 'flex', marginTop: 'auto', paddingTop: 20, borderTop: `1px solid ${LINEA}`, justifyContent: 'space-between', fontSize: 16, color: GRIS }}>
        <div style={{ display: 'flex' }}>{[f.cliente.correo, f.cliente.tel].filter(Boolean).join('  ·  ') || 'Sin contacto'}</div>
        <div style={{ display: 'flex' }}>{`${f.totales.construido.toLocaleString('es-MX')} ft² construidos`}</div>
      </div>
    </div>
  );
}
