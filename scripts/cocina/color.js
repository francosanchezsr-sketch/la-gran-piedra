// sRGB ↔ OKLab. Se trabaja en OKLab y no en HSL porque aquí lo único que hay
// que mover es la luz sin que el tono derive: bajarle luminancia a un nogal en
// HSL lo manda al morado, y el sprite es todo sombra y luz.

function srgbALineal(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function linealASrgb(c) {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

function hexARgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbAOklab(r, g, b) {
  const R = srgbALineal(r), G = srgbALineal(g), B = srgbALineal(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

function oklabARgb(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    linealASrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linealASrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linealASrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}

const hexAOklab = (hex) => rgbAOklab(...hexARgb(hex));

module.exports = { hexARgb, rgbAOklab, oklabARgb, hexAOklab };
