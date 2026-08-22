// Las paletas de la cocina isométrica.
//
// Un color por material, no por objeto: 'gabinete' es el mismo tono en altos,
// bajos e isla, porque en la cocina real es el mismo mueble. El sprite pone la
// luz y la sombra; aquí solo se dice de qué está hecho cada plano.
//
// 'marco' (el corte de la maqueta) no cambia nunca. 'negro' —grifo, tarja,
// jaladeras y lámparas— es el default, pero una paleta puede pisarlo: en los
// bocetos 2, 3 y 4 los herrajes son bronce, no negro mate.

const FIJOS = {
  marco: '#2E2C30',
  negro: '#2B2A2C',
};

const PALETAS = [
  {
    id: 1,
    slug: 'nogal-marmol',
    nombre: 'Nogal + Mármol Crema',
    // Muestreada de la versión a color del cliente. PENDIENTE de confirmar
    // contra el archivo original — estos hex están leídos de la imagen, no
    // sacados de su paleta.
    colores: {
      gabinete: '#BD8E70',
      cubierta: '#EFE7DA',
      backsplash: '#EFE7DA',
      piso: '#9B9B9F',
      muro: '#D9D5DF',
    },
    piedra: 'marmol',
    suelo: 'loseta',
  },

  // --- las cuatro variantes de los bocetos del cliente ----------------------
  // Los hex están muestreados a ojo de los círculos anotados; quedan sujetos a
  // confirmación. El muro no viene anotado en ningún boceto: se elige el
  // neutro que acompaña a cada familia (frío con los grises y azules, cálido
  // con los cremas y la madera).
  {
    id: 2,
    slug: 'nogal-oscuro-blanco',
    nombre: 'Nogal Oscuro + Blanco',
    colores: {
      gabinete: '#6B4726',   // nogal oscuro
      cubierta: '#FAFAF8',   // cuarzo blanco
      backsplash: '#FAFAF8',
      piso: '#B9B9BC',       // loseta gris
      muro: '#DAD6DE',
    },
    piedra: 'marmol',
    suelo: 'loseta',
  },
  {
    id: 3,
    slug: 'olivo-dorado',
    nombre: 'Verde Olivo + Dorado',
    colores: {
      gabinete: '#6E7458',   // verde olivo
      cubierta: '#DCD3C4',   // cuarzo crema
      backsplash: '#DCD3C4',
      piso: '#A97E56',       // duela de madera
      muro: '#DED9D1',
      negro: '#C9A55C',      // herrajes y lámparas en dorado cepillado
    },
    piedra: 'marmol',
    suelo: 'duela',
  },
  {
    id: 4,
    slug: 'crema-laton',
    nombre: 'Crema + Latón',
    colores: {
      gabinete: '#D5CEC2',   // gabinete crema
      cubierta: '#E2D9C6',   // cuarzo arena
      backsplash: '#E2D9C6',
      piso: '#A97E56',
      muro: '#E0DBD3',
      negro: '#BCA576',   // latón champagne: el dorado bajado de croma. Se va a
                          // rosa en cuanto el rojo le gana al amarillo, así que el
                          // apagado se consigue quitando saturación, no calentándolo.
    },
    // Tono sobre tono: con veta el mueble y la piedra se confunden, así que la
    // piedra va lisa y la diferencia la sostiene el valor, no el dibujo.
    piedra: 'ninguna',
    suelo: 'duela',
  },
  {
    id: 5,
    slug: 'azul-acero-dorado',
    nombre: 'Azul Acero + Dorado',
    colores: {
      gabinete: '#6E88A8',   // azul acero
      cubierta: '#C9C9CB',   // cuarzo gris liso
      backsplash: '#C9C9CB',
      piso: '#A97E56',
      muro: '#D8DAE0',
      negro: '#C9A55C',
    },
    piedra: 'ninguna',
    suelo: 'duela',
  },
  {
    id: 6,
    slug: 'blanco-cuarzo-gris',
    nombre: 'Blanco + Cuarzo Gris',
    // Aquí se invierte el esquema de las anteriores: el mueble es lo claro y la
    // piedra lo oscuro. El contraste lo carga la cubierta, no el gabinete.
    colores: {
      gabinete: '#E2E0DC',   // blanco cálido, casi greige
      cubierta: '#9B9B99',   // cuarzo gris medio
      backsplash: '#9B9B99',
      piso: '#CCCAC6',       // loseta gris claro, un punto por debajo del gabinete
                             // para que el mueble no se funda con el piso
      muro: '#D9D6DC',
      // herrajes negro mate: el boceto marca el círculo de fixtures oscuro,
      // así que se queda el default y no se pisa nada.
    },
    piedra: 'ninguna',
    suelo: 'loseta',
  },
];

// Cómo se vetea cada piedra. 'marmol' lleva vena ancha y gris; 'ninguna' deja
// el plano liso, para cuarzo o concreto.
//
// La vena sale de meter turbulencia dentro de un seno: el seno da las bandas
// paralelas y el ruido se las deforma hasta que serpentean. Las dos escalas
// tienen que ser del mismo orden —y bajas, cientos de píxeles— porque si el
// ruido va a frecuencia alta lo que aparece no es una veta sino granito.
const VETEADOS = {
  marmol: {
    escalaVena: 0.0190,   // frecuencia de las bandas
    escalaRuido: 0.0052,  // frecuencia de la deformación
    turbulencia: 3.4,     // cuánto serpentean
    nitidez: 9.5,         // exponente: cuanto más alto, más fina la vena
    tono: -0.042,         // cuánto oscurece la vena
    grano: 0.008,         // variación de fondo de la piedra
  },
  ninguna: { escalaVena: 0, escalaRuido: 0, turbulencia: 0, nitidez: 1, tono: 0, grano: 0 },
};

module.exports = { PALETAS, FIJOS, VETEADOS };
