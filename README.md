# La Gran Piedra

Sitio de La Gran Piedra (casas custom, Rio Grande Valley) construido con Next.js (App Router) + TypeScript + Tailwind.

Incluye:

- Hero con video de fondo (`components/VideoHero.tsx`).
- Mapa interactivo de lotes de la subdivisión Piedra Norte.
- Configurador de casa en 8 pasos (lote, floorplan, fachada, interiores, brief, sugerencias por IA, datos de contacto, resumen).
- FAQ, sección "por qué nosotros" y contacto.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Sugerencias por IA (paso 6 del configurador)

El paso 6 intenta llamar a `/api/ai-suggest`, que usa la API de Anthropic si defines `ANTHROPIC_API_KEY` (ver `.env.example`). Si no está configurada, o la llamada falla, la app usa automáticamente un filtro local por metraje disponible — la funcionalidad nunca se rompe, solo pierde el matiz de la IA.

## Estructura

- `app/page.tsx` — página principal, renderiza `HomeConfigurator`.
- `components/HomeConfigurator.tsx` — toda la lógica e interfaz del sitio (portado del prototipo original).
- `components/VideoHero.tsx` — video de fondo del hero.
- `lib/data.ts` — datos del catálogo (lotes, floorplans, fachadas, interiores, módulos, FAQ).
- `app/api/ai-suggest/route.ts` — endpoint de sugerencias por IA.

## Deploy en Vercel

Conecta este repositorio en [vercel.com/new](https://vercel.com/new). No requiere variables de entorno para funcionar; agrega `ANTHROPIC_API_KEY` en Project Settings → Environment Variables si quieres sugerencias reales por IA.
