# Progreso — La Gran Piedra, configurador web

Registro de lo trabajado en esta conversación. La Gran Piedra LLC es una constructora
de casas custom en el Rio Grande Valley (Edinburg · McAllen · Mission), con
subdivisión propia **Enclave on 107** en McAllen. El sitio es un configurador
donde el cliente arma su casa, dirigido a clientes locales e internacionales. El
recorrido son 6 pasos con lote propio y 5 en la subdivisión (ver sección 16).

Última actualización: el sitio ya está publicado en producción, y hay un
prototipo (todavía sin integrar) para trazar lotes irregulares (sección 22).
**Todo lo de las secciones 1–21 ya está commiteado y en GitHub** — el commit
más reciente es `d9ea540`. La sección 22 en adelante es lo nuevo de esta
conversación.

---

## 1. Auditoría inicial

Se hizo una auditoría de navegación completa (escritorio y móvil) que encontró:

- **"Agenda una cita" no mandaba nada** — validaba el formulario y mostraba éxito
  sin llamar a ninguna API. Era el hallazgo más grave: perdía leads en silencio.
- Cero precios en todo el sitio.
- Contacto de relleno publicado: `(956) 000 0000`, `hola@lagranpiedra.com`.
- La rueda del mouse sobre el selector de lotes movía la página 300px al mismo
  tiempo que giraba el cilindro (`onWheel` de React es pasivo; su
  `preventDefault()` no hacía nada).
- La barra flotante inferior tapaba el formulario de contacto en móvil.
- El FAQ solo dejaba una pregunta abierta a la vez.
- Objetivos táctiles de hasta 14px (mínimo recomendado: 44px).
- El selector de lote en móvil era un cilindro 3D difícil de usar con el pulgar.

Se investigó a 4 competidores del sector (PinPoint, Dolcan Homes, Homes by
Innovative, Esperanza Homes): ninguno publica precio, y solo Esperanza tiene
algo parecido a un configurador (mucho más simple: solo estilos de fachada).

## 2. Arreglos de navegación (`9137ab6`)

- Rueda del selector de lotes: listener real con `passive:false` vía callback
  ref (sobrevive a que el cilindro se desmonte/remonte entre pasos).
- FAQ: varias preguntas abiertas a la vez.
- Barra flotante: se desliza fuera de vista mientras hay un campo con foco, y
  su borde derecho se desvanece para indicar que hay más opciones.
- Objetivos táctiles subidos a 44px mínimo.
- Enlace de salto al configurador (accesibilidad — 57 elementos enfocables en
  una sola página sin forma de saltarlos).

## 3. La ventana enfocada (`9b2b27f`, `62e3b57`)

Se construyó `components/VentanaEnfocada.tsx`: el configurador dejó de vivir
en el flujo normal de la página y pasó a ser una ventana modal a pantalla
completa, con todo lo que un modal real necesita y que los anteriores no
tenían:

- `role="dialog"`, `aria-modal="true"`, foco atrapado dentro, foco devuelto al
  cerrar.
- Escape cierra.
- El botón/gesto "atrás" del teléfono cierra la ventana en vez de sacar al
  cliente del sitio (antes borraba todo el progreso).
- El scroll de fondo se bloquea mientras está abierta.

La página de inicio quedó dividida en dos zonas: **Inicio** (donde se elige
el lote) y **Personaliza tu casa** (la ventana enfocada, que ahora es donde
vive todo el configurador de 7 pasos).

## 4. La mesa del arquitecto (`62e3b57`)

`components/MesaArquitecto.tsx`: reemplaza el resumen de texto plano por una
escena visual — el plano grande como hoja principal, las zonas elegidas como
fotos sueltas encimadas, la paleta como muestras de pintura, la ficha de
números como papel aparte, y el brief del cliente como nota pegada. Aparece
en el paso 4 (se va llenando mientras el cliente elige) y en el paso 6 (el
resumen final, antes de pedir datos de contacto).

Los pasos 6 y 7 se intercambiaron: ahora el cliente **ve su combo completo
antes** de que se le pidan sus datos (antes era al revés).

## 5. El plat como único selector de lotes (`17725cb`)

Se quitó una rejilla de tarjetas de lote que duplicaba lo que el plat SVG de
la subdivisión ya mostraba. Ahora el lote se elige tocándolo directamente en
el plano — es donde se ve su ubicación real, colindancias y orientación.

## 6. Persistencia (`5822cfb`)

`lib/guardado.ts`: el configurador no guardaba nada — una recarga o cambiar
de app en el celular borraba todo el progreso del cliente. Ahora se guarda en
`localStorage` y se ofrece "Continuar" / "Empezar de cero" al volver. Se
corrigió también que el índice del cilindro de lotes no se restauraba junto
con el resto del estado (mostraba un lote distinto al que estaba activo).

## 7. Flujo de lote propio (`63939b0`)

- Las tres formas de traer un lote (plano, medidas, dirección) pasaron de
  pestañas idénticas a tarjetas que explican qué piden y qué devuelven, con
  "Tengo el plano" marcado como **Lo mejor**.
- La explicación de qué es un retiro se movió detrás de un `<details>`
  colapsable — antes eran 3 párrafos antes de poder capturar nada.
- Quien entra por "Ya tengo mi lote" ve ese bloque primero, con el catálogo
  de la subdivisión debajo — antes aterrizaba en el catálogo de 8 lotes que
  no le servían.

## 8. Tutorial guiado del paso 4 (`b2529b3`, `e6a9449`)

El paso de interior y zonas (el más denso: paleta + cuartos + zonas a la vez)
se convirtió en un tutorial estilo videojuego:

- Las etapas se abren una por una (gama → cuartos → zonas), con animación de
  latido/destello en lo que toca elegir ahora.
- Lo que aún no toca se ve apagado y bloqueado.
- La ventana se desplaza sola hasta la etapa activa y deja el cursor puesto.
- **Corrección importante**: el bloqueo de scroll durante la guía se probó y
  se quitó — la gama y las zonas son más altas que la ventana, así que
  bloquear el scroll dejaba al cliente sin poder ver las opciones que se le
  pedía elegir. Lo que mantiene el foco es que las etapas futuras están
  apagadas, no que el scroll esté congelado.
- Al terminar la última etapa se libera todo para poder subir y corregir.

## 9. Gesto único de selección (`f77d00e`, `c96cfa5`)

Se unificó cómo se elige/quita una opción en toda la app: tocar la fila
elige (el signo "+" gira 45° y se lee como "×"), y esa "×" es el único punto
que deshace la elección — rozar el resto de la fila ya no la quita por
accidente.

Para fachada y paleta de color específicamente (selección única, no
múltiple): mientras haya algo elegido, el resto de las opciones queda
bloqueado — hay que quitar la actual con su "×" antes de poder elegir otra.
El plano (floorplan) queda exento a propósito: ahí sí se permite cambiar
directo, porque usa modo carrusel y no lista.

## 10. Limpieza del catálogo de zonas y arreglos de estabilidad (`c96cfa5`)

- Se quitó "Recámara 2" del catálogo de zonas — las recámaras ya se controlan
  con el contador del paso 4; tenerla en los dos lados era pedir lo mismo dos
  veces.
- Se corrigió el brinco frenético que ocurría al pasar el cursor sobre la
  tabla de zonas (la tarjeta de detalle cambiaba de alto con cada zona,
  moviendo la lista de abajo, lo que sacaba el cursor de la fila y disparaba
  otro cambio sin fin) — se fijó la altura de la tarjeta.
- Las columnas de "zonas agregadas" y "otras zonas" ahora se desplazan dentro
  de su propia caja en vez de estirar el paso completo.
- En la mesa del arquitecto: el icono de cada zona ahora va siempre pegado a
  su nombre (antes se escondía cuando había foto), y las piezas se
  recolocaron en franjas que no se pisan entre sí (la ficha caía encima del
  cajetín del plano y tapaba su nombre).

## 11. Envío de correo real (`e3d0e48`, `59bbf7f`, `50c1eb7`)

- `contact@lagranpiedrallc.com` es ahora el destino real por defecto en
  `/api/enviar-resumen` (va en el código porque no es secreto, a diferencia
  de la llave de Resend). `LGP_CORREO_ARQUITECTOS` queda opcional, solo para
  cambiar el destino o agregar más destinatarios.
- El pie de página se actualizó con el correo real.
- **Se corrigió el "Agenda una cita" del header** — el mismo hallazgo #1 de
  la auditoría inicial, que nunca se había arreglado: era un no-op literal.
  Ahora manda la misma ficha completa por la misma ruta que el paso 7.
- La pantalla de éxito se simplificó a un check + "Se ha enviado con éxito."
  + botón "Cerrar" (antes explicaba seguimiento a 24h/72h/7 días — de más en
  ese momento).
- **Se corrigió que "Cerrar" en verdad regresara al inicio**: antes solo
  cerraba la ventana dejando el scroll de fondo donde se había abierto, y el
  combo ya enviado seguía en el `localStorage` ofreciendo "retomar" algo que
  ya le había llegado al arquitecto. Ahora limpia el guardado, reinicia el
  configurador entero y sube arriba del todo.
- Se quitó el botón "Siguiente" del paso 7 (el último paso — no había paso 8,
  así que el botón se veía activo pero no llevaba a ningún lado).

Sigue pendiente para que el envío salga de verdad: `RESEND_API_KEY` y
`LGP_CORREO_REMITENTE` (ver `.env.example` / `.env.local`, ya con la
estructura lista).

## 12. Paso 5: se quitó el análisis por IA del brief (`b2529b3`)

El botón "Analizar mi brief" y su lectura automática se quitaron — el brief
es una nota para el arquitecto, no una lista de compras que haya que
interpretar. Viaja tal cual, con las palabras del cliente, en la ficha. El
FAQ que prometía esta función se reescribió.

## 13. Rediseño de inicio (`dacc939`, `d368e14`, `fc97d19`, `fabdd9c`)

- Se quitó la fila de etiquetas ("Casas custom", "Spec homes", etc.) de "Por
  qué nosotros".
- **"Lugares disponibles" se rediseñó como tarjeta foto-hero**, siguiendo un
  wireframe del cliente: la foto de acceso a la subdivisión de fondo, título
  y ubicación superpuestos sobre un degradado, y abajo la disponibilidad y el
  botón "Ver mapa completo". El plano interactivo de lotes debajo quedó
  intacto.
  - La foto real (`public/subdivision/enclave-entrada.jpg`) ya está
    instalada y cargando correctamente.
  - Se restauró el título de sección "LUGARES DISPONIBLES" (`<h2>`).
  - La disponibilidad se rediseñó como cifra grande ("**8** LOTES
    DISPONIBLES"), con el mismo tratamiento visual que los números del hero
    principal.
  - Se agregó una capa de opacidad ligera sobre la foto para que no compita
    con el texto y quede a tono con el resto del sitio.
  - La sección se movió de lugar: ahora queda justo debajo de "Por qué
    nosotros" (antes de "La obra").

**Orden final de la página de inicio:** Hero → Por qué nosotros → Lugares
disponibles → La obra → Personaliza tu casa (lote propio) → FAQ → Contacto.

## 14. Sistema de diseño, retícula y movimiento (sin commitear)

Sesión con la skill **impeccable** instalada en `.agents/skills/impeccable`
(auditada antes de usarla: telemetría opcional, hard-skip de `.env`/`.pem`,
CORS de loopback bien resuelto; el hook automático quedó apagado).

### 14.1 Contexto escrito por primera vez

Dos archivos nuevos en la raíz del proyecto (un nivel arriba de `lgp-web`):

- **`PRODUCT.md`** — verdad de producto. Lo que no estaba en ningún lado:
  - El **cliente internacional** dejó de ser una aspiración vaga. Son dos
    orígenes con un mismo destino: mexicano que cruza a comprar en McAllen, y
    estadounidense de fuera del Valle. El primero ya tiene el idioma pero
    necesita moneda y una visita que es viaje planeado; el segundo necesita
    inglés **y** que McAllen se le explique como lugar.
  - **Éxito = el lead, con la experiencia como el medio.** Escrito como regla
    de desempate: cuando una decisión de diseño enfrente experiencia contra
    ficha completa, gana la ficha.
  - Ausencias registradas para que nadie las invente: cero testimonios, casos,
    prensa, precios y años en el mercado.
- **`DESIGN.md`** + **`.impeccable/design.json`** — el sistema visual que ya
  existía, extraído del código y por fin escrito. Norte creativo: **"La Mesa
  del Arquitecto"**. Reglas nombradas: canto vivo (radio 0 salvo círculos),
  dato en mono, interletrado inverso al tamaño, gris siempre cálido, plano en
  reposo.

El manual de identidad (`Manual_LGP.pdf`) es autoridad de marca. El cliente
confirmó que **en tipografía es orientativo** (la marca no está atada a
Gotham); el resto —blanco/negro dominante, saturados solo como acento, formas
rectas, prohibiciones del logo— sigue siendo vinculante.

### 14.2 Retícula: de seis anchos a uno

El problema de fondo del inicio no era el espacio en blanco, era que **había
seis anchos de contenedor distintos** (1240, 1080, 1000, 760, 660 y ancho
completo). Ningún borde izquierdo coincidía con el de arriba al bajar.

- Un solo ancho estructural: `--lgp-ancho: 1180px` vía `.lgp-contenedor`.
  Comprobado: los seis títulos de la página caen en el mismo `x`.
- **Ritmo vertical real** en lugar del 110/100 repetido en todo:
  `--lgp-y-tema` (abre tema), `--lgp-y-bloque` (separa emparentados),
  `--lgp-y-cierre` (cierra contra la siguiente).
- **El hueco de "Por qué nosotros" tenía causa exacta**: la rejilla de tarjetas
  llevaba `marginBottom: 56px` siendo el último hijo, apilado sobre los 100px
  de padding de la sección — 156px de vacío puro. Eliminado.
- Las tres razones dejaron de ser tarjetas iguales con rótulos `01/02/03` (no
  son una secuencia, son tres argumentos paralelos): ahora son columnas
  divididas por filete vertical, que en móvil se vuelve horizontal.
- La tira de "La obra" sigue de borde a borde pero su primera foto arranca a
  plomo con el título; antes había más de 100px de desfase en monitor ancho.
- El FAQ conserva su columna de 760px pero deja de ir centrado: arranca en el
  mismo borde que todo lo demás. Contacto sí queda centrado, a propósito.

Resultado: 5312px → 4979px de alto en escritorio, sin quitar contenido.

### 14.3 Movimiento

Momento de autoría: **el telón**. La franja carmín que ya confirma cada
elección, escalada a pantalla completa — al abrir el configurador la franja
cruza y detrás queda la ventana ya puesta. `VentanaEnfocada` no tenía ninguna
animación (`return null` en seco); ahora se mantiene montada durante la salida,
que dura 220ms contra los 620ms de entrada.

Al cerrar **el telón no vuelve a cruzar**: detrás ya no queda nada, así que el
segundo barrido sería un destello carmín tapando una pantalla vacía.

- El check de "Se ha enviado con éxito" era el carácter `✓` de la tipografía.
  Ahora es SVG y **el trazo se dibuja** — se lee como "acaba de pasar".
- Las tres razones escalonan al entrar en pantalla (`IntersectionObserver`,
  90ms entre cada una). Si el script falla se quedan visibles, nunca al revés.
- **No se puso revelación al hacer scroll en todas las secciones**, a
  propósito: convertir cada sección en una entrada idéntica es lo que hace que
  un sitio se sienta de plantilla.
- `prefers-reduced-motion` con alternativa real: se va el desplazamiento, se
  quedan el cambio de color y el check completo.

### 14.4 Botones: una sola ley

Primero se usó la franja carmín como hover. **Fue un error, por dos razones**,
y conviene dejarlo escrito para no repetirlo:

1. La franja significa **elegido**. Un hover no es una decisión; ponerle el
   gesto de selección gasta el gesto y lo deja sin significado.
2. Barría con `#8A2249`, que **no está en la paleta del manual**.

Ley nueva: **el botón intercambia figura y fondo**. Sin desplazamiento, 180ms,
y sin un solo color que no esté ya en el reposo del propio botón — por
construcción es imposible que se cuele algo fuera del manual.

Cuatro variantes en `globals.css`: `.lgp-btn-carmin`, `-tinta`, `-fantasma`,
`-sobre-foto`. El color salió de los `style` en línea al sistema; sin eso la
congruencia sería coincidencia, porque el estilo en línea le gana a la clase.

La auditoría de congruencia encontró:

- **`Subir mi lote` era tinta** y abre el configurador igual que "Diseñar mi
  casa". Misma acción, otro color → ahora carmín. La ley: *el carmín marca la
  acción que avanza, una sola por región.*
- **`Agendar mi cita` no tenía ningún feedback** — el botón que convierte, el
  más importante de la página.
- **`Agenda una cita` del header tampoco.** Se le agregó, pero **queda tinta a
  propósito**: la cabecera está en pantalla el 100% del tiempo y un bloque
  carmín permanente convierte el acento en constante.

**Sobre el `#8A2249`:** aparece 11 veces más, pero como color de **texto** sobre
fondos claros, y ahí está bien ganado. Medido: el carmín del manual da
**4.31:1 sobre blanco, que reprueba AA** (mínimo 4.5); el `#8A2249` da
**8.73:1**. Existe por legibilidad. Estaba mal como relleno de superficie, no
como texto. Por eso el hover del botón carmín usa `#8A2249` para el texto y
conserva `#F2004B` en el filete, que no tiene exigencia de contraste.

### 14.5 Panel "elegido" eliminado

`PanelElegido` salía en tres pasos (*Plano elegido*, *Fachada elegida*, *Gama
elegida*) y solo repetía el nombre que la tarjeta de foco ya muestra en grande
a menos de 100px. Su tercer renglón, "Sin costo extra", era un texto por
defecto que afirmaba un hecho de precio sin respaldo.

Eliminado del componente compartido `PasoDecision`, con sus props
(`tituloPanel`, `vacioPanel`) y el componente en `DecisionUI`. **`ZonasPanel`
conserva su propia columna**: ahí no es redundante, porque lista varias zonas a
la vez y ninguna tarjeta las repite.

Se perdió con él su estado vacío ("Ninguna seleccionada. Elige una de la
lista.").

### 14.6 Nombres de fachada

`Escandinavo moderno` → **Escandinavo**, `Farm moderno` → **Farm style**,
`Piedra blanca` → **Moderno**, `Híbrido negro` → **Mediterráneo**.

Las `key` (`esc`, `farm`, `piedra`, `negro`) **no se tocaron**: son lo que se
guarda en `localStorage`, y cambiarlas dejaría inservible la configuración a
medias de cualquier cliente que vuelva.

---

## Pendientes conocidos

- **`RESEND_API_KEY`** y **`LGP_CORREO_REMITENTE`** — sin ellas, "Enviar al
  arquitecto" y "Agenda una cita" responden con honestidad que el envío
  automático no está activo, en vez de fingir que salió. `.env.local` ya
  tiene la estructura lista, solo faltan los valores.
- **`ANTHROPIC_API_KEY`** en Vercel — sin ella, el análisis de plano/imagen y
  de dirección del paso 1 no funciona (sigue funcionando la captura manual de
  medidas).
- **Teléfono del pie sigue siendo de relleno** (`(956) 000 0000`), igual que
  el enlace a Instagram sin cuenta. Hasta que el teléfono sea real no se
  puede publicar JSON-LD de negocio local.
- **`NEXT_PUBLIC_LGP_WHATSAPP`** — sin ella el botón de WhatsApp del cierre no
  se dibuja en producción (ver 20.3). Es el mismo pendiente que el teléfono de
  arriba: falta el número real, no el código.
- **`NEXT_PUBLIC_SITE_URL`** — falta para que las tarjetas de compartir
  (redes sociales) apunten al dominio real en vez de a `localhost`.
- El sitio sigue solo en español y asume contexto 100% local (pies, retiros
  de Texas, lada 956, cita presencial). Para el cliente internacional que
  busca esta constructora falta idioma, unidades, moneda y agenda remota.
- No hay render fotográfico para el plano TH (townhouse) — cae al diagrama
  SVG esquemático.
- Trabajo en curso, sin commitear, sobre paletas de cocina
  (`public/cocina/*`, `scripts/mascaras-cocina.js`,
  `scripts/prueba-paletas.js`, `scripts/render-paletas.js`) — no se tocó en
  esta sesión, sigue abierto. En el árbol de trabajo también hay cambios sin
  commitear en `PresupuestoBar.tsx`, `lib/assets.ts`, `lib/ficha.ts` y
  `lib/guardado.ts` que **no son de la sesión 14**; conviene revisar de dónde
  salen antes de commitear nada.

### Nuevos, de la sesión 14

- **Dos descripciones de fachada contradicen su nombre nuevo.** "Moderno" sigue
  diciendo *"muro de piedra caliza local y estuco liso"* y "Mediterráneo" dice
  *"estuco carbón, celosía geométrica de concreto"* — que describe justo lo
  contrario. No se reescribieron a propósito: son afirmaciones sobre lo que la
  constructora sí ofrece y las decide el cliente. Ese texto se ve en la tarjeta
  del paso y viaja en la ficha al arquitecto.
- **Faltan los renders de fachada.** Existen `escandinavo.jpg`, `farm.jpg`,
  `modern.jpg` y `mediterraneo.jpg` en la carpeta del proyecto —los cuatro
  nombres exactos— pero ninguna está en `public/`, así que el paso 2 sigue
  cayendo al marcador gris.
- **8 casos de `borderLeft: "3px solid"`** en los avisos del configurador.
  Contradice un "Don't" del propio `DESIGN.md`, y el detector lo señala como el
  tell más reconocible de una UI generada por IA.
- **Los 8 botones del FAQ llevan `lgp-hover-zoom`**, que escala una fila de
  ancho completo y mueve el texto al pasar el cursor. En una tarjeta funciona;
  en una fila de acordeón, no.
- **`DESIGN.md` quedó desfasado** respecto a 14.3 y 14.4: documenta la franja
  en los botones y no recoge ni la ley de inversión, ni el telón, ni la función
  real del `#8A2249` como tono de texto legible.
- **Se perdió el estado vacío** de los pasos de elección única al quitar
  `PanelElegido` (ver 14.5). Si hace falta esa indicación, va como una línea
  bajo el título del paso, no recuperando la columna.
- El escaneo de navegador del detector (contraste real, desbordes renderizados)
  necesita `puppeteer`, que no está instalado. Solo corrió el análisis estático.

## 15. Maquetas isométricas en el paso de fachada (sin commitear)

El paso 2 mostraba cada estilo con un pictograma de línea. A cuatro estilos
distintos les tocaban cuatro casitas casi idénticas —rectángulo con techo—, así
que el dibujo no ayudaba a decidir: lo único que distinguía a "Escandinavo" de
"Mediterráneo" era leer el nombre.

En su lugar entran las cuatro maquetas isométricas que mandó el cliente
(`visuales/fachada/`), que sí muestran lo que separa a un estilo de otro: el
volumen, las aguas del techo, los pisos y los vanos.

- **`scripts/fachadas-iso.js`** normaliza los originales. Venían recortados
  sobre transparencia pero con encuadres y escalas distintas: uno a 2048 px con
  la casa chica en medio, otro a 896 px con la casa casi tocando el borde.
  El script encuadra por el volumen construido (no por la sombra, que
  descentraría la casa hacia el lado contrario al sol), y saca a todos el mismo
  lienzo cuadrado con el mismo aire.
- **Dos tamaños por estilo**, no uno escalado. El grande (640²) es el render tal
  cual para la tarjeta de foco. El chico (`-mini`, 128²) lleva menos aire y las
  líneas oscurecidas: a 30 px una maqueta blanca sobre placa blanca se
  desaparece.
- **La fila usa `'muestra'` y no `'icono'`.** El modo `icono` invierte el dibujo
  a blanco sobre el carmín de la fila elegida, y eso borraría las líneas que
  dibujan el volumen. La miniatura va sobre placa blanca con marco, como las
  paletas de interior.
- Los nombres del render no son las claves del configurador: `moderno.png` es
  la clave `piedra` y `mediterraneo.png` es `negro` (ver `FACHADAS` en
  `lib/data.ts`, donde ya estaba anotado que esas dos claves dejaron de
  describir a su estilo).
- `FachadaIcon` y `FACHADA_ICONS` se quitaron de `components/ConfigIcons.tsx`.

Verificado en el navegador: paso 2 con la tarjeta de foco y las cuatro filas, y
paso 5, donde la ficha de fachada de la mesa del arquitecto usa la mini.

## 16. Fachada grande, acuse de elección y recorrido variable (sin commitear)

Tres cosas, las tres alrededor del paso de fachada.

**La maqueta se ve en grande.** La tarjeta de foco de `PasoDecision` tenía 230 px
fijos, que alcanzan para una paleta de tres franjas pero no para una decisión
que se toma mirando el volumen de la casa. Ahora acepta `visualAncho` y
`visualAlto`; la fachada usa 380×360 y la maqueta pasó de 170 a 334 px. La
imagen va con `max-height`, no con alto fijo, para que en pantalla chica se
achique en vez de quedar cortada por el marco.

**Acuse de elección en la tarjeta.** La lista de abajo se cubría de carmín al
elegir, pero la tarjeta grande de arriba —donde el cliente está mirando—
cambiaba sin decir nada. Se le puso el mismo gesto de la franja a escala de
tarjeta: el carmín cruza (`lgpBarridoFoco`) y la pieza se asienta detrás
(`lgpElegidaA/B`). Con `prefers-reduced-motion` el barrido no se desplaza:
destella en su lugar, porque movimiento reducido no es quedarse sin acuse.

**Dónde aplica y dónde no.** Se probó en los tres pasos de elección y se dejó
solo en el de interior (`sinAcuse` lo apaga en floorplan y en fachada). En esos
dos la imagen no es un adorno: es el contenido que el cliente está comparando, y
taparla con una cortina carmín justo en el instante de elegirla esconde lo único
que quería ver de cerca. La paleta de interior es un dato chico —tres franjas de
color— y ahí la cortina suma en vez de estorbar. El acuse de esos dos pasos
sigue siendo el de siempre: la fila que se cubre de carmín y, en el carrusel, el
sello de "plano elegido".

**El recorrido ya no es siempre de seis pasos.** En los lotes de la subdivisión
la casa se entrega con su fachada ya diseñada y aprobada, así que el paso 2 no
se muestra apagado: sale del recorrido y el contador pasa a cinco.

- La regla vive en `REGLAS_LOTE` (`fachadaFija` + `motivoFachada`), junto a las
  otras del reglamento, no repetida lote por lote.
- `paso` sigue siendo el número de siempre (2 = fachada) para no romper
  guardados viejos ni los enlaces de "te falta X". Lo que se deriva es
  `pasosDelRecorrido`, y de ahí salen el numerito del stepper, el "paso X de Y",
  y los saltos de atrás/siguiente, que van al vecino **del recorrido**.
- Al cambiar a un lote con fachada fija se borra la fachada elegida antes —si
  no, quedaría en el resumen y en la ficha del arquitecto un estilo que ese lote
  no admite— y si el cliente está parado en ese paso, se le pasa al siguiente.
- Fuera del paso 2 la fachada no se reporta como "sin elegir" (no había nada que
  elegir) ni se le inventa un estilo del catálogo: dice **"Definida por la
  subdivisión"** en el resumen y en la ficha, y **"De la subdivisión"** en la
  hoja de la mesa del arquitecto, que se queda en su lugar —que desapareciera se
  leería como que la casa no tiene fachada.
- La tarjeta de "dejaste una casa a medias" calcula su "paso X de Y" con el lote
  que se guardó, no con el activo.

Verificado en el navegador con las dos rutas: lote L-73 de Enclave (cinco pasos,
sin paso de fachada, guardado en paso 2 redirigido, resumen y mesa con el texto
de subdivisión) y lote propio tipo libre (seis pasos, maqueta a 334 px, barrido
carmín al elegir).

### Pendiente que salió de aquí

El hero sigue diciendo **"7 pasos, cero sorpresas"**. Ya estaba desfasado desde
que el lote dejó de ser un paso (eran 6), y ahora además el número depende del
lote: 6 con lote propio, 5 en Enclave. Es copy de marca, así que se deja como
está hasta que el cliente decida el número.

## 17. La captura de lote propio, sintetizada (sin commitear)

La pantalla previa ("Sé las medidas") tenía más texto que interfaz: un párrafo
de intro, otro dentro de la tarjeta, un tercero explicando los retiros, un
`<details>` con la definición de retiro y dónde encontrarlo, y un pie que
declaraba que esta vía era la más confiable. La previa del terreno —lo único
que de verdad contesta la pregunta del cliente— estaba hasta el final, después
de todo eso.

Se invirtió: **manda el dibujo, no la explicación.**

- Fuera el párrafo de intro, el de la tarjeta (los tres modos ya se explican
  solos en sus propias tarjetas) y el pie de "la vía más confiable". Del texto
  de la tarjeta queda solo el dato que no está en ningún otro lado: que con
  lote propio se abren los tres floorplans.
- Fuera el `<details>` de "¿qué es un retiro?". Lo sustituye el dibujo: al
  cambiar un retiro se ve moverse la franja gris y encogerse el rectángulo
  rosa, que explica el concepto mejor que el párrafo.
- **Los retiros dejaron de ser campos.** Eran tres cajas de texto que parecían
  pedir un dato que casi ningún cliente trae a la mano; ahora son el pie del
  tablero, en solo lectura: "Retiros aplicados — Frente 25' · Fondo 20' · Cada
  lado 6'". Los únicos dos campos escribibles del bloque son frente y fondo.
- **Lo que no se quitó:** el aviso de que los retiros son un supuesto nuestro y
  no el reglamento de su ciudad. Es un dato marcado como supuesto (ver
  `PRODUCT.md`), así que no se puede esconder — vive en el pie del tablero,
  junto a las cifras que produjo.
- **Se perdió la corrección de retiros.** Antes, quien conocía los suyos podía
  escribirlos y el cálculo se ajustaba. Hoy no hay por dónde: si los de su
  ciudad son otros, la huella queda mal hasta la cita con el arquitecto. La vía
  que sí los lee sigue abierta —"Tengo el plano" los saca del plat—, pero si
  hace falta devolver el ajuste manual, va como un control discreto que se
  despliega desde el pie del tablero, no como tres campos de entrada.
- La previa (`previaMedidas`) se recalcula con cada tecla y ahora da las **dos**
  lecturas que el cliente necesita, cada una con su área y sus dimensiones:
  **Lote** (7,200 ft² · 60' × 120') y **Construible en planta baja**
  (3,000 ft² · 40' × 75'). Antes solo estaba la huella.
- El botón pasó de estar entre los campos a estar **después** de la previa, y
  de "Calcular" a "Usar estas medidas": ya no hay nada que calcular al
  apretarlo —el número lleva rato en pantalla—, lo que hace es confirmar.

El bloque quedó en tres piezas: dos campos, un tablero y un botón.

Verificado en el navegador a 1100px y en móvil: al escribir 60 × 120 aparece el
terreno dibujado con sus dos cifras, y al cambiar el fondo a 95 el dibujo y las
cifras se actualizan en el mismo golpe de tecla (5,700 ft² de lote, 2,000 ft²
construibles). En el bloque quedan exactamente dos campos escribibles.

## 18. Crítica de diseño, accesibilidad, fotografía real y carruseles (sin commitear)

Sesión larga. Arrancó con una crítica formal y de ahí salió el resto.

### 18.1 La crítica (dual-agent)

Se corrió `$impeccable critique` sobre `components/HomeConfigurator.tsx` con dos
evaluaciones aisladas: una de dirección de diseño (recorrido completo en
escritorio y móvil, heurísticas, carga cognitiva) y otra de evidencia dura
(detector mecánico, overlay inyectado, contraste medido, objetivos táctiles,
foco, consola y red). Aisladas a propósito: si la de diseño hubiera visto los
hallazgos del detector, su juicio habría quedado anclado a lo que la máquina
sabe medir.

**Resultado: 27/40** — banda "acceptable". Carga cognitiva ALTA (5 de 8 fallos).
El informe quedó guardado en
`../.impeccable/critique/2026-08-16T19-18-17Z__lgp-web-components-homeconfigurator-tsx.md`.

Veredicto de especificidad: **partido en dos**. El configurador está autorado
(la mesa del arquitecto, la barra de presupuesto como barra de vida); la página
de inicio es intercambiable con cualquier home builder de Texas. El fondo de
partículas hexagonales en canvas se señaló como efecto de portafolio que
contradice la premisa declarada "la superficie es papel, no pantalla" — sigue
abierto, el cliente no ha decidido.

### 18.2 Accesibilidad del configurador (era P0)

El foco **nunca entraba** a la ventana y el Tab se escapaba al contenido de
atrás. Causa: el efecto de foco dependía solo de `abierto`, y en ese commit
`montado` seguía en `false`, el componente devolvía `null` y la ref era `null`,
así que `.focus()` no hacía nada — y el efecto no volvía a correr.

- Se separó la entrada del foco a un efecto que observa `montado`.
- La trampa de Tab pasó a **contener** de verdad: antes solo miraba si el activo
  era el primero o el último de la caja, así que cualquier foco ya fuera pasaba
  de largo.
- Se añadió `inert` al fondo. Marcar solo los hijos de `<body>` no sirve: la
  ventana se renderiza en el mismo árbol que la página, así que hay que subir
  nivel por nivel apagando a los hermanos de cada ancestro.

Medido: de **28 elementos enfocables alcanzables detrás** a **0**.

Toda esa lógica se extrajo a `lib/useVentanaModal.ts`, compartida con el visor
de fotos. **Hay un orden de efectos que no se puede alterar**: el de `inert` va
antes que el de foco, porque React ejecuta las limpiezas en el orden de
declaración y devolver el foco a un elemento que sigue inerte falla en silencio.
Está anotado en el archivo; costó un error encontrarlo.

### 18.3 Fotografía: una foto publicada no era nuestra

`public/finished-house.jpg` se publicaba con el `alt` "Casa terminada en
Edinburg" y encabezaba "La obra" — la sección cuyo texto promete *"sin render
que prometa lo que no se entrega"*. Al abrirla: casa modernista de patio con
alberca de espejo y encinos maduros, sin relación con las cinco casas reales del
RGV. **El cliente confirmó que no era suya.** Se retiró de "La obra" y de la
tarjeta de detalle de lote (el archivo no se borró, solo dejó de usarse).

En su lugar entraron **16 fotos propias** (5 fachadas + 11 interiores),
convertidas a 1600px con ffmpeg, en `public/obra/`. Se alternan fachada e
interior a propósito: una tira de puras fachadas se lee como catálogo
inmobiliario, y lo que hay que probar es que el acabado de adentro aguanta el de
afuera. Los cuatro marcadores rayados desaparecieron.

`public/subdivision/casa modelo enclave.jpeg` es un **render CGI**, no una foto.
Se detectó antes de que entrara al código. Decisión del cliente: usarlo, pero
**rotulado** — `RENDER — NO ES FOTO DE OBRA`, sobre la imagen y no en el pie.
El `tipo` vive en `lib/data.ts` con una regla escrita: quien añada una imagen
ahí declara qué es.

### 18.4 Contraste

`grep 8A2249` devolvía **cero**: la Regla del Carmín que se Lee estaba escrita
en DESIGN.md y no implementada.

- **100 colores de texto** corregidos con un script, solo donde el gris pintaba
  letras (no bordes ni rellenos): `#8A8F91`→`#5C6163` (3.16→6.06),
  `#A9ADAF`/`#B7BABB`/`#C4C7C8`→`#6E7375` (1.64–2.18 → 4.65).
- `#8A2249` aplicado donde faltaba, incluida la regla global `a:hover` que
  pintaba de carmín el texto de **todos** los enlaces.
- **Decisión de marca a revisar:** el botón carmín daba 4.31:1 con su etiqueta
  blanca de 10px. Solo el **relleno del botón** bajó a `#EB004B` (4.53:1); el
  filete, la franja, las viñetas, el telón y la firma conservan `#F2004B`. Es el
  mismo precedente que DESIGN.md ya sentó con el Carmín Legible, pero es la
  marca: se revierte en una línea si el cliente no lo aprueba.

Medido: de ~35 fallos de gris a **0**.

### 18.5 Objetivos táctiles

De **9 elementos bajo 44px** en móvil a **0**. La barra inferior medía **15px de
alto** —un tercio del piso— y es la navegación principal del teléfono. También:
riel de pasos (37→44), Atrás/Siguiente, enlaces del pie y el enlace de salto.

Los lotes clicables del plat medían **35×13.6px**; sigue pendiente.

### 18.6 Carrusel de "La obra"

`components/TiraObra.tsx` + `components/VisorObra.tsx` + `lib/obra.ts`.

- Flechas laterales que **se retiran** en cada extremo en vez de quedarse
  apagadas: un control ausente ya dijo que no hay más.
- Cada salto avanza **una foto, no una pantalla** — con `scroll-snap`, saltar de
  pantalla en pantalla deja la siguiente a medias.
- Visor a pantalla completa al tocar cualquier foto, con flechas de teclado.
- Medir el scroll solo con el evento `scroll` dejaba el estado obsoleto; se
  añadió `scrollend` y un remedido en `requestAnimationFrame` + `setTimeout`.
- **No reusa el telón carmín**: la franja significa *elegido*, y abrir una foto
  no es una decisión.

### 18.7 Carrusel de la subdivisión

`components/CarruselSubdivision.tsx`. Foto de acceso + render, turnándose cada
**5 s**, fundido en cruz (no deslizamiento: el nombre de la subdivisión va fijo
encima y se arrastraría).

Lleva **botón de pausa** porque WCAG 2.2.2 lo exige para movimiento automático
de más de cinco segundos; también se detiene con el cursor encima, con el foco
dentro, con el visor abierto, y no arranca con `prefers-reduced-motion`. Elegir
un punto a mano detiene la rotación: un carrusel que te arrebata la imagen dos
segundos después de elegirla es el motivo por el que la gente los detesta.

### 18.8 Textura de cubos y deriva

`scripts/textura-cubos.js` genera `public/textura-cubos.svg` **desde los mismos
valores del canvas del fondo** (S=46, las tres caras, `globalAlpha` 0.42
compuesto contra el papel). Se genera y no se dibuja a mano para que las dos
superficies no puedan divergir.

Va detrás de los sprites de fachada y floorplan vía `texturaFondo` en
`OpcionDecision` — **declarado, no deducido**: las fachadas dibujan su render en
`visual` y no en `imagen`, así que deducirlo de `imagen` las dejaba fuera sin
avisar. Deriva diagonal de un mosaico completo en **40 s** animando
`background-position` (no un `transform`, que arrastraría los sprites).

Dos trampas anotadas en el CSS: el `background: '#fff'` en línea del componente
mataba la imagen de fondo (un shorthand en línea pone `background-image: none`),
y `background-size` es obligatorio o el SVG se estira al tamaño de la caja.

### 18.9 La sombra de la fachada: construida y retirada

Se construyó un sprite de sombra bajo las maquetas y se iteró bastante — elipse,
giro isométrico, degradado radial, meseta opaca, tamaños y posiciones marcados
por el cliente sobre capturas anotadas. **El cliente pidió eliminarla** y se
quitó por completo: el `<span>`, la regla CSS y los estilos de apilamiento que
solo existían para ella.

Dos cosas que conviene recordar si se retoma:

- Lo que hace oscura a una sombra en degradado **no es el primer color, es la
  meseta**. Un degradado que sale de tinta opaca en el 0% tiene ese negro en un
  único punto y se lee gris claro.
- El enfoque que se comportaba de forma fiable era el simple: **elipse centrada
  en su propia caja**. Al girarla con `transform-origin` descentrado combinado
  con `translateX(-50%)`, la elipse se desplazaba fuera de vista.

**Nota de método, para la próxima sesión:** las capturas del panel de vista
previa devolvían estados viejos repetidamente, y eso llevó a afirmar tres veces
cosas equivocadas sobre lo que se veía. Lo que sí resultó fiable:
`getBoundingClientRect`, `getComputedStyle`, componer los colores a mano, y
montar un captador propio de `console.error` en vez de leer el búfer del panel
(que es acumulativo de toda la sesión y no se vacía ni al reiniciar el servidor).

### 18.10 Deuda menor cerrada

- **11 tildes** en pantallas de conversión, incluida `"Asi quedo tu casa"` — el
  titular de la mejor pantalla del producto.
- **Teléfono falso retirado del pie.** Estaba publicado como enlace `tel:`
  activo; alguien lo iba a marcar. El correo se queda, que sí es real.
- `"7 pasos"` → **`"5–6, según tu lote"`**, que es lo que el sistema hace.
- 8 side-tabs de 3px a filete de 1px; 4 radios a canto vivo; sombra azulada a
  tinta; sombra en reposo fuera de vocabulario sustituida por filete; gris frío
  `#DDE6E0` fuera; sello de 8px a 9px.
- **Crash real corregido:** `drawImage` con canvas de 0×0 en el fondo hexagonal.
- `aria-valuetext` en la barra de presupuesto (anunciaba "100%" cuando quedaban
  0 ft² libres); `aria-label` y `aria-current` en el riel de pasos, que antes
  daba el mismo nombre accesible a dos pasos distintos.
- La vista previa de la gama de interior renderizaba **en blanco**: el span no
  tenía `width` y sus hijos `flex-basis: 0` sin contenido lo dejaban en 0px.

### 18.11 Lo que quedó abierto

- **El inglés no está empezado.** El cliente lo pidió completo; es la pieza más
  grande de la lista y merece su propio pase (rutas, unidades, moneda y qué
  hacer con la cita presencial para quien vive a 600 millas).
- **Tres decisiones de copy sin respuesta:** el titular del hero (`"aquí el
  cliente firma el plano"` no es cierto en Enclave, donde el plano viene
  firmado), el `"100% SMART HOME INTEGRADO"` (100% ¿de qué?), y si el fondo de
  partículas se queda.
- El plat sigue con lotes de 35×13.6px en móvil.
- `public/` pesa 21MB, 18 de ellos en `/cocina` (15 PNG fotográficos) más tres
  `_prueba-*` servidos en producción.

## 19. Movimiento: la página, el acuse de elección y la hoja (sin commitear)

Sesión dedicada al movimiento. Antes de esta sesión el configurador tenía un
lenguaje de animación resuelto y la **página de inicio estaba quieta de
principio a fin**; y dentro del configurador, los dos pasos más visuales —
floorplan y fachada— eran los únicos sin acuse de elección.

### 19.1 Cuatro momentos en la página de inicio

No es una revelación por sección: son cuatro gestos contados, cada uno con un
trabajo.

- **La firma que emerge.** `LA GRAN PIEDRA` en carmín cierra la página bajo una
  máscara que ya existía y que nada usaba. Ahora las dos líneas suben desde
  dentro de ella al llegar al pie, escalonadas 120 ms. Es el momento de autoría
  de la portada.
- **Las cifras que asientan.** Los tres datos del hero y el contador de lotes
  disponibles entran pasándose de largo y se acomodan — el gesto de `ftNum` que
  el configurador ya usaba para "este número acaba de calcularse". En el hero
  arrancan al cargar (escalonadas 110 ms); en "Lugares disponibles" esperan al
  mismo `IntersectionObserver` que ya servía a las tres razones.
- **La cabecera que se despega.** Llevaba su sombra puesta pegada al borde
  superior, donde no flota sobre nada. Ahora la gana al hacer scroll con
  `animation-timeline: scroll()` — sin listener, sin estado. Donde el navegador
  no lo soporta se queda la sombra de siempre.
- **La respuesta del FAQ.** Baja desde su propia pregunta en vez de aparecer.
  La fila perdió `.lgp-hover-zoom` (escalar una fila de ancho completo mueve el
  texto que se está leyendo) y ganó cambio de fondo más `aria-expanded`.

Y un defecto de accesibilidad que salió al revisar el movimiento: los **siete
campos del sitio** llevaban `outline: none` en línea y ningún estado de foco
propio. Ahora usan el anillo del sistema (2 px carmín, 2 px de separación).

### 19.2 Escuadras de registro: el acuse de floorplan y fachada

Estos dos pasos pasaban `sinAcuse` porque el barrido carmín tapa el render, que
ahí **es** el contenido. El resultado era que elegir un plano o una fachada no
confirmaba nada. La bandera se renombró a **`acuseEscuadras`**: ya no apaga el
acuse, lo cambia.

- **El encuadre.** Cuatro escuadras carmín de 26 px entran desde fuera del
  cuadro y se cierran sobre las esquinas del render, en pares diagonales
  (60 ms de desfase). Puestas a los 419 ms.
- **El disparo.** Un fogonazo blanco pica a 0.82 a los 464 ms —45 ms después de
  que el encuadre cierra— y decae en estela larga hasta apagarse a los 2.3 s.
  Las escuadras van *por encima* del destello (z-index 4 contra 3): el ojo las
  sigue a través del flash y aterriza en ellas.
- **El rebote del sprite.** La maqueta se comprime a 0.93 exactamente en el pico
  del flash y rebota a 1.035 mientras la luz decae. Va sobre la caja interior,
  no sobre el marco, para que el filete y las escuadras queden clavados.
- **El soltado.** Al quitar, las cuatro marcas se abren y se van por donde
  vinieron, en 260 ms contra los 400 de la entrada, con la curva invertida
  (la entrada llega desacelerando, la salida acelera al irse). Sin fogonazo: el
  destello dice "queda registrado" y dispararlo al borrar diría lo contrario.

Las escuadras **no son un instante, son estado**: se quedan mientras la opción a
la vista sea la elegida. El flash y el rebote sí son de un solo disparo, y
cuelgan de `asienta` —que solo cambia con la elección— para que recorrer el
carrusel no los vuelva a lanzar.

### 19.3 La banda transportadora

Al pulsar una flecha del carrusel, las dos maquetas viajan en la misma línea y
sentido: la que estaba sale por un costado mientras la nueva entra por el
contrario. La pieza saliente se desmonta sola al terminar su viaje.

La curva (`cubic-bezier(.34,.34,.58,1)`, 500 ms) reparte el recorrido —31 % del
camino al 25 % del tiempo, 67 % a la mitad, 92 % a tres cuartos— y frena al
final. Una cinta arrastra y se detiene; no acelera.

El nodo de la cinta **no se remonta** al navegar: el viaje se relanza por nombres
alternos A/B. Es lo que impide que el rebote de selección, que vive dentro, se
dispare cada vez que el cliente pasa por el plano que ya eligió.

### 19.4 La fachada, en carrusel

El paso de fachada era una lista: maqueta de 380 px y a su derecha media pantalla
vacía. Pasó a **carrusel**, igual que el floorplan — misma cinta, mismas
escuadras, mismo flash, mismo rebote, mismo botón de quitar.

- El visor pasó de `420px` clavados a `clamp(340px, 62vh, 680px)`, y se quitaron
  24 px de relleno duplicado: **el sprite creció de 366 × 366 a 532 × 532** en
  pantalla de 900.
- En carrusel, el texto va a la izquierda de la banda y las acciones ancladas al
  borde derecho (`space-between`). Aplica también al floorplan, que tenía el
  mismo hueco.
- **En móvil las flechas se montan sobre el visor**, en sus bordes: a los lados
  se comían 104 px de 375 y dejaban la maqueta en 205 px. Ahora el marco recupera
  el ancho completo (sprite 309 × 231) y las flechas subieron de 38 a 44 px, el
  piso táctil del sistema.
- Props nuevas `pieza` y `etiquetaElegido`: van dos y no una derivada porque el
  español tiene género — "plano elegido" pero "fachada elegida".

### 19.5 Quitar y bloquear

- **Botón "✕ Quitar"** junto al acuse. La lógica ya existía (`onSelect` alterna),
  pero desde el carrusel no había forma de llegar a ella: con el plano puesto solo
  quedaba una etiqueta muerta. En los lotes donde la subdivisión impone el plano
  el botón no aparece.
- **Con la elección hecha, las flechas se apagan** (`aria-disabled`, opacidad
  0.38, `not-allowed`) hasta que se quita la selección. Debajo, la línea que lo
  explica y ofrece la salida: *"Solo puedes llevar una. Para ver las demás, quita
  X con su ✕."* — regla de la casa: nada apagado sin explicación.
- **La tarjeta se congela**: con algo elegido, pasar el cursor por otra fila ya
  no cambia la imagen. Esas filas están bloqueadas; enseñar en grande algo que no
  se puede tomar es ofrecer lo que la propia fila niega.

### 19.6 La hoja sustituye al telón

El telón carmín que abría el configurador se sustituyó, a petición del cliente,
por una hoja que alguien avienta sobre el escritorio.

- **Al abrir:** la hoja llega desde fuera del cuadro (+216, −468), girada −5.5°,
  apoya por la esquina inferior izquierda y se asienta en 780 ms. El canto
  superior derecho —el que trae la mano— es el último en caer, 160 ms después.
- **Sin opacidad, en ningún sentido.** El papel dejó de vivir en el marco de la
  ventana y pasó a la hoja misma; el marco es transparente y detrás está la
  página, que es la mesa. Es lo que quitó el parpadeo en blanco.
- **Tres capas separadas** para que sea fluido: la hoja anima solo `transform`
  (compositor), la sombra es una capa aparte a la que solo se le anima la
  opacidad, y el canto es la esquina levantada.
- **Al cerrar:** la línea de doblez barre la hoja entera en diagonal —el frente
  se va comiendo y aparece el dorso carmín, cada vez más grande— y a los 180 ms
  arranca el tirón que se la lleva a (−595, +1038), hacia donde apunta la esquina.
  560 ms en total contra los 780 de entrada.
- La geometría del despliegue son dos `clip-path` interpolados: frente
  `(0,0)·(1−t,0)·(1,t)·(1,1)·(0,1)` con cinco vértices siempre, y dorso
  `(1−t,0)·(1,t)·(1−t,t)`. En t=1 coinciden, que es lo que pasa al doblar una
  hoja por su diagonal.

### 19.7 El canto es el botón de cerrar

La esquina doblada **se queda toda la sesión** y lleva la ✕ blanca: es por donde
se cierra la ventana. El **"CERRAR ✕" de la cabecera se retiró** — queda una sola
salida en pantalla en vez de dos que hacen lo mismo. Escape y el gesto de "atrás"
del teléfono siguen cerrando igual.

- La pintura va en `::before` y el blanco en el botón: `clip-path` recorta también
  los eventos de ratón, y con el recorte en el botón la esquina exacta —el píxel
  al que todo el mundo apunta— quedaba muerta.
- El triángulo es el de abajo a la izquierda dentro de su cuadro: una esquina
  levantada es el reflejo de la esquina sobre su doblez, no la esquina misma.
- El anillo de foco del sistema no sirve aquí (`outline` sigue la caja y
  `clip-path` se lo lleva); el foco se marca con un halo por `drop-shadow`, que sí
  sigue la silueta.
- Bajo 1200 px la cabecera abre hueco a la derecha: a ancho completo, la última
  pestaña de pasos quedaba debajo del canto y **dejaba de poderse tocar**.

### 19.8 El cambio de paso

Entre un paso y otro no pasaba nada: el contenido se sustituía de golpe, y en un
recorrido de seis pasos eso deja al cliente sin saber si avanzó, si retrocedió o
si la página se recargó sola. Ahora el bloque entra con fade y un rebote corto:
380 ms, 10 px de subida y un sobrepaso de escala de seis milésimas. Pequeño a
propósito — es un cambio de vista, no un acuse, y algo mayor cansa a la tercera
vez.

El rebote va en los keyframes y no en la curva: una curva elástica rebota en todo
lo que anima, mientras que un sobrepaso escrito a mano se queda donde se puso y
la curva sigue siendo de desaceleración limpia. Mismo recurso que `ftNum` y que
el rebote del sprite al elegir.

Se dispara por nombre alterno (`lgpPasoEntraA/B`) y no por `key`: remontar el
contenedor habría reiniciado el estado interno de todos los pasos —el índice del
carrusel, el archivo que el cliente ya subió, las medidas capturadas— para
conseguir solo que se relanzara una animación.

### 19.9 Lo que quedó abierto

- **`DESIGN.md` describe el telón como el momento de autoría del sistema**, con
  su sección propia y la Regla de la Franja Reservada. Esa parte quedó
  describiendo algo que ya no existe. Pendiente de decisión del cliente si se
  reescribe.
- El conector **21st** no se pudo usar: el CLI (`npx @21st-dev/cli login`) no
  quedó autenticado y el servidor MCP requiere autorización desde claude.ai. Todo
  el movimiento de esta sesión se escribió a mano sobre el vocabulario del propio
  proyecto.

## 20. Zócalo, re-render de las fachadas y WhatsApp (sin commitear)

Dos temas: las cuatro maquetas del paso 2, que se rehicieron enteras, y una vía
de contacto nueva en el cierre de la página.

### 20.1 El zócalo: apoyar la maqueta en algo

Las maquetas de la sección 15 son volúmenes blancos sobre tarjeta blanca, y a
tamaño de tarjeta **flotaban**: sin nada abajo que las asiente, el ojo no sabe
dónde termina la casa y empieza el papel. El cliente lo marcó sobre una captura
—"visel gris oscuro en la base"— y de ahí sale el zócalo: una franja gris oscuro
en la base de cada volumen.

Lo resuelve `zocalo()` en `scripts/fachadas-iso.js`. La base no es una sola línea
recta: garage, pórtico y casa se apoyan a distintas profundidades del isométrico,
así que la franja se calcula columna por columna sobre el canto inferior de la
silueta.

Tres decisiones que costaron y conviene no volver a descubrir:

- **Los aleros volados hay que descartarlos.** En las columnas donde el techo
  sobresale del muro, el píxel más bajo es el filo del alero, no un apoyo, y
  pintarlo deja una raya oscura colgando bajo el techo (se veía clarísimo en el
  carport del Farm). Se detectan cortando el canto en tramos donde pega un brinco
  y descartando los que quedan por encima de **todos** sus vecinos: un volumen
  que toca el suelo nunca cuelga por arriba de lo que tiene a los lados. El
  umbral del brinco tiene que ser fino (~35% del alto de la franja): con uno
  grueso los postes del carport y el alero caen en el mismo tramo y la regla no
  puede separarlos.
- **Color plano, no multiplicado.** La primera versión multiplicaba el píxel por
  un factor, y eso arrastraba el sombreado del muro dentro de la franja. Ahora es
  un gris sólido (`#5C5E60` en la tarjeta, `#4A4C4E` en la miniatura, más oscuro
  porque pelea contra el contraste ya subido del mini). Se toca solo el color: el
  alfa se respeta para no comerse el borde suave.
- **Tiene que llegar hasta la última fila de píxel.** Deteniéndose en el último
  píxel opaco, el antialias del contorno deja un filo claro de 1-2 px debajo y el
  zócalo se lee despegado del canto. Por eso hay dos cantos por columna: el opaco
  manda para medir dónde se apoya cada volumen, el translúcido marca hasta dónde
  bajar el relleno.

### 20.2 Segunda vuelta en Higgsfield: `scripts/fachadas-hd.js`

Los originales del cliente son renders de baja resolución: a 640 px se ven los
escalones del antialias, los parteluces de las ventanas se ensucian y el canto
del zócalo queda dentado. Se re-renderizaron los cuatro con Higgsfield
(`nano_banana_pro`, 4:3, 4K, una referencia por estilo — 5 generaciones, 20
créditos).

El pipeline quedó en dos scripts que se encadenan, y el primero **no se
reemplaza**: `fachadas-iso.js` sigue definiendo encuadre y zócalo, y su resultado
es justo lo que se le sube a Higgsfield como referencia.

```
node scripts/fachadas-iso.js                  # sprite base + zocalo
node scripts/fachadas-hd.js ref <carpeta>     # referencias para Higgsfield
... generar en Higgsfield ...
node scripts/fachadas-hd.js <render.png> <clave>
```

Lo que el prompt tiene que hacer, o el sprite no sirve:

- **Enumerar pieza por pieza la geometría que no se toca** ("el mismo carport de
  una sola agua sobre dos postes", "las mismas tres ventanas ranura"). Sin esa
  lista el modelo reacomoda volúmenes. Es la misma lección que dejó el pipeline
  de la cocina (`.claude/skills/colorLGP`).
- **Exigir el zócalo con su hex** en la base de cada volumen. Se re-dibuja dentro
  del render en vez de pintarse después, así que gana sombreado propio y esquinas
  limpias.
- **Prohibir explícitamente la sombra proyectada.** Los renders originales de
  Escandinavo, Moderno y Mediterráneo traen una sombra gris en el piso y el
  modelo la copiaba. Como el recorte inunda desde las cuatro esquinas sobre lo
  casi-blanco, una sombra sobreviviente se queda pegada como mancha opaca.

El recorte del fondo se sostiene solo gracias al contorno gris del dibujo: la
inundación se frena en la línea, sin máscara a mano. El script imprime qué
porcentaje del render quedó como maqueta (salieron entre 42% y 63%); si baja
mucho de ~20% es que el contorno vino abierto y hay que regenerar, no aflojar el
umbral.

Un ajuste que no era obvio: **la miniatura necesitó más contraste**, de 1.75 a
3.0. El re-render trae la línea más fina y más clara, y a 30-40 px con el valor
viejo la maqueta se despintaba.

Los renders crudos se guardan en `visuales/fachada/hd/*.webp` —webp sin pérdida,
verificado bit a bit contra el PNG original— para poder volver a recortar con
otro criterio sin gastar créditos. Los ocho webp de `public/fachadas/` quedaron
además más ligeros que antes (20-26 KB contra 27-33 KB).

### 20.3 Botón de WhatsApp en Contacto

Va en el cierre de la página, debajo de "Agendar mi cita" y arriba del correo.
Abre `wa.me` en pestaña nueva con el mensaje ya escrito, para que el cliente no
tenga que arrancar la conversación y quien contesta sepa de dónde viene.

- **En fantasma, no en carmín.** El carmín de esa región ya lo tiene el botón que
  convierte; dos botones fuertes juntos dejan de decir cuál importa.
- **Se dibuja también cuando la cita ya se envió** — quien quiere preguntar algo
  más no debería tener que volver al formulario.
- **El logo va como trazo SVG y no como imagen**, para que herede el color del
  botón: en fantasma el hover invierte el relleno, y un PNG verde ahí se vería
  pegado encima en vez de formar parte del botón.
- `whatsappHref()` limpia todo lo que no sea dígito, así que acepta el número tal
  como se copia del teléfono (`+1 (956) 123-4567` → `19561234567`, que es lo que
  pide `wa.me`).

**No hay número real y no se inventó.** Se buscó en la tarjeta de presentación,
en el HTML standalone viejo y en el resto del material: el `(956) 000 0000` es
relleno en los dos sitios. Mientras `NEXT_PUBLIC_LGP_WHATSAPP` esté vacía el
botón no se dibuja en producción; en desarrollo sí aparece —en gris, con borde
punteado y con su logo— diciendo qué le falta, que es la única forma de que el
pendiente se vea. Un botón de WhatsApp que abre un chat con un número inventado
es peor que no tener botón: el cliente escribe, nadie contesta, y la primera
impresión ya se gastó.

### 20.4 Lo que quedó abierto

- **Falta el número de WhatsApp.** Es el único dato que separa al botón de estar
  funcionando. Probablemente sea el mismo teléfono que falta para el pie y para
  el JSON-LD de negocio local, así que conviene resolver los tres de una vez.
- El pipeline de fachadas **merece ser skill**, al estilo de `colorLGP`: lo de la
  sombra y lo del contraste del mini son dos horas de redescubrimiento cada vez.
  Está documentado en el encabezado de `fachadas-hd.js` mientras tanto.
- `.claude/launch.json` se creó en esta sesión para poder levantar el servidor de
  desarrollo desde el agente. Es configuración local, no del producto.

## Archivos clave de esta etapa

| Archivo | Qué es |
|---|---|
| `components/HomeConfigurator.tsx` | Componente principal — página completa y los 7 pasos |
| `components/VentanaEnfocada.tsx` | La ventana modal del configurador |
| `components/MesaArquitecto.tsx` | Vista de la configuración como mesa de trabajo |
| `components/PasoDecision.tsx` | Esqueleto compartido de los pasos de elección única |
| `components/ZonasPanel.tsx` | Panel de zonas del paso 4 (modo tabla) |
| `components/ZonasGuiadas.tsx` | Modo "una zona a la vez" alternativo |
| `components/DecisionUI.tsx` | Piezas visuales reusables (fila de opción, franja, panel elegido) |
| `lib/guardado.ts` | Guardado/retomado en `localStorage` |
| `lib/ficha.ts` | Construcción del HTML/texto de la ficha que recibe el arquitecto |
| `app/api/enviar-resumen/route.ts` | Ruta que manda la ficha por correo (Resend) |
| `lib/data.ts` | Datos del negocio: lotes, planes, zonas, subdivisión |
| `CLAUDE.md` | Reglas del negocio y pendientes, para futuras sesiones |

## Archivos clave de la sesión 14

| Archivo | Qué es |
|---|---|
| `../PRODUCT.md` | Verdad de producto: usuarios, posicionamiento, principios |
| `../DESIGN.md` | Sistema visual: tokens, reglas nombradas, do's y don'ts |
| `../.impeccable/design.json` | Sidecar del sistema: rampas, sombras, movimiento, componentes |
| `app/globals.css` | Retícula (`--lgp-ancho`, ritmo), botones, telón, movimiento |
| `components/VentanaEnfocada.tsx` | Fases de entrada y salida de la ventana + telón |
| `components/PasoDecision.tsx` | Esqueleto de pasos de elección única, ya sin panel "elegido" |

## Archivos clave de la sesión 15

| Archivo | Qué es |
|---|---|
| `scripts/fachadas-iso.js` | Normaliza `visuales/fachada/*.png` → `public/fachadas/` |
| `public/fachadas/` | Las cuatro maquetas, en tamaño tarjeta y en `-mini` |
| `lib/assets.ts` | `RENDER_FACHADA` y `RENDER_FACHADA_MINI` |

## Archivos clave de la sesión 16

| Archivo | Qué es |
|---|---|
| `lib/data.ts` | `REGLAS_LOTE.fachadaFija` / `motivoFachada` |
| `components/HomeConfigurator.tsx` | `pasosDelRecorrido`, `vecino()`, `fachadaTexto` |
| `components/PasoDecision.tsx` | `visualAncho` / `visualAlto`, `sinAcuse` y el acuse de elección |
| `app/globals.css` | `lgpBarridoFoco`, `lgpElegidaA/B`, `lgpDestelloFoco` |

## Archivos clave de la sesión 18

| Archivo | Qué es |
|---|---|
| `lib/useVentanaModal.ts` | Foco, Escape, contención de Tab, `inert`, scroll y gesto de atrás — una sola copia para las dos ventanas |
| `components/TiraObra.tsx` | La tira de "La obra": flechas que se retiran en los extremos |
| `components/VisorObra.tsx` | Visor de foto a pantalla completa, compartido por las dos tiras |
| `components/CarruselSubdivision.tsx` | Foto + render de Enclave, turno automático de 5 s con pausa |
| `components/IconosTira.tsx` | Chevron, cruz y lupa dibujados en SVG |
| `lib/obra.ts` | Las 16 fotos con su texto alternativo y la regla de qué puede entrar |
| `public/obra/` | Fotografía propia: 5 fachadas + 11 interiores a 1600px |
| `scripts/textura-cubos.js` | Genera el mosaico de cubos desde los valores del canvas del fondo |
| `public/textura-cubos.svg` | El mosaico, 79.674 × 138 px |
| `../.impeccable/critique/` | Informe de la crítica: 27/40, con su backlog priorizado |

## Archivos clave de la sesión 19

| Archivo | Qué es |
|---|---|
| `app/globals.css` | Movimiento de la portada, escuadras + fogonazo + rebote, cinta transportadora, la hoja y su canto, entrada de paso |
| `components/PasoDecision.tsx` | `acuseEscuadras`, cinta y pieza saliente, rebote, bloqueo de flechas, botón de quitar, `pieza` / `etiquetaElegido` |
| `components/VentanaEnfocada.tsx` | Las tres capas de la hoja, el canto como botón de cerrar, fases de 780 / 560 ms |
| `components/HomeConfigurator.tsx` | Fachada en carrusel, cifras y FAQ animados, campos con foco, cabecera sin "Cerrar", entrada del paso |

## Sesión 21 — La paleta se elige viendo la cocina, y tres cosas menos en pantalla

Dos mitades. La primera engancha las maquetas de cocina al configurador: las
seis que dejó `colorLGP` estaban en `public/cocina/paletas/` sin que nada las
usara, y el paso 4 seguía ofreciendo cuatro gamas dibujadas con tres franjas de
color. Elegir "Grafito" contra "Piedra cálida" era elegir entre dos nombres:
nadie sabía en qué se convertían.

La segunda es resta, y las tres piezas que se fueron tenían el mismo defecto:
ocupaban espacio sin cambiar ninguna decisión del cliente. Un mapa para escoger
entre ocho lotes idénticos, un panel que listaba planos que no se ofrecen, y un
botón de WhatsApp del mismo tamaño que el que convierte.

### 21.1 Seis paletas, y el reemplazo es total

`INTERIORES` (`lib/data.ts`) pasó de cuatro gamas inventadas para el prototipo a
las seis paletas aprobadas, con la `key` igualada al `slug` de
`scripts/cocina/paletas.js` — que es también el nombre del archivo del sprite.
Un identificador para el dato, la imagen y el guardado.

**Las `key` viejas dejaron de existir, y eso sí se maneja.** `retomar()` valida
`g.interior` contra el catálogo antes de restaurarlo: sin ese filtro, quien
volviera con una sesión de la semana pasada arrancaría el paso con "algo
elegido" que no se ve en ninguna fila ni se puede quitar — y la guía saltaría la
etapa de la paleta creyéndola resuelta. Es el mismo cuidado que ya tenía
`CLAVE_GUARDADO` al pasar de v1 a v2, pero por dato y no por versión.

Las tres franjas de la fila salen de los mismos hex: gabinete, cubierta y piso.
Son la muestra preliminar —lo que deja escanear la tabla sin esperar imágenes—;
el resultado lo enseña la maqueta.

### 21.2 El panel va al lado, no encima

`PasoDecision` tiene un tercer reparto además del de lista y el de carrusel:
`lateral`, la tabla a la izquierda y la maqueta a la derecha.

El motivo no es estético. Con la tarjeta de foco **encima** de la lista —el
reparto del resto de los pasos— el cursor vive en la fila de abajo y la imagen
cambia arriba, fuera del campo de visión: se puede recorrer la lista entera sin
enterarse de que algo se estaba actualizando. Al lado, el ojo alcanza las dos
cosas sin mover la cabeza. El panel es `sticky` para que no se escape mientras
se recorren las seis.

En pantalla chica se apila y **la maqueta sube por encima de la tabla**: una
lista de seis filas empuja la imagen fuera de la pantalla, y una paleta que no
se ve mientras se elige vuelve a ser una lista de nombres.

Lo que **no** cambió: la selección. Es la misma `FilaOpcion`, el mismo
`exclusivo` y la misma "✕". No hay una rama de elegir para el lateral y otra
para el resto — `tabla` es una sola constante que los dos repartos dibujan.

### 21.3 El acuse ya estaba escrito

No se inventó movimiento nuevo para la elección: el paso pasó a usar
`acuseEscuadras`, que es el acuse que este sistema ya tenía **para maquetas** y
que estrenó la fachada. Escuadras de registro que se cierran sobre las esquinas
y se quedan mientras esa sea la elegida, fogonazo, y el rebote del sprite. El
barrido carmín se descartó por lo mismo por lo que se descartó en la fachada:
tapar la imagen justo al elegirla esconde lo único que se quería ver.

`acuseEscuadras` trae además, de regalo, lo que había que construir: `fijado`.
Con la paleta puesta, el panel deja de responder al cursor. Es coherente con lo
que la tabla ya hacía —las otras cinco filas quedan bloqueadas con su motivo—:
enseñar en grande una paleta que no se puede tomar sin antes quitar la actual es
ofrecer algo que la propia fila está negando.

Lo único nuevo es `lgpSpriteEntra`, la entrada de la maqueta al curiosear. Es la
hermana pequeña de `lgpSpriteRebote`: misma curva, **un tercio de la amplitud y
sin sobrepaso**. Esa diferencia de escala es la que separa los dos mensajes —
curiosear es una respuesta, elegir es un acuse. Si la entrada rebotara igual de
fuerte, pasar el cursor por seis filas se sentiría como haber elegido seis
veces. La precedencia está escrita en el orden del ternario: el acuse le gana a
la entrada, porque en ese instante lo que hay que contar es "quedó elegida".

### 21.4 343 KB en vez de 1.1 MB

`scripts/cocina/panel.js` baja los seis sprites de 1600 px a 900. El maestro
existe para poder volver a recortar; el que se descarga es el de panel, que a
~430 px de dibujo sigue yendo a 2x. Y se precargan los seis al entrar al paso,
no al pasar el cursor: sin eso, la primera pasada por cada fila enseña el panel
vacío mientras la imagen viaja — justo el gesto al que el panel existe para
responder.

### 21.5 Fuera el mapa del plat, y todo lo que colgaba de él

"Ver mapa completo" abría el plat de los 119 lotes de Enclave para escoger uno
de los ocho del catálogo. Se quitó, y con él la rama entera: los ocho lotes son
el mismo townhouse —mismo tipo, mismo plan fijo, los mismos 1,635 ft²
habitables— así que escoger no cambiaba nada de lo que venía después. Era una
decisión que se le pedía al cliente sin consecuencia.

Lo que se fue detrás del botón, en cascada:

- `components/SubdivisionOverview.tsx` completo — su único punto de entrada era
  ese botón.
- `PLAT_VIEWBOX`, `PlatLot` y `PLAT_ENCLAVE107` (137 líneas de coordenadas) en
  `lib/data.ts`. Solo las consumía el mapa.
- **La ficha del lote**: `lotModal` y su modal, con `modalDatos`, `modalElegir`,
  `cerrarModal` y `statusColor`. Se abría únicamente tocando un lote **dentro**
  del mapa, así que sin mapa era código inalcanzable.
- `lotes` (el arreglo con colores de relleno y trazo por estado) y el par
  `mostrarVendidos` / `visibles`, que existían para decidir qué se pintaba en el
  mapa y con qué color.

Lo que se queda: `LOTES`, la cifra de "8 lotes disponibles", `abrirDesdeLote` y
`abrirDiseno` —que entra con el primer lote disponible, como ya hacía—. La
tarjeta de la subdivisión pasa de dos botones a uno, y el que queda es el que
convierte.

### 21.6 El WhatsApp del cierre es una burbuja

Era una barra a todo lo ancho, en fantasma, del mismo tamaño que "Agendar mi
cita": dos bloques iguales apilados, y el ojo tenía que leer los dos para saber
cuál convertía. Ahora es el logo solo, 54px redondos — de los pocos iconos que
no necesitan etiqueta.

**Va en verde de marca y no en fantasma**, que es lo contrario de lo que decidió
la sesión 20, y con motivo: aquel razonamiento —"dos botones fuertes juntos
dejan de decir cuál importa"— valía para dos barras del mismo tamaño. Con el
texto fuera, un logo de WhatsApp en gris deja de leerse como WhatsApp y se
vuelve un icono cualquiera. La jerarquía ahora la carga el tamaño: 54px contra
una barra de 460 no dejan lugar a dudas.

Detalles que no son detalle:

- **El nombre no desapareció, solo dejó de verse**: `aria-label` para lectores de
  pantalla y `title` para quien duda con el cursor encima. Un enlace sin texto
  accesible es un enlace roto.
- **54px y no 44.** El mínimo táctil es el suelo, no la meta: este es un blanco
  redondo y aislado en medio de mucho aire, sin bordes vecinos que ayuden a
  apuntar.
- **La sombra lleva el propio verde**, no un gris neutro. Un halo gris debajo de
  un círculo de color lo despega del papel en vez de asentarlo. Y hay una regla
  aparte para cuando `lgp-hover-zoom` intenta poner la suya encima.
- **El estado pendiente se conserva**: sin `NEXT_PUBLIC_LGP_WHATSAPP` la burbuja
  sale punteada y en gris, sin destino, con su línea diciendo qué falta. Es un
  pendiente, no un botón, y tiene que verse como tal.

### 21.7 El panel de "no disponibles en este lote" se fue

En el paso 1, debajo del plano, un recuadro listaba los tres floorplans que la
subdivisión no permite en townhouse. El cliente no los había visto en ningún
lado —el carrusel solo trae el suyo— así que el panel presentaba opciones que
nadie había pedido para acto seguido negarlas.

No choca con "nada bloqueado sin explicación": esa regla es para un control
apagado en pantalla, y aquí no había ninguno. Se fue el bloque y la derivación
`planesExcluidos` que lo alimentaba.

### 21.8 Lo que quedó abierto

- **Los hex siguen muestreados a ojo** de los bocetos a color del cliente, no de
  una carta suya. Los renders ya se aprobaron sobre esa muestra, así que lo que
  se ve es correcto; el valor exacto no está confirmado. Está marcado como
  supuesto en el comentario de `INTERIORES`, no en pantalla: es una nota de
  fidelidad interna, no una afirmación que se le esté haciendo al cliente.
- **El pipeline viejo de cocina quedó muerto**: `lib/paletasCocina.ts`,
  `scripts/mascaras-cocina.js`, los `public/cocina/mask-*.png`,
  `public/cocina/render/` (12 PNG) y `public/cocina/_prueba-*.png`. Nada lo
  importa. Son varios MB de `public/` que se pueden tirar en una limpieza
  aparte.
- **`REGLAS_LOTE.motivo` sigue vivo** aunque el panel de planos excluidos ya no
  esté: lo usa el aviso de zonas no permitidas del paso 4. Si algún día también
  se va de ahí, el campo se queda sin lector.

## Archivos clave de la sesión 21

| Archivo | Qué es |
|---|---|
| `lib/data.ts` | `INTERIORES` — las seis paletas, con su `key` = `slug` del sprite. Ya sin `PLAT_VIEWBOX`, `PlatLot` ni `PLAT_ENCLAVE107` (137 líneas de coordenadas) |
| `lib/assets.ts` | `RENDER_PALETA` — la maqueta de cada paleta |
| `scripts/cocina/panel.js` | Baja los sprites maestros a los 900 px que se descargan |
| `components/PasoDecision.tsx` | El reparto `lateral`, `tabla` como constante única y la entrada del sprite |
| `components/HomeConfigurator.tsx` | `gamasDecision` con maqueta, la precarga, el filtro de `key` vieja al retomar, la burbuja de WhatsApp y las tres eliminaciones |
| `app/globals.css` | `.lgp-decision-lateral`, `lgpSpriteEntraA/B` y `.lgp-wa-burbuja` |
| `components/SubdivisionOverview.tsx` | **Borrado** — el mapa del plat y su ficha de lote |

## Archivos clave de la sesión 20

| Archivo | Qué es |
|---|---|
| `scripts/fachadas-iso.js` | `zocalo()` — la franja de la base, y el descarte de aleros volados |
| `scripts/fachadas-hd.js` | Genera las referencias y recorta el re-render de Higgsfield; el encabezado documenta el ciclo y los tres requisitos del prompt |
| `../visuales/fachada/hd/` | Los cuatro renders crudos de Higgsfield, webp sin pérdida |
| `public/fachadas/` | Los ocho sprites regenerados |
| `lib/data.ts` | `WHATSAPP`, `WHATSAPP_MENSAJE`, `whatsappHref()` |
| `components/HomeConfigurator.tsx` | `WhatsappGlifo` y el botón en la sección `#contacto` |
| `.env.example` | `NEXT_PUBLIC_LGP_WHATSAPP`, documentada |

## Sesión 22 — El sitio ya está en vivo, y un prototipo para el lote irregular

Dos frentes. El primero es el sitio dejando de ser local: quedó publicado en
`lagranpiedrallc.com`. El segundo es exploratorio — un prototipo aparte, fuera
del repo, para la manera en que un lote con forma irregular entra al
configurador.

### 22.1 Publicación: dominio, correo y WhatsApp reales

El dominio `lagranpiedrallc.com` está registrado en HostGator (`ns134` /
`ns135.hostgator.mx`), no en Squarespace — Squarespace solo tenía el sitio
viejo conectado ahí, y ese panel no sirve para nada de esto. El cambio real
fue en la Zona DNS de HostGator:

- **A** del dominio raíz → `76.76.21.21` (Vercel)
- **CNAME** de `www` → `cname.vercel-dns.com` (Vercel)
- Cuatro registros más (`TXT`/`CNAME`) para verificar el dominio en Resend y
  habilitar SPF/DKIM/DMARC — sin tocar los `MX` existentes de Titan, que son
  los que de verdad reciben el correo del negocio.

El proyecto se importó a Vercel desde el repo de GitHub; cada push a `main`
publica solo. `RESEND_API_KEY` y `LGP_CORREO_REMITENTE` quedaron configuradas
ahí — el primer intento de envío falló con un 502 opaco porque el `catch` de
`app/api/enviar-resumen/route.ts` no registraba el motivo real; se le agregó
`console.error` con el cuerpo de la respuesta de Resend (commit `dbdd381`), lo
que dejó ver que el remitente se había guardado con un salto de línea de más.
Corregido el valor, un envío de prueba real llegó a `contact@lagranpiedrallc.com`.
`NEXT_PUBLIC_LGP_WHATSAPP` quedó en `9564503175`, el número real del negocio.

También se simplificó el paso 1 de "ya tengo mi lote": de tres vías
(plano/medidas/dirección) a dos (**foto** — reutiliza el mismo análisis por
IA que antes leía el plano formal — y **medidas**). La vía de solo-dirección
se quitó por completo: nunca traía suficiente para calcular un presupuesto.
Commit `f443b00`.

### 22.2 Trazador de lote irregular — diseño aprobado, prototipo en curso

El cliente compartió el caso real que la vía de "foto" no resuelve bien: un
lote con forma de cuadrilátero irregular, no un rectángulo. Se armó un spec
completo (`docs/superpowers/specs/2026-08-22-trazado-lote-irregular-design.md`,
commit `d9ea540`) para una tercera tarjeta, **"Mi lote es irregular"**, que:

1. Deja trazar el contorno tocando cada esquina — sin botón de "cerrar
   forma": tocar cerca del punto de inicio cierra el trazo solo.
2. Guía animada, en cinco pasos: frente → trasero → ¿retiros conocidos? →
   ¿servidumbre adicional? → norte (una rosa de vientos que se arrastra para
   girar). Las aristas por marcar corren con una lucecita en circuito, en el
   mismo sentido del trazo.
3. La foto se "arranca" como una calcomanía —el mismo mecanismo de
   `clip-path` en diagonal que ya usa `.lgp-ventana` en `globals.css`— y deja
   pegada la sombra del lote, que ya estaba dibujada ahí desde antes de
   arrancar: no entra después, no se reencuadra, se queda exactamente donde
   se trazó.
4. La medida de cada arista se escribe en un campo flotante encima de esa
   misma arista, ya sobre el diagrama.
5. El área sale de la fórmula shoelace; la huella construible mete cada
   arista hacia adentro por su retiro (más cualquier servidumbre marcada) y
   corta los semiplanos resultantes — válido para lotes convexos, que es el
   caso típico. Si el trazo da algo cóncavo, cae al mismo supuesto de 50%
   que ya usa hoy la vía de foto para lotes irregulares.

**Todavía no toca el código real.** Vive como un prototipo aislado (HTML +
JS en un solo archivo, sin dependencias) publicado como Artifact de Claude,
para que el cliente lo probara e iterara sin arriesgar nada del sitio en
producción. Pasó por varias rondas con el cliente probándolo: el gesto de
cerrar la forma, la animación de las aristas (se probó un efecto tipo agua,
se regresó a las lucecitas en circuito porque esa ya gustaba), la rosa de
vientos, y el arreglo del arranque tipo calcomanía. La lógica de trazo y
geometría (`lib/poligono.ts` en el spec) todavía no se portó a
`HomeConfigurator.tsx` — eso es lo que sigue, una vez que el cliente dé el
visto bueno final al prototipo.

## Archivos clave de la sesión 22

| Archivo | Qué es |
|---|---|
| `docs/superpowers/specs/2026-08-22-trazado-lote-irregular-design.md` | El spec aprobado del trazador de lote irregular |
| `components/HomeConfigurator.tsx` | Paso 1 de lote propio: 2 vías en vez de 3 (`loteModo: 'foto' \| 'medidas'`) |
| `app/api/enviar-resumen/route.ts` | `console.error` del cuerpo de la respuesta de Resend en el `catch` |
| `.env.local` (no versionado) | `NEXT_PUBLIC_LGP_WHATSAPP=9564503175`, para probar el botón en desarrollo |
| *(fuera del repo)* | Prototipo del trazador — Artifact de Claude, HTML/JS aislado, sin integrar todavía |
