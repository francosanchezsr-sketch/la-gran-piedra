/**
 * Las fotos de "La obra". Todas son fotografía propia de casas ya entregadas.
 *
 * Se alternan fachada e interior a propósito: una tira de puras fachadas se lee
 * como catálogo de bienes raíces, y lo que hay que probar es que el acabado de
 * adentro aguanta el de afuera.
 *
 * Regla para quien añada aquí: si una imagen no es obra propia y entregada, no
 * entra. Esta es la sección cuyo texto promete "sin render que prometa lo que
 * no se entrega", y ya hubo una foto que no era nuestra ocupando el primer
 * lugar de la tira.
 */
export type FotoObra = { src: string; alt: string };

export const FOTOS_OBRA: FotoObra[] = [
  { src: '/obra/casa-4701.jpg', alt: 'Casa entregada: fachada de piedra y madera con dos frontones' },
  { src: '/obra/sala-abierta.jpg', alt: 'Interior entregado: sala y cocina abiertas bajo plafón escalonado' },
  { src: '/obra/cocina-nogal.jpg', alt: 'Interior entregado: cocina de nogal con isla y cubierta marmoleada' },
  { src: '/obra/casa-2705.jpg', alt: 'Casa entregada al anochecer: piedra blanca, cochera negra y luz cálida en la entrada' },
  { src: '/obra/entrada-nicho.jpg', alt: 'Interior entregado: entrada con nicho de nogal retroiluminado' },
  { src: '/obra/bano-principal.jpg', alt: 'Interior entregado: baño principal con doble lavabo sobre cubierta marmoleada' },
  { src: '/obra/casa-1609.jpg', alt: 'Casa entregada: pórtico de doble altura en piedra sobre estuco blanco' },
  { src: '/obra/cocina-roble.jpg', alt: 'Interior entregado: cocina de roble claro con isla ranurada y comedor contiguo' },
  { src: '/obra/vestibulo-columnas.jpg', alt: 'Interior entregado: vestíbulo con pilastras y banca de madera bajo nicho iluminado' },
  { src: '/obra/casa-2709.jpg', alt: 'Casa entregada al anochecer: frontones forrados de madera sobre estuco blanco' },
  { src: '/obra/cocina-espiga.jpg', alt: 'Interior entregado: cocina con azulejo en espiga, isla de roble y puerta corrediza de granero' },
  { src: '/obra/bano-tina.jpg', alt: 'Interior entregado: baño con tina exenta y regadera de cristal a piso' },
  { src: '/obra/casa-3308.jpg', alt: 'Casa entregada: volúmenes blancos y oscuros con acceso de concreto estampado' },
  { src: '/obra/sala-nogal.jpg', alt: 'Interior entregado: sala y cocina de nogal en planta abierta con plafón escalonado' },
  { src: '/obra/despensa.jpg', alt: 'Interior entregado: despensa con entrepaños iluminados y barra de cuarzo' },
  { src: '/obra/bano-oro.jpg', alt: 'Interior entregado: baño principal con grifería dorada y doble lavabo' },
];
