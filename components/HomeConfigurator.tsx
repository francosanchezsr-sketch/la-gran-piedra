'use client';

import { Fragment, createElement, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, WheelEvent } from 'react';
import {
  LOTES,
  PLANES,
  FACHADAS,
  INTERIORES,
  MODULOS,
  FAQS,
  NAV,
  PASO_NOMBRES,
  PASO_HINTS,
} from '@/lib/data';
import VideoHero from '@/components/VideoHero';

type Lote = (typeof LOTES)[number];
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

  const glow = 1;

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

  function ft2Restantes() {
    if (!lote) return 0;
    const usados = plan ? PLANES[plan].ft2 : 0;
    const extra = modulos.reduce((s, k) => {
      const m = MODULOS.find((x) => x.key === k);
      return s + (m ? m.min : 0);
    }, 0);
    return Math.max(0, lote.maxft - usados - extra);
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
        h('line', { key: 'a', x1: 20, y1: 196, x2: 880, y2: 196 }),
        h('line', { key: 'b', x1: 20, y1: 234, x2: 880, y2: 234 }),
        h('line', { key: 'c', x1: 20, y1: 20, x2: 20, y2: 410, strokeDasharray: '3 5' }),
        h('line', { key: 'd', x1: 880, y1: 20, x2: 880, y2: 410, strokeDasharray: '3 5' })),
      h('text', { key: 's1', x: 26, y: 219, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: 1.6, fill: '#B7BABB' }, 'PIEDRA NORTE DR'),
      h('text', { key: 's2', x: 20, y: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: 1.6, fill: '#B7BABB' }, 'N ↑'),
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
    { k: 'Máx construible', v: foco.maxft + ' ft²' },
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
  const esPaso5 = paso === 5, esPaso6 = paso === 6, esPaso7 = paso === 7, esPaso8 = paso === 8;
  const atras = () => setPaso((p) => Math.max(1, p - 1));
  const siguiente = () => setPaso((p) => Math.min(8, p + 1));

  const loteId = lote ? lote.id : 'tu lote';
  const planAOn = plan === 'A', planBOn = plan === 'B', planCOn = plan === 'C';
  const planAStyle = cardStyle(plan === 'A', { border: '1px solid #EAE7E3' });
  const planBStyle = cardStyle(plan === 'B', { border: '1px solid #EAE7E3' });
  const planCStyle = cardStyle(plan === 'C', { border: '1px solid #EAE7E3' });
  const selPlanA = () => { setPlan('A'); setSugeridos(null); };
  const selPlanB = () => { setPlan('B'); setSugeridos(null); };
  const selPlanC = () => { setPlan('C'); setSugeridos(null); };

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
    const on = modulos.indexOf(m.key) >= 0;
    return {
      nombre: m.nombre, rango: m.rango, area: m.area, prop: m.prop, razon: sg.razon,
      box: on ? '#F2004B' : '#fff',
      cardStyle: cardStyle(on),
      onToggle: () => setModulos((prev) => (prev.indexOf(m.key) >= 0 ? prev.filter((k) => k !== m.key) : prev.concat([m.key]))),
    };
  });
  const aiError_ = aiError;
  const aiLabel = aiLoading ? 'Analizando…' : sugeridos ? 'Volver a analizar' : 'Analizar mi brief';

  const leadNombre = lead.nombre, leadCorreo = lead.correo, leadTel = lead.tel;
  const leadPrimerNombre = (lead.nombre || 'gracias').split(' ')[0];
  const onNombre = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, nombre: e.target.value }));
  const onCorreo = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, correo: e.target.value }));
  const onTel = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, tel: e.target.value }));

  const resumen = [
    { k: 'Lote', v: lote ? lote.id + ' · fachada al ' + lote.orient + ' · máx ' + lote.maxft + ' ft²' : 'Sin elegir' },
    { k: 'Floorplan', v: plan ? PLANES[plan].nombre + ' · ' + PLANES[plan].ft2 + ' ft²' : 'Sin elegir' },
    { k: 'Fachada', v: fachada ? (FACHADAS.find((f) => f.key === fachada) || ({} as any)).nombre : 'Sin elegir' },
    { k: 'Interior', v: interior ? (INTERIORES.find((i) => i.key === interior) || ({} as any)).nombre : 'Sin elegir' },
    { k: 'Módulos', v: modulos.length ? modulos.map((k) => (MODULOS.find((m) => m.key === k) || ({} as any)).nombre).join(', ') : 'Ninguno' },
    { k: 'Brief', v: brief ? '“' + brief.slice(0, 150) + (brief.length > 150 ? '…' : '') + '”' : 'Sin brief' },
    { k: 'Contacto', v: (lead.nombre || '—') + (lead.correo ? ' · ' + lead.correo : '') + (lead.tel ? ' · ' + lead.tel : '') },
    { k: 'ft² libres', v: ft2Rest + ' ft² dentro del límite' },
  ];

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

        <a href="#index" style={{display: "flex", alignItems: "center", gap: "13px", padding: "11px 22px"}}>
          <img src="/logo-full.svg" alt="La Gran Piedra" style={{height: "38px", width: "auto", display: "block"}} />
          <img src="/logo-wordmark.svg" alt="La Gran Piedra" style={{height: "11px", width: "auto", display: "block"}} />
        </a>

        <div style={{flex: "1"}}></div>

        <div style={{display: "flex", alignItems: "center", gap: "14px", padding: "0 20px"}}>
          <a href="https://instagram.com" title="Instagram" style={{display: "flex", alignItems: "center"}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#505759" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.4" cy="6.6" r="1.15" fill="#505759" stroke="none"></circle></svg></a>
          <a href="https://tiktok.com" title="TikTok" style={{display: "flex", alignItems: "center"}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#505759" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.2 3v11.4a3.9 3.9 0 1 1-3.2-3.84"></path><path d="M14.2 3c.3 2.6 1.9 4.2 4.5 4.5"></path></svg></a>
        </div>

        <a href="#contacto" style={{display: "flex", alignItems: "center", padding: "0 24px", background: "#1C1E1F", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", whiteSpace: "nowrap"}}>Agenda una cita</a>
      </div>

      <section id="index" data-screen-label="Inicio" style={{position: "relative", minHeight: "calc(100vh - 90px)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "110px 22px 24px"}}>
        <div style={{maxWidth: "1240px", margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "minmax(280px,460px) 1fr", gap: "32px", alignItems: "center"}}>

          <div data-nofx="1" style={{position: "relative", zIndex: "2", animation: "lgpUp .9s ease both"}}>
            <p style={{margin: "0 0 16px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "10px", letterSpacing: "0.2em", color: "#F2004B", textTransform: "uppercase"}}>Casas custom · Rio Grande Valley</p>
            <p style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "clamp(30px,3.6vw,46px)", lineHeight: "1.1", letterSpacing: "-0.03em", textTransform: "uppercase", textWrap: "balance"}}>Aquí el cliente firma el plano</p>
            <p style={{margin: "18px 0 0", maxWidth: "42ch", fontSize: "16px", lineHeight: "1.6", color: "#505759", textWrap: "pretty"}}>Nadie más en el Valle te deja decidir cada módulo antes de mover un solo ladrillo.</p>
            <div style={{display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "34px"}}>
              <a href="#personaliza" style={{padding: "13px 20px", background: "#F2004B", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase"}}>Personaliza tu casa</a>
              <a href="#lugares" style={{padding: "13px 20px", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase"}}>Ver lotes disponibles</a>
            </div>
          </div>

          <div style={{position: "relative"}}>
            <VideoHero src="/hero-video.mp4" poster="/hero-house.jpg" alt="Casa custom de La Gran Piedra, Edinburg TX" />
            <div style={{position: "absolute", inset: "0", background: "radial-gradient(62% 74% at 50% 100%, rgba(242,0,75,0.16) 0%, rgba(246,117,153,0.06) 46%, transparent 78%)", opacity: glow, pointerEvents: "none"}}></div>
          </div>
        </div>

        <div data-nofx="1" style={{position: "relative", zIndex: "2", maxWidth: "1000px", margin: "20px auto 0", width: "100%", background: "#FBFBFA", boxShadow: "0 18px 46px rgba(28,30,31,0.10)"}}>
          <div style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))"}}>
            <div style={{padding: "26px 24px", borderRight: "1px solid #EAE7E3"}}>
              <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>14</div>
              <div style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase", marginTop: "5px"}}>Lotes en Edinburg</div>
            </div>
            <div style={{padding: "26px 24px", borderRight: "1px solid #EAE7E3"}}>
              <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>8</div>
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
          <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "38px"}}>
            <h2 style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>Lugares disponibles</h2>
            <p style={{margin: "0", maxWidth: "420px", fontSize: "14px", lineHeight: "1.55", color: "#8A8F91"}}>Subdivisión Piedra Norte, Edinburg TX. Toca un lote para ver frente, orientación y máximo construible.</p>
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
            <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#A9ADAF", textTransform: "uppercase"}}>Paso {pasoNum} de 8 — {pasoNombre}</span>
          </div>

          <div style={{display: "flex", gap: "1px", background: "#EAE7E3", marginBottom: "34px"}}>
            {pasos.map((p, _i) => (
    <Fragment key={_i}>

              <button onClick={p.onClick} style={p.style}>{p.n}</button>
            
    </Fragment>
    ))}
          </div>

          {esPaso1 ? (
    <Fragment>

            <div>
              <p style={{margin: "0 0 24px", maxWidth: "560px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>Empieza por el terreno. Gira el selector hasta el lote que te interese — solo los disponibles se pueden elegir.</p>
              <div style={{display: "grid", gridTemplateColumns: "minmax(230px,300px) 1fr", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", alignItems: "stretch"}}>

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
                    <button onClick={drumUp} style={{flex: "1", padding: "9px 0", border: "0", borderRight: "1px solid #F0EDE9", background: "transparent", color: "#8A8F91", fontSize: "13px", cursor: "pointer"}}>▲</button>
                    <button onClick={drumDown} style={{flex: "1", padding: "9px 0", border: "0", background: "transparent", color: "#8A8F91", fontSize: "13px", cursor: "pointer"}}>▼</button>
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
            </div>
          
    </Fragment>
    ) : null}

          {esPaso2 ? (
    <Fragment>

            <div>
              <p style={{margin: "0 0 26px", maxWidth: "600px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>Estas son las variantes que nuestros arquitectos curaron para <strong style={{fontWeight: "600"}}>{loteId}</strong>, ordenadas según la orientación de su fachada.</p>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "22px"}}>

                <button onClick={selPlanA} style={planAStyle}>
                  <svg viewBox="0 0 300 190" style={{width: "100%", height: "auto", display: "block"}}>
                    <g fill="none" stroke="#505759" strokeWidth="1.6">
                      <rect x="14" y="14" width="272" height="162"></rect>
                      <line x1="14" y1="96" x2="180" y2="96"></line><line x1="180" y1="14" x2="180" y2="176"></line>
                      <line x1="96" y1="96" x2="96" y2="176"></line><line x1="232" y1="96" x2="286" y2="96"></line>
                    </g>
                    <g fill="none" stroke="#C9CBCC" strokeWidth="1">
                      <rect x="26" y="26" width="60" height="40"></rect><rect x="112" y="26" width="54" height="26"></rect>
                      <rect x="106" y="110" width="60" height="52"></rect><rect x="26" y="110" width="56" height="30"></rect>
                      <rect x="196" y="110" width="76" height="20"></rect><line x1="196" y1="40" x2="272" y2="40"></line>
                    </g>
                    <g fill="#F67599" opacity="0.5"><rect x="196" y="26" width="76" height="56"></rect></g>
                    <text x="204" y="58" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="0.6" fill="#8A2249">PATIO</text>
                  </svg>
                  <span style={{display: "block", marginTop: "16px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase"}}>Corredor Norte</span>
                  <span style={{display: "block", marginTop: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#8A8F91", textTransform: "uppercase"}}>2,450 ft² · 3 rec · 2.5 baños · 1 piso</span>
                  {planAOn ? (
    <Fragment>
    <span style={{display: "block", marginTop: "12px", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.16em", color: "#F2004B", textTransform: "uppercase"}}>✓ Seleccionado</span>
    </Fragment>
    ) : null}
                </button>

                <button onClick={selPlanB} style={planBStyle}>
                  <svg viewBox="0 0 300 190" style={{width: "100%", height: "auto", display: "block"}}>
                    <g fill="none" stroke="#505759" strokeWidth="1.6">
                      <rect x="14" y="14" width="272" height="162"></rect>
                      <rect x="106" y="62" width="88" height="66"></rect>
                      <line x1="14" y1="62" x2="106" y2="62"></line><line x1="194" y1="128" x2="286" y2="128"></line>
                      <line x1="106" y1="14" x2="106" y2="62"></line><line x1="194" y1="128" x2="194" y2="176"></line>
                    </g>
                    <g fill="none" stroke="#C9CBCC" strokeWidth="1">
                      <rect x="26" y="74" width="64" height="42"></rect><rect x="26" y="26" width="64" height="24"></rect>
                      <rect x="210" y="26" width="62" height="40"></rect><rect x="210" y="140" width="62" height="24"></rect>
                      <rect x="120" y="140" width="58" height="24"></rect>
                    </g>
                    <g fill="#F67599" opacity="0.5"><rect x="106" y="62" width="88" height="66"></rect></g>
                    <circle cx="150" cy="95" r="13" fill="none" stroke="#F2004B" strokeWidth="1.2"></circle>
                    <text x="112" y="122" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="0.6" fill="#8A2249">PATIO + ÁRBOL</text>
                  </svg>
                  <span style={{display: "block", marginTop: "16px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase"}}>Patio Central</span>
                  <span style={{display: "block", marginTop: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#8A8F91", textTransform: "uppercase"}}>2,780 ft² · 4 rec · 3 baños · 1 piso</span>
                  {planBOn ? (
    <Fragment>
    <span style={{display: "block", marginTop: "12px", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.16em", color: "#F2004B", textTransform: "uppercase"}}>✓ Seleccionado</span>
    </Fragment>
    ) : null}
                </button>

                <button onClick={selPlanC} style={planCStyle}>
                  <svg viewBox="0 0 300 190" style={{width: "100%", height: "auto", display: "block"}}>
                    <g fill="none" stroke="#505759" strokeWidth="1.6">
                      <rect x="14" y="14" width="180" height="162"></rect>
                      <rect x="212" y="86" width="74" height="90"></rect>
                      <line x1="14" y1="104" x2="194" y2="104"></line><line x1="104" y1="14" x2="104" y2="104"></line>
                    </g>
                    <g fill="none" stroke="#C9CBCC" strokeWidth="1">
                      <rect x="26" y="26" width="62" height="60"></rect><rect x="118" y="26" width="62" height="34"></rect>
                      <rect x="26" y="118" width="70" height="44"></rect><rect x="112" y="118" width="68" height="20"></rect>
                      <rect x="222" y="98" width="54" height="34"></rect><line x1="222" y1="150" x2="276" y2="150"></line>
                    </g>
                    <g fill="#F4DA40" opacity="0.45"><rect x="212" y="86" width="74" height="90"></rect></g>
                    <text x="219" y="170" fontFamily="IBM Plex Mono, monospace" fontSize="8" letterSpacing="0.6" fill="#7A6A12">CASITA</text>
                  </svg>
                  <span style={{display: "block", marginTop: "16px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase"}}>Casita Anexa</span>
                  <span style={{display: "block", marginTop: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#8A8F91", textTransform: "uppercase"}}>3,120 ft² · 3+1 rec · 3.5 baños · 2 pisos</span>
                  {planCOn ? (
    <Fragment>
    <span style={{display: "block", marginTop: "12px", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.16em", color: "#F2004B", textTransform: "uppercase"}}>✓ Seleccionado</span>
    </Fragment>
    ) : null}
                </button>
              </div>
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

                  <button onClick={f.onSelect} style={f.cardStyle}>
                    <span style={{display: "block", aspectRatio: "4/3", background: "repeating-linear-gradient(135deg,#F3F1EE 0 6px,#FCFBFA 6px 12px)", position: "relative"}}>
                      <span style={{position: "absolute", left: "10px", bottom: "9px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#B7BABB", textTransform: "uppercase"}}>{f.slot}</span>
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

            <div>
              <p style={{margin: "0 0 26px", maxWidth: "560px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>Paletas de interiorismo vigentes en 2026. Puedes cambiarla más adelante sin costo.</p>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3"}}>
                {interiores.map((i, _i) => (
    <Fragment key={_i}>

                  <button onClick={i.onSelect} style={i.cardStyle}>
                    <span style={{display: "flex", height: "64px"}}>
                      <span style={{flex: "1", background: i.c1}}></span><span style={{flex: "1", background: i.c2}}></span><span style={{flex: "1", background: i.c3}}></span>
                    </span>
                    <span style={{display: "block", marginTop: "14px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>{i.nombre}</span>
                    <span style={{display: "block", marginTop: "7px", fontSize: "13px", lineHeight: "1.5", color: "#8A8F91"}}>{i.desc}</span>
                    {i.on ? (
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

          {esPaso5 ? (
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

          {esPaso6 ? (
    <Fragment>

            <div>
              <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", marginBottom: "22px"}}>
                <p style={{margin: "0", maxWidth: "600px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>Cruzamos tu brief con la orientación de <strong style={{fontWeight: "600"}}>{loteId}</strong> y los <strong style={{fontWeight: "600"}}>{ft2Rest} ft²</strong> que te quedan dentro del límite del lote. Solo módulos que sí caben.</p>
                <button onClick={runAI} style={{padding: "11px 17px", background: "#1C1E1F", color: "#FBFBFA", border: "0", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap"}}>{aiLabel}</button>
              </div>

              {aiError ? (
    <Fragment>

                <p style={{margin: "0 0 18px", padding: "12px 14px", borderLeft: "3px solid #F4DA40", background: "#FEFCEC", fontSize: "13px", color: "#6B6E70"}}>{aiError}</p>
              
    </Fragment>
    ) : null}

              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3"}}>
                {mods.map((m, _i) => (
    <Fragment key={_i}>

                  <button onClick={m.onToggle} style={m.cardStyle}>
                    <span style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px"}}>
                      <span style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: "1.5"}}>{m.nombre}</span>
                      <span style={{width: "16px", height: "16px", flex: "none", display: "block", border: "1px solid #C9CBCC", background: m.box}}></span>
                    </span>
                    <span style={{display: "block", marginTop: "11px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#8A8F91", textTransform: "uppercase"}}>{m.rango} · {m.area} ft² · {m.prop}</span>
                    {m.razon ? (
    <Fragment>

                      <span style={{display: "block", marginTop: "12px", paddingTop: "11px", borderTop: "1px solid #F0EDE9", fontSize: "13px", lineHeight: "1.55", color: "#505759"}}>{m.razon}</span>
                    
    </Fragment>
    ) : null}
                  </button>
                
    </Fragment>
    ))}
              </div>
              <p style={{margin: "16px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#B7BABB", textTransform: "uppercase"}}>La IA interpreta intención y filtra el catálogo. No mueve muros ni genera planos.</p>
            </div>
          
    </Fragment>
    ) : null}

          {esPaso7 ? (
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

          {esPaso8 ? (
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
                    <button onClick={enviar} style={{padding: "14px 20px", background: "#F2004B", color: "#fff", border: "0", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Enviar al arquitecto →</button>
                    <p style={{margin: "14px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#B7BABB", textTransform: "uppercase"}}>Prototipo — no se envía correo real</p>
                  </div>
                </div>
              
    </Fragment>
    ) : null}
            </div>
          
    </Fragment>
    ) : null}

          <div style={{display: "flex", alignItems: "center", gap: "10px", marginTop: "40px", paddingTop: "22px", borderTop: "1px solid #F0EDE9"}}>
            <button onClick={atras} style={{padding: "11px 17px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>← Atrás</button>
            <button onClick={siguiente} style={{padding: "11px 17px", background: "#1C1E1F", border: "0", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Siguiente →</button>
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
                <button onClick={f.onToggle} style={{display: "flex", alignItems: "center", gap: "14px", width: "100%", padding: "17px 4px", background: "transparent", border: "0", textAlign: "left", cursor: "pointer"}}>
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
          <a href="#personaliza" style={{display: "inline-flex", alignItems: "center", justifyContent: "center", width: "88px", height: "88px", background: "#1C1E1F", color: "#FBFBFA", fontSize: "24px"}}>→</a>
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

      <div data-nofx="1" style={{position: "fixed", bottom: "0", left: "0", right: "0", zIndex: "60", display: "flex", justifyContent: "center", padding: "14px 22px 18px", pointerEvents: "none"}}>
        <div style={{display: "flex", gap: "20px", padding: "11px 20px", background: "#FBFBFA", boxShadow: "0 1px 0 rgba(28,30,31,0.06) inset, 0 6px 22px rgba(28,30,31,0.14)", pointerEvents: "auto"}}>
          {nav.map((n, _i) => (
    <Fragment key={_i}>

            <a href={n.href} style={{display: "flex", alignItems: "center", gap: "6px", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: n.color}}>
              <span style={{width: "5px", height: "5px", display: "block", background: n.dot}}></span>{n.label}
            </a>
          
    </Fragment>
    ))}
        </div>
      </div>

      {modalAbierto ? (
    <Fragment>

        <div data-nofx="1" style={{position: "fixed", inset: "0", zIndex: "90", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px", padding: "26px", background: "rgba(251,251,250,0.76)", backdropFilter: "blur(3px)", animation: "lgpIn .22s ease both"}}>
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

                <button onClick={modalElegir} style={{marginTop: "20px", padding: "12px 18px", background: "#F2004B", border: "0", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Construir en este lote →</button>
              
    </Fragment>
    ) : null}
            </div>
          </div>
          <button onClick={cerrarModal} style={{padding: "10px 16px", background: "#1C1E1F", border: "0", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer"}}>Cerrar ✕</button>
        </div>
      
    </Fragment>
    ) : null}

    </div>
  );
}
