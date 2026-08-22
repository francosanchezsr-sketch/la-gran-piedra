'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  LOTES,
  PLANES,
  EXTRAS,
  REGLAS_LOTE,
  FACHADAS,
  INTERIORES,
  MODULOS,
  livingDeModulo,
  RETIROS_DEFAULT,
  huellaConstruible,
  GARAGE_2_AUTOS,
  GARAGE_1_AUTO,
  GARAGE_2_TOWNHOUSE,
  PORCHE,
  FAQS,
  NAV,
  PASO_NOMBRES,
  PASO_HINTS,
  SUBDIVISIONES,
  whatsappHref,
} from '@/lib/data';
import type { SubdivisionKey, Lote } from '@/lib/data';
import type { Ficha } from '@/lib/ficha';
import { leerGuardado, escribirGuardado, borrarGuardado, valeLaPenaRetomar, type ConfigGuardada } from '@/lib/guardado';
import HeroLoopVideo from '@/components/HeroLoopVideo';
import { ModuloIcon } from '@/components/ConfigIcons';
import MoodboardCollage from '@/components/MoodboardCollage';
import MesaArquitecto from '@/components/MesaArquitecto';
import VentanaEnfocada from '@/components/VentanaEnfocada';
import TiraObra from '@/components/TiraObra';
import CarruselSubdivision from '@/components/CarruselSubdivision';
import PlanDiagram from '@/components/FloorplanDiagram';
import PresupuestoBar from '@/components/PresupuestoBar';
import RetirosDiagrama from '@/components/RetirosDiagrama';
import ZonasGuiadas from '@/components/ZonasGuiadas';
import ZonasPanel from '@/components/ZonasPanel';
import PasoDecision from '@/components/PasoDecision';
import { useAnimacionAlterna } from '@/components/DecisionUI';
import { RENDER_PLAN, RENDER_FACHADA, RENDER_FACHADA_MINI, RENDER_PALETA, ICONO_ZONA, ICONO_TRAGALUZ } from '@/lib/assets';
import { PHOTO_BY_MODULE } from '@/lib/modulePhotos';

// El logo de WhatsApp. Va como trazo y no como imagen para que herede el color
// del botón: en fantasma el hover invierte el relleno, y un PNG verde ahí se
// vería pegado encima en vez de formar parte del botón.
function WhatsappGlifo({ tam = 15 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{flex: 'none'}}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

type PlanKey = keyof typeof PLANES;
type Sugerencia = { key: string; razon: string | null };
type Lead = { nombre: string; correo: string; tel: string };

// La pantalla de captura de lote propio. Va antes del paso 1, así que se
// numera 0: el cliente que llega con su terreno lo resuelve aquí y entra al
// configurador por donde entra todo el mundo, el floorplan.
const PREVIA = 0;
// Número interno del paso de fachada. Se nombra porque es el único que puede
// salirse del recorrido (ver `fachadaFija`).
const FACHADA_PASO = 2;

// El enlace de WhatsApp no cambia durante la sesión: se resuelve una vez, al
// cargar el módulo. Si no hay número configurado (ver WHATSAPP en lib/data),
// en producción no se dibuja nada; en desarrollo se deja el botón apagado
// diciendo qué falta, que es la única forma de que el pendiente se vea.
const WA_HREF = whatsappHref();
const WA_PENDIENTE = !WA_HREF && process.env.NODE_ENV !== 'production';

// Tope de tragaluces en una misma casa.
const MAX_TRAGALUCES = 3;

function cardStyle(on: boolean, extra?: Record<string, any>): Record<string, any> {
  return {
    display: 'block', width: '100%', textAlign: 'left', border: 0,
    background: on ? '#FFF6F8' : '#fff',
    boxShadow: on ? 'inset 0 0 0 2px #F2004B' : 'none',
    padding: '18px 18px 20px', cursor: 'pointer', font: 'inherit', color: '#1C1E1F',
    transition: 'background .15s ease',
    ...(extra || {}),
  };
}

export default function HomeConfigurator() {
  const bgRef = useRef<HTMLDivElement | null>(null);

  /**
   * Marca una razón como visible cuando entra en pantalla, para que las tres
   * se escalonen al llegar en vez de estar ya puestas desde arriba.
   *
   * Es un `ref` de callback y no un efecto con `querySelectorAll` porque así
   * funciona aunque el nodo se monte más tarde. La animación arranca solo con
   * `data-visible="1"`: si el observador no existe o el script falla, las
   * razones se quedan visibles y legibles, que es el estado por defecto —
   * nunca al revés.
   */
  const observarRazon = useCallback((nodo: HTMLDivElement | null) => {
    if (!nodo || typeof IntersectionObserver === 'undefined') return;
    if (nodo.dataset.visible === '1') return;
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.visible = '1';
          obs.unobserve(e.target);
        });
      },
      // Un poco antes de que asome del todo: si espera al borde exacto, la
      // animación ocurre fuera de la vista y el cliente solo ve el resultado.
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(nodo);
  }, []);
  // Id del lote con el que se armó la configuración actual, para distinguir
  // "cambió de lote" de "recalculó el mismo lote".
  const loteAnteriorRef = useRef<string | null>(null);

  const [paso, setPaso] = useState(1);
  const [lote, setLote] = useState<Lote | null>(null);
  const [plan, setPlan] = useState<PlanKey | null>(null);
  const [fachada, setFachada] = useState<string | null>(null);
  const [interior, setInterior] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [modulos, setModulos] = useState<string[]>([]);
  const [sugeridos, setSugeridos] = useState<Sugerencia[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // Acuse de que el brief se leyó: qué entendió, qué zonas propone y cuánto
  // presupuesto se llevarían.
  const [briefLectura, setBriefLectura] = useState<{
    texto: string; zonas: string[]; impacto: number; automatico: boolean;
  } | null>(null);
  const [lead, setLead] = useState<Lead>({ nombre: '', correo: '', tel: '' });
  const [faqOpen, setFaqOpen] = useState<number[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [envioError, setEnvioError] = useState<string | null>(null);
  // Cita rápida del header: es un camino aparte del configurador, porque quien
  // pulsa "Agenda una cita" normalmente todavía no ha elegido lote ni floorplan.
  const [citaEnviada, setCitaEnviada] = useState(false);
  const [citaEnviando, setCitaEnviando] = useState(false);
  const [citaError, setCitaError] = useState<string | null>(null);
  const citaNombreRef = useRef<HTMLInputElement | null>(null);
  const [moduloIdx, setModuloIdx] = useState(0);
  // La ventana enfocada donde vive el configurador. La página de inicio solo
  // decide con qué lote se entra.
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  // Quién abrió la ventana: quien llega por "ya tengo mi lote" no quiere ver
  // primero el catálogo de la subdivisión, quiere subir su plano.
  const [entradaPropia, setEntradaPropia] = useState(false);
  const [tragaluces, setTragaluces] = useState<string[]>([]);
  const [subdivisionKey, setSubdivisionKey] = useState<SubdivisionKey>(SUBDIVISIONES[0].key);
  // Mientras no exista el archivo real de la foto de entrada, se cae al
  // marcador — sin esto, un 404 se vería como una imagen rota.
  const subdivisionActiva = SUBDIVISIONES.find((s) => s.key === subdivisionKey) ?? SUBDIVISIONES[0];
  const [recamarasExtra, setRecamarasExtra] = useState(0);
  const [banosExtra, setBanosExtra] = useState(0);
  // Dimmer del paso 1: área habitable objetivo del floorplan. null = el tamaño
  // de fábrica del plan. Solo aplica en lotes donde el plano no viene fijo.
  const [planLivingSel, setPlanLivingSel] = useState<number | null>(null);
  const [dimmerModo, setDimmerModo] = useState<'living' | 'total'>('living');
  // Paso 4: preguntar una zona a la vez, o mostrar el catálogo completo.
  const [verTodasZonas, setVerTodasZonas] = useState(false);
  const [lotePropio, setLotePropio] = useState<Lote | null>(null);
  const [loteFile, setLoteFile] = useState<{ nombre: string; dataUrl: string; mime: string; peso: number } | null>(null);
  // Dirección que el usuario ya nos dio, aunque el análisis no haya corrido.
  const [loteTextoCapturado, setLoteTextoCapturado] = useState<string | null>(null);
  const [loteLoading, setLoteLoading] = useState(false);
  const [loteError, setLoteError] = useState<string | null>(null);
  // 'info' = la vía manual sigue disponible (no pasó nada malo);
  // 'error' = el usuario tiene que corregir algo.
  const [loteErrorTipo, setLoteErrorTipo] = useState<'info' | 'error'>('error');
  const [loteAnalisis, setLoteAnalisis] = useState<{
    frente: number | null; fondo: number | null; areaLote: number;
    huella?: number; maxLiving?: number; factor?: number;
    confianza: string; nota: string; fuente: string;
    direccion?: string | null; coordenadas?: string | null;
  } | null>(null);
  // Tres maneras de traer un lote propio: plano (PDF o imagen), medidas a mano
  // o una descripción con dirección/coordenadas.
  const [loteModo, setLoteModo] = useState<'plano' | 'medidas' | 'texto'>('plano');
  const [loteTexto, setLoteTexto] = useState('');
  const [loteFrente, setLoteFrente] = useState('');
  const [loteFondo, setLoteFondo] = useState('');
  // Retiros editables: el cálculo de superficie construible sale de aquí, y
  // varían por municipio, así que el usuario los puede corregir.
  const [retiros, setRetiros] = useState(RETIROS_DEFAULT);
  // Garage de 2 autos: es la pieza no habitable que más mueve el cálculo.
  const [garage2, setGarage2] = useState(true);
  // Ubicación capturada cuando la descripción traía dirección pero no medidas.
  const [loteUbicacion, setLoteUbicacion] = useState<{ direccion: string | null; coordenadas: string | null } | null>(null);

  // --- Guardado de la configuración ---------------------------------------
  // `hidratado` evita que el primer render, con todo vacío, pise lo que el
  // cliente traía guardado de su visita anterior.
  const [hidratado, setHidratado] = useState(false);
  const [retomable, setRetomable] = useState<ConfigGuardada | null>(null);

  useEffect(() => {
    const g = leerGuardado();
    if (valeLaPenaRetomar(g)) setRetomable(g);
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    escribirGuardado({
      paso,
      loteId: lote && lote.origen !== 'usuario' ? lote.id : null,
      lotePropio,
      plan,
      fachada,
      interior,
      modulos,
      tragaluces,
      recamarasExtra,
      banosExtra,
      planLivingSel,
      garage2,
      brief,
      lead,
    });
  }, [hidratado, paso, lote, lotePropio, plan, fachada, interior, modulos, tragaluces, recamarasExtra, banosExtra, planLivingSel, garage2, brief, lead]);

  // Retomar es decisión del cliente, no del sitio: restaurarle solo la
  // configuración sin avisar es tan desconcertante como haberla perdido.
  const retomar = () => {
    const g = retomable;
    if (!g) return;
    const delCatalogo = g.loteId ? (LOTES.find((l) => l.id === g.loteId) as unknown as Lote | undefined) : undefined;
    const suyo = g.lotePropio ?? null;
    const restaurado = suyo ?? delCatalogo ?? null;
    if (suyo) setLotePropio(suyo);
    setLote(restaurado);
    setPlan((g.plan as PlanKey | null) ?? null);
    setFachada(g.fachada);
    // Las cuatro gamas viejas se fueron cuando entraron las seis paletas con
    // maqueta. Un guardado de antes trae una `key` que ya no existe: sin este
    // filtro el paso arrancaría con "algo elegido" que no se puede ver ni
    // quitar, y la guía saltaría la etapa de la paleta creyéndola resuelta.
    setInterior(g.interior && INTERIORES.some((i) => i.key === g.interior) ? g.interior : null);
    setModulos(g.modulos ?? []);
    setTragaluces(g.tragaluces ?? []);
    setRecamarasExtra(g.recamarasExtra ?? 0);
    setBanosExtra(g.banosExtra ?? 0);
    setPlanLivingSel(g.planLivingSel ?? null);
    setGarage2(g.garage2 ?? true);
    setBrief(g.brief ?? '');
    setLead(g.lead ?? { nombre: '', correo: '', tel: '' });
    setPaso(g.paso && g.paso >= 1 && g.paso <= PASO_NOMBRES.length ? g.paso : 1);
    setRetomable(null);
    setVentanaAbierta(true);
  };
  const descartarGuardado = () => {
    borrarGuardado();
    setRetomable(null);
  };

  // Reglas del lote activo. Sin lote todavía no se restringe nada.
  const reglas = lote ? REGLAS_LOTE[lote.tipo] : null;
  const planFijo = lote?.planFijo ?? null;
  // En los lotes de la subdivisión la fachada viene con la casa: el paso 2 no
  // se muestra apagado, se sale del recorrido y el contador pasa de 6 a 5.
  const fachadaFija = Boolean(reglas?.fachadaFija);
  const lotePropioActivo = lote?.origen === 'usuario';

  // hexagon particle background (canvas), ported from the prototype
  useEffect(() => {
    const host = bgRef.current;
    if (!host) return;

    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d')!;

    const S = 46, W = S * Math.cos(Math.PI / 6);
    const FACES = [
      { rgb: [255, 255, 255], k: 0.14, pts: [[0, -S], [W, -S / 2], [0, 0], [-W, -S / 2]] },
      { rgb: [238, 238, 238], k: 0.36, pts: [[-W, -S / 2], [0, 0], [0, S], [-W, S / 2]] },
      { rgb: [229, 229, 229], k: 0.24, pts: [[W, -S / 2], [0, 0], [0, S], [W, S / 2]] },
    ];
    const SIG2 = 2 * 158 * 158;
    const ball = { x: -9e3, y: -9e3, tx: -9e3, ty: -9e3, amp: 0, target: 0, last: 0 };
    let cw = 0, ch = 0, dpr = 1, cubes: number[][] = [], flat: HTMLCanvasElement | null = null;

    const paint = (c: CanvasRenderingContext2D, withBall: boolean) => {
      c.globalAlpha = 1;
      c.fillStyle = '#FBFBFA';
      c.fillRect(0, 0, cw, ch);
      c.globalAlpha = 0.42;
      const bx = ball.x, by = ball.y, amp = ball.amp;
      for (let i = 0; i < cubes.length; i++) {
        const ox = cubes[i][0], oy = cubes[i][1];
        for (let f = 0; f < 3; f++) {
          const F = FACES[f], p = F.pts;
          let bAvg = 0;
          c.beginPath();
          for (let v = 0; v < 4; v++) {
            let x = ox + p[v][0], y = oy + p[v][1];
            if (withBall) {
              const dx = x - bx, dy = y - by;
              const b = amp * Math.exp(-(dx * dx + dy * dy) / SIG2);
              bAvg += b;
              x -= dx * b * 0.26;
              y -= dy * b * 0.26 - b * 7;
            }
            if (v === 0) c.moveTo(x, y); else c.lineTo(x, y);
          }
          c.closePath();
          let g = 1;
          if (withBall) {
            const b = bAvg / 4;
            g = 1 - F.k * b + 0.075 * Math.sin(b * Math.PI);
          }
          const r = F.rgb;
          c.fillStyle = 'rgb(' + ((r[0] * g) | 0) + ',' + ((r[1] * g) | 0) + ',' + ((r[2] * g) | 0) + ')';
          c.fill();
        }
      }
      c.globalAlpha = 1;
    };

    const build = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cw = host.clientWidth || window.innerWidth;
      ch = host.clientHeight || window.innerHeight;
      // Si el anfitrión todavía no tiene caja —primer montaje, pestaña en
      // segundo plano, ventana de 0px— `flat` saldría de 0×0 y `drawImage`
      // lanza InvalidStateError. Se sale y ya volverá el observador de tamaño.
      if (cw < 1 || ch < 1) { cubes = []; flat = null; return; }
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dx = 2 * W, dy = 1.5 * S;
      cubes = [];
      for (let r = -1; r * dy < ch + dy * 2; r++) {
        for (let c = -1; c * dx < cw + dx * 2; c++) {
          cubes.push([c * dx + (Math.abs(r % 2) ? W : 0), r * dy]);
        }
      }
      flat = document.createElement('canvas');
      flat.width = cv.width; flat.height = cv.height;
      const fc = flat.getContext('2d')!;
      fc.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(fc, false);
      ctx.drawImage(flat, 0, 0, cw, ch);
    };

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, idle = true;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (Date.now() - ball.last > 220) ball.target = 0;
      ball.x += (ball.tx - ball.x) * 0.17;
      ball.y += (ball.ty - ball.y) * 0.17;
      ball.amp += (ball.target - ball.amp) * 0.09;
      if (ball.amp < 0.004) {
        if (!idle && flat) { ctx.drawImage(flat, 0, 0, cw, ch); idle = true; }
        return;
      }
      idle = false;
      paint(ctx, true);
    };

    const onMove = (e: PointerEvent) => {
      const over = document.elementFromPoint(e.clientX, e.clientY);
      if (over && over.closest && over.closest('[data-nofx]')) {
        ball.target = 0;
        ball.last = 0;
        return;
      }
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (ball.amp < 0.01) { ball.x = x; ball.y = y; }
      ball.tx = x; ball.ty = y;
      ball.target = 1;
      ball.last = Date.now();
    };
    const onResize = () => { build(); idle = true; };

    build();
    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true });
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      host.removeChild(cv);
    };
  }, []);

  // Al cambiar de lote se reaplican las reglas de su subdivisión: se fija el
  // floorplan si el lote lo trae por default, se descarta el que ya no aplique
  // y se sueltan las zonas que el reglamento prohíbe en ese tipo de lote.
  //
  // Si además es OTRO lote (no el mismo recalculado), la configuración de
  // zonas y cuartos arranca de cero: el presupuesto cambió por completo y
  // arrastrar lo elegido antes se ve como si la app hubiera puesto zonas solas.
  useEffect(() => {
    if (!lote) return;
    const r = REGLAS_LOTE[lote.tipo];
    if (lote.planFijo) {
      setPlan(lote.planFijo as PlanKey);
    } else {
      setPlan((p) => (p && r.planes.includes(p) ? p : null));
    }

    // Si el lote nuevo trae la fachada puesta, la que el cliente hubiera
    // elegido antes deja de existir: arrastrarla dejaría en el resumen y en la
    // ficha del arquitecto un estilo que este lote no admite. Y si está parado
    // justo en ese paso, se le pasa al siguiente en vez de dejarlo en una
    // pantalla que ya no es parte de su recorrido.
    if (r.fachadaFija) {
      setFachada(null);
      setPaso((p) => (p === FACHADA_PASO ? FACHADA_PASO + 1 : p));
    }

    const cambioDeLote = loteAnteriorRef.current !== null && loteAnteriorRef.current !== lote.id;
    loteAnteriorRef.current = lote.id;

    if (cambioDeLote) {
      setModulos([]);
      setRecamarasExtra(0);
      setBanosExtra(0);
      setTragaluces([]);
    } else if (r.zonasBloqueadas.length) {
      setModulos((prev) => prev.filter((k) => !r.zonasBloqueadas.includes(k)));
    }

    // El dimmer se recalibra: su rango depende del máximo habitable del lote.
    setPlanLivingSel(null);
    setSugeridos(null);
  }, [lote]);

  // Al cambiar de floorplan se sueltan las zonas que ya no le quedan: un balcón
  // en una casa de un piso, o un master al patio en un plano que no lo tiene.
  useEffect(() => {
    if (!plan) return;
    const p = PLANES[plan];
    setModulos((prev) => prev.filter((k) => {
      const m = MODULOS.find((x) => x.key === k);
      if (!m) return false;
      if (m.minPisos && p.pisos < m.minPisos) return false;
      if (m.soloEnPlanes && !m.soloEnPlanes.includes(plan)) return false;
      return true;
    }));
  }, [plan]);

  // ¿Otra zona del mismo grupo desplazó a la que el plano traía de fábrica?
  // (elegir cocina cerrada sustituye a la cocina abierta incluida)
  function grupoSustituido(key: string) {
    const m = MODULOS.find((x) => x.key === key);
    if (!m?.grupo) return false;
    return modulos.some((k) => {
      if (k === key) return false;
      return MODULOS.find((x) => x.key === k)?.grupo === m.grupo;
    });
  }

  // Una zona está "incluida" si el plano ya la trae y nadie la sustituyó.
  function esIncluida(key: string) {
    if (!plan) return false;
    const incluidas = PLANES[plan].incluidas as readonly string[];
    return incluidas.includes(key) && !grupoSustituido(key);
  }

  // Costo real de una zona en área habitable. Si el plano ya la incluye no se
  // cobra; si sustituye a una incluida del mismo grupo solo se cobra la
  // diferencia (cocina cerrada sobre cocina abierta = 224 − 168 = 56 ft²).
  function costoZona(m: (typeof MODULOS)[number]) {
    if (!plan) return livingDeModulo(m);
    const incluidas = PLANES[plan].incluidas as readonly string[];
    if (incluidas.includes(m.key)) return 0;
    if (m.grupo) {
      const sustituida = MODULOS.find((x) => x.grupo === m.grupo && incluidas.includes(x.key));
      if (sustituida) return livingDeModulo(m) - livingDeModulo(sustituida);
    }
    return livingDeModulo(m);
  }

  // Presupuesto en área habitable: es lo único que topa la subdivisión. Garage,
  // pórtico, patio y balcón quedan fuera (ver livingDeModulo y PLANES.living).
  // recamarasExtra/banosExtra pueden ser negativos: quitar un cuarto devuelve
  // sus ft² al presupuesto, que es como se cambia una recámara por otra zona.
  // Área habitable que consume el floorplan: la que el usuario ajustó con el
  // dimmer, o el tamaño de fábrica del plan si no lo ha tocado.
  function livingDelPlan() {
    if (!plan) return 0;
    if (planFijo) return PLANES[plan].living;
    return planLivingSel ?? PLANES[plan].living;
  }

  function livingDeZonas() {
    return modulos.reduce((s, k) => {
      const m = MODULOS.find((x) => x.key === k);
      return s + (m ? costoZona(m) : 0);
    }, 0);
  }

  function livingDeCuartos() {
    return recamarasExtra * EXTRAS.recamara.living + banosExtra * EXTRAS.bano.living;
  }

  const garageFt = garage2 ? GARAGE_2_AUTOS : GARAGE_1_AUTO;

  // Máximo habitable del lote. En un lote propio con huella calculada sale de
  // la construcción real: huella x pisos del plan, menos garage y pórtico, que
  // ocupan planta baja pero no son habitables. En los lotes del catálogo es el
  // tope que fija la subdivisión.
  function maxLivingLote() {
    if (!lote) return 0;
    if (lote.huella && plan) {
      const pisos = PLANES[plan].pisos;
      return Math.max(0, lote.huella * pisos - garageFt - PORCHE);
    }
    return lote.maxLiving;
  }

  function ft2Restantes() {
    if (!lote) return 0;
    return Math.max(0, maxLivingLote() - livingDelPlan() - livingDeZonas() - livingDeCuartos());
  }

  async function runAI() {
    if (!lote) { setAiError('Primero captura tu lote.'); return; }
    setAiLoading(true);
    setAiError(null);
    const disponibles = ft2Restantes();
    try {
      const res = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          lote,
          plan: plan ? PLANES[plan] : null,
          disponibles,
          catalogo: MODULOS,
        }),
      });
      if (!res.ok) throw new Error('bad response');
      const data = (await res.json()) as { lectura?: string; zonas?: Sugerencia[]; impacto?: number | null };
      // Una lista vacía es una respuesta válida: significa que su petición no
      // pide zonas nuevas, sino que la escuche el arquitecto.
      const val = (data.zonas ?? [])
        .filter((x) => MODULOS.some((k) => k.key === x.key))
        .filter((x) => !modulos.includes(x.key));
      if (!data.lectura && !val.length) throw new Error('vacio');
      if (val.length) setSugeridos(val);
      // El acuse de lectura es lo que le confirma al cliente que su brief sí
      // se analizó, en vez de dejarlo adivinando.
      setBriefLectura({
        texto: data.lectura ?? '',
        zonas: val.map((z) => MODULOS.find((m) => m.key === z.key)?.corto ?? z.key),
        impacto: typeof data.impacto === 'number' ? data.impacto : val.reduce((s, z) => s + (MODULOS.find((m) => m.key === z.key)?.min ?? 0), 0),
        automatico: true,
      });
      setAiLoading(false);
    } catch {
      // Sin análisis no se inventan sugerencias: marcar zonas que el cliente
      // nunca pidió sería peor que decirle que no se pudo analizar.
      setBriefLectura({
        texto: 'No se pudo analizar tu petición automáticamente ahora mismo. Queda guardada tal cual y el arquitecto la lee completa antes de la cita.',
        zonas: [],
        impacto: 0,
        automatico: false,
      });
      setAiLoading(false);
    }
  }

  // Pantalla previa — el usuario trae su propio lote (plano en imagen o PDF).
  // La IA lee las cotas y de ahí sale el presupuesto habitable del lote.
  function onLoteFile(e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoteError(null);
    if (file.size > 8 * 1024 * 1024) {
      setLoteErrorTipo('error'); setLoteError('El archivo pesa más de 8 MB. Sube una versión más ligera.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      // El archivo se guarda antes de analizarlo: aunque el análisis falle,
      // el usuario tiene que ver que su documento sí quedó cargado.
      setLoteFile({ nombre: file.name, dataUrl, mime: file.type, peso: file.size });
      analizarLote({ dataUrl, mime: file.type, nombre: file.name });
    };
    reader.onerror = () => { setLoteErrorTipo('error'); setLoteError('No se pudo leer el archivo.'); };
    reader.readAsDataURL(file);
  }

  function pesoLegible(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Lote propio: fuera de la subdivisión, así que no carga la restricción
  // townhouse y se le abren los tres floorplans.
  function aplicarLotePropio(data: {
    frente: number | null; fondo: number | null; areaLote: number;
    huella?: number; maxLiving?: number;
    confianza: string; nota: string; fuente: string;
    direccion?: string | null; coordenadas?: string | null;
  }) {
    // Si tenemos frente y fondo calculamos la huella real con los retiros; si
    // el análisis solo devolvió el área, caemos al factor de ocupación.
    const huella = data.huella
      ?? (data.frente && data.fondo ? huellaConstruible(data.frente, data.fondo, retiros) : undefined);
    const propio: Lote = {
      id: 'Tu lote',
      x: 0, y: 0, w: 0, h: 0,
      frente: data.frente ? `${data.frente} ft` : '—',
      fondo: data.fondo ? `${data.fondo} ft` : '—',
      orient: 'Por definir',
      maxft: Math.round(data.areaLote),
      // maxLiving definitivo lo calcula el paso 1 con los pisos y el garage.
      maxLiving: data.maxLiving ?? (huella ? huella : Math.round(data.areaLote * 0.5)),
      pisos: 'hasta 2 pisos',
      tipo: 'libre',
      status: 'disponible',
      origen: 'usuario',
      fuente: data.fuente,
      frenteFt: data.frente ?? undefined,
      fondoFt: data.fondo ?? undefined,
      retiros: huella ? retiros : undefined,
      huella,
    };
    setLotePropio(propio);
    setLote(propio);
    setLoteAnalisis(data);
    setLoteUbicacion(
      data.direccion || data.coordenadas
        ? { direccion: data.direccion ?? null, coordenadas: data.coordenadas ?? null }
        : null,
    );
  }

  async function analizarLote(payload: { dataUrl?: string; mime?: string; nombre?: string; texto?: string }) {
    setLoteLoading(true);
    setLoteError(null);
    try {
      const res = await fetch('/api/analizar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // Si vino ubicación pero no medidas, la guardamos y mandamos al modo
        // manual en vez de perder lo que el usuario ya escribió.
        if (data?.error === 'solo_ubicacion' && data?.ubicacion) {
          setLoteUbicacion(data.ubicacion);
          setLoteModo('medidas');
        }
        // Sin llave de IA, la captura manual es la única vía que funciona:
        // mandamos ahí en lugar de dejar al usuario atorado en la pestaña.
        if (res.status === 501) setLoteModo('medidas');
        setLoteErrorTipo(res.status === 501 || data?.error === 'solo_ubicacion' ? 'info' : 'error');
        setLoteError(
          res.status === 501
            ? 'El análisis automático todavía no está activo. Captura el frente y el fondo de tu lote y seguimos igual.'
            : (data?.detalle ?? 'No se pudo analizar. Revisa que se vean las cotas del lote.'),
        );
        setLoteLoading(false);
        return;
      }
      aplicarLotePropio(data);
      setLoteLoading(false);
    } catch {
      setLoteErrorTipo('error'); setLoteError('No se pudo analizar. Intenta de nuevo.');
      setLoteLoading(false);
    }
  }

  // Captura manual: no pasa por la IA, así que es la vía más confiable y la
  // única que funciona sin API key configurada.
  function aplicarMedidasManuales() {
    const f = parseFloat(loteFrente.replace(',', '.'));
    const d = parseFloat(loteFondo.replace(',', '.'));
    if (!Number.isFinite(f) || !Number.isFinite(d) || f <= 0 || d <= 0) {
      setLoteErrorTipo('error'); setLoteError('Escribe el frente y el fondo en pies, con números mayores a cero.');
      return;
    }
    const area = f * d;
    if (area < 1200 || area > 40000) {
      setLoteErrorTipo('error'); setLoteError(`Esas medidas dan ${Math.round(area).toLocaleString('es-MX')} ft², fuera del rango de un lote residencial (1,200 – 40,000 ft²). Revísalas.`);
      return;
    }
    const huella = huellaConstruible(f, d, retiros);
    if (huella < 400) {
      setLoteErrorTipo('error');
      setLoteError(`Con esos retiros solo quedan ${huella.toLocaleString('es-MX')} ft² construibles en planta baja — no alcanza para una casa. Revisa las medidas o los retiros.`);
      return;
    }
    setLoteError(null);
    aplicarLotePropio({
      frente: f, fondo: d,
      areaLote: Math.round(area),
      huella,
      confianza: 'alta',
      nota: `Huella construible calculada con retiros de ${retiros.frente}' al frente, ${retiros.fondo}' al fondo y ${retiros.lados}' a cada lado.`,
      fuente: 'medidas capturadas a mano',
      direccion: loteUbicacion?.direccion ?? null,
      coordenadas: loteUbicacion?.coordenadas ?? null,
    });
  }

  // El lote del usuario y los del catálogo son excluyentes: elegir uno del
  // selector deja el subido en pausa, no lo borra, para poder regresar a él.
  function usarLotePropio() {
    if (lotePropio) setLote(lotePropio);
  }

  function quitarLotePropio() {
    setLotePropio(null);
    setLoteFile(null);
    setLoteAnalisis(null);
    setLoteError(null);
    setLoteUbicacion(null);
    setLoteTexto('');
    setLoteTextoCapturado(null);
    setLoteFrente('');
    setLoteFondo('');
    setLote(null);
    setPlan(null);
  }

  // Tres formas de traer el lote, pero no valen lo mismo: el plat trae las
  // medidas y los retiros reales; la dirección sola no da ninguna de las dos.
  // Presentarlas como tres pestañas iguales dejaba al cliente adivinando.
  const loteModos = [
    {
      key: 'plano' as const,
      label: 'Tengo el plano',
      desc: 'PDF o foto del plat. Es lo más exacto: de ahí salen medidas y retiros.',
      sello: 'Lo mejor',
    },
    {
      key: 'medidas' as const,
      label: 'Sé las medidas',
      desc: 'Frente y fondo en pies. Con eso basta para calcular tu superficie.',
      sello: null,
    },
    {
      key: 'texto' as const,
      label: 'Solo la dirección',
      desc: 'Nos ubica el terreno, pero las medidas te las vamos a pedir igual.',
      sello: null,
    },
  ].map((m) => ({
    ...m,
    on: loteModo === m.key,
    onClick: () => { setLoteModo(m.key); setLoteError(null); },
  }));

  const lotesDisponibles = LOTES.filter((l) => l.status === 'disponible').length;

  // Pantalla previa: solo la ve quien entra por "ya tengo mi lote", y va antes
  // de que el contador de pasos empiece. No es un paso, es su punto de partida.
  // El recorrido no siempre son los seis pasos. `paso` sigue siendo el número
  // de siempre (1 = floorplan, 2 = fachada…) para que un guardado viejo o un
  // enlace a "te falta la fachada" no apunten a otra pantalla; lo que cambia es
  // qué pasos se recorren y con qué número se le enseñan al cliente.
  const pasosDelRecorrido = PASO_NOMBRES.map((_, i) => i + 1).filter((n) => !(n === FACHADA_PASO && fachadaFija));
  const totalPasos = pasosDelRecorrido.length;
  const esPrevia = paso === PREVIA;
  // Posición dentro del recorrido, no el índice interno: con la fachada fija,
  // el paso 3 es "3 de 5" y no "3 de 6" con un hueco en medio.
  const pasoNum = Math.max(1, pasosDelRecorrido.indexOf(paso) + 1);
  const pasoNombre = esPrevia ? 'Tu lote' : PASO_NOMBRES[paso - 1];
  const pasoHint = esPrevia ? 'Dinos cuánto mide tu terreno' : PASO_HINTS[paso - 1];

  // La entrada del paso. Va por nombre alterno y no por `key` a propósito:
  // remontar el contenedor arrastraría con él a todos los pasos y les reiniciaría
  // el estado interno —el índice del carrusel, el archivo que el cliente ya
  // subió— para conseguir solo que se relance una animación.
  const pasoAnim = useAnimacionAlterna(esPrevia ? 'previa' : paso, 'lgpPasoEntraA', 'lgpPasoEntraB');

  // Lo que la casa necesita definido antes de pedirle sus datos al cliente.
  // Las zonas quedan fuera a propósito: una casa sin zonas extra es válida.
  // El lote apunta a la previa (paso 0), no a un paso numerado: solo le puede
  // faltar a quien entró por "ya tengo mi lote" y no terminó de capturarlo.
  const faltantes = [
    !lote ? { paso: PREVIA, que: 'el lote' } : null,
    !plan ? { paso: 1, que: 'el floorplan' } : null,
    // La fachada no puede faltar si el lote la trae puesta: pedirla bloquearía
    // el resumen por una decisión que el cliente nunca tuvo que tomar.
    !fachada && !fachadaFija ? { paso: FACHADA_PASO, que: 'la fachada' } : null,
    !interior ? { paso: 3, que: 'la paleta de interior' } : null,
  ].filter(Boolean) as { paso: number; que: string }[];
  const configCompleta = faltantes.length === 0;
  // El bloqueo aplica de la 5 en adelante: ahí es donde se enseña el resumen y
  // se piden datos, y no tiene sentido mandarlo a medias.
  const pasoPermitido = (n: number) => n <= 4 || configCompleta;

  const pasos = pasosDelRecorrido.map((n, i) => {
    const permitido = pasoPermitido(n);
    return {
      n,
      // Lo que se pinta en el botón es la posición, no el número interno.
      etiqueta: i + 1,
      permitido,
      title: permitido ? undefined : `Antes elige ${faltantes.map((f) => f.que).join(', ')}`,
      // El `title` sustituía al contenido como nombre accesible, así que los
      // pasos bloqueados se anunciaban todos igual —"Antes elige los colores de
      // interior"— sin decir de qué paso hablaban. El número va primero y el
      // motivo después, en la misma cadena.
      ariaLabel: permitido
        ? `Paso ${i + 1} de ${pasosDelRecorrido.length}`
        : `Paso ${i + 1} de ${pasosDelRecorrido.length}, bloqueado: antes elige ${faltantes.map((f) => f.que).join(', ')}`,
      ariaCurrent: paso === n ? ('step' as const) : undefined,
      onClick: () => { if (permitido) setPaso(n); },
      style: {
        // 11px de relleno daban 37px de alto. El sistema exige 44 como piso
        // táctil y estos son los botones que más se pulsan en el teléfono.
        flex: 1, minHeight: '44px', padding: '11px 4px', border: 0, cursor: permitido ? 'pointer' : 'not-allowed',
        background: paso === n ? '#1C1E1F' : paso > n ? '#F2004B' : '#fff',
        color: paso >= n ? '#fff' : permitido ? '#6E7375' : '#A9ADAF',
        fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em',
      } as Record<string, any>,
    };
  });
  // `esPaso2` lleva la condición de fachada además del número: entre que un
  // guardado restaura el paso 2 y que el efecto del lote lo corre, habría un
  // fotograma con la pantalla que ese lote no debería ver.
  const esPaso1 = paso === 1, esPaso2 = paso === FACHADA_PASO && !fachadaFija, esPaso3 = paso === 3;
  const esPaso4 = paso === 4, esPaso5 = paso === 5, esPaso6 = paso === 6;
  // El recorrido del guardado puede no ser el de ahora mismo (otro lote, otras
  // reglas), así que "paso X de Y" en la tarjeta de "casa a medias" se calcula
  // con el lote que se guardó, no con el que está activo.
  const recorridoGuardado = (() => {
    if (!retomable) return null;
    const l = retomable.lotePropio ?? LOTES.find((x) => x.id === retomable.loteId) ?? null;
    const fija = l ? REGLAS_LOTE[l.tipo].fachadaFija : false;
    const ns = PASO_NOMBRES.map((_, i) => i + 1).filter((n) => !(n === FACHADA_PASO && fija));
    return { n: Math.max(1, ns.indexOf(retomable.paso) + 1), total: ns.length };
  })();

  // Vista previa en vivo de la captura a mano. Se recalcula con cada tecla: el
  // terreno se dibuja mientras se escribe, en vez de escribir a ciegas y tener
  // que apretar un botón para enterarse de lo que salió.
  const previaMedidas = (() => {
    const f = parseFloat(loteFrente.replace(',', '.'));
    const d = parseFloat(loteFondo.replace(',', '.'));
    if (!Number.isFinite(f) || !Number.isFinite(d) || f <= 0 || d <= 0) return null;
    return {
      frente: f,
      fondo: d,
      areaLote: Math.round(f * d),
      huella: huellaConstruible(f, d, retiros),
      anchoUtil: Math.max(0, f - retiros.lados * 2),
      largoUtil: Math.max(0, d - retiros.frente - retiros.fondo),
    };
  })();

  // El vecino en el recorrido, no en la numeración: con la fachada fuera, el
  // "siguiente" del floorplan es el interior.
  const vecino = (p: number, dir: 1 | -1) => {
    const i = pasosDelRecorrido.indexOf(p);
    if (i === -1) return dir === 1 ? (pasosDelRecorrido.find((n) => n > p) ?? p) : (pasosDelRecorrido.filter((n) => n < p).pop() ?? p);
    return pasosDelRecorrido[i + dir] ?? p;
  };
  // Desde el floorplan solo hay "atrás" para quien tiene previa que ver.
  const atras = () => setPaso((p) => (p <= pasosDelRecorrido[0] ? (entradaPropia ? PREVIA : p) : vecino(p, -1)));
  const siguiente = () => setPaso((p) => {
    const n = vecino(p, 1);
    return pasoPermitido(n) ? n : p;
  });
  const siguienteBloqueado = !pasoPermitido(vecino(paso, 1));

  const loteId = lote ? lote.id : 'tu lote';

  // Floorplans que el lote permite. En un lote townhouse la casa ya viene
  // diseñada, así que la lista trae un solo plan y el paso 1 se muestra fijo.
  const planesPermitidos = (reglas ? reglas.planes : ['B', 'C', 'D']) as PlanKey[];
  const planesVista = planesPermitidos.map((k) => {
    const p = PLANES[k];
    return {
      key: k,
      nombre: p.nombre,
      living: p.living,
      total: p.total,
      resumen: `${p.living.toLocaleString('es-MX')} ft² habitables · ${p.rec} rec · ${p.banos} baños · ${p.pisos === 2 ? '2 pisos' : '1 piso'}`,
      detalle: `${p.total.toLocaleString('es-MX')} ft² construidos en total (incluye garage, pórtico y exteriores)`,
      on: plan === k,
      cardStyle: cardStyle(plan === k, { border: '1px solid #EAE7E3' }),
      onSelect: () => {
        if (planFijo) return;
        setPlan((prev) => (prev === k ? null : k));
        setPlanLivingSel(null);
        setSugeridos(null);
      },
    };
  });
  // ---- Opciones para el esqueleto de decisión (pasos 2, 3 y gama) ---------
  const DESC_PLAN: Record<string, string> = {
    TH: 'Dos plantas en huella angosta, con garage al frente y balcón en la recámara principal.',
    B: 'Un piso, con un corredor techado que cruza dos patios chicos entre las alas de la casa.',
    C: 'Un piso, con patio interior entre las dos alas de la casa.',
    D: 'Dos plantas, con escalera central y las recámaras arriba.',
  };
  const planesDecision = planesVista.map((p) => ({
    key: p.key as string,
    nombre: p.nombre,
    descripcion: DESC_PLAN[p.key] ?? '',
    meta: p.resumen,
    imagen: RENDER_PLAN[p.key],
    visual: RENDER_PLAN[p.key] ? undefined : <PlanDiagram planKey={p.key} />,
    // Solo con render: el `PlanDiagram` de respaldo es un esquema de líneas que
    // se lee peor sobre una retícula, y ahí el blanco liso sigue siendo mejor.
    texturaFondo: Boolean(RENDER_PLAN[p.key]),
    sigla: p.key === 'TH' ? '2P' : String(p.key),
    on: p.on,
    fija: Boolean(planFijo),
    etiqueta: planFijo ? 'INCLUIDO' : undefined,
    onSelect: p.onSelect,
  }));


  // ---- Dimmer de superficie (paso 1) -------------------------------------
  // El plan trae un tamaño de fábrica; el usuario puede estirarlo hasta donde
  // le alcance el lote, ya descontando las zonas y cuartos que lleva. Nunca
  // por debajo del plano diseñado: eso ya sería otro proyecto.
  const planBaseLiving = plan ? PLANES[plan].living : 0;
  // Lo que se construye pero no cuenta como habitable. En lote propio se arma
  // con el garage que el usuario eligió; en el catálogo es el del plan.
  const planNoHabitable = lote?.huella
    ? garageFt + PORCHE
    : (plan ? PLANES[plan].total - PLANES[plan].living : 0);
  const comprometidoFuera = livingDeZonas() + livingDeCuartos();
  const dimmerMin = planBaseLiving;
  const dimmerMax = lote ? Math.max(planBaseLiving, maxLivingLote() - comprometidoFuera) : planBaseLiving;
  const dimmerValor = Math.min(Math.max(livingDelPlan(), dimmerMin), dimmerMax);
  const dimmerActivo = Boolean(plan && lote && !planFijo && dimmerMax > dimmerMin);
  const dimmerTotal = dimmerValor + planNoHabitable;
  const dimmerPct = dimmerMax > dimmerMin ? ((dimmerValor - dimmerMin) / (dimmerMax - dimmerMin)) * 100 : 0;
  // El usuario puede pensar en habitable o en área total construida; el slider
  // trabaja en la unidad que elija y por dentro siempre guarda el habitable.
  const enTotal = dimmerModo === 'total';
  const sliderMin = enTotal ? dimmerMin + planNoHabitable : dimmerMin;
  const sliderMax = enTotal ? dimmerMax + planNoHabitable : dimmerMax;
  const sliderValor = enTotal ? dimmerValor + planNoHabitable : dimmerValor;
  const onDimmer = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!Number.isFinite(v)) return;
    const living = enTotal ? v - planNoHabitable : v;
    setPlanLivingSel(Math.min(Math.max(living, dimmerMin), dimmerMax));
  };
  const resetDimmer = () => setPlanLivingSel(null);
  const dimmerModos = ([
    { key: 'living' as const, label: 'Habitable' },
    { key: 'total' as const, label: 'Área total' },
  ]).map((m) => ({ ...m, on: dimmerModo === m.key, onClick: () => setDimmerModo(m.key) }));

  // ---- Barra de presupuesto (pasos 2 a 5) --------------------------------
  const presupuestoSegmentos = [
    { key: 'plan', label: plan ? PLANES[plan].nombre : 'Floorplan', ft2: livingDelPlan(), color: '#1C1E1F' },
    { key: 'cuartos', label: 'Cuartos y baños extra', ft2: livingDeCuartos(), color: '#5C6163' },
    { key: 'zonas', label: 'Zonas', ft2: livingDeZonas(), color: '#F2004B' },
  ];
  const mostrarPresupuesto = paso >= 1 && paso <= 4;

  // El mismo gesto en todos los pasos: tocar la fila elige, tocar la "×" de la
  // franja deshace. Por eso estos handlers alternan en vez de solo asignar.
  const fachadas = FACHADAS.map((f) => ({
    ...f, on: fachada === f.key,
    cardStyle: cardStyle(fachada === f.key),
    onSelect: () => setFachada((prev) => (prev === f.key ? null : f.key)),
  }));
  const interiores = INTERIORES.map((i) => ({
    ...i, on: interior === i.key,
    cardStyle: cardStyle(interior === i.key),
    onSelect: () => setInterior((prev) => (prev === i.key ? null : i.key)),
  }));

  const fachadasDecision = fachadas.map((f) => ({
    key: f.key,
    nombre: f.nombre,
    descripcion: f.desc,
    // Sin alto ni relleno propios: los pone el visor del carrusel. Este `span`
    // llevaba 12px de padding que se sumaban a los 12 del marco, y esos 24px
    // salían enteros del tamaño de la maqueta sin que nadie los hubiera pedido.
    visual: (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <img
          src={RENDER_FACHADA[f.key]}
          alt=""
          aria-hidden="true"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      </span>
    ),
    // La maqueta va sobre su propia placa blanca, como las paletas: el render
    // es transparente y de líneas claras, y sin placa se perdería justo cuando
    // la fila se cubre de carmín al elegirla.
    miniatura: (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#fff', border: '1px solid #EAE7E3' }}>
        <img
          src={RENDER_FACHADA_MINI[f.key]}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{ width: '30px', height: '30px', objectFit: 'contain', display: 'block' }}
        />
      </span>
    ),
    // 'muestra' y no 'icono': la maqueta es un render, e invertirla a blanco
    // sobre la fila carmín borraría las líneas que dibujan el volumen.
    visualTipo: 'muestra' as const,
    // La maqueta viene recortada y sus líneas son claras: sobre blanco liso
    // flotaba en el vacío. La retícula de cubos del fondo de la página le da
    // suelo, y comparte proyección isométrica con la propia maqueta.
    texturaFondo: true,
    sigla: f.nombre.slice(0, 2).toUpperCase(),
    on: f.on,
    onSelect: f.onSelect,
  }));

  const gamasDecision = interiores.map((i) => ({
    key: i.key,
    nombre: i.nombre,
    descripcion: i.desc,
    // La maqueta de cocina de esa paleta. Es el mismo cuarto en las seis —misma
    // geometría, mismo encuadre, misma luz— para que lo único que se compare
    // entre una fila y otra sea el acabado, que es lo que se está eligiendo.
    imagen: RENDER_PALETA[i.key],
    // La muestra preliminar de la fila: gabinete, cubierta y piso, los tres
    // materiales que definen la paleta de un vistazo. Es lo que deja escanear
    // la tabla sin esperar a que cargue una imagen; el resultado lo enseña la
    // maqueta de al lado.
    miniatura: (
      <span style={{ display: 'flex', width: '34px', height: '34px', border: '1px solid #EAE7E3' }}>
        <span style={{ flex: 1, background: i.c1 }} />
        <span style={{ flex: 1, background: i.c2 }} />
        <span style={{ flex: 1, background: i.c3 }} />
      </span>
    ),
    // Una paleta no se invierte: invertida es otra paleta.
    visualTipo: 'muestra' as const,
    // La maqueta viene recortada con fondo transparente, igual que la de
    // fachada: sobre blanco liso flotaría en el vacío. La retícula de cubos del
    // fondo de la página le da suelo y comparte su proyección isométrica.
    texturaFondo: true,
    sigla: i.nombre.slice(0, 2).toUpperCase(),
    on: i.on,
    onSelect: i.onSelect,
  }));

  // --- Guía del paso 3 ------------------------------------------------------
  // El paso 4 tenía tres bloques a la vez —paleta, cuartos y zonas— y el
  // cliente no sabía por dónde empezar. Ahora se abren de uno en uno, como el
  // tutorial de un juego: lo que toca late, lo que no toca está apagado, y solo
  // cuando termina se suelta todo para que pueda repasar y corregir.
  //
  // `tocadoCuartos` no es "tiene cuartos" sino "ya pasó por aquí": el plano ya
  // trae recámaras y baños, así que sin esta marca la etapa se saltaría sola y
  // nunca vería el contador.
  // Lo mismo con las zonas: condicionarlo a "le queda presupuesto" saltaba la
  // etapa entera en los townhouse, que arrancan en 0 ft² libres — aunque ahí sí
  // se puede agregar la zona BBQ, que es exterior y no cuesta habitable.
  const [tocadoCuartos, setTocadoCuartos] = useState(false);
  const [tocadoZonas, setTocadoZonas] = useState(false);
  const etapaGuia: 'gama' | 'cuartos' | 'zonas' | 'libre' = !interior
    ? 'gama'
    : !tocadoCuartos
      ? 'cuartos'
      : !tocadoZonas && modulos.length === 0
        ? 'zonas'
        : 'libre';
  const guiaLibre = etapaGuia === 'libre';
  const claseGuia = (mia: 'gama' | 'cuartos' | 'zonas') => {
    if (guiaLibre) return '';
    if (etapaGuia === mia) return 'lgp-guia-activa lgp-guia-entra';
    const orden = { gama: 0, cuartos: 1, zonas: 2 };
    return orden[mia] > orden[etapaGuia as 'gama' | 'cuartos' | 'zonas'] ? 'lgp-guia-bloqueada' : '';
  };
  // El foco no se le pide al cliente, se le lleva: al abrirse una etapa la
  // pantalla se mueve sola hasta ella y le deja el cursor puesto en el primer
  // control. Al terminar la última, se suelta y ya navega él.
  const refGama = useRef<HTMLDivElement | null>(null);
  const refCuartos = useRef<HTMLDivElement | null>(null);
  const refZonas = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!esPaso3 || etapaGuia === 'libre') return;
    const destino = etapaGuia === 'gama' ? refGama.current : etapaGuia === 'cuartos' ? refCuartos.current : refZonas.current;
    if (!destino) return;
    // 'start' y no 'center': centrar una etapa más alta que la ventana le corta
    // la cabeza, y el cliente empieza a leerla por la mitad. Desde arriba ve el
    // bloque completo y baja él si necesita más.
    destino.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const t = window.setTimeout(() => {
      const primero = destino.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled])');
      primero?.focus({ preventScroll: true });
    }, 420);
    return () => window.clearTimeout(t);
  }, [etapaGuia, paso]);

  // Las seis maquetas se bajan al entrar al paso, no al pasar el cursor por su
  // fila. Son 343 KB entre las seis —la versión de panel, no el maestro— y sin
  // esto la primera pasada por cada fila enseña el panel vacío mientras la
  // imagen viaja, que es justo el gesto al que el panel existe para responder.
  useEffect(() => {
    if (!esPaso3) return;
    for (const src of Object.values(RENDER_PALETA)) {
      const img = new window.Image();
      img.src = src;
    }
  }, [esPaso3]);

  const pistaGuia =
    etapaGuia === 'gama' ? 'Empieza por la paleta de interior — de ahí salen pisos, muros y carpintería.'
    : etapaGuia === 'cuartos' ? 'Ahora ajusta recámaras y baños. Puedes dejarlos como vienen en el plano.'
    : etapaGuia === 'zonas' ? 'Por último, agrega las zonas que quepan en lo que te queda.'
    : null;
  const pasoGuia = etapaGuia === 'gama' ? 1 : etapaGuia === 'cuartos' ? 2 : etapaGuia === 'zonas' ? 3 : 3;

  const briefLen = brief.length;
  const onBrief = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setBrief(e.target.value);

  const ft2Rest = ft2Restantes();
  // El análisis del brief RECOMIENDA zonas, no recorta el catálogo: se marcan
  // y se suben al principio de la lista, pero el usuario sigue viendo todo.
  const modsBase = MODULOS.map((m) => {
    const sug = sugeridos?.find((s) => s.key === m.key) ?? null;
    return { key: m.key, razon: sug ? sug.razon : null, sugerida: Boolean(sug) };
  });
  const modsOrdenados = sugeridos
    ? [...modsBase].sort((a, b) => Number(b.sugerida) - Number(a.sugerida))
    : modsBase;

  const mods = modsOrdenados.map((sg) => {
    const m = MODULOS.find((x) => x.key === sg.key)!;
    const incluida = esIncluida(m.key);
    const on = incluida || modulos.indexOf(m.key) >= 0;
    // El reglamento de la subdivisión manda sobre todo lo demás.
    const bloqueadaPorReglamento = Boolean(reglas?.zonasBloqueadas.includes(m.key));
    // Incompatibilidades con el floorplan elegido: un balcón necesita planta
    // alta; un master abierto al patio necesita que el plano tenga patio.
    const pisosPlan = plan ? PLANES[plan].pisos : 0;
    const faltanPisos = Boolean(plan && m.minPisos && pisosPlan < m.minPisos);
    const planIncompatible = Boolean(plan && m.soloEnPlanes && !m.soloEnPlanes.includes(plan));
    const incompatible = faltanPisos || planIncompatible;
    const costoLiving = costoZona(m);
    const requiereFaltante = m.requiere && !modulos.includes(m.requiere);
    const sinPresupuesto = !on && costoLiving > ft2Rest;
    const disabled = bloqueadaPorReglamento || incompatible || (!on && (Boolean(requiereFaltante) || sinPresupuesto));
    const requeridoNombre = m.requiere ? (MODULOS.find((x) => x.key === m.requiere)?.corto ?? m.requiere) : null;
    const disabledReason = bloqueadaPorReglamento
      ? reglas!.motivo
      : faltanPisos
        ? `${PLANES[plan!].nombre} es de un piso: un balcón necesita planta alta.`
        : planIncompatible
          ? `${PLANES[plan!].nombre} no tiene patio al que abrir el master.`
          : requiereFaltante
            ? `Primero agrega: ${requeridoNombre}`
            : sinPresupuesto
              ? `No cabe en tu presupuesto restante (quedan ${ft2Rest} ft² habitables, esta zona necesita mínimo ${costoLiving} ft²)`
              : null;
    // Una zona que sustituye a otra incluida solo cobra la diferencia.
    const sustituyeA = !incluida && m.grupo
      ? MODULOS.find((x) => x.grupo === m.grupo && (plan ? (PLANES[plan].incluidas as readonly string[]).includes(x.key) : false))
      : undefined;
    return {
      iconKey: m.key, nombre: m.corto, nombreLargo: m.nombre, nota: m.nota,
      rango: m.rango, area: m.area, prop: m.prop, min: m.min, razon: sg.razon,
      on, disabled, disabledReason, requiereFaltante: Boolean(requiereFaltante), bloqueadaPorReglamento,
      incluida, costoLiving, sustituyeA: sustituyeA ? sustituyeA.corto : null, sugerida: sg.sugerida,
      box: on ? '#F2004B' : '#fff',
      cardStyle: cardStyle(on),
      onToggle: () => {
        // Las zonas que el plano ya trae no se quitan desde aquí: se cambian
        // eligiendo la alternativa de su mismo grupo.
        if (disabled || incluida) return;
        setModulos((prev) => {
          if (prev.indexOf(m.key) >= 0) return prev.filter((k) => k !== m.key);
          const sinGrupo = m.grupo ? prev.filter((k) => MODULOS.find((x) => x.key === k)?.grupo !== m.grupo) : prev;
          return sinGrupo.concat([m.key]);
        });
      },
    };
  });

  // El tragaluz es un atributo de una zona ya puesta: se prende desde la propia
  // zona, con tope de MAX_TRAGALUCES en la misma casa.
  const orientacionHint = lote ? ((lote.orient as string) === 'Oeste' ? 'Esta zona da al poniente — no ideal para tragaluz.' : `Orientación al ${lote.orient} — buena para tragaluz.`) : '';
  const toggleTragaluz = (key: string) => {
    const m = mods.find((x) => x.iconKey === key);
    if (!m || !m.on) return;
    setTragaluces((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_TRAGALUCES) return prev;
      return prev.concat([key]);
    });
  };
  const modulosAgregados = mods.filter((m) => m.on).map((m) => m.nombre).join(', ') || 'Ninguno aún';

  const leadNombre = lead.nombre, leadCorreo = lead.correo, leadTel = lead.tel;
  const leadPrimerNombre = (lead.nombre || 'gracias').split(' ')[0];
  const onNombre = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, nombre: e.target.value }));
  const onCorreo = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, correo: e.target.value }));
  const onTel = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, tel: e.target.value }));

  const totalRec = plan ? PLANES[plan].rec + recamarasExtra : recamarasExtra;
  const totalBanos = plan ? PLANES[plan].banos + banosExtra : banosExtra;

  // Cuartos y baños. Se pueden sumar si hay presupuesto libre, y se pueden
  // quitar hasta el mínimo del plano — quitar uno devuelve sus ft² para
  // gastarlos en otra zona (cambiar una recámara por un game room, etc.).
  function motivoTope(extra: number, def: { nombre: string; living: number; max: number }) {
    if (!lote) return 'Primero captura tu lote.';
    if (!plan) return 'Primero elige un floorplan en el paso 1.';
    if (extra >= def.max) return `Máximo ${def.max} ${def.nombre.toLowerCase()}s extra.`;
    if (def.living > ft2Rest) {
      return `No cabe: quedan ${ft2Rest} ft² habitables y ${def.nombre.toLowerCase()} necesita ${def.living} ft².`;
    }
    return null;
  }

  function motivoQuitar(total: number, min: number, etiqueta: string) {
    if (!plan) return 'Primero elige un floorplan en el paso 1.';
    if (total <= min) return `El plano no puede quedar con menos de ${min} ${etiqueta}.`;
    return null;
  }

  const recMin = plan ? PLANES[plan].recMin : 0;
  const banosMin = plan ? PLANES[plan].banosMin : 0;

  const contadores = [
    {
      key: 'recamara',
      nombre: 'Recámaras',
      base: plan ? PLANES[plan].rec : 0,
      total: totalRec,
      living: EXTRAS.recamara.living,
      extra: recamarasExtra,
      masMotivo: motivoTope(recamarasExtra, EXTRAS.recamara),
      masDisabled: Boolean(motivoTope(recamarasExtra, EXTRAS.recamara)),
      menosMotivo: motivoQuitar(totalRec, recMin, 'recámara'),
      menosDisabled: Boolean(motivoQuitar(totalRec, recMin, 'recámara')),
      // El tope se revalida aquí y no solo con `disabled`: si llegaran varios
      // clics antes de que React repinte, todos parten del mismo valor y el
      // presupuesto nunca se rebasa.
      onMas: () => {
        if (motivoTope(recamarasExtra, EXTRAS.recamara)) return;
        setRecamarasExtra(recamarasExtra + 1);
      },
      onMenos: () => {
        if (motivoQuitar(totalRec, recMin, 'recámara')) return;
        setRecamarasExtra(recamarasExtra - 1);
      },
    },
    {
      key: 'bano',
      nombre: 'Baños',
      base: plan ? PLANES[plan].banos : 0,
      total: totalBanos,
      living: EXTRAS.bano.living,
      extra: banosExtra,
      masMotivo: motivoTope(banosExtra, EXTRAS.bano),
      masDisabled: Boolean(motivoTope(banosExtra, EXTRAS.bano)),
      menosMotivo: motivoQuitar(totalBanos, banosMin, 'baño'),
      menosDisabled: Boolean(motivoQuitar(totalBanos, banosMin, 'baño')),
      onMas: () => {
        if (motivoTope(banosExtra, EXTRAS.bano)) return;
        setBanosExtra(banosExtra + 1);
      },
      onMenos: () => {
        if (motivoQuitar(totalBanos, banosMin, 'baño')) return;
        setBanosExtra(banosExtra - 1);
      },
    },
  ];

  // Atajo para el caso real más común: el townhouse del catálogo usa los 1,635
  // ft² completos, así que el paso de zonas arranca en cero. El único camino
  // honesto es devolver superficie, y una recámara de más vale 105 ft² — que
  // alcanza para casi cualquier zona del catálogo.
  const liberarEspacio = plan && !motivoQuitar(totalRec, recMin, 'recámara')
    ? {
        etiqueta: 'Quitar una recámara',
        ft2: EXTRAS.recamara.living,
        onLiberar: () => {
          if (motivoQuitar(totalRec, recMin, 'recámara')) return;
          setRecamarasExtra(recamarasExtra - 1);
        },
      }
    : null;

  // Cómo se nombra la fachada fuera del paso 2. Cuando el lote la trae puesta
  // no es "sin elegir" —no había nada que elegir— y tampoco se le inventa un
  // estilo del catálogo: se dice de dónde viene.
  const FACHADA_DE_SUBDIVISION = 'Definida por la subdivisión';
  const fachadaTexto = fachada
    ? (FACHADAS.find((f) => f.key === fachada)?.nombre ?? '—')
    : fachadaFija
      ? FACHADA_DE_SUBDIVISION
      : 'Sin elegir';

  // ---- Totales de la casa configurada -----------------------------------
  // Living = plano + zonas habitables + cuartos extra.
  // Total  = living + lo construido no habitable (garage, pórtico, patio,
  //          balcón) + las zonas exteriores que el usuario agregó.
  const ft2LivingTotal = livingDelPlan() + livingDeZonas() + livingDeCuartos();
  const ft2Exteriores = modulos.reduce((s, k) => {
    const m = MODULOS.find((x) => x.key === k);
    if (!m) return s;
    if (m.exterior) return s + m.min;
    // Módulos mixtos (master + balcón): la parte que no es habitable.
    return s + (m.living !== undefined ? m.min - m.living : 0);
  }, 0);
  const ft2ConstruidoTotal = ft2LivingTotal + planNoHabitable + ft2Exteriores;
  // En lote propio manda lo que eligió el usuario; en un lote del catálogo
  // manda el garage real del plano aprobado, no el estándar.
  const garageTexto = lote?.huella
    ? (garage2 ? `2 autos · ${GARAGE_2_AUTOS.toLocaleString('es-MX')} ft²` : `1 auto · ${GARAGE_1_AUTO.toLocaleString('es-MX')} ft²`)
    : `2 autos · ${GARAGE_2_TOWNHOUSE.toLocaleString('es-MX')} ft² (del plano aprobado)`;
  const loteMedida = lote
    ? (lote.frenteFt && lote.fondoFt
        ? `${lote.frenteFt} × ${lote.fondoFt} ft · ${lote.maxft.toLocaleString('es-MX')} ft²`
        : `${lote.frente} × ${lote.fondo} · ${lote.maxft.toLocaleString('es-MX')} ft²`)
    : 'Sin elegir';
  const zonasTexto = modulos.length
    ? modulos.map((k) => (MODULOS.find((m) => m.key === k) || ({} as any)).corto).join(', ')
    : 'Ninguna';

  const resumen = [
    { k: 'Medida del lote', v: loteMedida },
    { k: 'Floorplan', v: plan ? PLANES[plan].nombre : 'Sin elegir' },
    { k: 'Recámaras / baños', v: plan ? `${totalRec} recámaras · ${totalBanos} baños` : 'Sin elegir' },
    { k: 'Fachada', v: fachadaTexto },
    { k: 'Paleta de interior', v: interior ? (INTERIORES.find((i) => i.key === interior) || ({} as any)).nombre : 'Sin elegir' },
    { k: 'Zonas', v: zonasTexto },
    { k: 'Pies cuadrados living', v: ft2LivingTotal.toLocaleString('es-MX') + ' ft²' },
    { k: 'Pies cuadrados totales', v: ft2ConstruidoTotal.toLocaleString('es-MX') + ' ft²' },
    { k: 'Espacio de garage', v: garageTexto },
    ...(tragaluces.length ? [{ k: 'Tragaluces', v: tragaluces.map((k) => (MODULOS.find((m) => m.key === k) || ({} as any)).corto).join(', ') }] : []),
    // Lo que el usuario adjuntó de su propio lote viaja al resumen para que el
    // arquitecto lo vea, aunque el análisis automático no haya corrido.
    ...(loteFile ? [{ k: 'Plano adjunto', v: loteFile.nombre + ' · ' + pesoLegible(loteFile.peso) }] : []),
    ...(loteUbicacion || loteTextoCapturado
      ? [{ k: 'Ubicación del lote', v: loteUbicacion ? [loteUbicacion.direccion, loteUbicacion.coordenadas].filter(Boolean).join(' · ') : (loteTextoCapturado ?? '') }]
      : []),
    ...(brief ? [{ k: 'Brief', v: '“' + brief.slice(0, 150) + (brief.length > 150 ? '…' : '') + '”' }] : []),
    { k: 'Contacto', v: (lead.nombre || '—') + (lead.correo ? ' · ' + lead.correo : '') + (lead.tel ? ' · ' + lead.tel : '') },
  ];

  const interiorSeleccionado = interior ? INTERIORES.find((i) => i.key === interior) ?? null : null;
  const modulosSeleccionados = mods.filter((m) => m.on).map((m) => ({ iconKey: m.iconKey, nombre: m.nombre, razon: m.razon }));
  const planNombreSel = plan ? PLANES[plan].nombre : 'Sin floorplan elegido';

  const noEnviado = !enviado;

  // La ficha que recibe el arquitecto: todo lo que el cliente decidió, con el
  // desglose del presupuesto y el croquis del lote. Vive solo en el correo —
  // en el sitio el cliente ve el resumen corto de arriba.
  function armarFicha(): Ficha {
    const zonas = mods
      .filter((m) => m.on)
      .map((m) => {
        const def = MODULOS.find((x) => x.key === m.iconKey);
        return {
          nombre: m.nombreLargo,
          rango: def?.rango ?? '',
          ft2: m.costoLiving,
          exterior: Boolean(def?.exterior),
          incluida: m.incluida,
        };
      });
    return {
      cliente: { nombre: lead.nombre.trim(), correo: lead.correo.trim(), tel: lead.tel.trim() },
      lote: {
        id: lote?.id ?? '—',
        origen: lote?.origen === 'usuario' ? 'usuario' : 'catalogo',
        medida: loteMedida,
        maxft: lote?.maxft ?? 0,
        orientacion: lote?.orient ?? '—',
        tipo: lote?.tipo ?? '—',
        retiros: lote?.retiros ?? null,
        huella: lote?.huella ?? null,
        adjunto: loteFile ? `${loteFile.nombre} · ${pesoLegible(loteFile.peso)}` : null,
        ubicacion: loteUbicacion
          ? [loteUbicacion.direccion, loteUbicacion.coordenadas].filter(Boolean).join(' · ')
          : loteTextoCapturado,
      },
      plan: {
        nombre: plan ? PLANES[plan].nombre : '—',
        pisos: plan ? PLANES[plan].pisos : 0,
        livingBase: plan ? PLANES[plan].living : 0,
        livingElegido: livingDelPlan(),
      },
      cuartos: {
        recamaras: totalRec,
        banos: totalBanos,
        recBase: plan ? PLANES[plan].rec : 0,
        banosBase: plan ? PLANES[plan].banos : 0,
      },
      // Al arquitecto le sirve saber que no la eligió el cliente, no un guion.
      fachada: fachada ? (FACHADAS.find((f) => f.key === fachada)?.nombre ?? '—') : fachadaFija ? FACHADA_DE_SUBDIVISION : '—',
      interior: {
        nombre: interiorSeleccionado?.nombre ?? '—',
        colores: interiorSeleccionado ? [interiorSeleccionado.c1, interiorSeleccionado.c2, interiorSeleccionado.c3] : [],
      },
      zonas,
      tragaluces: tragaluces.map((k) => MODULOS.find((m) => m.key === k)?.corto ?? k),
      presupuesto: {
        maxLiving: maxLivingLote(),
        plan: livingDelPlan(),
        cuartos: livingDeCuartos(),
        zonas: livingDeZonas(),
        libre: ft2Rest,
      },
      garage: garageTexto,
      totales: { living: ft2LivingTotal, construido: ft2ConstruidoTotal },
      brief,
    };
  }

  const enviar = async () => {
    if (enviando) return;
    if (!lead.nombre.trim()) {
      setEnvioError('Escribe tu nombre en el paso 6 para saber a quién buscamos.');
      return;
    }
    if (!lead.correo.trim() && !lead.tel.trim()) {
      setEnvioError('Déjanos un correo o un teléfono en el paso 6, el que prefieras.');
      return;
    }
    setEnviando(true);
    setEnvioError(null);
    try {
      const res = await fetch('/api/enviar-resumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(armarFicha()),
      });
      if (res.ok) {
        setEnviado(true);
        return;
      }
      // Nunca se confirma un envío que no salió: si el correo no está
      // configurado o falló, el cliente se entera y se le da otra vía.
      setEnvioError(
        res.status === 501
          ? 'El envío automático todavía no está activo. Escríbenos o agenda tu cita aquí abajo y llevamos tu configuración a la cita.'
          : 'No pudimos mandarla en este momento. Vuelve a intentar, o agenda tu cita aquí abajo.',
      );
    } catch {
      setEnvioError('No pudimos mandarla: revisa tu conexión y vuelve a intentar.');
    } finally {
      setEnviando(false);
    }
  };

  // El CTA del header lleva al formulario de cita y deja el cursor puesto en el
  // primer campo. El scroll es suave, así que el foco espera a que termine:
  // enfocar a media animación la cancela en iOS.
  const irACita = () => {
    const el = document.getElementById('contacto');
    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' });
    window.setTimeout(() => citaNombreRef.current?.focus({ preventScroll: true }), 520);
  };
  // Pedimos nombre y una sola vía de contacto: exigir las dos sobra para una
  // primera llamada y cuesta conversiones.
  //
  // Esta cita se pide antes de terminar el configurador, así que `armarFicha`
  // se manda con lo que haya — lote y plan pueden venir en blanco. La ruta y la
  // ficha ya están hechas para el envío del paso 6; es la misma, para no tener
  // dos caminos de correo con reglas distintas.
  const agendarCita = async () => {
    if (citaEnviando) return;
    if (!lead.nombre.trim()) {
      setCitaError('Escribe tu nombre para saber a quién buscamos.');
      return;
    }
    if (!lead.correo.trim() && !lead.tel.trim()) {
      setCitaError('Déjanos un correo o un teléfono, el que prefieras.');
      return;
    }
    setCitaError(null);
    setCitaEnviando(true);
    try {
      const res = await fetch('/api/enviar-resumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(armarFicha()),
      });
      if (res.ok) {
        setCitaEnviada(true);
        return;
      }
      // Mismo trato que en el paso 7: nunca se confirma un envío que no salió.
      setCitaError(
        res.status === 501
          ? 'El envío automático todavía no está activo, pero anotamos tus datos — escríbenos a contact@lagranpiedrallc.com y te contestamos directo.'
          : 'No pudimos mandarlo en este momento. Vuelve a intentar, o escríbenos a contact@lagranpiedrallc.com.',
      );
    } catch {
      setCitaError('No pudimos mandarlo: revisa tu conexión y vuelve a intentar.');
    } finally {
      setCitaEnviando(false);
    }
  };

  // Varias preguntas abiertas a la vez: quien compara financiamiento contra
  // tiempo de obra necesita las dos en pantalla, y cerrar la anterior en
  // silencio se siente como si la página le quitara algo.
  const faqs = FAQS.map((f, i) => ({
    q: f.q, a: f.a,
    open: faqOpen.includes(i),
    icon: faqOpen.includes(i) ? '−' : '+',
    onToggle: () => setFaqOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : prev.concat([i]))),
  }));

  const nav = NAV.map((n) => ({
    label: n.label, href: '#' + n.id,
    color: '#5C6163', dot: n.id === 'index' ? '#F2004B' : 'transparent',
  }));

  // --- Entrada y salida de la ventana enfocada -----------------------------
  // Entrar con un lote del catálogo: se fija el lote y se arranca en el paso 1,
  // el floorplan.
  const abrirDesdeLote = (l: Lote) => {
    setLote(l);
    setPaso(1);
    setEntradaPropia(false);
    setVentanaAbierta(true);
  };
  // Entrar a diseñar. Los ocho lotes del catálogo son el mismo townhouse
  // —mismo tipo, mismo plan fijo y los mismos 1,635 ft² habitables— así que se
  // entra con el primero disponible y el combo sale idéntico. Nada de las
  // reglas ni del presupuesto cambia con cuál de los ocho sea.
  const abrirDiseno = () => {
    const lista = LOTES as unknown as Lote[];
    const primero = lista.find((l) => l.status === 'disponible') ?? lista[0];
    if (primero) abrirDesdeLote(primero);
  };
  // Entrar con lote propio: primero la pantalla previa, que es donde se sube el
  // plano o se capturan las medidas. De ahí sigue al paso 1 como todos.
  const abrirPropioLote = () => {
    setPaso(PREVIA);
    setEntradaPropia(true);
    setVentanaAbierta(true);
  };
  const cerrarVentana = () => setVentanaAbierta(false);

  // Cierre desde la pantalla de éxito: no es "voy a seguir después", ya se
  // mandó. Si solo cerráramos la ventana, dos cosas quedarían mal — el fondo
  // seguiría donde se abrió (a media página de "Lugares disponibles", no en
  // el inicio) y el guardado local seguiría ofreciendo "retomar" un combo que
  // ya está en el correo del arquitecto. Por eso este cierre reinicia todo el
  // configurador y sube a la portada, como si el cliente llegara de nuevo.
  const cerrarTrasEnviar = () => {
    borrarGuardado();
    setRetomable(null);
    setVentanaAbierta(false);
    setPaso(1);
    setLote(null);
    setLotePropio(null);
    setPlan(null);
    setFachada(null);
    setInterior(null);
    setBrief('');
    setModulos([]);
    setSugeridos(null);
    setBriefLectura(null);
    setLead({ nombre: '', correo: '', tel: '' });
    setEnviado(false);
    setEnvioError(null);
    setModuloIdx(0);
    setEntradaPropia(false);
    setTragaluces([]);
    setRecamarasExtra(0);
    setBanosExtra(0);
    setPlanLivingSel(null);
    setVerTodasZonas(false);
    setLoteFile(null);
    setLoteTextoCapturado(null);
    setLoteLoading(false);
    setLoteError(null);
    setLoteErrorTipo('error');
    setLoteAnalisis(null);
    setLoteModo('plano');
    setLoteTexto('');
    setLoteFrente('');
    setLoteFondo('');
    setRetiros(RETIROS_DEFAULT);
    setGarage2(true);
    setLoteUbicacion(null);
    setTocadoCuartos(false);
    setTocadoZonas(false);
    // Después de que la ventana termine su transición de salida, no antes —
    // moverlo a la vez se siente como un salto brusco.
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  };

  return (
    <div style={{position: "relative", overflowX: "hidden", background: "#FBFBFA", paddingBottom: "74px"}}>

      {/* Con 57 elementos enfocables en una sola página, quien navega con
          teclado tenía que tabular por todo para llegar al configurador. */}
      <a href="#personaliza" className="lgp-skip">Saltar al configurador</a>

      <div ref={bgRef} style={{position: "fixed", inset: "0", zIndex: "0", pointerEvents: "none", overflow: "hidden"}}></div>


      {/* La sombra se fue del estilo en línea a `.lgp-header`: un `box-shadow`
          aquí le ganaría a la regla que la hace aparecer solo al separarse del
          borde superior. Pegada al borde, la cabecera no flota sobre nada. */}
      <div data-nofx="1" className="lgp-header" style={{position: "fixed", top: "0", left: "0", right: "0", zIndex: "60", display: "flex", alignItems: "stretch", background: "linear-gradient(178deg,#FFFFFF 0 54%,#F5F2EE 54% 80%,#E7E3DE 80%)", pointerEvents: "auto"}}>

        <a href="#index" className="lgp-header-logo" style={{display: "flex", alignItems: "center", gap: "13px", padding: "11px 22px"}}>
          <img src="/logo-full.svg" alt="La Gran Piedra" style={{height: "38px", width: "auto", display: "block"}} />
          <img src="/logo-wordmark.svg" alt="La Gran Piedra" className="lgp-header-wordmark" style={{height: "11px", width: "auto", display: "block"}} />
        </a>

        <div style={{flex: "1"}}></div>

        <div className="lgp-header-social" style={{display: "flex", alignItems: "center", gap: "14px", padding: "0 20px"}}>
          <a href="https://instagram.com" title="Instagram" style={{display: "flex", alignItems: "center"}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#505759" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.4" cy="6.6" r="1.15" fill="#505759" stroke="none"></circle></svg></a>
          <a href="https://tiktok.com" title="TikTok" style={{display: "flex", alignItems: "center"}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#505759" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.2 3v11.4a3.9 3.9 0 1 1-3.2-3.84"></path><path d="M14.2 3c.3 2.6 1.9 4.2 4.5 4.5"></path></svg></a>
        </div>

        {/* Tinta y no carmín a propósito: la cabecera está en pantalla el 100%
            del tiempo, y un bloque carmín permanente convierte el acento en
            constante — justo lo que el manual evita al pedir que el blanco o el
            negro prevalezcan. El carmín se reserva para el momento de convertir
            dentro de la página. Lo que sí le faltaba era reaccionar: no tenía
            ningún feedback. */}
        <a href="#contacto" onClick={(e) => { e.preventDefault(); irACita(); }} className="lgp-hover-zoom lgp-header-cta lgp-btn lgp-btn-tinta" style={{alignSelf: "stretch", padding: "0 24px", letterSpacing: "0.16em"}}>Agenda una cita</a>
      </div>

      <section id="index" data-screen-label="Inicio" className="lgp-hero-height" style={{position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "110px 22px 24px", overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0}}>
          <HeroLoopVideo src="/video/casa-4701-dron-hero.mp4" poster="/hero-house.jpg" crossfadeDuration={1} />
        </div>
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(18,19,20,0.85) 0%, rgba(18,19,20,0.55) 40%, rgba(18,19,20,0.15) 68%, rgba(18,19,20,0.05) 100%)", zIndex: 1}}></div>
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,19,20,0) 0%, rgba(18,19,20,0.5) 100%)", zIndex: 1}}></div>

        <div className="lgp-contenedor" style={{position: "relative", zIndex: 2}}>
          <div data-nofx="1" style={{maxWidth: "540px", animation: "lgpUp .9s ease both"}}>
            {/* Blanco y no carmín: esto va sobre el vídeo del hero, y el carmín
                de marca a 10px sobre imagen en movimiento era prácticamente
                invisible. La regla del sistema solo contempla fondos claros;
                sobre foto, el único color que se sostiene es el blanco. */}
            <p style={{margin: "0 0 16px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "10px", letterSpacing: "0.2em", color: "#FFFFFF", textShadow: "0 1px 12px rgba(0,0,0,0.55)", textTransform: "uppercase"}}>Casas custom · Rio Grande Valley</p>
            {/* El título de la página es este, no un <p>: es lo que leen los
                buscadores y los lectores de pantalla para saber de qué va el
                sitio. Los estilos son los mismos de antes. */}
            <h1 style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "clamp(30px,3.6vw,46px)", lineHeight: "1.1", letterSpacing: "-0.03em", textTransform: "uppercase", textWrap: "balance", color: "#fff"}}>Aquí el cliente firma el plano</h1>
            <p style={{margin: "18px 0 0", maxWidth: "42ch", fontSize: "16px", lineHeight: "1.6", color: "rgba(255,255,255,0.82)", textWrap: "pretty"}}>Nadie más en el Valle te deja decidir cada módulo antes de mover un solo ladrillo.</p>
            <div style={{display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "34px"}}>
              {/* Los dos CTA son los dos caminos reales: la subdivisión o el
                  terreno propio. El primero lleva a "Lugares disponibles",
                  donde está el botón que abre el configurador — decía "elegir
                  mi lote" cuando escoger lote ya dejó de ser el requisito. */}
              <a href="#lugares" className="lgp-hover-zoom lgp-btn lgp-btn-carmin" style={{letterSpacing: "0.16em"}}>Diseñar mi casa</a>
              <a href="#personaliza" className="lgp-hover-zoom lgp-btn lgp-btn-sobre-foto" style={{letterSpacing: "0.16em"}}>Ya tengo mi lote</a>
            </div>
          </div>
        </div>

        {/* La tarjeta de cifras comparte el ancho del titular: antes iba a
            1000px dentro de un contenedor de 1240 y su borde izquierdo caía
            120px adentro del de la <h1>, sin ninguna razón. */}
        <div data-nofx="1" className="lgp-contenedor" style={{position: "relative", zIndex: "2", marginTop: "34px", background: "#FBFBFA", border: "1px solid #EAE7E3"}}>
          <div style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))"}}>
            <div style={{padding: "26px 24px", borderRight: "1px solid #EAE7E3"}}>
              <div className="lgp-cifra" style={{['--i' as string]: 0, fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>8</div>
              <div className="lgp-cifra-pie" style={{['--i' as string]: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase", marginTop: "5px"}}>Lotes en McAllen</div>
            </div>
            <div style={{padding: "26px 24px", borderRight: "1px solid #EAE7E3"}}>
              {/* Decía "7" y no era cierto: el recorrido real es de 6 con lote
                  propio y 5 en Enclave, donde la subdivisión trae la fachada
                  puesta. Publicar un número que la propia ventana desmiente en
                  su cabecera es la clase de detalle que un comprador nota. */}
              <div className="lgp-cifra" style={{['--i' as string]: 1, fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>5&ndash;6</div>
              <div className="lgp-cifra-pie" style={{['--i' as string]: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase", marginTop: "5px"}}>Pasos, seg&uacute;n tu lote</div>
            </div>
            <div style={{padding: "26px 24px"}}>
              <div className="lgp-cifra" style={{['--i' as string]: 2, fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>100%</div>
              <div className="lgp-cifra-pie" style={{['--i' as string]: 2, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase", marginTop: "5px"}}>Smart home integrado</div>
            </div>
          </div>
        </div>
      </section>

      <section id="nosotros" data-screen-label="Por qué nosotros" style={{position: "relative", padding: "var(--lgp-y-tema) var(--lgp-canal) var(--lgp-y-bloque)"}}>
        <div data-nofx="1" className="lgp-contenedor">
          <h2 style={{margin: "0 0 34px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Por qué nosotros</h2>
          <p style={{margin: "0 0 44px", maxWidth: "660px", fontSize: "clamp(19px,2.3vw,28px)", lineHeight: "1.36", letterSpacing: "-0.012em", textWrap: "pretty"}}>El Valle está lleno de casas que se parecen. Nosotros construimos <em style={{fontStyle: "italic"}}>pocas</em>, y el cliente ve cada decisión antes de que se vacíe el concreto.</p>
          {/* Tres razones paralelas, no una secuencia: por eso se fueron los
              rótulos 01/02/03 y la caja que las envolvía. Quedan columnas
              divididas por un filete vertical — la misma división que usa un
              cuadro de rotulación de plano. Sin `marginBottom`: el aire de
              cierre lo pone el padding de la sección y nada más, que es lo que
              antes sumaba 156px de vacío al apilarse. */}
          <div className="lgp-razones">
            {[
              ['Proceso a la vista', 'Cada semana recibes fotos, avance y el costo real acumulado. Sin cambios de orden sorpresa.'],
              ['Diseño modular curado', 'Combinas módulos reales con proporciones probadas. Libertad, pero dentro de lo que sí funciona.'],
              ['Smart home de fábrica', 'Clima, accesos, riego e iluminación cableados desde obra gris. No parches después.'],
            ].map(([titulo, cuerpo], i) => (
              <div
                key={titulo}
                className="lgp-razon"
                ref={observarRazon}
                style={{['--i' as string]: i}}
              >
                <h3 style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>{titulo}</h3>
                <p style={{margin: "12px 0 0", maxWidth: "34ch", fontSize: "14px", lineHeight: "1.6", color: "#5C6163"}}>{cuerpo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Justo debajo de "Por que nosotros", antes de "La obra": es la
          entrada natural de quien ya se convencio y quiere ver donde
          construir. Titulo de seccion normal (como el resto de la pagina) +
          tarjeta foto-hero de la subdivision. */}
      <section id="lugares" data-screen-label="Lugares disponibles" style={{position: "relative", padding: "0 var(--lgp-canal) var(--lgp-y-cierre)"}}>
        <div data-nofx="1" className="lgp-contenedor">
          <h2 style={{margin: "0 0 26px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Lugares disponibles</h2>

          <div style={{position: "relative", border: "1px solid #EAE7E3", background: "#fff", marginBottom: "26px"}}>
            <div style={{position: "relative", height: "clamp(240px,32vw,360px)", overflow: "hidden", background: "repeating-linear-gradient(135deg,#F3F1EE 0 8px,#FCFBFA 8px 16px)"}}>
              {/* Foto de acceso y render del townhouse, turnándose solos. Los
                  controles y el rótulo del render van arriba, no abajo: el
                  título y su degradado ya ocupan la franja inferior. */}
              <CarruselSubdivision
                imagenes={subdivisionActiva.imagenes}
                style={{position: "absolute", inset: 0}}
              />
              {/* Capa de opacidad ligera sobre toda la foto: la aplana un
                  poco para que no compita con el título y quede a tono con el
                  resto del sitio, que nunca usa fotos a color puro. Aparte,
                  independiente, del degradado inferior — ese sigue existiendo
                  solo para que el texto se lea. */}
              {/* `pointerEvents: none` en las tres capas: son decorado y texto,
                  y sin esto se tragaban el clic que abre la imagen a pantalla
                  completa, que es lo que hay debajo. */}
              <div style={{position: "absolute", inset: 0, pointerEvents: "none", background: "rgba(18,19,20,0.16)"}}></div>
              <div style={{position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(18,19,20,0) 45%, rgba(18,19,20,0.62) 100%)"}}></div>
              <div style={{position: "absolute", left: "22px", right: "22px", bottom: "18px", pointerEvents: "none"}}>
                <p style={{margin: "0 0 6px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "clamp(24px,3.4vw,36px)", letterSpacing: "-0.02em", textTransform: "uppercase", color: "#fff"}}>{subdivisionActiva.nombre}</p>
                <p style={{margin: "0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.82)", textTransform: "uppercase"}}>{subdivisionActiva.zona} · {subdivisionActiva.direccion}</p>
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", padding: "22px"}}>
              {/* La disponibilidad como cifra, con el mismo tratamiento que
                  los stats del hero (numero grande + etiqueta chica) — antes
                  era una linea de texto plano, perdida entre el resto. */}
              {/* Mismo observador que las tres razones —el que escribe
                  `data-visible`— porque esta cifra está a media página y
                  animarla al cargar sería animarla fuera de la vista. */}
              <div ref={observarRazon} className="lgp-cifra-observada" style={{display: "flex", alignItems: "baseline", gap: "10px"}}>
                <span className="lgp-cifra" style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "34px", letterSpacing: "-0.02em", color: "#1C1E1F"}}>{lotesDisponibles}</span>
                <span className="lgp-cifra-pie" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Lotes disponibles</span>
              </div>
              {/* Un solo camino. Al lado vivía "Ver mapa completo", que abría
                  el plat de los 119 lotes para escoger uno de los ocho — pero
                  los ocho son el mismo townhouse, con el mismo plan fijo y los
                  mismos 1,635 ft² habitables, así que escoger no cambiaba nada
                  de lo que sigue. Era una decisión que se le pedía al cliente
                  sin que tuviera consecuencia. */}
              <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"}}>
                <button onClick={abrirDiseno} className="lgp-hover-zoom lgp-btn lgp-btn-carmin">Diseñar mi casa &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* La obra, en grande y arriba: es lo unico de esta pagina que no es
          promesa. Va antes de pedirle nada al cliente. Cinco casas nuestras,
          fotografiadas, sin rotulo: la seccion promete "sin render que prometa
          lo que no se entrega" y ahora lo cumple. Los marcadores rayados que
          vivian aqui anunciaban fotos que faltaban justo debajo de esa frase, y
          la foto que encabezaba la tira no era una casa nuestra. */}
      <section data-screen-label="La obra" style={{position: "relative", padding: "var(--lgp-y-tema) 0 var(--lgp-y-cierre)"}}>
        <div className="lgp-sangria" style={{marginBottom: "26px"}}>
          <h2 style={{margin: "0 0 12px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>La obra</h2>
          <p style={{margin: "0", maxWidth: "620px", fontSize: "clamp(19px,2.3vw,27px)", lineHeight: "1.35", letterSpacing: "-0.012em", textWrap: "pretty"}}>Casas nuestras, terminadas y en obra. Sin render que prometa lo que no se entrega.</p>
        </div>
        {/* La tira sigue siendo de borde a borde —así se entiende que hay que
            deslizar— pero su primera pieza arranca alineada con el título de
            la sección, no a 22px de la pantalla. En un monitor ancho esos dos
            bordes se separaban más de 100px.

            El contenido y el comportamiento viven en <TiraObra>: flechas que se
            retiran en cada extremo, y visor a pantalla completa al tocar una
            foto. La lista está en lib/obra.ts. */}
        <TiraObra />
      </section>

      {/* ============== INICIO: la otra puerta al configurador ==============
          Quien va por un lote de la subdivision entra con "Disenar mi casa",
          arriba. Aqui solo queda el camino de quien ya trae terreno propio. */}
      <section id="personaliza" data-screen-label="Personaliza tu casa" style={{position: "relative", padding: "var(--lgp-y-tema) var(--lgp-canal) var(--lgp-y-cierre)", background: "rgba(255,255,255,0.68)", borderTop: "1px solid #F0EDE9", borderBottom: "1px solid #F0EDE9"}}>
        <div data-nofx="1" className="lgp-contenedor">
          <h2 style={{margin: "0 0 12px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Personaliza tu casa</h2>

          {/* Volvió y tenía algo a medias. Se le ofrece, no se le impone. */}
          {retomable ? (
    <Fragment>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "30px", padding: "18px 20px", background: "#FFF7F9", border: "1px solid #F8C9D6"}}>
            <div style={{flex: "1 1 300px", minWidth: 0}}>
              <p style={{margin: "0 0 4px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#8A2249", textTransform: "uppercase"}}>Dejaste una casa a medias</p>
              <p style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#1C1E1F"}}>
                {(retomable.lotePropio?.id ?? retomable.loteId ?? 'Tu lote')} · paso {recorridoGuardado?.n ?? retomable.paso} de {recorridoGuardado?.total ?? PASO_NOMBRES.length}. La guardamos en este navegador.
              </p>
            </div>
            <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
              <button onClick={retomar} className="lgp-hover-zoom" style={{minHeight: "44px", padding: "0 18px", background: "#EB004B", border: "0", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>Continuar</button>
              <button onClick={descartarGuardado} style={{minHeight: "44px", padding: "0 16px", background: "transparent", border: "1px solid #F8C9D6", color: "#8A2249", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>Empezar de cero</button>
            </div>
          </div>
    </Fragment>
    ) : null}

          {/* Tu propio lote: el otro camino de entrada a la misma ventana */}
          <div style={{border: "1px solid #EAE7E3", background: "#fff", padding: "clamp(22px,3vw,34px)"}}>
            <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "26px", flexWrap: "wrap"}}>
              <div style={{flex: "1 1 320px", minWidth: 0}}>
                <p style={{margin: "0 0 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A2249", textTransform: "uppercase"}}>&iquest;Ya tienes tu propio lote?</p>
                <p style={{margin: "0 0 10px", fontSize: "clamp(18px,2.1vw,24px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Tráelo como lo tengas y calculamos cuánto cabe.</p>
                <p style={{margin: "0", maxWidth: "52ch", fontSize: "15px", lineHeight: "1.6", color: "#5C6163"}}>
                  El plano en PDF o foto, las medidas a mano, o la dirección del terreno. Al ser un lote fuera de la subdivisión se te abren los tres floorplans.
                </p>
              </div>
              {/* Pasa de tinta a carmín. Abre el configurador igual que
                  "Diseñar mi casa", así que era la misma acción pintada de otro
                  color. La ley es: el carmín marca la acción que avanza, una
                  sola por región — y en esta sección esta es la única. */}
              <button onClick={abrirPropioLote} className="lgp-hover-zoom lgp-btn lgp-btn-carmin" style={{flex: "none", minHeight: "48px", padding: "0 22px", letterSpacing: "0.16em"}}>Subir mi lote &rarr;</button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PERSONALIZA TU CASA: la ventana enfocada ============
          Fuera del flujo de la pagina a proposito: mientras arma su casa no
          hay hero, ni FAQ, ni barra de navegacion compitiendo. */}
      <VentanaEnfocada
        abierto={ventanaAbierta}
        onCerrar={cerrarVentana}
        etiqueta="Personaliza tu casa"
        cabecera={
          <div style={{maxWidth: "1080px", margin: "0 auto", padding: "12px 20px 0"}}>
            {/* El "Cerrar ✕" que vivía aquí se fue al canto doblado de la hoja,
                arriba a la derecha: la esquina levantada lleva la ✕ y cierra la
                ventana. Queda un solo camino de salida en pantalla en vez de
                dos que hacen lo mismo. Escape y el gesto de "atrás" del
                teléfono siguen cerrando igual, como siempre. */}
            <div style={{display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px"}}>
              {/* La previa no lleva número: numerarla la volvería un paso, y
                  entonces el cliente del catálogo empezaría en el 2 otra vez. */}
              <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase"}}>{esPrevia ? <>Antes de empezar &mdash; {pasoNombre}</> : <>Paso {pasoNum} de {totalPasos} &mdash; {pasoNombre}</>}</span>
            </div>
            <div style={{display: "flex", gap: "1px", background: "#EAE7E3"}}>
              {pasos.map((p, _i) => (
    <Fragment key={_i}>
              <button onClick={p.onClick} style={p.style} title={p.title} aria-label={p.ariaLabel} aria-current={p.ariaCurrent} disabled={!p.permitido} className="lgp-hover-zoom">{p.etiqueta}</button>
    </Fragment>
    ))}
            </div>
            {mostrarPresupuesto ? (
    <Fragment>
            <div style={{marginTop: "12px", marginBottom: "12px"}}>
              <PresupuestoBar max={maxLivingLote()} segmentos={presupuestoSegmentos} sinLote={!lote} />
            </div>
    </Fragment>
    ) : <div style={{height: "12px"}}></div>}
          </div>
        }
      >
        <div
          className="lgp-paso-anim"
          style={{maxWidth: "1080px", margin: "0 auto", padding: "26px 20px 40px", animation: pasoAnim ? pasoAnim + ' 380ms cubic-bezier(.22,1,.36,1) both' : undefined}}
        >

          {/* La previa: solo la ve quien trae su propio terreno. Aquí no hay
              catálogo que enseñar — quien viene por un lote de la subdivisión
              entra directo al paso 1 con el suyo ya puesto. */}
          {esPrevia ? (
    <Fragment>

            <div style={{display: "flex", flexDirection: "column"}}>
              {/* Aquí había tres textos diciendo lo mismo: este párrafo, el de
                  la tarjeta, y las tres tarjetas de modo que ya explican cada
                  camino con su propia descripción. Queda solo el dato que no
                  está en ningún otro lado. */}
              <div style={{order: 1, marginTop: "0", marginBottom: "34px", padding: "clamp(20px,3vw,30px)", background: "#fff", border: "1px solid #F2004B", boxShadow: "0 2px 12px rgba(28,30,31,0.07)"}}>
                <p style={{margin: "0 0 6px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.16em", textTransform: "uppercase"}}>Tu lote</p>
                <p style={{margin: "0 0 18px", maxWidth: "540px", fontSize: "13px", lineHeight: 1.6, color: "#5C6163"}}>
                  Al ser un lote fuera de la subdivisión, se te abren los tres floorplans.
                </p>

                {lotePropio ? (
    <Fragment>
                <div style={{padding: "18px", background: "#F7F5F2", border: "1px solid #EAE7E3"}}>
                  <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"}}>
                    <div>
                      <p style={{margin: "0 0 4px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "15px"}}>Tu lote</p>
                      <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#5C6163", textTransform: "uppercase"}}>{loteFile ? loteFile.nombre : ''}</p>
                    </div>
                    <div style={{display: "flex", gap: "8px", flex: "none"}}>
                      {lotePropioActivo ? (
    <Fragment>
                      <span style={{padding: "8px 13px", background: "#EB004B", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase"}}>✓ En uso</span>
    </Fragment>
    ) : (
    <Fragment>
                      <button onClick={usarLotePropio} className="lgp-hover-zoom" style={{padding: "8px 13px", background: "#1C1E1F", border: "0", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>Usar este lote</button>
    </Fragment>
    )}
                      <button onClick={quitarLotePropio} style={{padding: "8px 13px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>Quitar</button>
                    </div>
                  </div>
                  {!lotePropioActivo ? (
    <Fragment>
                  <p style={{margin: "14px 0 0", padding: "10px 12px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40", fontSize: "12px", lineHeight: 1.5, color: "#6B6E70"}}>
                    Ahorita estás configurando sobre <strong style={{fontWeight: 600}}>{loteId}</strong> del catálogo. Toca “Usar este lote” para volver al tuyo.
                  </p>
    </Fragment>
    ) : null}
                  {loteAnalisis ? (
    <Fragment>
                  <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "12px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E4E1DD"}}>
                    {[
                      { k: 'Frente', v: loteAnalisis.frente ? loteAnalisis.frente + ' ft' : '—' },
                      { k: 'Fondo', v: loteAnalisis.fondo ? loteAnalisis.fondo + ' ft' : '—' },
                      { k: 'Área del lote', v: loteAnalisis.areaLote.toLocaleString('es-MX') + ' ft²' },
                      loteAnalisis.huella
                        ? { k: 'Huella construible', v: loteAnalisis.huella.toLocaleString('es-MX') + ' ft²' }
                        : { k: 'Máx habitable', v: (loteAnalisis.maxLiving ?? 0).toLocaleString('es-MX') + ' ft²' },
                    ].map((d) => (
    <Fragment key={d.k}>
                    <div>
                      <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{d.k}</p>
                      <p style={{margin: 0, fontFamily: "Archivo, sans-serif", fontWeight: "700", fontSize: "14px"}}>{d.v}</p>
                    </div>
    </Fragment>
    ))}
                  </div>
                  {loteAnalisis.direccion || loteAnalisis.coordenadas ? (
    <Fragment>
                  <div style={{marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #E4E1DD"}}>
                    <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>Ubicación</p>
                    <p style={{margin: 0, fontSize: "13px", lineHeight: 1.5, color: "#505759"}}>{[loteAnalisis.direccion, loteAnalisis.coordenadas].filter(Boolean).join(' · ')}</p>
                  </div>
    </Fragment>
    ) : null}
                  <p style={{margin: "14px 0 0", fontSize: "11px", lineHeight: 1.6, color: "#5C6163"}}>
                    <strong style={{fontWeight: 600}}>{loteAnalisis.fuente === 'medidas capturadas a mano' ? 'Medidas tuyas' : 'Estimado automático'}</strong> — confianza {loteAnalisis.confianza}. {loteAnalisis.nota}
                    {loteAnalisis.huella ? ' El área habitable final depende del floorplan y del garage que elijas en el paso 1.' : ` Sin frente y fondo no se pueden aplicar retiros, así que el máximo sale del ${Math.round((loteAnalisis.factor ?? 0.5) * 100)}% del área del lote.`} El arquitecto verifica las medidas y los retiros reales en la cita.
                  </p>
    </Fragment>
    ) : null}
                </div>
    </Fragment>
    ) : (
    <Fragment>
                {/* Tarjetas, no pestañas: cada camino dice qué pide y qué da,
                    y el que sirve mejor lleva sello. */}
                <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "10px", marginBottom: "20px"}}>
                  {loteModos.map((m) => (
    <Fragment key={m.key}>
                  <button onClick={m.onClick} aria-pressed={m.on} className={'lgp-hover-zoom' + (!lotePropio && m.on ? ' lgp-guia-activa' : '')} style={{textAlign: "left", padding: "15px 16px 16px", background: m.on ? "#1C1E1F" : "#fff", border: "1px solid " + (m.on ? "#1C1E1F" : "#E4E1DD"), cursor: "pointer"}}>
                    <span style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px"}}>
                      <span style={{width: "13px", height: "13px", flex: "none", borderRadius: "50%", border: "2px solid " + (m.on ? "#F2004B" : "#DDD9D4"), background: m.on ? "#F2004B" : "transparent", boxShadow: m.on ? "inset 0 0 0 2px #1C1E1F" : "none"}}></span>
                      <span style={{fontFamily: "Archivo, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: m.on ? "#FBFBFA" : "#1C1E1F"}}>{m.label}</span>
                      {/* 9px y no 8: el piso del sistema para la etiqueta mono es
                          9–10px y este sello se había quedado por debajo de su
                          propia regla. El relleno pasa al carmín de botón porque
                          lleva texto blanco encima. */}
                      {m.sello ? (
                        <span style={{marginLeft: "auto", flex: "none", padding: "3px 6px", background: m.on ? "#EB004B" : "#FFF7F9", color: m.on ? "#fff" : "#8A2249", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase"}}>{m.sello}</span>
                      ) : null}
                    </span>
                    {/* Sobre la tarjeta en tinta el gris tenue daba 2.6:1. El
                        texto claro sobre fondo oscuro necesita su propio valor,
                        no el mismo gris que se usa sobre papel. */}
                    <span style={{display: "block", fontSize: "12.5px", lineHeight: 1.55, color: m.on ? "#C9CCCD" : "#5C6163"}}>{m.desc}</span>
                  </button>
    </Fragment>
    ))}
                </div>

                {/* El aviso va antes de los campos: si manda a capturar algo,
                    tiene que verse antes de lo que hay que capturar. */}
                {loteError ? (
    <Fragment>
                <p style={{margin: "0 0 16px", padding: "12px 14px", borderLeft: "1px solid " + (loteErrorTipo === 'info' ? "#B7BABB" : "#F4DA40"), background: loteErrorTipo === 'info' ? "#F7F5F2" : "#FEFCEC", fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>{loteError}</p>
    </Fragment>
    ) : null}

                {loteModo === 'plano' ? (
    <Fragment>
                {/* El destello marca dónde tiene que tocar: es lo único que
                    falta para que el paso avance. */}
                <label className={loteLoading || lotePropio ? '' : 'lgp-guia-activa'} style={{display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 20px", background: loteLoading ? "#F4F1ED" : "#1C1E1F", color: loteLoading ? "#B7BABB" : "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: loteLoading ? "wait" : "pointer"}}>
                  {loteLoading ? 'Analizando…' : '+ Subir plano o foto'}
                  <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={onLoteFile} disabled={loteLoading} style={{display: "none"}} />
                </label>
                <p style={{margin: "10px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.06em", color: "#6E7375", textTransform: "uppercase"}}>PDF · JPG · PNG · WEBP — hasta 8 MB</p>
    </Fragment>
    ) : null}

                {loteModo === 'medidas' ? (
    <Fragment>
                <div style={{display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end"}}>
                  <label style={{flex: "1 1 120px"}}>
                    <span style={{display: "block", marginBottom: "6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>Frente (ft)</span>
                    <input value={loteFrente} onChange={(e) => setLoteFrente(e.target.value)} inputMode="decimal" placeholder="60" style={{width: "100%", padding: "11px 12px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "15px", color: "#1C1E1F"}} />
                  </label>
                  <label style={{flex: "1 1 120px"}}>
                    <span style={{display: "block", marginBottom: "6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>Fondo (ft)</span>
                    <input value={loteFondo} onChange={(e) => setLoteFondo(e.target.value)} inputMode="decimal" placeholder="120" style={{width: "100%", padding: "11px 12px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "15px", color: "#1C1E1F"}} />
                  </label>
                </div>

                {/* El tablero: todo lo que hay de aquí para abajo es lectura,
                    no captura. Los retiros dejaron de ser campos —eran tres
                    cajas de texto que parecían pedir algo y que casi nadie
                    tiene a la mano— y pasaron a ser parte del indicador: se
                    muestran como el supuesto con el que están hechas las
                    cuentas. Los únicos dos campos escribibles del bloque son
                    frente y fondo, arriba. */}
                {previaMedidas ? (
    <Fragment>
                <div style={{maxWidth: "560px", marginTop: "18px", background: "#FBFBFA", border: "1px solid #EAE7E3"}}>
                  <div style={{display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", padding: "16px"}}>
                    <RetirosDiagrama frente={previaMedidas.frente} fondo={previaMedidas.fondo} retiros={retiros} />
                    <div style={{flex: "1 1 190px", display: "grid", gap: "14px"}}>
                      {([
                        { k: 'Lote', ft2: previaMedidas.areaLote, ancho: previaMedidas.frente, largo: previaMedidas.fondo, color: '#1C1E1F' },
                        { k: 'Construible en planta baja', ft2: previaMedidas.huella, ancho: previaMedidas.anchoUtil, largo: previaMedidas.largoUtil, color: '#8A2249' },
                      ]).map((d) => (
    <Fragment key={d.k}>
                      <div>
                        <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{d.k}</p>
                        <p style={{margin: "0 0 2px", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.01em", color: d.color}}>
                          {d.ft2.toLocaleString('es-MX')} <span style={{fontSize: "13px", fontWeight: 400, color: "#5C6163"}}>ft²</span>
                        </p>
                        <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#5C6163"}}>{d.ancho}&apos; × {d.largo}&apos;</p>
                      </div>
    </Fragment>
    ))}
                    </div>
                  </div>

                  {/* Pie del tablero: con qué retiros están hechas las cuentas.
                      Que sean un supuesto nuestro y no el reglamento de su
                      ciudad no se puede esconder — es el dato que le permite al
                      cliente saber cuánto vale este número. */}
                  <div style={{display: "flex", gap: "18px", alignItems: "baseline", flexWrap: "wrap", padding: "11px 16px", borderTop: "1px solid #EAE7E3", background: "#F7F5F2"}}>
                    <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>Retiros aplicados</span>
                    {([
                      { k: 'Frente', v: retiros.frente },
                      { k: 'Fondo', v: retiros.fondo },
                      { k: 'Cada lado', v: retiros.lados },
                    ]).map((r) => (
    <Fragment key={r.k}>
                    <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#505759"}}>
                      {r.k} <strong style={{fontWeight: 700, color: "#1C1E1F"}}>{r.v}&apos;</strong>
                    </span>
    </Fragment>
    ))}
                    <span style={{flex: "1 1 100%", fontSize: "11px", lineHeight: 1.5, color: "#5C6163"}}>
                      Supuesto nuestro, no el reglamento de tu ciudad. El arquitecto lo verifica en la cita.
                    </span>
                  </div>
                </div>
    </Fragment>
    ) : null}

                {/* El botón va después de la previa: primero ve lo que le va a
                    quedar, y entonces lo confirma. */}
                <button onClick={aplicarMedidasManuales} className={'lgp-hover-zoom' + (loteFrente.trim() && loteFondo.trim() && !lotePropio ? ' lgp-guia-activa' : '')} style={{marginTop: "18px", minHeight: "44px", padding: "0 22px", background: "#1C1E1F", border: 0, color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Usar estas medidas</button>
    </Fragment>
    ) : null}

                {loteModo === 'texto' ? (
    <Fragment>
                <textarea value={loteTexto} onChange={(e) => setLoteTexto(e.target.value)} rows={4} placeholder="Ej: Lote en Mission, TX, sobre la calle Los Ebanos. Mide 60 x 120 pies. Coordenadas 26.2159, -98.3253" style={{width: "100%", padding: "12px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "inherit", fontSize: "14px", lineHeight: 1.6, color: "#1C1E1F", resize: "vertical"}} />
                <div style={{display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "12px"}}>
                  <button onClick={() => { setLoteTextoCapturado(loteTexto.trim()); analizarLote({ texto: loteTexto }); }} disabled={loteLoading || !loteTexto.trim()} className="lgp-hover-zoom" style={{padding: "12px 18px", background: (loteLoading || !loteTexto.trim()) ? "#F4F1ED" : "#1C1E1F", border: 0, color: (loteLoading || !loteTexto.trim()) ? "#B7BABB" : "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: (loteLoading || !loteTexto.trim()) ? "not-allowed" : "pointer"}}>{loteLoading ? 'Analizando…' : 'Analizar descripción'}</button>
                </div>
                <p style={{margin: "10px 0 0", maxWidth: "480px", fontSize: "11px", lineHeight: 1.5, color: "#6E7375"}}>
                  Incluye las medidas si las sabes. Una dirección o unas coordenadas solas no dicen cuánto mide el lote, así que en ese caso guardamos la ubicación y te pedimos el frente y el fondo.
                </p>
    </Fragment>
    ) : null}

                {/* Acuses de recibo. Van fuera de las pestañas para que sigan
                    visibles aunque el usuario cambie de modo o falle el análisis. */}
                {loteFile ? (
    <Fragment>
                <div style={{display: "flex", alignItems: "center", gap: "13px", marginTop: "16px", padding: "12px 14px", background: "#F4FBF6", border: "1px solid #CFE8D8"}}>
                  <span style={{flex: "none", width: "44px", height: "44px", overflow: "hidden", background: "#fff", border: "1px solid #EAE7E3", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    {loteFile.mime.startsWith('image/') ? (
    <Fragment>
    <img src={loteFile.dataUrl} alt={loteFile.nombre} style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}} />
    </Fragment>
    ) : (
    <Fragment>
    <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", fontWeight: 700, color: "#5C6163"}}>PDF</span>
    </Fragment>
    )}
                  </span>
                  <span style={{flex: 1, minWidth: 0}}>
                    <span style={{display: "block", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: "13px", color: "#1C1E1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>✓ {loteFile.nombre}</span>
                    <span style={{display: "block", marginTop: "2px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#6B8F79", textTransform: "uppercase"}}>Archivo cargado · {pesoLegible(loteFile.peso)}</span>
                  </span>
                  <button onClick={() => { setLoteFile(null); setLoteError(null); }} style={{flex: "none", padding: "7px 11px", background: "transparent", border: "1px solid #CFE8D8", color: "#6B8F79", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer"}}>Quitar</button>
                </div>
    </Fragment>
    ) : null}

                {loteUbicacion || loteTextoCapturado ? (
    <Fragment>
                <div style={{marginTop: "12px", padding: "12px 14px", background: "#F4FBF6", border: "1px solid #CFE8D8"}}>
                  <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px"}}>
                    <span style={{flex: 1, minWidth: 0}}>
                      <span style={{display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6B8F79", textTransform: "uppercase"}}>✓ Ubicación capturada</span>
                      <span style={{display: "block", marginTop: "4px", fontSize: "13px", lineHeight: 1.5, color: "#1C1E1F"}}>
                        {loteUbicacion ? [loteUbicacion.direccion, loteUbicacion.coordenadas].filter(Boolean).join(' · ') : loteTextoCapturado}
                      </span>
                    </span>
                    <button onClick={() => { setLoteUbicacion(null); setLoteTextoCapturado(null); setLoteTexto(''); }} style={{flex: "none", padding: "7px 11px", background: "transparent", border: "1px solid #CFE8D8", color: "#6B8F79", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer"}}>Quitar</button>
                  </div>
                </div>
    </Fragment>
    ) : null}
    </Fragment>
    )}
              </div>
            </div>
          
    </Fragment>
    ) : null}

          {esPaso1 ? (
    <Fragment>

            <div>
              {planFijo ? (
    <Fragment>
              <p style={{margin: "0 0 22px", maxWidth: "640px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>El lote <strong style={{fontWeight: "600"}}>{loteId}</strong> se entrega con la casa ya diseñada y aprobada por la subdivisión, así que ni el floorplan ni la fachada se cambian. Lo que sí personalizas es el interior y las zonas que quepan en el presupuesto — por eso tu recorrido son {totalPasos} pasos y no {PASO_NOMBRES.length}.</p>
    </Fragment>
    ) : (
    <Fragment>
              <p style={{margin: "0 0 22px", maxWidth: "640px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>Estas son las variantes que nuestros arquitectos curaron para <strong style={{fontWeight: "600"}}>{loteId}</strong>. El presupuesto se lleva en área habitable: garage, pórtico y exteriores no lo consumen.</p>
    </Fragment>
    )}

              <PasoDecision
                opciones={planesDecision}
                carrusel
                acuseEscuadras
                etiquetaOtras={planFijo ? 'Plano de este lote' : 'Planos disponibles'}
                accionPrimaria="Elegir este plano"
              />

            </div>

    </Fragment>
    ) : null}

          {esPaso2 ? (
    <Fragment>

            <div>
              <p style={{margin: "0 0 26px", maxWidth: "560px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>La piel de la casa. Cuatro fachadas, todas geométricas, todas nuestras.</p>
              {/* En carrusel y no en lista, por lo mismo que el floorplan: lo
                  que decide una fachada es verla grande, no leer su nombre en
                  un renglón. En lista, la maqueta cabía en 380px y a su derecha
                  quedaba media pantalla vacía — el peor reparto posible para el
                  paso donde el cliente está eligiendo cómo se va a ver su casa
                  desde la calle.

                  Se va `exclusivo` con la lista: sin filas no hay nada que
                  bloquear, y el "solo puedes llevar una" ahora lo dice el propio
                  carrusel, que enseña una a la vez y trae su botón de quitar. */}
              <PasoDecision
                opciones={fachadasDecision}
                carrusel
                acuseEscuadras
                etiquetaOtras="Fachadas disponibles"
                accionPrimaria="Elegir esta fachada"
                pieza="fachada"
                etiquetaElegido="Fachada elegida"
              />
            </div>
          
    </Fragment>
    ) : null}

          {esPaso3 ? (
    <Fragment>

            <div className={guiaLibre ? '' : 'lgp-paso4-guiado'}>
              {/* La pista de arriba: una sola frase con lo que toca ahora. */}
              {pistaGuia ? (
    <Fragment>
              <div style={{display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px", padding: "13px 16px", background: "#FFF7F9", border: "1px solid #F8C9D6"}}>
                <span className="lgp-guia-punto" style={{width: "9px", height: "9px", flex: "none", borderRadius: "50%", background: "#F2004B"}}></span>
                <span style={{flex: 1, minWidth: 0, fontSize: "14px", lineHeight: 1.5, color: "#1C1E1F"}}>{pistaGuia}</span>
                <span style={{flex: "none", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#8A2249", textTransform: "uppercase"}}>{pasoGuia} de 3</span>
              </div>
    </Fragment>
    ) : null}

              <p style={{margin: "0 0 4px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase"}}>Paleta de interior</p>
              {/* La maqueta es una cocina y la paleta manda en toda la casa: si
                  no se dice, el cliente asume que acaba de elegir el color de un
                  solo cuarto. */}
              <p style={{margin: "0 0 12px", maxWidth: "560px", fontSize: "12.5px", lineHeight: 1.55, color: "#6E7375"}}>De aquí salen carpintería, piedra y pisos de toda la casa. La cocina es donde se ven las tres juntas.</p>
              <div ref={refGama} className={claseGuia('gama')} style={{marginBottom: "34px"}}>
                <PasoDecision
                  opciones={gamasDecision}
                  etiquetaOtras="Paletas disponibles"
                  exclusivo
                  lateral
                  acuseEscuadras
                />
              </div>

              <div ref={refCuartos} className={claseGuia('cuartos')} style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", marginBottom: "22px"}}>
                {contadores.map((c) => (
    <Fragment key={c.key}>
                <div style={{background: "#fff", padding: "16px 18px"}}>
                  <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px"}}>
                    <div>
                      <p style={{margin: "0 0 3px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase"}}>{c.nombre}</p>
                      <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#6E7375", textTransform: "uppercase"}}>{c.base} en el plano · {c.living} ft² c/u</p>
                    </div>
                    <div style={{display: "flex", alignItems: "center", gap: "2px", flex: "none"}}>
                      <button onClick={c.onMenos} disabled={c.menosDisabled} title={c.menosMotivo ?? undefined} style={{width: "30px", height: "30px", border: "1px solid #E4E1DD", background: "transparent", color: c.menosDisabled ? "#DDD9D4" : "#505759", fontSize: "15px", lineHeight: 1, cursor: c.menosDisabled ? "not-allowed" : "pointer"}}>−</button>
                      <span style={{minWidth: "38px", textAlign: "center", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "17px"}}>{c.total}</span>
                      <button onClick={c.onMas} disabled={c.masDisabled} title={c.masMotivo ?? undefined} style={{width: "30px", height: "30px", border: "0", background: c.masDisabled ? "#F4F1ED" : "#F2004B", color: c.masDisabled ? "#B7BABB" : "#fff", fontSize: "15px", lineHeight: 1, cursor: c.masDisabled ? "not-allowed" : "pointer"}}>+</button>
                    </div>
                  </div>
                  {c.masMotivo ? (
    <Fragment>
                  <p style={{margin: "10px 0 0", fontSize: "11px", lineHeight: 1.5, color: "#6E7375"}}>{c.masMotivo}</p>
    </Fragment>
    ) : null}
                </div>
    </Fragment>
    ))}
              </div>

              {/* El plano ya trae recámaras y baños, así que sin un "listo" la
                  etapa se saltaría sola y el cliente nunca vería el contador. */}
              {etapaGuia === 'cuartos' ? (
    <Fragment>
              <button onClick={() => setTocadoCuartos(true)} className="lgp-hover-zoom lgp-guia-activa" style={{display: "block", width: "100%", maxWidth: "520px", minHeight: "48px", marginBottom: "26px", background: "#1C1E1F", border: 0, color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>
                {recamarasExtra === 0 && banosExtra === 0 ? 'Así están bien — seguir a zonas →' : `Listo: ${totalRec} recámaras y ${totalBanos} baños →`}
              </button>
    </Fragment>
    ) : null}

              <div ref={refZonas} className={claseGuia('zonas')}>
              <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", marginBottom: "14px"}}>
                <div style={{display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap"}}>
                  <p style={{margin: "0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase"}}>Zonas</p>
                  <span title="Área habitable disponible dentro del límite de tu lote, ya restando el floorplan, los cuartos extra y las zonas que llevas" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: ft2Rest > 0 ? "#8A2249" : "#6E7375", textTransform: "uppercase"}}>{ft2Rest} ft² habitables disponibles</span>
                </div>
                {/* El análisis del brief vive en el paso 5, después de que el
                    usuario ya armó sus zonas. Aquí no hay brief que analizar. */}
              </div>

              {/* Por defecto, el panel de zonas del prototipo: detalle a la
                  izquierda, lo que llevas a la derecha y la lista abajo. Quien
                  prefiera que le pregunten una por una tiene el otro modo. */}
              {verTodasZonas ? (
    <Fragment>
              <ZonasGuiadas mods={mods} ft2Rest={ft2Rest} verTodas={verTodasZonas} onVerTodas={setVerTodasZonas} liberar={liberarEspacio} />
    </Fragment>
    ) : (
    <Fragment>
              <ZonasPanel
                mods={mods}
                ft2Rest={ft2Rest}
                liberar={liberarEspacio}
                tragaluces={tragaluces}
                maxTragaluces={MAX_TRAGALUCES}
                orientacionHint={orientacionHint}
                onToggleTragaluz={toggleTragaluz}
                onVerGuiado={() => setVerTodasZonas(true)}
              />
    </Fragment>
    )}
              {/* Salida explícita de la última etapa: agregar zona no es
                  obligatorio, y sin este botón quien no quiere ninguna se
                  quedaba encerrado con el resto del paso apagado. */}
              {etapaGuia === 'zonas' ? (
    <Fragment>
              <button onClick={() => setTocadoZonas(true)} className="lgp-hover-zoom" style={{display: "block", width: "100%", maxWidth: "520px", minHeight: "48px", marginTop: "16px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>
                Ya terminé con las zonas →
              </button>
    </Fragment>
    ) : null}
              </div>

              {/* Antes esto era un collage con un botón de "pantalla completa"
                  que abría lo mismo, más grande. Ahora es la mesa del
                  arquitecto: mientras arma sus zonas, va viendo cómo se le
                  acumulan los papeles encima del escritorio. */}
              <div className={guiaLibre ? '' : 'lgp-guia-bloqueada'} style={{marginTop: "34px"}}>
                <p style={{margin: "0 0 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase"}}>Tu casa, por ahora</p>
                <div style={{border: "1px solid #EAE7E3", boxShadow: "0 2px 10px rgba(28,30,31,0.07)"}}>
                  <MesaArquitecto
                    planKey={plan}
                    planNombre={planNombreSel}
                    planMeta={`${totalRec} rec · ${totalBanos} baños · ${garageTexto}`}
                    loteId={lote ? lote.id : '—'}
                    loteMedida={loteMedida}
                    fachadaKey={fachada}
                    fachadaNombre={fachadaTexto}
                    fachadaFija={fachadaFija}
                    interior={interiorSeleccionado}
                    zonas={modulosSeleccionados}
                    brief={brief}
                    ft2Living={ft2LivingTotal}
                    ft2Total={ft2ConstruidoTotal}
                    recamaras={totalRec}
                    banos={totalBanos}
                  />
                </div>
              </div>
            </div>

    </Fragment>
    ) : null}

          {esPaso4 ? (
    <Fragment>

            <div style={{maxWidth: "700px"}}>
              <p style={{margin: "0 0 8px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em", textWrap: "pretty"}}>¿Algo que quieras aclarar o pedir sobre lo que armaste?</p>
              <p style={{margin: "0 0 20px", fontSize: "15px", lineHeight: "1.6", color: "#5C6163"}}>
                Tu combinación ya está completa. Aquí solo van los comentarios de personalización sobre lo que elegiste, o una petición especial que quieras que el arquitecto escuche en persona.
              </p>

              {/* El brief comenta sobre algo concreto, así que se muestra qué. */}
              <div style={{display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "18px"}}>
                {[plan ? PLANES[plan].nombre : null,
                  fachada ? (FACHADAS.find((f) => f.key === fachada) || ({} as any)).nombre : null,
                  interior ? (INTERIORES.find((i) => i.key === interior) || ({} as any)).nombre : null,
                  `${totalRec} rec · ${totalBanos} baños`,
                  ...modulos.map((k) => (MODULOS.find((m) => m.key === k) || ({} as any)).corto),
                ].filter(Boolean).map((chip, _i) => (
    <Fragment key={_i}>
                <span style={{padding: "5px 10px", background: "#F7F5F2", border: "1px solid #EAE7E3", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.04em", color: "#505759"}}>{chip as string}</span>
    </Fragment>
    ))}
              </div>

              {/* Si pidió el comodín room, aquí es donde dice para qué lo quiere. */}
              {modulos.includes('comodin') ? (
    <Fragment>
              <div style={{marginBottom: "18px", padding: "14px 16px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40"}}>
                <p style={{margin: "0 0 4px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#8A7A2A", textTransform: "uppercase"}}>Elegiste un comodín room</p>
                <p style={{margin: 0, fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>
                  Es el cuarto que dejaste sin uso asignado. Cuéntanos aquí para qué lo quieres —gym, visitas, taller, estudio— y el arquitecto llega a la cita con esa idea ya leída.
                </p>
              </div>
    </Fragment>
    ) : null}

              <textarea className="lgp-campo" value={brief} onChange={onBrief} placeholder="El comodín room lo quiero como gym, con espejo de pared a pared. Y quisiera ver si la pérgola del patio se puede alargar hasta la cocina exterior…" rows={7} style={{width: "100%", padding: "18px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "15px", lineHeight: "1.65", color: "#1C1E1F"}}></textarea>
              <div style={{display: "flex", justifyContent: "space-between", marginTop: "10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>
                <span>Opcional, pero cambia todo</span><span>{briefLen} caracteres</span>
              </div>

              {/* Sin analisis por IA: el brief son comentarios para el
                  arquitecto, no una lista de compras que haya que interpretar.
                  Viaja tal cual en la ficha. */}
              <p style={{margin: "16px 0 0", padding: "13px 15px", background: "#F7F5F2", borderLeft: "1px solid #E4E1DD", fontSize: "13px", lineHeight: 1.6, color: "#505759"}}>
                Lo que escribas viaja tal cual al arquitecto, con tus palabras. No lo resumimos ni lo interpretamos.
              </p>

              {!lote || !plan ? (
    <Fragment>
              <p style={{margin: "16px 0 0", padding: "12px 14px", background: "#F7F5F2", borderLeft: "1px solid #B7BABB", fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>
                Para analizar tu brief contra el espacio disponible necesitamos primero el lote y el floorplan.
              </p>
    </Fragment>
    ) : null}
            </div>

    </Fragment>
    ) : null}

          {/* Paso 6 - TU CASA. Primero ve lo que armo; los datos se piden
              hasta el paso 7. Ensenar el resultado antes de pedir el telefono
              es la diferencia entre un regalo y un peaje. */}
          {esPaso5 ? (
    <Fragment>

            <div>
              <p style={{margin: "0 0 6px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Así quedó tu casa, sobre la mesa.</p>
              <p style={{margin: "0 0 22px", maxWidth: "620px", fontSize: "15px", lineHeight: "1.6", color: "#5C6163"}}>
                Esto es exactamente lo que le llega al arquitecto. Si algo no te cuadra, regresa y cámbialo &mdash; todavía no has enviado nada.
              </p>

              <div style={{border: "1px solid #EAE7E3", boxShadow: "0 2px 10px rgba(28,30,31,0.07)", marginBottom: "26px"}}>
                <MesaArquitecto
                  planKey={plan}
                  planNombre={planNombreSel}
                  planMeta={`${totalRec} rec / ${totalBanos} banos / ${garageTexto}`}
                  loteId={lote ? lote.id : '-'}
                  loteMedida={loteMedida}
                  fachadaKey={fachada}
                  fachadaNombre={fachadaTexto}
                  fachadaFija={fachadaFija}
                  interior={interiorSeleccionado}
                  zonas={modulosSeleccionados}
                  brief={brief}
                  ft2Living={ft2LivingTotal}
                  ft2Total={ft2ConstruidoTotal}
                  recamaras={totalRec}
                  banos={totalBanos}
                />
              </div>

              <div style={{border: "1px solid #EAE7E3", maxWidth: "640px"}}>
                <div style={{padding: "14px 16px", borderBottom: "1px solid #EAE7E3", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase"}}>El detalle, en números</div>
                {resumen.map((r, _i) => (
    <Fragment key={_i}>
                  <div style={{display: "flex", gap: "16px", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid #F4F1ED"}}>
                    <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase", flex: "none"}}>{r.k}</span>
                    <span style={{fontSize: "14px", lineHeight: "1.5", textAlign: "right", color: "#1C1E1F"}}>{r.v}</span>
                  </div>
    </Fragment>
    ))}
              </div>
            </div>

    </Fragment>
    ) : null}

          {/* Paso 7 - TUS DATOS. Ya vio su casa; ahora si se le piden los datos
              y se manda. */}
          {esPaso6 ? (
    <Fragment>

            <div>
              {enviado ? (
    <Fragment>

                {/* Antes esta pantalla explicaba el seguimiento a 24h/72h/7
                    días — de más en el momento en que alguien solo quiere
                    saber que sí se mandó. Ese detalle vive en el correo real
                    que le llega al arquitecto, no hace falta repetirlo aquí. */}
                <div className="lgp-acuse" style={{maxWidth: "420px", padding: "40px 34px", border: "1px solid #EAE7E3", background: "#FBFBFA", textAlign: "center"}}>
                  {/* El check se dibuja: era el carácter "✓" de la tipografía,
                      que ni es un icono del sistema ni se puede trazar. Ahora
                      es SVG y el trazo se traza — que es lo que hace que se
                      lea como "acaba de pasar" y no como "siempre estuvo". */}
                  <span style={{display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", margin: "0 auto 18px", borderRadius: "50%", background: "#F2004B"}}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
                      <path
                        className="lgp-acuse-trazo"
                        style={{['--largo' as string]: 21}}
                        d="M5 12.5 L10 17.5 L19 7.5"
                        stroke="#fff"
                        strokeWidth="2.4"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                  </span>
                  <p style={{margin: "0 0 26px", fontSize: "clamp(18px,2.1vw,22px)", lineHeight: "1.4", letterSpacing: "-0.01em"}}>Se ha enviado con éxito.</p>
                  {/* Cerrar no convierte: es tinta, no carmín. */}
                  <button onClick={cerrarTrasEnviar} className="lgp-hover-zoom lgp-btn lgp-btn-tinta" style={{padding: "0 26px", letterSpacing: "0.16em"}}>Cerrar</button>
                </div>

    </Fragment>
    ) : null}
              {noEnviado ? (
    <Fragment>

                <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "30px", maxWidth: "820px"}}>
                  <div>
                    <p style={{margin: "0 0 8px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Ya esta armada. A quien se la mandamos?</p>
                    <p style={{margin: "0 0 26px", fontSize: "15px", lineHeight: "1.6", color: "#5C6163"}}>Tus datos van directo al arquitecto que revisará esta configuración. Nada de call centers.</p>
                    <div style={{display: "grid", gap: "14px"}}>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Nombre completo</span>
                        <input className="lgp-campo" value={leadNombre} onChange={onNombre} autoComplete="name" placeholder="María Elena Cavazos" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px"}} />
                      </label>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Correo</span>
                        <input className="lgp-campo" value={leadCorreo} onChange={onCorreo} type="email" inputMode="email" autoComplete="email" placeholder="maria@correo.com" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px"}} />
                      </label>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Teléfono</span>
                        <input className="lgp-campo" value={leadTel} onChange={onTel} type="tel" inputMode="tel" autoComplete="tel" placeholder="Tu número" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px"}} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{margin: "0 0 14px", fontSize: "15px", lineHeight: "1.6", color: "#505759"}}>Al enviar, el arquitecto recibe la ficha completa de tu configuración &mdash; con el desglose de pies cuadrados, el croquis de tu lote, tus zonas y tu petición tal cual la escribiste &mdash; y arrancamos el seguimiento para agendar tu cita presencial.</p>
                    <button onClick={enviar} disabled={enviando} className="lgp-hover-zoom" style={{padding: "14px 20px", background: enviando ? "#F4F1ED" : "#F2004B", color: enviando ? "#B7BABB" : "#fff", border: "0", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: enviando ? "wait" : "pointer"}}>
                      {enviando ? 'Enviando...' : 'Enviar al arquitecto'}
                    </button>
                    {envioError ? (
    <Fragment>
                    <div style={{marginTop: "14px", padding: "13px 15px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40"}}>
                      <p style={{margin: "0 0 10px", fontSize: "13px", lineHeight: "1.6", color: "#505759"}}>{envioError}</p>
                      <button onClick={irACita} style={{padding: "8px 13px", background: "#fff", border: "1px solid #E4E1DD", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer"}}>Agendar mi cita</button>
                    </div>
    </Fragment>
    ) : null}
                  </div>
                </div>

    </Fragment>
    ) : null}
            </div>

    </Fragment>
    ) : null}

          <div className="lgp-step-actions" style={{display: "flex", alignItems: "center", gap: "10px", marginTop: "40px", paddingTop: "22px", borderTop: "1px solid #F0EDE9"}}>
            <button onClick={atras} className="lgp-hover-zoom" style={{minHeight: "44px", padding: "0 17px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>← Atrás</button>
            {/* No hay paso 8: en el 7 este botón se veía activo pero tocarlo
                no llevaba a ningún lado — `siguiente()` recalculaba el mismo
                paso en el que ya estabas. */}
            {esPaso6 ? null : (
            <button onClick={siguiente} disabled={siguienteBloqueado} title={siguienteBloqueado ? `Antes elige ${faltantes.map((f) => f.que).join(', ')}` : undefined} className="lgp-hover-zoom" style={{minHeight: "44px", padding: "0 17px", background: siguienteBloqueado ? "#F4F1ED" : "#1C1E1F", border: "0", color: siguienteBloqueado ? "#6E7375" : "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: siguienteBloqueado ? "not-allowed" : "pointer"}}>Siguiente →</button>
            )}
            <span style={{marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{pasoHint}</span>
          </div>

          {/* Qué falta para poder mandar el resumen. Solo estorba si de verdad falta algo. */}
          {siguienteBloqueado ? (
    <Fragment>
          <div style={{marginTop: "16px", padding: "14px 16px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40"}}>
            <p style={{margin: "0 0 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Falta por definir</p>
            <div style={{display: "flex", flexWrap: "wrap", gap: "8px"}}>
              {faltantes.map((f) => (
    <Fragment key={f.que}>
              <button onClick={() => setPaso(f.paso)} className="lgp-hover-zoom" style={{padding: "7px 12px", background: "#fff", border: "1px solid #E4E1DD", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer"}}>
                Elegir {f.que} → paso {f.paso}
              </button>
    </Fragment>
    ))}
            </div>
          </div>
    </Fragment>
    ) : null}
        </div>
      </VentanaEnfocada>



      {/* El FAQ conserva su columna angosta —760px es medida de lectura, no
          capricho— pero deja de ir centrado en la página: ahora arranca en el
          mismo borde izquierdo que todo lo de arriba. Centrado, era el único
          bloque de la página cuyo margen izquierdo no coincidía con ninguno. */}
      <section id="faq" data-screen-label="FAQ" style={{position: "relative", padding: "var(--lgp-y-tema) var(--lgp-canal) var(--lgp-y-cierre)", background: "rgba(255,255,255,0.68)", borderTop: "1px solid #F0EDE9"}}>
        <div data-nofx="1" className="lgp-contenedor">
          <div style={{maxWidth: "760px"}}>
          <h2 style={{margin: "0 0 30px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Preguntas frecuentes</h2>
          <div style={{borderTop: "1px solid #EFECE8"}}>
            {faqs.map((f, _i) => (
    <Fragment key={_i}>

              <div style={{borderBottom: "1px solid #EFECE8"}}>
                {/* Sale `.lgp-hover-zoom` y entra el cambio de fondo: escalar
                    una fila de ancho completo mueve el texto de la pregunta
                    justo mientras se está leyendo. Es regla del sistema. */}
                <button onClick={f.onToggle} aria-expanded={f.open} className="lgp-faq-fila" style={{display: "flex", alignItems: "center", gap: "14px", width: "100%", padding: "17px 4px", background: "transparent", border: "0", textAlign: "left", cursor: "pointer"}}>
                  <span className="lgp-faq-glifo" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: "#F2004B", flex: "none", width: "12px"}}>{f.icon}</span>
                  <span style={{fontSize: "15px", lineHeight: "1.5", color: "#1C1E1F"}}>{f.q}</span>
                </button>
                {f.open ? (
    <Fragment>

                  <p className="lgp-faq-respuesta" style={{margin: "0", padding: "0 4px 22px 30px", maxWidth: "600px", fontSize: "14px", lineHeight: "1.7", color: "#5C6163"}}>{f.a}</p>
                
    </Fragment>
    ) : null}
              </div>
            
    </Fragment>
    ))}
          </div>
          </div>
        </div>
      </section>

      {/* Contacto sí va centrado a propósito: es el cierre de la página, y un
          bloque centrado la remata en vez de dejarla colgando a la izquierda.
          Al estar centrado dentro del mismo eje, no rompe la retícula. */}
      <section id="contacto" data-screen-label="Contacto" style={{position: "relative", padding: "var(--lgp-y-tema) var(--lgp-canal) 0", overflow: "hidden"}}>
        <div data-nofx="1" style={{maxWidth: "660px", margin: "0 auto", textAlign: "center"}}>
          <p style={{margin: "0 0 26px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.16em", color: "#6E7375", textTransform: "uppercase"}}>Contacto</p>
          <p style={{margin: "0 0 40px", fontSize: "clamp(20px,2.5vw,30px)", lineHeight: "1.34", letterSpacing: "-0.014em", textWrap: "pretty"}}>Trae tu idea a medio cocinar. La terminamos juntos en el lote.</p>
          {citaEnviada ? (
    <Fragment>

          <div style={{maxWidth: "460px", margin: "0 auto", padding: "30px 28px", border: "1px solid #EAE7E3", background: "#fff", textAlign: "left"}}>
            <p style={{margin: "0 0 10px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.18em", color: "#8A2249", textTransform: "uppercase"}}>Cita solicitada</p>
            <p style={{margin: "0 0 14px", fontSize: "clamp(18px,2.1vw,23px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Listo, {leadPrimerNombre}. Te buscamos en menos de 24 horas.</p>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.65", color: "#505759"}}>{configCompleta ? 'El arquitecto llega a la llamada con tu configuración ya revisada.' : 'Si mientras tanto quieres adelantar, arma tu casa en el configurador y llegamos con algo concreto que enseñarte.'}</p>
            {configCompleta ? null : (
    <Fragment>
            <p style={{margin: "16px 0 0"}}><a href="#personaliza" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#5C6163", textTransform: "uppercase", borderBottom: "1px solid #E4E1DD"}}>Personalizar mi casa ↗</a></p>
    </Fragment>
    )}
          </div>

    </Fragment>
    ) : (
    <Fragment>

          <div style={{maxWidth: "460px", margin: "0 auto", textAlign: "left"}}>
            <div style={{display: "grid", gap: "14px"}}>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Nombre completo</span>
                <input className="lgp-campo" ref={citaNombreRef} value={leadNombre} onChange={onNombre} placeholder="María Elena Cavazos" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px"}} />
              </label>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Correo</span>
                <input className="lgp-campo" type="email" inputMode="email" autoComplete="email" value={leadCorreo} onChange={onCorreo} placeholder="maria@correo.com" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px"}} />
              </label>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Teléfono</span>
                <input className="lgp-campo" type="tel" inputMode="tel" autoComplete="tel" value={leadTel} onChange={onTel} placeholder="Tu número" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px"}} />
              </label>
            </div>
            {citaError ? (
    <Fragment>
            <p style={{margin: "14px 0 0", padding: "11px 13px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40", fontSize: "13px", lineHeight: "1.5", color: "#505759"}}>{citaError}</p>
    </Fragment>
    ) : null}
            {/* El botón que convierte. Era el único de la página sin ninguna
                reacción al cursor — justo el más importante. Mientras envía no
                invierte: un botón en espera no debe ofrecer feedback de que se
                puede volver a pulsar. */}
            <button
              onClick={agendarCita}
              disabled={citaEnviando}
              className={`lgp-hover-zoom lgp-btn${citaEnviando ? '' : ' lgp-btn-carmin'}`}
              style={{width: "100%", marginTop: "18px", minHeight: "50px", letterSpacing: "0.16em", ...(citaEnviando ? {background: "#F4F1ED", borderColor: "#EAE7E3", color: "#6E7375", cursor: "wait"} : null)}}
            >
              {citaEnviando ? 'Enviando…' : 'Agendar mi cita →'}
            </button>
            <p style={{margin: "12px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", lineHeight: "1.6", letterSpacing: "0.08em", color: "#6E7375", textTransform: "uppercase"}}>Con el correo o el teléfono basta</p>
          </div>

    </Fragment>
    )}
          {/* WhatsApp es la vía alterna, no la principal. Antes era una barra
              a todo lo ancho en fantasma, del mismo tamaño que "Agendar mi
              cita": dos bloques iguales uno encima del otro, y el ojo tenía que
              leer los dos para saber cuál era el que convertía. Ahora es una
              burbuja — el logo solo, sin texto, porque este es de los pocos
              iconos que el mundo entero ya sabe leer.

              El verde de marca no compite con el carmín: la jerarquía la carga
              el tamaño, y 54px contra una barra de 460 no dejan lugar a dudas
              de cuál es el camino principal. Un logo de WhatsApp en gris, en
              cambio, deja de leerse como WhatsApp y se vuelve un icono
              cualquiera — justo lo que no puede pasar cuando el texto se fue.

              Se dibuja también cuando la cita ya salió — quien quiere preguntar
              algo más no tiene por qué volver al formulario. */}
          {WA_HREF || WA_PENDIENTE ? (
    <Fragment>

          <div style={{display: "flex", flexDirection: "column", alignItems: "center", margin: "26px auto 0"}}>
            {/* Sin texto visible, el nombre lo cargan `aria-label` y `title`:
                para un lector de pantalla el enlace tiene que seguir diciendo a
                dónde va, y para quien duda, el cursor lo resuelve sin clic. */}
            <a
              href={WA_HREF ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={WA_HREF ? undefined : true}
              aria-label="Escríbenos por WhatsApp"
              title={WA_HREF ? 'Escríbenos por WhatsApp' : 'Sin número configurado'}
              className={`lgp-wa-burbuja${WA_HREF ? ' lgp-hover-zoom' : ' lgp-wa-burbuja-pendiente'}`}
            >
              <WhatsappGlifo tam={26} />
            </a>
            <p style={{margin: "11px 0 0", maxWidth: "300px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", lineHeight: "1.6", letterSpacing: "0.08em", color: "#6E7375", textTransform: "uppercase", textAlign: "center"}}>
              {WA_HREF ? 'Respuesta directa, sin formulario' : 'Sin número: define NEXT_PUBLIC_LGP_WHATSAPP. Solo se ve en desarrollo'}
            </p>
          </div>

    </Fragment>
    ) : null}
          {/* Los 16px de alto de estos enlaces eran el objetivo más chico de la
              página. Con el correo —y el WhatsApp, cuando haya número— siendo
              las vías de contacto reales, tienen que poderse tocar. */}
          <div style={{display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "10px 26px", marginTop: "46px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.08em", color: "#5C6163"}}>
            <a href="mailto:contact@lagranpiedrallc.com" style={{display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 4px"}}>CONTACT@LAGRANPIEDRALLC.COM</a>
            <span style={{display: "inline-flex", alignItems: "center", minHeight: "44px"}}>EDINBURG, TX</span>
          </div>
          <p style={{margin: "30px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#6E7375"}}>LA GRAN PIEDRA LLC · TX BUILDER · © 2026</p>
        </div>
        {/* La máscara que hunde el nombre en el papel ya estaba aquí; lo que
            faltaba era usarla. Al llegar al pie, las dos líneas suben desde
            dentro de ella: el nombre sale del papel en vez de encenderse
            encima. Es el cierre del recorrido que abre el telón. */}
        <div ref={observarRazon} className="lgp-firma" style={{marginTop: "70px", lineHeight: "0.78", textAlign: "center", maskImage: "linear-gradient(#000 34%, transparent 92%)", WebkitMaskImage: "linear-gradient(#000 34%, transparent 92%)"}}>
          <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "900", fontSize: "clamp(56px,13.4vw,220px)", letterSpacing: "-0.045em", color: "#F2004B", whiteSpace: "nowrap"}}>LA GRAN</div>
          <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "900", fontSize: "clamp(56px,13.4vw,220px)", letterSpacing: "-0.045em", color: "#F2004B", whiteSpace: "nowrap"}}>PIEDRA</div>
        </div>
      </section>

      <div data-nofx="1" className="lgp-bottom-nav-wrap" style={{position: "fixed", bottom: "0", left: "0", right: "0", zIndex: "60", display: "flex", justifyContent: "center", padding: "14px 22px calc(18px + env(safe-area-inset-bottom))", pointerEvents: "none"}}>
        {/* El relleno vertical se fue del contenedor a cada enlace: la barra
            medía 15px de alto y era la navegación principal en móvil, a un
            tercio del objetivo táctil de 44px que el sistema exige. */}
        <div className="lgp-bottom-nav" style={{display: "flex", gap: "4px", padding: "0 8px", background: "#FBFBFA", boxShadow: "0 1px 0 rgba(28,30,31,0.06) inset, 0 6px 22px rgba(28,30,31,0.14)", pointerEvents: "auto"}}>
          {nav.map((n, _i) => (
    <Fragment key={_i}>

            <a href={n.href} className="lgp-hover-zoom" style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", minHeight: "44px", padding: "0 12px", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: n.color}}>
              <span style={{width: "5px", height: "5px", display: "block", flex: "none", background: n.dot}}></span>{n.label}
            </a>

    </Fragment>
    ))}
        </div>
      </div>

    </div>
  );
}
