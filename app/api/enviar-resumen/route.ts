import { NextResponse } from 'next/server';
import { fichaHtml, fichaTexto, type Ficha } from '@/lib/ficha';

// Manda la ficha completa al buzón de La Gran Piedra. El cliente no recibe copia
// a propósito: la ficha larga es la herramienta de trabajo del arquitecto, no un
// entregable del sitio.
//
// El destino real de la empresa. No es secreto — a diferencia de la llave de
// Resend, un correo de contacto puede vivir en el código — así que sirve de
// default y LGP_CORREO_ARQUITECTOS solo hace falta para cambiarlo o para
// agregar más destinatarios.
const CORREO_ARQUITECTOS_DEFAULT = 'contact@lagranpiedrallc.com';

// Sin RESEND_API_KEY y LGP_CORREO_REMITENTE el endpoint responde 501 y el
// configurador lo dice en pantalla — nunca se le confirma un envío al cliente
// que en realidad no salió.

// Vista previa de la ficha con datos de muestra, para poder iterar el correo sin
// mandarlo. Solo en desarrollo: en producción este endpoint únicamente recibe
// POST.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'no disponible' }, { status: 404 });
  }
  const muestra: Ficha = {
    cliente: { nombre: 'María Elena Cavazos', correo: 'maria@correo.com', tel: '(956) 000 0000' },
    lote: {
      id: 'L-117', origen: 'catalogo', medida: '33 × 68 ft · 2,249 ft²', maxft: 2249,
      orientacion: 'Sur', tipo: 'townhouse',
      retiros: { frente: 25, fondo: 20, lados: 6 }, huella: 1125,
      adjunto: null, ubicacion: null,
    },
    plan: { nombre: 'Townhouse 2 pisos', pisos: 2, livingBase: 1635, livingElegido: 1635 },
    cuartos: { recamaras: 2, banos: 3, recBase: 3, banosBase: 3 },
    fachada: 'Escandinavo',
    interior: { nombre: 'Piedra cálida', colores: ['#E8E1D6', '#B8A894', '#3A3733'] },
    zonas: [
      { nombre: 'Cocina concepto abierto', rango: 'sin muros extra', ft2: 0, exterior: false, incluida: true },
      { nombre: 'Master con balcón', rango: "balcón real 4'3×8'8", ft2: 224, exterior: false, incluida: true },
      { nombre: 'Walking pantry', rango: '8×10 – 10×12', ft2: 80, exterior: false, incluida: false },
      { nombre: 'Zona BBQ compacta', rango: '8×8 – 10×10', ft2: 64, exterior: true, incluida: false },
    ],
    tragaluces: ['Walking pantry'],
    presupuesto: { maxLiving: 1635, plan: 1635, cuartos: -105, zonas: 80, libre: 25 },
    garage: '2 autos · 473 ft² (del plano aprobado)',
    totales: { living: 1610, construido: 2288 },
    brief: 'Queremos que la cocina quede viendo al patio y usar el comodín como gym.\nSomos cuatro y trabajamos desde casa.',
  };
  const fecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Chicago' }).format(new Date());
  return new Response(fichaHtml(muestra, fecha), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export async function POST(request: Request) {
  let ficha: Ficha;
  try {
    ficha = (await request.json()) as Ficha;
  } catch {
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 });
  }

  if (!ficha?.cliente?.nombre?.trim()) {
    return NextResponse.json({ error: 'falta el nombre del cliente' }, { status: 400 });
  }
  if (!ficha.cliente.correo?.trim() && !ficha.cliente.tel?.trim()) {
    return NextResponse.json({ error: 'falta correo o teléfono del cliente' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.LGP_CORREO_ARQUITECTOS || CORREO_ARQUITECTOS_DEFAULT;
  // El remitente tiene que ser de un dominio verificado en Resend.
  const remitente = process.env.LGP_CORREO_REMITENTE;
  if (!apiKey || !remitente) {
    return NextResponse.json({ error: 'correo no configurado' }, { status: 501 });
  }

  const fecha = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Chicago',
  }).format(new Date());

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: remitente,
        to: destino.split(',').map((d) => d.trim()).filter(Boolean),
        // Responder al correo cae directo con el cliente.
        reply_to: ficha.cliente.correo?.trim() || undefined,
        subject: `Configuración de ${ficha.cliente.nombre} · ${ficha.lote.id} · ${ficha.plan.nombre}`,
        html: fichaHtml(ficha, fecha),
        text: fichaTexto(ficha, fecha),
      }),
    });
    if (!res.ok) throw new Error('resend error ' + res.status);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'no se pudo enviar' }, { status: 502 });
  }
}
