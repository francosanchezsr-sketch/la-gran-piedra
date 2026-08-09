# La Gran Piedra — sitio y configurador

Sitio de **La Gran Piedra LLC**, constructora de casas custom en el Rio Grande
Valley, Texas (Edinburg · McAllen · Mission). Subdivisión propia: Enclave on 107,
McAllen.

El negocio busca clientes **locales e internacionales**, y la prioridad declarada
es mejorar la experiencia del cliente al construir su casa. La calidad de esa
experiencia es el argumento de venta: la gente que llega aquí está tomando la
decisión de compra más cara de su vida.

## Qué es esto

Un configurador de 7 pasos donde el cliente arma su casa: lote → floorplan →
fachada → interior y zonas → brief → datos → resumen. Todo el sistema gira
alrededor de un **presupuesto de pies cuadrados habitables** que no se puede
rebasar.

## Reglas que no se rompen

- **Nada de datos inventados.** Medidas, reglamentos, ft², precios y reglas de
  subdivisión son datos reales de una constructora real. Si falta un dato duro,
  se pregunta o se marca como supuesto visible en pantalla. Ejemplos de supuestos
  que hoy están marcados como tales: los retiros por default (25/20/6 ft) y el
  factor de ocupación habitable del 50%.
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

El doble garage estándar para lote propio es 500 ft² (dato del cliente), distinto
del 473 real del townhouse.

## Pendientes conocidos

- Falta `ANTHROPIC_API_KEY` en Vercel: sin ella el análisis de plano y de
  dirección del paso 1 responde 501 y solo funciona la captura manual de medidas.
- El "Enviar al arquitecto" del paso 7 ya manda la ficha por correo, pero
  necesita `RESEND_API_KEY`, `LGP_CORREO_ARQUITECTOS` y `LGP_CORREO_REMITENTE`
  (ver `.env.example`). Sin ellas responde 501 y la UI lo dice: nunca se le
  confirma al cliente un envío que no salió. Los archivos que sube el cliente
  siguen viviendo solo en memoria del navegador — no viajan en el correo.
- El sitio está solo en español y asume contexto local (pies, retiros de Texas,
  lada 956, cita presencial). Para el cliente internacional falta idioma,
  unidades, moneda y agenda remota.
- Los datos de contacto del pie son de relleno: `(956) 000 0000`,
  `hola@lagranpiedra.com` y un enlace a `instagram.com` sin cuenta. Hasta que
  sean los reales no se puede publicar JSON-LD de negocio local — marcaría a
  Google un teléfono y un correo falsos.
- Falta `NEXT_PUBLIC_SITE_URL` (o desplegar en Vercel, que inyecta la suya) para
  que las tarjetas al compartir apunten al dominio bueno.

@AGENTS.md
