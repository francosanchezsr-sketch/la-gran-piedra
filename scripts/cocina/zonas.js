// Qué es cada plano del sprite. Los ids salen de segmentar.js.
//
// Las regiones chicas (las celdas de la espiga del backsplash, los jaladeros,
// el detalle de la tarja) no se enumeran: caen por polígono o por vecindad.

// Zonas pintables. 'marco' y 'negro' no toman color de paleta.
const ZONAS = ['marco', 'muro', 'piso', 'cubierta', 'backsplash', 'gabinete', 'negro'];

const POR_ID = {
  marco: [1, 1726],
  muro: [33, 5072],
  piso: [5480],
  // Barra, isla, cantos y el costado de la isla que en la versión a color baja
  // como waterfall de piedra.
  // 2124/2290/2800 son el tramo del fondo de la barra: se ven oscuros porque
  // les cae encima la sombra de la lámpara, y por eso se colaron en gabinete.
  cubierta: [2724, 4322, 4177, 3638, 4646, 5621, 2124, 2290, 2800],
  gabinete: [
    // altos: puertas, costados y el módulo de repisas
    38, 610, 68, 2018, 1774, 1284, 836,
    256, 445, 370, 553, 203, 638, 810, 932, 1227,
    // bajos
    5075, 5140, 4611, 5553, 4078, 3853, 5229, 4357, 4474, 3484, 5337,
    // isla
    5721, 5411, 5023, 4901, 5920, 6029, 5583,
  ],
  negro: [3151, 2195, 3530, 3547, 4006, 2697],
};

// Áreas que se resuelven por geometría, no por región: el backsplash porque son
// cientos de celdas diminutas y además se sustituye por losa, y el piso porque
// se le dibujan juntas encima.
// Isométrico real: las dos direcciones del plano llevan pendiente ±tan(30°).
const PENDIENTE = 0.5774;

// El backsplash se resuelve por geometría y no por región porque son cientos
// de celdas de espiga diminutas — y da igual recortarlas, porque en la versión
// a color la espiga se sustituye por una losa corrida. El polígono va holgado
// a propósito: solo rellena píxeles que ninguna región grande reclamó, así que
// pasarse por arriba no le quita nada a la barra ni a los gabinetes.
const POLIGONOS = {
  backsplash: [[[505, 985], [1240, 562], [1240, 428], [505, 841]]],
  // Las varillas de las lámparas son de un par de píxeles de ancho: ninguna
  // región las recoge y el relleno por vecindad se las tragaba dentro del muro.
  // Los rectángulos van más anchos que la varilla a propósito — como solo
  // rellenan lo que nadie reclamó, el muro que sobra se queda donde estaba.
  negro: [
    [[1152, 498], [1186, 498], [1186, 716], [1152, 716]],
    [[1380, 366], [1416, 366], [1416, 590], [1380, 590]],
  ],
};

// Jaladeras. Se detectan solas, por dos vías, porque el dibujo no las hace
// siempre igual: las de los altos y la isla van cerradas y dejan una región
// interior propia; las de los cajones bajos son trazo abierto y no dejan
// ninguna. Enumerar las dieciséis a mano sería más frágil que esto.
//
// Vía 1 — por forma: región chica, alargada y rodeada de gabinete.
const JALADERAS = {
  areaMin: 120,
  areaMax: 6000,
  ladoCortoMax: 46,
  ladoLargoMax: 110,   // por encima de esto ya no es jaladera: es el poste de la isla
  dilatar: 3,          // se engorda la jaladera para tragarse su propio contorno
  relacionMin: 2.2,
  zonaAnfitriona: 'gabinete',
};

// Vía 2 — por trazo interior. Un píxel de trazo oscuro que, mirando a su
// alrededor, solo toca UNA pieza del mueble está dibujado DENTRO de esa pieza:
// es una jaladera. Si tocara dos, sería la junta entre dos puertas, y esa se
// deja como está. Ese es todo el criterio, y distingue bien las dos cosas.
const TRAZO_INTERIOR = {
  umbralOscuro: 165,
  radio: 6,
  zonaAnfitriona: 'gabinete',
};

module.exports = { ZONAS, POR_ID, POLIGONOS, PENDIENTE, JALADERAS, TRAZO_INTERIOR };
