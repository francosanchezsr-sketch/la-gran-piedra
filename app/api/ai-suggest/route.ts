import { NextResponse } from "next/server";

type Modulo = {
  key: string;
  nombre: string;
  min: number;
  nota: string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const { brief, lote, plan, disponibles, catalogo } = body as {
    brief: string;
    lote: { id: string; orient: string; frente: string; fondo: string; maxft: number };
    plan: { nombre: string; ft2: number } | null;
    disponibles: number;
    catalogo: Modulo[];
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 501 });
  }

  const catalogoTxt = catalogo
    .map((m) => `${m.key}: ${m.nombre} (mín ${m.min} ft²${m.nota ? "; " + m.nota : ""})`)
    .join("\n");

  const prompt = `Eres el asistente de diseño de La Gran Piedra, constructora de casas custom en el Rio Grande Valley, Texas.

Brief del cliente: "${brief || "sin brief; sugiere lo más habitual para una familia local"}"
Lote: ${lote.id}, fachada frontal orientada al ${lote.orient}, ${lote.frente} x ${lote.fondo}, máximo ${lote.maxft} ft².
Floorplan elegido: ${plan ? plan.nombre + " (" + plan.ft2 + " ft²)" : "ninguno aún"}.
Pies cuadrados libres dentro del límite del lote: ${disponibles} ft².

Catálogo de módulos disponibles:
${catalogoTxt}

Elige entre 3 y 5 módulos del catálogo que sean compatibles con la orientación y que quepan en los ft² libres. No inventes módulos fuera del catálogo. No propongas ubicaciones ni planos.
Responde SOLO con JSON válido: [{"key":"<key del catálogo>","razon":"<una frase en español, máximo 18 palabras, que conecte con lo que pidió el cliente>"}]`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 900,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error("anthropic api error");
    const data = await res.json();
    const raw = data.content?.[0]?.text ?? "";
    const match = raw.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : raw);
    return NextResponse.json(arr);
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
