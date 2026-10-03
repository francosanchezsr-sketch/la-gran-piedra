import { NextResponse } from 'next/server';
import { citaAsunto, citaHtml, citaTexto, type Cita } from '@/lib/cita';

// Manda al buzón de La Gran Piedra la petición de "Agendar mi cita" de la
// sección Contacto: los datos del cliente y que quiere una cita. Mismo buzón,
// misma llave y mismo remitente que `enviar-resumen` — solo cambia el correo,
// que aquí es corto porque el cliente todavía no ha diseñado nada.
const CORREO_ARQUITECTOS_DEFAULT = 'contact@lagranpiedrallc.com';

// Sin RESEND_API_KEY y LGP_CORREO_REMITENTE responde 501 y el formulario lo
// dice en pantalla: nunca se le confirma al cliente una cita que no salió.

function fechaAhora(): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Chicago',
  }).format(new Date());
}

// Vista previa con datos de muestra, para revisar el correo sin mandarlo. Solo
// en desarrollo: en producción este endpoint únicamente recibe POST.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'no disponible' }, { status: 404 });
  }
  const muestra: Cita = { nombre: 'María Elena Cavazos', correo: 'maria@correo.com', tel: '(956) 000 0000' };
  return new Response(citaHtml(muestra, fechaAhora()), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// Tope de largo por campo: un formulario público no debe poder colarle al
// buzón un texto de megas.
const LARGO_MAX = 200;
const limpio = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, LARGO_MAX) : '');

export async function POST(request: Request) {
  let cuerpo: Partial<Record<keyof Cita, unknown>>;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 });
  }

  const cita: Cita = { nombre: limpio(cuerpo?.nombre), correo: limpio(cuerpo?.correo), tel: limpio(cuerpo?.tel) };
  if (!cita.nombre) {
    return NextResponse.json({ error: 'falta el nombre' }, { status: 400 });
  }
  if (!cita.correo && !cita.tel) {
    return NextResponse.json({ error: 'falta correo o teléfono' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const destino = process.env.LGP_CORREO_ARQUITECTOS || CORREO_ARQUITECTOS_DEFAULT;
  // El remitente tiene que ser de un dominio verificado en Resend.
  const remitente = process.env.LGP_CORREO_REMITENTE;
  if (!apiKey || !remitente) {
    return NextResponse.json({ error: 'correo no configurado' }, { status: 501 });
  }

  const fecha = fechaAhora();
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: remitente,
        to: destino.split(',').map((d) => d.trim()).filter(Boolean),
        // Responder al correo le escribe directo al cliente.
        reply_to: cita.correo || undefined,
        subject: citaAsunto(cita),
        html: citaHtml(cita, fecha),
        text: citaTexto(cita, fecha),
      }),
    });
    if (!res.ok) {
      console.error('resend error', res.status, await res.text());
      throw new Error('resend error ' + res.status);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('agendar-cita falló', err);
    return NextResponse.json({ error: 'no se pudo enviar' }, { status: 502 });
  }
}
