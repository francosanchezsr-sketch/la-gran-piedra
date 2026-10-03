// El correo de "Agendar mi cita" (sección Contacto). Es otra cosa que la ficha
// del configurador (`lib/ficha.ts`): quien llena este formulario casi nunca ha
// diseñado nada todavía — llega desde el hero o desde el botón "Agenda una
// cita" del header —, así que mandarle al equipo una ficha con lote y plano en
// blanco solo hacía ruido. Aquí va lo que hay: quién es, cómo localizarlo y
// que quiere una cita.

export type Cita = {
  nombre: string;
  correo: string;
  tel: string;
};

// Mismos tonos que la ficha, para que los dos correos se lean de la misma casa.
const TINTA = '#1C1E1F';
const GRIS = '#8A8F91';
const LINEA = '#EAE7E3';
const FONDO = '#FBFBFA';
const MARCA = '#F2004B';

export const MENSAJE_CITA = 'Me gustaría agendar una cita con ustedes.';

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fila(k: string, v: string): string {
  return `<tr>
    <td style="padding:11px 0;border-bottom:1px solid ${LINEA};width:110px;vertical-align:top;font:700 10px/1.5 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:${GRIS}">${k}</td>
    <td style="padding:11px 0;border-bottom:1px solid ${LINEA};font:400 15px/1.5 Arial,sans-serif;color:${TINTA}">${v}</td>
  </tr>`;
}

export function citaAsunto(c: Cita): string {
  return `Solicitud de cita · ${c.nombre.trim()}`;
}

export function citaHtml(c: Cita, fechaTexto: string): string {
  const nombre = esc(c.nombre.trim());
  const correo = c.correo.trim();
  const tel = c.tel.trim();
  // El teléfono enlaza con `tel:` usando solo dígitos y `+`: así se marca con un
  // toque desde el celular, sin importar cómo lo escribió el cliente.
  const telHref = tel.replace(/[^\d+]/g, '');
  const contacto = [
    fila('Nombre', nombre),
    correo ? fila('Correo', `<a href="mailto:${esc(correo)}" style="color:${MARCA};text-decoration:none">${esc(correo)}</a>`) : '',
    tel ? fila('Teléfono', telHref ? `<a href="tel:${esc(telHref)}" style="color:${TINTA};text-decoration:none">${esc(tel)}</a>` : esc(tel)) : '',
  ].join('');

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Solicitud de cita · ${nombre}</title></head>
<body style="margin:0;padding:22px 12px;background:#F1EFEC">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:560px;background:#fff;border:1px solid ${LINEA}">

  <tr><td style="padding:28px 30px 22px;background:${TINTA}">
    <p style="margin:0 0 8px;font:700 10px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${MARCA}">La Gran Piedra · solicitud de cita</p>
    <p style="margin:0 0 6px;font:700 24px/1.25 Arial,sans-serif;color:#fff">${nombre}</p>
    <p style="margin:0;font:400 13px/1.5 Arial,sans-serif;color:#9A9FA1">${esc(fechaTexto)}</p>
  </td></tr>

  <tr><td style="padding:26px 30px 6px">
    <p style="margin:0;padding:16px 18px;background:${FONDO};border-left:3px solid ${MARCA};font:400 16px/1.6 Arial,sans-serif;color:${TINTA}">${esc(MENSAJE_CITA)}</p>
  </td></tr>

  <tr><td style="padding:22px 30px 28px">
    <p style="margin:0 0 6px;font:700 10px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${GRIS}">Datos de contacto</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${contacto}</table>
  </td></tr>

  <tr><td style="padding:18px 30px 22px;border-top:1px solid ${LINEA};background:${FONDO}">
    <p style="margin:0;font:400 11px/1.6 Arial,sans-serif;color:${GRIS}">
      Enviado desde el formulario de contacto del sitio.${correo ? ' Responder a este correo le escribe directo al cliente.' : ''}
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

export function citaTexto(c: Cita, fechaTexto: string): string {
  const lineas = [
    `SOLICITUD DE CITA — ${c.nombre.trim()}`,
    fechaTexto,
    '',
    MENSAJE_CITA,
    '',
    'DATOS DE CONTACTO',
    `Nombre: ${c.nombre.trim()}`,
  ];
  if (c.correo.trim()) lineas.push(`Correo: ${c.correo.trim()}`);
  if (c.tel.trim()) lineas.push(`Teléfono: ${c.tel.trim()}`);
  lineas.push('', 'Enviado desde el formulario de contacto del sitio.');
  return lineas.join('\n');
}
