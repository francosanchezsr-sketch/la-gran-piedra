'use client';

import { Fragment, createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent as ReactPointerEvent, RefObject, WheelEvent } from 'react';
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
  PLAT_ENCLAVE107,
} from '@/lib/data';
import type { SubdivisionKey, Lote } from '@/lib/data';
import type { Ficha } from '@/lib/ficha';
import { leerGuardado, escribirGuardado, borrarGuardado, valeLaPenaRetomar, type ConfigGuardada } from '@/lib/guardado';
import HeroLoopVideo from '@/components/HeroLoopVideo';
import { ModuloIcon, FachadaIcon } from '@/components/ConfigIcons';
import MoodboardPreview from '@/components/MoodboardPreview';
import MoodboardCollage from '@/components/MoodboardCollage';
import MesaArquitecto from '@/components/MesaArquitecto';
import VentanaEnfocada from '@/components/VentanaEnfocada';
import SubdivisionOverview from '@/components/SubdivisionOverview';
import PlanDiagram from '@/components/FloorplanDiagram';
import PresupuestoBar from '@/components/PresupuestoBar';
import RetirosDiagrama from '@/components/RetirosDiagrama';
import ZonasGuiadas from '@/components/ZonasGuiadas';
import ZonasPanel from '@/components/ZonasPanel';
import PasoDecision from '@/components/PasoDecision';
import { RENDER_PLAN, ICONO_ZONA, ICONO_TRAGALUZ } from '@/lib/assets';
import { PHOTO_BY_MODULE } from '@/lib/modulePhotos';

type PlanKey = keyof typeof PLANES;
type Sugerencia = { key: string; razon: string | null };
type Lead = { nombre: string; correo: string; tel: string };

const STEP = 26;
const R = 90;

// Tope de tragaluces en una misma casa.
const MAX_TRAGALUCES = 3;

// --- Giro táctil de los cilindros -------------------------------------------
// En escritorio el cilindro se mueve con la rueda y con las flechas ▲▼. En
// táctil no hay ninguna de las dos, así que se gira arrastrando el dedo y se
// avanza un paso tocando por encima o por debajo de la banda central.
type DrumTouch = { y0: number; i0: number; movido: boolean } | null;

// Píxeles de arrastre que equivalen a un paso del cilindro.
const DRUM_PX_POR_PASO = 34;
// Por debajo de este movimiento el gesto es un tap, no un arrastre.
const DRUM_TAP_PX = 8;
// Media altura de la banda central: tocar ahí no mueve nada.
const DRUM_BANDA_PX = 22;

function crearDrumTouch(
  touchRef: RefObject<DrumTouch>,
  clickOffRef: RefObject<boolean>,
  getIdx: () => number,
  go: (i: number) => void,
) {
  return {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      // El ratón ya tiene rueda y flechas; no le robamos el click.
      if (e.pointerType === 'mouse') return;
      touchRef.current = { y0: e.clientY, i0: getIdx(), movido: false };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = touchRef.current;
      if (!d) return;
      // Arriba es avanzar, igual que la rueda: por eso y0 - clientY.
      const dy = d.y0 - e.clientY;
      if (Math.abs(dy) > DRUM_TAP_PX) d.movido = true;
      const destino = d.i0 + Math.round(dy / DRUM_PX_POR_PASO);
      if (destino !== getIdx()) go(destino);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = touchRef.current;
      touchRef.current = null;
      if (!d) return;
      if (d.movido) {
        // Al soltar, el navegador dispara un click sobre el item que quedó
        // debajo del dedo. Sin esto, ese click deshace el giro.
        clickOffRef.current = true;
        return;
      }
      // Tap sobre un item: su propio onClick lo centra, no duplicamos.
      if ((e.target as HTMLElement | null)?.closest('button')) return;
      const r = e.currentTarget.getBoundingClientRect();
      const dyCentro = e.clientY - (r.top + r.height / 2);
      if (Math.abs(dyCentro) < DRUM_BANDA_PX) return;
      go(getIdx() + (dyCentro > 0 ? 1 : -1));
    },
    onPointerCancel: () => { touchRef.current = null; },
    onClickCapture: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!clickOffRef.current) return;
      clickOffRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}

function statusColor(s: string) {
  return s === 'disponible' ? '#F2004B' : s === 'reservado' ? '#F4DA40' : '#D5D7D8';
}

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
  const wheelAtRef = useRef(0);
  const moduloWheelAtRef = useRef(0);
  // Id del lote con el que se armó la configuración actual, para distinguir
  // "cambió de lote" de "recalculó el mismo lote".
  const loteAnteriorRef = useRef<string | null>(null);

  const [lotModal, setLotModal] = useState<Lote | null>(null);
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
  const [citaError, setCitaError] = useState<string | null>(null);
  const citaNombreRef = useRef<HTMLInputElement | null>(null);
  // Arrastre táctil de los cilindros. `movido` distingue un giro de un tap, y
  // clickOff traga el click que el navegador dispara al soltar tras arrastrar.
  const drumTouchRef = useRef<DrumTouch>(null);
  const drumClickOffRef = useRef(false);
  const moduloTouchRef = useRef<DrumTouch>(null);
  const moduloClickOffRef = useRef(false);
  const [drumIdx, setDrumIdx] = useState(1);
  const [moduloIdx, setModuloIdx] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  // La ventana enfocada donde vive el configurador. La página de inicio solo
  // decide con qué lote se entra.
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  // Quién abrió la ventana: quien llega por "ya tengo mi lote" no quiere ver
  // primero el catálogo de la subdivisión, quiere subir su plano.
  const [entradaPropia, setEntradaPropia] = useState(false);
  const [tragaluces, setTragaluces] = useState<string[]>([]);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [subdivisionKey, setSubdivisionKey] = useState<SubdivisionKey>(SUBDIVISIONES[0].key);
  const subdivisionActiva = SUBDIVISIONES.find((s) => s.key === subdivisionKey) ?? SUBDIVISIONES[0];
  const [recamarasExtra, setRecamarasExtra] = useState(0);
  const [banosExtra, setBanosExtra] = useState(0);
  // Dimmer del paso 2: área habitable objetivo del floorplan. null = el tamaño
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
    // El cilindro también se repone: si se queda en su índice por default, el
    // paso 1 enseña un lote distinto del que manda en el presupuesto.
    if (restaurado) {
      const idx = visibles.findIndex((v) => v.id === restaurado.id);
      if (idx >= 0) setDrumIdx(idx);
    }
    setPlan((g.plan as PlanKey | null) ?? null);
    setFachada(g.fachada);
    setInterior(g.interior);
    setModulos(g.modulos ?? []);
    setTragaluces(g.tragaluces ?? []);
    setRecamarasExtra(g.recamarasExtra ?? 0);
    setBanosExtra(g.banosExtra ?? 0);
    setPlanLivingSel(g.planLivingSel ?? null);
    setGarage2(g.garage2 ?? true);
    setBrief(g.brief ?? '');
    setLead(g.lead ?? { nombre: '', correo: '', tel: '' });
    setPaso(g.paso && g.paso >= 1 && g.paso <= 7 ? g.paso : 2);
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
        if (!idle) { ctx.drawImage(flat!, 0, 0, cw, ch); idle = true; }
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

  function drumGo(i: number, list: Lote[]) {
    const n = list.length;
    const idx = Math.max(0, Math.min(n - 1, i));
    const l = list[idx];
    setDrumIdx(idx);
    if (l && l.status === 'disponible') {
      setLote(l);
      setSugeridos(null);
    }
  }

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
    if (!lote) { setAiError('Primero elige un lote en el paso 1.'); return; }
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

  // Paso 1 — el usuario puede traer su propio lote (plano en imagen o PDF).
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
      // maxLiving definitivo lo calcula el paso 2 con los pisos y el garage.
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

  const mostrarVendidos = true;
  const visibles = mostrarVendidos ? LOTES : LOTES.filter((l) => l.status === 'disponible');

  const lotes = visibles.map((l) => {
    const sel = lote && lote.id === l.id;
    const disp = l.status === 'disponible';
    return {
      ...l,
      tx: l.x + 12, ty: l.y + 30, ty2: l.y + 46,
      fill: sel ? '#FFE7EE' : disp ? '#FFFFFF' : l.status === 'reservado' ? '#FEFBEC' : '#F4F4F3',
      stroke: sel ? '#F2004B' : disp ? '#F67599' : l.status === 'reservado' ? '#E3CF6A' : '#DEDFDF',
      textFill: disp || sel ? '#1C1E1F' : '#B7BABB',
      subFill: disp || sel ? '#8A8F91' : '#C8CACB',
      onClick: () => setLotModal(l),
    };
  });

  const di = Math.max(0, Math.min(visibles.length - 1, drumIdx));
  const drum = visibles.map((l, i) => {
    const a = (i - di) * STEP;
    const far = Math.abs(a) > 76;
    const disp = l.status === 'disponible';
    return {
      id: l.id, frente: l.frente,
      dot: statusColor(l.status),
      onClick: () => drumGo(i, visibles as unknown as Lote[]),
      style: {
        position: 'absolute', left: '20px', right: '20px', top: '50%', height: '42px', marginTop: '-21px',
        display: far ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', padding: '0 8px', border: 0, background: 'transparent',
        font: 'inherit', color: i === di ? '#1C1E1F' : disp ? '#505759' : '#C4C7C8',
        opacity: Math.max(0, 1 - Math.abs(a) / 88),
        transform: 'rotateX(' + -a + 'deg) translateZ(' + R + 'px)',
        transformOrigin: '50% 50%', backfaceVisibility: 'hidden',
        cursor: 'pointer', transition: 'transform .28s cubic-bezier(.22,.61,.36,1), opacity .28s ease, color .2s ease',
      } as Record<string, any>,
    };
  });
  const foco = visibles[di] || null;

  const planoSvg = useMemo(() => {
    const h = createElement;
    return h(
      'svg',
      { viewBox: '0 0 900 430', style: { width: '100%', height: 'auto', display: 'block', overflow: 'visible' } },
      h('g', { key: 'st', stroke: '#C9CBCC', strokeWidth: 1, fill: 'none' },
        h('line', { key: 'c', x1: 20, y1: 20, x2: 20, y2: 410, strokeDasharray: '3 5' }),
        h('line', { key: 'd', x1: 880, y1: 20, x2: 880, y2: 410, strokeDasharray: '3 5' })),
      h('text', { key: 's1', x: 26, y: 55, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: 1.6, fill: '#B7BABB' }, 'LOTES 73–76 · 32.5\' × 80\''),
      h('text', { key: 's3', x: 26, y: 240, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: 1.6, fill: '#B7BABB' }, 'LOTES 116–119 · 33\' × 100\''),
      h('text', { key: 's2', x: 840, y: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: 1.6, fill: '#B7BABB' }, 'N ↑'),
      lotes.map((l) => h('g', { key: l.id, onClick: l.onClick, style: { cursor: 'pointer' } },
        h('rect', { x: l.x, y: l.y, width: l.w, height: l.h, fill: l.fill, stroke: l.stroke, strokeWidth: 1.4 }),
        h('text', { x: l.tx, y: l.ty, fontFamily: 'Archivo, sans-serif', fontSize: 13, fontWeight: 700, fill: l.textFill }, l.id),
        h('text', { x: l.tx, y: l.ty2, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: 0.8, fill: l.subFill }, l.frente)))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes]);

  const drumUp = () => drumGo(di - 1, visibles as unknown as Lote[]);
  const drumDown = () => drumGo(di + 1, visibles as unknown as Lote[]);
  // El `onWheel` de React se registra como listener pasivo, así que su
  // preventDefault() es un no-op: la rueda giraba el cilindro Y se llevaba la
  // página 300 px al mismo tiempo. Hay que registrarlo a mano en el nodo con
  // `passive: false` para poder frenar el scroll de verdad.
  // `drumGo` solo usa sus argumentos y setters estables, así que capturarlo una
  // vez es seguro; lo que sí cambia en cada render es el índice y la lista, y
  // por eso viajan en refs.
  //
  // Va como callback ref y no como useEffect([]): el cilindro se desmonta al
  // pasar al paso 2 y vuelve a montarse al regresar, con un nodo nuevo. Un
  // efecto de montaje único habría dejado el listener colgado del nodo viejo.
  const diRef = useRef(di);
  const visiblesRef = useRef(visibles as unknown as Lote[]);
  diRef.current = di;
  visiblesRef.current = visibles as unknown as Lote[];
  const drumRef = useCallback((nodo: HTMLDivElement | null) => {
    if (!nodo) return;
    const alRodar = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (wheelAtRef.current && now - wheelAtRef.current < 140) return;
      wheelAtRef.current = now;
      drumGo(diRef.current + (e.deltaY > 0 ? 1 : -1), visiblesRef.current);
    };
    nodo.addEventListener('wheel', alRodar, { passive: false });
    return () => nodo.removeEventListener('wheel', alRodar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const drumTouch = crearDrumTouch(
    drumTouchRef, drumClickOffRef,
    () => di,
    (i) => drumGo(i, visibles as unknown as Lote[]),
  );

  const focoId = foco ? foco.id : '—';
  const focoStatus = foco ? foco.status : '';
  const focoColor = foco ? statusColor(foco.status) : '#8A8F91';
  const focoSeleccionado = !!(foco && foco.status === 'disponible');
  const focoNoDisponible = !!(foco && foco.status !== 'disponible');
  const focoDatos = foco ? [
    { k: 'Frente', v: foco.frente },
    { k: 'Fondo', v: foco.fondo },
    { k: 'Fachada al', v: foco.orient },
    // El presupuesto del configurador corre sobre habitables; el total se
    // muestra aparte para que no parezca que sobran ft² que no existen.
    { k: 'Máx habitable', v: foco.maxLiving + ' ft²' },
    { k: 'Total construido', v: foco.maxft + ' ft² (con garage y exteriores)' },
    { k: 'Pisos', v: foco.pisos },
  ] : [];

  const pasoNum = paso;
  const pasoNombre = PASO_NOMBRES[paso - 1];
  const pasoHint = PASO_HINTS[paso - 1];

  // Lo que la casa necesita definido antes de pedirle sus datos al cliente.
  // Las zonas quedan fuera a propósito: una casa sin zonas extra es válida.
  const faltantes = [
    !lote ? { paso: 1, que: 'el lote' } : null,
    !plan ? { paso: 2, que: 'el floorplan' } : null,
    !fachada ? { paso: 3, que: 'la fachada' } : null,
    !interior ? { paso: 4, que: 'los colores de interior' } : null,
  ].filter(Boolean) as { paso: number; que: string }[];
  const configCompleta = faltantes.length === 0;
  // El bloqueo aplica de la 6 en adelante: ahí es donde se piden datos y se
  // manda el resumen, y no tiene sentido mandarlo a medias.
  const pasoPermitido = (n: number) => n <= 5 || configCompleta;

  const pasos = PASO_NOMBRES.map((nm, i) => {
    const n = i + 1;
    const permitido = pasoPermitido(n);
    return {
      n,
      permitido,
      title: permitido ? undefined : `Antes elige ${faltantes.map((f) => f.que).join(', ')}`,
      onClick: () => { if (permitido) setPaso(n); },
      style: {
        flex: 1, padding: '11px 4px', border: 0, cursor: permitido ? 'pointer' : 'not-allowed',
        background: paso === n ? '#1C1E1F' : paso > n ? '#F2004B' : '#fff',
        color: paso >= n ? '#fff' : permitido ? '#B7BABB' : '#DDD9D4',
        fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em',
      } as Record<string, any>,
    };
  });
  const esPaso1 = paso === 1, esPaso2 = paso === 2, esPaso3 = paso === 3, esPaso4 = paso === 4;
  const esPaso5 = paso === 5, esPaso6 = paso === 6, esPaso7 = paso === 7;
  const atras = () => setPaso((p) => Math.max(1, p - 1));
  const siguiente = () => setPaso((p) => {
    const n = Math.min(PASO_NOMBRES.length, p + 1);
    return pasoPermitido(n) ? n : p;
  });
  const siguienteBloqueado = !pasoPermitido(Math.min(PASO_NOMBRES.length, paso + 1));

  const loteId = lote ? lote.id : 'tu lote';

  // Floorplans que el lote permite. En un lote townhouse la casa ya viene
  // diseñada, así que la lista trae un solo plan y el paso 2 se muestra fijo.
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
      onSelect: () => { if (!planFijo) { setPlan(k); setPlanLivingSel(null); setSugeridos(null); } },
    };
  });
  const planesExcluidos = (['B', 'C', 'D'] as PlanKey[])
    .filter((k) => !planesPermitidos.includes(k))
    .map((k) => ({ key: k, nombre: PLANES[k].nombre }));

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
    sigla: p.key === 'TH' ? '2P' : String(p.key),
    on: p.on,
    fija: Boolean(planFijo),
    etiqueta: planFijo ? 'INCLUIDO' : undefined,
    onSelect: p.onSelect,
  }));


  // ---- Dimmer de superficie (paso 2) -------------------------------------
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
    { key: 'cuartos', label: 'Cuartos y baños extra', ft2: livingDeCuartos(), color: '#8A8F91' },
    { key: 'zonas', label: 'Zonas', ft2: livingDeZonas(), color: '#F2004B' },
  ];
  const mostrarPresupuesto = paso >= 2 && paso <= 5;

  const fachadas = FACHADAS.map((f) => ({
    ...f, on: fachada === f.key,
    cardStyle: cardStyle(fachada === f.key),
    onSelect: () => setFachada(f.key),
  }));
  const interiores = INTERIORES.map((i) => ({
    ...i, on: interior === i.key,
    cardStyle: cardStyle(interior === i.key),
    onSelect: () => setInterior(i.key),
  }));

  const fachadasDecision = fachadas.map((f) => ({
    key: f.key,
    nombre: f.nombre,
    descripcion: f.desc,
    visual: (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
        <FachadaIcon styleKey={f.key} size={64} />
      </span>
    ),
    miniatura: (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FachadaIcon styleKey={f.key} size={26} />
      </span>
    ),
    visualTipo: 'icono' as const,
    sigla: f.nombre.slice(0, 2).toUpperCase(),
    on: f.on,
    onSelect: f.onSelect,
  }));

  const gamasDecision = interiores.map((i) => ({
    key: i.key,
    nombre: i.nombre,
    descripcion: i.desc,
    visual: (
      <span style={{ display: 'flex', height: '150px' }}>
        <span style={{ flex: 1, background: i.c1 }} />
        <span style={{ flex: 1, background: i.c2 }} />
        <span style={{ flex: 1, background: i.c3 }} />
      </span>
    ),
    // En una decisión de color la miniatura ES la información: la sigla "PI" no
    // dice nada de cómo se ve "Piedra cálida".
    miniatura: (
      <span style={{ display: 'flex', width: '34px', height: '34px', border: '1px solid #EAE7E3' }}>
        <span style={{ flex: 1, background: i.c1 }} />
        <span style={{ flex: 1, background: i.c2 }} />
        <span style={{ flex: 1, background: i.c3 }} />
      </span>
    ),
    // Una paleta no se invierte: invertida es otra paleta.
    visualTipo: 'muestra' as const,
    sigla: i.nombre.slice(0, 2).toUpperCase(),
    on: i.on,
    onSelect: i.onSelect,
  }));

  // --- Guía del paso 4 ------------------------------------------------------
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
    if (paso !== 4 || etapaGuia === 'libre') return;
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

  const pistaGuia =
    etapaGuia === 'gama' ? 'Empieza por la gama de interior — de ahí salen pisos, muros y carpintería.'
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
    if (!lote) return 'Primero elige un lote en el paso 1.';
    if (!plan) return 'Primero elige un floorplan en el paso 2.';
    if (extra >= def.max) return `Máximo ${def.max} ${def.nombre.toLowerCase()}s extra.`;
    if (def.living > ft2Rest) {
      return `No cabe: quedan ${ft2Rest} ft² habitables y ${def.nombre.toLowerCase()} necesita ${def.living} ft².`;
    }
    return null;
  }

  function motivoQuitar(total: number, min: number, etiqueta: string) {
    if (!plan) return 'Primero elige un floorplan en el paso 2.';
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
    { k: 'Fachada', v: fachada ? (FACHADAS.find((f) => f.key === fachada) || ({} as any)).nombre : 'Sin elegir' },
    { k: 'Colores interior', v: interior ? (INTERIORES.find((i) => i.key === interior) || ({} as any)).nombre : 'Sin elegir' },
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
      fachada: fachada ? (FACHADAS.find((f) => f.key === fachada)?.nombre ?? '—') : '—',
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
  const agendarCita = () => {
    if (!lead.nombre.trim()) {
      setCitaError('Escribe tu nombre para saber a quién buscamos.');
      return;
    }
    if (!lead.correo.trim() && !lead.tel.trim()) {
      setCitaError('Déjanos un correo o un teléfono, el que prefieras.');
      return;
    }
    setCitaError(null);
    setCitaEnviada(true);
  };

  const chips = ['Casas custom', 'Spec homes', 'Escandinavo moderno', 'Farm moderno', 'Smart home', 'Lotes propios', 'Edinburg · McAllen · Mission'];

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
    color: '#8A8F91', dot: n.id === 'index' ? '#F2004B' : 'transparent',
  }));

  const modal = lotModal;
  const modalAbierto = !!modal;
  const modalId = modal ? modal.id : '';
  const modalStatus = modal ? modal.status : '';
  const modalStatusColor = modal ? statusColor(modal.status) : '#8A8F91';
  const modalDisponible = !!(modal && modal.status === 'disponible');
  const modalDatos = modal ? [
    { k: 'Frente', v: modal.frente },
    { k: 'Fondo', v: modal.fondo },
    { k: 'Fachada al', v: modal.orient },
    { k: 'Máx construible', v: modal.maxft + ' ft²' },
    { k: 'Pisos permitidos', v: modal.pisos },
  ] : [];
  // El lote se elige tocándolo en el plano de la subdivisión: ahí se ve dónde
  // queda, con qué colinda y hacia dónde da. Antes esto solo fijaba el lote y
  // hacía scroll a una sección que ya no elige nada.
  const modalElegir = () => {
    if (!modal) return;
    abrirDesdeLote(modal);
  };
  const cerrarModal = () => setLotModal(null);

  // --- Entrada y salida de la ventana enfocada -----------------------------
  // Entrar por un lote del catálogo: se fija el lote y se arranca en floorplan,
  // porque el lote ya quedó resuelto en el plano.
  const abrirDesdeLote = (l: Lote) => {
    const idx = visibles.findIndex((v) => v.id === l.id);
    setLote(l);
    setDrumIdx(idx < 0 ? 0 : idx);
    setLotModal(null);
    setPaso(2);
    setEntradaPropia(false);
    setVentanaAbierta(true);
  };
  // Entrar con lote propio: ahí sí hace falta el paso 1, que es donde se sube
  // el plano o se capturan las medidas.
  const abrirPropioLote = () => {
    setPaso(1);
    setEntradaPropia(true);
    setVentanaAbierta(true);
  };
  const cerrarVentana = () => setVentanaAbierta(false);

  return (
    <div style={{position: "relative", overflowX: "hidden", background: "#FBFBFA", paddingBottom: "74px"}}>

      {/* Con 57 elementos enfocables en una sola página, quien navega con
          teclado tenía que tabular por todo para llegar al configurador. */}
      <a href="#personaliza" className="lgp-skip">Saltar al configurador</a>

      <div ref={bgRef} style={{position: "fixed", inset: "0", zIndex: "0", pointerEvents: "none", overflow: "hidden"}}></div>


      <div data-nofx="1" style={{position: "fixed", top: "0", left: "0", right: "0", zIndex: "60", display: "flex", alignItems: "stretch", background: "linear-gradient(178deg,#FFFFFF 0 54%,#F5F2EE 54% 80%,#E7E3DE 80%)", boxShadow: "0 8px 30px rgba(8,14,30,0.13)", pointerEvents: "auto"}}>

        <a href="#index" className="lgp-header-logo" style={{display: "flex", alignItems: "center", gap: "13px", padding: "11px 22px"}}>
          <img src="/logo-full.svg" alt="La Gran Piedra" style={{height: "38px", width: "auto", display: "block"}} />
          <img src="/logo-wordmark.svg" alt="La Gran Piedra" className="lgp-header-wordmark" style={{height: "11px", width: "auto", display: "block"}} />
        </a>

        <div style={{flex: "1"}}></div>

        <div className="lgp-header-social" style={{display: "flex", alignItems: "center", gap: "14px", padding: "0 20px"}}>
          <a href="https://instagram.com" title="Instagram" style={{display: "flex", alignItems: "center"}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#505759" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.4" cy="6.6" r="1.15" fill="#505759" stroke="none"></circle></svg></a>
          <a href="https://tiktok.com" title="TikTok" style={{display: "flex", alignItems: "center"}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#505759" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.2 3v11.4a3.9 3.9 0 1 1-3.2-3.84"></path><path d="M14.2 3c.3 2.6 1.9 4.2 4.5 4.5"></path></svg></a>
        </div>

        <a href="#contacto" onClick={(e) => { e.preventDefault(); irACita(); }} className="lgp-hover-zoom lgp-header-cta" style={{display: "flex", alignItems: "center", padding: "0 24px", background: "#1C1E1F", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", whiteSpace: "nowrap"}}>Agenda una cita</a>
      </div>

      <section id="index" data-screen-label="Inicio" className="lgp-hero-height" style={{position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "110px 22px 24px", overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0}}>
          <HeroLoopVideo src="/video/casa-4701-dron-hero.mp4" poster="/hero-house.jpg" crossfadeDuration={1} />
        </div>
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(18,19,20,0.85) 0%, rgba(18,19,20,0.55) 40%, rgba(18,19,20,0.15) 68%, rgba(18,19,20,0.05) 100%)", zIndex: 1}}></div>
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,19,20,0) 0%, rgba(18,19,20,0.5) 100%)", zIndex: 1}}></div>

        <div style={{position: "relative", zIndex: 2, maxWidth: "1240px", margin: "0 auto", width: "100%"}}>
          <div data-nofx="1" style={{maxWidth: "540px", animation: "lgpUp .9s ease both"}}>
            <p style={{margin: "0 0 16px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "10px", letterSpacing: "0.2em", color: "#F2004B", textTransform: "uppercase"}}>Casas custom · Rio Grande Valley</p>
            {/* El título de la página es este, no un <p>: es lo que leen los
                buscadores y los lectores de pantalla para saber de qué va el
                sitio. Los estilos son los mismos de antes. */}
            <h1 style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "clamp(30px,3.6vw,46px)", lineHeight: "1.1", letterSpacing: "-0.03em", textTransform: "uppercase", textWrap: "balance", color: "#fff"}}>Aquí el cliente firma el plano</h1>
            <p style={{margin: "18px 0 0", maxWidth: "42ch", fontSize: "16px", lineHeight: "1.6", color: "rgba(255,255,255,0.82)", textWrap: "pretty"}}>Nadie más en el Valle te deja decidir cada módulo antes de mover un solo ladrillo.</p>
            <div style={{display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "34px"}}>
              {/* Ambos CTA llevaban a sitios distintos para hacer lo mismo. El
                  camino es uno: el plano, que es donde se elige el lote. */}
              <a href="#lugares" className="lgp-hover-zoom" style={{padding: "13px 20px", background: "#F2004B", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase"}}>Elegir mi lote</a>
              <a href="#personaliza" className="lgp-hover-zoom" style={{padding: "13px 20px", border: "1px solid rgba(255,255,255,0.45)", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase"}}>Ya tengo mi lote</a>
            </div>
          </div>
        </div>

        <div data-nofx="1" style={{position: "relative", zIndex: "2", maxWidth: "1000px", margin: "20px auto 0", width: "100%", background: "#FBFBFA", boxShadow: "0 18px 46px rgba(28,30,31,0.10)"}}>
          <div style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))"}}>
            <div style={{padding: "26px 24px", borderRight: "1px solid #EAE7E3"}}>
              <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>8</div>
              <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase", marginTop: "5px"}}>Lotes en McAllen</div>
            </div>
            <div style={{padding: "26px 24px", borderRight: "1px solid #EAE7E3"}}>
              <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>7</div>
              <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase", marginTop: "5px"}}>Pasos, cero sorpresas</div>
            </div>
            <div style={{padding: "26px 24px"}}>
              <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>100%</div>
              <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase", marginTop: "5px"}}>Smart home integrado</div>
            </div>
          </div>
        </div>
      </section>

      <section id="nosotros" data-screen-label="Por qué nosotros" style={{position: "relative", padding: "110px 22px 100px"}}>
        <div data-nofx="1" style={{maxWidth: "1080px", margin: "0 auto"}}>
          <h2 style={{margin: "0 0 34px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Por qué nosotros</h2>
          <p style={{margin: "0 0 44px", maxWidth: "660px", fontSize: "clamp(19px,2.3vw,28px)", lineHeight: "1.36", letterSpacing: "-0.012em", textWrap: "pretty"}}>El Valle está lleno de casas que se parecen. Nosotros construimos <em style={{fontStyle: "italic"}}>pocas</em>, y el cliente ve cada decisión antes de que se vacíe el concreto.</p>
          <div style={{display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "56px"}}>
            {chips.map((c, _i) => (
    <Fragment key={_i}>

              <span style={{padding: "9px 14px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "600", letterSpacing: "0.14em", color: "#505759", textTransform: "uppercase"}}>{c}</span>
            
    </Fragment>
    ))}
          </div>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", marginBottom: "56px"}}>
            <div style={{background: "rgba(251,251,250,0.82)", padding: "24px 22px 26px"}}>
              <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#F2004B", textTransform: "uppercase"}}>01</div>
              <div style={{marginTop: "14px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>Proceso a la vista</div>
              <p style={{margin: "10px 0 0", fontSize: "14px", lineHeight: "1.6", color: "#8A8F91"}}>Cada semana recibes fotos, avance y el costo real acumulado. Sin cambios de orden sorpresa.</p>
            </div>
            <div style={{background: "rgba(251,251,250,0.82)", padding: "24px 22px 26px"}}>
              <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#F2004B", textTransform: "uppercase"}}>02</div>
              <div style={{marginTop: "14px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>Diseño modular curado</div>
              <p style={{margin: "10px 0 0", fontSize: "14px", lineHeight: "1.6", color: "#8A8F91"}}>Combinas módulos reales con proporciones probadas. Libertad, pero dentro de lo que sí funciona.</p>
            </div>
            <div style={{background: "rgba(251,251,250,0.82)", padding: "24px 22px 26px"}}>
              <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#F2004B", textTransform: "uppercase"}}>03</div>
              <div style={{marginTop: "14px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>Smart home de fábrica</div>
              <p style={{margin: "10px 0 0", fontSize: "14px", lineHeight: "1.6", color: "#8A8F91"}}>Clima, accesos, riego e iluminación cableados desde obra gris. No parches después.</p>
            </div>
          </div>
        </div>
      </section>

      {/* La obra, en grande y arriba: es lo unico de esta pagina que no es
          promesa. Va antes de pedirle nada al cliente. Las cuatro placas con
          rotulo son marcadores a la espera de las fotos reales. */}
      <section data-screen-label="La obra" style={{position: "relative", padding: "clamp(60px,7vw,84px) 0 clamp(50px,6vw,70px)"}}>
        <div style={{maxWidth: "1080px", margin: "0 auto 26px", padding: "0 22px"}}>
          <h2 style={{margin: "0 0 12px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>La obra</h2>
          <p style={{margin: "0", maxWidth: "620px", fontSize: "clamp(19px,2.3vw,27px)", lineHeight: "1.35", letterSpacing: "-0.012em", textWrap: "pretty"}}>Casas nuestras, terminadas y en obra. Sin render que prometa lo que no se entrega.</p>
        </div>
        <div className="lgp-obra-tira" style={{display: "flex", gap: "18px", overflowX: "auto", padding: "0 22px 16px", scrollSnapType: "x mandatory", scrollbarWidth: "thin"}}>
          <img src="/finished-house.jpg" alt="Casa terminada en Edinburg" className="lgp-obra-pieza" style={{width: "auto", flex: "none", objectFit: "cover", display: "block", scrollSnapAlign: "start"}} />
          {[
            'Foto — obra gris semana 9',
            'Foto — cocina con tragaluz',
            'Foto — patio central',
            'Drone — subdivision',
          ].map((rotulo, i) => (
    <Fragment key={i}>
          <div className="lgp-obra-pieza" style={{flex: "none", background: "repeating-linear-gradient(135deg,#F3F1EE 0 8px,#FCFBFA 8px 16px)", position: "relative", border: "1px solid #EAE7E3", scrollSnapAlign: "start"}}>
            <span style={{position: "absolute", left: "16px", bottom: "14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase"}}>{rotulo}</span>
          </div>
    </Fragment>
    ))}
        </div>
      </section>

      <section id="lugares" data-screen-label="Lugares disponibles" style={{position: "relative", padding: "110px 22px 120px"}}>
        <div data-nofx="1" style={{maxWidth: "1080px", margin: "0 auto"}}>
          <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "18px"}}>
            <div>
              <h2 style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Lugares disponibles</h2>
              <div style={{display: "flex", alignItems: "center", gap: "10px", marginTop: "12px"}}>
                <select
                  value={subdivisionKey}
                  onChange={(e) => setSubdivisionKey(e.target.value as SubdivisionKey)}
                  style={{padding: "8px 12px", border: "1px solid #DDD9D4", background: "#fff", color: "#1C1E1F", fontFamily: "Archivo, sans-serif", fontWeight: "700", fontSize: "11px", letterSpacing: "0.06em", cursor: "pointer"}}
                >
                  {SUBDIVISIONES.map((s) => (
                    <option key={s.key} value={s.key}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <p style={{margin: "10px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#8A8F91", textTransform: "uppercase"}}>{subdivisionActiva.zona} · {subdivisionActiva.direccion}</p>
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px"}}>
              <button onClick={() => setOverviewOpen(true)} className="lgp-hover-zoom" style={{minHeight: "44px", padding: "0 16px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap"}}>Ver mapa completo ↗</button>
              {/* Aquí se elige el lote, no solo se mira: el plano es el
                  selector, y hay que decirlo. */}
              <p style={{margin: "0", maxWidth: "310px", fontSize: "13px", lineHeight: "1.5", color: "#8A8F91", textAlign: "right"}}>
                <strong style={{fontWeight: 600, color: "#1C1E1F"}}>Aquí empieza tu casa.</strong> Toca un lote para ver su frente, su orientación y cuánto admite — y para armar la tuya encima.
              </p>
            </div>
          </div>

          <div style={{position: "relative", border: "1px solid #EAE7E3", background: "#fff", padding: "26px 22px 18px"}}>
            <div style={{position: "absolute", inset: "0", background: "radial-gradient(38% 60% at 62% 78%, rgba(246,117,153,0.10), transparent 72%)", pointerEvents: "none"}}></div>
            <div style={{position: "relative"}}>{planoSvg}</div>
            <div style={{position: "relative", display: "flex", flexWrap: "wrap", gap: "18px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #F0EDE9", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#8A8F91", textTransform: "uppercase"}}>
              <span style={{display: "flex", alignItems: "center", gap: "7px"}}><span style={{width: "9px", height: "9px", background: "#F2004B", display: "block"}}></span>Disponible</span>
              <span style={{display: "flex", alignItems: "center", gap: "7px"}}><span style={{width: "9px", height: "9px", background: "#F4DA40", display: "block"}}></span>Reservado</span>
              <span style={{display: "flex", alignItems: "center", gap: "7px"}}><span style={{width: "9px", height: "9px", background: "#D5D7D8", display: "block"}}></span>Vendido</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============== INICIO: la otra puerta al configurador ==============
          El lote del catalogo se elige tocandolo en el plano de la subdivision,
          arriba. Aqui solo queda el camino de quien ya trae terreno propio:
          repetir el inventario en tarjetas era ensenar lo mismo dos veces. */}
      <section id="personaliza" data-screen-label="Personaliza tu casa" style={{position: "relative", padding: "clamp(70px,9vw,100px) 22px clamp(80px,10vw,120px)", background: "rgba(255,255,255,0.68)", borderTop: "1px solid #F0EDE9", borderBottom: "1px solid #F0EDE9"}}>
        <div data-nofx="1" style={{maxWidth: "1080px", margin: "0 auto"}}>
          <h2 style={{margin: "0 0 12px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Personaliza tu casa</h2>

          {/* Volvió y tenía algo a medias. Se le ofrece, no se le impone. */}
          {retomable ? (
    <Fragment>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "30px", padding: "18px 20px", background: "#FFF7F9", border: "1px solid #F8C9D6"}}>
            <div style={{flex: "1 1 300px", minWidth: 0}}>
              <p style={{margin: "0 0 4px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#8A2249", textTransform: "uppercase"}}>Dejaste una casa a medias</p>
              <p style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#1C1E1F"}}>
                {(retomable.lotePropio?.id ?? retomable.loteId ?? 'Tu lote')} · paso {retomable.paso} de {PASO_NOMBRES.length}. La guardamos en este navegador.
              </p>
            </div>
            <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
              <button onClick={retomar} className="lgp-hover-zoom" style={{minHeight: "44px", padding: "0 18px", background: "#F2004B", border: "0", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>Continuar</button>
              <button onClick={descartarGuardado} style={{minHeight: "44px", padding: "0 16px", background: "transparent", border: "1px solid #F8C9D6", color: "#8A2249", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>Empezar de cero</button>
            </div>
          </div>
    </Fragment>
    ) : null}

          {/* Tu propio lote: el otro camino de entrada a la misma ventana */}
          <div style={{border: "1px solid #EAE7E3", background: "#fff", padding: "clamp(22px,3vw,34px)"}}>
            <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "26px", flexWrap: "wrap"}}>
              <div style={{flex: "1 1 320px", minWidth: 0}}>
                <p style={{margin: "0 0 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#F2004B", textTransform: "uppercase"}}>&iquest;Ya tienes tu propio lote?</p>
                <p style={{margin: "0 0 10px", fontSize: "clamp(18px,2.1vw,24px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Traelo como lo tengas y calculamos cuanto cabe.</p>
                <p style={{margin: "0", maxWidth: "52ch", fontSize: "15px", lineHeight: "1.6", color: "#8A8F91"}}>
                  El plano en PDF o foto, las medidas a mano, o la direccion del terreno. Al ser un lote fuera de la subdivision se te abren los tres floorplans.
                </p>
              </div>
              <button onClick={abrirPropioLote} className="lgp-hover-zoom" style={{flex: "none", minHeight: "48px", padding: "0 22px", background: "#1C1E1F", border: "0", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Subir mi lote &rarr;</button>
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
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "10px"}}>
              <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>Paso {pasoNum} de {PASO_NOMBRES.length} &mdash; {pasoNombre}</span>
              <button onClick={cerrarVentana} className="lgp-hover-zoom" style={{minHeight: "44px", minWidth: "44px", padding: "0 14px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer"}}>Cerrar &#10005;</button>
            </div>
            <div style={{display: "flex", gap: "1px", background: "#EAE7E3"}}>
              {pasos.map((p, _i) => (
    <Fragment key={_i}>
              <button onClick={p.onClick} style={p.style} title={p.title} disabled={!p.permitido} className="lgp-hover-zoom">{p.n}</button>
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
        <div style={{maxWidth: "1080px", margin: "0 auto", padding: "26px 20px 40px"}}>

          {esPaso1 ? (
    <Fragment>

            <div style={{display: "flex", flexDirection: "column"}}>
              {/* Quien entró por "ya tengo mi lote" ve su bloque arriba y el
                  catálogo debajo; quien llegó por el plano, al revés. Enseñarle
                  el catálogo a quien ya tiene terreno es hacerle buscar lo suyo
                  entre lo que no le sirve. Se ordena con `order` para no
                  duplicar el marcado de ninguno de los dos. */}
              <p style={{order: 0, margin: "0 0 24px", maxWidth: "560px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>
                {entradaPropia
                  ? 'Traes tu propio terreno. Dinos cuánto mide y calculamos cuánta casa admite — abajo queda el catálogo de la subdivisión por si prefieres uno nuestro.'
                  : 'Empieza por el terreno. Gira el selector hasta el lote que te interese — solo los disponibles se pueden elegir.'}
              </p>
              {/* Quien trae su terreno no ve el catálogo: son ocho lotes que no
                  le sirven y solo le estorban para encontrar lo suyo. */}
              {entradaPropia ? null : (
              <div className="lgp-picker-grid" style={{order: 1, display: "grid", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", alignItems: "stretch"}}>

                <div style={{position: "relative", background: "#fff", padding: "0", overflow: "hidden"}}>
                  <div ref={drumRef} {...drumTouch} style={{position: "relative", height: "250px", perspective: "960px", perspectiveOrigin: "50% 50%", touchAction: "none", cursor: "ns-resize"}}>
                    <div style={{position: "absolute", left: "0", right: "0", top: "50%", height: "44px", marginTop: "-22px", borderTop: "1px solid #F2004B", borderBottom: "1px solid #F2004B", pointerEvents: "none", zIndex: "2"}}></div>
                    <div style={{position: "absolute", left: "0", right: "0", top: "0", height: "74px", background: "linear-gradient(#fff 12%, rgba(255,255,255,0))", pointerEvents: "none", zIndex: "3"}}></div>
                    <div style={{position: "absolute", left: "0", right: "0", bottom: "0", height: "74px", background: "linear-gradient(rgba(255,255,255,0), #fff 88%)", pointerEvents: "none", zIndex: "3"}}></div>
                    <div style={{position: "absolute", inset: "0", transformStyle: "preserve-3d"}}>
                      {drum.map((d, _i) => (
    <Fragment key={_i}>

                        <button onClick={d.onClick} style={d.style}>
                          <span style={{display: "flex", alignItems: "center", gap: "10px"}}>
                            <span style={{width: "7px", height: "7px", display: "block", flex: "none", background: d.dot}}></span>
                            <span style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "16px", letterSpacing: "0.06em"}}>{d.id}</span>
                          </span>
                          <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#A9ADAF", textTransform: "uppercase"}}>{d.frente}</span>
                        </button>
                      
    </Fragment>
    ))}
                    </div>
                  </div>
                  <div style={{display: "flex", borderTop: "1px solid #F0EDE9"}}>
                    <button onClick={drumUp} className="lgp-hover-zoom" style={{flex: "1", padding: "9px 0", border: "0", borderRight: "1px solid #F0EDE9", background: "transparent", color: "#8A8F91", fontSize: "13px", cursor: "pointer"}}>▲</button>
                    <button onClick={drumDown} className="lgp-hover-zoom" style={{flex: "1", padding: "9px 0", border: "0", background: "transparent", color: "#8A8F91", fontSize: "13px", cursor: "pointer"}}>▼</button>
                  </div>
                </div>

                <div style={{background: "#fff", padding: "24px 24px 26px", display: "flex", flexDirection: "column"}}>
                  <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "14px"}}>
                    <span style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "0.02em"}}>{focoId}</span>
                    <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: focoColor, textTransform: "uppercase"}}>{focoStatus}</span>
                  </div>
                  <div style={{marginTop: "16px", borderTop: "1px solid #F0EDE9"}}>
                    {focoDatos.map((d, _i) => (
    <Fragment key={_i}>

                      <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", padding: "10px 0", borderBottom: "1px solid #F4F1ED"}}>
                        <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>{d.k}</span>
                        <span style={{fontFamily: "Archivo, sans-serif", fontWeight: "700", fontSize: "14px"}}>{d.v}</span>
                      </div>
                    
    </Fragment>
    ))}
                  </div>
                  <div style={{marginTop: "auto", paddingTop: "20px"}}>
                    {focoSeleccionado ? (
    <Fragment>

                      <span style={{display: "inline-block", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.16em", color: "#F2004B", textTransform: "uppercase"}}>✓ Lote seleccionado — pasa al floorplan</span>
                    
    </Fragment>
    ) : null}
                    {focoNoDisponible ? (
    <Fragment>

                      <span style={{display: "inline-block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#B7BABB", textTransform: "uppercase"}}>Este lote no está disponible</span>
                    
    </Fragment>
    ) : null}
                  </div>
                </div>
              </div>
              )}
              {entradaPropia ? null : (
              /* Medía 14 px de alto: imposible de atinar con el pulgar. */
              <p style={{order: 2, margin: "14px 0 0"}}><a href="#lugares" style={{display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 2px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#8A8F91", textTransform: "uppercase"}}><span style={{borderBottom: "1px solid #E4E1DD"}}>Ver el plano completo de la subdivisión ↗</span></a></p>
              )}

              {/* ¿Ya tienes tu propio terreno? Sube el plano y lo analizamos. */}
              <div style={{order: entradaPropia ? 1 : 3, marginTop: entradaPropia ? "0" : "34px", marginBottom: entradaPropia ? "34px" : "0", padding: entradaPropia ? "clamp(20px,3vw,30px)" : "24px", background: "#fff", border: "1px solid " + (entradaPropia ? "#F2004B" : "#EAE7E3"), boxShadow: entradaPropia ? "0 2px 12px rgba(28,30,31,0.07)" : "none"}}>
                <p style={{margin: "0 0 6px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: entradaPropia ? "13px" : "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>{entradaPropia ? 'Tu lote' : '¿Ya tienes tu propio lote?'}</p>
                <p style={{margin: "0 0 18px", maxWidth: "540px", fontSize: "13px", lineHeight: 1.6, color: "#8A8F91"}}>
                  Tráelo como puedas: el plano en PDF o foto, las medidas a mano, o la dirección del terreno. Con eso calculamos cuánta área habitable admite. Al ser un lote fuera de la subdivisión, se te abren los tres floorplans.
                </p>

                {lotePropio ? (
    <Fragment>
                <div style={{padding: "18px", background: "#F7F5F2", border: "1px solid #EAE7E3"}}>
                  <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"}}>
                    <div>
                      <p style={{margin: "0 0 4px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "15px"}}>Tu lote</p>
                      <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#8A8F91", textTransform: "uppercase"}}>{loteFile ? loteFile.nombre : ''}</p>
                    </div>
                    <div style={{display: "flex", gap: "8px", flex: "none"}}>
                      {lotePropioActivo ? (
    <Fragment>
                      <span style={{padding: "8px 13px", background: "#F2004B", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase"}}>✓ En uso</span>
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
                  <p style={{margin: "14px 0 0", padding: "10px 12px", background: "#FEFCEC", borderLeft: "3px solid #F4DA40", fontSize: "12px", lineHeight: 1.5, color: "#6B6E70"}}>
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
                      <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase"}}>{d.k}</p>
                      <p style={{margin: 0, fontFamily: "Archivo, sans-serif", fontWeight: "700", fontSize: "14px"}}>{d.v}</p>
                    </div>
    </Fragment>
    ))}
                  </div>
                  {loteAnalisis.direccion || loteAnalisis.coordenadas ? (
    <Fragment>
                  <div style={{marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #E4E1DD"}}>
                    <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase"}}>Ubicación</p>
                    <p style={{margin: 0, fontSize: "13px", lineHeight: 1.5, color: "#505759"}}>{[loteAnalisis.direccion, loteAnalisis.coordenadas].filter(Boolean).join(' · ')}</p>
                  </div>
    </Fragment>
    ) : null}
                  <p style={{margin: "14px 0 0", fontSize: "11px", lineHeight: 1.6, color: "#8A8F91"}}>
                    <strong style={{fontWeight: 600}}>{loteAnalisis.fuente === 'medidas capturadas a mano' ? 'Medidas tuyas' : 'Estimado automático'}</strong> — confianza {loteAnalisis.confianza}. {loteAnalisis.nota}
                    {loteAnalisis.huella ? ' El área habitable final depende del floorplan y del garage que elijas en el paso 2.' : ` Sin frente y fondo no se pueden aplicar retiros, así que el máximo sale del ${Math.round((loteAnalisis.factor ?? 0.5) * 100)}% del área del lote.`} El arquitecto verifica las medidas y los retiros reales en la cita.
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
                  <button onClick={m.onClick} aria-pressed={m.on} className={'lgp-hover-zoom' + (entradaPropia && !lotePropio && m.on ? ' lgp-guia-activa' : '')} style={{textAlign: "left", padding: "15px 16px 16px", background: m.on ? "#1C1E1F" : "#fff", border: "1px solid " + (m.on ? "#1C1E1F" : "#E4E1DD"), cursor: "pointer"}}>
                    <span style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px"}}>
                      <span style={{width: "13px", height: "13px", flex: "none", borderRadius: "50%", border: "2px solid " + (m.on ? "#F2004B" : "#DDD9D4"), background: m.on ? "#F2004B" : "transparent", boxShadow: m.on ? "inset 0 0 0 2px #1C1E1F" : "none"}}></span>
                      <span style={{fontFamily: "Archivo, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: m.on ? "#FBFBFA" : "#1C1E1F"}}>{m.label}</span>
                      {m.sello ? (
                        <span style={{marginLeft: "auto", flex: "none", padding: "3px 6px", background: m.on ? "#F2004B" : "#FFF7F9", color: m.on ? "#fff" : "#8A2249", fontFamily: "'IBM Plex Mono', monospace", fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase"}}>{m.sello}</span>
                      ) : null}
                    </span>
                    <span style={{display: "block", fontSize: "12.5px", lineHeight: 1.55, color: m.on ? "#B7BABB" : "#8A8F91"}}>{m.desc}</span>
                  </button>
    </Fragment>
    ))}
                </div>

                {/* El aviso va antes de los campos: si manda a capturar algo,
                    tiene que verse antes de lo que hay que capturar. */}
                {loteError ? (
    <Fragment>
                <p style={{margin: "0 0 16px", padding: "12px 14px", borderLeft: "3px solid " + (loteErrorTipo === 'info' ? "#B7BABB" : "#F4DA40"), background: loteErrorTipo === 'info' ? "#F7F5F2" : "#FEFCEC", fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>{loteError}</p>
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
                <p style={{margin: "10px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.06em", color: "#B7BABB", textTransform: "uppercase"}}>PDF · JPG · PNG · WEBP — hasta 8 MB</p>
    </Fragment>
    ) : null}

                {loteModo === 'medidas' ? (
    <Fragment>
                <div style={{display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end"}}>
                  <label style={{flex: "1 1 120px"}}>
                    <span style={{display: "block", marginBottom: "6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase"}}>Frente (ft)</span>
                    <input value={loteFrente} onChange={(e) => setLoteFrente(e.target.value)} inputMode="decimal" placeholder="60" style={{width: "100%", padding: "11px 12px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "15px", color: "#1C1E1F"}} />
                  </label>
                  <label style={{flex: "1 1 120px"}}>
                    <span style={{display: "block", marginBottom: "6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase"}}>Fondo (ft)</span>
                    <input value={loteFondo} onChange={(e) => setLoteFondo(e.target.value)} inputMode="decimal" placeholder="120" style={{width: "100%", padding: "11px 12px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "15px", color: "#1C1E1F"}} />
                  </label>
                  <button onClick={aplicarMedidasManuales} className={'lgp-hover-zoom' + (loteFrente.trim() && loteFondo.trim() && !lotePropio ? ' lgp-guia-activa' : '')} style={{flex: "none", minHeight: "44px", padding: "0 20px", background: "#1C1E1F", border: 0, color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Calcular</button>
                </div>

                <div style={{marginTop: "18px", paddingTop: "16px", borderTop: "1px dashed #E4E1DD"}}>
                  {/* La explicación larga estorbaba antes de dejar capturar.
                      Queda a un clic para quien no sepa qué es un retiro, y el
                      aviso de que son un supuesto se queda siempre a la vista:
                      eso no se puede esconder. */}
                  <p style={{margin: "0 0 6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase"}}>Retiros del terreno (ft)</p>
                  <p style={{margin: "0 0 10px", maxWidth: "520px", fontSize: "12px", lineHeight: 1.6, color: "#505759"}}>
                    Son un arranque común en el Valle, <strong style={{fontWeight: 600}}>no el reglamento de tu ciudad</strong>. Si los tuyos son otros, cámbialos y el cálculo se ajusta solo.
                  </p>
                  <details style={{marginBottom: "14px"}}>
                    <summary style={{display: "inline-flex", alignItems: "center", minHeight: "32px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#8A8F91", textTransform: "uppercase", cursor: "pointer"}}>¿Qué es un retiro y dónde veo el mío?</summary>
                    <div style={{marginTop: "8px", paddingLeft: "12px", borderLeft: "2px solid #EAE7E3"}}>
                      <p style={{margin: "0 0 8px", maxWidth: "520px", fontSize: "12px", lineHeight: 1.6, color: "#505759"}}>
                        Es la franja que el municipio obliga a dejar libre entre la casa y el límite del terreno. Ahí no se puede construir, así que lo que sobra es tu superficie construible.
                      </p>
                      <p style={{margin: "0", maxWidth: "520px", fontSize: "12px", lineHeight: 1.6, color: "#8A8F91"}}>
                        En el plat del terreno aparecen como línea punteada marcada <em style={{fontStyle: "italic"}}>“building setback line”</em> o B.S.L. Si no lo tienes, los da el departamento de desarrollo urbano del municipio.
                      </p>
                    </div>
                  </details>
                  <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                    {([
                      { k: 'frente' as const, label: 'Frente' },
                      { k: 'fondo' as const, label: 'Fondo' },
                      { k: 'lados' as const, label: 'Cada lado' },
                    ]).map((r) => (
    <Fragment key={r.k}>
                    <label style={{flex: "1 1 90px"}}>
                      <span style={{display: "block", marginBottom: "5px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#B7BABB", textTransform: "uppercase"}}>{r.label}</span>
                      <input value={String(retiros[r.k])} inputMode="decimal" onChange={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); setRetiros((prev) => ({ ...prev, [r.k]: Number.isFinite(v) && v >= 0 ? v : 0 })); }} style={{width: "100%", padding: "9px 10px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "14px", color: "#1C1E1F"}} />
                    </label>
    </Fragment>
    ))}
                  </div>
                  {loteFrente && loteFondo && Number.isFinite(parseFloat(loteFrente)) && Number.isFinite(parseFloat(loteFondo)) && parseFloat(loteFrente) > 0 && parseFloat(loteFondo) > 0 ? (
    <Fragment>
                  <div style={{display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", marginTop: "16px", padding: "14px", background: "#FBFBFA", border: "1px solid #EAE7E3"}}>
                    <RetirosDiagrama frente={parseFloat(loteFrente)} fondo={parseFloat(loteFondo)} retiros={retiros} />
                    <div style={{flex: "1 1 200px"}}>
                      <p style={{margin: "0 0 6px", fontSize: "13px", lineHeight: 1.5, color: "#505759"}}>
                        Huella construible en planta baja
                      </p>
                      <p style={{margin: "0 0 6px", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.01em"}}>
                        {huellaConstruible(parseFloat(loteFrente), parseFloat(loteFondo), retiros).toLocaleString('es-MX')} <span style={{fontSize: "13px", fontWeight: 400, color: "#8A8F91"}}>ft²</span>
                      </p>
                      <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#8A8F91"}}>
                        {Math.max(0, parseFloat(loteFrente) - retiros.lados * 2)}&apos; × {Math.max(0, parseFloat(loteFondo) - retiros.frente - retiros.fondo)}&apos; de los {parseFloat(loteFrente)}&apos; × {parseFloat(loteFondo)}&apos; del lote
                      </p>
                    </div>
                  </div>
    </Fragment>
    ) : null}
                </div>

                <p style={{margin: "14px 0 0", fontSize: "11px", lineHeight: 1.5, color: "#B7BABB"}}>La vía más confiable: no pasa por el análisis automático.</p>
    </Fragment>
    ) : null}

                {loteModo === 'texto' ? (
    <Fragment>
                <textarea value={loteTexto} onChange={(e) => setLoteTexto(e.target.value)} rows={4} placeholder="Ej: Lote en Mission, TX, sobre la calle Los Ebanos. Mide 60 x 120 pies. Coordenadas 26.2159, -98.3253" style={{width: "100%", padding: "12px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "inherit", fontSize: "14px", lineHeight: 1.6, color: "#1C1E1F", resize: "vertical"}} />
                <div style={{display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "12px"}}>
                  <button onClick={() => { setLoteTextoCapturado(loteTexto.trim()); analizarLote({ texto: loteTexto }); }} disabled={loteLoading || !loteTexto.trim()} className="lgp-hover-zoom" style={{padding: "12px 18px", background: (loteLoading || !loteTexto.trim()) ? "#F4F1ED" : "#1C1E1F", border: 0, color: (loteLoading || !loteTexto.trim()) ? "#B7BABB" : "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: (loteLoading || !loteTexto.trim()) ? "not-allowed" : "pointer"}}>{loteLoading ? 'Analizando…' : 'Analizar descripción'}</button>
                </div>
                <p style={{margin: "10px 0 0", maxWidth: "480px", fontSize: "11px", lineHeight: 1.5, color: "#B7BABB"}}>
                  Incluye las medidas si las sabes. Una dirección o unas coordenadas solas no dicen cuánto mide el lote, así que en ese caso guardamos la ubicación y te pedimos el frente y el fondo.
                </p>
    </Fragment>
    ) : null}

                {/* Acuses de recibo. Van fuera de las pestañas para que sigan
                    visibles aunque el usuario cambie de modo o falle el análisis. */}
                {loteFile ? (
    <Fragment>
                <div style={{display: "flex", alignItems: "center", gap: "13px", marginTop: "16px", padding: "12px 14px", background: "#F4FBF6", border: "1px solid #CFE8D8"}}>
                  <span style={{flex: "none", width: "44px", height: "44px", borderRadius: "6px", overflow: "hidden", background: "#fff", border: "1px solid #DDE6E0", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    {loteFile.mime.startsWith('image/') ? (
    <Fragment>
    <img src={loteFile.dataUrl} alt={loteFile.nombre} style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}} />
    </Fragment>
    ) : (
    <Fragment>
    <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", fontWeight: 700, color: "#8A8F91"}}>PDF</span>
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

          {esPaso2 ? (
    <Fragment>

            <div>
              {planFijo ? (
    <Fragment>
              <p style={{margin: "0 0 22px", maxWidth: "640px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>El lote <strong style={{fontWeight: "600"}}>{loteId}</strong> se entrega con la casa ya diseñada y aprobada por la subdivisión, así que el floorplan no se cambia. Lo que sí personalizas es la fachada, el interior y las zonas que quepan en el presupuesto.</p>
    </Fragment>
    ) : (
    <Fragment>
              <p style={{margin: "0 0 22px", maxWidth: "640px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>Estas son las variantes que nuestros arquitectos curaron para <strong style={{fontWeight: "600"}}>{loteId}</strong>. El presupuesto se lleva en área habitable: garage, pórtico y exteriores no lo consumen.</p>
    </Fragment>
    )}

              <PasoDecision
                opciones={planesDecision}
                carrusel
                etiquetaOtras={planFijo ? 'Plano de este lote' : 'Planos disponibles'}
                tituloPanel="Plano elegido"
                vacioPanel="Ninguno elegido todavía."
                accionPrimaria="Elegir este plano"
                accionSecundaria={plan ? 'Ver a pantalla completa' : undefined}
                onSecundaria={plan ? () => setPreviewOpen(true) : undefined}
              />

              {planesExcluidos.length ? (
    <Fragment>
              <div style={{marginTop: "20px", padding: "16px 18px", background: "#F7F5F2", border: "1px solid #EAE7E3"}}>
                <p style={{margin: "0 0 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>No disponibles en este lote</p>
                <p style={{margin: 0, fontSize: "13px", lineHeight: 1.6, color: "#8A8F91"}}>
                  {planesExcluidos.map((p) => p.nombre).join(' · ')} — {reglas ? reglas.motivo : ''}.
                </p>
              </div>
    </Fragment>
    ) : null}
            </div>

    </Fragment>
    ) : null}

          {esPaso3 ? (
    <Fragment>

            <div>
              <p style={{margin: "0 0 26px", maxWidth: "560px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>La piel de la casa. Cuatro fachadas, todas geométricas, todas nuestras.</p>
              <PasoDecision
                opciones={fachadasDecision}
                etiquetaOtras="Fachadas disponibles"
                tituloPanel="Fachada elegida"
                vacioPanel="Ninguna seleccionada. Elige una de la lista."
              />
            </div>
          
    </Fragment>
    ) : null}

          {esPaso4 ? (
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

              <p style={{margin: "0 0 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>Gama de interior</p>
              <div ref={refGama} className={claseGuia('gama')} style={{marginBottom: "34px"}}>
                <PasoDecision
                  opciones={gamasDecision}
                  etiquetaOtras="Gamas disponibles"
                  tituloPanel="Gama elegida"
                  vacioPanel="Ninguna seleccionada. Elige una de la lista."
                />
              </div>

              <div ref={refCuartos} className={claseGuia('cuartos')} style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", marginBottom: "22px"}}>
                {contadores.map((c) => (
    <Fragment key={c.key}>
                <div style={{background: "#fff", padding: "16px 18px"}}>
                  <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px"}}>
                    <div>
                      <p style={{margin: "0 0 3px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase"}}>{c.nombre}</p>
                      <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#A9ADAF", textTransform: "uppercase"}}>{c.base} en el plano · {c.living} ft² c/u</p>
                    </div>
                    <div style={{display: "flex", alignItems: "center", gap: "2px", flex: "none"}}>
                      <button onClick={c.onMenos} disabled={c.menosDisabled} title={c.menosMotivo ?? undefined} style={{width: "30px", height: "30px", border: "1px solid #E4E1DD", background: "transparent", color: c.menosDisabled ? "#DDD9D4" : "#505759", fontSize: "15px", lineHeight: 1, cursor: c.menosDisabled ? "not-allowed" : "pointer"}}>−</button>
                      <span style={{minWidth: "38px", textAlign: "center", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "17px"}}>{c.total}</span>
                      <button onClick={c.onMas} disabled={c.masDisabled} title={c.masMotivo ?? undefined} style={{width: "30px", height: "30px", border: "0", background: c.masDisabled ? "#F4F1ED" : "#F2004B", color: c.masDisabled ? "#B7BABB" : "#fff", fontSize: "15px", lineHeight: 1, cursor: c.masDisabled ? "not-allowed" : "pointer"}}>+</button>
                    </div>
                  </div>
                  {c.masMotivo ? (
    <Fragment>
                  <p style={{margin: "10px 0 0", fontSize: "11px", lineHeight: 1.5, color: "#B7BABB"}}>{c.masMotivo}</p>
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
                  <p style={{margin: "0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>Zonas</p>
                  <span title="Área habitable disponible dentro del límite de tu lote, ya restando el floorplan, los cuartos extra y las zonas que llevas" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: ft2Rest > 0 ? "#F2004B" : "#B7BABB", textTransform: "uppercase"}}>{ft2Rest} ft² habitables disponibles</span>
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
                <p style={{margin: "0 0 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>Tu casa, por ahora</p>
                <div style={{border: "1px solid #EAE7E3", boxShadow: "0 2px 10px rgba(28,30,31,0.07)"}}>
                  <MesaArquitecto
                    planKey={plan}
                    planNombre={planNombreSel}
                    planMeta={`${totalRec} rec · ${totalBanos} baños · ${garageTexto}`}
                    loteId={lote ? lote.id : '—'}
                    loteMedida={loteMedida}
                    fachadaKey={fachada}
                    fachadaNombre={fachada ? (FACHADAS.find((f) => f.key === fachada)?.nombre ?? '—') : '—'}
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

          {esPaso5 ? (
    <Fragment>

            <div style={{maxWidth: "700px"}}>
              <p style={{margin: "0 0 8px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em", textWrap: "pretty"}}>¿Algo que quieras aclarar o pedir sobre lo que armaste?</p>
              <p style={{margin: "0 0 20px", fontSize: "15px", lineHeight: "1.6", color: "#8A8F91"}}>
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
              <div style={{marginBottom: "18px", padding: "14px 16px", background: "#FEFCEC", borderLeft: "3px solid #F4DA40"}}>
                <p style={{margin: "0 0 4px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#8A7A2A", textTransform: "uppercase"}}>Elegiste un comodín room</p>
                <p style={{margin: 0, fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>
                  Es el cuarto que dejaste sin uso asignado. Cuéntanos aquí para qué lo quieres —gym, visitas, taller, estudio— y el arquitecto llega a la cita con esa idea ya leída.
                </p>
              </div>
    </Fragment>
    ) : null}

              <textarea value={brief} onChange={onBrief} placeholder="El comodín room lo quiero como gym, con espejo de pared a pared. Y quisiera ver si la pérgola del patio se puede alargar hasta la cocina exterior…" rows={7} style={{width: "100%", padding: "18px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "15px", lineHeight: "1.65", color: "#1C1E1F", outline: "none"}}></textarea>
              <div style={{display: "flex", justifyContent: "space-between", marginTop: "10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#B7BABB", textTransform: "uppercase"}}>
                <span>Opcional, pero cambia todo</span><span>{briefLen} caracteres</span>
              </div>

              {/* Sin analisis por IA: el brief son comentarios para el
                  arquitecto, no una lista de compras que haya que interpretar.
                  Viaja tal cual en la ficha. */}
              <p style={{margin: "16px 0 0", padding: "13px 15px", background: "#F7F5F2", borderLeft: "3px solid #E4E1DD", fontSize: "13px", lineHeight: 1.6, color: "#505759"}}>
                Lo que escribas viaja tal cual al arquitecto, con tus palabras. No lo resumimos ni lo interpretamos.
              </p>

              {!lote || !plan ? (
    <Fragment>
              <p style={{margin: "16px 0 0", padding: "12px 14px", background: "#F7F5F2", borderLeft: "3px solid #B7BABB", fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>
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
          {esPaso6 ? (
    <Fragment>

            <div>
              <p style={{margin: "0 0 6px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Asi quedo tu casa, sobre la mesa.</p>
              <p style={{margin: "0 0 22px", maxWidth: "620px", fontSize: "15px", lineHeight: "1.6", color: "#8A8F91"}}>
                Esto es exactamente lo que le llega al arquitecto. Si algo no te cuadra, regresa y cambialo &mdash; todavia no has enviado nada.
              </p>

              <div style={{border: "1px solid #EAE7E3", boxShadow: "0 2px 10px rgba(28,30,31,0.07)", marginBottom: "26px"}}>
                <MesaArquitecto
                  planKey={plan}
                  planNombre={planNombreSel}
                  planMeta={`${totalRec} rec / ${totalBanos} banos / ${garageTexto}`}
                  loteId={lote ? lote.id : '-'}
                  loteMedida={loteMedida}
                  fachadaKey={fachada}
                  fachadaNombre={fachada ? (FACHADAS.find((f) => f.key === fachada)?.nombre ?? '-') : '-'}
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
                <div style={{padding: "14px 16px", borderBottom: "1px solid #EAE7E3", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase"}}>El detalle, en numeros</div>
                {resumen.map((r, _i) => (
    <Fragment key={_i}>
                  <div style={{display: "flex", gap: "16px", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid #F4F1ED"}}>
                    <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase", flex: "none"}}>{r.k}</span>
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
          {esPaso7 ? (
    <Fragment>

            <div>
              {enviado ? (
    <Fragment>

                <div style={{maxWidth: "560px", padding: "34px 30px", border: "1px solid #EAE7E3", background: "#FBFBFA"}}>
                  <p style={{margin: "0 0 10px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.18em", color: "#F2004B", textTransform: "uppercase"}}>Enviado</p>
                  <p style={{margin: "0 0 16px", fontSize: "clamp(19px,2.2vw,24px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Tu configuracion ya esta con el arquitecto, {leadPrimerNombre}.</p>
                  <p style={{margin: "0", fontSize: "15px", lineHeight: "1.65", color: "#505759"}}>Te escribimos dentro de las proximas 24 horas para agendar la visita al lote. Seguimiento a 24 h, 72 h y 7 dias &mdash; luego te dejamos en paz.</p>
                </div>

    </Fragment>
    ) : null}
              {noEnviado ? (
    <Fragment>

                <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "30px", maxWidth: "820px"}}>
                  <div>
                    <p style={{margin: "0 0 8px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Ya esta armada. A quien se la mandamos?</p>
                    <p style={{margin: "0 0 26px", fontSize: "15px", lineHeight: "1.6", color: "#8A8F91"}}>Tus datos van directo al arquitecto que revisara esta configuracion. Nada de call centers.</p>
                    <div style={{display: "grid", gap: "14px"}}>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Nombre completo</span>
                        <input value={leadNombre} onChange={onNombre} autoComplete="name" placeholder="Maria Elena Cavazos" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px", outline: "none"}} />
                      </label>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Correo</span>
                        <input value={leadCorreo} onChange={onCorreo} type="email" inputMode="email" autoComplete="email" placeholder="maria@correo.com" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px", outline: "none"}} />
                      </label>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Telefono</span>
                        <input value={leadTel} onChange={onTel} type="tel" inputMode="tel" autoComplete="tel" placeholder="(956) 000 0000" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px", outline: "none"}} />
                      </label>
                    </div>
                  </div>

                  <div>
                    <p style={{margin: "0 0 14px", fontSize: "15px", lineHeight: "1.6", color: "#505759"}}>Al enviar, el arquitecto recibe la ficha completa de tu configuracion &mdash; con el desglose de pies cuadrados, el croquis de tu lote, tus zonas y tu peticion tal cual la escribiste &mdash; y arrancamos el seguimiento para agendar tu cita presencial.</p>
                    <button onClick={enviar} disabled={enviando} className="lgp-hover-zoom" style={{padding: "14px 20px", background: enviando ? "#F4F1ED" : "#F2004B", color: enviando ? "#B7BABB" : "#fff", border: "0", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: enviando ? "wait" : "pointer"}}>
                      {enviando ? 'Enviando...' : 'Enviar al arquitecto'}
                    </button>
                    {envioError ? (
    <Fragment>
                    <div style={{marginTop: "14px", padding: "13px 15px", background: "#FEFCEC", borderLeft: "3px solid #F4DA40"}}>
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
            <button onClick={atras} className="lgp-hover-zoom" style={{padding: "11px 17px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>← Atrás</button>
            <button onClick={siguiente} disabled={siguienteBloqueado} title={siguienteBloqueado ? `Antes elige ${faltantes.map((f) => f.que).join(', ')}` : undefined} className="lgp-hover-zoom" style={{padding: "11px 17px", background: siguienteBloqueado ? "#F4F1ED" : "#1C1E1F", border: "0", color: siguienteBloqueado ? "#B7BABB" : "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: siguienteBloqueado ? "not-allowed" : "pointer"}}>Siguiente →</button>
            <span style={{marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#B7BABB", textTransform: "uppercase"}}>{pasoHint}</span>
          </div>

          {/* Qué falta para poder mandar el resumen. Solo estorba si de verdad falta algo. */}
          {siguienteBloqueado ? (
    <Fragment>
          <div style={{marginTop: "16px", padding: "14px 16px", background: "#FEFCEC", borderLeft: "3px solid #F4DA40"}}>
            <p style={{margin: "0 0 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Falta por definir</p>
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



      <section id="faq" data-screen-label="FAQ" style={{position: "relative", padding: "100px 22px 110px", background: "rgba(255,255,255,0.68)", borderTop: "1px solid #F0EDE9"}}>
        <div data-nofx="1" style={{maxWidth: "760px", margin: "0 auto"}}>
          <h2 style={{margin: "0 0 30px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Preguntas frecuentes</h2>
          <div style={{borderTop: "1px solid #EFECE8"}}>
            {faqs.map((f, _i) => (
    <Fragment key={_i}>

              <div style={{borderBottom: "1px solid #EFECE8"}}>
                <button onClick={f.onToggle} className="lgp-hover-zoom" style={{display: "flex", alignItems: "center", gap: "14px", width: "100%", padding: "17px 4px", background: "transparent", border: "0", textAlign: "left", cursor: "pointer"}}>
                  <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: "#F2004B", flex: "none", width: "12px"}}>{f.icon}</span>
                  <span style={{fontSize: "15px", lineHeight: "1.5", color: "#1C1E1F"}}>{f.q}</span>
                </button>
                {f.open ? (
    <Fragment>

                  <p style={{margin: "0", padding: "0 4px 22px 30px", maxWidth: "600px", fontSize: "14px", lineHeight: "1.7", color: "#8A8F91"}}>{f.a}</p>
                
    </Fragment>
    ) : null}
              </div>
            
    </Fragment>
    ))}
          </div>
        </div>
      </section>

      <section id="contacto" data-screen-label="Contacto" style={{position: "relative", padding: "110px 22px 0", overflow: "hidden"}}>
        <div data-nofx="1" style={{maxWidth: "660px", margin: "0 auto", textAlign: "center"}}>
          <p style={{margin: "0 0 26px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.16em", color: "#A9ADAF", textTransform: "uppercase"}}>Contacto</p>
          <p style={{margin: "0 0 40px", fontSize: "clamp(20px,2.5vw,30px)", lineHeight: "1.34", letterSpacing: "-0.014em", textWrap: "pretty"}}>Trae tu idea a medio cocinar. La terminamos juntos en el lote.</p>
          {citaEnviada ? (
    <Fragment>

          <div style={{maxWidth: "460px", margin: "0 auto", padding: "30px 28px", border: "1px solid #EAE7E3", background: "#fff", textAlign: "left"}}>
            <p style={{margin: "0 0 10px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.18em", color: "#F2004B", textTransform: "uppercase"}}>Cita solicitada</p>
            <p style={{margin: "0 0 14px", fontSize: "clamp(18px,2.1vw,23px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Listo, {leadPrimerNombre}. Te buscamos en menos de 24 horas.</p>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.65", color: "#505759"}}>{configCompleta ? 'El arquitecto llega a la llamada con tu configuración ya revisada.' : 'Si mientras tanto quieres adelantar, arma tu casa en el configurador y llegamos con algo concreto que enseñarte.'}</p>
            {configCompleta ? null : (
    <Fragment>
            <p style={{margin: "16px 0 0"}}><a href="#personaliza" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#8A8F91", textTransform: "uppercase", borderBottom: "1px solid #E4E1DD"}}>Personalizar mi casa ↗</a></p>
    </Fragment>
    )}
          </div>

    </Fragment>
    ) : (
    <Fragment>

          <div style={{maxWidth: "460px", margin: "0 auto", textAlign: "left"}}>
            <div style={{display: "grid", gap: "14px"}}>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Nombre completo</span>
                <input ref={citaNombreRef} value={leadNombre} onChange={onNombre} placeholder="María Elena Cavazos" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px", outline: "none"}} />
              </label>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Correo</span>
                <input type="email" inputMode="email" autoComplete="email" value={leadCorreo} onChange={onCorreo} placeholder="maria@correo.com" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px", outline: "none"}} />
              </label>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Teléfono</span>
                <input type="tel" inputMode="tel" autoComplete="tel" value={leadTel} onChange={onTel} placeholder="(956) 000 0000" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px", outline: "none"}} />
              </label>
            </div>
            {citaError ? (
    <Fragment>
            <p style={{margin: "14px 0 0", padding: "11px 13px", background: "#FEFCEC", borderLeft: "3px solid #F4DA40", fontSize: "13px", lineHeight: "1.5", color: "#505759"}}>{citaError}</p>
    </Fragment>
    ) : null}
            <button onClick={agendarCita} className="lgp-hover-zoom" style={{width: "100%", marginTop: "18px", padding: "15px 20px", background: "#F2004B", color: "#fff", border: "0", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Agendar mi cita →</button>
            <p style={{margin: "12px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", lineHeight: "1.6", letterSpacing: "0.08em", color: "#B7BABB", textTransform: "uppercase"}}>Con el correo o el teléfono basta · Prototipo — no se envía correo real</p>
          </div>

    </Fragment>
    )}
          <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "26px", marginTop: "46px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.08em", color: "#8A8F91"}}>
            <a href="tel:+19560000000">(956) 000 0000</a>
            <a href="mailto:hola@lagranpiedra.com">HOLA@LAGRANPIEDRA.COM</a>
            <span>EDINBURG, TX</span>
          </div>
          <p style={{margin: "30px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#C4C7C8"}}>LA GRAN PIEDRA LLC · TX BUILDER · © 2026</p>
        </div>
        <div style={{marginTop: "70px", lineHeight: "0.78", textAlign: "center", maskImage: "linear-gradient(#000 34%, transparent 92%)", WebkitMaskImage: "linear-gradient(#000 34%, transparent 92%)"}}>
          <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "900", fontSize: "clamp(56px,13.4vw,220px)", letterSpacing: "-0.045em", color: "#F2004B", whiteSpace: "nowrap"}}>LA GRAN</div>
          <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "900", fontSize: "clamp(56px,13.4vw,220px)", letterSpacing: "-0.045em", color: "#F2004B", whiteSpace: "nowrap"}}>PIEDRA</div>
        </div>
      </section>

      <div data-nofx="1" className="lgp-bottom-nav-wrap" style={{position: "fixed", bottom: "0", left: "0", right: "0", zIndex: "60", display: "flex", justifyContent: "center", padding: "14px 22px calc(18px + env(safe-area-inset-bottom))", pointerEvents: "none"}}>
        <div className="lgp-bottom-nav" style={{display: "flex", gap: "20px", padding: "11px 20px", background: "#FBFBFA", boxShadow: "0 1px 0 rgba(28,30,31,0.06) inset, 0 6px 22px rgba(28,30,31,0.14)", pointerEvents: "auto"}}>
          {nav.map((n, _i) => (
    <Fragment key={_i}>

            <a href={n.href} className="lgp-hover-zoom" style={{display: "flex", alignItems: "center", gap: "6px", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: n.color}}>
              <span style={{width: "5px", height: "5px", display: "block", background: n.dot}}></span>{n.label}
            </a>
          
    </Fragment>
    ))}
        </div>
      </div>

      {modalAbierto ? (
    <Fragment>

        <div data-nofx="1" style={{position: "fixed", inset: "0", zIndex: "90", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px", padding: "26px", background: "rgba(251,251,250,0.76)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", animation: "lgpIn .22s ease both"}}>
          <div style={{width: "min(680px,100%)", background: "#fff", border: "1px solid #EAE7E3", boxShadow: "0 24px 70px rgba(28,30,31,0.10)"}}>
            <div style={{position: "relative", height: "250px", overflow: "hidden", background: "#FCFBFA", borderBottom: "1px solid #F0EDE9"}}>
              <img src="/finished-house.jpg" alt="" style={{position: "absolute", left: "50%", top: "18px", width: "280px", height: "180px", objectFit: "cover", transform: "translateX(-58%) rotate(-3.5deg)", boxShadow: "0 12px 34px rgba(28,30,31,0.14)"}} />
              <div style={{position: "absolute", left: "50%", top: "52px", width: "190px", height: "130px", transform: "translateX(20%) rotate(4.5deg)", background: "repeating-linear-gradient(135deg,#EFECE7 0 6px,#F8F6F3 6px 12px)", boxShadow: "0 12px 30px rgba(28,30,31,0.12)"}}></div>
              <div style={{position: "absolute", left: "50%", bottom: "16px", width: "150px", height: "100px", transform: "translateX(-140%) rotate(2.5deg)", background: "repeating-linear-gradient(135deg,#EFECE7 0 6px,#F8F6F3 6px 12px)", boxShadow: "0 10px 26px rgba(28,30,31,0.12)"}}></div>
            </div>
            <div style={{padding: "22px 24px 24px"}}>
              <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "16px", marginBottom: "18px"}}>
                <span style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "22px", letterSpacing: "0.02em"}}>{modalId}</span>
                <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: modalStatusColor, textTransform: "uppercase"}}>{modalStatus}</span>
              </div>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "1px", background: "#EFECE8", border: "1px solid #EFECE8"}}>
                {modalDatos.map((d, _i) => (
    <Fragment key={_i}>

                  <div style={{background: "#fff", padding: "13px 14px"}}>
                    <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>{d.k}</div>
                    <div style={{marginTop: "6px", fontFamily: "Archivo, sans-serif", fontWeight: "700", fontSize: "14px"}}>{d.v}</div>
                  </div>
                
    </Fragment>
    ))}
              </div>
              {modalDisponible ? (
    <Fragment>

                <button onClick={modalElegir} className="lgp-hover-zoom" style={{marginTop: "20px", padding: "12px 18px", background: "#F2004B", border: "0", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Construir en este lote →</button>
              
    </Fragment>
    ) : null}
            </div>
          </div>
          <button onClick={cerrarModal} className="lgp-hover-zoom" style={{padding: "10px 16px", background: "#1C1E1F", border: "0", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Cerrar ✕</button>
        </div>
      
    </Fragment>
    ) : null}

    <MoodboardPreview
      open={previewOpen}
      onClose={() => setPreviewOpen(false)}
      planKey={plan}
      planNombre={planNombreSel}
      interior={interiorSeleccionado}
      modulosSeleccionados={modulosSeleccionados}
      brief={brief}
      resumen={resumen}
    />

    <SubdivisionOverview
      open={overviewOpen}
      onClose={() => setOverviewOpen(false)}
      nombre={subdivisionActiva.nombre}
      zona={subdivisionActiva.zona}
      direccion={subdivisionActiva.direccion}
      totalLotes={subdivisionActiva.totalLotes}
      plat={PLAT_ENCLAVE107}
      ourLotes={lotes}
    />

    </div>
  );
}
