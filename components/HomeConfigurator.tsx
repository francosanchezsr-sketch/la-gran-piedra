'use client';

import { Fragment, createElement, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, WheelEvent } from 'react';
import {
  LOTES,
  PLANES,
  EXTRAS,
  REGLAS_LOTE,
  FACHADAS,
  INTERIORES,
  MODULOS,
  livingDeModulo,
  FAQS,
  NAV,
  PASO_NOMBRES,
  PASO_HINTS,
  SUBDIVISIONES,
  PLAT_ENCLAVE107,
} from '@/lib/data';
import type { SubdivisionKey, Lote } from '@/lib/data';
import HeroLoopVideo from '@/components/HeroLoopVideo';
import { ModuloIcon, FachadaIcon, TragaluzIcon } from '@/components/ConfigIcons';
import MoodboardPreview from '@/components/MoodboardPreview';
import MoodboardCollage from '@/components/MoodboardCollage';
import SubdivisionOverview from '@/components/SubdivisionOverview';
import PlanDiagram from '@/components/FloorplanDiagram';
import { PHOTO_BY_MODULE } from '@/lib/modulePhotos';

type PlanKey = keyof typeof PLANES;
type Sugerencia = { key: string; razon: string | null };
type Lead = { nombre: string; correo: string; tel: string };

const STEP = 26;
const R = 90;

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
  const [lead, setLead] = useState<Lead>({ nombre: '', correo: '', tel: '' });
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [drumIdx, setDrumIdx] = useState(1);
  const [moduloIdx, setModuloIdx] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tragaluces, setTragaluces] = useState<string[]>([]);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [subdivisionKey, setSubdivisionKey] = useState<SubdivisionKey>(SUBDIVISIONES[0].key);
  const subdivisionActiva = SUBDIVISIONES.find((s) => s.key === subdivisionKey) ?? SUBDIVISIONES[0];
  const [recamarasExtra, setRecamarasExtra] = useState(0);
  const [banosExtra, setBanosExtra] = useState(0);
  const [lotePropio, setLotePropio] = useState<Lote | null>(null);
  const [loteFile, setLoteFile] = useState<{ nombre: string; dataUrl: string; mime: string } | null>(null);
  const [loteLoading, setLoteLoading] = useState(false);
  const [loteError, setLoteError] = useState<string | null>(null);
  const [loteAnalisis, setLoteAnalisis] = useState<{
    frente: number | null; fondo: number | null; areaLote: number;
    maxLiving: number; factor: number; confianza: string; nota: string; fuente: string;
  } | null>(null);

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
  useEffect(() => {
    if (!lote) return;
    const r = REGLAS_LOTE[lote.tipo];
    if (lote.planFijo) {
      setPlan(lote.planFijo as PlanKey);
    } else {
      setPlan((p) => (p && r.planes.includes(p) ? p : null));
    }
    if (r.zonasBloqueadas.length) {
      setModulos((prev) => prev.filter((k) => !r.zonasBloqueadas.includes(k)));
    }
    setSugeridos(null);
  }, [lote]);

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
  function ft2Restantes() {
    if (!lote) return 0;
    const usados = plan ? PLANES[plan].living : 0;
    const extra = modulos.reduce((s, k) => {
      const m = MODULOS.find((x) => x.key === k);
      return s + (m ? costoZona(m) : 0);
    }, 0);
    const extrasCuartos = recamarasExtra * EXTRAS.recamara.living + banosExtra * EXTRAS.bano.living;
    return Math.max(0, lote.maxLiving - usados - extra - extrasCuartos);
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
      const arr = (await res.json()) as Sugerencia[];
      const val = arr.filter((x) => MODULOS.some((k) => k.key === x.key));
      if (!val.length) throw new Error('vacio');
      setSugeridos(val);
      setAiLoading(false);
    } catch {
      const fallback = MODULOS.filter((m) => m.min <= disponibles)
        .slice(0, 4)
        .map((m) => ({ key: m.key, razon: 'Compatible con los ' + disponibles + ' ft² libres de tu lote.' }));
      setSugeridos(fallback);
      setAiLoading(false);
      setAiError('No se pudo consultar el modelo ahora mismo — mostramos el filtro por metraje y orientación.');
    }
  }

  // Paso 1 — el usuario puede traer su propio lote (plano en imagen o PDF).
  // La IA lee las cotas y de ahí sale el presupuesto habitable del lote.
  function onLoteFile(e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoteError(null);
    if (file.size > 8 * 1024 * 1024) {
      setLoteError('El archivo pesa más de 8 MB. Sube una versión más ligera.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setLoteFile({ nombre: file.name, dataUrl, mime: file.type });
      analizarLote(dataUrl, file.type, file.name);
    };
    reader.onerror = () => setLoteError('No se pudo leer el archivo.');
    reader.readAsDataURL(file);
  }

  async function analizarLote(dataUrl: string, mime: string, nombre: string) {
    setLoteLoading(true);
    setLoteError(null);
    try {
      const res = await fetch('/api/analizar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, mime, nombre }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoteError(
          data?.detalle ??
            (res.status === 501
              ? 'El análisis por IA no está configurado todavía. Puedes seguir con un lote del catálogo.'
              : 'No se pudo analizar el documento. Revisa que se vean las cotas del lote.'),
        );
        setLoteLoading(false);
        return;
      }
      // Lote propio: fuera de la subdivisión, así que no carga la restricción
      // townhouse y se le abren los tres floorplans.
      const propio: Lote = {
        id: 'Tu lote',
        x: 0, y: 0, w: 0, h: 0,
        frente: data.frente ? `${data.frente} ft` : '—',
        fondo: data.fondo ? `${data.fondo} ft` : '—',
        orient: 'Por definir',
        maxft: Math.round(data.areaLote),
        maxLiving: data.maxLiving,
        pisos: 'hasta 2 pisos',
        tipo: 'libre',
        status: 'disponible',
        origen: 'usuario',
        fuente: data.fuente,
      };
      setLotePropio(propio);
      setLote(propio);
      setLoteAnalisis(data);
      setLoteLoading(false);
    } catch {
      setLoteError('No se pudo analizar el documento. Intenta de nuevo.');
      setLoteLoading(false);
    }
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
    setLote(null);
    setPlan(null);
  }

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
  const onDrumWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const now = Date.now();
    if (wheelAtRef.current && now - wheelAtRef.current < 140) return;
    wheelAtRef.current = now;
    drumGo(di + (e.deltaY > 0 ? 1 : -1), visibles as unknown as Lote[]);
  };

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
  const pasos = PASO_NOMBRES.map((nm, i) => ({
    n: i + 1,
    onClick: () => setPaso(i + 1),
    style: {
      flex: 1, padding: '11px 4px', border: 0, cursor: 'pointer',
      background: paso === i + 1 ? '#1C1E1F' : paso > i + 1 ? '#F2004B' : '#fff',
      color: paso >= i + 1 ? '#fff' : '#B7BABB',
      fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em',
    } as Record<string, any>,
  }));
  const esPaso1 = paso === 1, esPaso2 = paso === 2, esPaso3 = paso === 3, esPaso4 = paso === 4;
  const esPaso5 = paso === 5, esPaso6 = paso === 6, esPaso7 = paso === 7;
  const atras = () => setPaso((p) => Math.max(1, p - 1));
  const siguiente = () => setPaso((p) => Math.min(PASO_NOMBRES.length, p + 1));

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
      onSelect: () => { if (!planFijo) { setPlan(k); setSugeridos(null); } },
    };
  });
  const planesExcluidos = (['B', 'C', 'D'] as PlanKey[])
    .filter((k) => !planesPermitidos.includes(k))
    .map((k) => ({ key: k, nombre: PLANES[k].nombre }));

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

  const briefLen = brief.length;
  const onBrief = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setBrief(e.target.value);

  const ft2Rest = ft2Restantes();
  const mods = (sugeridos || MODULOS.map((m) => ({ key: m.key, razon: null as string | null }))).map((sg) => {
    const m = MODULOS.find((x) => x.key === sg.key)!;
    const incluida = esIncluida(m.key);
    const on = incluida || modulos.indexOf(m.key) >= 0;
    // El reglamento de la subdivisión manda sobre todo lo demás.
    const bloqueadaPorReglamento = Boolean(reglas?.zonasBloqueadas.includes(m.key));
    const costoLiving = costoZona(m);
    const requiereFaltante = m.requiere && !modulos.includes(m.requiere);
    const sinPresupuesto = !on && costoLiving > ft2Rest;
    const disabled = bloqueadaPorReglamento || (!on && (Boolean(requiereFaltante) || sinPresupuesto));
    const requeridoNombre = m.requiere ? (MODULOS.find((x) => x.key === m.requiere)?.corto ?? m.requiere) : null;
    const disabledReason = bloqueadaPorReglamento
      ? reglas!.motivo
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
      iconKey: m.key, nombre: m.corto, rango: m.rango, area: m.area, prop: m.prop, min: m.min, razon: sg.razon,
      on, disabled, disabledReason, requiereFaltante: Boolean(requiereFaltante), bloqueadaPorReglamento,
      incluida, costoLiving, sustituyeA: sustituyeA ? sustituyeA.corto : null,
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

  const moduloDrumIdx = Math.max(0, Math.min(mods.length - 1, moduloIdx));
  const moduloDrum = mods.map((m, i) => {
    const a = (i - moduloDrumIdx) * STEP;
    const far = Math.abs(a) > 76;
    return {
      iconKey: m.iconKey, nombre: m.nombre, incluida: m.incluida,
      dot: m.on ? '#F2004B' : '#D5D7D8',
      disabled: m.disabled, disabledReason: m.disabledReason,
      onClick: () => setModuloIdx(i),
      style: {
        position: 'absolute', left: '20px', right: '20px', top: '50%', height: '42px', marginTop: '-21px',
        display: far ? 'none' : 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', padding: '0 8px', border: 0, background: 'transparent',
        font: 'inherit', color: i === moduloDrumIdx ? '#1C1E1F' : '#505759',
        opacity: Math.max(0, 1 - Math.abs(a) / 88),
        transform: 'rotateX(' + -a + 'deg) translateZ(' + R + 'px)',
        transformOrigin: '50% 50%', backfaceVisibility: 'hidden',
        cursor: 'pointer', transition: 'transform .28s cubic-bezier(.22,.61,.36,1), opacity .28s ease, color .2s ease',
      } as Record<string, any>,
    };
  });
  const focoModulo = mods[moduloDrumIdx] || null;
  const focoTieneTragaluz = focoModulo ? tragaluces.includes(focoModulo.iconKey) : false;
  const tragaluzLleno = tragaluces.length >= 3;
  const orientacionHint = lote ? ((lote.orient as string) === 'Oeste' ? 'Esta zona da al poniente — no ideal para tragaluz.' : `Orientación al ${lote.orient} — buena para tragaluz.`) : '';
  const toggleTragaluz = () => {
    if (!focoModulo || !focoModulo.on) return;
    setTragaluces((prev) => {
      if (prev.includes(focoModulo.iconKey)) return prev.filter((k) => k !== focoModulo.iconKey);
      if (prev.length >= 3) return prev;
      return prev.concat([focoModulo.iconKey]);
    });
  };
  const moduloDrumUp = () => setModuloIdx((i) => Math.max(0, i - 1));
  const moduloDrumDown = () => setModuloIdx((i) => Math.min(mods.length - 1, i + 1));
  const onModuloDrumWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const now = Date.now();
    if (moduloWheelAtRef.current && now - moduloWheelAtRef.current < 140) return;
    moduloWheelAtRef.current = now;
    setModuloIdx((i) => Math.max(0, Math.min(mods.length - 1, i + (e.deltaY > 0 ? 1 : -1))));
  };
  const modulosAgregados = mods.filter((m) => m.on).map((m) => m.nombre).join(', ') || 'Ninguno aún';
  const aiError_ = aiError;
  const aiLabel = aiLoading ? 'Analizando…' : sugeridos ? 'Volver a analizar' : 'Analizar mi brief';

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

  const resumen = [
    { k: 'Lote', v: lote ? lote.id + ' · fachada al ' + lote.orient + ' · máx ' + lote.maxLiving + ' ft² habitables' : 'Sin elegir' },
    { k: 'Floorplan', v: plan ? PLANES[plan].nombre + ' · ' + PLANES[plan].living + ' ft² habitables' + (planFijo ? ' (incluido en el lote)' : '') : 'Sin elegir' },
    { k: 'Recámaras / baños', v: plan ? `${totalRec} rec · ${totalBanos} baños` + (recamarasExtra || banosExtra ? ` (+${recamarasExtra} rec, +${banosExtra} baños extra)` : '') : 'Sin elegir' },
    { k: 'Fachada', v: fachada ? (FACHADAS.find((f) => f.key === fachada) || ({} as any)).nombre : 'Sin elegir' },
    { k: 'Interior', v: interior ? (INTERIORES.find((i) => i.key === interior) || ({} as any)).nombre : 'Sin elegir' },
    { k: 'Módulos', v: modulos.length ? modulos.map((k) => (MODULOS.find((m) => m.key === k) || ({} as any)).nombre).join(', ') : 'Ninguno' },
    { k: 'Tragaluces', v: tragaluces.length ? tragaluces.map((k) => (MODULOS.find((m) => m.key === k) || ({} as any)).corto).join(', ') : 'Ninguno' },
    { k: 'Brief', v: brief ? '“' + brief.slice(0, 150) + (brief.length > 150 ? '…' : '') + '”' : 'Sin brief' },
    { k: 'Contacto', v: (lead.nombre || '—') + (lead.correo ? ' · ' + lead.correo : '') + (lead.tel ? ' · ' + lead.tel : '') },
    { k: 'ft² habitables libres', v: ft2Rest + ' ft² dentro del límite' },
  ];

  const interiorSeleccionado = interior ? INTERIORES.find((i) => i.key === interior) ?? null : null;
  const modulosSeleccionados = mods.filter((m) => m.on).map((m) => ({ iconKey: m.iconKey, nombre: m.nombre, razon: m.razon }));
  const planNombreSel = plan ? PLANES[plan].nombre : 'Sin floorplan elegido';

  const noEnviado = !enviado;
  const enviar = () => setEnviado(true);

  const chips = ['Casas custom', 'Spec homes', 'Escandinavo moderno', 'Farm moderno', 'Smart home', 'Lotes propios', 'Edinburg · McAllen · Mission'];

  const faqs = FAQS.map((f, i) => ({
    q: f.q, a: f.a,
    open: faqOpen === i,
    icon: faqOpen === i ? '−' : '+',
    onToggle: () => setFaqOpen((prev) => (prev === i ? null : i)),
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
  const modalElegir = () => {
    if (!modal) return;
    const idx = visibles.findIndex((v) => v.id === modal.id);
    setLote(modal);
    setLotModal(null);
    setPaso(2);
    setDrumIdx(idx < 0 ? 0 : idx);
    const el = document.getElementById('personaliza');
    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' });
  };
  const cerrarModal = () => setLotModal(null);

  return (
    <div style={{position: "relative", overflowX: "hidden", background: "#FBFBFA", paddingBottom: "74px"}}>

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

        <a href="#contacto" className="lgp-hover-zoom lgp-header-cta" style={{display: "flex", alignItems: "center", padding: "0 24px", background: "#1C1E1F", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", whiteSpace: "nowrap"}}>Agenda una cita</a>
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
            <p style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "clamp(30px,3.6vw,46px)", lineHeight: "1.1", letterSpacing: "-0.03em", textTransform: "uppercase", textWrap: "balance", color: "#fff"}}>Aquí el cliente firma el plano</p>
            <p style={{margin: "18px 0 0", maxWidth: "42ch", fontSize: "16px", lineHeight: "1.6", color: "rgba(255,255,255,0.82)", textWrap: "pretty"}}>Nadie más en el Valle te deja decidir cada módulo antes de mover un solo ladrillo.</p>
            <div style={{display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "34px"}}>
              <a href="#personaliza" className="lgp-hover-zoom" style={{padding: "13px 20px", background: "#F2004B", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase"}}>Personaliza tu casa</a>
              <a href="#lugares" className="lgp-hover-zoom" style={{padding: "13px 20px", border: "1px solid rgba(255,255,255,0.45)", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase"}}>Ver lotes disponibles</a>
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
              <button onClick={() => setOverviewOpen(true)} className="lgp-hover-zoom" style={{padding: "10px 16px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap"}}>Ver mapa completo ↗</button>
              <p style={{margin: "0", maxWidth: "300px", fontSize: "13px", lineHeight: "1.5", color: "#8A8F91", textAlign: "right"}}>Toca un lote para ver frente, orientación y máximo construible.</p>
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

      <section id="personaliza" data-screen-label="Personaliza tu casa" style={{position: "relative", padding: "100px 22px 120px", background: "rgba(255,255,255,0.68)", borderTop: "1px solid #F0EDE9", borderBottom: "1px solid #F0EDE9"}}>
        <div data-nofx="1" style={{maxWidth: "1080px", margin: "0 auto"}}>
          <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "12px"}}>
            <h2 style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Personaliza tu casa</h2>
            <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>Paso {pasoNum} de {PASO_NOMBRES.length} — {pasoNombre}</span>
          </div>

          <div style={{display: "flex", gap: "1px", background: "#EAE7E3", marginBottom: "34px"}}>
            {pasos.map((p, _i) => (
    <Fragment key={_i}>

              <button onClick={p.onClick} style={p.style} className="lgp-hover-zoom">{p.n}</button>
            
    </Fragment>
    ))}
          </div>

          {esPaso1 ? (
    <Fragment>

            <div>
              <p style={{margin: "0 0 24px", maxWidth: "560px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>Empieza por el terreno. Gira el selector hasta el lote que te interese — solo los disponibles se pueden elegir.</p>
              <div className="lgp-picker-grid" style={{display: "grid", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", alignItems: "stretch"}}>

                <div style={{position: "relative", background: "#fff", padding: "0", overflow: "hidden"}}>
                  <div onWheel={onDrumWheel} style={{position: "relative", height: "250px", perspective: "960px", perspectiveOrigin: "50% 50%", touchAction: "none", cursor: "ns-resize"}}>
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
              <p style={{margin: "14px 0 0"}}><a href="#lugares" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#8A8F91", textTransform: "uppercase", borderBottom: "1px solid #E4E1DD"}}>Ver el plano completo de la subdivisión ↗</a></p>

              {/* ¿Ya tienes tu propio terreno? Sube el plano y lo analizamos. */}
              <div style={{marginTop: "34px", padding: "24px", background: "#fff", border: "1px solid #EAE7E3"}}>
                <p style={{margin: "0 0 6px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>¿Ya tienes tu propio lote?</p>
                <p style={{margin: "0 0 18px", maxWidth: "520px", fontSize: "13px", lineHeight: 1.6, color: "#8A8F91"}}>
                  Sube el plano o el documento del terreno (imagen o PDF) y leemos sus dimensiones para calcular cuánta área habitable admite. Al ser un lote fuera de la subdivisión, se te abren los tres floorplans.
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
                      { k: 'Máx habitable', v: loteAnalisis.maxLiving.toLocaleString('es-MX') + ' ft²' },
                    ].map((d) => (
    <Fragment key={d.k}>
                    <div>
                      <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase"}}>{d.k}</p>
                      <p style={{margin: 0, fontFamily: "Archivo, sans-serif", fontWeight: "700", fontSize: "14px"}}>{d.v}</p>
                    </div>
    </Fragment>
    ))}
                  </div>
                  <p style={{margin: "14px 0 0", fontSize: "11px", lineHeight: 1.6, color: "#8A8F91"}}>
                    <strong style={{fontWeight: 600}}>Estimado automático</strong> — confianza {loteAnalisis.confianza}. El máximo habitable se calcula como {Math.round(loteAnalisis.factor * 100)}% del área del lote, proporción tomada del set arquitectónico del Lote 17. {loteAnalisis.nota} El arquitecto verifica las medidas reales en la cita.
                  </p>
    </Fragment>
    ) : null}
                </div>
    </Fragment>
    ) : (
    <Fragment>
                <label style={{display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 18px", background: loteLoading ? "#F4F1ED" : "#1C1E1F", color: loteLoading ? "#B7BABB" : "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: loteLoading ? "wait" : "pointer"}}>
                  {loteLoading ? 'Analizando plano…' : '+ Subir plano de mi lote'}
                  <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={onLoteFile} disabled={loteLoading} style={{display: "none"}} />
                </label>
    </Fragment>
    )}

                {loteError ? (
    <Fragment>
                <p style={{margin: "16px 0 0", padding: "12px 14px", borderLeft: "3px solid #F4DA40", background: "#FEFCEC", fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>{loteError}</p>
    </Fragment>
    ) : null}
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

              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "22px"}}>
                {planesVista.map((p) => (
    <Fragment key={p.key}>
                <button onClick={p.onSelect} disabled={Boolean(planFijo)} style={planFijo ? { ...p.cardStyle, cursor: "default" } : p.cardStyle} className={planFijo ? undefined : "lgp-hover-zoom"}>
                  <PlanDiagram planKey={p.key} />
                  <span style={{display: "flex", alignItems: "center", gap: "8px", marginTop: "16px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase"}}>
                    {p.nombre}
                    {planFijo ? (
    <Fragment>
    <span style={{padding: "3px 7px", background: "#1C1E1F", color: "#FBFBFA", fontFamily: "'IBM Plex Mono', monospace", fontSize: "8px", fontWeight: "400", letterSpacing: "0.1em"}}>INCLUIDO</span>
    </Fragment>
    ) : null}
                  </span>
                  <span style={{display: "block", marginTop: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#8A8F91", textTransform: "uppercase"}}>{p.resumen}</span>
                  <span style={{display: "block", marginTop: "5px", fontSize: "11px", lineHeight: 1.5, color: "#B7BABB"}}>{p.detalle}</span>
                  {p.on && !planFijo ? (
    <Fragment>
    <span style={{display: "block", marginTop: "12px", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.16em", color: "#F2004B", textTransform: "uppercase"}}>✓ Seleccionado</span>
    </Fragment>
    ) : null}
                </button>
    </Fragment>
    ))}
              </div>

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
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3"}}>
                {fachadas.map((f, _i) => (
    <Fragment key={_i}>

                  <button onClick={f.onSelect} style={f.cardStyle} className="lgp-hover-zoom">
                    <span style={{display: "flex", alignItems: "center", justifyContent: "center", height: "92px", background: "#F7F5F2"}}>
                      <FachadaIcon styleKey={f.key} size={38} />
                    </span>
                    <span style={{display: "block", marginTop: "14px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>{f.nombre}</span>
                    <span style={{display: "block", marginTop: "7px", fontSize: "13px", lineHeight: "1.5", color: "#8A8F91"}}>{f.desc}</span>
                    {f.on ? (
    <Fragment>
    <span style={{display: "block", marginTop: "12px", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.16em", color: "#F2004B", textTransform: "uppercase"}}>✓ Seleccionada</span>
    </Fragment>
    ) : null}
                  </button>
                
    </Fragment>
    ))}
              </div>
            </div>
          
    </Fragment>
    ) : null}

          {esPaso4 ? (
    <Fragment>

            <div style={{maxWidth: "660px"}}>
              <p style={{margin: "0 0 8px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em", textWrap: "pretty"}}>Cuéntanos, en tus palabras, cómo se siente vivir ahí.</p>
              <p style={{margin: "0 0 22px", fontSize: "15px", lineHeight: "1.6", color: "#8A8F91"}}>Sin tecnicismos. Escribe como le contarías a un amigo: cuántos son, qué hacen en casa, qué odiaron de la casa anterior.</p>
              <textarea value={brief} onChange={onBrief} placeholder="Somos cuatro, trabajo desde casa y necesito silencio real. Cocinamos mucho y odiamos que se vea el desorden de la cocina desde la sala. Queremos sombra al mediodía…" rows={9} style={{width: "100%", padding: "18px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "15px", lineHeight: "1.65", color: "#1C1E1F", outline: "none"}}></textarea>
              <div style={{display: "flex", justifyContent: "space-between", marginTop: "10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#B7BABB", textTransform: "uppercase"}}>
                <span>Opcional, pero cambia todo</span><span>{briefLen} caracteres</span>
              </div>
            </div>

    </Fragment>
    ) : null}

          {esPaso5 ? (
    <Fragment>

            <div>
              <div style={{display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", marginBottom: "34px"}}>
                <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase", flex: "none"}}>Gama</p>
                <div style={{display: "flex", gap: "10px", flexWrap: "wrap"}}>
                  {interiores.map((i, _i) => (
    <Fragment key={_i}>

                    <button onClick={i.onSelect} title={i.nombre} className="lgp-hover-zoom" style={{display: "flex", width: "46px", height: "30px", padding: 0, border: i.on ? "2px solid #F2004B" : "1px solid #E4E1DD", overflow: "hidden", cursor: "pointer"}}>
                      <span style={{flex: "1", background: i.c1}}></span><span style={{flex: "1", background: i.c2}}></span><span style={{flex: "1", background: i.c3}}></span>
                    </button>

    </Fragment>
    ))}
                </div>
                <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#B7BABB", textTransform: "uppercase"}}>{interiorSeleccionado ? interiorSeleccionado.nombre : 'Elige una'}</span>
              </div>

              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", marginBottom: "22px"}}>
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

              <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", marginBottom: "14px"}}>
                <div style={{display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap"}}>
                  <p style={{margin: "0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>Zonas</p>
                  <span title="Área habitable disponible dentro del límite de tu lote, ya restando el floorplan, los cuartos extra y las zonas que llevas" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: ft2Rest > 0 ? "#F2004B" : "#B7BABB", textTransform: "uppercase"}}>{ft2Rest} ft² habitables disponibles</span>
                </div>
                <button onClick={runAI} className="lgp-hover-zoom" style={{padding: "9px 15px", background: "#1C1E1F", color: "#FBFBFA", border: "0", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap"}}>{aiLabel}</button>
              </div>

              {aiError ? (
    <Fragment>

                <p style={{margin: "0 0 18px", padding: "12px 14px", borderLeft: "3px solid #F4DA40", background: "#FEFCEC", fontSize: "13px", color: "#6B6E70"}}>{aiError}</p>

    </Fragment>
    ) : null}

              <div className="lgp-picker-grid" style={{display: "grid", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", alignItems: "stretch"}}>

                <div style={{position: "relative", background: "#fff", padding: "0", overflow: "hidden"}}>
                  <div onWheel={onModuloDrumWheel} style={{position: "relative", height: "250px", perspective: "960px", perspectiveOrigin: "50% 50%", touchAction: "none", cursor: "ns-resize"}}>
                    <div style={{position: "absolute", left: "0", right: "0", top: "50%", height: "44px", marginTop: "-22px", borderTop: "1px solid #F2004B", borderBottom: "1px solid #F2004B", pointerEvents: "none", zIndex: "2"}}></div>
                    <div style={{position: "absolute", left: "0", right: "0", top: "0", height: "74px", background: "linear-gradient(#fff 12%, rgba(255,255,255,0))", pointerEvents: "none", zIndex: "3"}}></div>
                    <div style={{position: "absolute", left: "0", right: "0", bottom: "0", height: "74px", background: "linear-gradient(rgba(255,255,255,0), #fff 88%)", pointerEvents: "none", zIndex: "3"}}></div>
                    <div style={{position: "absolute", inset: "0", transformStyle: "preserve-3d"}}>
                      {moduloDrum.map((m, _i) => (
    <Fragment key={_i}>

                        <button onClick={m.onClick} style={m.style} className="lgp-hover-zoom" title={m.disabledReason ?? undefined}>
                          <span style={{display: "flex", alignItems: "center", gap: "10px", opacity: m.disabled ? 0.4 : 1}}>
                            <span style={{width: "7px", height: "7px", display: "block", flex: "none", background: m.dot}}></span>
                            <ModuloIcon moduleKey={m.iconKey} size={16} />
                            <span style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.03em", textTransform: "uppercase"}}>{m.nombre}</span>
                          </span>
                          {m.incluida ? (
    <Fragment>
    <span style={{flex: "none", padding: "2px 6px", background: "#1C1E1F", color: "#FBFBFA", fontFamily: "'IBM Plex Mono', monospace", fontSize: "8px", letterSpacing: "0.1em"}}>INCLUIDO</span>
    </Fragment>
    ) : null}
                        </button>

    </Fragment>
    ))}
                    </div>
                  </div>
                  <div style={{display: "flex", borderTop: "1px solid #F0EDE9"}}>
                    <button onClick={moduloDrumUp} className="lgp-hover-zoom" style={{flex: "1", padding: "9px 0", border: "0", borderRight: "1px solid #F0EDE9", background: "transparent", color: "#8A8F91", fontSize: "13px", cursor: "pointer"}}>▲</button>
                    <button onClick={moduloDrumDown} className="lgp-hover-zoom" style={{flex: "1", padding: "9px 0", border: "0", background: "transparent", color: "#8A8F91", fontSize: "13px", cursor: "pointer"}}>▼</button>
                  </div>
                </div>

                {focoModulo ? (
    <Fragment>
                <div style={{background: "#fff", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "12px"}}>
                  <div style={{width: "72px", height: "72px", flex: "none", borderRadius: "10px", overflow: "hidden", background: "#F7F5F2", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    {PHOTO_BY_MODULE[focoModulo.iconKey] ? (
    <Fragment>
    <img src={PHOTO_BY_MODULE[focoModulo.iconKey]} alt={focoModulo.nombre} style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}} />
    </Fragment>
    ) : (
    <Fragment>
    <ModuloIcon moduleKey={focoModulo.iconKey} size={30} />
    </Fragment>
    )}
                  </div>
                  <span style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.04em", textTransform: "uppercase"}}>{focoModulo.nombre}</span>
                  {focoModulo.incluida ? (
    <Fragment>
                  <span style={{padding: "9px 15px", background: "#1C1E1F", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase"}}>✓ Incluido en el plano</span>
                  <p style={{margin: 0, maxWidth: "230px", fontSize: "11px", lineHeight: 1.5, color: "#B7BABB"}}>Ya viene en el plano aprobado, no consume presupuesto. Para cambiarla, elige la alternativa de su mismo grupo.</p>
    </Fragment>
    ) : (
    <Fragment>
                  <button onClick={focoModulo.onToggle} disabled={focoModulo.disabled} title={focoModulo.disabledReason ?? undefined} className="lgp-hover-zoom" style={focoModulo.disabled ? {padding: "9px 15px", background: "#F4F1ED", border: "1px solid #E4E1DD", color: "#B7BABB", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "not-allowed"} : focoModulo.on ? {padding: "9px 15px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"} : {padding: "9px 15px", background: "#F2004B", border: "0", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>{focoModulo.on ? '✓ Agregado' : focoModulo.disabled ? (focoModulo.requiereFaltante ? 'Requiere zona' : 'No cabe') : '+ Agregar'}</button>
                  {focoModulo.sustituyeA && !focoModulo.on ? (
    <Fragment>
                  <p style={{margin: 0, maxWidth: "230px", fontSize: "11px", lineHeight: 1.5, color: "#8A8F91"}}>Sustituye a <strong style={{fontWeight: 600}}>{focoModulo.sustituyeA}</strong> — solo cuesta la diferencia: {focoModulo.costoLiving} ft².</p>
    </Fragment>
    ) : null}
                  {focoModulo.disabledReason ? (
    <Fragment>
                  <p style={{margin: 0, maxWidth: "220px", fontSize: "11px", lineHeight: 1.5, color: "#B7BABB"}}>{focoModulo.disabledReason}</p>
    </Fragment>
    ) : null}
    </Fragment>
    )}
                  {focoModulo.on ? (
    <Fragment>
                  <button onClick={toggleTragaluz} disabled={!focoTieneTragaluz && tragaluzLleno} className="lgp-hover-zoom" style={{display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: focoTieneTragaluz ? "#1C1E1F" : "transparent", border: "1px solid " + (focoTieneTragaluz ? "#1C1E1F" : "#DDD9D4"), color: focoTieneTragaluz ? "#fff" : (tragaluzLleno ? "#DDD9D4" : "#505759"), fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", cursor: (!focoTieneTragaluz && tragaluzLleno) ? "not-allowed" : "pointer"}}><TragaluzIcon size={13} color={focoTieneTragaluz ? "#fff" : (tragaluzLleno ? "#DDD9D4" : "#505759")} />{focoTieneTragaluz ? 'Con tragaluz' : 'Tragaluz'}</button>
                  <p style={{margin: 0, maxWidth: "200px", fontSize: "10px", lineHeight: 1.5, color: "#B7BABB"}}>{tragaluzLleno && !focoTieneTragaluz ? 'Máximo 3 tragaluces a la vez.' : orientacionHint}</p>
    </Fragment>
    ) : null}
                </div>
    </Fragment>
    ) : null}
              </div>

              <div style={{position: "relative", marginTop: "34px", padding: "26px 20px", background: "repeating-linear-gradient(135deg,#F3F1EE 0 6px,#FCFBFA 6px 12px)", border: "1px solid #EAE7E3"}}>
                <button onClick={() => setPreviewOpen(true)} className="lgp-hover-zoom" style={{position: "absolute", top: "14px", right: "14px", padding: "8px 13px", background: "#fff", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", zIndex: 2}}>Pantalla completa ↗</button>
                <MoodboardCollage planKey={plan} planNombre={planNombreSel} interior={interiorSeleccionado} modulosSeleccionados={modulosSeleccionados} compact />
              </div>
            </div>

    </Fragment>
    ) : null}

          {esPaso6 ? (
    <Fragment>

            <div style={{maxWidth: "520px"}}>
              <p style={{margin: "0 0 8px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Ya está armada. ¿A quién se la mandamos?</p>
              <p style={{margin: "0 0 26px", fontSize: "15px", lineHeight: "1.6", color: "#8A8F91"}}>Tus datos van directo al arquitecto que revisará esta configuración. Nada de call centers.</p>
              <div style={{display: "grid", gap: "14px"}}>
                <label style={{display: "block"}}>
                  <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Nombre completo</span>
                  <input value={leadNombre} onChange={onNombre} placeholder="María Elena Cavazos" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "15px", outline: "none"}} />
                </label>
                <label style={{display: "block"}}>
                  <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Correo</span>
                  <input value={leadCorreo} onChange={onCorreo} placeholder="maria@correo.com" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "15px", outline: "none"}} />
                </label>
                <label style={{display: "block"}}>
                  <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A8F91", textTransform: "uppercase"}}>Teléfono</span>
                  <input value={leadTel} onChange={onTel} placeholder="(956) 000 0000" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "15px", outline: "none"}} />
                </label>
              </div>
            </div>

    </Fragment>
    ) : null}

          {esPaso7 ? (
    <Fragment>

            <div>
              {enviado ? (
    <Fragment>

                <div style={{maxWidth: "560px", padding: "34px 30px", border: "1px solid #EAE7E3", background: "#FBFBFA"}}>
                  <p style={{margin: "0 0 10px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.18em", color: "#F2004B", textTransform: "uppercase"}}>Enviado</p>
                  <p style={{margin: "0 0 16px", fontSize: "clamp(19px,2.2vw,24px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Tu configuración ya está con el arquitecto, {leadPrimerNombre}.</p>
                  <p style={{margin: "0", fontSize: "15px", lineHeight: "1.65", color: "#505759"}}>Te escribimos dentro de las próximas 24 horas para agendar la visita al lote. Seguimiento a 24 h, 72 h y 7 días — luego te dejamos en paz.</p>
                </div>

    </Fragment>
    ) : null}
              {noEnviado ? (
    <Fragment>

                <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "26px"}}>
                  <div style={{border: "1px solid #EAE7E3"}}>
                    <div style={{padding: "14px 16px", borderBottom: "1px solid #EAE7E3", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase"}}>Resumen de tu casa</div>
                    {resumen.map((r, _i) => (
    <Fragment key={_i}>

                      <div style={{display: "flex", gap: "16px", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid #F4F1ED"}}>
                        <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#A9ADAF", textTransform: "uppercase", flex: "none"}}>{r.k}</span>
                        <span style={{fontSize: "14px", lineHeight: "1.5", textAlign: "right", color: "#1C1E1F"}}>{r.v}</span>
                      </div>

    </Fragment>
    ))}
                  </div>
                  <div>
                    <p style={{margin: "0 0 14px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>Al enviar, el arquitecto recibe este resumen completo y arrancamos el seguimiento para agendar tu cita presencial en el lote.</p>
                    <button onClick={enviar} className="lgp-hover-zoom" style={{padding: "14px 20px", background: "#F2004B", color: "#fff", border: "0", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Enviar al arquitecto →</button>
                    <p style={{margin: "14px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#B7BABB", textTransform: "uppercase"}}>Prototipo — no se envía correo real</p>
                  </div>
                </div>

    </Fragment>
    ) : null}
            </div>

    </Fragment>
    ) : null}

          <div className="lgp-step-actions" style={{display: "flex", alignItems: "center", gap: "10px", marginTop: "40px", paddingTop: "22px", borderTop: "1px solid #F0EDE9"}}>
            <button onClick={atras} className="lgp-hover-zoom" style={{padding: "11px 17px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>← Atrás</button>
            <button onClick={siguiente} className="lgp-hover-zoom" style={{padding: "11px 17px", background: "#1C1E1F", border: "0", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Siguiente →</button>
            <span style={{marginLeft: "auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#B7BABB", textTransform: "uppercase"}}>{pasoHint}</span>
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
        <div data-nofx="1" style={{display: "flex", gap: "14px", overflowX: "auto", padding: "0 22px 10px", scrollbarWidth: "thin"}}>
          <img src="/finished-house.jpg" alt="Casa terminada en Edinburg" style={{height: "230px", width: "auto", flex: "none", objectFit: "cover", display: "block"}} />
          <div style={{height: "230px", width: "300px", flex: "none", background: "repeating-linear-gradient(135deg,#F3F1EE 0 6px,#FCFBFA 6px 12px)", position: "relative"}}>
            <span style={{position: "absolute", left: "12px", bottom: "11px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#B7BABB", textTransform: "uppercase"}}>FOTO — OBRA GRIS SEMANA 9</span>
          </div>
          <div style={{height: "230px", width: "300px", flex: "none", background: "repeating-linear-gradient(135deg,#F3F1EE 0 6px,#FCFBFA 6px 12px)", position: "relative"}}>
            <span style={{position: "absolute", left: "12px", bottom: "11px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#B7BABB", textTransform: "uppercase"}}>FOTO — COCINA CON TRAGALUZ</span>
          </div>
          <div style={{height: "230px", width: "230px", flex: "none", background: "repeating-linear-gradient(135deg,#F3F1EE 0 6px,#FCFBFA 6px 12px)", position: "relative"}}>
            <span style={{position: "absolute", left: "12px", bottom: "11px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#B7BABB", textTransform: "uppercase"}}>FOTO — PATIO CENTRAL</span>
          </div>
          <div style={{height: "230px", width: "300px", flex: "none", background: "repeating-linear-gradient(135deg,#F3F1EE 0 6px,#FCFBFA 6px 12px)", position: "relative"}}>
            <span style={{position: "absolute", left: "12px", bottom: "11px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#B7BABB", textTransform: "uppercase"}}>DRONE — SUBDIVISIÓN</span>
          </div>
        </div>
      </section>

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
          <a href="#personaliza" className="lgp-hover-zoom" style={{display: "inline-flex", alignItems: "center", justifyContent: "center", width: "88px", height: "88px", background: "#1C1E1F", color: "#FBFBFA", fontSize: "24px"}}>→</a>
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

      <div data-nofx="1" style={{position: "fixed", bottom: "0", left: "0", right: "0", zIndex: "60", display: "flex", justifyContent: "center", padding: "14px 22px calc(18px + env(safe-area-inset-bottom))", pointerEvents: "none"}}>
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
