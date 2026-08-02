# La Gran Piedra

Sitio de La Gran Piedra (casas custom, Rio Grande Valley) construido con Next.js (App Router) + TypeScript + Tailwind.

Incluye:

- Hero con video de fondo en loop con crossfade (`components/HeroLoopVideo.tsx`).
- Mapa interactivo de lotes de la subdivisión Piedra Norte.
- Configurador de casa en 7 pasos: lote, floorplan, fachada, brief, interior + módulos (con vista previa tipo moodboard), datos de contacto, resumen.
- FAQ, sección "por qué nosotros" y contacto.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Sugerencias por IA (paso 5 del configurador)

El paso 5 (Interior y módulos) intenta llamar a `/api/ai-suggest`, que usa la API de Anthropic si defines `ANTHROPIC_API_KEY` (ver `.env.example`). Si no está configurada, o la llamada falla, la app usa automáticamente un filtro local por metraje disponible — la funcionalidad nunca se rompe, solo pierde el matiz de la IA.

## Estructura

- `app/page.tsx` — página principal, renderiza `HomeConfigurator`.
- `components/HomeConfigurator.tsx` — toda la lógica e interfaz del sitio (portado del prototipo original).
- `components/HeroLoopVideo.tsx` — video de fondo del hero con loop por crossfade entre dos elementos `<video>`.
- `components/MoodboardPreview.tsx` — vista previa a pantalla completa con el floorplan, collage de zonas elegidas y gama cromática.
- `components/FloorplanDiagram.tsx` — diagrama SVG de floorplan reutilizable (A/B/C).
- `components/ConfigIcons.tsx` — iconografía de módulos y fachadas.
- `lib/data.ts` — datos del catálogo (lotes, floorplans, fachadas, interiores, módulos, FAQ, pasos del wizard).
- `app/api/ai-suggest/route.ts` — endpoint de sugerencias por IA.

## Deploy en Vercel

Conecta este repositorio en [vercel.com/new](https://vercel.com/new). No requiere variables de entorno para funcionar; agrega `ANTHROPIC_API_KEY` en Project Settings → Environment Variables si quieres sugerencias reales por IA.
