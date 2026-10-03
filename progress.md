# Progreso — La Gran Piedra, configurador web

Registro de lo trabajado en esta conversación. La Gran Piedra LLC es una constructora
de casas custom en el Rio Grande Valley (Edinburg · McAllen · Mission), con
subdivisión propia **Enclave on 107** en McAllen. El sitio es un configurador
donde el cliente arma su casa, dirigido a clientes locales e internacionales. El
recorrido son 6 pasos con lote propio y 5 en la subdivisión (ver sección 16).

Última actualización: el sitio está publicado en producción y el trazador de
lotes irregulares ya vive **dentro** del configurador; con él entró una tabla de
retiros por ciudad que reemplaza al número fijo que se usaba antes (sección 23).
**Todo lo de las secciones 1–22 ya está commiteado y en GitHub** — el commit
más reciente es `88f23cc`. Las secciones 23 a 29 están solo en el árbol de
trabajo. En la 24 cambió el modelo de fondo: el floorplan ya no vende una casa
completa sino una idea organizadora, la casa se arma cuarto por cuarto con
medidas reales, y la cochera por fin se elige (y se puede quitar). La 25 lo puso
a prueba contra un plano construido —el townhouse del Lote 17, que el
configurador declaraba imposible— y de ahí salieron el arreglo de la escalera
contada dos veces, el medio baño fuera del núcleo, la barra de área total y una
limpieza del banco de planos. La 26 lo probó con trece clientes sobre lotes
reales de dos plats y de ahí salieron dos errores de área —el patio contado dos
veces y la escalera sin cobrar en lote propio—, los dos ya corregidos. La 27 agregó una medida compacta —del 4-plex de Atwood
Village— para los lotes chicos donde el modelo de medianas contestaba que no
cabía nada, y un cuarto floorplan de patio techado atrás.

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

---

## Sesión 23 — El trazador entra al sitio, y los retiros dejan de ser un número solo (sin commitear)

Lo que la sesión 22 dejó como prototipo aparte ya vive dentro del
configurador. Y al meterlo salió a la luz una contradicción que el prototipo
había resuelto y el sitio no: los retiros.

### 23.1 Dos caminos, no tres

El paso 1 de lote propio tenía tres vías. Una era "sube una foto de tu terreno
con las medidas escritas" y la IA sacaba de ahí un frente y un fondo. Esa vía
le pedía al cliente **exactamente lo mismo** que el trazador —una foto del
terreno con sus cotas— y devolvía menos: un rectángulo equivalente en lugar de
la forma real. Se quitó. La lectura por IA no desapareció: se mudó adentro del
trazador, al botón "Leerlas de mi foto", donde lee las cotas *sobre el contorno
que el cliente ya marcó*, que es donde de verdad sirve.

Quedan dos tarjetas, y cambiaron de nombre:

| Antes | Ahora |
|---|---|
| "Tengo una foto" · *Lo mejor* | "Lote irregular" — Marca su forma sobre una foto de tu terreno. |
| "Sé las medidas" | "Lote regular" — Frente y fondo en pies. |

El cambio de nombre es la regla del sándwich aplicada a la primera pantalla.
"Traza tu lote" / "Sé las medidas" le pedían al cliente escoger entre dos
**maneras de trabajar** —una decisión que no puede tomar porque todavía no
sabe qué hace cada una—. "Lote irregular" / "Lote regular" le preguntan por un
**hecho que tiene delante de los ojos**.

También se le quitó el sello "Lo mejor". Tenía sentido cuando eran dos métodos
y uno daba mejor resultado; sobre una forma de terreno diría que es mejor tener
el lote irregular, que es absurdo.

### 23.2 El trazador va en un marco, y a propósito

`components/TrazadorLote.tsx` (115 líneas) monta
`public/trazador/index.html?embed=1` en un `<iframe>`. **No se tradujo a
React** — son ~3,300 líneas de geometría calibradas contra 9 sets de planos
construidos (el Lot 124 cuadra al pie contra su plat aprobado), y reescribirlas
movería números que hoy están verificados. Con `?embed=1` la página de adentro
apaga su propio chrome y habla por `postMessage`; abierta sola sigue
funcionando completa, que es como se prueba.

Tres mensajes cruzan el marco, y cada uno arregla algo que sin él se rompe:

- `alto` — la página de adentro reporta cuánto mide y el componente se lo pone
  al iframe. **El marco no scrollea.** Dos barras de scroll anidadas sobre un
  lienzo que se arrastra con el dedo es exactamente lo que rompe el gesto de
  trazar.
- `arriba` — el trazador cambió de pantalla y pide subir. Quien scrollea es el
  cuerpo de la ventana, no la página: el marco de adentro ya está hasta arriba
  de sí mismo, y sin esto el cliente se queda mirando el pie de la pantalla
  anterior mientras la nueva empieza fuera de cuadro.
- `listo` — el lote confirmado.

El listener filtra por `ev.origin` y además por `ev.source`: se escucha a *ese*
marco, no a cualquier cosa del mismo origen.

### 23.3 Lo que el trazador entrega, y lo que deliberadamente no

`LoteTrazado` trae área, zona construible, los lados con su tipo, la ciudad, la
foto, los retiros aplicados y si salieron del plano. **No trae frente × fondo.**
Sobre una forma irregular esa cuenta no significa nada: el offset se hizo arista
por arista sobre el contorno real, con sus curvas y sus franjas de servicio. Por
eso `zonaConstruible` llega **ya calculada y no se recalcula**. Rehacerla con un
rectángulo equivalente sería tirar precisamente el trabajo que justifica que el
trazador exista.

Eso obligó a un campo nuevo en `Lote`: `medida?: string`. Un lote trazado no se
describe con "60 × 95 ft", así que en el resumen, la ficha y la mesa se imprime
su propia cadena —sus lados y su ciudad— en vez de un guion doble, que se lee
como un dato que se perdió cuando en realidad es más preciso que cualquier
rectángulo.

### 23.4 Los retiros ya no son un número: son una tabla por ciudad

Esta es la corrección de fondo. El camino rectangular aplicaba una mediana fija
para todo el Valle; el trazador preguntaba la ciudad. **El mismo terreno daba
dos áreas distintas según por qué tarjeta entrara el cliente.**

Ahora los dos leen el mismo cuadro. `PRESETS_RETIROS` en `lib/data.ts`, cada
renglón con su `fuente` y su salvedad, las dos impresas en pantalla:

| Ciudad | Frente / Fondo / Lados | Tope de cobertura | Fuente |
|---|---|---|---|
| McAllen | 25 / 10 / 6 | — | Ordenanza R-1 § 138-356 |
| Mission | 20 / 10 / 6 | — | Código R-1 § 1.371 |
| Alton | 25 / 20 / 6 | **35 %** | UDC 2024, tabla § 3.6.3 |
| Edinburg | 10 / 15 / 5 | — | Plano aprobado del Lot 124 |

Tres cosas que no se pueden perder de vista:

- **Lo que manda es el plat, no la ordenanza.** Las Reglas de Subdivisión de
  Hidalgo County exigen que los retiros cumplan con el plano de la subdivisión.
  Por eso la ciudad es un punto de partida declarado, no una respuesta.
- **El renglón de Edinburg no es la ciudad**, son los números de *una*
  subdivisión. El chip dice "Edinburg" pero la salvedad sale impresa.
- **⚠️ La tabla está duplicada a mano en `public/trazador/index.html`**
  (`PRESETS_RETIROS`), porque ese archivo se sirve como HTML estático y no puede
  importar de `lib/`. **Si se corrige un número, se corrige en los dos.**

Quien no sabe su ciudad no se queda atorado: cae a `RETIROS_DEFAULT` (18/15/5,
mediana de cinco planos acotados) declarado como supuesto. Es lo que hace un
arquitecto en anteproyecto — ni inventarse una regla ni detener el trabajo.

### 23.5 El tope de cobertura, y por qué el dibujo tuvo que cambiar

Alton topa la construcción al 35 % del lote. Ese tope y los retiros son **dos
reglas sobre la misma cosa, no dos recortes que se sumen**: manda el más
restrictivo. `huellaConstruible()` recibió un cuarto parámetro y devuelve el
mínimo de los dos.

Eso rompió el diagrama. Cuando el tope gana, `RetirosDiagrama` dibujaba el
rectángulo de los retiros mientras el número de al lado decía otra cosa —
prometía superficie que no existe. Ahora el rectángulo rosa se encoge desde el
fondo (donde de verdad se recorta una casa que no cabe) hasta que su área
coincide con la cifra, el envolvente de los retiros queda dibujado punteado
—es una línea legal que ahí no se alcanza— y **la cota del fondo mide contra la
línea de retiro, no contra el rectángulo rosa**, porque si no diría un número
que no es el retiro.

Por lo mismo, cuando el tope manda se deja de imprimir el "38 × 50 ft" debajo de
la cifra: 38 × 50 son 1,900 y arriba dice 1,663. Se lee como una cuenta mal
hecha.

### 23.6 Lo que quedó abierto

- **Sin commitear.** El último commit es `88f23cc`. Todo lo de la sesión 23 está
  en el árbol de trabajo: `components/TrazadorLote.tsx` y `public/trazador/`
  sin rastrear, y seis archivos modificados.
- **`app/api/analizar-lote/route.ts` ya no lo llama nadie.** Era el motor de la
  vía de foto que se quitó. Sigue en el repo; falta decidir si se borra.
- **`ANTHROPIC_API_KEY` en Vercel.** Sin ella, "Leerlas de mi foto" responde
  501 y lo dice en pantalla — el cliente escribe las medidas a mano y llega al
  mismo resultado.
- **La tabla de retiros cubre cuatro ciudades.** Edinburg está representada por
  el plano de una subdivisión, no por su ordenanza. Falta verificar la
  ordenanza de Edinburg y sumar Pharr, San Juan y Weslaco.
- **El hero ya dice "5–6 pasos, según tu lote"** — el pendiente de las sesiones
  anteriores sobre los "7 pasos" está cerrado.

## Archivos clave de la sesión 23

| Archivo | Qué es |
|---|---|
| `components/TrazadorLote.tsx` | *(nuevo)* El marco: monta el trazador con `?embed=1` y habla con él por `postMessage` — alto, subir, lote listo |
| `public/trazador/index.html` | *(nuevo)* El trazador completo, 4,328 líneas, HTML estático sin dependencias. Trae su propia copia de `PRESETS_RETIROS` |
| `lib/data.ts` | `PRESETS_RETIROS` + `PRESET_NO_SE` + `presetPorId()`, `Lote.medida`, y `huellaConstruible()` con tope de cobertura |
| `components/HomeConfigurator.tsx` | `loteModo: 'trazar' \| 'medidas'` (se fue `'foto'`), estado `ciudadId`, y el resumen/ficha/mesa imprimiendo `medida` en los lotes trazados |
| `components/RetirosDiagrama.tsx` | El recorte por tope de cobertura: rosa encogido, envolvente punteado, cota del fondo contra la línea de retiro |
| `CLAUDE.md` | La regla de la tabla duplicada, y `analizar-lote` marcado como huérfano |
| `.claude/launch.json` | Entrada de adjuntar (`url`, sin comando) + `autoPort` — Next 16 no deja dos `next dev` sobre el mismo directorio |

---

## Sesión 24 — El floorplan deja de vender una casa, y la cochera por fin se elige (sin commitear)

Sesión larga y con un cambio de modelo en medio. El orden de abajo es el orden en
que pasó.

### 24.1 "Zona construible", no "huella construible"

Reemplazo de término en todo el texto de cara al cliente. *Huella* es jerga de
plano; la regla del sándwich la deja fuera del camino normal.

### 24.2 El botón que se enciende cuando toca avanzar

Con referencia en video, medida cuadro por cuadro en vez de a ojo (2.0 s por
vuelta). El destello recorre el perímetro **por dentro** del botón sobre un solo
riel, deja estela, y el botón completo da un bounce cuando la luz toca los dos
puntos medios laterales — que en un barrido cónico centrado caen siempre en 90°
y 270°, sin importar la proporción del botón.

Vive en `app/globals.css`: `.lgp-guia-luz`, `@property --lgp-giro`,
`@keyframes lgpGiroLuz` y `lgpGolpeLuz` con `animation-composition: add` para que
la animación infinita no mate el `:hover`. Se aplica a **un solo control a la
vez** en todo el recorrido, siempre el que cierra una acción.

En la previa el "Siguiente" arranca deshabilitado y solo se enciende cuando el
lote quedó confirmado.

### 24.3 "No cabe" en vez de un número negativo

Si el cliente pide algo que no entra: zumbido rojo en el control y burbuja de dos
segundos que dice **no cabe** (`.lgp-no-cabe`, `.lgp-burbuja-no-cabe`).

**Menos en las zonas.** Ahí el cliente pidió lo contrario: la zona que no cabe se
deshabilita y punto — sin zumbido y sin la barra que se desliza al pasar el
cursor, porque esa barra promete un "+" que no va a pasar. Y eso solo cuando el
motivo es el presupuesto; lo que prohíbe el reglamento se sigue marcando como no
permitido, que es otra cosa.

El presupuesto ya no puede quedar en negativo por ningún camino, y el cliente
nunca ve el número negativo: ve "No cabe".

### 24.4 El floorplan pasa a ser una idea, no una casa

**El cambio grande.** Antes cada plano cobraba su casa completa contra el
presupuesto (1,635 ft², 3 recámaras, 3 baños) y el cliente heredaba un programa
que no eligió. Ahora el plano cobra **solo su propia idea organizadora** y los
cuartos se eligen después:

| Plano | Qué es | Qué cuesta |
|---|---|---|
| Dos patios | Dos patios chicos con corredor techado entre las alas | 200 ft² de patio (supuesto, marcado) |
| Un patio | Patio en el centro | 108 ft² de patio (medido) |
| Escalera | La casa sube | 160 ft² habitables — 80 por planta, se paga dos veces |

El patio no sale del presupuesto habitable: es un vacío, ocupa suelo y no se
habita (`patioDelPlan()`). La escalera sí, y por eso es el único plano cuyo ft²
es habitable.

La tarjeta dice `Un patio: 108 ft² · 1 planta` — antes decía "108 FT²" pelón y no
se entendía de qué eran.

### 24.5 La casa mínima, armada cuarto por cuarto

Con la skill `arquitecto` y el banco de nueve planos.
`habitableDelPrograma(recámaras, baños)` en `lib/data.ts` arma la casa de verdad:

- **Núcleo** (siempre, aunque haya una sola recámara): sala 267, comedor 140,
  cocina 126, lavandería 50, medio baño 31, despensa 13, clóset del aire 11.
- **Suite principal** completa: 187 + clóset 50 + baño 95.
- **Vestíbulo prorrateado** por recámara (74 ÷ 3) — integrado, no como partida
  aparte.
- Cada recámara extra: 132 + clóset 18.3. Cada baño extra: 54.5.
- **Circulación y muros: 11.5 %** sobre todo lo anterior.

De ahí salen los números que ve el cliente: **1,124 ft² lo indispensable**, **198
ft² por recámara** y **62 ft² por baño** — el cuarto con su parte del pasillo, no
el cuarto pelón.

**Validación:** 3 recámaras + 3 baños da 1,642 ft². El "Patio central" realmente
construido tiene 1,635. Siete pies de diferencia.

**El arreglo de los programas grandes.** El cliente cachó que no pueden caber 6
recámaras y 6 baños en 2,424 ft². Contra la densidad medida (531 ft²/recámara) el
modelo se quedaba −3 % a 3 recámaras pero **19 % corto a 5 y 24 % a 6** — arriba
del umbral de 15 % de la skill. Es el punto exacto donde el desglose cuarto por
cuarto se rompe: suma UNA sala y UN comedor por más cuartos que agregues. Se
corrigió agregando las estancias que ese programa sí tendría —segunda sala desde
5 recámaras (204 ft², la sala más chica de los nueve sets) y comedor de diario
desde 6 (127)— y todos los tamaños quedaron dentro del 12 %.

**El bug que lo destapó** ("¿por qué dice 5 recámaras y 4 baños?"): la guarda
comparaba contra 132 ft² mientras el presupuesto cobraba 198. Entraban cuartos
que no cabían y el presupuesto se iba a negativo. Ahora guarda y cobro salen de
la misma función (`costoReal()`).

### 24.6 La barra de presupuesto dice lo ocupado

El titular pasó a ser los **ft² ocupados en magenta** (`#F2004B`), del color de la
barra; lo libre en negro (`#1C1E1F`), del color del fondo de la barra. El cliente
relaciona número y color sin leer la leyenda.

### 24.7 "¿Por qué no cabe si mi zona construible era 1,900?"

Faltaba enseñar la cadena. Se agregó la tabla **"De tu terreno a tu casa"** dentro
del desglose plegable:

```
zona construible                     1,880 ft²
× 82 % (ocupación real)               −338
− cochera, pórtico, patio cubierto    −421
= te queda de casa                   1,121 ft²
```

Los dos escalones que nadie ve venir: una casa no llena el rectángulo hasta el
filo (82 % es lo que ocuparon las casas ya construidas, techo histórico 83.9 % en
el Lot 76), y hay superficie que se construye pero no se habita.

### 24.8 La cochera, por fin elegible — y opcional

Era un pendiente declarado de la skill: el resumen decía "2 autos" como si fuera
una elección y nunca hubo dónde cambiarlo. Ahora se elige en la previa, pegada al
lote, porque es la resta que decide con cuánta casa arranca el cliente.

**Una fila, no tres tarjetas.** El primer intento fueron tres tarjetas grandes con
los ft² de casa de cada opción; el cliente las mandó encoger — es una sola cifra
que sube y baja, y media pantalla para eso le robaba peso al tablero del lote.
Quedó: casilla + icono de coche + "Garage / N autos · X ft²" + dos flechas
apiladas + una línea que dice qué deja.

**La casilla manda.** Sin marcarla la casa no lleva cochera y esos ft² vuelven
completos al presupuesto habitable — en un 50 × 80 del Valle son 958 → **1,377
ft²**, que es la diferencia entre que el plano más chico no quepa y que quepa. El
número de cajones se guarda aparte (`conGarage` y `cajones` son dos estados), así
que volver a marcarla devuelve lo que había y no un default.

`CAJONES_GARAGE` en `lib/data.ts`:

| | ft² | medida | de dónde sale |
|---|---|---|---|
| Un auto | 256 | 12′ × 21′4″ | **supuesto** — el ancho no se saca partiendo el doble a la mitad: dos coches comparten la circulación del centro y uno solo no. 12′ es la puerta de 9′ medida en Montecito 14 más sus jambas |
| Dos autos | 419 | 19′8″ × 21′4″ | **medido**, mediana de los siete sets (393–431) |
| Tres autos | 628 | 29′6″ × 21′4″ | **supuesto** — los 419 medidos más un cajón de 9′10″ × 21′4″ |

El fondo 21′4″ sale de 419 ÷ 19.667 y cae dentro del rango medido (20′0″–21′11″).
Los dos estimados se declaran en la propia fila y viajan a la ficha del arquitecto
marcados como "(medida estimada)".

**El bug que salió al probarlo:** cambiar la cochera movía la fila pero no el
número grande del presupuesto. `maxLivingPara()` caía a `lote.maxLiving` cuando
todavía no había plano elegido, y ese campo se congela al capturar el lote. Ahora,
si el lote trae zona construible, se recalcula a una planta. Los lotes de la
subdivisión no traen zona construible y siguen cayendo a su tope de reglamento,
que es lo correcto: ahí manda el plano aprobado.

Al cambiar de cochera se revalida el programa igual que al cambiar de lote —
primero baños, luego recámaras, con devolución de lo que sí quepa— y se cae el
plano que ya no entre. El presupuesto no se queda en rojo aunque quien lo empujó
haya sido una decisión de cochera.

`ConfigGuardada.garage2` (booleano) pasó a `cajones: number` + `conGarage:
boolean`; los guardados viejos se traducen al hidratar.

### 24.9 Otros

- **Reiniciar la foto en el trazador.** Faltaba salida si el cliente se
  equivocaba al marcar los puntos: `public/trazador/index.html` ahora tiene
  "Cambiar la foto" en la fase de trazo, con confirmación dentro del propio
  botón. Hacía falta porque en modo empotrado la cabecera —y con ella el único
  "Reiniciar"— va oculta.
- **Las tarjetas de lote irregular / regular** viven en blanco con filo negro y
  se llenan de tinta en 200 ms al pasar el cursor o al apretar; la elegida se
  marca con punto carmín, no con fondo (`.lgp-tarjeta-tinta`).
- Se borró el bloque muerto del "Dimmer de superficie" y su estado.
- **Turbopack se quedó con un módulo viejo** a media sesión y el configurador
  tronaba con un `ReferenceError` de un identificador que ya no existía en el
  código. No era un bug del código: se arregló matando el `next dev`, borrando
  `.next` y arrancando de nuevo. Si vuelve a pasar, ese es el camino.

### 24.10 Lo que quedó abierto

- **Sigue sin commitear.** El último commit es `88f23cc`; las secciones 23 y 24
  están solo en el árbol de trabajo.
- **974 contra 866 en el paso del floorplan.** El titular enseña la capacidad del
  lote sin plano; el motivo de la tarjeta la enseña ya restando el patio de ESE
  plano. Son dos cifras correctas que se leen como contradicción. Se ofreció
  reconciliarlas y quedó sin respuesta.
- **La cochera de uno y la de tres son supuestos.** Se cierran cuando LGP
  construya una y se mida.

## Archivos clave de la sesión 24

| Archivo | Qué es |
|---|---|
| `lib/data.ts` | `habitableDelPrograma()`, `NUCLEO_PIEZAS`, `SUITE_PRINCIPAL`, `RECAMARA_EXTRA`, `CIRCULACION`, `estanciasDeProgramaGrande()`, `IDEA_PLAN`, `CAJONES_GARAGE` + `garageFt2()`, `GARAGE_1_AUTO` = 256, `GARAGE_3_AUTOS` = 628 |
| `components/HomeConfigurator.tsx` | El modelo nuevo entero: `livingDeCuartos()`, `patioDelPlan()`, `maxLivingPara()`, `costoReal()`, `liberaUnaRecamara()`, `casaConCochera()`, la fila de cochera y la tabla "De tu terreno a tu casa" |
| `components/PresupuestoBar.tsx` | Titular en ocupado magenta, libre en negro, "No cabe" en vez de negativos |
| `components/PasoDecision.tsx` | `bloqueada` + `motivoBloqueo` en las opciones |
| `app/globals.css` | `.lgp-guia-luz` y su bounce, `.lgp-tarjeta-tinta`, `.lgp-no-cabe` + burbuja, y sus variantes de movimiento reducido |
| `lib/guardado.ts` | `garage2: boolean` → `cajones: number` + `conGarage: boolean`, con traducción de guardados viejos |
| `public/trazador/index.html` | "Cambiar la foto" en la fase de trazo |

---

## Sesión 25 — El plano del cliente contra el modelo, y el banco de planos se pone al día (sin commitear)

La sesión arrancó con una pregunta con el plano en la mano —*"¿por qué no caben 3
cuartos y 3 baños si en el plano acreditado por el arquitecto sí se puede?"*— y
terminó reescribiendo medio modelo de presupuesto. Casi todo lo de abajo salió de
esa pregunta.

### 25.1 La escalera se cobraba dos veces

El set del Lote 17 mete **3 recámaras y 3 baños en 1,635 ft²** —MASTER BEDROOM,
BEDROOM 2, BEDROOM 3, MASTER BATHROOM, BATHRM 2, BATHRM 3, tabla de áreas
firmada— y el configurador contestaba que no cabían. Le cobraba 1,802.

Dos causas, las dos reales:

1. **La escalera se sumaba aparte.** `habitableDelPrograma()` se construyó con
   los ocho planos de UNA planta, pero el techo contra el que se compara —los
   1,635 del Lote 17, o el reparto 906/1635 que usa `maxLivingPara` para dos
   plantas— sale de una casa que ya tiene su escalera adentro.
2. **El modelo cobra medianas; ese townhouse está construido en mínimos.** Sus
   recámaras 2 y 3 miden 105 ft², las más chicas de las doce medidas. Su baño
   principal 82.5 contra 95. Y no tiene medio baño: son tres baños completos.

`IDEA_PLAN` dejó de tener `habitable: boolean` y ahora lleva `cobro: 'patio' |
'ninguno'`. Los patios siguen saliendo del suelo del lote; la escalera pasó a
`'ninguno'` — el número se sigue enseñando, pero ya no se resta. Aplica a los dos
planos de dos plantas.

La tarjeta del plano quedó en `Escalera, arriba y abajo · 2 plantas`, sin cifra:
un número junto al plano se lee como precio, y ese dejó de serlo.

### 25.2 El medio baño salió del núcleo

Era la pieza con menos respaldo de todo el núcleo —**2 de los 9 sets**, el half
bath del Lot 124 (26.3) y el POWDER de Montecito 37 (35)— y se le cobraba a todo
el mundo como indispensable. Un cliente que pedía "3 baños" pagaba cuatro piezas
sanitarias.

Ahora vive en el catálogo de zonas como *Medio baño de visitas*, 35 ft², con su
propio icono. Cuesta 35 y no 31 porque las zonas se cobran a secas, sin pasar por
la circulación: 31 de mediana con su parte de pasillo son los mismos 35 del
POWDER medido. Moverlo de sitio no le cambia el precio al cliente.

Con eso, **lo indispensable bajó de 1,124 a 1,089** y 3 recámaras con 3 baños
caben en los 1,635 del plano aprobado.

### 25.3 La casa arranca en 3 y 3

`REC_BASE`/`BANOS_BASE` seguían siendo el piso *y* el arranque. Se separaron:

- `REC_BASE = 1, BANOS_BASE = 1` — hasta dónde puede **bajar** el contador.
- `REC_INICIAL = 3, BANOS_INICIAL = 3` — con qué **arranca**.

Tres y tres es lo que LGP construye de verdad. Arrancar en 1 y 1 obligaba a todos
a reconstruir a mano la casa que ya hacen.

### 25.4 La recámara secundaria: 132 → 121

Por decisión del cliente. **121 ft² = 11′-0″ × 11′-0″**: el ancho cae dentro del
rango medido (9′-2″ a 12′-5½″) y el fondo es el más chico de las once. No es la
mediana y así está declarado en el código.

Cada recámara pasó de 198 a **185 ft²** contra el presupuesto. Contra la densidad
medida de 531 ft²/recámara el modelo queda al 1 % a tres recámaras y **15 % corto
a seis** — justo en el umbral que la skill marca para enseñar los dos números.

### 25.5 `recorteQueQuepa()`: de pasos a búsqueda

El recorte automático —el que ajusta el programa cuando cambia el lote, la
cochera o el plano— pasó por tres versiones porque las dos primeras producían
casas que no existen:

| versión | resultado en un techo de 1,506 |
|---|---|
| quitar baños, devolver baños primero | 1 recámara con 3 baños |
| devolver recámaras primero | 3 recámaras con 1 baño |
| **probar las 36 combinaciones** | **2 recámaras y 3 baños** |

Ahora recorre el espacio entero (seis por seis, cuesta nada) y elige por tres
criterios en orden: la casa más grande que entre, la más pareja entre recámaras y
baños, y a igualdad la que traiga más recámaras. Cualquier método paso a paso se
queda en el primer resultado aceptable, que es de donde salían los engendros.

Además **mide contra el techo del plano puesto** y no contra uno genérico: antes
el programa pasaba el filtro y se iba a rojo en cuanto se elegía el plano, porque
su patio se llevaba 200 ft² que nadie había contado.

### 25.6 El tope de baños dejó de ser tope

*"Un baño por recámara y uno de visitas"* bloqueaba un baño que el presupuesto sí
podía pagar —109 ft² libres contra 62 que cuesta—. La regla no se borró: se mudó
a `recorteQueQuepa()`, que la usa para proponer un programa parejo cuando recorta
solo. Como default está bien; como candado estaba mal.

### 25.7 La barra proyecta el plano que el cliente está mirando

En el paso 1, mover el carrusel mueve la barra en vivo. El índice vivía dentro de
`PasoDecision` y sale ahora como aviso (`onVista`), no como estado controlado
desde arriba. Es simulación pura: no toca el estado.

En un lote de 50 × 100 se ve de un vistazo lo que cuesta cada idea — el corredor
entre dos patios deja 1,414 ft² y subir a dos plantas 2,913.

### 25.8 La barra pasa a dos franjas y cuenta el área total

Antes contaba solo habitable, en cinco tramos de cinco tonos de carmín. La
cochera —419 ft², más que dos recámaras— no aparecía en ningún lado aunque se le
estuviera restando al lote desde el primer paso.

```
2,367 FT² CONSTRUIDOS DE 3,567
■ ÁREA HABITABLE                       1,583
■ COCHERA, PÓRTICO Y PATIO               784
□ LIBRE PARA TU CASA                   1,200
```

Es la misma cuenta que cierra la tabla de áreas de cualquiera de nuestros planos:
el Lote 17 son 1,635 + 614 = 2,249. **La alberca y el BBQ entran a la franja
clara** y suman al total *y* al techo a la vez, así que aparecen sin quitarle un
pie a la casa — que es exactamente lo que son.

### 25.9 La cuenta de cuartos vive en un solo sitio

Costó tres intentos. El titular contaba totales ("2 recámaras · 3 baños") y el
tramo contaba incrementos ("1 recámara y 2 baños más"): las dos cifras eran
ciertas y juntas se leían como una contradicción. Se probó nombrar las piezas
("recámara 2 y baños 2 y 3") y seguía compitiendo.

Quedó: **el conteo solo existe arriba a la izquierda**, con el master siempre
adentro. Los tramos dicen a dónde se fueron los pies y nada más.

### 25.10 La guía: una sola luz, y por secuencia

Cada botón decidía por su cuenta si encenderse, y en la previa se prendían dos a
la vez. Ahora hay un solo valor, `guiaActiva`, con la secuencia en el orden en
que hay que hacer las cosas:

```
usarMedidas  →  gama → cuartos → zonas  →  siguiente
```

Gana el primer eslabón pendiente. Quien agregue un control guiado lo mete en esa
lista y no en un `className`. De paso: la luz **no se enciende si falta algún
campo** — en la previa exige también la ciudad, que es la que decide los retiros.

### 25.11 El recorrido va seriado

`pasoPermitido` era `n <= 4 || configCompleta`: del paso 1 se podía brincar al 4
sin haber elegido plano ni fachada. Ahora cada paso pregunta si los anteriores
están cerrados —la misma pregunta que enciende el "Siguiente"— y volver atrás
sigue siendo libre.

Y **los números del stepper dejaron de ser botones**: son un indicador (`<ol>`),
sin nada que enfocar ni pulsar. Se avanza con Siguiente y Atrás.

### 25.12 Menos texto en pantalla

Por instrucción del cliente, y en varias pasadas:

- La ficha del lote quedó en el tablero y el garage. El origen de la medida y la
  salvedad de los ft² estimados se mudaron al `title` del número que explican.
- Se fue el plegable *"Qué lleva cualquier casa, y qué ya descontamos de tu
  lote"* entero, con la tabla del núcleo y la cadena del terreno.
- Se fue la lista *"Para que quepa"* y los párrafos de entrada del paso 1. El del
  lote de subdivisión quedó en un renglón porque explica un paso que falta, y eso
  no se puede callar.
- Con ellos se fueron `salidasSiNoCabe()` y `notaDosPlantas()`, que ya no
  alimentaban nada.

### 25.13 La ocupación deja de estar clavada en 82 %

La skill avisa: *"la ocupación no es una constante: va de 52 % en un lote holgado
a 84 % en uno apretado; fijarla de entrada es el error que hace que las cuentas
prometan de más en lotes grandes y de menos en chicos"*. Estaba fija en 82 %.

Ahora mide contra el techo medido —**83.9 %, el Lot 76, construido**— que es como
lo revisa el script del banco. En un 40 × 90 ese 2 % era la diferencia entre una
casa de una recámara y una de dos.

### 25.14 Las zonas enseñaban el faltante, no su tamaño

Con 47 ft² libres, un storage de 48 salía como `FALTAN 1 FT²` y se leía como un
storage de un pie; el comodín de 70 salía como 23. Ahora la lista enseña siempre
el tamaño real, quepa o no. Que no quepa lo dice la fila apagada, y el cuánto
falta vive en el `title`.

### 25.15 El banco de planos, al día

- **Bug en `diagnostico()`:** dividía la huella entre `envolvente × pisos`, como
  si un segundo piso creara terreno. Aprobaba 4 recámaras en un 40×90 diciendo
  "49 % del envolvente" cuando la cifra real es 98 %.
- `--medios-banos` arranca en **0** (2 de 9 sets).
- `--medida` gana la opción **`catalogo`**, ahora el default: recámara de 121, lo
  que cotiza el configurador. `rec` vuelve a la mediana de 132, `min` a 105.
- Las cuatro `alerta_app` de `estandares.json` describían bugs ya arreglados
  —cochera de 500, pórtico de 24, baño de 50, recámara de 105— en presente. Ahora
  dicen CORREGIDO y qué usa hoy el configurador.
- La sección *"lo que ya está calibrado en lgp-web"* del `SKILL.md` estaba medio
  obsoleta y afirmaba **"no hay control de cochera en el configurador"**, que era
  justo la palanca que prohibía ofrecer. Reescrita, y la cochera pasó a ser la
  palanca #4 porque es la única que el cliente mueve él mismo.
- Verificado con el script: una casa de 3 recámaras y 2 baños en una planta **no
  cabe en 50×95** (85 % contra un techo de 83.9). Con **51 pies de frente** entra
  al 83 %; con 53 queda al 79 %. Dos pies cambian el veredicto.

### 25.16 Lo que quedó abierto

- **La escalera en lote propio de dos plantas.** El techo del configurador sale
  de `(envolvente × 83.9 % − cochera − pórtico − patio) ÷ 0.554` y contra él se
  compara un programa **sin escalera**. En un 40×90 con 3 recámaras el
  configurador dice que cabe (82 % del envolvente) y el script dice que no
  (88 %) — y el script tiene razón. Es el lado equivocado del error: promete de
  más. En el lote de la subdivisión no pasa, porque ahí el techo son los 1,635
  aprobados. **Falta decidir si se le cobra la escalera solo en lote propio.**
- **El tope de 6 recámaras y 6 baños** no es de presupuesto: es hasta donde
  llegan los datos. De 5 en adelante el modelo agrega la segunda sala y de 6 el
  comedor de diario; más allá habría que inventar. En un lote grande ese tope se
  alcanza antes que el espacio.
- **La cochera de uno y la de tres siguen siendo supuestos.** Se cierran cuando
  LGP construya una y se mida.
- **`/api/ai-suggest` se quedó sin quien la llame.** La ruta sigue en el
  repositorio; conviene decidir si se borra o si el análisis del brief vuelve
  algún día. Lo mismo con `/api/analizar-lote`, que ya venía huérfana.
- **Sigue sin commitear.** El último commit es `88f23cc`.

## Archivos clave de la sesión 25

| Archivo | Qué es |
|---|---|
| `lib/data.ts` | `IDEA_PLAN.cobro`, `RECAMARA_EXTRA.cuarto = 121`, medio baño fuera de `NUCLEO_PIEZAS` y dentro de `MODULOS`, `CAJONES_GARAGE` |
| `components/HomeConfigurator.tsx` | `recorteQueQuepa()` por búsqueda, `guiaActiva`, `pasoCerrado`/`pasoPermitido` seriados, `planEnVista` + proyección, las dos franjas de la barra, `ft2Exteriores()` |
| `components/PresupuestoBar.tsx` | `programa` (el conteo, único), copy de "ft² construidos" |
| `components/PasoDecision.tsx` | `onVista` — el carrusel avisa qué opción está a la vista |
| `components/ZonasPanel.tsx` · `ZonasGuiadas.tsx` | la fila enseña el tamaño de la zona, no el faltante |
| `components/ConfigIcons.tsx` | icono del medio baño |
| `.claude/skills/arquitecto/scripts/programa.py` | bug de `× pisos`, `--medida catalogo`, medios baños en 0 |
| `.claude/skills/arquitecto/SKILL.md` | sección de calibración reescrita, palanca de cochera, cifras de 50×95 verificadas |
| `planos para base de datos/base-datos/estandares.json` | las cinco `alerta_app` puestas al día |

---

## Sesión 26 — Trece clientes contra el configurador, y dos errores de área que salieron de ahí (sin commitear)

Se corrieron trece recorridos completos de "Personaliza tu casa" con lotes reales
de dos plats —Highland Heights (SAM Engineering, mayo 2022, registro F-10602) y
Enclave on 107— y el ejercicio destapó dos errores en el cálculo de área. Los dos
están corregidos.

El entregable es **`bitacora-13-clientes.pdf`** en la raíz del proyecto, 11
páginas: el brief de cada caso, cuatro hallazgos y el anexo de constantes. El
arnés vive en el scratchpad de la sesión y corre `lib/data.ts` directamente, así
que las cifras se mueven con el código.

### 26.1 El patio del plano se cobraba dos veces

**El error.** El configurador descontaba el patio de la idea del plano (108 el
central, 200 los dos patios) **además** de `PATIO_CUBIERTO` (103). No son dos
huecos: son el mismo. En el Lote 124 la tabla de áreas trae un solo renglón,
`patio_cubierto: 108 ft², tipo PATIO CENTRAL`, y ese 108 es exactamente el que el
plano "Patio central" cobra como idea. Los dos patios del otro plano salen del
recorte en U del Lot 76, del Lot 77 y del New Frontier, que en esos tres planos
ES su patio cubierto.

**El efecto.** Sobre un 50 × 95 —la geometría de los lotes 76 y 77, construidos y
medidos— el configurador ofrecía 1,389 ft² habitables cuando **el Lot 76 real
tiene 1,511.83**. Un 8 % corto contra obra propia.

**El arreglo.** `patioDeLaCasa(planKey)` devuelve `max(PATIO_CUBIERTO, patio del
plano)`, y es lo que se descuenta en `maxLivingPara`, en la franja no habitable
de la barra y en el total construido. El mismo lote ahora da **1,492**: 1.3 %
corto en vez de 8 %, y del lado seguro.

### 26.2 La escalera no se cobraba en lote propio

**El error.** La sesión 25 quitó el cobro de los 160 ft² de escalera, y para el
lote de la subdivisión está bien: ahí el techo son los 1,635 ft² de un plano
aprobado que ya la trae adentro. Pero en **lote propio** el techo se deriva del
envolvente y se divide entre el reparto 906/1635 del Lote 17 — un reparto que
describe una casa cuyo habitable también incluye su escalera. Sin cobrarla, el
configurador regalaba 160 ft² que en obra sí ocupan planta.

**El efecto.** Un 40 × 90 con tres recámaras pasaba del 82 % del envolvente al
**88 %**, arriba del techo histórico de 83.9 % del Lot 76. Prometía una casa que
no se puede construir. Es el lado malo del error.

**El arreglo.** `livingDelPlan()` cobra `ESCALERA_POR_PLANTA × pisos` cuando el
plano es de dos plantas **y** el lote trae zona construible propia. En los lotes
de la subdivisión sigue en cero, porque ahí el programa tampoco es hipótesis
nuestra. Se agregó `minimoDelPlan(planKey)` —programa mínimo más lo que ese plano
cobre aparte— para que el filtro de "¿cabe este plano?" y el presupuesto no
puedan volver a discrepar: los seis sitios que comparaban contra el mínimo ahora
llaman a esa función.

**Verificación:** de los 39 pares lote × plano del ejercicio, **cero** ofrecen hoy
una casa que exija más envolvente del 83.9 % que LGP ha logrado. Antes había dos.

### 26.3 El recorte medía contra un techo bruto

`recorteQueQuepa` comparaba el programa contra `maxLivingLote()` sin restar la
escalera del plano ni las zonas ya puestas. Un programa cabía "a solas" y se
pasaba al sumarle un game room de 224 ft² que el cliente ya tenía. Ahora el techo
va neto.

### 26.4 Pulido antes de subir

- **`npx next build` pasa limpio** (Turbopack, 4.4 s, TypeScript en 4.7 s).
- **Errores de ESLint: de 16 a 6.**
- **`useVentanaModal.ts` escribía un ref durante el render.** Con renders
  concurrentes React puede descartar y reintentar ese trabajo, y la escritura ya
  quedó hecha sobre un valor que nunca se pintó. Se mudó a un efecto sin
  dependencias, que corre después de cada commit.
- **Se fueron los `any` que escondían un `undefined`.** El patrón
  `({} as any).corto` producía `undefined` en silencio cuando una clave no
  existía, y ese hueco viajaba a la ficha del arquitecto. Ahora es `?.corto ?? k`:
  si algo falta se ve la clave. Los estilos pasaron de `Record<string, any>` a
  `CSSProperties`.
- **Los 6 errores que quedan son todos `react-hooks/set-state-in-effect`**, en
  efectos que sincronizan estado derivado: hidratación al montar, recorte del
  programa al cambiar lote / cochera / plano, y soltar zonas incompatibles con el
  plano. Se revisaron uno por uno y **ninguno puede ciclarse** — los recortes van
  guardados con `if (r2 !== recamarasExtra)` y los filtros son idempotentes. La
  regla advierte de renders en cascada, que es costo, no corrección.
  Reestructurarlos justo antes de subir es el movimiento más arriesgado de los
  dos.

### 26.5 Lo que el ejercicio dejó sobre los lotes reales

- **Highland Heights no tiene un solo lote residencial curvo.** Sus dos curvas
  —C1 y C2, bulbos de cul-de-sac de 50′ de radio— caen dentro de las áreas verdes.
- **Cinco de los trece lotes solo funcionan en dos plantas.** Los 23, 24, 27 y 28
  (70 × 66.22, sobre los cul-de-sac) y el 30 no admiten ninguna casa de una
  planta, ni la mínima.
- **El plat no tiene una sola línea de construcción.** Los lotes interiores llevan
  18′ al frente (18′ B.S.B.L., cota de los lotes 76 y 77) y los que dan a S Brazos
  llevan 10′ (cota del Lote 124), más 10′ en el chaflán de esquina.
- **El método de reconstrucción quedó validado:** el Lote 124 armado de sus cotas
  da 5,571.05 ft² contra los 5,570.86 impresos, y su envolvente sale 3,078 — el
  mismo que el banco ya tenía publicado por otro camino.

### 26.6 Lo que quedó abierto

- **Los cinco casos de Enclave no están verificados.** Ese plat llegó como captura
  de pantalla y no imprime áreas por lote, así que no hay contra qué contrastar.
  Los otros ocho cuadran con el área impresa con menos de 1 ft² de error. Con el
  PDF de Enclave suben al mismo nivel.
- **El tope de 6 recámaras y 6 baños** sigue siendo de datos, no de presupuesto.
- **Sigue sin commitear.** El último commit es `88f23cc`.

## Archivos clave de la sesión 26

| Archivo | Qué es |
|---|---|
| `components/HomeConfigurator.tsx` | `patioDeLaCasa()`, la escalera en `livingDelPlan()`, `minimoDelPlan()`, el techo neto del recorte, fuera los `any` |
| `lib/useVentanaModal.ts` | el ref deja de escribirse durante el render |
| `bitacora-13-clientes.pdf` | *(nuevo)* la bitácora de los 13 clientes, 11 páginas |

---

## Sesión 27 — Medida compacta para lote chico, y un cuarto floorplan (sin commitear)

La bitácora de la sesión 26 dejó cinco de trece lotes sin ninguna casa de una
planta, y varios de ellos son terrenos donde LGP **ya construyó**. El modelo
dimensionaba siempre con las medianas de nueve casas holgadas, así que en lote
apretado contestaba que no cabía nada. Se agregó una segunda medida y un plano
más compacto.

### 27.1 Medida compacta, del 4-plex de Atwood Village

**De dónde sale.** Del set completo del **Lot 35 4-Plex Apartments** (Atwood
Village, 918 N. Blair Ave., Edinburg; 2GC Construcción y Diseño, 26 de mayo de
2023). Es vivienda de renta construida, con cada cuarto llevado al mínimo real.

**El ancla dura** es la tabla de la hoja índice: la unidad de 2 recámaras y 2
baños mide **902 SF** y la de 2 recámaras con estudio **1,087 SF**. La de 902
mide 31′-9″ × 28′-5″, que da 902.3 — cuadra al pie.

Los cuartos salen de las cadenas de cotas de la hoja 1.2:

| | compacta | contra la casa |
|---|---|---|
| Sala | 123 (12′2″ × 10′1″) | 267 |
| Comedor | 111 | 140 |
| Cocina | 115 | 126 |
| Recámara principal | 111 | 187 |
| Recámara secundaria | **93** (9′6″ × 9′10″) | 121 |
| Baño | 41 (5′4″ × 7′8″) | 54.5 |
| Lavandería | 22 | 50 |

**La circulación compacta es 18.2 %**, contra el 11.5 % de la casa. No es un
supuesto libre: es el factor que hace que el desglose reproduzca las dos áreas
impresas. Con él, 2 recámaras y 2 baños dan **914 contra los 902** del plano, y 3
cuartos con 2 baños dan **1,073 contra 1,087** — los dos dentro del 1.5 %, y uno
por cada lado, que es la señal de un factor bien calibrado. Un departamento gasta
más pasillo por pie que una casa; este set tiene un HALL corrido que sirve a los
dos dormitorios.

**Qué cambia.** `habitableDelPrograma(rec, baños, medida)` toma un tercer
argumento. En compacta la casa mínima baja de **1,089 a 705 ft²**, la recámara de
185 a 159 y el baño de 61 a 51.

**Cuándo se activa.** `UMBRAL_COMPACTO = 2000` ft² de zona construible. Con los
retiros típicos del Valle eso es un lote de unos 4,600 ft². Solo aplica en lote
propio; en los de la subdivisión manda el plano aprobado.

Las tres cifras derivadas dejaron de ser constantes y pasaron a funciones
—`ft2Indispensable(medida)`, `ft2PorRecamara(medida)`, `ft2PorBano(medida)`—
para que el contador, la barra y el filtro de planos no puedan quedarse con una
medida distinta de la del presupuesto.

### 27.2 Floorplan nuevo: "Patio techado atrás"

El cuarto plano, y el más compacto. Su patio son los **86.88 ft² del recorte en U
trasero del Lot 76** — el más chico de los siete sets con tabla de áreas. Va
*pegado al fondo* y no metido en el centro, que es justo la diferencia con los
otros dos: no le come huella al medio de la casa.

Deja más casa que cualquier otro de una planta: 16 ft² más que el patio cubierto
mediano, 21 más que el patio central y 113 más que los dos patios. Va **primero**
en `REGLAS_LOTE.libre.planes` porque el carrusel abre en el primero y en lote
apretado suele ser el único de una planta que entra.

Trae su diagrama en `FloorplanDiagram` (clave `A`); no hay render `.webp` todavía
y el componente cae solo al SVG.

### 27.3 El patio del plano dejó de promediarse con la mediana

`patioDeLaCasa()` se mudó de `HomeConfigurator` a `lib/data.ts` —para que el
arnés de pruebas y el sitio no puedan discrepar— y cambió de `max(mediana,
patio del plano)` a **el del plano si lo declara, y la mediana solo como
respaldo**. Con `max()` un plano cuyo patio es más chico que la mediana no podía
ganar, y el plano nuevo existe justo para eso.

| plano | patio |
|---|---|
| Patio techado atrás | 87 |
| Un patio | 108 |
| Dos patios | 200 |
| 2 pisos · sin plano elegido | 103 (respaldo: los siete sets traen patio cubierto) |

### 27.4 Lo que esto desbloquea

| lote | antes | ahora |
|---|---|---|
| LOT 30 · env 1,950 | ninguna casa de una planta | 3 recámaras |
| LOT 28 · env 2,080 (cul-de-sac) | ninguna | 1 rec / 2 baños con el plano nuevo |
| 45 × 90 McAllen · env 1,815 | ninguna | **2 recámaras y 2 baños** |

Verificado en el sitio: sobre un 45 × 90 el carrusel abre en "Patio techado
atrás" con 2 recámaras y 2 baños, 914 ft² habitables de un techo de 955.

### 27.5 Lo que ve el cliente

Pegada a la barra de presupuesto, y solo cuando el lote es chico, aparece una
franja: **"Tu lote es chico · medidas compactas"**, con la explicación en una
frase y cuatro palancas con su cifra —el plano nuevo, cochera de un auto (+163),
sin cochera (+419) y dos plantas—. Va pegada a la barra y no en un aviso aparte
porque explica el número que está justo arriba, y termina en palancas y no en una
disculpa: lo que el cliente necesita es saber qué mover.

### 27.6 Lo que quedó abierto

- ~~**Falta el render del plano nuevo**~~ — llegó en la sesión 29, ver 29.17.
- **Las medidas compactas no están en el banco de planos.** Viven en
  `lib/data.ts` con su procedencia escrita. Convendría meter el 4-plex a
  `planos para base de datos/` como décimo set, marcado como vivienda de renta
  para que no contamine las medianas de casa.
- **`UMBRAL_COMPACTO` es un escalón duro:** a 1,999 ft² el cliente ve una casa y
  a 2,001 otra. Habría que ver si conviene una transición.
- **Sigue sin commitear.** El último commit es `88f23cc`.

## Archivos clave de la sesión 27

| Archivo | Qué es |
|---|---|
| `lib/data.ts` | `COMPACTO`, `CIRCULACION_COMPACTA`, `UMBRAL_COMPACTO`, `habitableDelPrograma(…, medida)`, `ft2Indispensable/PorRecamara/PorBano`, `patioDeLaCasa`, plano `A` en `PLANES` e `IDEA_PLAN`, `A` en `REGLAS_LOTE.libre.planes` |
| `components/FloorplanDiagram.tsx` | el diagrama del plano `A` |
| `components/HomeConfigurator.tsx` | `medida` / `loteApretado`, la franja de lote chico con sus palancas, `DESC_PLAN.A` |

---

## Sesión 28 — El paso 5 deja de decir lo mismo dos veces (sin commitear)

El paso 5 enseñaba la mesa del arquitecto y, debajo, una tabla de trece renglones
—"El detalle, en números"— que repetía casi todo lo que la mesa ya decía: el
plano, los cuartos, la fachada, la paleta, las zonas y los pies cuadrados. Dos
formatos para lo mismo, con el problema de siempre: en cuanto uno se queda atrás,
el cliente no sabe cuál creer.

### 28.1 La ficha de la mesa pasa a ser un cuadro de áreas

Era una hoja que decía "Ficha" y daba tres cifras sueltas. Ahora es **el mismo
renglonaje que cierra la tabla de áreas de cualquiera de nuestros planos** —el del
Lote 17 son 1,635 de living más 473 de cochera, 24 de pórtico y 80 de patio =
2,249—:

```
CUADRO DE ÁREAS
1,703  FT² HABITABLES

HABITABLE            1,703
COCHERA                419
PÓRTICO                 62
PATIO TECHADO           87
EXTERIORES              64
─────────────────────────
TOTAL CONSTRUIDO     2,335

3 REC · 3 BAÑOS · 2 AUTOS · 419 FT²
Tu lote · 60 × 120 ft · 7,200 ft²
```

Lo que gana no es solo información: **la suma se ve cuadrar**. Antes el total
construido era un número suelto que había que creerse; ahora se llega a él
renglón por renglón. Es lo que convierte la mesa en un documento y no en una
ilustración.

El renglón de exteriores solo aparece si el cliente puso alberca o BBQ, y el de
tragaluces se pega a la línea de rec/baños cuando los hay.

### 28.2 La tabla de abajo se queda con lo que un dibujo no puede cargar

De trece renglones a los que no caben en un esquema: el archivo que subió del
lote, dónde está el terreno y a quién se le contesta. Se llama **"Lo que viaja
con tu casa"**.

`resumen` completo se queda intacto para la ficha del correo, donde el arquitecto
sí quiere el renglonaje entero. Lo que cambió es solo qué se pinta en pantalla.

### 28.3 Un solo sitio para el cuadro

`areasDeLaCasa` se calcula una vez en el configurador y de ahí sale tanto lo que
pinta la mesa como lo que viaja en la ficha. La regla de siempre: si la misma
cifra se calcula en dos lados, tarde o temprano discrepan.

### 28.4 Lo que se quitó de paso

- **El rótulo del pie de la mesa** decía "3 rec / 3 banos / 2 autos", que es
  exactamente el renglón que ahora cierra el cuadro. Dos veces lo mismo en la
  misma imagen, y en una de las dos con la eñe sin tilde. Con él se fue la prop
  `planMeta`, que ya no alimentaba nada.
- El lienzo pasó de 16/10 a **16/11** y las hojas del borde bajaron, porque el
  cuadro creció a seis renglones y se salía del escritorio. Verificado midiendo
  las cajas: ninguna hoja se sale del lienzo.

### 28.5 Lo que quedó abierto

- **Sigue sin commitear.** El último commit es `88f23cc`.


---

## Sesión 29 — La lámina del paso 5, y la dirección del lote (sin commitear)

### 29.1 `FichaCasa`: la mesa se cambia por una lámina

El paso 5 enseñaba la mesa del arquitecto —papeles sueltos sobre un escritorio—.
Es buena para "esto ya existe" y mala para enseñársela a alguien. El cliente pasó
una referencia de póster y la lámina nueva la sigue de cerca:

```
┌──────────────────────────────────────────┐
│ ▉ PLANO          LIVING SQF   3 rec · 3 baños │
│ ▉ lote            1,851                       │
│ ▉ área           ÁREA TOTAL   2 autos         │
│ ▉ dirección       2,504                       │
│            [ isométrico del plano ]           │
├──────────────────────────────────────────┤ gris
│  ⬚ ⬚ ⬚ ⬚ ⬚   iconos de zona, en blanco     │
├────────────────────────────────────╱─────┤ carmín en diagonal
│   ⬡ fachada        ⬡ paleta                │ gris hondo
│   Escandinavo      Nogal + Mármol Crema     │
│   CONTACTO CLIENTE          LA GRAN PIEDRA  │
└──────────────────────────────────────────┘ filo carmín
```

Todo con lo que ya existía: los isométricos de `RENDER_PLAN`, las maquetas de
fachada, las cocinas de `RENDER_PALETA`, los iconos de `ICONO_ZONA` y el
logotipo. Nada de recursos nuevos.

**Dos trucos que valía la pena dejar anotados.** Los iconos de zona son glifos
NEGROS sobre transparente; sobre la banda oscura se vuelven blancos puros con
`filter: brightness(0) invert(1)`, que funciona sea cual sea el color de origen —
lo mismo el logotipo, que viene en gris `#505759`. Y el marco hexagonal son dos
capas con el mismo `clip-path`, la de abajo en tinta y la de encima con un
`inset`: un `border` normal no sigue el recorte.

La lámina se dibuja entera en `cqw`, así que se encoge completa y se lee igual en
un teléfono que en un monitor — y saldría idéntica si algún día se imprime.

**La mesa se queda en el paso 3**, donde su desorden sí sirve: ahí es una vista
previa en curso, no un documento con destinatario.

### 29.2 La dirección del lote

Campo de texto en el paso 5, encima de la lámina. Se guarda en el navegador, sube
a la etiqueta negra en cuanto se escribe, y **manda sobre la dirección que dedujo
el análisis** al armar la ficha del correo: el cliente sabe dónde está su terreno
mejor que un geocodificador.

No se pide antes a propósito. En la previa lo que hace falta son las medidas, y
pedir la calle ahí sería un campo más entre el cliente y su primer número. Aquí
ya vio su casa, y la dirección es lo que le dice al arquitecto a dónde ir a
verificar los retiros reales.

### 29.3 Un número que estaba mal: el área del lote

`maxft` significa dos cosas según de dónde venga el lote. En el del cliente es el
área del terreno —`crearLotePropio` la escribe con `Math.round(data.areaLote)`—.
En los del catálogo es el total CONSTRUIDO del plano aprobado: 2,249 ft² del Lote
17. `loteMedida` lo imprimía como área del lote en los dos casos, así que un
townhouse de 32.5 × 80 aparecía parado en **2,249 ft² de terreno cuando son
2,600**.

Ahora `areaDelLote()` usa `maxft` solo cuando el lote es del cliente; para los del
catálogo multiplica frente × fondo, y si no puede, **calla el número en vez de dar
el equivocado**.

### 29.4 La cabecera, en dos cintas translúcidas

El título y las cifras estaban en bloques opacos: negro el título, papel las
cifras. Ahora son **dos cintas del mismo gris con alfa, encima del isométrico**,
como la referencia:

- **La cinta de las cifras** cruza de lado a lado en `rgba(88,93,95,0.88)`, con
  el rótulo y el número en blanco.
- **El título** va en el mismo gris pero más hondo, `rgba(43,47,49,0.90)`, y baja
  más que la cinta — así identifica la lámina sin competir con las cifras por el
  mismo renglón.

El plano se sigue viendo por debajo de las dos, que es lo que hace que se lean
como una cinta puesta ENCIMA del dibujo y no como un recuadro que lo tapa.

**El primer gris que probé no pasaba contraste.** `rgba(110,115,117,0.82)` sobre
el crema del isométrico da un efectivo de `#858A8A`, y el blanco encima queda en
**3.4:1** — el rótulo de la cinta es texto chico y pide 4.5. Bajando el gris y
subiendo el alfa el efectivo queda en `#6A6E70` y el blanco sube a **4.97:1**.
El rótulo se quedó en blanco puro y no en gris apagado, que daba 4.27: la
jerarquía la hacen el cuerpo y el espaciado, y de paso es más fiel — en la
referencia el rótulo y la cifra son igual de blancos.

### 29.5 La mitad de abajo, y un solo fondo

Segunda pasada sobre la lámina, siguiendo la referencia más de cerca:

- **Un solo fondo, de arriba abajo:** el mosaico isométrico de
  `/textura-cubos.svg`, el mismo del fondo del sitio. Las cintas grises van
  encima con alfa y la retícula corre por debajo sin cortarse. Va en propiedades
  sueltas y **no** con el atajo `background` — el atajo mete
  `background-image: none` y borra la textura sin avisar; ya está anotado en
  `globals.css` y aquí volvía a aplicar.
- **Fuera la franja bicolor** que separaba los iconos de las maquetas.
- **Los iconos y las maquetas comparten UNA cinta.** Eran dos divs del mismo
  gris translúcido y entre los dos se veía la costura.
- **Fuera los marcos hexagonales.** Recortaban unas maquetas que ya vienen
  recortadas y con su propio aire, y les robaban la mitad del ancho.
- **La maqueta de fachada va con un empujón de escala (1.18).** Las cuatro
  fachadas están normalizadas en el mismo lienzo cuadrado con margen, así que
  dentro de una caja del mismo alto se veía más chica que la cocina, que llena la
  suya.
- **El contacto y el logotipo** pasaron al tono hondo, de filo a filo — la misma
  pareja de tonos que arriba: cinta clara para el contenido, bloque hondo para
  de quién es la lámina.

### 29.6 Tercera pasada: la textura se ve entera

En la mitad de abajo quedaban **dos franjas grises y nada más**: la de los iconos
de zona arriba y la del contacto abajo. Entre las dos, las maquetas van sobre la
textura desnuda — el mosaico se ve completo, sin fondo gris detrás.

Los nombres de las maquetas pasaron un momento a tinta —sobre el mosaico claro,
el blanco habría desaparecido— y en la pasada siguiente volvieron a blanco, ya
con su propia cinta debajo.

### 29.7 Los nombres, en su propia cinta

Las maquetas quedaron sobre la textura, pero sus nombres no: van en una **cinta
gemela de la de iconos** —mismo `CINTA`, misma opacidad, letras en `PAPEL`— de
filo a filo. Así la mitad de abajo lee como la referencia: dos franjas grises
—iconos arriba, nombres abajo— con la textura entera entre ellas, y el bloque de
contacto al pie.

Para lograrlo los nombres **salieron de `Pieza`** y viven en `NombrePieza`,
dentro de la cinta. Cada nombre sigue siendo `flex: 1` con el mismo `gap: 4cqw`
que las maquetas, así que cae bajo la suya. Tenerlos dentro de `Pieza` daba dos
cajas grises sueltas con textura en medio — dos parches, no una cinta.

### 29.8 Dos glifos que valen por toda la cuenta: la cama y el coche

Las dos cifras que el cliente lleva en la cabeza toda la configuración —cuántos
cuartos y cuántos lugares de cochera— ahora tienen glifo propio, y el mismo en
todas partes:

| Dónde | Qué se ve |
|---|---|
| Barra de presupuesto, arriba a la izquierda | `[cama] 3  [coche] 2`, **siempre**, con lote o sin él |
| Selector de cochera de "Tu lote" | el coche nuevo en lugar del que estaba dibujado en trazo |
| Contador de recámaras | la cama junto al rótulo |
| Lámina del paso 5 | los dos, en blanco sobre la cinta |

Son de **mancha y no de línea**, que es lo que los separa del resto de
`ConfigIcons`: no son una zona que se agrega, son una cuenta que se lee a 16 px
al lado de un número, y un trazo de 1.6 a ese tamaño se cierra en una mancha
sucia. La almohada, las ventanas y los pasos de rueda son huecos del mismo
trazo (`fillRule="evenodd"`), así que cada icono es UNA figura y toma el color de
donde se pare — tinta en la barra, blanco en la cinta, gris cuando está apagado.

Dos decisiones que no son de dibujo:

- **El coche en cero no desaparece, se apaga.** "Sin cochera" es algo que el
  cliente decidió y tiene que poder verlo; una fila que se esfuma parece un
  error de la página.
- **En lote del catálogo el coche muestra 2**, los del plano aprobado — no el
  `cajones` del cliente, que ahí no manda. Misma regla que ya seguía
  `garageTexto`.

Los baños **no** llevan glifo: el manual no tiene uno y meter un inodoro
inventado al lado de una cama y un coche que sí son del cliente habría roto la
pareja.

### 29.9 En Enclave la fachada ya existe, y ahora se ve

En lote de la subdivisión el reglamento trae puesta la fachada, así que la
lámina enseñaba un hueco con "la trae puesta el reglamento" — media lámina en
blanco justo en el único proyecto del que **sí hay imagen**. Ahora ese hueco lo
llena el render de la casa modelo, el mismo que presenta a Enclave en "Lugares
disponibles".

Tres detalles que trajo:

- **La imagen no se elige en la lámina.** La pasa el configurador, tomando de
  `SUBDIVISIONES` la que la subdivisión declara con `tipo: 'render'`. La lámina
  no sabe de subdivisiones y no tiene por qué aprender.
- **Se encuadra con `cover`, no con `contain`.** Las maquetas vienen recortadas
  y con su propio aire; una foto rectangular con `contain` dejaba dos franjas de
  textura arriba y abajo.
- **Va rotulada RENDER.** El sitio promete "sin render que prometa lo que no se
  entrega" dos pantallas más abajo, y la tarjeta de Lugares disponibles ya
  rotula esa misma imagen. Una lámina que la enseñara pelona contradiría al
  sitio.

El nombre de abajo pasó de "De la subdivisión" a **"Fachada de la
subdivisión"**: con el hueco vacío se entendía, con una imagen al lado había que
decir de qué es.

### 29.10 El pie, de tres cortes a uno

La cuarta parte de abajo de la lámina venía partida en tres: la cinta de
nombres en `CINTA`, una tira de textura, y el bloque de contacto en el
`CINTA_TITULO` más hondo. Ahora es **una sola pieza** del gris de la banda de
iconos, pegada al pie de las maquetas, con las dos filas adentro.

Lo que separa las filas es un **filete claro sobre el mismo gris**, no un
segundo tono: cambiar de color habría vuelto a partir la pieza en dos, que es
justo lo que se quitó. El rótulo "contacto cliente" subió de `#D3D6D7` a
`#E2E5E6` porque el gris de fondo es más claro que el que tenía debajo.

`CINTA_TITULO` sigue vivo en las dos piezas donde sí tiene que resaltar sobre lo
demás: el bloque del título arriba y el sello de RENDER.

### 29.11 Dos capas translúcidas no se encabalgan

La cinta de las cifras corría de filo a filo con `paddingLeft: 50%` y el bloque
del título iba **encima**. Como los dos son translúcidos, en esa mitad las dos
capas se sumaban: un rectángulo más oscuro que el resto de la cinta, con su
escalón a la vista.

La cinta ahora **arranca en el 48 %**, donde termina el título, y los dos se
topan al filo. El ancho del título pasó de `maxWidth` a `width` por lo mismo: con
un máximo, un nombre de plano corto habría abierto un hueco entre las dos piezas
en lugar de encimarlas.

### 29.12 Tres ajustes de tamaño y un icono que no se veía

**Los glifos crecieron** en las cuatro partes donde salen: 16 → 21 px en la
barra, 16 → 20 en el contador, 26 → 32 en el selector de cochera y 2.6 → 3.6cqw
en la lámina.

**El isométrico va DEBAJO de las franjas, y a propósito.** Se probaron las dos
lecturas —bajarlo hasta que no tocara ninguna cinta, y meterlo debajo— y la
buena es la segunda: las cintas son translúcidas, la maqueta se sigue viendo a
través, y de ahí sale la profundidad de la lámina. Sin eso son tres bloques
apilados; con eso es una sola pieza con las cintas encima.

Tres cosas lo hacen posible:

- **La mitad de arriba dejó de recortar** (`overflow` fuera). Lo que contiene la
  maqueta es el recuadro de la lámina, que sí recorta.
- **El recuadro se derrama nueve cqw sobre la banda de zonas** (`inset` con el
  fondo en negativo), y la banda se pinta encima con `zIndex: 1`.
- **La maqueta crece un 14 % desde su borde de arriba.** Cabía justa en su
  recuadro y la banda le pasaba por un aire transparente, sin cruzarla; creciendo
  hacia abajo la cruza de verdad. Lo que se sale a los lados es margen del
  render. El bloque del título baja más
que la cinta de cifras y le tapaba la esquina de arriba; ahora la maqueta arranca
por debajo de los dos y se ve entera.

**Y un defecto que salió al revisar:** en la banda de zonas de la lámina,
"cocina abierta", "master + balcón" y "medio baño" eran **cuadros blancos
vacíos**. Sus iconos no son de trazo sino de PASTILLA —un squircle relleno con
el glifo en blanco fijo adentro— así que pedirles `color="#FFFFFF"` pintaba la
pastilla de blanco y dejaba el glifo blanco sobre blanco. Ahora `ConfigIcons`
exporta `ICONOS_DE_PASTILLA` y la lámina les pasa `CINTA_SOLIDA` —el gris de la
cinta ya compuesto contra el papel—, así que la pastilla se funde con la banda y
el glifo aparece. Los de trazo siguen recibiendo blanco.

### 29.13 Los glifos de la cabecera, al doble

De 3.6 a **7.2cqw** en la cinta de cifras. Al crecer, la segunda línea de "3
recámaras · 3 baños" se montaba sobre el glifo, así que la fila se rearmó: el
icono queda fuera del flujo del texto (`flex: none`) y el nombre pasó a su propia
caja con `flex: 1` alineada a la derecha, en vez de ir suelto en la línea. El
aire entre las dos columnas de la cinta bajó de 4 a 2.6cqw — el glifo doble se
comió el ancho que el texto necesitaba.

Segunda pasada: los glifos se **recorrieron a la derecha**, pegados a su propio
nombre. La caja del texto pasó de `flex: 1` a un ancho fijo de 14.5cqw — con el
flexible el texto se estiraba hasta el filo izquierdo y empujaba el glifo lejos
de lo que nombra; con ancho fijo los dos caen en la misma vertical y el bloque
entero se lee como una columna.

Tercera: las cifras se fueron al **filo izquierdo** de la cinta y los glifos al
**derecho** —`space-between` en lugar de `flex-end`, y el icono después de su
nombre en vez de antes—. La cinta ahora se lee de fuera hacia adentro: los pies
cuadrados pegados al título, las cuentas pegadas al canto de la lámina.

Cuarta y última: el glifo vuelve a **abrir** el renglón —el nombre cierra contra
el filo derecho— y baja un 20 %, de 7.2 a 5.8cqw. El bloque sigue anclado a la
derecha por el `space-between`, así que el orden cambió sin que las cuentas se
despeguen del canto.

El texto de esas dos cuentas quedó con **bandera a la izquierda**, aunque el
bloque esté anclado a la derecha: alineado a la derecha, las dos líneas
arrancaban cada una en un punto distinto y ninguna coincidía con su glifo.

### 29.14 El pie hace lo mismo, y las cintas bajan de opacidad

Lo de la banda de zonas se aplicó también al **pie**: las dos maquetas de abajo
se meten bajo él y se ven a través. Su caja pasó de `1 / 0.78` a `1 / 0.95` y
dejó de recortar, la imagen se apoya abajo —con `contain` en una caja más alta
quedaba flotando en medio y el pie le pasaba por un aire transparente— y la fila
lleva `marginBottom: -10cqw` para derramarse. El pie se pinta encima con
`zIndex: 1`.

El sello de **RENDER se mudó a la esquina de arriba**: abajo quedaba tapado por
el pie, y esa etiqueta no es decorativa — es la que cumple la promesa de "sin
render que prometa lo que no se entrega".

**Las cintas, un punto más transparentes.** `CINTA` de 0.88 a **0.84** y
`CINTA_TITULO` de 0.90 a **0.84**, para que las maquetas se lean por debajo. El
piso lo pone el texto blanco: a 0.84 la cinta compuesta contra el papel da
**4.57:1** y sigue pasando AA; a 0.82 cae a 4.37 y ya no. `CINTA_SOLIDA` —el
gris opaco de los iconos de pastilla— se recalculó a `#727678` con la nueva
alfa.

### 29.15 El baño estrena glifo, y la barra deja de contar dos veces

Tercer glifo del programa: **el inodoro**, hermano de la cama y el coche —de
mancha, con el botón del tanque como hueco del mismo trazo—. Sirve igual para
baños completos y para medios baños; lo que cambia es el texto de al lado.

Sale en las tres partes donde ya salían los otros dos: la **barra de
presupuesto** (`[cama] 3 [inodoro] 3 [coche] 2`), el **contador de baños** del
paso de cuartos, y la **lámina**.

Dos reacomodos que trajo:

- **En la lámina, recámaras y baños dejaron de compartir renglón.** Eran "3
  recámaras · 3 baños" con una sola cama al lado; ahora son tres renglones, cada
  cuenta con su icono, como se leen en la barra durante toda la configuración.
- **La barra perdió su línea de texto.** Decía "3 recámaras · 3 baños" debajo de
  los glifos, que ya dicen lo mismo: la casa se contaba dos veces en la misma
  barra. El `programa` de `PresupuestoBar` se fue con ella.

### 29.16 El pie firma con la marca, no con el logotipo escrito

En el pie de la lámina, "LA GRAN PIEDRA" en letras se cambió por el **cubo**
(`logo-full.svg`, que es el isotipo). La lámina ya lleva el nombre al lado, en el
bloque de contacto, así que el logotipo escrito lo repetía; el cubo identifica
más rápido y aguanta mejor el tamaño chico.

Va con sus colores —se quitó el `brightness(0) invert(1)` que blanqueaba el
logotipo— y en la variante **para fondo oscuro**, que el cliente entregó:
`public/logo-marca-oscuro.svg`, la misma pieza con la mitad gris del cubo en
blanco. La normal lleva ahí un `#505759` que sobre esta cinta queda casi al
mismo tono y parte el cubo por la mitad. El carmín y el rosa no cambian.

### 29.17 El plano `A` ya tiene maqueta

Llegó el render del **patio techado atrás** y con él se cierra el pendiente que
venía desde la sesión 27: el plano `A` caía al diagrama SVG y al lado de los
isométricos de B, C y D se veía pobre.

El original llegó distinto de los otros tres: **2400 × 1792 y sobre fondo
negro**, no 1200 × 896 con transparencia. Así que se escribió
`scripts/floorplan-iso.js`, que le levanta el alfa del propio brillo —el dibujo
es blanco y gris sobre negro puro— con una rampa de 10 a 48. Por debajo de 10 es
fondo; por encima de 48 ya es dibujo, porque el gris más oscuro de las cuatro
maquetas anda en 96. Ese tramo de en medio es el antialias del render, y se
conserva en vez de recortarse a filo de navaja.

Venía además **más claro** que los otros tres: sus sombras más hondas se
quedaban en 115 de brillo, donde las de B, C y D llegan a 68, y al lado de ellos
se veía desteñido. Lleva un ajuste de niveles —punto de negro a 68, gamma 0.88
para que el estirón no ensucie los medios— y con él los cuatro comparten
percentiles: p2 de 61 a 80, p25 de 161 a 182. El blanco no se toca; los cuatro
renders comparten el mismo papel.

Sale a **1100 × 821**, la medida de los tres que ya estaban: el carrusel y la
lámina asumen esa proporción, y una maqueta más grande se vería de otro tamaño
en la misma tarjeta. El script no pisa lo que ya existe salvo con `--rehacer`.

### 29.18 Las maquetas de fachada, más grandes y más marcadas

Dos ajustes en `scripts/fachadas-iso.js`, y las cuatro se regeneraron:

- **Menos aire dentro del lienzo**: el margen bajó de 0.14 a **0.06**. La
  tarjeta del paso 2 mide lo que mide, así que la única forma de que la maqueta
  se vea más grande sin deformarla es recortar más cerca — recorte, no estirón.
- **El canto, más marcado**: contraste 1.5 sobre la maqueta grande, el mismo
  recurso que ya usaba la miniatura. Solo se oscurece lo que ya era gris, así
  que lo que gana peso son las líneas y las sombras, no los muros. Con eso las
  cuatro fachadas caen en la misma familia tonal que los floorplans: p10 de 96 a
  98 contra 105 a 119, cuando antes andaban en 170 a 188 y al lado se veían
  lavadas.

El cálculo de contraste que estaba escrito a mano dentro de la miniatura salió a
`contrasta()`, que ahora usan las dos.

### 29.19 Fuera las dos cocinas del catálogo, y el medio baño estrena inodoro

**"Cocina abierta" y "Cocina cerrada" salieron de `MODULOS`.** Con ellas se
fueron sus dos iconos y su entrada en `ICONOS_DE_PASTILLA`. El mecanismo de
`grupo` —el que hace que elegir una sustituya a la otra y cobre solo la
diferencia— se queda: lo sigue usando el par del master.

Eso tuvo una consecuencia que vale la pena anotar: **el townhouse declaraba la
cocina abierta entre sus `incluidas`**, y esa referencia se fue con la zona. El
plano del Lote 17 la sigue teniendo —es dato del set aprobado— pero ya no se
declara como zona, porque el cliente no elige entre abierta y cerrada. Quedó
escrito así en el comentario de `PLANES`, y el ejemplo del correo de prueba
también la perdió.

**El medio baño usa ahora el inodoro**, y **sin pastilla**: se probó enmarcado
y en la lista se separaba de los demás, que son de trazo suelto. Es el mismo
dibujo que el cliente ya vio en la barra de presupuesto y en la lámina antes de
llegar al catálogo. Va en tinta (`#1C1E1F`) y no en el gris de los iconos
de línea, porque sus vecinos de la lista son pastillas rellenas de ese negro y a
`#505759` se veía más claro que todos. Salió de `ICONOS_DE_PASTILLA`, así que sobre la cinta oscura
de la lámina va en blanco como los de trazo, y no con el gris de fondo que
necesitan las pastillas.

### 29.20 El paso 3 enseña la misma lámina, en chico

Donde estaba la mesa del arquitecto —los papeles acumulándose sobre el
escritorio— va ahora **la lámina del paso 5**. El cliente veía dos piezas
distintas para la misma casa: una mientras la armaba y otra al final; ahora ve
la de siempre, y la ve crecer.

No hizo falta reacomodar nada por dentro: la lámina se mide en `cqw` contra su
propio contenedor, así que a 340 px de ancho —el tope que se le puso para que
la vertical de 1 : 1.45 entre en el hueco de la mesa— todo escala solo. Mide
338 × 490 y cabe completa, con su pie y su marca.

`MesaArquitecto.tsx` **se quedó sin usar**. No se borró: es la pieza que sabe
dibujar el cuadro de áreas, y conviene decidir con calma si eso se rescata o se
va.

### 29.21 La dirección se pide en el brief, después del comentario

El paso del brief tiene ahora **dos momentos en el mismo hueco**. Primero el
comentario, con un botón que lo cierra; al confirmarlo, el titular, el texto de
apoyo y el campo cambian juntos y el mismo espacio pasa a pedir **"Agrega la
dirección de tu lote"**. Antes la dirección vivía arriba de la lámina en el paso
siguiente, donde llegaba tarde: ya se le había enseñado el resultado.

Se probó apilarlos —comentario arriba, dirección abajo— y obligaba a bajar la
pantalla para ver el segundo. Sustituyéndose, el paso cabe entero sin
scrollear.

Tres decisiones dentro:

- **El botón dice lo que hace en cada caso**: "Confirmar" si escribió algo, "No
  tengo comentarios" si el cuadro está vacío. El comentario es opcional, así que
  el botón está siempre — pedirle "confirmar" a un cuadro vacío se siente como
  un trámite; así es una respuesta, y nadie se queda sin llegar a la dirección.
- **Confirmar no cierra con llave.** Debajo de la dirección queda lo que
  escribió, con un "cambiar" que devuelve al comentario.
- **La luz va en secuencia**: primero el botón de confirmar (`confirmarBrief` en
  `guiaActiva`), y solo después "Siguiente", que no se enciende hasta que la
  dirección está a la vista. Los dos campos siguen siendo opcionales: esto
  decide cuándo se enciende cada botón, no si se puede apretar.

### 29.22 Limpieza antes de subir

De **42 errores y 48 advertencias** de ESLint a **6 y 21**, sin tocar una sola
línea de comportamiento. Lo que se fue:

| Qué | Por qué sobraba |
|---|---|
| `runAI()` y sus tres estados (`aiLoading`, `aiError`, `briefLectura`) | llamaba a `/api/ai-suggest` para leer el brief; ese camino salió de la pantalla hace tiempo —el brief viaja tal cual al arquitecto— y la función se quedó sin quien la llamara |
| `components/MesaArquitecto.tsx` | lo reemplazó la lámina en el paso 3, ver 29.20 |
| `patioDelPlan()`, `casaConCochera()`, `ft2Estancias()` | copias locales de cuentas que ya viven en `lib/data.ts`, sin un solo sitio que las llamara |
| `areasDeLaCasa`, `modulosAgregados` | los consumía la mesa |
| `moduloIdx` | se reiniciaba y nadie lo leía |
| `modo` de `FilaOpcion` | su propio comentario decía que no tenía efecto; ningún sitio lo pasaba |
| ocho importes muertos, `CREMA` y `GRIS_HONDO` | restos de piezas que ya se habían ido |

`subdivisionKey` dejó de ser estado y pasó a constante: hay una sola
subdivisión y su `set` no lo llamaba nadie.

**Los 6 errores que quedan son los mismos de la sesión 26** —
`react-hooks/set-state-in-effect` en efectos que sincronizan estado derivado— y
siguen revisados uno por uno: ninguno puede ciclarse. Las 21 advertencias son
`<img>` en lugar de `next/image`, que es decisión tomada: son sprites con alfa y
SVGs servidos desde `public/`.

Verificado después de limpiar: recorrido completo hasta el brief sin un solo
error en consola.

### 29.23 La barra de pasos, animada

La fila de pasos —cinco o seis rectángulos planos pegados, cada uno con su
propio color de fondo— se cambió por **`components/PasosBarra.tsx`**: un riel
con un punto numerado por paso y una franja carmín que lo recorre, sobre la
referencia en video que mandó el cliente (un riel verde con checkmarks). Los
números sustituyen a los checkmarks —este indicador tiene que decir CUÁL paso
es, no solo cuántos ya se hicieron— y el verde se cambió por los colores del
manual.

**Los tres estados, mismos que ya usaba la fila vieja:**

| Estado | Cuándo | Se ve |
|---|---|---|
| Hecho | el paso ya quedó atrás | punto carmín, número blanco |
| Actual | el paso en el que está parado | punto tinta, número blanco |
| Pendiente | todavía no le toca | punto en blanco, número gris (más claro si ni siquiera está permitido saltar ahí) |

Los puntos van del primero al último **filo a filo con el riel** —paso 1 nace en
el 0 %, el último cierra en el 100 %— así que la franja carmín llega exactamente
a cada punto cuando le toca, sin matemática distinta a la del propio ancho.

**Solo anima al avanzar**, como se pidió. El mecanismo es un `ref` con la
posición anterior: solo cuando la nueva posición es MAYOR se enciende
`transition` (620 ms), y se apaga otra vez pasada esa duración. Volver atrás,
cargar una configuración guardada o reiniciar cambian el ancho de la franja sin
transición — se probaron los tres casos en el navegador y los tres saltan
directo al valor final, sin barrido.

Un bug que salió al probar el camino de lote propio (6 pasos, con una previa
antes del paso 1): `pasos.findIndex(...) + 1 || 1` — en JS `0 || 1` da `1`, así
que en la previa (donde ningún paso de la lista es "el actual") el punto 1 se
encendía como si ya estuviera en marcha. Se cambió a comparar contra la
posición real sin el `|| 1`, y la previa vuelve a mostrar los seis puntos en
blanco, como hacía la fila vieja.

El punto que se enciende de recién llegado rebota una vez con `.lgp-guia-entra`
— el mismo gesto de "recién desbloqueado" que ya usa el resto del configurador,
para que este avance se lea como la misma familia de feedback y no como un
efecto aparte inventado para la ocasión.

Verificado en desktop y en mobile (375px), y en los dos recorridos (5 pasos en
Enclave, 6 en lote propio).

### 29.24 La carpeta: el resumen del paso 3, en abanico

Donde vivía el duplicado en chico de la lámina del paso 5 —la misma casa
impresa dos veces con dos vestidos distintos— va ahora
**`components/CarpetaHistorial.tsx`**: una carpeta carmín que, al pasar el
cursor, deja asomar los papeles de adentro y despliega en abanico el
historial de lo que el cliente ya eligió. Es un gesto, no una segunda lámina:
se abre cuando el cliente quiere mirar y se cierra sola.

Va sobre dos referencias que mandó el cliente: una carpeta de Windows que
al pasar el cursor asoma los papeles de adentro, y un botón que al pasar el
cursor hace brincar un panel con un rebote. Aquí son tres o cuatro paneles
los que brincan, **en abanico y no apilados** — la parte de "en forma
radial" que pedía el cliente.

**Los tres paneles fijos, y un cuarto condicional:**

| Panel | Contenido | Cuándo aparece |
|---|---|---|
| Tu lote | Plano, forma y medida del lote, dirección | Siempre |
| Estilo y programa | Recámaras/baños/cochera, fachada, paleta, ft² | Siempre |
| Zonas | Icono + nombre de cada zona elegida | Siempre, en cuadrícula de 2 columnas |
| Zonas 2/2 | El resto de las zonas | Solo si hay más de 4 — de ahí para arriba un panel se veía apretado |

**Solo texto en los dos primeros, solo iconos en el o los últimos**, tal como
se pidió — nada de mezclar los dos lenguajes en un mismo panel.

**Cómo se abre:**

- **Pasar el cursor** la abre; sacarlo la cierra, con 160 ms de gracia — cruzar
  de la carpeta a un panel pasa un instante fuera de los dos, y sin el
  respiro se cerraba a medio camino antes de llegar a leer nada.
- **Un clic la fija abierta** — el camino para quien no tiene cursor, en una
  pantalla táctil. Un clic afuera de todo (carpeta o paneles) la cierra; un
  clic DENTRO de un panel no, para poder leer sin que se cierre sola.
- **Teclado**: la carpeta es un `<button>` de verdad, así que Tab la alcanza y
  Enter/Espacio la abren; `aria-expanded` dice su estado y `aria-label` cambia
  entre "Ver" y "Ocultar el resumen de tu casa".

**Todo en `cqw`**, como la lámina de `FichaCasa`: el ancho lo pone la columna
donde vive el componente (tope 560 px) y el abanico entero —posiciones,
tamaños de carta, tipografía— escala con él. Es lo que evitó tener que
escribir una media query para el teléfono.

**Un ajuste que hizo falta tras la primera prueba real:** con cinco zonas
puestas (el caso de cuatro paneles), la carta más ancha en la posición más
abierta del abanico (±44 cqw) se salía por el filo izquierdo de la página en
cualquier ventana bajo ~1120 px — es decir, casi cualquier pantalla real. Se
achicó el abanico a ±32 cqw y las cartas de 35→32 cqw (iconos 30→28), y se
verificó con `getBoundingClientRect` que las cuatro cartas caben dentro de
[0, ancho de ventana] tanto en desktop (650 px) como en mobile (375 px).

Verificado en el navegador: abrir con cursor, cerrar al sacarlo, fijar con
clic, cerrar con clic afuera, NO cerrar con clic dentro de un panel, el caso
de 3 paneles y el de 4 (cinco zonas repartidas 3+2), y las dos anchuras.

### 29.25 La carpeta, fiel a la referencia — y al doble de grande en reposo

Tres ajustes sobre la carpeta de 29.24, después de mirar la referencia cuadro
por cuadro (`ffmpeg` a 10 fps) en vez de a ojo:

**La estructura real tiene TRES papeles, no dos.** La referencia esconde detrás
del cuerpo un papel vino, uno gris y uno crema — cada uno asoma un poco menos
que el de atrás, y por eso se lee como una pila y no como una sola lámina.
`CarpetaHistorial` tenía solo dos (vino y crema); se agregó el gris de en medio
(`GRIS_PAPEL`) y se ajustó cuánto sube cada uno para que los tres queden
escalonados en vez de encimados.

**La proporción estaba mal.** La referencia mide 1.5 : 1 (ancho : alto); la
carpeta salía en 1.27 : 1 — más cuadrada de lo que es una carpeta real. Se
corrigió el alto del botón para que la razón cierre.

**La carpeta ahora tiene su propio brinco de tamaño**, además del de los
paneles: en reposo mide el **doble** de lo que medía antes de este cambio, y al
pasar el cursor —o tocarla— encoge al tamaño que ya tenía. Dos capas separan
esto: una de AFUERA que solo centra y nunca se mueve, y `CarpetaTrigger` adentro
que hace todo el `transform: scale(2 → 1)` desde el filo de abajo. Separarlas
evitó el problema clásico de escribir `translateX(-50%) scale()` en un mismo
`transform`: la escala multiplica también la traslación y la carpeta se va de
centro — se probó junto y se corrigió aparte.

**Un hallazgo de la propia verificación, no del código:** el navegador de
pruebas tarda uno o dos segundos en asentar el fotograma después de un hover,
aunque la transición CSS dura 480 ms y el estado de React ya cambió al
instante (`aria-expanded` lo confirma antes que la pantalla). Los primeros
capturas de pantalla después de mover el cursor salían con el fotograma
anterior; esperando un poco más se ve el estado real. Es una particularidad de
la herramienta de captura, no de la animación.

### 29.26 Lo que quedó abierto

- **Sigue sin commitear.** El último commit es `88f23cc`.

## Archivos clave de la sesión 29

| Archivo | Qué es |
|---|---|
| `components/FichaCasa.tsx` | *(nuevo)* la lámina del paso 5: textura de cubos de fondo, cabecera con isométrico y sus dos cintas, banda de iconos de zona, maquetas de fachada y paleta con su cinta de nombres, bloque de contacto y pie carmín |
| `components/HomeConfigurator.tsx` | la lámina en los pasos 3 y 5, el brief en dos momentos con la dirección del lote, los glifos del programa, y la limpieza de 29.22 |
| `components/ConfigIcons.tsx` | `CamaIcon`, `BanoIcon`, `CarroIcon` e `ICONOS_DE_PASTILLA`; fuera las dos cocinas |
| `components/PresupuestoBar.tsx` | las tres cuentas con su glifo arriba a la izquierda; fuera la línea de texto que las repetía |
| `scripts/floorplan-iso.js` | *(nuevo)* normaliza los isométricos de floorplan: alfa del fondo negro, tono igualado y 1100 × 821 |
| `scripts/fachadas-iso.js` | menos aire y más contraste en las cuatro fachadas |
| `public/floorplans/A.webp` · `public/logo-marca-oscuro.svg` | *(nuevos)* la maqueta del patio techado y la marca para fondo oscuro |
| `lib/guardado.ts` · `lib/ficha.ts` | `direccionLote` persistida, y gana sobre la dirección del catálogo en la ficha que se envía |

---

## Sesión 30 — La carpeta se rehace en columnas, y el brief deja de repetir lo elegido (sin commitear)

### 30.1 El overlap en móvil: los `minWidth` rompían lo que `cqw` prometía

`CarpetaHistorial` (creado en la sesión 29) estaba verificado solo contra el
ancho de escritorio (560 px, el tope del componente). Al probarlo en un
teléfono real aparecieron encimes que no existían ahí — el panel "Tu lote"
salía con el filo izquierdo en -8 px, fuera de la pantalla.

La causa: varios elementos llevaban un **piso en píxeles** (`minWidth`)
además de su ancho en `cqw` — el panel de texto a 142px, el sprite a 58px, la
zona a 38px. Un piso en px y un ancho en `cqw` son dos sistemas de medida
distintos: mientras el envolvente fuera ancho (≥ ~450px), el `cqw` ganaba y
todo se veía bien; en cuanto el envolvente bajaba de ahí, el piso en px se
volvía MÁS ANCHO que su `cqw` correspondiente y cada elemento salía más
grande de lo que el resto de la geometría había calculado — rompiendo la
separación que ya se había verificado a mano en la sesión 29.

Un segundo culpable, más escondido: el tamaño del icono de zona no era un `%`
del contenedor sino un número en **píxeles calculado una sola vez en JS**
(`p.w * 3.15`, calibrado a ojo para que se viera bien exactamente a 560px de
envolvente). En cualquier otro ancho el icono seguía midiendo lo mismo en px
mientras su caja sí encogía con `cqw` — el icono se salía de su propia caja.

**La cura, en los dos casos, fue la misma: quitar el número fijo y dejar que
todo sea puramente proporcional.** Los `minWidth` se quitaron; el icono de
zona pasó a `width: 56%` sobre un cuadro por relleno (ver 30.2). Un tercer
caso menos obvio: el rótulo de texto bajo cada sprite y cada zona usaba
`clamp(pisoPx, Xcqw, techoPx)` — el piso en px tenía el mismo problema que
`minWidth`. Se cambió a `min(Xcqw, techoPx)` (sin piso) y se fijó
`white-space: nowrap` — sin eso, un nombre de paleta largo ("Nogal + Mármol
Crema") envolvía a dos líneas en cuanto la caja se angostaba, duplicando su
alto real por encima de lo que el resto de la geometría asumía.

Verificado con un checador de encimes por `getBoundingClientRect` — el mismo
patrón que ya se usaba en la sesión 29, ahora contra 0/1/3/5/6/9 zonas × 327px
(móvil) y 560px (desktop): cero encimes en las doce combinaciones.

### 30.2 Las zonas dejan el anillo: dos columnas a los lados, nunca sobre los sprites

El anillo bajo los sprites (de la sesión 29) empacaba bien pero dejaba dos
huecos vacíos a los lados de la carpeta — el cliente los marcó en una captura
y pidió reacomodar ahí. Rehacerlo llevó tres vueltas:

1. **Primer intento: colgar el desborde (6ª zona en adelante) a los lados,
   pero adentro del filo de los paneles (`XLIM`).** Fue el error de signo que
   costó más caro: `XLIM` es el filo INTERIOR del panel — el panel ocupa de
   ahí para AFUERA, no para adentro. Poner las zonas más allá de `XLIM` las
   metía DENTRO del panel, no las alejaba de él. Se vio en vivo: el icono
   "Comodín" quedaba literalmente encima de la tarjeta "Tu lote".
2. **El cliente pidió ir más lejos: que los sprites se queden solos en el
   centro**, y todas las zonas —no solo el desborde— vivan a los lados. Eso
   cambió la protección de raíz: en vez de quedarse ADENTRO del filo del
   panel (por ancho), el corredor entero de zonas se protege quedándose por
   DEBAJO del filo de abajo del panel (`PANEL_ALZA`, por altura) — liberado
   de eso, `FLANCO_X` pudo abrirse de 15 a 28 cqw sin tocar nada.
3. **El cliente pidió una tercera cosa: que el desborde no salte arriba de
   los sprites** (que sí hacía el diseño de la vuelta 2) **sino que siga
   hacia abajo, más allá de la carpeta.** `posicionesZonas` quedó así: el
   renglón de más arriba nunca pasa de `FLANCO_ARRIBA` (el filo de abajo del
   panel, con margen); con pocas zonas la columna entera arranca cerca de la
   carpeta (`FLANCO_ABAJO_PREFERIDO = -14`); con muchas, el renglón de ABAJO
   se corre más lejos de la carpeta — nunca se aprieta el paso entre
   renglones (`FLANCO_PASO`, fijo) para hacerle sitio al de arriba.

Un bug de fondo salió a mitad del camino: el cuadro del icono de zona
(`width: 56%, aspectRatio: '1 / 1'`) no salía cuadrado — 4.2 × 5.84 cqw en vez
de 4.2 × 4.2. `aspect-ratio` no se estaba respetando como hijo de una columna
flex. Se cambió a la técnica clásica de relleno-por-porcentaje
(`paddingBottom: 100%` sobre un cuadro sin alto, con el contenido
absolutamente posicionado encima) — el relleno-por-% SIEMPRE se calcula sobre
el ancho propio del elemento, sin depender de si es hijo de un flex ni de si
el padre tiene alto definido. Con el cuadro ya cuadrado, `FLANCO_ALTO_ITEM`
(el número del que depende cuántos renglones caben) pasó a describir el alto
real y los encimes por renglones-demasiado-juntos desaparecieron.

### 30.3 El floorplan se queda solo y crece; fachada y paleta bajan

Última vuelta sobre los sprites: el cliente marcó con flechas que fachada y
paleta bajaran (cerrando el hueco que quedaba entre ellos y las zonas) pero
dejó el floorplan sin flecha — se queda arriba, solo en su franja, y pasó a
ser el más grande de los tres (`FLOORPLAN_ANCHO`, ya independiente de
`SPRITE_ANCHO`). Fachada y paleta bajan a `y: 0` — su posición estática, sin
ningún `translateY` — que resultó, sin ajustar nada más, ya lo bastante lejos
del floorplan (que se quedó en `FLOORPLAN_Y = -22`) para no tocarlo.

### 30.4 Recámaras, baños y cochera con icono en "Programa"

El panel "Programa" decía "3 recámaras · 2 baños" y "2 autos de cochera" en
texto plano. El cliente pidió los mismos glifos que ya usan `PresupuestoBar`
y el resumen del paso 3 del propio configurador (`CamaIcon`, `BanoIcon`,
`CarroIcon`) — para que "programa" se lea igual dondequiera que el cliente lo
mire, no una tercera cara del mismo dato. `Panel`/`lineas` ganó un tipo
`LineaIconos` para esta fila; el resto del panel (rótulo, ft², "Tu lote")
se sigue armando con el tipo de texto de siempre. `ConfigIcons.tsx` ganó de
paso `size?: number | string` en `IconProps` — ya existía en `GlifoProps`
para estos tres glifos, pero `ModuloIcon` seguía pidiendo un número; hacía
falta un `%` para el cuadro por relleno de la zona (ver 30.2).

De paso se quitó el nombre del plano del panel "Tu lote" — ya lo dice el
sprite del floorplan (que además es ahora el más grande de los tres, ver
30.3), y repetirlo dos veces era la misma redundancia que ya se había
resuelto para fachada y paleta en la sesión 29.

### 30.5 Un 20% más grande: el floorplan y los iconos de zona

Último ajuste de tamaño, pedido directo: `FLOORPLAN_ANCHO` (17 → 20.4) y
`FLANCO_ANCHO` (9.5 → 11.4), ambos × 1.2. `FLANCO_ALTO_ITEM` y `FLANCO_PASO`
se recalcularon a mano para que el paso entre renglones siguiera teniendo
aire con el icono más grande — se volvió a verificar 0/3/6/9 zonas × las dos
anchuras, cero encimes.

### 30.6 El brief ya no repite lo que el cliente ya eligió

El paso de brief abría con una fila de chips —nombre del plano, fachada,
paleta, "N rec · M baños" y cada zona corta— antes de la pregunta "¿algo que
quieras aclarar?". El cliente lo marcó para quitar: la pregunta va directo al
cuadro de texto, sin repetir un resumen que el cliente acaba de armar dos
pasos atrás.

### 30.7 Lo que quedó abierto

- **Sigue sin commitear.** El último commit sigue siendo `88f23cc`.

## Archivos clave de la sesión 30

| Archivo | Qué es |
|---|---|
| `components/CarpetaHistorial.tsx` | quita los `minWidth`/pisos en px que rompían el `cqw` en móvil; las zonas pasan de anillo bajo los sprites a dos columnas que se protegen por altura, no por ancho, y se extienden hacia abajo en vez de saltar arriba de los sprites; el floorplan se queda solo y crece, fachada y paleta bajan; iconos de zona y sprite del floorplan, +20 % |
| `components/HomeConfigurator.tsx` | se quita la fila de chips que repetía la elección justo antes de la pregunta del brief |
| `components/ConfigIcons.tsx` | `IconProps.size` acepta `string` (para el `%` del cuadro por relleno de la zona), a la par de `GlifoProps` |

## Sesión 31 — La carpeta cobra vida, y la ficha técnica se va por correo (sin commitear)

### 31.1 La carpeta se rehace con la forma del video

El cliente mandó `carpeta.mp4` y pidió la misma figura, respetando las
dimensiones y el color de la que ya existía. El disparador dejó de ser un `div`
con pseudo-elementos y pasó a ser un SVG de dos trazos (`viewBox 0 0 240 176`).

La proporción no se estimó a ojo: se sacaron cuadros con `ffmpeg` y se midieron
con un script de `sharp`, y de ahí salió **1.364:1** — la carpeta quedó en
`19 × 13.9 cqw`. La pestaña, el filo y el doblez salieron de la misma medición
(10.8 %, 3.4 % y 7.4 % del alto).

### 31.2 La carpeta se mueve, y la ficha se va por correo

Dos peticiones encadenadas:

1. **La carpeta magenta sale del paso 4** y su hueco se deja vacío, sin
   sustituto. La **ficha técnica** que vivía ahí (`FichaCasa.tsx`) deja de
   pintarse en pantalla y pasa a viajar **adjunta en el correo** al arquitecto.
2. **Se coloca entre el paso 3 y el 4**, porque tal como quedó no se podía
   avanzar.

`FichaCasa.tsx` se conservó a petición del cliente, con una cabecera ⚠ que
avisa que ya no lo renderiza nadie.

Para el adjunto se montó `lib/lamina.tsx` (1000 × 1414) sobre `ImageResponse` de
`next/og`. Dos cosas que costaron y conviene no volver a descubrir:

- **satori no decodifica webp.** No es una suposición: falla con
  `TypeError: u2 is not iterable`. Los 14 renders del sitio son webp, así que
  `scripts/renders-correo.js` genera derivados JPEG (720px, q82, fondo blanco)
  en `public/correo/`. Si falta el derivado, la lámina dice "sin render" en vez
  de reventar.
- **El tope del bundle son 500KB** y satori solo entiende flexbox.

`app/api/enviar-resumen/route.ts` ganó `?lamina=1` para verla sin mandar correo,
y `laminaPng()` falla en blando: si la imagen no se puede generar, el correo sale
igual sin adjunto. **No verificado de punta a punta**: falta `RESEND_API_KEY`.
La generación de la imagen sí está verificada.

`PASO_NOMBRES` perdió 'Tu casa' y quedó en cinco, a la par de `PASO_HINTS`.

### 31.3 La lupa: crece lo que miras

Con el abanico abierto, pasar el cursor —o tocar— sobre un sprite o un icono de
área lo amplía **2.5×**; al salir vuelve solo. Las ventanas de texto crecen
mucho menos, **1.2×**: ya son bloques grandes y con el 2.5 de los iconos taparían
media lámina.

Dos cosas que se aprendieron peleándose con esto:

- **Dos capas de transform, no una.** La de afuera posiciona y trae la animación
  de apertura con su retardo escalonado; la de adentro escala y desplaza, y tiene
  que ser inmediata. Metidas en el mismo nodo, el `scale` heredaba el retardo y
  `translateX(-50%) scale()` se componía mal.
- **`transformOrigin: center center`, no `center bottom`.** Con el origen abajo,
  el sprite del floorplan crecía hacia arriba y se salía del lienzo.

El estado se deriva en render (`conLupa = abierto ? enfocado : null`) en vez de
un `useEffect`, que disparaba el lint `react-hooks/set-state-in-effect`.

### 31.4 Globos flotantes: los vecinos se apartan

Al crecer un elemento, los que quedarían debajo **se hacen a un lado en tiempo
real**, como un manojo de globos, y vuelven a su sitio al soltar. La repulsión es
**por borde y no por centro** — `encimado = radioFoco + radioVecino + AIRE − dist`
— porque medir de centro a centro no sabe nada del tamaño de cada pieza y dejaba
los grandes encimados. El empuje se topa en `GLOBO_EMPUJE` y se escala por la
masa de cada uno: las ventanas pesan menos (`GLOBO_MASA_PANEL = 0.6`) para que
se aparten antes que un sprite.

Las ventanas de texto entraron al manojo después, a petición: empujan y se dejan
empujar igual que el resto.

### 31.5 La carpeta se transparenta solo cuando estorba

Si el rótulo de un icono o de un sprite termina **encima de la carpeta magenta**,
la carpeta baja a **70 % de opacidad** — y solo mientras dura el gesto. No es un
"siempre que haya lupa": se calcula si esa etiqueta cae de verdad dentro del
rectángulo de la carpeta, contando el crecimiento y el empuje del momento.
Verificado en los dos sentidos: ampliar el BBQ la deja intacta, ampliar la paleta
la baja a 0.7.

Para que la cuenta cuadre, el ancla del abanico dejó de estar escrita a mano en
cada sitio y vive en `ANCLA_ABANICO` — dos copias del mismo número es como
empiezan a no coincidir.

### 31.6 "Zonas" pasa a ser "áreas adicionales"

Cambio de término en las 7 cadenas que lo decían en pantalla
(`ZonasPanel.tsx`, `ZonasGuiadas.tsx`). Los nombres de archivo y de código se
quedaron como estaban.

### 31.7 El aviso del brief era el síntoma; el bloqueo era el problema

El cliente pidió ocultar el recuadro "FALTA POR DEFINIR / Aquí armas la casa…"
que salía en el brief. Al reproducirlo apareció algo peor: en esa misma pantalla
**"Siguiente" estaba bloqueado**.

La causa: `tocadoCuartos` y `tocadoZonas` son estado local y **no se guardan**,
mientras que `paso` sí. Al recargar y darle **"Continuar"** a una configuración
guardada, la guía creía que el cliente nunca había pasado por cuartos y áreas
—aunque su configuración ya los trajera— y lo dejaba encerrado en el brief con
una pista que hablaba de recámaras dos pasos atrás.

Arreglado en la raíz, en `retomar()`: quien tiene configuración guardada ya
recorrió esas etapas, así que la guía se da por vista. Y `pistaGuia` se limitó a
`esPaso3`, para que un aviso que habla de otra pantalla no salga fuera de ella.

Verificado: guardar en el brief → recargar → "Continuar" → sin aviso, "Siguiente"
habilitado y se llega hasta "PASO 4 DE 4 — TUS DATOS" con el botón de enviar. Y
la explicación **sigue saliendo donde sí sirve**, en el paso de áreas.

Es, muy probablemente, la misma causa detrás del "no puedo pasar de este paso"
que el cliente había reportado antes.

### 31.8 Lo que quedó abierto

- **El sprite del floorplan se recorta arriba** cuando se amplía 2.5× y está en
  su posición actual. Arreglarlo pide mover una de las dos cosas, y las dos las
  puso el cliente.
- **El adjunto del correo no está probado de punta a punta**: falta
  `RESEND_API_KEY`.
- **Sigue sin commitear.** El último commit sigue siendo `88f23cc`.

## Archivos clave de la sesión 31

| Archivo | Qué es |
|---|---|
| `components/CarpetaHistorial.tsx` | la carpeta pasa a SVG con la figura medida del video; lupa de 2.5× (1.2× en ventanas), repulsión de globos por borde, y opacidad de 0.7 solo cuando un rótulo cae sobre la carpeta |
| `lib/lamina.tsx` *(nuevo)* | la ficha técnica como imagen para el correo, en flexbox y sobre derivados JPEG |
| `scripts/renders-correo.js` *(nuevo)* | convierte los 14 renders webp a JPEG en `public/correo/` — satori no decodifica webp |
| `app/api/enviar-resumen/route.ts` | genera la lámina y la adjunta; `?lamina=1` para verla sin mandar nada; falla en blando |
| `components/HomeConfigurator.tsx` | `retomar()` da por vista la guía; `pistaGuia` solo en su paso |
| `lib/data.ts` | `PASO_NOMBRES` pierde 'Tu casa' |
| `components/FichaCasa.tsx` | se conserva a petición, marcado con ⚠: ya no se renderiza en ningún lado |

## Sesión 32 — El presupuesto espacial en tres rieles, y los botones entran al sistema (sin commitear)

### 32.1 Tres rieles en vez de una barra de dos franjas

`PresupuestoBar` pintaba un solo canal con dos tramos de carmín. El cliente pidió
**tres barras** —habitable, total y libre— cada una con un globo que cante los
pies en vivo, sobre una referencia de barra de progreso con globo flotante.

**La decisión que sostiene el bloque: los dos primeros rieles se miden contra la
misma regla**, el total que da el lote. Por eso se comparan leyendo hacia abajo —
el tramo oscuro del riel del total **es** el riel de arriba, verificado con 0px
de desviación. Medir cada uno contra su propio máximo se consideró y engaña: tres
barras casi llenas que no significan lo mismo y no suman nada entre ellas.

Se quitó lo que quedó repetido: el número grande de 19px (el globo del total lo
lleva vivo) y la leyenda de cuatro chips (cada riel se nombra solo, y esa leyenda
se envolvía en tres líneas en el teléfono). El aviso de **"No cabe"** conserva su
sitio y su peso.

Lo que cuesta, medido: en teléfono la cabecera pasa de 285 a 305px; en escritorio
de 197 a 281px. Tres rieles apilados con globo flotante cuestan eso. La
alternativa —ponerlos en fila de tres en pantalla ancha— se ofreció y quedó sin
tomar.

### 32.2 El riel de lo libre va al revés

Los tres rieles tienen que crecer en la misma dirección: dos que avanzan y uno
que retrocede se lee como si algo estuviera mal. Así que el tercero **no pinta lo
que queda libre, pinta lo que ya se gastó** — se llena al ocupar y se retrae al
liberar — y lo libre es el hueco que deja. El globo se para justo en el filo
donde ese hueco empieza, así que señala lo que nombra.

Su regla es el **techo habitable**, no el total construido: la cochera, el
pórtico y el patio no compiten por el presupuesto del cliente, y meterlos aquí
inflaría el porcentaje sin que él pueda hacer nada. Con esa regla el hueco vale
exactamente los ft² del globo. Como ahora hay dos reglas en juego, el pie las
dice las dos: "Tu lote da 2,219 ft² · 1,635 habitables".

Efecto lateral que conviene no confundir con un error: los rieles de *total* y
*libre* quedan casi del mismo largo. Es la forma de los datos —la obra no
habitable es fija, así que cualquier medidor de "ocupado" cuenta la misma
historia—. Los separa el color.

### 32.3 El aspecto y la veta, del video; los colores, del manual

Sobre `barra progreso.mp4`: canal en píldora con filete y relleno con vetas
diagonales que viajan. Los colores **no** se copiaron del azul del video — el
manual ya tiene nombre y valor para esta pieza: **Surco** (`#F0EDE9`) es
literalmente "el canal vacío de una barra de progreso", y **Filete Suave**
(`#E4E1DD`) el borde. La veta tampoco es un color nuevo: es el mismo relleno
aclarado, porque el carmín es la única voz del sistema.

**La píldora sí rompe el manual** ("canto vivo absoluto — radio 0 en todo menos
círculos"). Se cedió porque la forma la eligió el cliente sobre el video, y queda
anotado en el código.

### 32.4 La veta solo viaja cuando cambia el presupuesto

En reposo la veta está ahí pero quieta: es textura, no un cargador. Una barra que
se mueve sola todo el tiempo dice "estoy trabajando" cuando no pasa nada, y el
día que sí pasa algo ya nadie la mira.

Se resuelve con `useAnimacionAlterna` —el hook que ya existía para el barrido
carmín— sobre una firma de las tres cifras del presupuesto: 3 vueltas de 400ms y
se apaga sola. Dos nombres de keyframe (`lgpVetaA`/`lgpVetaB`) porque repetir el
mismo nombre no vuelve a disparar la animación. Verificado con `getAnimations()`:
vacío en reposo, dos animaciones al cambiar, vacío otra vez a 1.5s. Respeta
`prefers-reduced-motion`.

### 32.5 Los botones del recorrido entran al sistema

Cadena de peticiones sobre los mismos botones:

1. **"Listo"** como único rótulo. Antes el de cuartos decía una cosa si no habías
   tocado nada y otra con la cuenta si sí; el de áreas decía "Ya terminé con las
   áreas". Tres frases largas para dos botones que hacen lo mismo.
2. **Al ancho de su texto** (98 × 48px), no cruzando la columna.
3. **Mismo color.** Uno era negro sólido y el otro fantasma gris — estaban
   escritos por separado en línea, y por eso se separaron. Ahora comparten una
   sola definición (`BOTON_LISTO_CLASE`).
4. **La misma animación que las tarjetas de "sube tu lote".** Ahí estaba la razón
   de fondo: los "Listo" tenían el color a mano y el zoom, pero **no el gesto**.
   Se metieron a `.lgp-btn`.
5. **Blancos al abrir.** Ningún botón del recorrido nace relleno: nació
   `.lgp-btn-papel` —hoja con filo de tinta que se llena al tocarla— y ahí van
   "Listo", "Atrás" y "Siguiente". Excepción a propósito: "Siguiente" bloqueado
   se queda en el gris apagado, porque no es una hoja que se pueda llenar.

**Dos arreglos que salieron de ahí:**

- `.lgp-tarjeta-tinta` se rellenaba con `[aria-pressed='true']`, así que la
  tarjeta ya elegida **nacía negra** y la otra blanca: dos tarjetas que hay que
  comparar, presentadas distinto antes de tocar nada. Y contradecía su propio
  comentario, que dice que el fondo negro está reservado para el gesto. Quitado
  el selector: el punto carmín dice cuál está tomada.
- `.lgp-btn` y `.lgp-hover-zoom` pesan igual en CSS y `.lgp-btn` va después, así
  que su `transition` **se llevaba por delante** la del zoom: el color entraba
  suave pero el crecimiento y la sombra aparecían de golpe. `.lgp-btn` recuperó
  `transform` y `box-shadow` en su lista, con los valores que ya declara
  `.lgp-hover-zoom`. **Afecta a todos los botones del sistema**, no solo a estos.

### 32.6 Fuera el botón "Quitar una recámara"

Estaba en dos sitios —el panel de áreas y el modo guiado— y salió de los dos. Era
un atajo que duplicaba un control que ya existe (el "−" del contador de
recámaras, en la misma pantalla) y lo duplicaba en carmín, el color que el sistema
reserva para lo que confirma o alarma.

**La explicación se queda**: en la lista de lo que no cabe sigue leyéndose "Te
quedan 52 ft² habitables libres. Quitar una recámara devuelve 185 ft²". El
camino no se pierde, solo el segundo botón que lo hacía por él. Se limpió lo que
quedaba muerto: `onLiberar` salió del tipo `LiberarEspacio` y `ZonasPanel` dejó de
recibir una prop que ya no usa.

### 32.7 Verificado, y lo que quedó abierto

Cada cambio se midió en el navegador, no a ojo: cero encimes entre título y globo
a 375 y a 1200px, sin desbordes horizontales, la coincidencia exacta entre el
riel de habitable y el tramo oscuro del total, y el recorrido de los tres rieles
en cinco pasos de subir y bajar recámaras.

De paso se comprobó —y resultó estar bien, para no volver a perseguirlo— que el
carmín `#EB004B` de los CTA no es un desliz sino una corrección de contraste
documentada, y que el gris `#5C6163` del botón "Guiarme una por una" es el mismo
que el sitio usa en 48 sitios.

- **"Siguiente" perdió peso frente a "Atrás"**: ahora los dos son papel. Lo que
  lo distingue es la luz de la guía y la flecha. Se ofreció dejar "Atrás" en
  fantasma gris y quedó sin tomar.
- **Sigue sin commitear.** El último commit sigue siendo `88f23cc`.

## Archivos clave de la sesión 32

| Archivo | Qué es |
|---|---|
| `components/PresupuestoBar.tsx` | reescrito: tres rieles con título encima y globo vivo, canal en píldora con veta diagonal, el riel de lo libre invertido contra el techo habitable |
| `app/globals.css` | `lgpVetaA`/`lgpVetaB` y su guardia de `prefers-reduced-motion`; nace `.lgp-btn-papel`; `.lgp-tarjeta-tinta` deja de rellenarse por estado; `.lgp-btn` recupera la transición de `transform` y `box-shadow` que pisaba a `.lgp-hover-zoom` |
| `components/HomeConfigurator.tsx` | los dos "Listo" con una sola definición y en el sistema de botones; "Atrás" y "Siguiente" a `.lgp-btn-papel`; fuera el atajo de "Quitar una recámara" |
| `components/ZonasPanel.tsx` · `ZonasGuiadas.tsx` | fuera el botón de liberar espacio; se queda la frase que dice cuánto devuelve |


## Sesión 33 — El acuse del presupuesto, el hero se reescribe, y el trazador entra al sistema de botones (sin commitear)

### 33.1 El acuse: cada barra canta lo que le costó la decisión

Cada vez que una decisión mueve una barra del presupuesto espacial, sale de su
globo de ft² la cifra que la movió — **"+35" / "−35"**, 26px, con el color de su
propia barra (Carmín Legible en habitable, Carmín de Marca en el total, Tinta en
lo libre) y contorno de Papel (`-webkit-text-stroke` 2.4px, `paint-order: stroke
fill` para que solo crezca hacia afuera).

- **Nace DENTRO del globo** (`<span>` anidado en la burbuja de ft²). Así hereda
  su posición por construcción y no hay desfase que perseguir — un intento
  anterior lo colocaba aparte rehaciendo el `clamp` del globo en aritmética y las
  dos cuentas nunca daban igual.
- **Sale volando en curva**: primero a la derecha, luego gira a vertical, en
  `translate(48px, -58px)` al final. La curva sale de repartir el movimiento al
  revés en cada eje (la x frena, la y acelera). **Sin rebote**, interpolación
  `linear` — la forma está en los fotogramas, un `cubic-bezier` de salida frenaba
  al final de cada tramo.
- **Dura 1s** y se retira. `ACUSE_MS` (JS) atado a la duración del keyframe.
- Las **tres** barras lo llevan. En "Libre para tu casa" el signo va **al revés**
  a propósito: agregar una recámara baja lo libre, así que ahí sale "−". El signo
  dice "subió o bajó"; lo que costó ya lo cantan las dos barras de arriba.

Colisión de clase que salió de aquí y se arregló: `.lgp-acuse` ya existía para la
tarjeta de "se envió" del paso 5. Compartir el nombre le colgaba a esa tarjeta el
vuelo de un segundo y la hacía desaparecer. La clase de la cifra pasó a
**`.lgp-riel-acuse`**; el keyframe sigue siendo `lgpAcuse`.

### 33.2 El error del riel de habitable con zonas exteriores

`PresupuestoBar` medía el riel de lo habitable contra `max`, y `max` **crece**
cuando el cliente agrega una alberca o un BBQ (esas suman al total sin quitarle a
la casa). Resultado: poner una alberca de 400 ft² hacía que los mismos 1,583
habitables cayeran del 87% al 72% del riel — la barra del living se encogía sola
por algo que pasó en el jardín.

Nueva prop `exteriores` a `PresupuestoBar`. El riel de lo habitable ahora se mide
contra **`reglaCasa = max − exteriores`** (`pctCasa()`), así solo se mueve cuando
se mueve la casa. Sin exteriores puestos —el caso normal— `reglaCasa === max` y
la lectura vertical con el tramo del total se conserva.

### 33.3 "Exterior" deja de verse gratis

En el menú de zonas la alberca decía `EXTERIOR` / "0 ft² habitables". Ahora dice
lo que **ocupa en el terreno**: `400 FT²`, "Ocupa en tu terreno · 400 ft²", "Ocupa
400 ft² de terreno, ninguno habitable". Nuevo campo `costoExterior` en `ZonaMod`
(la exterior entera, o la parte no techada de una mixta como el balcón del
master). Ya no queda la palabra "Exterior" ni "EXT" en ninguna pantalla del paso.

### 33.4 El riel "Total construido" va de un solo tono

Perdió el desglose bicolor (tramo oscuro = habitable, tramo claro = obra). Ahora
es un solo tramo en Carmín de Marca. El pie sigue diciendo cuánto de ese total es
cochera, pórtico y patio; entre eso y el globo sale la resta. De paso resuelve
una incoherencia: desde 33.2 ese tramo oscuro ya no era idéntico al riel de
arriba cuando había exteriores, así que invitaba a una lectura vertical que había
dejado de ser cierta.

### 33.5 El diagrama de retiros

`RetirosDiagrama.tsx`:

- **"AQUÍ SÍ" → "CONSTRUCCIÓN"** en el rectángulo rosa. La palabra es casi el
  doble de larga y el rectángulo se encoge con el frente del lote, así que el
  rótulo se acomoda: cabe acostado → acostado; no cabe acostado pero sí parado →
  gira 90°; no cabe de ninguna → encoge; el rosa es diminuto → no se dibuja.
- **Vuelven las tres cotas de retiro** (frente / lados / fondo), en columna a la
  izquierda, en gris y más chicas que el frente/fondo del lote. **Cambian con la
  ciudad** del selector. Se miden contra el **envolvente** que dejan los retiros
  (el punteado), no contra el rosa recortado por el tope de cobertura — medir del
  rosa daría un número que no es el retiro de nadie. Si los retiros no caben en
  el lote (no hay envolvente), no se dibuja ninguna cota: el lote no da para esa
  ciudad se dice en las cifras de al lado, no con una cota que miente.
- La columna de cotas reserva una franja izquierda fija (`CANAL_COTAS`); el
  dibujo del lote creció dentro del mismo `viewBox`. En lote más profundo que
  ancho la escala la fija el alto, así que el terreno no se encoge por la
  reserva.

### 33.6 La luz de "Siguiente" en el paso del brief

Antes se encendía en cuanto el cliente confirmaba el comentario — con el campo de
la dirección recién aparecido y vacío, invitando a saltárselo. Ahora
`pasoResuelto` para el paso 4 exige además que la dirección esté **escrita** (o
que ya la haya traído el trazador desde la foto: `direccionLote.trim() ||
loteUbicacion?.direccion`). **No bloquea el botón** — quien de verdad no tiene la
dirección avanza igual, solo sin el empujón de la luz, y el campo dice "déjala en
blanco y la vemos en la cita".

### 33.7 El hero se reescribe

- **"Aquí el cliente firma el plano" — eliminado por completo**, título y línea
  de apoyo. Era la firma de la marca y lo único del hero que nombraba el
  diferenciador. El `<h1>` ahora es la promesa.
- **`<h1>` nuevo: "Nunca fue tan fácil y satisfactorio diseñar tu casa."**,
  centrado, grande (`clamp(33px,6.4vw,66px)`), tracking `+0.015em`. Lleva un halo
  suave (`text-shadow: 0 2px 22px rgba(0,0,0,0.55)`): centrado y a ese tamaño las
  últimas líneas se salen de la parte oscura del degradado y caen sobre cielo del
  video.
- **Bloque centrado** — texto y botones. Contenedor 540 → 780px, `margin-inline:
  auto`, `text-align: center`, los CTA con `justify-content: center`.

### 33.8 Copy de "Por qué nosotros"

Fuera *"El Valle está lleno de casas que se parecen. Nosotros construimos
pocas…"* (señalaba a la competencia, presumía exclusividad). Ahora: **"Nadie
mejor que tú sabe cómo quiere las cosas, por eso aquí diseñas tu casa tú mismo:
fácil y sin procesos que te fastidien."**

### 33.9 FAQ, más corto

`lib/data.ts`, de 8 preguntas a 6:

- Tiempo de obra: **"9 a 13 meses" → "5 a 9 meses"** (dato del cliente).
- Eliminadas: *"¿Los lotes son de ustedes?"* y *"¿Construyen fuera del Rio Grande
  Valley?"*.
- *"¿Qué incluye el smart home?"*: la lista de features (clima por zonas,
  accesos, riego…) → **"En función de tus necesidades pensamos cómo hacer tu casa
  smart."** — la pregunta ya no la responde con un inventario; queda anotado por
  si conviene cambiarla también.

### 33.10 El trazador

`public/trazador/index.html`:

- En el paso "Marca con puntos la figura del lote" se añade el subtítulo (en
  `guiaSub`, como los demás pasos): **"Si algún lado es curvo, déjalo para el
  final y ciérralo entre dos puntos."**
- **Los botones píldora (`.btn`) ganan la reacción del configurador** — el gesto,
  no la luz del tutorial: al hover `scale(1.018)` + sombra `0 10px 22px
  rgba(28,30,31,0.10)` (0.35s, la curva de `.lgp-hover-zoom`); al presionar
  `scale(0.985)` en 0.11s (como `.lgp-btn:active`). Con guardia de
  `prefers-reduced-motion`. Alcanza a todas las píldoras del trazador (LISTO,
  INVERTIR CURVA, Continuar, Confirmar…), no a los botones de texto ni al
  circular de "atrás" — igual que en el configurador.

### 33.11 Verificado

Todo medido en el navegador: el acuse a 0.00px de desfase con su globo en los dos
ejes y en ventana ancha y angosta; las tres barras cantan al agregar y quitar; la
barra de habitable **inmóvil** al poner y quitar una alberca tres veces; las cotas
del diagrama miden lo que dice su número (cotejadas contra la escala); la luz de
"Siguiente" apagada con la dirección vacía, encendida al escribirla, y el botón
usable en los dos casos; el hero sin desbordar a 375px y con el halo sosteniéndose
sobre cualquier fotograma del video; la colisión de `.lgp-acuse` resuelta (la
tarjeta del paso 5 vuelve a su `lgpAcuseEntra` de 420ms).

`tsc` limpio, `next build` correcto. El servidor de desarrollo tenía caché
corrupta de Turbopack de un estado intermedio; se borró `.next` y se reinició.
Último commit sigue siendo `88f23cc`.

## Archivos clave de la sesión 33

| Archivo | Qué es |
|---|---|
| `components/PresupuestoBar.tsx` | el acuse anidado en cada globo (`.lgp-riel-acuse`); nueva prop `exteriores` y `reglaCasa` para que el riel de habitable no crezca con las zonas de jardín; riel "Total construido" de un solo tono |
| `app/globals.css` | `@keyframes lgpAcuse` (curva sin rebote, `linear`) y `.lgp-riel-acuse` — renombrada para no chocar con `.lgp-acuse` del paso 5; hero centrado; `.btn` del trazador NO vive aquí (es HTML estático) |
| `components/RetirosDiagrama.tsx` | "CONSTRUCCIÓN" con rótulo que se gira/encoge; las tres cotas de retiro de vuelta, contra el envolvente y por ciudad; `CANAL_COTAS` y plano más grande |
| `components/HomeConfigurator.tsx` | hero: fuera "Aquí el cliente firma el plano", `<h1>` = la promesa, bloque centrado; luz de "Siguiente" del paso 4 espera la dirección; copy de "Por qué nosotros"; pasa `exteriores` a `PresupuestoBar` |
| `components/ZonasPanel.tsx` · `ZonasGuiadas.tsx` | "Exterior" → los ft² que ocupa; nuevo `costoExterior` en `ZonaMod` |
| `lib/data.ts` | FAQ de 8 a 6; obra "5 a 9 meses"; respuesta del smart home |
| `public/trazador/index.html` | subtítulo de la curva en el paso de trazo; los botones píldora con el hover-zoom/press del configurador |

## Sesión 34 — El círculo de la curva pide que lo toquen, el panel de la curva fijo, y la cita manda su propio correo (sin commitear)

### 34.1 El círculo de la curva avisa cuando nadie lo toca

`public/trazador/index.html`, modo "Trazar curvas". Si pasan **3 s sin
actividad** sobre el círculo (arrastrar, rueda, pellizco, invertir), se encienden
**juntos** dos avisos, y se apagan juntos en cuanto hay actividad — incluido el
simple toque sobre el círculo, sin moverlo:

- **La onda (gota):** un anillo carmín que nace en el borde del círculo y se abre
  mientras se apaga, **una vez por segundo** (`@keyframes lgpGotaCirculo 1s`,
  sobre `box-shadow` de `.circulo-pulso`). El radio de la onda escala con el del
  círculo (`--anillo-grosor`, fracción del radio con piso y techo). **Sin luz que
  recorra el filo y sin rebote**: del gesto de los botones del tutorial solo
  queda la gota.
- **La burbuja:** **"Usa scroll o dos dedos para cambiar el tamaño."** — un solo
  texto para mouse y táctil.

Los dos cuelgan de una sola bandera, `estado.circuloOcioso`, y de un solo reloj,
`marcarActividadCirculo()`, que también se arma para un círculo retomado
(`circuloGuardado`), no solo para uno nuevo. Con `prefers-reduced-motion` la
onda no se anima.

### 34.2 El panel de la curva, fijo bajo la rueda

Al girar la rueda el círculo entra y sale de "toca una esquina" muchas veces por
segundo, y el panel se repinta en cada tic. Es **la misma fila en los tres
estados** (sin tocar / anclada / capturada): **`‹ · Listo · Invertir curva`**.
Solo cambia que "Listo" esté apagado y que "Invertir curva" pase de contorno a
negro (los dos estilos con filo de 1px, mismo tamaño). La casilla "Trazar curvas"
salió de este estado: hacía lo mismo que la flecha (`salirDeModoCurva`).

El título y el subtítulo usan `textoEstable(el, versiones, cual)` (+ CSS
`.texto-estable`): las tres versiones se apilan en la misma celda de rejilla, solo
se ve la que toca (`aria-hidden` en las demás) y la celda mide siempre lo que la
más larga. Medido dentro del configurador: 106 tics de rueda con el círculo
entrando y saliendo de la esquina → alto del iframe (510px), alto del panel
(175px) y posición de los tres botones **constantes**.

### 34.3 Los botones del trazador se invierten como los del configurador

`.btn-primario` y `.btn-claro-primario` hacen el gesto de `.lgp-btn-carmin` /
`.lgp-btn-tinta`: al hover o foco **se vacían a papel** con la letra en el color
del relleno (carmín → letra `--carmin-oscuro`; tinta → letra tinta), conservando
el zoom de 1.018 y la presión de 0.985 de la sesión 33. Llevan filo de 1px del
color del relleno (con `border-box` no cambia el alto) para no borrarse contra el
panel claro al invertirse. El relleno carmín pasó a `--carmin` (#EB004B, AA con
letra de 10px), el filo queda en #F2004B. Anillo de foco `outline 2px` carmín,
como `.lgp-btn:focus-visible`. Alcanza a todos los botones con esas clases
(Listo, Invertir curva, Continuar, Confirmar, Calcular área construible, Usar este
lote).

### 34.4 Copy

`components/HomeConfigurator.tsx`:

- **CTA del hero:** el carmín dice **"Lugares disponibles"** (lleva a
  `#lugares`); el de contorno dice **"Diseñar mi casa"** (lleva a
  `#personaliza`). Texto y destino ahora coinciden.
- **Por qué nosotros:** "Diseño modular curado" → **"Diseño modular"**.
- **Previa de medidas del lote regular:** el rótulo "Se desplanta" →
  **"Zona construible"** (misma cifra, mismo "82 % de lo permitido").
- **Contacto:** "Trae tu idea a medio cocinar. La terminamos juntos en el lote."
  → **"Trae tus ideas y nos encargamos de materializarlas."**

### 34.5 "Agendar mi cita" manda su propio correo

El formulario de Contacto (y el "Agenda una cita" del header, que lleva ahí)
manda un correo propio, no la ficha del configurador — quien agenda desde ahí
casi nunca ha diseñado nada:

- **`app/api/agendar-cita/route.ts`** — `POST {nombre, correo, tel}`. Valida
  nombre y al menos una vía de contacto (400), recorta cada campo a 200
  caracteres, y manda por Resend al mismo buzón que la ficha
  (`LGP_CORREO_ARQUITECTOS` o `contact@lagranpiedrallc.com`), con `reply_to` al
  correo del cliente. Sin `RESEND_API_KEY` / `LGP_CORREO_REMITENTE` → 501.
  `GET` en desarrollo muestra la vista previa del correo.
- **`lib/cita.ts`** — el correo: asunto **"Solicitud de cita · [nombre]"**, el
  mensaje destacado **"Me gustaría agendar una cita con ustedes."** y los datos de
  contacto (correo con `mailto:`, teléfono con `tel:`). HTML fluido (máx. 560px,
  sin desborde a 375px) y versión en texto plano. Mismos tonos que la ficha.
- El aviso del 501 en pantalla: **"El envío automático todavía no está activo y tu solicitud no
  nos llegó. Escríbenos a contact@lagranpiedrallc.com y te contestamos
  directo."**

`.env.example` y `CLAUDE.md` actualizados: las mismas tres variables sirven a las
dos rutas de correo.

### 34.6 Verificado

Todo dentro del configurador, en el iframe del paso "Tu lote" (no solo en el
archivo suelto): onda y burbuja a los 3 s, apagadas al tocar, de vuelta 3 s
después de soltar; la inversión de "Listo" e "Invertir curva" con cursor real
(colores computados y captura); el panel inmóvil bajo la rueda; el formulario de
cita manda solo `{nombre, correo, tel}` a `/api/agendar-cita`, la ruta responde
400/400/501 según el caso. `tsc` limpio, sin errores en consola, inline script
del trazador pasa `node --check`. Último commit sigue siendo `88f23cc`.

**Publicación:** todo esto vive solo en local, rama `lote-arquitecto` sin
commitear. `public/trazador/` ni siquiera está en git. Producción (`main`) sigue
en la sesión 22. Publicar sacaría todo lo hecho desde entonces, no solo esta
sesión — pendiente de que Paco lo decida.

## Archivos clave de la sesión 34

| Archivo | Qué es |
|---|---|
| `public/trazador/index.html` | onda `lgpGotaCirculo` 1s + burbuja con el mismo reloj (`circuloOcioso`, `marcarActividadCirculo`); fila fija `‹ · Listo · Invertir curva` y `textoEstable` en el modo curva; `.btn-primario` / `.btn-claro-primario` invierten a papel con filo |
| `components/HomeConfigurator.tsx` | CTA del hero, "Diseño modular", "Zona construible", texto de Contacto; `agendarCita` llama a `/api/agendar-cita`; aviso del 501 |
| `app/api/agendar-cita/route.ts` | nueva — correo de solicitud de cita por Resend |
| `lib/cita.ts` | nuevo — HTML, texto y asunto del correo de cita |
| `.env.example` · `CLAUDE.md` | las variables de correo sirven a las dos rutas |

## Sesión 35 — El configurador se queda en lo que decide: menos texto, iconos del cliente y la luz que espera (sin commitear)

### 35.1 El paso de la paleta arranca con una sola línea

Arriba de las paletas queda **"LAS COCINAS SON SOLO EJEMPLO PARA VER LOS COLORES"**
—mono 10px, en negritas y en tinta, no en gris— y debajo, las paletas. La
maqueta es la misma cocina en las seis y a ese tamaño se lee como el diseño de
SU cocina; el aviso va **antes** de verlas, que es donde se evita el
malentendido.

Se fueron de ese paso, por decisión del cliente:

- El recuadro rosa de la guía ("Empieza por la paleta de interior…") con su
  contador "1 de 3".
- El encabezado "Paleta de interior".
- Su línea de apoyo ("De aquí salen carpintería, piedra y pisos…").

`pistaGuia` **sigue en el código**: es el texto del aviso de por qué "Siguiente"
está apagado. Se lee ahí, en el momento en que estorba, y no antes.

### 35.2 La luz del tutorial espera a que el cliente se detenga

Nuevo `lib/useOcioso.ts`. Las luces de `.lgp-guia-luz` solo se encienden tras
**1.5 s sin tocar nada**, y se apagan en cuanto hay actividad. Alcanza a los
cinco botones que la llevan: "Usar estas medidas", los dos "Listo" del paso de
interior, "Confirmar" del brief y "Siguiente".

Cuenta como actividad **tocar**: clic, toque en pantalla o tecla. **El scroll y
el movimiento del cursor NO** — quien scrollea suele estar buscando qué hacer
(que es cuando la luz sirve), el configurador scrollea solo al cambiar de etapa,
y bastaba rozar el trackpad para apagarle el aviso a quien sí estaba perdido.

Mover el cursor no repinta nada: React ignora el `set` al mismo valor, así que
entre encender y apagar hay dos redibujados por ciclo.

### 35.3 La tarjeta del floorplan dice lo que decide, y nada más

Dos formas según quién elige:

- **Plano fijo de la subdivisión** (`planFijo`): nada de descripción. Un rótulo
  **"Incluye:"** y una ficha por pieza, con su icono —la idea organizadora del
  plano, las plantas y las zonas que ya trae dentro (`incluyeDelPlan`, nueva
  prop `incluye` de `PasoDecision`). En el townhouse: *Escalera, arriba y
  abajo · 2 plantas · Master con balcón*. Cada pieza sale de un dato
  (`IDEA_PLAN`, `PLANES.pisos`, `PLANES.incluidas`), no de la redacción.
  **No se listan recámaras ni baños**: en ese paso todavía no existen.
- **Plano que se elige** (lote propio): el nombre y, debajo, lo que cuesta
  elegirlo — **"≈ 87 ft² de patio"**, "≈ 200 ft² de patios", "≈ 108 ft² de
  patio", "≈ 160 ft² de escalera" (`ft2DelPlan`). El número va con su
  sustantivo, por la regla que ya estaba escrita en `IDEA_PLAN`: "200 ft²" a
  secas no se puede leer.

Fuera `DESC_PLAN` (el párrafo de cada plano más la coletilla de que el arquitecto
acomoda los cuartos) y el campo `resumen`, que quedó sin uso.

Las fichas de "Incluye:" van **sin recuadro**: icono de 40 px y su nombre,
sueltos sobre el panel, separados por aire (`gap` 14 × 26).

### 35.4 Los tres iconos del cliente, calcados

`masterbalcon`, `EscaleraIcon` y `PlantasIcon` son los archivos que entregó el
cliente, **calcados y no redibujados**: el trazo sale de seguir el borde entre
píxel negro y píxel blanco de cada imagen. Comprobado rellenando cada path y
comparándolo contra su propio bitmap:

| | píxeles de tinta | distintos |
|---|---|---|
| Master + balcón (285×282) | 27,354 | **0** |
| Casa de dos plantas (460×492) | 109,857 | **0** |
| Escalera (320×280) | 35,134 | **0** |

Cada uno conserva su `viewBox` original: reencuadrarlos a la retícula de 24
los habría deformado. El de master + balcón trae su propio marco redondeado, así
que **no** va dentro del badge `Squircle` de sus vecinos. La escalera venía a
2000×2000 casi todo en blanco: se recortó ese margen vacío y se guardó a 320 px
de ancho — el dibujo no cambia, el archivo pesa la mitad.

### 35.5 Menos relleno en el cierre del recorrido

- **El recuadro amarillo "Falta por definir"**, con un botón de atajo por cada
  pendiente, **se quitó de todos los pasos**. La regla de "nada bloqueado sin
  explicación" la cumple ahora la línea que ya existía al lado del botón: con el
  paso resuelto dice la pista de siempre, y con "Siguiente" apagado dice qué
  falta, en carmín. Se pierde el atajo de un clic; el riel de pasos lleva al
  mismo sitio.
- **Brief:** fuera el texto de apoyo de la dirección ("es lo que le dice al
  arquitecto a dónde ir a verificar los retiros…"). El titular carga la
  separación que llevaba.
- **Tus datos:** el titular es **"Envíanos tu propuesta"**; fuera "Ya esta
  armada. A quien se la mandamos?" (que traía tres faltas) y "Tus datos van
  directo al arquitecto… nada de call centers". Fuera también el párrafo "Al
  enviar, el arquitecto recibe la ficha completa…". El botón dice **"Enviar"**.
- **Catálogo de zonas:** el medio baño se queda sin su nota ("Solo dos de
  nuestras nueve casas lo tienen…"). Una nota vacía ya **no** cae al nombre
  largo: esa línea simplemente no se dibuja (`ZonasPanel` y `ZonasGuiadas`).

### 35.6 Verificado

Los dos caminos, recorridos de principio a fin: **Enclave** (4 pasos) y **lote
propio** (5 pasos). El mismo código sirve a los dos — el configurador no tiene
pantallas por modo, solo cambia cuántos pasos recorre.

La luz, medida en el botón: apagada a 0.3 s y 1.2 s, encendida a 1.9 s, encendida
tras scroll y tras mover el cursor, apagada al clic y de vuelta 1.6 s después.
Las fichas de "Incluye:" con icono de 40 px y sin recuadro. Ninguno de los textos
retirados queda vivo en el código (los únicos resultados de búsqueda son
comentarios que citan lo borrado).

`tsc` limpio, sin errores nuevos de eslint (siguen los 4 de base) y sin errores
en consola. Último commit sigue siendo `88f23cc`: todo esto vive solo en local,
rama `lote-arquitecto`, sin commitear, y producción (`main`) sigue en la sesión
22.

## Archivos clave de la sesión 35

| Archivo | Qué es |
|---|---|
| `lib/useOcioso.ts` | nuevo — "lleva 1.5 s sin tocar nada"; solo clic, toque y tecla cuentan |
| `components/HomeConfigurator.tsx` | aviso de las cocinas arriba del selector; fuera la pista rosa, el encabezado y la línea de apoyo de la paleta; `incluyeDelPlan` y `ft2DelPlan` en lugar de `DESC_PLAN`/`resumen`; fuera el recuadro "Falta por definir" y el porqué pasa a la línea del botón; textos del brief y del paso de datos |
| `components/ConfigIcons.tsx` | `masterbalcon`, `EscaleraIcon` y `PlantasIcon` calcados de los archivos del cliente |
| `components/PasoDecision.tsx` | nueva prop `incluye`: rótulo "Incluye:" y una ficha por pieza, sin recuadro |
| `lib/data.ts` · `ZonasPanel.tsx` · `ZonasGuiadas.tsx` | el medio baño sin nota, y una nota vacía ya no cae al nombre largo |


# Sesión 36 — el sitio entero en inglés

El selector de idioma de la cabecera (ES/EN con flecha) ya no cambia solo los
textos sueltos: **todo el sitio pasa al inglés**, incluidos los paneles, los
botones, los avisos, los `title` y los `aria-label`, y el trazador que vive
dentro del iframe.

## Cómo quedó armado

Son **dos diccionarios**, porque son dos mundos que no se pueden importar entre
sí:

- `lib/diccionario-en.ts` para la app de Next. El componente pide la frase con
  `t('…')` y la clave es el español tal cual, así que lo que no esté traducido
  se queda en español en vez de enseñar una clave cruda.
- El del final de `public/trazador/index.html`, que es HTML estático. Ahí no
  hay forma de cablear `t()` por todos lados —la mitad del texto se arma
  concatenando cifras en el JS—, así que **se traduce el DOM ya pintado**: una
  pasada al cargar y un `MutationObserver` para todo lo que el trazador va
  generando. Lo que el código arma pegando números pide la traducción pedazo
  por pedazo con `window.lgpT`.

Como ya pasa con la tabla de retiros, **las mismas frases viven en los dos
archivos**: si una se traduce distinto en cada uno, el cliente lee dos voces en
la misma pantalla.

El idioma viaja al trazador en la URL (`?embed=1&lang=en`) y la `key` del
iframe lo vuelve a montar al cambiar: se pierde el trazo en curso, que es el
precio de cambiar de idioma a medio camino.

## Las frases con cifras

Las que llevan números no se traducen enteras ni se cosen a mano pegando
palabras sueltas —en inglés el orden de las piezas no es el mismo—. Van como
plantilla con huecos: `'No cabe: quedan {libres} ft² habitables y {zona}
necesita {pide} ft².'` y el código mete las cifras después.

## Qué se verificó

Los dos caminos recorridos en inglés de principio a fin —Enclave y lote
propio—, pantalla por pantalla, buscando español en el texto visible, en los
`placeholder`, en los `title` y en los `aria-label`. El trazador se recorrió
completo: foto, trazo, lados de calle, fondo, cochera, norte, ciudad, retiros,
franjas de servicio, medidas, cálculo y el armado de la casa, incluidos el
veredicto de "sí cabe" y el de "no cabe". Lo único que queda sin traducir en el
barrido del código son nombres de clase CSS, ids de fase y una ruta de API.

En español no cambió nada: el trazador arranca igual y sin errores en consola.
`tsc` limpio; eslint sigue con los mismos 6 errores de base, ninguno nuevo.

Lo que **a propósito** no se traduce: los nombres propios (La Gran Piedra,
Enclave on 107, las ciudades, los despachos), las citas de ordenanza con su §,
y los correos que salen del sitio (`lib/ficha.ts`, `lib/lamina.tsx`,
`lib/cita.ts`) — los lee La Gran Piedra, no el cliente.

Último commit sigue siendo `88f23cc`: todo esto vive solo en local, rama
`lote-arquitecto`, sin commitear, y producción (`main`) sigue en la sesión 22.

## Archivos clave de la sesión 36

| Archivo | Qué es |
|---|---|
| `lib/idioma.ts` · `components/ProveedorIdioma.tsx` · `components/SelectorIdioma.tsx` | el idioma elegido, recordado en `localStorage`, y el botón de la cabecera |
| `lib/diccionario-en.ts` | ~370 frases del sitio, escritas a mano, con las plantillas de hueco al final |
| `public/trazador/index.html` | diccionario propio (~360 frases) + traductor de DOM + `window.lgpT` para lo que se arma con cifras |
| `components/TrazadorLote.tsx` | le pasa el idioma al iframe y lo vuelve a montar cuando cambia |
| `components/CarpetaHistorial.tsx` · `PresupuestoBar.tsx` · `PasoDecision.tsx` · `DecisionUI.tsx` · `VisorObra.tsx` · `TiraObra.tsx` · `VentanaEnfocada.tsx` · `CarruselSubdivision.tsx` | los textos que faltaban, incluidos los pies de foto de "La obra" |
