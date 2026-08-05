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
    plan: { nombre: string; living: number } | null;
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
Floorplan elegido: ${plan ? plan.nombre + " (" + plan.living + " ft² habitables)" : "ninguno aún"}.
Pies cuadrados habitables libres: ${disponibles} ft².

Catálogo de módulos disponibles:
${catalogoTxt}

Tu trabajo tiene dos partes:

1) "lectura": una o dos frases en español, en segunda persona, que le confirmen al cliente QUÉ ENTENDISTE de su brief. Menciona lo concreto que pidió. Si algo de lo que pidió no existe en el catálogo, dilo con claridad en vez de callarlo (ejemplo: "la pérgola no está en el catálogo de zonas, la anoto para el arquitecto").

2) "zonas": entre 3 y 5 módulos del catálogo que respondan al brief, que sean compatibles con la orientación y que quepan en los ft² libres. No inventes módulos fuera del catálogo. No propongas ubicaciones ni planos.

3) "impacto": la suma en ft² de los mínimos de las zonas que propusiste, como número.

Responde SOLO con JSON válido:
{"lectura":"<texto>","zonas":[{"key":"<key del catálogo>","razon":"<una frase en español, máximo 18 palabras>"}],"impacto":<número>}`;

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
    const match = raw.match(/\{[\s\S]*\}/);
    const out = JSON.parse(match ? match[0] : raw) as {
      lectura?: string;
      zonas?: { key: string; razon: string }[];
      impacto?: number;
    };
    return NextResponse.json({
      lectura: out.lectura ?? "",
      zonas: Array.isArray(out.zonas) ? out.zonas : [],
      impacto: typeof out.impacto === "number" ? out.impacto : null,
    });
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
