# La Gran Piedra — sitio y configurador

Sitio de **La Gran Piedra LLC**, constructora de casas custom en el Rio Grande
Valley, Texas (Edinburg · McAllen · Mission). Subdivisión propia: Enclave on 107,
McAllen.

El negocio busca clientes **locales e internacionales**, y la prioridad declarada
es mejorar la experiencia del cliente al construir su casa. La calidad de esa
experiencia es el argumento de venta: la gente que llega aquí está tomando la
decisión de compra más cara de su vida.

## Qué es esto

Un configurador donde el cliente arma su casa: lote → floorplan → fachada →
interior y zonas → brief → datos → resumen. Son **6 pasos con lote propio y 5
en Enclave**, porque ahí la fachada la trae puesta el reglamento; el hero lo
publica como "5–6 pasos, según tu lote". Todo el sistema gira
alrededor de un **presupuesto de pies cuadrados habitables** que no se puede
rebasar.

## Reglas que no se rompen

- **Nada de datos inventados.** Medidas, reglamentos, ft², precios y reglas de
  subdivisión son datos reales de una constructora real. Si falta un dato duro,
  se pregunta o se marca como supuesto visible en pantalla. Los retiros ya no
  son un número solo: se eligen por ciudad (`PRESETS_RETIROS` en `lib/data.ts`,
  cada uno con su `fuente` y su salvedad impresa en pantalla), y quien no elige
  ciudad cae a `RETIROS_DEFAULT` (18/15/5, mediana de cinco planos acotados),
  declarado como supuesto. Ese mismo cuadro está duplicado a mano en
  `public/trazador/index.html` porque es HTML estático y no puede importar de
  `lib/` — **si se corrige un número hay que corregirlo en los dos**, o el
  mismo lote da dos áreas según por qué camino entre el cliente.
- **El presupuesto no se rebasa.** Cada control que suma superficie revalida el
  tope en su propia lógica, no solo con el atributo `disabled` — varios clics
  antes de un repaint no deben colar un cuarto de más.
- **Nada bloqueado sin explicación.** Si una zona, un paso o un botón está
  apagado, la UI dice por qué y, cuando aplica, ofrece el atajo para resolverlo.
- **Distinguir lo que manda.** El reglamento de la subdivisión gana sobre el
  presupuesto: una alberca prohibida en townhouse se marca como no permitida, no
  como "no cabe".

## De dónde salen los números reales

Del set arquitectónico del Lote 17 (`FULL ARCH SET_LOT 17_ENCLAVE ON 107`):
906 ft² planta baja + 729 planta alta = 1,635 habitables, garage 473, pórtico 24,
patio cubierto 80, balcón 37 → 2,249 ft² totales. Recámara secundaria 10'6"×10'0"
= 105 ft². Lavandería 5'6"×7'8" = 42 ft².

Ese set es UNO de nueve. El banco completo vive en `planos para base de datos/`
y de ahí salen las medianas que usa el configurador — la skill `arquitecto` es la
que sabe leerlo. Los 500 ft² de cochera que se usaron un tiempo **no salían de
ningún plano**: la mediana de las siete medidas es 419, y ese exceso se le estaba
restando al presupuesto habitable del cliente. La cochera ahora se elige (1, 2 o
3 cajones, o ninguna) y la de uno y la de tres van marcadas como estimadas,
porque ningún set trae una.

Dos números del configurador son decisiones de producto y no datos del banco, así
que se declaran donde se usan: la recámara secundaria cotiza **121 ft²** (11 × 11
pies) y no los 132 de la mediana, y el **medio baño salió del núcleo** — solo 2
de los 9 sets lo traen, así que dejó de cobrarse a todos y vive en el catálogo de
zonas.

## Pendientes conocidos

- Falta `ANTHROPIC_API_KEY` en Vercel: sin ella el botón "Leerlas de mi foto"
  del trazador (`/api/leer-medidas-arista`) responde 501 y lo dice en pantalla
  — el cliente escribe las medidas a mano y llega al mismo resultado, así que
  nunca se queda atorado. `/api/analizar-lote` sigue existiendo pero ya no lo
  llama nadie: el camino de "sube una foto y la IA saca tus medidas" se
  reemplazó por el trazador, que pide lo mismo y devuelve la forma real.
- El "Enviar al arquitecto" del paso 7 manda la ficha por correo a
  `contact@lagranpiedrallc.com`; el formulario "Agendar mi cita" de Contacto
  (y el "Agenda una cita" del header, que lleva ahí) manda por
  `/api/agendar-cita` un correo corto con los datos de contacto y "Me gustaría
  agendar una cita con ustedes" (`lib/cita.ts`). Los dos van al mismo buzón
  (ya en el código; `LGP_CORREO_ARQUITECTOS` si se necesita cambiarlo o agregar
  más destinatarios). Falta `RESEND_API_KEY` y `LGP_CORREO_REMITENTE` (ver
  `.env.example`) — sin ellas responde 501 y la UI lo dice: nunca se le
  confirma al cliente un envío que no salió. Los archivos que sube el cliente
  siguen viviendo solo en memoria del navegador — no viajan en el correo.
- En los lotes de la subdivisión la fachada no se elige: el reglamento la trae
  puesta y el paso sale del recorrido (`REGLAS_LOTE.fachadaFija`). No hay dato
  de **cuál** es esa fachada, así que en ningún lado se le pone un estilo del
  catálogo — se dice "Definida por la subdivisión". Si el cliente da el estilo o
  un render del townhouse de Enclave, ahí es donde entra.
- **El sitio habla español e inglés, y sale en inglés.** El selector vive en la
  cabecera y lo cambia todo —paneles, botones, avisos, `title` y `aria-label`—
  incluido el trazador del iframe. Son DOS diccionarios porque son dos mundos
  que no se pueden importar entre sí: `lib/diccionario-en.ts` para la app y
  otro al final de `public/trazador/index.html`, que es HTML estático. Igual
  que con la tabla de retiros, **una frase que exista en los dos hay que
  traducirla igual en los dos**, o el cliente lee dos voces en la misma
  pantalla. Lo que sigue asumiendo contexto local son las unidades (pies), la
  moneda y la cita presencial.
- Los correos que salen del sitio (`lib/ficha.ts`, `lib/lamina.tsx`,
  `lib/cita.ts`) se quedan en español a propósito: los lee La Gran Piedra, no
  el cliente.
- Contacto real y publicado: `contact@lagranpiedrallc.com`, el teléfono
  **(956) 450 3175** y `instagram.com/lagranpiedrallc`. El teléfono vive en
  `lib/data.ts` (`TELEFONO`, `TELEFONO_E164`) y no en una variable de entorno,
  porque no es un secreto y atarlo a la configuración de Vercel es lo que tuvo
  el botón de WhatsApp sin dibujarse. `NEXT_PUBLIC_LGP_WHATSAPP` sigue
  existiendo para cambiarlo sin tocar código; si trae diez dígitos se le
  antepone el 1, porque wa.me exige código de país.
- El icono de TikTok se retiró a pedido del cliente: la cuenta todavía no
  existe. Vuelve cuando la haya.
- Con el teléfono real **ya se puede publicar JSON-LD de negocio local**, que
  antes estaba bloqueado por el dato falso. Falta hacerlo, y falta la calle de
  la dirección: hoy solo se publica "Edinburg, TX".
- Falta `NEXT_PUBLIC_SITE_URL` (o desplegar en Vercel, que inyecta la suya) para
  que las tarjetas al compartir apunten al dominio bueno.

@AGENTS.md
