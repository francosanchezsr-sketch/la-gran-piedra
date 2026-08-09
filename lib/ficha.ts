// Ficha del arquitecto: el resumen completo de una configuración, en el formato
// que se manda por correo. No se publica en el sitio — el cliente ve el resumen
// corto del paso 7 y la ficha larga llega al buzón de La Gran Piedra, que es
// donde la interpretan los arquitectos.
//
// El HTML es a propósito viejo: tablas, anchos en px y estilos en línea. Gmail
// y Outlook tiran el <svg>, el <style> de la cabecera y buena parte de flex, así
// que los diagramas se dibujan con celdas de color.

export type FichaZona = {
  nombre: string;
  rango: string;
  ft2: number;
  exterior: boolean;
  incluida: boolean;
};

export type Ficha = {
  cliente: { nombre: string; correo: string; tel: string };
  lote: {
    id: string;
    origen: 'catalogo' | 'usuario';
    medida: string;
    maxft: number;
    orientacion: string;
    tipo: string;
    retiros: { frente: number; fondo: number; lados: number } | null;
    huella: number | null;
    adjunto: string | null;
    ubicacion: string | null;
  };
  plan: { nombre: string; pisos: number; livingBase: number; livingElegido: number };
  cuartos: { recamaras: number; banos: number; recBase: number; banosBase: number };
  fachada: string;
  interior: { nombre: string; colores: string[] };
  zonas: FichaZona[];
  tragaluces: string[];
  presupuesto: { maxLiving: number; plan: number; cuartos: number; zonas: number; libre: number };
  garage: string;
  totales: { living: number; construido: number };
  brief: string;
};

const TINTA = '#1C1E1F';
const GRIS = '#8A8F91';
const LINEA = '#EAE7E3';
const FONDO = '#FBFBFA';
const MARCA = '#F2004B';

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function num(n: number): string {
  return n.toLocaleString('en-US');
}

/** Un color de la paleta solo se pinta si es un hex — nunca CSS arbitrario. */
function hex(c: string): string {
  return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#CCCCCC';
}

function rotulo(texto: string): string {
  return `<p style="margin:0 0 10px;font:700 10px/1 Arial,sans-serif;letter-spacing:1.6px;text-transform:uppercase;color:${GRIS}">${esc(texto)}</p>`;
}

function fila(k: string, v: string): string {
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid #F4F1ED;font:400 11px/1.4 Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;color:${GRIS};white-space:nowrap;vertical-align:top">${esc(k)}</td>
    <td style="padding:9px 0 9px 18px;border-bottom:1px solid #F4F1ED;font:400 14px/1.5 Arial,sans-serif;color:${TINTA};text-align:right">${v}</td>
  </tr>`;
}

/** Barra apilada del presupuesto habitable, en celdas de tabla con ancho en %. */
function barraPresupuesto(p: Ficha['presupuesto']): string {
  const tope = Math.max(1, p.maxLiving);
  // Quitar un cuarto devuelve superficie, así que `cuartos` puede ser negativo.
  // En ese caso el plano ocupa menos y el segmento se descuenta de ahí; si se
  // pintara como barra propia, los tramos sumarían más del 100% del tope.
  const devuelto = Math.max(0, -p.cuartos);
  const seg = [
    { label: devuelto ? `Floorplan (${num(devuelto)} ft² devueltos)` : 'Floorplan', ft2: p.plan - devuelto, color: TINTA },
    { label: 'Cuartos extra', ft2: Math.max(0, p.cuartos), color: GRIS },
    { label: 'Zonas', ft2: p.zonas, color: MARCA },
    { label: 'Libre', ft2: p.libre, color: '#EFECE8' },
  ].filter((s) => s.ft2 > 0);

  const celdas = seg
    .map(
      (s) =>
        `<td width="${Math.max(1, Math.round((s.ft2 / tope) * 100))}%" height="26" style="background:${s.color};font-size:0;line-height:0">&nbsp;</td>`,
    )
    .join('');

  const leyenda = seg
    .map(
      (s) =>
        `<span style="display:inline-block;margin:0 16px 6px 0;font:400 11px/1.4 Arial,sans-serif;color:${TINTA}">
          <span style="display:inline-block;width:9px;height:9px;background:${s.color};border:1px solid ${LINEA}">&nbsp;</span>
          ${esc(s.label)} · ${num(s.ft2)} ft²
        </span>`,
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border:1px solid ${LINEA}">
      <tr>${celdas}</tr>
    </table>
    <p style="margin:10px 0 0">${leyenda}</p>
    <p style="margin:6px 0 0;font:400 11px/1.5 Arial,sans-serif;color:${GRIS}">
      Tope habitable del lote: ${num(p.maxLiving)} ft². Solo cuenta área habitable —
      garage, pórtico, patio y balcón van aparte.
    </p>`;
}

/**
 * Lote y huella construible: el rectángulo exterior es el lote y el interior lo
 * que queda después de los retiros. Es un croquis a escala aproximada, no un
 * plano: sirve para leer de un vistazo cuánto terreno queda libre alrededor.
 */
function croquisLote(l: Ficha['lote']): string {
  if (!l.retiros) return '';
  const r = l.retiros;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:${FONDO};border:1px solid ${LINEA}">
      <tr>
        <td colspan="3" align="center" style="padding:8px 0 4px;font:400 10px/1.2 Arial,sans-serif;letter-spacing:1.2px;color:${GRIS};text-transform:uppercase">Frente · retiro ${r.frente} ft</td>
      </tr>
      <tr>
        <td width="14%" align="center" style="font:400 10px/1.2 Arial,sans-serif;color:${GRIS}">${r.lados} ft</td>
        <td style="padding:6px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
            <tr>
              <td height="86" align="center" valign="middle" style="background:#fff;border:2px solid ${MARCA};font:700 12px/1.5 Arial,sans-serif;color:${TINTA}">
                Huella construible${l.huella ? `<br><span style="font-weight:400;color:${GRIS}">${num(l.huella)} ft² por planta</span>` : ''}
              </td>
            </tr>
          </table>
        </td>
        <td width="14%" align="center" style="font:400 10px/1.2 Arial,sans-serif;color:${GRIS}">${r.lados} ft</td>
      </tr>
      <tr>
        <td colspan="3" align="center" style="padding:4px 0 8px;font:400 10px/1.2 Arial,sans-serif;letter-spacing:1.2px;color:${GRIS};text-transform:uppercase">Fondo · retiro ${r.fondo} ft</td>
      </tr>
    </table>
    <p style="margin:8px 0 0;font:400 11px/1.5 Arial,sans-serif;color:${GRIS}">
      Croquis esquemático. Los retiros son los que el cliente dejó en el
      configurador y están por verificar contra el reglamento de la subdivisión.
    </p>`;
}

function paleta(i: Ficha['interior']): string {
  const celdas = i.colores
    .map(
      (c) =>
        `<td width="33%" style="padding:0">
          <div style="height:54px;background:${hex(c)};border:1px solid ${LINEA}">&nbsp;</div>
          <p style="margin:5px 0 0;font:400 11px/1.2 Arial,sans-serif;color:${GRIS};text-align:center">${esc(c.toUpperCase())}</p>
        </td>`,
    )
    .join('<td width="8">&nbsp;</td>');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
      <tr>${celdas}</tr>
    </table>
    <p style="margin:10px 0 0;font:400 13px/1.5 Arial,sans-serif;color:${TINTA}">${esc(i.nombre)} · base, secundario y acento</p>`;
}

function tablaZonas(zonas: FichaZona[], tragaluces: string[]): string {
  if (!zonas.length) return `<p style="margin:0;font:400 13px/1.5 Arial,sans-serif;color:${GRIS}">Sin zonas adicionales.</p>`;
  const filas = zonas
    .map(
      (z) => `<tr>
        <td style="padding:9px 0;border-bottom:1px solid #F4F1ED;font:700 13px/1.4 Arial,sans-serif;color:${TINTA}">
          ${esc(z.nombre)}${z.incluida ? ` <span style="font:400 10px/1 Arial,sans-serif;letter-spacing:1px;color:${GRIS}">INCLUIDA EN EL PLANO</span>` : ''}
        </td>
        <td style="padding:9px 0;border-bottom:1px solid #F4F1ED;font:400 11px/1.4 Arial,sans-serif;color:${GRIS};text-align:center">${esc(z.rango)}</td>
        <td style="padding:9px 0;border-bottom:1px solid #F4F1ED;font:400 12px/1.4 Arial,sans-serif;color:${TINTA};text-align:right;white-space:nowrap">
          ${z.exterior ? 'exterior' : `${num(z.ft2)} ft²`}
        </td>
      </tr>`,
    )
    .join('');

  const nota = tragaluces.length
    ? `<p style="margin:12px 0 0;font:400 12px/1.5 Arial,sans-serif;color:${TINTA}">Tragaluz solicitado en: ${esc(tragaluces.join(', '))}.</p>`
    : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${filas}</table>
    ${nota}`;
}

function bloque(titulo: string, cuerpo: string): string {
  return `<tr><td style="padding:26px 30px;border-top:1px solid ${LINEA}">${rotulo(titulo)}${cuerpo}</td></tr>`;
}

export function fichaHtml(f: Ficha, fechaTexto: string): string {
  const l = f.lote;
  const datos = [
    fila('Lote', `${esc(l.id)} · ${esc(l.medida)}`),
    fila('Origen', l.origen === 'usuario' ? 'Lote del cliente' : 'Enclave on 107'),
    fila('Orientación', esc(l.orientacion)),
    fila('Floorplan', `${esc(f.plan.nombre)} · ${f.plan.pisos === 2 ? '2 plantas' : '1 planta'}`),
    fila('Recámaras', `${f.cuartos.recamaras} <span style="color:${GRIS}">(el plano trae ${f.cuartos.recBase})</span>`),
    fila('Baños', `${f.cuartos.banos} <span style="color:${GRIS}">(el plano trae ${f.cuartos.banosBase})</span>`),
    fila('Fachada', esc(f.fachada)),
    fila('Garage', esc(f.garage)),
    fila('Área habitable', `<strong>${num(f.totales.living)} ft²</strong>`),
    fila('Área construida', `${num(f.totales.construido)} ft²`),
    l.ubicacion ? fila('Ubicación', esc(l.ubicacion)) : '',
    l.adjunto ? fila('Plano adjunto', esc(l.adjunto)) : '',
  ].join('');

  const contacto = [
    fila('Nombre', esc(f.cliente.nombre)),
    f.cliente.correo ? fila('Correo', `<a href="mailto:${esc(f.cliente.correo)}" style="color:${MARCA};text-decoration:none">${esc(f.cliente.correo)}</a>`) : '',
    f.cliente.tel ? fila('Teléfono', esc(f.cliente.tel)) : '',
  ].join('');

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Configuración de ${esc(f.cliente.nombre)}</title></head>
<body style="margin:0;padding:22px 12px;background:#F1EFEC">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:600px;max-width:100%;background:#fff;border:1px solid ${LINEA}">

  <tr><td style="padding:30px 30px 24px;background:${TINTA}">
    <p style="margin:0 0 8px;font:700 10px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${MARCA}">La Gran Piedra · configuración recibida</p>
    <p style="margin:0 0 6px;font:700 25px/1.25 Arial,sans-serif;color:#fff">${esc(f.cliente.nombre)}</p>
    <p style="margin:0;font:400 13px/1.5 Arial,sans-serif;color:#B7BABB">${esc(fechaTexto)} · ${esc(l.id)} · ${esc(f.plan.nombre)}</p>
  </td></tr>

  ${bloque('Presupuesto habitable', barraPresupuesto(f.presupuesto))}
  ${bloque('La casa', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${datos}</table>`)}
  ${croquisLote(l) ? bloque('Lote y huella', croquisLote(l)) : ''}
  ${bloque('Zonas', tablaZonas(f.zonas, f.tragaluces))}
  ${bloque('Paleta interior', paleta(f.interior))}
  ${
    f.brief.trim()
      ? bloque(
          'Lo que pidió el cliente, en sus palabras',
          `<p style="margin:0;padding:16px 18px;background:${FONDO};border-left:3px solid ${MARCA};font:400 14px/1.7 Arial,sans-serif;color:${TINTA};white-space:pre-wrap">${esc(f.brief.trim())}</p>`,
        )
      : ''
  }
  ${bloque('Contacto', `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">${contacto}</table>`)}

  <tr><td style="padding:20px 30px 26px;border-top:1px solid ${LINEA};background:${FONDO}">
    <p style="margin:0;font:400 11px/1.6 Arial,sans-serif;color:${GRIS}">
      Ficha generada por el configurador del sitio. Las medidas de zonas son
      rangos de referencia del catálogo; el dimensionamiento final lo define el
      arquitecto contra el reglamento de la subdivisión.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

/** Versión de texto plano, para clientes de correo que no pintan HTML. */
export function fichaTexto(f: Ficha, fechaTexto: string): string {
  const lineas = [
    `LA GRAN PIEDRA — configuración recibida`,
    `${f.cliente.nombre} · ${fechaTexto}`,
    ``,
    `Lote: ${f.lote.id} · ${f.lote.medida} (${f.lote.origen === 'usuario' ? 'lote del cliente' : 'Enclave on 107'})`,
    `Floorplan: ${f.plan.nombre} · ${f.plan.pisos === 2 ? '2 plantas' : '1 planta'}`,
    `Recámaras: ${f.cuartos.recamaras} (plano: ${f.cuartos.recBase}) · Baños: ${f.cuartos.banos} (plano: ${f.cuartos.banosBase})`,
    `Fachada: ${f.fachada} · Interior: ${f.interior.nombre}`,
    `Garage: ${f.garage}`,
    `Habitable: ${num(f.totales.living)} ft² · Construido: ${num(f.totales.construido)} ft²`,
    `Presupuesto: tope ${num(f.presupuesto.maxLiving)} ft² · libre ${num(f.presupuesto.libre)} ft²`,
    ``,
    `Zonas: ${f.zonas.length ? f.zonas.map((z) => `${z.nombre} (${z.exterior ? 'exterior' : num(z.ft2) + ' ft²'})`).join(', ') : 'ninguna'}`,
    f.tragaluces.length ? `Tragaluces: ${f.tragaluces.join(', ')}` : '',
    ``,
    f.brief.trim() ? `Brief del cliente:\n${f.brief.trim()}` : '',
    ``,
    `Contacto: ${[f.cliente.correo, f.cliente.tel].filter(Boolean).join(' · ')}`,
  ];
  return lineas.filter((x) => x !== null).join('\n');
}
