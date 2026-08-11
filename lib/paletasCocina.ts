// Paletas de cocina. Cada una lleva dos variantes que cambian SOLO cubierta y
// piso: A tira a madera, B a piedra o concreto. Los gabinetes no se mueven
// entre variantes — es la misma cocina con otro acabado, no otra cocina.
//
// Los hex vienen del cliente; no se inventó ninguno ni se "ajustó" a la marca.

export type ZonaCocina =
  | 'cabinetUpper'
  | 'cabinetLower'
  | 'countertop'
  | 'floor'
  | 'backsplash'
  | 'wallBackground';

export type ColoresCocina = Record<ZonaCocina, string>;

export type VarianteCocina = { name: string; colors: ColoresCocina };

export type PaletaCocina = {
  id: number;
  name: string;
  variantA: VarianteCocina;
  variantB: VarianteCocina;
};

export type ClaveVariante = 'variantA' | 'variantB';

/** Qué es cada zona, para poder rotularla en la leyenda. */
export const ROTULO_ZONA: Record<ZonaCocina, string> = {
  cabinetUpper: 'Gabinete alto',
  cabinetLower: 'Gabinete bajo e isla',
  countertop: 'Cubierta',
  floor: 'Piso',
  backsplash: 'Backsplash',
  wallBackground: 'Muros',
};

export const PALETAS_COCINA: PaletaCocina[] = [
  {
    id: 1,
    name: 'Verde Oliva + Roble',
    variantA: {
      name: 'Roble Claro',
      colors: {
        cabinetUpper: '#909383',
        cabinetLower: '#909383',
        countertop: '#D4C5B9',
        floor: '#CBB198',
        backsplash: '#F5F3F0',
        wallBackground: '#FAFAF8',
      },
    },
    variantB: {
      name: 'Travertino Crudo',
      colors: {
        cabinetUpper: '#909383',
        cabinetLower: '#909383',
        countertop: '#D8D2C4',
        floor: '#D8D2C4',
        backsplash: '#E8E2D6',
        wallBackground: '#FAFAF8',
      },
    },
  },
  {
    id: 2,
    name: 'Gris + Mármol Blanco',
    variantA: {
      name: 'Mármol Blanco',
      colors: {
        cabinetUpper: '#B3B1AF',
        cabinetLower: '#B3B1AF',
        countertop: '#E6E4E5',
        floor: '#E6E4E5',
        backsplash: '#F2F0F1',
        wallBackground: '#FAFAF8',
      },
    },
    variantB: {
      name: 'Concreto Pulido',
      colors: {
        cabinetUpper: '#B3B1AF',
        cabinetLower: '#B3B1AF',
        countertop: '#E0DEDD',
        floor: '#DCDAD8',
        backsplash: '#F0EEEC',
        wallBackground: '#FAFAF8',
      },
    },
  },
  {
    id: 3,
    name: 'Blanco + Mármol + Roble',
    variantA: {
      name: 'Roble Claro',
      colors: {
        cabinetUpper: '#F7F5F6',
        cabinetLower: '#F7F5F6',
        countertop: '#E8E6E7',
        floor: '#CAAF93',
        backsplash: '#F2F0F1',
        wallBackground: '#FAFAF8',
      },
    },
    variantB: {
      name: 'Calacatta Claro',
      colors: {
        cabinetUpper: '#F7F5F6',
        cabinetLower: '#F7F5F6',
        countertop: '#E8E6E7',
        floor: '#E5E3E4',
        backsplash: '#F2F0F1',
        wallBackground: '#FAFAF8',
      },
    },
  },
  {
    id: 4,
    name: 'Negro + Madera Nogal',
    variantA: {
      name: 'Nogal Medio',
      colors: {
        cabinetUpper: '#222021',
        cabinetLower: '#222021',
        countertop: '#8B6F47',
        floor: '#7C5C46',
        backsplash: '#3A3835',
        wallBackground: '#E8E6E4',
      },
    },
    variantB: {
      name: 'Basalto/Grafito',
      colors: {
        cabinetUpper: '#222021',
        cabinetLower: '#222021',
        countertop: '#3A3835',
        floor: '#3A3835',
        backsplash: '#4A4844',
        wallBackground: '#E8E6E4',
      },
    },
  },
  {
    id: 5,
    name: 'Greige + Maple + Mármol',
    variantA: {
      name: 'Maple Claro',
      colors: {
        cabinetUpper: '#DBD1C6',
        cabinetLower: '#DBD1C6',
        countertop: '#E9E7E8',
        floor: '#CEB093',
        backsplash: '#F2F0EE',
        wallBackground: '#FAFAF8',
      },
    },
    variantB: {
      name: 'Travertino Greige',
      colors: {
        cabinetUpper: '#DBD1C6',
        cabinetLower: '#DBD1C6',
        countertop: '#E0D8CC',
        floor: '#E0D8CC',
        backsplash: '#EEEAE5',
        wallBackground: '#FAFAF8',
      },
    },
  },
  {
    id: 6,
    name: 'Azul Oscuro + Roble',
    variantA: {
      name: 'Roble Medio-Cálido',
      colors: {
        cabinetUpper: '#2C3952',
        cabinetLower: '#2C3952',
        countertop: '#D4C5B9',
        floor: '#8D7062',
        backsplash: '#F5F3F0',
        wallBackground: '#E8E6E4',
      },
    },
    variantB: {
      name: 'Concreto Gris Cálido',
      colors: {
        cabinetUpper: '#2C3952',
        cabinetLower: '#2C3952',
        countertop: '#B8B0A4',
        floor: '#B8B0A4',
        backsplash: '#D4CCB8',
        wallBackground: '#E8E6E4',
      },
    },
  },
];

export function buscarPaleta(id: number): PaletaCocina {
  return PALETAS_COCINA.find((p) => p.id === id) ?? PALETAS_COCINA[0];
}

export function coloresDe(id: number, variante: ClaveVariante): ColoresCocina {
  return buscarPaleta(id)[variante].colors;
}
