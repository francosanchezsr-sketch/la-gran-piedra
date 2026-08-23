# Trazado de lote irregular — diseño

## Contexto

El paso "Tu lote" (previa antes del configurador) hoy ofrece dos vías para un
lote propio: **"Tengo una foto"** (la IA lee frente/fondo de un documento o
foto, asumiendo forma rectangular o "dimensiones dominantes") y **"Sé las
medidas"** (frente × fondo a mano). Ninguna de las dos representa bien un lote
con forma irregular — un cuadrilátero no rectangular, por ejemplo — porque el
cálculo de huella construible (`huellaConstruible` en `lib/data.ts`) asume un
rectángulo.

El cliente compartió un ejemplo real: una foto aérea con el contorno del lote
marcado en amarillo, un cuadrilátero irregular. Pidió que la IA analice la
foto para que el usuario pueda colocar la medida real de cada arista del
lote, y que de ahí se calcule su presupuesto de construcción — sin usar una
aproximación ("dimensiones dominantes") como hace hoy el modo foto para
lotes irregulares.

## Qué se construye

Una tercera tarjeta en "Tu lote": **"Mi lote es irregular"**. Abre un paso de
pantalla completa donde el usuario:

1. Sube una foto de su terreno.
2. Traza el contorno del lote dando clic/toque en cada esquina, en orden —
   líneas rectas entre puntos consecutivos, nunca a pulso. Mínimo 3 puntos;
   un botón "Cerrar forma" (activo desde el tercer punto) une el último punto
   con el primero.
3. Marca, tocando las aristas ya trazadas, cuál es el **frente** (da a la
   calle) y cuál es el **trasero**. Las demás quedan como **lados**. Puede
   dejar el trasero sin marcar si no lo tiene claro (cae como lado también).
4. Ve una lista de las aristas trazadas, una fila por arista, con un campo
   para su medida en pies. La IA intenta leer, para cada arista, si el
   cliente ya escribió esa medida a mano en la foto cerca de esa zona, y
   precarga el campo si la encuentra — el usuario confirma o corrige.
5. Con todas las medidas capturadas, botón **"Calcular mi lote"**: se
   reconstruye el polígono a escala real, se calcula su área total y su
   huella construible (ya con retiros aplicados por arista), y se muestra un
   tablero con la forma real y la huella resaltada adentro — la misma idea
   que hoy usa "Sé las medidas", pero con la forma real en vez de un
   rectángulo.
6. Confirma y regresa a "Tu lote" con el resultado aplicado; de ahí sigue al
   paso 1 como las otras dos vías.

## Fuera de alcance para v1 (documentado a propósito, no accidental)

- **Formas cóncavas.** El motor de huella (ver abajo) da resultados
  correctos para polígonos convexos — la gran mayoría de lotes
  residenciales, incluido el ejemplo del cliente. Si el trazo resulta
  cóncavo, se detecta y se cae al mismo supuesto de 50% que ya existe hoy
  para lotes irregulares, con aviso en pantalla — nunca se muestra un número
  preciso que en realidad no lo es.
- **Zoom/pan sobre la foto mientras se traza.** La foto se ajusta al
  viewport (contain) sin recorte; no hay pellizco para hacer zoom en v1. Si
  la precisión resulta insuficiente en pruebas, se revisita.
- **Edición del trazo ya cerrado** (mover un punto después de cerrar la
  forma). Si el usuario se equivoca, reinicia el trazo desde cero. Editar
  puntos individuales queda para una iteración futura si hace falta.
- **Detección automática del contorno por IA** (que la IA proponga los
  vértices sola). El trazo es siempre manual — más confiable que un modelo
  de visión adivinando coordenadas de píxeles exactas.

## Flujo de datos y arquitectura

### Componente nuevo: `components/TrazadorLote.tsx`

Aislado de `HomeConfigurator.tsx` (que ya es grande y se ha ido
descomponiendo en piezas como `CarruselSubdivision`, `TiraObra`, etc.).
Entrada: la foto (`dataUrl`, `mime`) y los `retiros` vigentes. Salida: un
callback con el mismo shape que ya consume `aplicarLotePropio` hoy
(`frente`, `fondo`, `areaLote`, `huella`, `maxLiving`, `confianza`, `nota`,
`fuente`), más el campo nuevo `poligono` (ver Modelo de datos). Internamente
maneja su propio estado de trazo (puntos, arista frente/trasero, medidas por
arista) — nada de eso se filtra a `HomeConfigurator`.

Usa `useVentanaModal` (ya existe en `lib/useVentanaModal.ts`) para el
comportamiento de pantalla completa — Escape, scroll de fondo bloqueado,
gesto de "atrás" del teléfono — igual que `VentanaEnfocada` ya lo hace para
el configurador completo. No se reinventan esas reglas.

### Motor de geometría: `lib/poligono.ts` (funciones puras, sin UI)

1. **`escalarTrazo(puntosPixel, medidasFt, aristaCerrada)`** — el trazo da la
   forma (ángulos, proporción relativa) en píxeles; las medidas dan la
   escala real. Por cada arista se calcula el factor `pies reales ÷ píxeles
   trazados`, se promedian esos factores, y con esa escala única se
   convierte cada vértice de píxeles a una posición real en pies. Devuelve
   los vértices ya en pies.
2. **`areaPoligono(verticesFt)`** — fórmula shoelace estándar. Exacta para
   cualquier polígono simple (sin auto-cruces).
3. **`esConvexo(verticesFt)`** — valida signo consistente del producto
   cruzado entre aristas consecutivas. Si falla, se usa el fallback del 50%
   en vez del cálculo de huella por semiplanos.
4. **`huellaPoligono(verticesFt, aristasConRetiro)`** — cada arista se
   desplaza hacia adentro por su retiro (frente 25', trasero 20', lados 6',
   los mismos valores de `RETIROS_DEFAULT` que ya existen), y se calcula la
   intersección de esos semiplanos (recorte de Sutherland-Hodgman aplicado
   repetidamente, una vez por arista). El polígono resultante es la huella
   construible; su área sale de `areaPoligono` otra vez.

Ninguna de estas funciones toca `huellaConstruible()` (el cálculo
rectangular existente) ni el resto del presupuesto espacial — es lógica
nueva, aislada, que solo alimenta al mismo punto de entrada
(`aplicarLotePropio`) que ya usan los otros dos modos.

### Endpoint nuevo: `app/api/leer-medidas-arista/route.ts`

Reutiliza el mismo patrón que `app/api/analizar-lote/route.ts` (mismo
`ANTHROPIC_API_KEY`, mismo manejo de "sin llave configurada" →
501, degradación silenciosa a captura manual). Recibe la foto y la lista de
aristas trazadas (como segmentos en coordenadas normalizadas 0–1, para no
depender del tamaño de pantalla), y le pide a Claude que, para cada arista,
reporte si hay un número escrito a mano cerca de ese segmento en la foto. Una
sola llamada para todas las aristas (no una por arista) — más barato y le da
a Claude el contexto completo de la foto. No se toca
`app/api/analizar-lote/route.ts` — sigue siendo el motor exclusivo del modo
"Tengo una foto".

### Modelo de datos: `lib/data.ts`

Se agrega un campo opcional al tipo `Lote` ya existente:

```ts
poligono?: {
  verticesFt: { x: number; y: number }[];
  aristas: { desde: number; hasta: number; ft: number; tipo: 'frente' | 'trasero' | 'lado' }[];
};
```

Aditivo — los lotes del catálogo y los de frente/fondo simple no lo tienen y
siguen funcionando exactamente igual.

### Visualización

`RetirosDiagrama` (hoy dibuja un rectángulo con la huella adentro) gana una
variante que, cuando `lote.poligono` existe, dibuja el polígono real con la
huella (ya encogida por retiros) resaltada adentro — mismo lenguaje visual
que la variante rectangular. Esa misma forma se incluye en el resumen en
pantalla y en la ficha que recibe el arquitecto por correo (`lib/ficha.ts`),
para que vea la forma real del lote, no solo números sueltos.

## Manejo de errores

- Menos de 3 puntos al intentar cerrar la forma → botón "Cerrar forma"
  deshabilitado, mismo lenguaje visual que otros estados deshabilitados de
  la app.
- Polígono cóncavo detectado → aviso "Forma inusual — el arquitecto la
  revisa en la cita", cae al supuesto del 50% (mismo que ya existe hoy).
- Huella resultante menor a 400 ft² → mismo mensaje de error que ya usa
  `aplicarMedidasManuales` hoy para el caso rectangular.
- Sin `ANTHROPIC_API_KEY` → el trazo y la captura manual de medidas por
  arista siguen funcionando igual; simplemente no se precargan números desde
  la foto (mismo comportamiento que los otros dos modos sin llave).

## Pruebas antes de dar por terminado

- Recorrido completo (subir foto → trazar → marcar frente/trasero → escribir
  medidas → calcular) en navegador, en dos anchos: escritorio (~1280px) y
  móvil (~390px), con clic y con toque simulado.
- Caso de error: menos de 3 puntos, polígono cóncavo, huella menor a 400 ft².
- Caso sin `ANTHROPIC_API_KEY`: confirmar que no rompe nada, solo no
  precarga medidas.
- Confirmar que el modo "Tengo una foto" y "Sé las medidas" siguen
  funcionando exactamente igual que antes (sin regresión).
