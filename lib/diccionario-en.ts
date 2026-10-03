/**
 * EL SITIO EN INGLÉS. Español → inglés, frase por frase.
 *
 * Escrito a mano, no por un traductor automático: lo decidió el cliente y la
 * razón es buena. Quien entra aquí está tomando la decisión de compra más cara
 * de su vida, y el inglés de máquina suena a formulario, no a la constructora
 * que le va a levantar la casa.
 *
 * REGLAS QUE SE SIGUIERON AL TRADUCIR
 *
 *  - Nombres propios se quedan: La Gran Piedra, Enclave on 107, McAllen, Rio
 *    Grande Valley, Lot 76, Montecito 37.
 *  - Medidas y citas legales se quedan: ft², 50×95, § 138-356. Son datos, y un
 *    dato traducido deja de poder comprobarse contra su fuente.
 *  - Los términos de obra van en el inglés que se usa EN TEXAS, no en el del
 *    diccionario: "lot" y no "plot", "setback" y no "retreat", "floorplan",
 *    "half bath", "mudroom", "walk-in pantry". El cliente internacional que
 *    compra aquí va a hablar con contratistas de aquí.
 *  - El tuteo español pasa a la segunda persona directa del inglés, que es
 *    igual de cercana sin volverse coloquial.
 *
 * Lo que NO está aquí sale en español. Es a propósito: así la traducción
 * avanza sin dejar huecos ni claves crudas en pantalla.
 */
export const EN: Record<string, string> = {
  // ---------------------------------------------------------------- cabecera
  'Agenda una cita': 'Book a visit',
  'Saltar al configurador': 'Skip to the configurator',
  'Escríbenos por WhatsApp': 'Message us on WhatsApp',
  'Sin número configurado': 'No number set up',
  'Respuesta directa, sin formulario': 'A direct reply, no forms',

  // -------------------------------------------------------------------- hero
  'Casas custom · Rio Grande Valley': 'Custom homes · Rio Grande Valley',
  'Nunca fue tan fácil y satisfactorio diseñar tu casa.':
    'Designing your home has never been this easy.',
  'Lugares disponibles': 'Available lots',
  'Diseñar mi casa': 'Design my home',
  'Lotes en McAllen': 'Lots in McAllen',
  'Pasos, según tu lote': 'Steps, depending on your lot',
  'Smart home integrado': 'Smart home built in',

  // ------------------------------------------------------------------ índice
  'Índice': 'Index',
  'Lugares': 'Lots',
  'Personaliza': 'Customize',
  'Nosotros': 'About us',
  'Contacto': 'Contact',
  'Inicio': 'Home',
  'Brief': 'Brief',
  'Resumen': 'Summary',

  // ---------------------------------------------------------- por qué nosotros
  'Por qué nosotros': 'Why us',
  'Proceso a la vista': 'The build, in plain sight',
  'Cada semana recibes fotos, avance y el costo real acumulado. Sin cambios de orden sorpresa.':
    'Every week you get photos, progress and the real running cost. No surprise change orders.',
  'Diseño modular': 'Modular design',
  'Combinas módulos reales con proporciones probadas. Libertad, pero dentro de lo que sí funciona.':
    'You combine real modules with proven proportions. Freedom, inside what actually works.',
  'Smart home de fábrica': 'Smart home from day one',
  'Clima, accesos, riego e iluminación cableados desde obra gris. No parches después.':
    'Climate, access, irrigation and lighting wired in at the shell stage. No patching afterwards.',

  // ------------------------------------------------------- lugares y la obra
  'La obra': 'The work',
  'Casas nuestras, terminadas y en obra. Sin render que prometa lo que no se entrega.':
    'Our own homes, finished and under construction. No renderings promising what does not get built.',
  'Imágenes de la subdivisión': 'Images of the subdivision',
  'La casa modelo de la subdivisión': 'The subdivision model home',
  'Acceso de Enclave on 107': 'Entrance to Enclave on 107',
  'Ver más fotos': 'See more photos',
  'Cerrar la foto': 'Close the photo',
  'Ver una a la vez': 'View one at a time',
  'Detener el cambio automático de imagen': 'Stop the slideshow',
  'Reanudar el cambio automático de imagen': 'Resume the slideshow',
  'sin render': 'no renderings',
  'Render del townhouse modelo de Enclave on 107: fachadas en madera, estuco blanco y cochera negra':
    'Rendering of the Enclave on 107 model townhouse: wood facades, white stucco and a black garage door',
  'Casa terminada de La Gran Piedra en el Rio Grande Valley':
    'A finished La Gran Piedra home in the Rio Grande Valley',

  // -------------------------------------------------- el configurador: marco
  'Personaliza tu casa': 'Customize your home',
  '¿Ya tienes tu propio lote?': 'Already own your lot?',
  'Empecemos a calcular tu lote.': 'Let us work out your lot.',
  'Con una imagen o simplemente colocando medidas es suficiente.':
    'A photo is enough — or just the measurements.',
  'Subir mi lote': 'Upload my lot',
  'Tu progreso': 'Your progress',
  'Dejaste una casa a medias': 'You left a home half designed',
  'Empezar de cero': 'Start over',
  'Continuar': 'Continue',
  '← Atrás': '← Back',
  'Siguiente →': 'Next →',
  'Listo': 'Done',
  'Confirmar': 'Confirm',
  'Cambiar': 'Change',
  'Solo pedimos datos al final': 'We only ask for your details at the end',
  'Variantes curadas para tu lote': 'Options picked for your lot',
  'Antes de empezar': 'Before we start',
  'Tu lote': 'Your lot',
  'Floorplan': 'Floorplan',
  'Fachada': 'Facade',
  'Interior y zonas': 'Interior and areas',
  'Tus datos': 'Your details',

  // ------------------------------------------------------------ paso: el lote
  'Al ser un lote fuera de la subdivisión, se te abren los tres floorplans.':
    'Because this lot is outside the subdivision, all three floorplans open up.',
  'Lote irregular': 'Irregular lot',
  'Lote regular': 'Regular lot',
  'Marca su forma sobre una foto de tu terreno.': 'Trace its shape over a photo of your land.',
  'Frente y fondo en pies.': 'Width and depth in feet.',
  'Traza la forma de tu lote': 'Trace the shape of your lot',
  'Foto de tu lote': 'Photo of your lot',
  '¿En qué ciudad está tu lote?': 'Which city is your lot in?',
  'Elige tu ciudad': 'Choose your city',
  'Ciudad de tu lote': 'Your lot’s city',
  'Frente (ft)': 'Width (ft)',
  'Fondo (ft)': 'Depth (ft)',
  'Usar estas medidas': 'Use these measurements',
  'Usar este lote': 'Use this lot',
  'Revisar mi lote': 'Review my lot',
  'Primero captura tu lote.': 'Start by capturing your lot.',
  'Primero confirma tu lote aquí arriba': 'Confirm your lot above first',
  'Dinos cuánto mide tu terreno': 'Tell us how big your land is',
  'Escribe el frente y el fondo en pies, con números mayores a cero.':
    'Enter width and depth in feet, using numbers greater than zero.',
  'Lote': 'Lot',
  'Zona construible': 'Buildable area',
  'Lote y zona construible': 'Lot and buildable area',
  'Área del lote': 'Lot area',
  'Tope del lote': 'Lot ceiling',
  'Máx habitable': 'Max living area',
  'Orientación': 'Orientation',
  'Ubicación': 'Location',
  'Trazado por ti': 'Traced by you',
  'contorno trazado por ti': 'outline traced by you',
  'Lote del cliente': 'Client’s lot',
  'lote del cliente': 'client’s lot',
  'Lote de la subdivisión': 'Subdivision lot',
  'Plano de este lote': 'This lot’s plat',
  'CONSTRUCCIÓN': 'BUILDABLE',
  'o más si hay servidumbre': 'or more where there is an easement',
  'la mediana del Valle': 'the Valley median',
  'Dirección por confirmar': 'Address to be confirmed',
  'Por confirmar': 'To be confirmed',
  'Por capturar': 'Not captured yet',
  'Por definir': 'To be decided',
  'Aún sin definir': 'Not decided yet',

  // ------------------------------------------------------- paso: el floorplan
  'Elegir este plano': 'Choose this floorplan',
  'Ninguno de los planos cabe': 'None of the floorplans fit',
  'No cabe': 'Does not fit',
  'NO CABE': 'DOES NOT FIT',
  'INCLUIDO': 'INCLUDED',
  'Incluye:': 'Includes:',
  'Townhouse 2 pisos': '2-story townhouse',
  'Corredor en patio': 'Courtyard breezeway',
  'Patio central': 'Central courtyard',
  '2 pisos': '2 stories',
  'Patio techado atrás': 'Covered rear patio',
  'Escalera, arriba y abajo': 'Stairs, upstairs and down',
  'Dos patios': 'Two courtyards',
  'Un patio': 'One courtyard',
  '2 plantas': '2 stories',
  '1 planta': '1 story',
  'una planta': 'one story',
  'de escalera': 'of stairs',
  'de patio': 'of courtyard',
  'de patios': 'of courtyards',
  'Sin floorplan elegido': 'No floorplan chosen',
  'Primero elige un floorplan en el paso 1.': 'Choose a floorplan in step 1 first.',

  // --------------------------------------------------------- paso: la fachada
  'Fachada de la casa': 'Home facade',
  'Elegir esta fachada': 'Choose this facade',
  'Selecciona un estilo de fachada': 'Pick a facade style',
  'Fachada de la subdivisión': 'Subdivision facade',
  'De la subdivisión': 'Set by the subdivision',
  'Definida por la subdivisión': 'Defined by the subdivision',
  'La trae puesta el reglamento': 'The rulebook sets it',
  'La casa del townhouse se entrega con su fachada ya diseñada y aprobada por la subdivisión':
    'The townhouse comes with its facade already designed and approved by the subdivision',
  'Sin fachada': 'No facade',
  'Escandinavo': 'Scandinavian',
  'Farm style': 'Farmhouse',
  'Moderno': 'Modern',
  'Mediterráneo': 'Mediterranean',

  // --------------------------------------------------------- paso: el interior
  'Elige tu paleta y arma tus zonas': 'Pick your palette and build out your areas',
  'Paleta de interior': 'Interior palette',
  'Paletas disponibles': 'Available palettes',
  'Las cocinas son solo ejemplo para ver los colores':
    'The kitchens are only an example, to show the colors',
  'Sin paleta': 'No palette',
  'Sin paleta elegida': 'No palette chosen',
  'Nogal + Mármol Crema': 'Walnut + Cream Marble',
  'Nogal Oscuro + Blanco': 'Dark Walnut + White',
  'Verde Olivo + Dorado': 'Olive Green + Gold',
  'Crema + Latón': 'Cream + Brass',
  'Azul Acero + Dorado': 'Steel Blue + Gold',
  'Blanco + Cuarzo Gris': 'White + Gray Quartz',
  'Nogal cálido, mármol crema veteado y loseta gris. Herrajes en negro mate.':
    'Warm walnut, veined cream marble and gray tile. Matte black hardware.',
  'Nogal oscuro contra cuarzo blanco y loseta gris. Herrajes en negro mate.':
    'Dark walnut against white quartz and gray tile. Matte black hardware.',
  'Verde olivo con cuarzo crema, duela de madera y herrajes en dorado cepillado.':
    'Olive green with cream quartz, wood plank floors and brushed gold hardware.',
  'Tono sobre tono: gabinete crema, cuarzo arena liso, duela y latón champagne.':
    'Tone on tone: cream cabinets, smooth sand quartz, plank floors and champagne brass.',
  'Azul acero con cuarzo gris liso, duela de madera y herrajes dorados.':
    'Steel blue with smooth gray quartz, wood plank floors and gold hardware.',
  'Se invierte el esquema: el mueble es lo claro y la piedra lo oscuro. Herrajes negro mate.':
    'The scheme flips: the cabinets are the light note and the stone the dark one. Matte black hardware.',
  'Volumen blanco, ventanal corrido, alero mínimo.':
    'White volume, ribbon window, minimal eave.',
  'Dos aguas marcadas, lámina negra, madera cálida.':
    'Strong gables, black standing-seam metal, warm wood.',
  'Muro de piedra caliza local y estuco liso.': 'Local limestone wall and smooth stucco.',
  'Estuco carbón, celosía geométrica de concreto.':
    'Charcoal stucco, geometric concrete screen.',

  // ------------------------------------------------------- cuartos y cochera
  'Recámaras': 'Bedrooms',
  'Baños': 'Bathrooms',
  'Recámara': 'Bedroom',
  'Baño': 'Bathroom',
  'recámara': 'bedroom',
  'recámaras': 'bedrooms',
  'baño': 'bathroom',
  'baños': 'bathrooms',
  'el baño': 'the bathroom',
  'el cuarto': 'the room',
  'su clóset': 'its closet',
  'recámara estándar': 'standard bedroom',
  'Quitar una recámara': 'Remove a bedroom',
  'Un lugar más': 'One more space',
  'Un lugar menos': 'One space fewer',
  'Un lugar más de garage': 'One more garage space',
  'Un lugar menos de garage': 'One garage space fewer',
  'Tres lugares es el máximo': 'Three spaces is the maximum',
  'Un auto': 'One car',
  'Sin cochera': 'No garage',
  'Marca la casilla para ponerle cochera': 'Check the box to add a garage',
  'Quita la casilla si no quieres cochera': 'Uncheck the box if you do not want a garage',
  'Tu casa se diseña sin cochera: esos pies se van todos a espacio habitable.':
    'Your home is designed without a garage: every one of those feet goes to living space.',
  'Estimado automático': 'Automatic estimate',
  'Cochera, pórtico y patio': 'Garage, porch and patio',
  'Cochera, pórtico, patio y exteriores': 'Garage, porch, patio and outdoor areas',

  // ---------------------------------------------------------------- las zonas
  'Áreas adicionales': 'Additional areas',
  'Áreas agregadas': 'Areas added',
  'Otras áreas': 'Other areas',
  'área': 'area',
  'áreas': 'areas',
  'Sin zonas adicionales.': 'No additional areas.',
  'Sin zonas agregadas': 'No areas added',
  'Ninguna agregada. Elige una de la lista.': 'None added yet. Pick one from the list.',
  'No queda ninguna área por decidir.': 'There are no areas left to decide.',
  'Ya viste todas las áreas': 'You have seen every area',
  'Ya la llevas': 'Already in',
  '✓ En uso': '✓ In use',
  'Sin espacio libre': 'No space left',
  'Ocupa en tu terreno': 'Takes up on your land',
  'Zona exterior: ocupa terreno, no área habitable':
    'Outdoor area: it takes up land, not living space',
  'Con tragaluz': 'With a skylight',
  'Esta área da al poniente — no ideal para tragaluz.':
    'This area faces west — not ideal for a skylight.',
  'Abajo está lo que podrías agregar y cuánto espacio te falta para cada cosa.':
    'Below is what you could add, and how much space each one still needs.',
  'Guiarme una por una': 'Walk me through them one by one',
  'No permitido por reglas de la subdivisión en lotes townhouse':
    'Not allowed by subdivision rules on townhouse lots',
  'Home office junto a la entrada': 'Home office by the entry',
  'Home office': 'Home office',
  'Game room': 'Game room',
  'Walking pantry': 'Walk-in pantry',
  'Mudroom desde el garage': 'Mudroom off the garage',
  'Mudroom': 'Mudroom',
  'Comodín room': 'Flex room',
  'Master con conexión al patio': 'Primary suite opening to the patio',
  'Master con balcón': 'Primary suite with balcony',
  'Master + patio': 'Primary + patio',
  'Master + balcón': 'Primary + balcony',
  'Medio baño de visitas': 'Guest half bath',
  'Medio baño': 'Half bath',
  'Walking closet secundario': 'Secondary walk-in closet',
  'Walking closet': 'Walk-in closet',
  'Alberca con deck perimetral': 'Pool with perimeter deck',
  'Alberca': 'Pool',
  'Zona BBQ compacta': 'Compact BBQ area',
  'Zona BBQ': 'BBQ area',
  'Sunken lounge en el gran salón': 'Sunken lounge in the great room',
  'Sunken lounge': 'Sunken lounge',
  'Storage': 'Storage',
  'El closet del master ya está incluido': 'The primary closet is already included',
  'Elegiste un comodín room': 'You picked a flex room',
  'Cuéntanos en el brief para qué lo quieres y el arquitecto lo aterriza contigo':
    'Tell us in the brief what you want it for and the architect will shape it with you',

  // ------------------------------------------------- presupuesto de pies²
  'Presupuesto SFT': 'SQFT budget',
  'Área habitable': 'Living area',
  'Área construida': 'Built area',
  'Área total SQF': 'Total SQF',
  'Total construido': 'Total built',
  'Libre para tu casa': 'Left for your home',
  'Cómo se reparte': 'How it breaks down',
  'La casa': 'The home',
  'Lo que pidió': 'What they asked for',
  'Lo que sigue': 'What comes next',
  'Área habitable disponible dentro del límite de tu lote, ya restando el floorplan, los cuartos extra y las zonas que llevas':
    'Living area still available within your lot’s limit, with the floorplan, the extra rooms and the areas you have added already deducted',
  'Del total, 37 ft² son balcón: no consumen área habitable':
    'Of that total, 37 ft² are balcony: they do not use up living area',
  'El área habitable final depende de la cochera y del floorplan. El arquitecto verifica las medidas y los retiros reales en la cita.':
    'The final living area depends on the garage and the floorplan. The architect checks the real measurements and setbacks at the visit.',

  // ------------------------------------------------------------ la carpeta
  'Tu casa, por ahora': 'Your home, so far',
  'Ver el resumen de tu casa': 'See the summary of your home',
  'Ocultar el resumen de tu casa': 'Hide the summary of your home',
  'Programa': 'Program',
  'Aún no escribiste tu brief en el paso 4 — esto es un resumen visual de lo que llevas elegido.':
    'You have not written your brief in step 4 yet — this is a visual summary of what you have chosen so far.',

  // ----------------------------------------------------------------- el brief
  '¿Algo en especial que gustes agregar o aclarar?':
    'Anything in particular you would like to add or clarify?',
  'Agrega la dirección de tu lote': 'Add your lot’s address',
  'Calle y número, o el cruce más cercano': 'Street and number, or the nearest cross street',
  'Tu comentario:': 'Your note:',
  'No dejaste comentarios para el arquitecto.': 'You did not leave any notes for the architect.',
  'No tengo comentarios': 'I have no notes',
  'No estoy seguro': 'Not sure',
  'Comenta o pide algo especial, o sáltalo': 'Add a note or a special request, or skip it',
  'Puedes seguir al brief y platicarlo con el arquitecto.':
    'You can move on to the brief and talk it through with the architect.',
  'El comodín room lo quiero como gym, con espejo de pared a pared. Y quisiera ver si la pérgola del patio se puede alargar hasta la cocina exterior…':
    'I want the flex room as a gym, with a wall-to-wall mirror. And I would like to see if the patio pergola can run all the way to the outdoor kitchen…',

  // ---------------------------------------------------------- datos y contacto
  'Envíanos tu propuesta': 'Send us your plan',
  'Nombre completo': 'Full name',
  'Correo': 'Email',
  'Teléfono': 'Phone',
  'Tu número': 'Your number',
  'Enviar': 'Send',
  'Enviando...': 'Sending…',
  'Enviando…': 'Sending…',
  'Se ha enviado con éxito.': 'Sent successfully.',
  'Trae tus ideas y nos encargamos de materializarlas.':
    'Bring us your ideas and we will make them real.',
  'Agendar mi cita': 'Book my visit',
  'Cita solicitada': 'Visit requested',
  'Con el correo o el teléfono basta': 'Either an email or a phone number is enough',
  'Datos de contacto': 'Contact details',
  'Sin contacto': 'No contact details',
  'Sin nombre': 'No name',
  'Escribe tu nombre para saber a quién buscamos.':
    'Enter your name so we know who to look for.',
  'Escribe tu nombre en el paso 6 para saber a quién buscamos.':
    'Enter your name in step 6 so we know who to look for.',
  'Déjanos un correo o un teléfono, el que prefieras.':
    'Leave us an email or a phone number, whichever you prefer.',
  'Déjanos un correo o un teléfono en el paso 6, el que prefieras.':
    'Leave us an email or a phone number in step 6, whichever you prefer.',
  'El arquitecto llega a la llamada con tu configuración ya revisada.':
    'The architect comes to the call having already gone through your configuration.',
  'Si mientras tanto quieres adelantar, arma tu casa en el configurador y llegamos con algo concreto que enseñarte.':
    'If you want to get ahead in the meantime, build your home in the configurator and we will come with something concrete to show you.',
  'Personalizar mi casa ↗': 'Customize my home ↗',
  'El envío automático todavía no está activo y tu solicitud no nos llegó. Escríbenos a contact@lagranpiedrallc.com y te contestamos directo.':
    'Automatic sending is not switched on yet, so your request did not reach us. Email us at contact@lagranpiedrallc.com and we will answer you directly.',
  'El envío automático todavía no está activo. Escríbenos o agenda tu cita aquí abajo y llevamos tu configuración a la cita.':
    'Automatic sending is not switched on yet. Email us or book your visit below and we will bring your configuration to it.',
  'No pudimos mandarla en este momento. Vuelve a intentar, o agenda tu cita aquí abajo.':
    'We could not send it right now. Try again, or book your visit below.',
  'No pudimos mandarla: revisa tu conexión y vuelve a intentar.':
    'We could not send it: check your connection and try again.',
  'No pudimos mandarlo en este momento. Vuelve a intentar, o escríbenos a contact@lagranpiedrallc.com.':
    'We could not send it right now. Try again, or email us at contact@lagranpiedrallc.com.',
  'No pudimos mandarlo: revisa tu conexión y vuelve a intentar.':
    'We could not send it: check your connection and try again.',
  'Hola, los encontré en su página y quiero platicar sobre mi casa.':
    'Hi — I found you through your website and I would like to talk about my home.',

  // ------------------------------------------------------------------- FAQ
  'Preguntas frecuentes': 'Frequently asked questions',
  '¿Qué es exactamente una casa custom de La Gran Piedra?':
    'What exactly is a La Gran Piedra custom home?',
  'Partes de un lote con reglas conocidas y de floorplans que ya validamos estructural y térmicamente. Sobre esa base decides fachada, interiores y qué módulos añadir. No es un catálogo cerrado ni un lienzo en blanco: es libertad con guardarraíles.':
    'You start from a lot with known rules and floorplans we have already validated structurally and thermally. On that base you decide the facade, the interiors and which modules to add. It is neither a closed catalog nor a blank canvas: it is freedom with guardrails.',
  '¿Cuánto tiempo toma construir?': 'How long does it take to build?',
  'Entre 5 y 9 meses desde la firma, según el floorplan y los módulos. El calendario se comparte completo antes de arrancar y se actualiza cada semana.':
    'Between 5 and 9 months from signing, depending on the floorplan and the modules. You get the full schedule before we break ground, and it is updated every week.',
  '¿Puedo cambiar cosas después de configurar en la web?':
    'Can I change things after configuring online?',
  'Sí. El configurador es el punto de partida de la conversación, no un contrato. Todo se revisa con el arquitecto en la cita presencial en el lote.':
    'Yes. The configurator is where the conversation starts, not a contract. Everything gets reviewed with the architect at the on-site visit.',
  '¿Qué pasa con lo que escribo en el brief?': 'What happens with what I write in the brief?',
  'Llega tal cual al arquitecto, con tus palabras. No lo resumimos ni lo interpretamos: es lo que se platica contigo en la cita. Las zonas las eliges tú en el paso 4, con el presupuesto de pies cuadrados a la vista.':
    'It reaches the architect exactly as you wrote it. We do not summarize it or interpret it: it is what gets discussed with you at the visit. You choose the areas yourself in step 4, with the square-foot budget in plain sight.',
  '¿Trabajan con financiamiento?': 'Do you work with financing?',
  'Trabajamos con prestamistas de construcción locales del Valle. Te conectamos, pero el crédito lo contratas tú directo — nosotros no cobramos comisión por eso.':
    'We work with local construction lenders here in the Valley. We put you in touch, but you take out the loan directly — we charge no commission for it.',
  '¿Qué incluye el smart home?': 'What does the smart home include?',
  'En función de tus necesidades pensamos cómo hacer tu casa smart.':
    'We work out how to make your home smart around what you actually need.',

  // --------------------------------------------- añadidos al cablear
  'Diseñar mi casa →': 'Design my home →',
  'Subir mi lote →': 'Upload my lot →',
  'Agendar mi cita →': 'Book my visit →',
  'Enviar al arquitecto': 'Send to the architect',
  'RENDER — NO ES FOTO DE OBRA': 'RENDERING — NOT A PHOTO OF THE BUILD',
  'Antes de empezar — Tu lote': 'Before we start — Your lot',
  'LA GRAN PIEDRA LLC · TX BUILDER · © 2026': 'LA GRAN PIEDRA LLC · TX BUILDER · © 2026',
  'Hablemos': 'Let us talk',
  'Paso': 'Step',
  'de': 'of',
  'Antes elige': 'First choose',
  'el floorplan': 'the floorplan',
  'la fachada': 'the facade',
  'la paleta de interior': 'the interior palette',
  'el lote': 'the lot',
  'tu lote': 'your lot',
  '% de lo permitido': '% of what is allowed',
  'captura tu lote para activarlo': 'capture your lot to switch it on',
  'Tu lote da': 'Your lot gives',
  'habitables': 'of living area',
  'Solo puedes llevar una. Para ver las demás, quita': 'You can only have one. To see the others, remove',
  'Solo puedes llevar una. Para cambiarla, quita': 'You can only have one. To change it, remove',
  'con su': 'with its',
  'y elige otra.': 'and pick another.',
  'Render — no es foto de obra': 'Rendering — not a photo of the build',
  'Planos disponibles': 'Available floorplans',
  'Fachadas disponibles': 'Available facades',
  'Usa': 'Uses',
  'Te faltan': 'You are short',
  'Incluida': 'Included',
  'Puesta': 'Added',
  'libres': 'left',
  'Aquí armas la casa: cuántas recámaras y cuántos baños quieres. El arquitecto los acomoda dentro del plano que elegiste.': 'This is where you build out the home: how many bedrooms and how many bathrooms you want. The architect fits them inside the floorplan you chose.',
  'Empieza por la paleta de interior — de ahí salen pisos, muros y carpintería.': 'Start with the interior palette — floors, walls and cabinetry all come from it.',
  'Por último, agrega las áreas que quepan en lo que te queda.': 'Last, add whatever areas fit in what you have left.',
  'Quitar': 'Remove',
  'Agregar': 'Add',
  'Agregar tragaluz': 'Add a skylight',
  'plano y fachada los fija la subdivisión': 'floorplan and facade are set by the subdivision',
  'Cerrar': 'Close',
  'Foto': 'Photo',
  'Foto anterior': 'Previous photo',
  'Foto siguiente': 'Next photo',
  'Ver a pantalla completa': 'View full screen',
  'Ver imagen {n} de {total}': 'View image {n} of {total}',
  'Paso {n} de {total}': 'Step {n} of {total}',
  'Paso {n} de {total}, bloqueado: antes elige {falta}': 'Step {n} of {total}, locked: first choose {falta}',
  'lugar': 'space',
  'lugares': 'spaces',
  'Área habitable: {n} ft²': 'Living area: {n} ft²',
  'Gastado del presupuesto habitable: {usado} de {techo} ft² — quedan {libres}': 'Living-area budget used: {usado} of {techo} ft² — {libres} left',
  'No cabe en tu presupuesto restante (quedan {libres} ft² habitables, esta zona necesita mínimo {pide} ft²)': 'Does not fit in what you have left ({libres} ft² of living area left, this area needs at least {pide} ft²)',
  'Primero quita {zona}': 'First remove {zona}',
  'Primero quita {zona} con su ✕': 'First remove {zona} with its ✕',

  // Frases con huecos: el código las traduce enteras y después mete los
  // números. Los huecos ({n}, {zona}…) se copian tal cual en inglés — si uno
  // se pierde, la cifra no aparece en pantalla.
  'Máximo {n} {zona}s extra.': 'Up to {n} extra {zona}.',
  'No cabe: quedan {libres} ft² habitables y {zona} necesita {pide} ft².': "Doesn't fit: {libres} ft² of living space left, and {zona} needs {pide} ft².",
  'No cabe: la casa pide {pide} ft² construidos y tu lote da {da}': "Doesn't fit: the home needs {pide} ft² built and your lot gives {da}",
  '{total} ft² construidos de {max}, con {obra} de {que}': '{total} ft² built of {max}, with {obra} of {que}',
  '{total} ft² construidos: {hab} habitables y {obra} de {que}': '{total} ft² built: {hab} living and {obra} of {que}',

  // Los pies de foto de "La obra" (lib/obra.ts). Son el alt y la leyenda a la
  // vez: describen lo que de verdad se entregó, así que se traducen completos.
  'Casa entregada: fachada de piedra y madera con dos frontones': 'Delivered home: stone and wood facade with two gables',
  'Interior entregado: sala y cocina abiertas bajo plafón escalonado': 'Delivered interior: open living and kitchen under a stepped ceiling',
  'Interior entregado: cocina de nogal con isla y cubierta marmoleada': 'Delivered interior: walnut kitchen with island and marbled countertop',
  'Casa entregada al anochecer: piedra blanca, cochera negra y luz cálida en la entrada': 'Delivered home at dusk: white stone, black garage doors and warm light at the entry',
  'Interior entregado: entrada con nicho de nogal retroiluminado': 'Delivered interior: entry with a backlit walnut niche',
  'Interior entregado: baño principal con doble lavabo sobre cubierta marmoleada': 'Delivered interior: primary bath with double vanity on a marbled countertop',
  'Casa entregada: pórtico de doble altura en piedra sobre estuco blanco': 'Delivered home: two-story stone portico over white stucco',
  'Interior entregado: cocina de roble claro con isla ranurada y comedor contiguo': 'Delivered interior: light oak kitchen with a fluted island and adjoining dining',
  'Interior entregado: vestíbulo con pilastras y banca de madera bajo nicho iluminado': 'Delivered interior: foyer with pilasters and a wood bench under a lit niche',
  'Casa entregada al anochecer: frontones forrados de madera sobre estuco blanco': 'Delivered home at dusk: wood-clad gables over white stucco',
  'Interior entregado: cocina con azulejo en espiga, isla de roble y puerta corrediza de granero': 'Delivered interior: kitchen with herringbone tile, oak island and a sliding barn door',
  'Interior entregado: baño con tina exenta y regadera de cristal a piso': 'Delivered interior: bath with a freestanding tub and a curbless glass shower',
  'Casa entregada: volúmenes blancos y oscuros con acceso de concreto estampado': 'Delivered home: white and dark volumes with a stamped concrete driveway',
  'Interior entregado: sala y cocina de nogal en planta abierta con plafón escalonado': 'Delivered interior: walnut living and kitchen in an open plan under a stepped ceiling',
  'Interior entregado: despensa con entrepaños iluminados y barra de cuarzo': 'Delivered interior: walk-in pantry with lit shelving and a quartz counter',
  'Interior entregado: baño principal con grifería dorada y doble lavabo': 'Delivered interior: primary bath with gold fixtures and a double vanity',
  'paso {n} de {total}. La guardamos en este navegador.': 'step {n} of {total}. We saved it in this browser.',
  'Incluido': 'Included',
  'Elegido': 'Chosen',
  'Lo que escribas viaja tal cual al arquitecto, con tus palabras. No lo resumimos ni lo interpretamos.': 'What you write travels to the architect word for word. We do not summarize it or interpret it.',
  'Opcional, pero cambia todo': 'Optional, but it changes everything',
  'caracteres': 'characters',
  '{hab} de {total} ft²': '{hab} of {total} ft²',
  // El correo de ejemplo del formulario: en inglés 'correo.com' se lee como
  // un dominio real que no es nuestro. El nombre propio no se traduce.
  'maria@correo.com': 'maria@email.com',
  'Nos pondremos en contacto contigo.': 'We will get in touch with you.',
  'Listo, {nombre}. Te buscamos en menos de 24 horas.': 'All set, {nombre}. We will reach out within 24 hours.',
  'Nadie mejor que tú sabe cómo quiere las cosas, por eso aquí diseñas tu casa': 'Nobody knows how you want things better than you do, which is why here you design your home',
  'tú mismo': 'yourself',
  ': fácil y sin procesos que te fastidien.': ': simple, with no process to wear you down.',
  'Ubicación capturada': 'Location captured',
  'EL': 'THE',
  'PLANO': 'FLOORPLAN',
  'CALLE': 'STREET',
  'Ver fotos anteriores': 'See previous photos',
  'Ver todas': 'See them all',
  'BALCÓN': 'BALCONY',
  'CORREDOR TECHADO': 'COVERED BREEZEWAY',
  'PATIO CENTRAL': 'CENTRAL COURTYARD',
  'PATIO TECHADO 87 FT²': 'COVERED PATIO 87 FT²',
  'PLANTA ALTA · 4 REC': 'SECOND FLOOR · 4 BD',
  'PLANTA ALTA': 'SECOND FLOOR',
  'PLANTA BAJA': 'GROUND FLOOR',
  'dos plantas': 'two stories',
  'McAllen norte · corredor S.H. 107': 'North McAllen · S.H. 107 corridor',
  'El lote {lote} se entrega con la casa ya diseñada y aprobada por la subdivisión, así que ni el floorplan ni la fachada se cambian. Lo que sí personalizas es el interior y las áreas que quepan en el presupuesto — por eso tu recorrido son {pasos} pasos y no {total}.': 'Lot {lote} comes with the home already designed and approved by the subdivision, so neither the floorplan nor the facade changes. What you do personalize is the interior and whatever areas fit in the budget — that is why your path is {pasos} steps and not {total}.',
  'Termina de trazar tu lote, o usa el regreso del trazador': "Finish tracing your lot, or use the tracer's own back button",
};
