import { NextResponse } from "next/server";

// Factor de ocupación habitable. Sale del único dato real que tenemos: el set
// del Lote 17 permite 1,635 ft² habitables en un lote de 33'x100' = 3,300 ft²
// de terreno, o sea 49.5%. Se redondea a 50% y se usa como estimado para los
// lotes que el usuario sube. No es un número de reglamento: es una proyección
// del producto de La Gran Piedra sobre un terreno de otras dimensiones.
const FACTOR_HABITABLE = 0.5;

// Topes de cordura: si la lectura del plano se va muy arriba o muy abajo, es
// más probable que el modelo haya leído mal una cota a que el lote sea así.
const AREA_MIN = 1200;
const AREA_MAX = 40000;

type Lectura = {
  frente_ft: number | null;
  fondo_ft: number | null;
  area_ft2: number | null;
  confianza: "alta" | "media" | "baja";
  nota: string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const { dataUrl, mime, nombre } = body as { dataUrl: string; mime: string; nombre: string };

  if (!dataUrl || !mime) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 501 });
  }

  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const esPdf = mime === "application/pdf";

  const bloque = esPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image", source: { type: "base64", media_type: mime, data: base64 } };

  const prompt = `Eres un asistente que lee planos y documentos de lotes para una constructora en el Rio Grande Valley, Texas.

Del documento adjunto extrae ÚNICAMENTE las dimensiones del lote (no de la casa):
- frente_ft: el ancho del lote en pies
- fondo_ft: la profundidad del lote en pies
- area_ft2: el área del lote en pies cuadrados

Reglas:
- Si el documento indica el área directamente, úsala. Si no, calcula frente x fondo.
- Si el lote es irregular, usa las dimensiones dominantes y dilo en la nota.
- Si una cota está en metros, conviértela a pies (1 m = 3.28084 ft) y dilo en la nota.
- Si no puedes leer una dimensión con seguridad, pon null. NO inventes números.
- confianza: "alta" si las cotas se leen claras, "media" si tuviste que inferir, "baja" si el documento es ambiguo o no parece un plano de lote.
- nota: una frase corta en español explicando de dónde sacaste las medidas.

Responde SOLO con JSON válido:
{"frente_ft":<número|null>,"fondo_ft":<número|null>,"area_ft2":<número|null>,"confianza":"alta|media|baja","nota":"<texto>"}`;

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
        max_tokens: 700,
        messages: [{ role: "user", content: [bloque, { type: "text", text: prompt }] }],
      }),
    });
    if (!res.ok) throw new Error("anthropic api error");

    const data = await res.json();
    const raw = data.content?.[0]?.text ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    const lectura = JSON.parse(match ? match[0] : raw) as Lectura;

    // El área puede venir directa o derivarse de frente x fondo.
    let area = lectura.area_ft2;
    if (!area && lectura.frente_ft && lectura.fondo_ft) {
      area = lectura.frente_ft * lectura.fondo_ft;
    }

    if (!area || area < AREA_MIN || area > AREA_MAX) {
      return NextResponse.json(
        {
          error: "sin_medidas",
          detalle:
            area && (area < AREA_MIN || area > AREA_MAX)
              ? `El área leída (${Math.round(area)} ft²) está fuera del rango razonable para un lote residencial.`
              : "No se pudieron leer las dimensiones del lote en este documento.",
          lectura,
        },
        { status: 422 },
      );
    }

    const maxLiving = Math.round((area * FACTOR_HABITABLE) / 5) * 5;

    return NextResponse.json({
      frente: lectura.frente_ft,
      fondo: lectura.fondo_ft,
      areaLote: Math.round(area),
      maxLiving,
      factor: FACTOR_HABITABLE,
      confianza: lectura.confianza ?? "media",
      nota: lectura.nota ?? "",
      fuente: nombre ?? "documento del usuario",
    });
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}
