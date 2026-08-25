import { NextResponse } from "next/server";

type AristaEntrada = {
  idx: number;
  tipo: "frente" | "trasero" | "lado";
  desde: { x: number; y: number };
  hasta: { x: number; y: number };
};

type LecturaArista = {
  idx: number;
  ft: number | null;
  confianza: "alta" | "media" | "baja";
  nota: string;
};

function aristasValidas(v: unknown): v is AristaEntrada[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every(
    (a) =>
      a &&
      typeof a.idx === "number" &&
      (a.tipo === "frente" || a.tipo === "trasero" || a.tipo === "lado") &&
      a.desde &&
      a.hasta &&
      typeof a.desde.x === "number" &&
      typeof a.desde.y === "number" &&
      typeof a.hasta.x === "number" &&
      typeof a.hasta.y === "number",
  );
}

export async function POST(request: Request) {
  const body = await request.json();
  const { dataUrl, mime, aristas } = body as {
    dataUrl?: string;
    mime?: string;
    aristas?: AristaEntrada[];
  };

  if (!dataUrl || !mime || !aristasValidas(aristas)) {
    return NextResponse.json({ error: "Falta la foto o la lista de aristas" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 501 });
  }

  const listaAristas = aristas
    .map(
      (a) =>
        `- arista ${a.idx} (${a.tipo}): de (${a.desde.x.toFixed(3)}, ${a.desde.y.toFixed(3)}) a (${a.hasta.x.toFixed(3)}, ${a.hasta.y.toFixed(3)})`,
    )
    .join("\n");

  const prompt = `Eres un asistente que lee medidas escritas a mano sobre una foto de un lote, para una constructora en el Rio Grande Valley, Texas.

El cliente trazó el contorno de su lote sobre la foto. Aquí está cada arista (segmento) que trazó, como fracción de la foto: x=0 es el borde izquierdo y x=1 el derecho; y=0 es arriba y y=1 abajo.

Aristas trazadas:
${listaAristas}

Para cada arista, busca en la foto si el cliente escribió a mano, cerca de ese segmento, un número que sea la medida real de esa arista — sobre la línea, junto a ella, o con una flecha apuntando hacia ese lado del lote.

Reglas:
- Si encuentras un número claramente asociado a esa arista, repórtalo en pies (ft). Si está en metros, conviértelo (1 m = 3.28084 ft) y dilo en la nota.
- Si no hay ningún número escrito cerca de esa arista, o no puedes asociarlo con confianza a ESA arista en particular (por ejemplo, varios números sueltos sin que quede claro cuál es de cuál), pon ft en null. NUNCA inventes ni adivines una medida.
- confianza: "alta" si el número está claramente pegado a esa arista; "media" si lo infieres por cercanía o posición; "baja" si es una suposición débil.
- nota: una frase muy corta en español explicando de dónde salió el número (o por qué quedó en null).
- Responde para TODAS las aristas de la lista, una entrada por cada una, en el mismo orden.

Responde SOLO con JSON válido, en este formato exacto:
{"lecturas":[{"idx":<número>,"ft":<número|null>,"confianza":"alta|media|baja","nota":"<texto>"}]}`;

  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const maxTokens = Math.min(1800, 400 + aristas.length * 130);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mime, data: base64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error("anthropic api error");

    const data = await res.json();
    const raw = data.content?.[0]?.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw) as { lecturas?: LecturaArista[] };
    const lecturasPorIdx = new Map(
      (Array.isArray(parsed.lecturas) ? parsed.lecturas : []).map((l) => [l.idx, l]),
    );

    // Siempre se devuelve una entrada por cada arista pedida, en el mismo
    // orden — si el modelo se saltó alguna, queda como "no leída" en vez de
    // faltar del array (el front precarga por índice, no puede tener huecos).
    const lecturas: LecturaArista[] = aristas.map((a) => {
      const l = lecturasPorIdx.get(a.idx);
      return {
        idx: a.idx,
        ft: typeof l?.ft === "number" && l.ft > 0 ? l.ft : null,
        confianza: l?.confianza ?? "baja",
        nota: l?.nota ?? "No se encontró un número escrito cerca de esta arista.",
      };
    });

    return NextResponse.json({ lecturas });
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
