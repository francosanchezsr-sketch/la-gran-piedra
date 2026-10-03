'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import {
  LOTES,
  PLANES,
  EXTRAS,
  REGLAS_LOTE,
  FACHADAS,
  INTERIORES,
  MODULOS,
  livingDeModulo,
  RETIROS_DEFAULT,
  OPCIONES_CIUDAD,
  presetPorId,
  huellaConstruible,
  huellaDesplantada,
  OCUPACION,
  habitableDelPrograma,
  IDEA_PLAN,
  CIRCULACION,
  ft2PorRecamara,
  ft2PorBano,
  type Medida,
  estanciasDeProgramaGrande,
  ESCALERA_POR_PLANTA,
  REPARTO_PLANTA_BAJA,
  PATIO_CUBIERTO,
  patioDeLaCasa,
  UMBRAL_COMPACTO,
  GARAGE_2_TOWNHOUSE,
  CAJONES_GARAGE,
  garageFt2,
  PORCHE,
  FAQS,
  NAV,
  PASO_NOMBRES,
  PASO_HINTS,
  SUBDIVISIONES,
  whatsappHref,
  TELEFONO,
  TELEFONO_E164,
} from '@/lib/data';
import type { SubdivisionKey, Lote } from '@/lib/data';
import type { Ficha } from '@/lib/ficha';
import { leerGuardado, escribirGuardado, borrarGuardado, valeLaPenaRetomar, type ConfigGuardada } from '@/lib/guardado';
import { useOcioso } from '@/lib/useOcioso';
import { useIdioma, useT } from '@/components/ProveedorIdioma';
import SelectorIdioma from '@/components/SelectorIdioma';
import HeroLoopVideo from '@/components/HeroLoopVideo';
import { CamaIcon, BanoIcon, CarroIcon, EscaleraIcon, PlantasIcon, ModuloIcon } from '@/components/ConfigIcons';
import CarpetaHistorial from '@/components/CarpetaHistorial';
import PasosBarra from '@/components/PasosBarra';
import VentanaEnfocada from '@/components/VentanaEnfocada';
import TiraObra from '@/components/TiraObra';
import CarruselSubdivision from '@/components/CarruselSubdivision';
import PlanDiagram from '@/components/FloorplanDiagram';
import PresupuestoBar from '@/components/PresupuestoBar';
import SelectorCiudad from '@/components/SelectorCiudad';
import TrazadorLote, { type LoteTrazado } from '@/components/TrazadorLote';
import RetirosDiagrama from '@/components/RetirosDiagrama';
import ZonasGuiadas from '@/components/ZonasGuiadas';
import ZonasPanel from '@/components/ZonasPanel';
import PasoDecision from '@/components/PasoDecision';
import { useAnimacionAlterna } from '@/components/DecisionUI';
import { RENDER_PLAN, RENDER_FACHADA, RENDER_FACHADA_MINI, RENDER_PALETA } from '@/lib/assets';

// El logo de WhatsApp. Va como trazo y no como imagen para que herede el color
// del botón: en fantasma el hover invierte el relleno, y un PNG verde ahí se
// vería pegado encima en vez de formar parte del botón.
function WhatsappGlifo({ tam = 15 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{flex: 'none'}}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

type PlanKey = keyof typeof PLANES;
type Sugerencia = { key: string; razon: string | null };
type Lead = { nombre: string; correo: string; tel: string };

// La pantalla de captura de lote propio. Va antes del paso 1, así que se
// numera 0: el cliente que llega con su terreno lo resuelve aquí y entra al
// configurador por donde entra todo el mundo, el floorplan.
const PREVIA = 0;
// Número interno del paso de fachada. Se nombra porque es el único que puede
// salirse del recorrido (ver `fachadaFija`).
const FACHADA_PASO = 2;

// El enlace de WhatsApp no cambia durante la sesión: se resuelve una vez, al
// cargar el módulo. Si no hay número configurado (ver WHATSAPP en lib/data),
// en producción no se dibuja nada; en desarrollo se deja el botón apagado
// diciendo qué falta, que es la única forma de que el pendiente se vea.
const WA_HREF = whatsappHref();
const WA_PENDIENTE = !WA_HREF && process.env.NODE_ENV !== 'production';

// Tope de tragaluces en una misma casa.
const MAX_TRAGALUCES = 3;

/**
 * El botón que cierra una etapa de la guía: "Listo", al terminar los cuartos y
 * al terminar las áreas.
 *
 * Vive aquí y no en línea porque son DOS botones que hacen exactamente lo
 * mismo, y escritos por separado se separaron: uno acabó negro sólido y el otro
 * fantasma gris, como si fueran gestos distintos. El mismo gesto se ve igual.
 *
 * Y va por el sistema de botones del sitio (`.lgp-btn` + `.lgp-btn-carmin`), no
 * por estilos sueltos. Esa era la razón de fondo de que se viera distinto a los
 * demás: tenía el color escrito a mano y el zoom del hover, pero no el gesto
 * —al pasar el cursor no pasaba nada más que crecer un 1.8 %—.
 *
 * En carmín: los tres botones del recorrido —"Listo", "Atrás" y "Siguiente"—
 * nacen magenta y se vuelven blancos al tocarlos. Es un solo registro para los
 * tres, que es lo que se pidió: el mismo gesto dondequiera que el cliente esté
 * parado dentro del tutorial.
 *
 * Las animaciones del tutorial no las toca este cambio y siguen encima: el zoom
 * de `lgp-hover-zoom`, el hundido de `.lgp-btn:active` y la luz de guía que
 * marca cuál es el paso que sigue.
 */
const BOTON_LISTO_CLASE = 'lgp-hover-zoom lgp-btn lgp-btn-carmin';
/**
 * Lo único que se sale de la talla de `.lgp-btn`: 48px de alto en vez de 44
 * —es un cierre que se toca con el dedo— y algo más de respiro a los lados,
 * porque el rótulo es una sola palabra corta y con el relleno de serie quedaba
 * apretado. Del ancho de su texto, no de la columna: es un cierre, no la acción
 * mayor de la pantalla.
 */
const BOTON_LISTO: CSSProperties = {
  minHeight: '48px', padding: '0 30px', letterSpacing: '0.16em',
};

function cardStyle(on: boolean, extra?: CSSProperties): CSSProperties {
  return {
    display: 'block', width: '100%', textAlign: 'left', border: 0,
    background: on ? '#FFF6F8' : '#fff',
    boxShadow: on ? 'inset 0 0 0 2px #F2004B' : 'none',
    padding: '18px 18px 20px', cursor: 'pointer', font: 'inherit', color: '#1C1E1F',
    transition: 'background .15s ease',
    ...(extra || {}),
  };
}

export default function HomeConfigurator() {
  const t = useT();
  const bgRef = useRef<HTMLDivElement | null>(null);

  /**
   * Marca una razón como visible cuando entra en pantalla, para que las tres
   * se escalonen al llegar en vez de estar ya puestas desde arriba.
   *
   * Es un `ref` de callback y no un efecto con `querySelectorAll` porque así
   * funciona aunque el nodo se monte más tarde. La animación arranca solo con
   * `data-visible="1"`: si el observador no existe o el script falla, las
   * razones se quedan visibles y legibles, que es el estado por defecto —
   * nunca al revés.
   */
  const observarRazon = useCallback((nodo: HTMLDivElement | null) => {
    if (!nodo || typeof IntersectionObserver === 'undefined') return;
    if (nodo.dataset.visible === '1') return;
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          (e.target as HTMLElement).dataset.visible = '1';
          obs.unobserve(e.target);
        });
      },
      // Un poco antes de que asome del todo: si espera al borde exacto, la
      // animación ocurre fuera de la vista y el cliente solo ve el resultado.
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    obs.observe(nodo);
  }, []);
  // Id del lote con el que se armó la configuración actual, para distinguir
  // "cambió de lote" de "recalculó el mismo lote".
  const loteAnteriorRef = useRef<string | null>(null);

  const [paso, setPaso] = useState(1);
  const [lote, setLote] = useState<Lote | null>(null);
  const [plan, setPlan] = useState<PlanKey | null>(null);
  const [fachada, setFachada] = useState<string | null>(null);
  const [interior, setInterior] = useState<string | null>(null);
  const [brief, setBrief] = useState('');
  const [modulos, setModulos] = useState<string[]>([]);
  const [sugeridos, setSugeridos] = useState<Sugerencia[] | null>(null);
  const [lead, setLead] = useState<Lead>({ nombre: '', correo: '', tel: '' });
  const [faqOpen, setFaqOpen] = useState<number[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [envioError, setEnvioError] = useState<string | null>(null);
  // Cita rápida del header: es un camino aparte del configurador, porque quien
  // pulsa "Agenda una cita" normalmente todavía no ha elegido lote ni floorplan.
  const [citaEnviada, setCitaEnviada] = useState(false);
  const [citaEnviando, setCitaEnviando] = useState(false);
  const [citaError, setCitaError] = useState<string | null>(null);
  const citaNombreRef = useRef<HTMLInputElement | null>(null);
  // La ventana enfocada donde vive el configurador. La página de inicio solo
  // decide con qué lote se entra.
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  // Quién abrió la ventana: quien llega por "ya tengo mi lote" no quiere ver
  // primero el catálogo de la subdivisión, quiere subir su lote.
  const [entradaPropia, setEntradaPropia] = useState(false);
  const [tragaluces, setTragaluces] = useState<string[]>([]);
  // Una sola subdivisión por ahora; cuando haya más, esto vuelve a ser estado.
  const subdivisionKey: SubdivisionKey = SUBDIVISIONES[0].key;
  // Mientras no exista el archivo real de la foto de entrada, se cae al
  // marcador — sin esto, un 404 se vería como una imagen rota.
  const subdivisionActiva = SUBDIVISIONES.find((s) => s.key === subdivisionKey) ?? SUBDIVISIONES[0];
  // El piso de una casa que existe: una recámara y un baño. De ahí sube el
  // cliente en el paso de cuartos. Nunca puede llegar a la cita una casa de
  // cero recámaras, y tampoco viene con tres que él no pidió.
  // El PISO: no hay casa con cero recámaras ni cero baños. Es hasta dónde puede
  // bajar el contador, no con qué arranca.
  const REC_BASE = 1, BANOS_BASE = 1;
  /**
   * LOTE APRETADO → MEDIDA COMPACTA.
   *
   * Debajo de 2,000 ft² de zona construible el configurador deja de dimensionar
   * con las medianas de las nueve casas de LGP y pasa a las cotas del 4-plex de
   * Atwood Village, que es vivienda construida y llevada al mínimo. La casa más
   * chica baja de 1,089 a 705 ft² habitables y la recámara de 185 a 159.
   *
   * No es un truco para que "quepa": es que en un lote de 4,600 ft² LGP YA ha
   * construido, y el modelo de medianas contestaba que no cabía nada. Se aplica
   * solo en lote propio; en los de la subdivisión manda el plano aprobado.
   */
  const medida: Medida = lote?.huella && lote.huella < UMBRAL_COMPACTO ? 'compacta' : 'holgada';

  /**
   * La casa más chica que puede producir un plano: el programa mínimo MÁS lo
   * que ese plano cobre por su cuenta. Hoy eso es la escalera en lote propio;
   * mañana puede ser otra idea. Va en una sola función para que el filtro de
   * "¿cabe este plano?" y el presupuesto no puedan volver a discrepar.
   */
  function minimoDelPlan(planKey: string | null) {
    const escalera = planKey && PLANES[planKey as PlanKey]?.pisos >= 2 && lote?.huella
      ? ESCALERA_POR_PLANTA * PLANES[planKey as PlanKey].pisos : 0;
    return habitableDelPrograma(REC_BASE, BANOS_BASE, medida) + escalera;
  }
  // Con qué ARRANCA. Tres y tres es lo que La Gran Piedra construye de verdad
  // —el set del Lote 17 trae MASTER BEDROOM, BEDROOM 2 y BEDROOM 3 con sus tres
  // baños— así que el cliente típico no tiene que tocar nada, y el que quiere
  // otra cosa sube o baja desde ahí. Arrancar en 1 y 1 obligaba a todos a
  // reconstruir a mano la casa que ya hacemos.
  //
  // Si el lote no aguanta 3 y 3, el efecto de recorte lo baja solo a lo que
  // quepa (primero baños, luego recámaras): el presupuesto nunca arranca en
  // rojo por un default nuestro.
  const REC_INICIAL = 3, BANOS_INICIAL = 3;
  const [recamarasExtra, setRecamarasExtra] = useState(REC_INICIAL - REC_BASE);
  const [banosExtra, setBanosExtra] = useState(BANOS_INICIAL - BANOS_BASE);
  // Dimmer del paso 1: área habitable objetivo del floorplan. null = el tamaño
  // de fábrica del plan. Solo aplica en lotes donde el plano no viene fijo.
  const [planLivingSel, setPlanLivingSel] = useState<number | null>(null);
  // Paso 4: preguntar una zona a la vez, o mostrar el catálogo completo.
  const [verTodasZonas, setVerTodasZonas] = useState(false);
  const [lotePropio, setLotePropio] = useState<Lote | null>(null);
  const [loteFile, setLoteFile] = useState<{ nombre: string; dataUrl: string; mime: string; peso: number } | null>(null);
  const [loteError, setLoteError] = useState<string | null>(null);
  // 'info' = la vía manual sigue disponible (no pasó nada malo);
  // 'error' = el usuario tiene que corregir algo.
  const [loteErrorTipo, setLoteErrorTipo] = useState<'info' | 'error'>('error');
  const [loteAnalisis, setLoteAnalisis] = useState<{
    frente: number | null; fondo: number | null; areaLote: number;
    huella?: number; maxLiving?: number; factor?: number;
    confianza: string; nota: string; fuente: string;
    direccion?: string | null; coordenadas?: string | null;
  } | null>(null);
  // Dos maneras de traer un lote propio: trazar el contorno real sobre una
  // foto del terreno, o escribir frente y fondo si el lote es un rectángulo.
  // Antes la primera era "sube una foto y la IA lee tus medidas", que pedía
  // exactamente lo mismo que el trazador y daba menos: el trazador se queda
  // con la foto Y con la forma real.
  const [loteModo, setLoteModo] = useState<'trazar' | 'medidas'>('trazar');
  // Lo que devolvió el trazador. Manda sobre cualquier cuenta rectangular:
  // su zona construible sale del contorno real, arista por arista.
  const [loteTrazado, setLoteTrazado] = useState<LoteTrazado | null>(null);
  /**
   * De cuál de las dos tarjetas salió el lote que hoy está confirmado.
   *
   * `lote` por sí solo no alcanza para saber si ESTA pantalla ya terminó: el
   * cliente puede confirmar por el trazador y luego, por curiosidad, pasarse
   * a la tarjeta de "Lote regular" — que sigue en blanco. Sin esta bandera,
   * `lote` seguía siendo verdad y "Siguiente" se encendía sobre un formulario
   * vacío, como si el paso ya estuviera resuelto cuando lo que se ve en
   * pantalla dice lo contrario.
   *
   * Se limpia al soltar el lote propio y se vuelve a poner cada vez que una
   * de las dos confirmaciones corre de verdad.
   */
  const [loteConfirmadoModo, setLoteConfirmadoModo] = useState<'trazar' | 'medidas' | null>(null);
  const [loteFrente, setLoteFrente] = useState('');
  const [loteFondo, setLoteFondo] = useState('');
  // La ciudad decide los retiros, y por eso se pregunta antes que nada más:
  // sobre el mismo lote el juego de McAllen y el de Edinburg se llevan más de
  // 1,000 ft² de diferencia. Es la misma tabla que usa el trazador — antes
  // este camino aplicaba una mediana fija y los dos daban números distintos
  // para el mismo terreno.
  const [ciudadId, setCiudadId] = useState<string | null>(null);
  // Derivados, no estado: dos copias de la misma verdad se desincronizan sola
  // la primera vez que alguien toque una y olvide la otra. Sin ciudad elegida
  // se cae a la mediana de los cinco planos acotados, que es un supuesto
  // declarado — nunca un silencio.
  const presetCiudad = presetPorId(ciudadId);
  const retiros = presetCiudad?.retiros ?? RETIROS_DEFAULT;
  const coberturaMax = presetCiudad?.coberturaMax ?? null;
  // Cuántos cajones de cochera. Es la pieza no habitable que más mueve el
  // cálculo —de 1 a 3 cajones van 372 ft² de diferencia, casi dos recámaras—
  // y hasta ahora el resumen decía "2 autos" sin que hubiera dónde cambiarlo.
  const [cajones, setCajones] = useState(2);
  // La cochera es opcional. Sin la casilla marcada la casa no lleva ninguna y
  // esos ft² se le devuelven al presupuesto habitable — hay quien estaciona en
  // la entrada y prefiere el cuarto de más. El número de cajones se guarda
  // aparte para que volver a marcarla devuelva lo que había, no un default.
  const [conGarage, setConGarage] = useState(true);
  // Ubicación capturada cuando la descripción traía dirección pero no medidas.
  const [loteUbicacion, setLoteUbicacion] = useState<{ direccion: string | null; coordenadas: string | null } | null>(null);
  /**
   * La dirección del lote, escrita por el cliente en el paso 5.
   *
   * No se pide antes a propósito: en la previa lo que hace falta son las
   * medidas, y pedir la calle ahí sería un campo más entre el cliente y su
   * primer número. Aquí ya vio su casa y la dirección es lo que convierte la
   * lámina en un documento con destinatario — el arquitecto tiene que saber a
   * dónde ir a verificar los retiros.
   */
  const [direccionLote, setDireccionLote] = useState('');

  // --- Guardado de la configuración ---------------------------------------
  // `hidratado` evita que el primer render, con todo vacío, pise lo que el
  // cliente traía guardado de su visita anterior.
  const [hidratado, setHidratado] = useState(false);
  const [retomable, setRetomable] = useState<ConfigGuardada | null>(null);

  useEffect(() => {
    const g = leerGuardado();
    if (valeLaPenaRetomar(g)) setRetomable(g);
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (!hidratado) return;
    escribirGuardado({
      paso,
      loteId: lote && lote.origen !== 'usuario' ? lote.id : null,
      lotePropio,
      plan,
      fachada,
      interior,
      modulos,
      tragaluces,
      recamarasExtra,
      banosExtra,
      planLivingSel,
      cajones,
      conGarage,
      direccionLote,
      brief,
      lead,
    });
  }, [hidratado, paso, lote, lotePropio, plan, fachada, interior, modulos, tragaluces, recamarasExtra, banosExtra, planLivingSel, cajones, conGarage, direccionLote, brief, lead]);

  // Retomar es decisión del cliente, no del sitio: restaurarle solo la
  // configuración sin avisar es tan desconcertante como haberla perdido.
  const retomar = () => {
    const g = retomable;
    if (!g) return;
    const delCatalogo = g.loteId ? (LOTES.find((l) => l.id === g.loteId) as unknown as Lote | undefined) : undefined;
    const suyo = g.lotePropio ?? null;
    const restaurado = suyo ?? delCatalogo ?? null;
    if (suyo) setLotePropio(suyo);
    setLote(restaurado);
    setPlan((g.plan as PlanKey | null) ?? null);
    setFachada(g.fachada);
    // Las cuatro gamas viejas se fueron cuando entraron las seis paletas con
    // maqueta. Un guardado de antes trae una `key` que ya no existe: sin este
    // filtro el paso arrancaría con "algo elegido" que no se puede ver ni
    // quitar, y la guía saltaría la etapa de la paleta creyéndola resuelta.
    setInterior(g.interior && INTERIORES.some((i) => i.key === g.interior) ? g.interior : null);
    setModulos(g.modulos ?? []);
    setTragaluces(g.tragaluces ?? []);
    setRecamarasExtra(g.recamarasExtra ?? REC_INICIAL - REC_BASE);
    setBanosExtra(g.banosExtra ?? BANOS_INICIAL - BANOS_BASE);
    setPlanLivingSel(g.planLivingSel ?? null);
    // Guardado viejo: traía `garage2` booleano y ningún número de cajones.
    setCajones(g.cajones ?? (g.garage2 === false ? 1 : 2));
    setConGarage(g.conGarage ?? true);
    setDireccionLote(g.direccionLote ?? '');
    setBrief(g.brief ?? '');
    setLead(g.lead ?? { nombre: '', correo: '', tel: '' });
    setPaso(g.paso && g.paso >= 1 && g.paso <= PASO_NOMBRES.length ? g.paso : 1);
    /**
     * La guía del paso de interior se da por vista al retomar.
     *
     * `tocadoCuartos` y `tocadoZonas` no se guardan —son el hilo de una
     * conversación, no una decisión— así que al volver arrancaban en `false`
     * y la guía creía que el cliente nunca había pasado por ahí. Con eso, una
     * configuración COMPLETA guardada en el brief regresaba con "Siguiente"
     * apagado y un aviso hablándole de recámaras dos pasos atrás: el cliente
     * quedaba encerrado sin manera de terminar de enviar.
     *
     * Quien tiene una configuración guardada ya recorrió esas etapas —por eso
     * hay paleta, cuartos y zonas dentro— así que volver a pedírselas es
     * cobrarle dos veces el mismo camino.
     */
    setTocadoCuartos(true);
    setTocadoZonas(true);
    setRetomable(null);
    setVentanaAbierta(true);
  };
  const descartarGuardado = () => {
    borrarGuardado();
    setRetomable(null);
  };

  // Reglas del lote activo. Sin lote todavía no se restringe nada.
  const reglas = lote ? REGLAS_LOTE[lote.tipo] : null;
  const planFijo = lote?.planFijo ?? null;
  // En los lotes de la subdivisión la fachada viene con la casa: el paso 2 no
  // se muestra apagado, se sale del recorrido y el contador pasa de 6 a 5.
  const fachadaFija = Boolean(reglas?.fachadaFija);
  const lotePropioActivo = lote?.origen === 'usuario';

  // hexagon particle background (canvas), ported from the prototype
  useEffect(() => {
    const host = bgRef.current;
    if (!host) return;

    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(cv);
    const ctx = cv.getContext('2d')!;

    const S = 46, W = S * Math.cos(Math.PI / 6);
    const FACES = [
      { rgb: [255, 255, 255], k: 0.14, pts: [[0, -S], [W, -S / 2], [0, 0], [-W, -S / 2]] },
      { rgb: [238, 238, 238], k: 0.36, pts: [[-W, -S / 2], [0, 0], [0, S], [-W, S / 2]] },
      { rgb: [229, 229, 229], k: 0.24, pts: [[W, -S / 2], [0, 0], [0, S], [W, S / 2]] },
    ];
    const SIG2 = 2 * 158 * 158;
    const ball = { x: -9e3, y: -9e3, tx: -9e3, ty: -9e3, amp: 0, target: 0, last: 0 };
    let cw = 0, ch = 0, dpr = 1, cubes: number[][] = [], flat: HTMLCanvasElement | null = null;

    const paint = (c: CanvasRenderingContext2D, withBall: boolean) => {
      c.globalAlpha = 1;
      c.fillStyle = '#FBFBFA';
      c.fillRect(0, 0, cw, ch);
      c.globalAlpha = 0.42;
      const bx = ball.x, by = ball.y, amp = ball.amp;
      for (let i = 0; i < cubes.length; i++) {
        const ox = cubes[i][0], oy = cubes[i][1];
        for (let f = 0; f < 3; f++) {
          const F = FACES[f], p = F.pts;
          let bAvg = 0;
          c.beginPath();
          for (let v = 0; v < 4; v++) {
            let x = ox + p[v][0], y = oy + p[v][1];
            if (withBall) {
              const dx = x - bx, dy = y - by;
              const b = amp * Math.exp(-(dx * dx + dy * dy) / SIG2);
              bAvg += b;
              x -= dx * b * 0.26;
              y -= dy * b * 0.26 - b * 7;
            }
            if (v === 0) c.moveTo(x, y); else c.lineTo(x, y);
          }
          c.closePath();
          let g = 1;
          if (withBall) {
            const b = bAvg / 4;
            g = 1 - F.k * b + 0.075 * Math.sin(b * Math.PI);
          }
          const r = F.rgb;
          c.fillStyle = 'rgb(' + ((r[0] * g) | 0) + ',' + ((r[1] * g) | 0) + ',' + ((r[2] * g) | 0) + ')';
          c.fill();
        }
      }
      c.globalAlpha = 1;
    };

    const build = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cw = host.clientWidth || window.innerWidth;
      ch = host.clientHeight || window.innerHeight;
      // Si el anfitrión todavía no tiene caja —primer montaje, pestaña en
      // segundo plano, ventana de 0px— `flat` saldría de 0×0 y `drawImage`
      // lanza InvalidStateError. Se sale y ya volverá el observador de tamaño.
      if (cw < 1 || ch < 1) { cubes = []; flat = null; return; }
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dx = 2 * W, dy = 1.5 * S;
      cubes = [];
      for (let r = -1; r * dy < ch + dy * 2; r++) {
        for (let c = -1; c * dx < cw + dx * 2; c++) {
          cubes.push([c * dx + (Math.abs(r % 2) ? W : 0), r * dy]);
        }
      }
      flat = document.createElement('canvas');
      flat.width = cv.width; flat.height = cv.height;
      const fc = flat.getContext('2d')!;
      fc.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint(fc, false);
      ctx.drawImage(flat, 0, 0, cw, ch);
    };

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, idle = true;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (Date.now() - ball.last > 220) ball.target = 0;
      ball.x += (ball.tx - ball.x) * 0.17;
      ball.y += (ball.ty - ball.y) * 0.17;
      ball.amp += (ball.target - ball.amp) * 0.09;
      if (ball.amp < 0.004) {
        if (!idle && flat) { ctx.drawImage(flat, 0, 0, cw, ch); idle = true; }
        return;
      }
      idle = false;
      paint(ctx, true);
    };

    const onMove = (e: PointerEvent) => {
      const over = document.elementFromPoint(e.clientX, e.clientY);
      if (over && over.closest && over.closest('[data-nofx]')) {
        ball.target = 0;
        ball.last = 0;
        return;
      }
      const r = host.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (ball.amp < 0.01) { ball.x = x; ball.y = y; }
      ball.tx = x; ball.ty = y;
      ball.target = 1;
      ball.last = Date.now();
    };
    const onResize = () => { build(); idle = true; };

    build();
    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true });
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      host.removeChild(cv);
    };
  }, []);

  /**
   * El programa más grande que quepa, sin pasarse de lo que pidió el cliente.
   *
   * Se quitan primero los baños y luego las recámaras —un baño de menos duele
   * menos que un cuarto de menos— y nunca por debajo de la casa mínima. El
   * segundo paso devuelve lo que sí quepa: sin él el recorte se pasaba de
   * tijera, quitaba TODOS los baños antes de tocar la primera recámara y
   * dejaba cero aunque hubiera lugar para uno.
   *
   * Y la devolución va ALTERNANDO, una recámara y un baño por vuelta. Los dos
   * extremos dan casas que no existen: devolviendo baños primero sale una de
   * una recámara con tres baños; devolviendo recámaras primero, una de tres
   * recámaras con un baño. Alternando queda balanceada y gasta el mismo
   * espacio. Se respeta además la regla que gobierna el contador: un baño por
   * recámara y uno de visitas, nunca más.
   */
  function recorteQueQuepa(rPedido: number, bPedido: number, techoDado?: number) {
    // El techo del plano PUESTO, no uno genérico: el patio de la idea y el
    // número de plantas lo mueven cientos de pies. Midiendo contra el genérico,
    // el programa pasaba el filtro y se iba a rojo en cuanto se elegía el plano.
    // `techoDado` lo sustituye para SIMULAR otro plano sin elegirlo — es lo que
    // usa la barra para proyectar el que el cliente está mirando.
    //
    // Y va NETO de lo que ya está comprometido: la escalera del plano y las
    // zonas que el cliente puso. Midiendo contra el techo bruto, el recorte
    // dejaba un programa que cabía "a solas" y se pasaba al sumarle un game
    // room de 224 ft² que ya estaba puesto.
    const techo = (techoDado ?? maxLivingLote()) - livingDelPlan() - livingDeZonas();
    if (techo <= 0) return { r: rPedido, b: bPedido };
    const cabe = (r: number, b: number) => habitableDelPrograma(REC_BASE + r, BANOS_BASE + b, medida) <= techo;
    const coherente = (r: number, b: number) => BANOS_BASE + b <= REC_BASE + r + 1;
    // Se prueban TODAS las combinaciones y se elige la mejor. El espacio es de
    // seis por seis: recorrerlo entero cuesta nada y evita el problema de
    // cualquier método paso a paso, que es quedarse en el primero que cabe.
    // Quitando baños hasta que entrara salía "3 recámaras y 1 baño", y ya no
    // había forma de volver: las recámaras estaban al tope y el baño no cabía.
    // 1) la casa más grande que entre, 2) la más pareja entre recámaras y
    // baños, 3) y a igualdad, la que traiga más recámaras.
    const puntaje = (r: number, b: number) => [r + b, -Math.abs(r - b), r];
    const gana = (a: number[], b: number[]) => a.findIndex((v, i) => v !== b[i]) >= 0
      && a[a.findIndex((v, i) => v !== b[i])] > b[a.findIndex((v, i) => v !== b[i])];
    let mejor = { r: 0, b: 0 };
    for (let r = 0; r <= rPedido; r++) {
      for (let b = 0; b <= bPedido; b++) {
        if (!cabe(r, b) || !coherente(r, b)) continue;
        if (gana(puntaje(r, b), puntaje(mejor.r, mejor.b))) mejor = { r, b };
      }
    }
    return mejor;
  }

  // Al cambiar de lote se reaplican las reglas de su subdivisión: se fija el
  // floorplan si el lote lo trae por default, se descarta el que ya no aplique
  // y se sueltan las zonas que el reglamento prohíbe en ese tipo de lote.
  //
  // Si además es OTRO lote (no el mismo recalculado), la configuración de
  // zonas y cuartos arranca de cero: el presupuesto cambió por completo y
  // arrastrar lo elegido antes se ve como si la app hubiera puesto zonas solas.
  useEffect(() => {
    if (!lote) return;
    const r = REGLAS_LOTE[lote.tipo];
    if (lote.planFijo) {
      setPlan(lote.planFijo as PlanKey);
    } else {
      // Además de las reglas del lote, se cae el plano que ya no CABE. Cambiar
      // a un terreno más chico con un plano grande puesto era la última puerta
      // por la que el presupuesto podía quedar en rojo, y la que el cliente
      // menos entendería: no tocó nada del plano, solo corrigió sus medidas.
      setPlan((p) => {
        if (!p || !r.planes.includes(p)) return null;
        const max = maxLivingPara(PLANES[p].pisos, p);
        return max > 0 && minimoDelPlan(p) > max ? null : p;
      });
    }

    // Y el programa se recorta a lo que quepa. Cambiar a un terreno más chico
    // con seis recámaras puestas dejaba el presupuesto en rojo sin que el
    // cliente hubiera tocado un solo cuarto — y el rojo es justo lo que no
    // puede pasar. Se quitan primero los baños y luego las recámaras, porque
    // un baño de menos duele menos que un cuarto de menos, y nunca por debajo
    // de la casa mínima.
    const cabido = recorteQueQuepa(recamarasExtra, banosExtra);
    if (cabido.r !== recamarasExtra) setRecamarasExtra(cabido.r);
    if (cabido.b !== banosExtra) setBanosExtra(cabido.b);

    // Si el lote nuevo trae la fachada puesta, la que el cliente hubiera
    // elegido antes deja de existir: arrastrarla dejaría en el resumen y en la
    // ficha del arquitecto un estilo que este lote no admite. Y si está parado
    // justo en ese paso, se le pasa al siguiente en vez de dejarlo en una
    // pantalla que ya no es parte de su recorrido.
    if (r.fachadaFija) {
      setFachada(null);
      setPaso((p) => (p === FACHADA_PASO ? FACHADA_PASO + 1 : p));
    }

    const cambioDeLote = loteAnteriorRef.current !== null && loteAnteriorRef.current !== lote.id;
    loteAnteriorRef.current = lote.id;

    if (cambioDeLote) {
      setModulos([]);
      // El arranque también se recorta: en un terreno que no aguanta tres y
      // tres, plantarlas de vuelta dejaría el presupuesto en rojo de entrada y
      // sin que el cliente hubiera tocado nada.
      const inicio = recorteQueQuepa(REC_INICIAL - REC_BASE, BANOS_INICIAL - BANOS_BASE);
      setRecamarasExtra(inicio.r);
      setBanosExtra(inicio.b);
      setTragaluces([]);
    } else if (r.zonasBloqueadas.length) {
      setModulos((prev) => prev.filter((k) => !r.zonasBloqueadas.includes(k)));
    }

    // El dimmer se recalibra: su rango depende del máximo habitable del lote.
    setPlanLivingSel(null);
    setSugeridos(null);
  }, [lote]);

  // Lo mismo al elegir plano: su patio y sus plantas mueven el techo.
  // Un cajón de cochera de más son 209 ft² menos de casa, y el cliente puede
  // volver a esta decisión con el programa ya armado. Si al agrandar la
  // cochera deja de caber lo que había pedido, se recorta igual que al cambiar
  // de lote —primero baños, luego recámaras, nunca por debajo de la casa
  // mínima— y se cae el plano que ya no entre. La regla es la misma de
  // siempre: el presupuesto no se queda en rojo, aunque quien lo empujó al
  // rojo haya sido una decisión de cochera.
  useEffect(() => {
    if (!lote?.huella) return;
    setPlan((p) => {
      if (!p || lote.planFijo) return p;
      const max = maxLivingPara(PLANES[p].pisos, p);
      return max > 0 && minimoDelPlan(p) > max ? null : p;
    });
    const cabido = recorteQueQuepa(recamarasExtra, banosExtra);
    if (cabido.r !== recamarasExtra) setRecamarasExtra(cabido.r);
    if (cabido.b !== banosExtra) setBanosExtra(cabido.b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cajones, conGarage, plan]);

  // Al cambiar de floorplan se sueltan las zonas que ya no le quedan: un balcón
  // en una casa de un piso, o un master al patio en un plano que no lo tiene.
  useEffect(() => {
    if (!plan) return;
    const p = PLANES[plan];
    setModulos((prev) => prev.filter((k) => {
      const m = MODULOS.find((x) => x.key === k);
      if (!m) return false;
      if (m.minPisos && p.pisos < m.minPisos) return false;
      if (m.soloEnPlanes && !m.soloEnPlanes.includes(plan)) return false;
      return true;
    }));
  }, [plan]);

  // ¿Otra zona del mismo grupo desplazó a la que el plano traía de fábrica?
  // (elegir cocina cerrada sustituye a la cocina abierta incluida)
  function grupoSustituido(key: string) {
    const m = MODULOS.find((x) => x.key === key);
    if (!m?.grupo) return false;
    return modulos.some((k) => {
      if (k === key) return false;
      return MODULOS.find((x) => x.key === k)?.grupo === m.grupo;
    });
  }

  // Una zona está "incluida" si el plano ya la trae y nadie la sustituyó.
  function esIncluida(key: string) {
    if (!plan) return false;
    const incluidas = PLANES[plan].incluidas as readonly string[];
    return incluidas.includes(key) && !grupoSustituido(key);
  }

  // Costo real de una zona en área habitable. Si el plano ya la incluye no se
  // cobra; si sustituye a una incluida del mismo grupo solo se cobra la
  // diferencia (cocina cerrada sobre cocina abierta = 224 − 168 = 56 ft²).
  function costoZona(m: (typeof MODULOS)[number]) {
    if (!plan) return livingDeModulo(m);
    const incluidas = PLANES[plan].incluidas as readonly string[];
    if (incluidas.includes(m.key)) return 0;
    if (m.grupo) {
      const sustituida = MODULOS.find((x) => x.grupo === m.grupo && incluidas.includes(x.key));
      if (sustituida) return livingDeModulo(m) - livingDeModulo(sustituida);
    }
    return livingDeModulo(m);
  }

  // Presupuesto en área habitable: es lo único que topa la subdivisión. Garage,
  // pórtico, patio y balcón quedan fuera (ver livingDeModulo y PLANES.living).
  // recamarasExtra/banosExtra pueden ser negativos: quitar un cuarto devuelve
  // sus ft² al presupuesto, que es como se cambia una recámara por otra zona.
  // El programa: 1 recámara y 1 baño de piso, y de ahí sube el cliente. Van
  // arriba de todo porque el presupuesto entero cuelga de ellos.
  const totalRec = REC_BASE + recamarasExtra;
  const totalBanos = BANOS_BASE + banosExtra;

  /**
   * Lo que consume el FLOORPLAN, que ya no es una casa entera.
   *
   * Antes elegir "Patio central" cobraba 1,635 ft² con 3 recámaras y 3 baños
   * puestas de fábrica. Eso ponía el programa al revés: el cliente no había
   * pedido esos cuartos. Ahora el plano solo cobra su IDEA, y de esas ideas la
   * única que gasta habitable es la escalera del plano de dos plantas — que se
   * paga en las dos. Los patios no son habitable: gastan suelo, y por eso se
   * descuentan de la capacidad del lote (ver `maxLivingPara`) y no de aquí.
   */
  //
  // Hoy ninguna idea cobra habitable: la escalera dejo de hacerlo el 31 de
  // agosto de 2026 (ver IDEA_PLAN en lib/data.ts, se estaba contando dos
  // veces). La funcion se queda porque el mecanismo sigue valiendo: si manana
  // entra una idea que si gaste habitable, se marca con `cobro` y ya.
  function livingDelPlan() {
    if (!plan) return 0;
    if (PLANES[plan].pisos < 2) return 0;
    // La escalera son 160 ft² —80 abajo y 80 arriba del hueco con barandal— y
    // solo se cobran EN LOTE PROPIO. La diferencia no es capricho, está en de
    // dónde sale el techo contra el que se compara:
    //
    //   · Lote propio: el techo se deriva del envolvente y se divide entre el
    //     reparto 906/1635 del Lote 17. Ese reparto describe una casa cuyo
    //     habitable YA incluye su escalera, así que el techo dice "hasta tantos
    //     ft² habitables, escalera adentro". Si el programa no la trae, el
    //     configurador regala 160 ft² que en obra sí ocupan planta. Medido: un
    //     40x90 con 3 recámaras pasa del 82 % del envolvente al 88 %, y el 88
    //     está arriba del techo histórico de 83.9 %. Prometía una casa que no
    //     se puede construir.
    //   · Lote de la subdivisión: el techo son los 1,635 ft² del plano ya
    //     aprobado y firmado, que también traen su escalera — pero ahí el
    //     programa tampoco es hipótesis nuestra, es el que el arquitecto ya
    //     dibujó. Cobrarla ahí volvería a dejar fuera la casa del Lote 17, que
    //     está construida. Por eso no se toca.
    if (!lote?.huella) return 0;
    return ESCALERA_POR_PLANTA * PLANES[plan].pisos;
  }



  function livingDeZonas() {
    return modulos.reduce((s, k) => {
      const m = MODULOS.find((x) => x.key === k);
      return s + (m ? costoZona(m) : 0);
    }, 0);
  }

  /**
   * La casa que pidió el cliente, armada cuarto por cuarto.
   *
   * Es el núcleo —sala, cocina, comedor, vestíbulo, lavandería— más cada
   * recámara y cada baño, con su circulación. Una recámara de más NO cuesta
   * sus 132 ft² pelones: arrastra su parte del pasillo y de los muros. Y el
   * núcleo existe aunque haya una sola recámara, que es la razón por la que
   * multiplicar por densidad se rompe en programas chicos.
   */
  function livingDeCuartos() {
    if (!lote) return 0;
    return habitableDelPrograma(totalRec, totalBanos, medida);
  }

  const cajonesMin = CAJONES_GARAGE[0].cajones;
  const cajonesMax = CAJONES_GARAGE[CAJONES_GARAGE.length - 1].cajones;
  const garageFt = conGarage ? garageFt2(cajones) : 0;

  /**
   * Cuánta casa deja el lote con una cochera de tantos ft², a una planta.
   *
   * Existe para que la elección de cajones se lea por lo que de verdad
   * significa: nadie está eligiendo una cochera, está eligiendo cuánta casa le
   * queda. A una planta y no al plano elegido porque esto se pregunta antes de
   * que haya plano, y una planta es el piso — con dos plantas siempre sale más.
   */
/**
   * Las dos notas que antes ocupaban dos párrafos en pantalla.
   *
   * Siguen existiendo porque el proyecto no deja que un supuesto pase por dato
   * duro, pero ya no se leen de corrido: viven en el `title` del número que
   * explican. Quien quiera auditar el ft² lo apunta; a quien solo viene a armar
   * su casa no le estorban.
   */
  function notaLote() {
    if (!loteAnalisis) return undefined;
    const origen = loteTrazado ? 'Trazado por ti' : (loteAnalisis.fuente === 'medidas capturadas a mano' ? 'Medidas tuyas' : 'Estimado automático');
    const cierre = loteAnalisis.huella
      ? 'El área habitable final depende de la cochera y del floorplan. El arquitecto verifica las medidas y los retiros reales en la cita.'
      : `Sin frente y fondo no se pueden aplicar retiros, así que el máximo sale del ${Math.round((loteAnalisis.factor ?? 0.5) * 100)}% del área del lote.`;
    return `${origen} — confianza ${loteAnalisis.confianza}. ${loteAnalisis.nota} ${cierre}`;
  }

  function notaCochera() {
    if (!conGarage) return 'Tu casa se diseña sin cochera: esos pies se van todos a espacio habitable.';
    if (cajones === 2) return 'Mediana de las siete casas que ya construimos: de 393 a 431 ft².';
    return 'Medida estimada: ninguna de nuestras casas tiene esta cochera todavía. Sale del mismo cajón de 9′10″ × 21′4″ que sí está medido. El arquitecto la ajusta en la cita.';
  }

  // Máximo habitable del lote.
  //
  // ANTES esto partía del envolvente COMPLETO (`lote.huella`), como si la casa
  // llenara hasta la última pulgada de lo que deja el municipio y además no
  // tuviera patio cubierto. Sobre un lote de 50x95 prometía 1,999 ft²
  // habitables; el Lot 76, construido en ese mismo lote, tiene 1,512. Un 32 %
  // de más en el número central del producto.
  //
  // Ahora pasa por dos correcciones, las dos medidas en los ocho sets:
  //   1. El envolvente se desplanta al ~82 %, no al 100 % (OCUPACION.tipica).
  //   2. El patio cubierto ocupa huella y no es habitable. Los SIETE sets con
  //      tabla de áreas lo traen; ninguno se construyó sin él.
  //
  // Contra el Lot 76: 2,480 de envolvente -> 2,034 desplantados -> 1,450
  // habitables, contra los 1,511.83 reales. Se queda 4 % corto, que es del lado
  // correcto: prometer de menos se corrige en la cita, prometer de más no.
  function maxLivingLote() {
    return maxLivingPara(plan ? PLANES[plan].pisos : 0, plan);
  }

  /**
   * El mismo cálculo, pero para un número de plantas cualquiera y no solo para
   * el plano elegido. Existe porque el paso 1 necesita saber si CADA plano cabe
   * ANTES de que se elija alguno: un plano más grande que el lote es la única
   * manera que quedaba de dejar el presupuesto en negativo, y para cerrarla hay
   * que poder preguntárselo a los tres.
   */
  function maxLivingPara(pisos: number, planKey: string | null = plan) {
    if (!lote) return 0;
    if (lote.huella && pisos > 0) {
      const desplantado = huellaDesplantada(lote.huella, 'techo');
      // El patio de la idea del plano sale de aquí y no del presupuesto
      // habitable: un patio central es un vacío, ocupa suelo y no se habita.
      const habitablePlantaBaja = desplantado - garageFt - PORCHE - patioDeLaCasa(planKey);
      if (habitablePlantaBaja <= 0) return 0;
      // En una planta, lo de abajo es todo. En dos NO se multiplica por 2: la
      // planta alta del único caso medido (Lot 17) es el 45 % del habitable, no
      // el 50 %, porque las dobles alturas se la comen. Y de ese total, 160 ft²
      // se los lleva la escalera en las dos plantas.
      if (pisos === 1) return Math.round(habitablePlantaBaja);
      const total = habitablePlantaBaja / REPARTO_PLANTA_BAJA;
      return Math.max(0, Math.round(total));
    }
    // Sin plano todavía no se sabe cuántas plantas van, y se contesta con una:
    // es el piso, porque con dos siempre sale más. Aquí NO sirve
    // `lote.maxLiving` — se congela al capturar el lote, así que al cambiar la
    // cochera el número grande se quedaba clavado en el de dos autos. Los lotes
    // de la subdivisión no traen huella y siguen cayendo a su tope de
    // reglamento, que es lo correcto: ahí manda el plano aprobado.
    if (lote.huella) return maxLivingPara(1, planKey);
    return lote.maxLiving;
  }

  /**
   * Las palancas, en el orden en que un arquitecto las movería: primero lo que
   * no cambia la casa (la cochera), luego lo que la reparte (dos plantas),
   * luego lo que le quita programa (una recámara), y al final el dato duro que
   * el cliente merece saber aunque no le guste — de cuánto tendría que ser el
   * lote. Solo se listan las que de verdad resuelven el faltante.
   */


  function ft2Restantes() {
    if (!lote) return 0;
    return Math.max(0, maxLivingLote() - livingDelPlan() - livingDeZonas() - livingDeCuartos());
  }

  // El trazador cambió de pantalla y pide subir. Quien scrollea es el cuerpo
  // de la ventana enfocada, no la página: el marco de adentro ya está hasta
  // arriba de sí mismo, y sin esto el cliente se queda mirando el pie de la
  // pantalla anterior mientras la nueva empieza fuera de cuadro.
  function subirVentana() {
    const cuerpo = document.querySelector('.lgp-ventana-cuerpo');
    cuerpo?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function pesoLegible(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Lote propio: fuera de la subdivisión, así que no carga la restricción
  // townhouse y se le abren los tres floorplans.
  function aplicarLotePropio(data: {
    frente: number | null; fondo: number | null; areaLote: number;
    huella?: number; maxLiving?: number;
    confianza: string; nota: string; fuente: string;
    direccion?: string | null; coordenadas?: string | null;
    /** Solo el lote trazado: cómo se nombran sus medidas, que no son frente × fondo. */
    medida?: string;
    /** Los retiros con los que se calculó, cuando no son los del selector. */
    retirosUsados?: typeof retiros;
  }) {
    // Si tenemos frente y fondo calculamos la huella real con los retiros; si
    // el análisis solo devolvió el área, caemos al factor de ocupación.
    const huella = data.huella
      ?? (data.frente && data.fondo ? huellaConstruible(data.frente, data.fondo, retiros, coberturaMax) : undefined);
    const propio: Lote = {
      id: 'Tu lote',
      x: 0, y: 0, w: 0, h: 0,
      frente: data.frente ? `${data.frente} ft` : '—',
      fondo: data.fondo ? `${data.fondo} ft` : '—',
      orient: 'Por definir',
      maxft: Math.round(data.areaLote),
      // maxLiving definitivo lo calcula el paso 1 con los pisos y el garage.
      // Mientras tanto — y esto SE VE en la barra de presupuesto antes de
      // elegir plano — tiene que ser ya el habitable de una planta, no el
      // envolvente pelon: antes enseñaba 2,480 ft² “habitables” sobre un lote
      // de 50x95 donde la casa real tiene 1,512.
      maxLiving: data.maxLiving ?? (huella
        ? Math.max(0, huellaDesplantada(huella) - garageFt - PORCHE - PATIO_CUBIERTO)
        : Math.round(data.areaLote * 0.5)),
      pisos: 'hasta 2 pisos',
      tipo: 'libre',
      status: 'disponible',
      origen: 'usuario',
      fuente: data.fuente,
      frenteFt: data.frente ?? undefined,
      fondoFt: data.fondo ?? undefined,
      retiros: huella ? (data.retirosUsados ?? retiros) : undefined,
      huella,
      medida: data.medida,
    };
    setLotePropio(propio);
    setLote(propio);
    setLoteAnalisis(data);
    setLoteUbicacion(
      data.direccion || data.coordenadas
        ? { direccion: data.direccion ?? null, coordenadas: data.coordenadas ?? null }
        : null,
    );
  }

  /**
   * El trazador terminó. Su zona construible entra TAL CUAL: salió del
   * contorno real —arista por arista, con las curvas, la esquina, el retiro
   * de cochera que no recorta y las franjas de servicio— y volver a
   * calcularla aquí con un rectángulo equivalente sería tirar justo el
   * trabajo que hace que trazar valga la pena.
   *
   * Por lo mismo NO se le pasan `frente` ni `fondo`: un lote de cinco lados
   * no los tiene, y dárselos haría que el resto del configurador creyera que
   * sí y volviera a hacer cuentas rectangulares sobre ellos.
   */
  function aplicarLoteTrazado(t: LoteTrazado) {
    setLoteTrazado(t);
    setLoteConfirmadoModo('trazar');
    setLoteError(null);
    // La foto del terreno se conserva: es lo que el arquitecto va a querer
    // ver junto a las medidas, y ya viaja en el resumen como adjunto.
    if (t.fotoDataUrl) {
      setLoteFile({ nombre: 'Foto de tu lote', dataUrl: t.fotoDataUrl, mime: 'image/jpeg', peso: 0 });
    }
    // La ciudad que eligió allá adentro es la misma pregunta que la de acá:
    // dejarla marcada evita que el camino rectangular la vuelva a pedir si
    // el cliente se cambia de camino.
    const preset = OPCIONES_CIUDAD.find((p) => p.nombreCorto && p.nombreCorto === t.ciudad);
    if (preset) setCiudadId(preset.id);

    const lados = t.lados.length;
    aplicarLotePropio({
      frente: null,
      fondo: null,
      areaLote: t.areaLote,
      huella: t.zonaConstruible,
      confianza: t.confianza,
      nota: t.nota
        ?? `Zona construible calculada sobre el contorno que trazaste, con los retiros de ${t.ciudad ?? 'tu plano'}.`,
      fuente: t.fuente ?? 'contorno trazado por ti',
      medida: `${lados} lados · ${t.areaLote.toLocaleString('es-MX')} ft²`,
      retirosUsados: { frente: t.retiros.frente, fondo: t.retiros.trasero, lados: t.retiros.lado },
    });
  }

  // Captura manual: no pasa por la IA, así que es la vía más confiable y la
  // única que funciona sin API key configurada.
  function aplicarMedidasManuales() {
    const f = parseFloat(loteFrente.replace(',', '.'));
    const d = parseFloat(loteFondo.replace(',', '.'));
    if (!Number.isFinite(f) || !Number.isFinite(d) || f <= 0 || d <= 0) {
      setLoteErrorTipo('error'); setLoteError('Escribe el frente y el fondo en pies, con números mayores a cero.');
      return;
    }
    const area = f * d;
    if (area < 1200 || area > 40000) {
      setLoteErrorTipo('error'); setLoteError(`Esas medidas dan ${Math.round(area).toLocaleString('es-MX')} ft², fuera del rango de un lote residencial (1,200 – 40,000 ft²). Revísalas.`);
      return;
    }
    const huella = huellaConstruible(f, d, retiros, coberturaMax);
    if (huella < 400) {
      setLoteErrorTipo('error');
      setLoteError(`Con esos retiros solo quedan ${huella.toLocaleString('es-MX')} ft² construibles en planta baja — no alcanza para una casa. Revisa las medidas o los retiros.`);
      return;
    }
    setLoteError(null);
    setLoteConfirmadoModo('medidas');
    aplicarLotePropio({
      frente: f, fondo: d,
      areaLote: Math.round(area),
      huella,
      confianza: 'alta',
      nota: `Zona construible calculada con los retiros de ${presetCiudad?.nombreCorto ?? presetCiudad?.ciudad ?? 'la mediana del Valle'}: ${retiros.frente}' al frente, ${retiros.fondo}' al fondo y ${retiros.lados}' a cada lado.`,
      fuente: 'medidas capturadas a mano',
      direccion: loteUbicacion?.direccion ?? null,
      coordenadas: loteUbicacion?.coordenadas ?? null,
    });
  }

  // El lote del usuario y los del catálogo son excluyentes: elegir uno del
  // selector deja el subido en pausa, no lo borra, para poder regresar a él.
  function usarLotePropio() {
    if (lotePropio) setLote(lotePropio);
  }

  function quitarLotePropio() {
    setLotePropio(null);
    setLoteFile(null);
    setLoteAnalisis(null);
    setLoteTrazado(null);
    setLoteConfirmadoModo(null);
    setLoteError(null);
    setLoteUbicacion(null);
    setLoteFrente('');
    setLoteFondo('');
    setLote(null);
    setPlan(null);
  }

  // Dos caminos, no tres. Antes había uno de "sube una foto y la IA lee tus
  // medidas" que pedía exactamente lo mismo que el trazador —una foto del
  // terreno con las cotas escritas— y devolvía menos: un rectángulo
  // equivalente. Ahora esa lectura vive DENTRO del trazador, sobre el
  // contorno que el cliente ya marcó, que es donde de verdad sirve.
  // Las tarjetas nombran la FORMA del terreno, no el método. Antes decían
  // "Traza tu lote" / "Sé las medidas", que le pedían al cliente elegir entre
  // dos maneras de trabajar; ahora le preguntan por un hecho que tiene delante
  // de los ojos — la regla del sándwich aplicada a la primera pantalla.
  //
  // Por eso ninguna lleva sello: "Lo mejor" tenía sentido cuando eran dos
  // métodos y uno daba mejor resultado. Sobre una forma de terreno diría que
  // es mejor tener el lote irregular, que es absurdo.
  const loteModos = [
    {
      key: 'trazar' as const,
      label: 'Lote irregular',
      desc: 'Marca su forma sobre una foto de tu terreno.',
      sello: null,
    },
    {
      key: 'medidas' as const,
      label: 'Lote regular',
      desc: 'Frente y fondo en pies.',
      sello: null,
    },
  ].map((m) => ({
    ...m,
    on: loteModo === m.key,
    onClick: () => { setLoteModo(m.key); setLoteError(null); },
  }));

  const lotesDisponibles = LOTES.filter((l) => l.status === 'disponible').length;

  // Pantalla previa: solo la ve quien entra por "ya tengo mi lote", y va antes
  // de que el contador de pasos empiece. No es un paso, es su punto de partida.
  // El recorrido no siempre son los seis pasos. `paso` sigue siendo el número
  // de siempre (1 = floorplan, 2 = fachada…) para que un guardado viejo o un
  // enlace a "te falta la fachada" no apunten a otra pantalla; lo que cambia es
  // qué pasos se recorren y con qué número se le enseñan al cliente.
  const pasosDelRecorrido = PASO_NOMBRES.map((_, i) => i + 1).filter((n) => !(n === FACHADA_PASO && fachadaFija));
  const totalPasos = pasosDelRecorrido.length;
  const esPrevia = paso === PREVIA;
  // Posición dentro del recorrido, no el índice interno: con la fachada fija,
  // el paso 3 es "3 de 5" y no "3 de 6" con un hueco en medio.
  const pasoNum = Math.max(1, pasosDelRecorrido.indexOf(paso) + 1);
  const pasoNombre = esPrevia ? 'Tu lote' : PASO_NOMBRES[paso - 1];
  const pasoHint = t(esPrevia ? 'Dinos cuánto mide tu terreno' : PASO_HINTS[paso - 1]);

  // La entrada del paso. Va por nombre alterno y no por `key` a propósito:
  // remontar el contenedor arrastraría con él a todos los pasos y les reiniciaría
  // el estado interno —el índice del carrusel, el archivo que el cliente ya
  // subió— para conseguir solo que se relance una animación.
  const pasoAnim = useAnimacionAlterna(esPrevia ? 'previa' : paso, 'lgpPasoEntraA', 'lgpPasoEntraB');

  // Lo que la casa necesita definido antes de pedirle sus datos al cliente.
  // Las zonas quedan fuera a propósito: una casa sin zonas extra es válida.
  // `tocadoCuartos` no es "tiene cuartos" sino "ya pasó por aquí": el plano ya
  // trae recámaras y baños, así que sin esta marca la etapa se saltaría sola y
  // nunca vería el contador.
  // Lo mismo con las zonas: condicionarlo a "le queda presupuesto" saltaba la
  // etapa entera en los townhouse, que arrancan en 0 ft² libres — aunque ahí sí
  // se puede agregar la zona BBQ, que es exterior y no cuesta habitable.
  const [tocadoCuartos, setTocadoCuartos] = useState(false);
  const [tocadoZonas, setTocadoZonas] = useState(false);
  const etapaGuia: 'gama' | 'cuartos' | 'zonas' | 'libre' = !interior
    ? 'gama'
    : !tocadoCuartos
      ? 'cuartos'
      : !tocadoZonas && modulos.length === 0
        ? 'zonas'
        : 'libre';
  const guiaLibre = etapaGuia === 'libre';

  // El lote apunta a la previa (paso 0), no a un paso numerado: solo le puede
  // faltar a quien entró por "ya tengo mi lote" y no terminó de capturarlo.
  const faltantes = [
    !lote ? { paso: PREVIA, que: 'el lote' } : null,
    !plan ? { paso: 1, que: 'el floorplan' } : null,
    // La fachada no puede faltar si el lote la trae puesta: pedirla bloquearía
    // el resumen por una decisión que el cliente nunca tuvo que tomar.
    !fachada && !fachadaFija ? { paso: FACHADA_PASO, que: 'la fachada' } : null,
    !interior ? { paso: 3, que: 'la paleta de interior' } : null,
  ].filter(Boolean) as { paso: number; que: string }[];
  const configCompleta = faltantes.length === 0;
  /**
   * Si el paso `n` ya quedó cerrado. Es la misma pregunta que enciende la luz
   * del "Siguiente", solo que para un paso cualquiera y no para el de encima.
   */
  function pasoCerrado(n: number): boolean {
    if (n === PREVIA) return Boolean(lote);
    if (n === 1) return Boolean(plan);
    if (n === FACHADA_PASO) return Boolean(fachada) || fachadaFija;
    if (n === 3) return guiaLibre;
    // El brief es opcional y el resumen solo se lee: no hay nada que cerrar.
    return true;
  }

  /**
   * A dónde puede ir el cliente. El recorrido es un tutorial y va SERIADO: no
   * se salta a un paso mientras quede alguno anterior sin cerrar.
   *
   * Antes esto era `n <= 4 || configCompleta`, así que del paso 1 se podía
   * brincar al 4 sin haber elegido plano ni fachada — y las etapas siguientes
   * enseñaban un presupuesto armado sobre decisiones que nadie había tomado.
   * Volver atrás sigue siendo libre: un paso ya visto se puede rehacer cuantas
   * veces quiera, lo que no se puede es adelantarse.
   */
  const pasoPermitido = (n: number) => {
    // Volver atrás siempre se puede: un paso ya visto se rehace las veces que
    // haga falta. Va primero para que nadie quede encerrado si el lote se cae
    // estando ya adentro del recorrido.
    if (n <= paso) return true;
    // Sin lote no se avanza a ningún lado: todo el presupuesto cuelga de él, y
    // la previa no está en `pasosDelRecorrido` para que la revise el bucle.
    if (!pasoCerrado(PREVIA)) return false;
    for (const previo of pasosDelRecorrido) {
      if (previo >= n) break;
      if (!pasoCerrado(previo)) return false;
    }
    // De la 5 en adelante además se exige la configuración completa: ahí es
    // donde se enseña el resumen y se piden datos, y no tiene sentido mandarlo
    // a medias.
    return n <= 4 || configCompleta;
  };

  const pasos = pasosDelRecorrido.map((n, i) => {
    const permitido = pasoPermitido(n);
    return {
      n,
      // Lo que se pinta en el botón es la posición, no el número interno.
      etiqueta: i + 1,
      permitido,
      // El `title` sustituía al contenido como nombre accesible, así que los
      // pasos bloqueados se anunciaban todos igual —"Antes elige los colores de
      // interior"— sin decir de qué paso hablaban. El número va primero y el
      // motivo después, en la misma cadena.
      ariaLabel: permitido
        ? t('Paso {n} de {total}').replace('{n}', String(i + 1)).replace('{total}', String(pasosDelRecorrido.length))
        : t('Paso {n} de {total}, bloqueado: antes elige {falta}')
            .replace('{n}', String(i + 1))
            .replace('{total}', String(pasosDelRecorrido.length))
            .replace('{falta}', faltantes.map((f) => t(f.que)).join(', ')),
      ariaCurrent: paso === n ? ('step' as const) : undefined,
    };
  });
  // `esPaso2` lleva la condición de fachada además del número: entre que un
  // guardado restaura el paso 2 y que el efecto del lote lo corre, habría un
  // fotograma con la pantalla que ese lote no debería ver.
  const esPaso1 = paso === 1, esPaso2 = paso === FACHADA_PASO && !fachadaFija, esPaso3 = paso === 3;

  /**
   * El plano que el cliente tiene delante en el carrusel, elegido o no.
   *
   * En el paso 1 la barra proyecta ESTE y no el guardado: cada plano trae su
   * patio y sus plantas, y eso mueve cientos de pies de casa. Sin la proyección
   * el cliente tenía que elegir a ciegas y descubrir el costo después — que era
   * justo el momento en que el programa se recortaba solo y parecía un error.
   * Es una simulación: no toca el estado, solo lo que se pinta.
   */
  const [planEnVista, setPlanEnVista] = useState<string | null>(null);
  const esPaso4 = paso === 4, esPaso5 = paso === 5;
  // El recorrido del guardado puede no ser el de ahora mismo (otro lote, otras
  // reglas), así que "paso X de Y" en la tarjeta de "casa a medias" se calcula
  // con el lote que se guardó, no con el que está activo.
  const recorridoGuardado = (() => {
    if (!retomable) return null;
    const l = retomable.lotePropio ?? LOTES.find((x) => x.id === retomable.loteId) ?? null;
    const fija = l ? REGLAS_LOTE[l.tipo].fachadaFija : false;
    const ns = PASO_NOMBRES.map((_, i) => i + 1).filter((n) => !(n === FACHADA_PASO && fija));
    return { n: Math.max(1, ns.indexOf(retomable.paso) + 1), total: ns.length };
  })();

  // Vista previa en vivo de la captura a mano. Se recalcula con cada tecla: el
  // terreno se dibuja mientras se escribe, en vez de escribir a ciegas y tener
  // que apretar un botón para enterarse de lo que salió.
  const previaMedidas = (() => {
    const f = parseFloat(loteFrente.replace(',', '.'));
    const d = parseFloat(loteFondo.replace(',', '.'));
    if (!Number.isFinite(f) || !Number.isFinite(d) || f <= 0 || d <= 0) return null;
    return {
      frente: f,
      fondo: d,
      areaLote: Math.round(f * d),
      huella: huellaConstruible(f, d, retiros, coberturaMax),
      anchoUtil: Math.max(0, f - retiros.lados * 2),
      largoUtil: Math.max(0, d - retiros.frente - retiros.fondo),
      // Cuando la ciudad topa la cobertura (Alton, 35 %), ese tope puede
      // ganarle a los retiros — y entonces el rectángulo de "ancho × largo"
      // deja de multiplicar al número de arriba. Enseñar "1,663 ft²" con un
      // "38′ × 50′" debajo (que son 1,900) se lee como una cuenta mal hecha.
      mandaElTope: Boolean(
        coberturaMax
        && Math.max(0, f - retiros.lados * 2) * Math.max(0, d - retiros.frente - retiros.fondo) > f * d * coberturaMax,
      ),
      // Lo que de verdad se desplanta. Va en el tablero porque si no, el
      // cliente ve "construible 2,480" y luego la barra de presupuesto le
      // habla de 1,450 sin que nada explique el brinco.
      desplantado: huellaDesplantada(huellaConstruible(f, d, retiros, coberturaMax)),
      // El habitable que daría ese lote en una planta, para poder avisar cuando
      // el terreno deja de ser lo que limita la casa.
      habitable1p: Math.max(0, huellaDesplantada(huellaConstruible(f, d, retiros, coberturaMax)) - garageFt - PORCHE - PATIO_CUBIERTO),
      // Lo que daría apretando hasta el techo histórico. No se usa para el
      // presupuesto — se enseña con su advertencia, porque ese techo es
      // exactamente lo que produjo los clósets chicos del Lot 76.
      habitableTecho: Math.max(0, huellaDesplantada(huellaConstruible(f, d, retiros, coberturaMax), 'techo') - garageFt - PORCHE - PATIO_CUBIERTO),
    };
  })();

  // El vecino en el recorrido, no en la numeración: con la fachada fuera, el
  // "siguiente" del floorplan es el interior.
  const vecino = (p: number, dir: 1 | -1) => {
    const i = pasosDelRecorrido.indexOf(p);
    if (i === -1) return dir === 1 ? (pasosDelRecorrido.find((n) => n > p) ?? p) : (pasosDelRecorrido.filter((n) => n < p).pop() ?? p);
    return pasosDelRecorrido[i + dir] ?? p;
  };
  // Desde el floorplan solo hay "atrás" para quien tiene previa que ver.
  const atras = () => setPaso((p) => (p <= pasosDelRecorrido[0] ? (entradaPropia ? PREVIA : p) : vecino(p, -1)));
  // En la previa el lote todavía se está capturando —se traza o se escriben
  // frente y fondo— y hasta que no se confirma NO hay lote: `lote` sigue en
  // null y todo lo que viene después (qué floorplans caben, cuánta superficie
  // hay) se calcularía sobre nada. Antes "Siguiente" dejaba pasar igual y el
  // cliente llegaba al paso 2 con el trabajo del paso 1 tirado.
  //
  // La puerta es `lote`, no `lotePropio`: quien llega a la previa con un lote
  // de Enclave ya elegido sí tiene lote, y frenarlo sería mentirle.
  const loteSinConfirmar = esPrevia && !lote;
  const siguiente = () => setPaso((p) => {
    // La misma condición revalidada aquí y no solo en `disabled`: entre el
    // clic y el repaint no debe colarse un avance sin lote.
    if (esPrevia && !lote) return p;
    const n = vecino(p, 1);
    return pasoPermitido(n) ? n : p;
  });
  const siguienteBloqueado = loteSinConfirmar || !pasoPermitido(vecino(paso, 1));

  const loteId = lote ? lote.id : 'tu lote';

  // Floorplans que el lote permite. En un lote townhouse la casa ya viene
  // diseñada, así que la lista trae un solo plan y el paso 1 se muestra fijo.
  const planesPermitidos = (reglas ? reglas.planes : ['B', 'C', 'D']) as PlanKey[];
  const planesVista = planesPermitidos.map((k) => {
    const p = PLANES[k];
    return {
      key: k,
      nombre: p.nombre,
      living: p.living,
      pisos: p.pisos,
      total: p.total,
      // El plano no promete una casa: promete una IDEA. Nunca dice "1,635 ft²
      // habitables · 3 rec · 3 baños" —cuartos que el cliente no ha pedido—;
      // los cuartos y los baños se eligen más adelante y hasta entonces no
      // existen. Lo que esta pantalla sí dice es cuánto cuesta la idea, y eso
      // lo arma `ft2DelPlan`.
      detalle: IDEA_PLAN[k] ? IDEA_PLAN[k].que : '',
      idea: IDEA_PLAN[k] ?? null,
      on: plan === k,
      // ¿Cabe este plano en el lote? Es la única pregunta que el cliente tiene
      // que poder contestar en esta pantalla. Un plano no se puede encoger por
      // debajo de su tamaño de fábrica —eso ya sería otro proyecto—, así que si
      // su habitable no entra, no entra: elegirlo dejaría el presupuesto en
      // números rojos desde el primer paso.
      // ¿Cabe? Ya no se pregunta por los 1,575 ft² de un plano de fábrica —eso
      // dejó de existir— sino por la casa más chica que este plano puede
      // producir: una recámara, un baño, y lo que su idea cueste. Si ni eso
      // entra, el lote no da para este plano.
      cabe: !lote || minimoDelPlan(k) <= maxLivingPara(p.pisos, k),
      cardStyle: cardStyle(plan === k, { border: '1px solid #EAE7E3' }),
      onSelect: () => {
        if (planFijo) return;
        // Revalidado aquí y no solo en el marcado, como todo lo que suma
        // superficie.
        if (lote && minimoDelPlan(k) > maxLivingPara(p.pisos, k)) return;
        setPlan((prev) => (prev === k ? null : k));
        setPlanLivingSel(null);
        setSugeridos(null);
      },
    };
  });
  // ---- Opciones para el esqueleto de decisión (pasos 2, 3 y gama) ---------
  /* Aquí vivía `DESC_PLAN`, el párrafo que describía cada plano ("un piso
     compacto, con el patio techado pegado atrás…"), más la coletilla de que el
     arquitecto acomoda los cuartos después. Se quitó por decisión del cliente:
     la tarjeta deja el nombre del plano y, debajo, lo único que el cliente
     necesita para comparar — cuántos pies cuadrados le cuesta elegirlo.

     El número va con su sustantivo y no suelto. Es la misma razón que ya está
     escrita en `IDEA_PLAN`: "200 ft²" a secas no se puede leer, porque nada
     dice si son los pies de la casa, del patio o del lote. */
  /** Qué gasta el plano, en una línea: el número y de qué es. */
  function ft2DelPlan(k: PlanKey): string | undefined {
    const idea = IDEA_PLAN[k];
    if (!idea) return undefined;
    // Lo que cuesta cada idea ya está medido: el patio en los planos de una
    // planta, la escalera —80 abajo y 80 arriba— en los de dos.
    const de = idea.cobro === 'patio' ? (idea.ft2 >= 200 ? 'de patios' : 'de patio') : 'de escalera';
    return `≈ ${idea.ft2.toLocaleString('es-MX')} ft² ${t(de)}`;
  }
  /** Las piezas que un plano trae puestas, cada una con su icono. */
  function incluyeDelPlan(k: PlanKey): { icono: ReactNode; texto: string }[] {
    const plano = PLANES[k];
    const idea = IDEA_PLAN[k];
    const piezas: { icono: ReactNode; texto: string }[] = [];
    if (idea) {
      piezas.push({
        // La escalera es la idea del plano de dos plantas; en los de una, la
        // idea es el patio y el icono lo pone el propio catálogo de zonas.
        icono: plano.pisos === 2 ? <EscaleraIcon size={40} /> : <ModuloIcon moduleKey="masterpatio" size={44} />,
        texto: idea.cobro === 'patio' ? `${t(idea.etiqueta)}: ${idea.ft2.toLocaleString('es-MX')} ft²` : t(idea.etiqueta),
      });
    }
    piezas.push({ icono: <PlantasIcon size={40} />, texto: plano.pisos === 2 ? t('2 plantas') : t('1 planta') });
    plano.incluidas.forEach((key) => {
      const m = MODULOS.find((x) => x.key === key);
      if (m) piezas.push({ icono: <ModuloIcon moduleKey={key} size={44} />, texto: t(m.nombre) });
    });
    return piezas;
  }

  const planesDecision = planesVista.map((p) => ({
    key: p.key as string,
    nombre: t(p.nombre),
    // Sin descripción: el nombre del plano y lo que cuesta elegirlo. Ver
    // `ft2DelPlan` para por qué el número lleva su sustantivo.
    meta: ft2DelPlan(p.key as PlanKey),
    imagen: RENDER_PLAN[p.key],
    visual: RENDER_PLAN[p.key] ? undefined : <PlanDiagram planKey={p.key} />,
    // Solo con render: el `PlanDiagram` de respaldo es un esquema de líneas que
    // se lee peor sobre una retícula, y ahí el blanco liso sigue siendo mejor.
    texturaFondo: Boolean(RENDER_PLAN[p.key]),
    sigla: p.key === 'TH' ? '2P' : String(p.key),
    on: p.on,
    fija: Boolean(planFijo),
    // El plano que no cabe se apaga y lo dice con todas sus letras. No se
    // esconde: saber que existe y por qué no le alcanza el terreno es
    // justamente lo que le sirve para decidir si cambia de lote.
    bloqueada: !p.cabe,
    motivoBloqueo: !p.cabe
      ? `Con este plano, la casa más chica posible —una recámara y un baño— pide ${minimoDelPlan(p.key).toLocaleString('es-MX')} ft² habitables, y tu lote da ${maxLivingPara(p.pisos, p.key).toLocaleString('es-MX')}.`
      : undefined,
    etiqueta: planFijo ? 'INCLUIDO' : !p.cabe ? 'NO CABE' : undefined,
    // Cuando el plano lo fija la subdivisión, la tarjeta no tiene nada que
    // convencer: el cliente no está eligiendo entre opciones, le tocó esta. Ahí
    // la descripción y el resumen se cambian por la lista de lo que trae
    // puesto — ver `incluye` en `PasoDecision`.
    //
    // Cada pieza sale de un dato, no de la redacción: la idea organizadora del
    // plano (`IDEA_PLAN`, con sus ft² cuando los cobra), cuántas plantas tiene
    // (`PLANES.pisos`) y las zonas que ya vienen dentro (`PLANES.incluidas`).
    // NO se listan recámaras ni baños a propósito: en este paso todavía no
    // existen —se eligen en el de interior— y ponerlos aquí prometería cuartos
    // que el cliente no ha pedido.
    incluye: planFijo ? incluyeDelPlan(p.key as PlanKey) : undefined,
    onSelect: p.onSelect,
  }));

  // Ningún plano entra en el lote. Pasa de verdad —un lote de 50 × 80 con los
  // retiros de McAllen deja 958 ft² habitables y el plano más chico pide más—,
  // y callarlo dejaría al cliente picándole a tres tarjetas apagadas.
  const ningunPlanoCabe = Boolean(lote) && !planFijo && planesVista.every((p) => !p.cabe);


  // El "dimmer de superficie" vivía aquí: un slider para estirar el plano entre
  // su tamaño de fábrica y lo que diera el lote. Se fue con el modelo viejo. Ya
  // no hay un tamaño de fábrica que estirar — la casa la define el programa que
  // arma el cliente en el paso de cuartos, y estirarla por un lado mientras se
  // arma por el otro daría dos verdades sobre el mismo número. (Llevaba tiempo
  // calculándose sin pintarse en ninguna pantalla.)

  // ---- Barra de presupuesto (pasos 2 a 5) --------------------------------
  // La barra cuenta lo que el cliente PIDIÓ, en el orden en que lo fue armando.
  // El núcleo va aparte de los cuartos porque es lo que más sorprende: una casa
  // trae sala, cocina y comedor aunque tenga una sola recámara, y verlo evita
  // que el presupuesto parezca haberse gastado solo.
  /**
   * Lo que el cliente agregó y NO se habita: la alberca, el BBQ, y la parte
   * exterior de los módulos mixtos como el balcón del master.
   */
  function ft2Exteriores() {
    return modulos.reduce((t, k) => {
      const m = MODULOS.find((x) => x.key === k);
      if (!m) return t;
      if (m.exterior) return t + m.min;
      return t + (m.living !== undefined ? m.min - m.living : 0);
    }, 0);
  }

  // Todo lo que pinta la barra pasa por aquí. Con el carrusel abierto son los
  // números del plano a la vista; en cualquier otro paso, los de la casa real.
  const planProyectado = esPaso1 && planEnVista && PLANES[planEnVista as PlanKey] ? (planEnVista as PlanKey) : null;
  const techoBarra = planProyectado ? maxLivingPara(PLANES[planProyectado].pisos, planProyectado) : maxLivingLote();
  const progBarra = planProyectado
    ? recorteQueQuepa(recamarasExtra, banosExtra, techoBarra)
    : { r: recamarasExtra, b: banosExtra };
  const recBarra = REC_BASE + progBarra.r;
  const banBarra = BANOS_BASE + progBarra.b;

  // Lo que se construye y NO se habita: la cochera, el pórtico, el patio
  // cubierto y el patio de la idea del plano. Ocupa obra y sale en la tabla de
  // áreas de cualquier plano, pero no compite con el habitable — por eso va en
  // su propia franja y no descuenta de lo libre.
  // La alberca y el BBQ entran aquí y no en el habitable: son obra que ocupa
  // terreno y no se vive bajo techo. Suman a la franja y también al techo, así
  // que aparecen en la barra sin quitarle un solo pie a la casa — que es
  // exactamente lo que son.
  const noHabitableBarra = lote ? garageFt + PORCHE + patioDeLaCasa(planProyectado ?? plan) + ft2Exteriores() : 0;
  const livingBarra = lote ? habitableDelPrograma(recBarra, banBarra, medida) + livingDelPlan() + livingDeZonas() : 0;

  /**
   * Dos franjas, no cinco.
   *
   * La oscura es TODO el living —lo indispensable, los cuartos, las estancias y
   * las zonas techadas, en un solo bloque— y la clara es el área construida que
   * no se habita. Juntas dan el área total, la misma que cierra la tabla de
   * áreas de cualquiera de nuestros planos: el Lote 17 son 1,635 de living más
   * 614 de cochera, pórtico y patio = 2,249.
   *
   * Antes eran cinco tramos en cinco tonos de carmín y solo contaban habitable.
   * La cochera —419 ft², más que dos recámaras— no aparecía en ningún lado
   * aunque se le estuviera restando al lote desde el principio.
   *
   * Lo libre sigue siendo habitable libre: la parte no habitable es fija, así
   * que el techo se mueve con ella y la resta no cambia.
   */
  const presupuestoSegmentos = [
    { key: 'living', label: 'Área habitable', ft2: livingBarra, color: '#8A2249' },
    {
      key: 'obra',
      label: t(ft2Exteriores() ? 'Cochera, pórtico, patio y exteriores' : 'Cochera, pórtico y patio'),
      ft2: noHabitableBarra,
      color: '#F2004B',
    },
  ];
  const mostrarPresupuesto = paso >= 1 && paso <= 4;

  // El mismo gesto en todos los pasos: tocar la fila elige, tocar la "×" de la
  // franja deshace. Por eso estos handlers alternan en vez de solo asignar.
  const fachadas = FACHADAS.map((f) => ({
    ...f, on: fachada === f.key,
    cardStyle: cardStyle(fachada === f.key),
    onSelect: () => setFachada((prev) => (prev === f.key ? null : f.key)),
  }));
  const interiores = INTERIORES.map((i) => ({
    ...i, on: interior === i.key,
    cardStyle: cardStyle(interior === i.key),
    onSelect: () => setInterior((prev) => (prev === i.key ? null : i.key)),
  }));

  const fachadasDecision = fachadas.map((f) => ({
    key: f.key,
    nombre: t(f.nombre),
    // Sin la línea de descripción ("volumen blanco, ventanal corrido, alero
    // mínimo…"): se oculta por decisión del cliente. El dato sigue en
    // `FACHADAS.desc` por si vuelve a hacer falta; lo que cambia es que esta
    // tarjeta ya no lo pinta — la maqueta enseña el estilo mejor que la frase.
    // Sin alto ni relleno propios: los pone el visor del carrusel. Este `span`
    // llevaba 12px de padding que se sumaban a los 12 del marco, y esos 24px
    // salían enteros del tamaño de la maqueta sin que nadie los hubiera pedido.
    visual: (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <img
          src={RENDER_FACHADA[f.key]}
          alt=""
          aria-hidden="true"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
        />
      </span>
    ),
    // La maqueta va sobre su propia placa blanca, como las paletas: el render
    // es transparente y de líneas claras, y sin placa se perdería justo cuando
    // la fila se cubre de carmín al elegirla.
    miniatura: (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', background: '#fff', border: '1px solid #EAE7E3' }}>
        <img
          src={RENDER_FACHADA_MINI[f.key]}
          alt=""
          aria-hidden="true"
          loading="lazy"
          style={{ width: '30px', height: '30px', objectFit: 'contain', display: 'block' }}
        />
      </span>
    ),
    // 'muestra' y no 'icono': la maqueta es un render, e invertirla a blanco
    // sobre la fila carmín borraría las líneas que dibujan el volumen.
    visualTipo: 'muestra' as const,
    // La maqueta viene recortada y sus líneas son claras: sobre blanco liso
    // flotaba en el vacío. La retícula de cubos del fondo de la página le da
    // suelo, y comparte proyección isométrica con la propia maqueta.
    texturaFondo: true,
    sigla: f.nombre.slice(0, 2).toUpperCase(),
    on: f.on,
    onSelect: f.onSelect,
  }));

  const gamasDecision = interiores.map((i) => ({
    key: i.key,
    nombre: t(i.nombre),
    descripcion: t(i.desc),
    // La maqueta de cocina de esa paleta. Es el mismo cuarto en las seis —misma
    // geometría, mismo encuadre, misma luz— para que lo único que se compare
    // entre una fila y otra sea el acabado, que es lo que se está eligiendo.
    imagen: RENDER_PALETA[i.key],
    // La muestra preliminar de la fila: gabinete, cubierta y piso, los tres
    // materiales que definen la paleta de un vistazo. Es lo que deja escanear
    // la tabla sin esperar a que cargue una imagen; el resultado lo enseña la
    // maqueta de al lado.
    miniatura: (
      <span style={{ display: 'flex', width: '34px', height: '34px', border: '1px solid #EAE7E3' }}>
        <span style={{ flex: 1, background: i.c1 }} />
        <span style={{ flex: 1, background: i.c2 }} />
        <span style={{ flex: 1, background: i.c3 }} />
      </span>
    ),
    // Una paleta no se invierte: invertida es otra paleta.
    visualTipo: 'muestra' as const,
    // La maqueta viene recortada con fondo transparente, igual que la de
    // fachada: sobre blanco liso flotaría en el vacío. La retícula de cubos del
    // fondo de la página le da suelo y comparte su proyección isométrica.
    texturaFondo: true,
    sigla: i.nombre.slice(0, 2).toUpperCase(),
    on: i.on,
    onSelect: i.onSelect,
  }));

  // --- Guía del paso 3 ------------------------------------------------------
  // El paso 4 tenía tres bloques a la vez —paleta, cuartos y zonas— y el
  // cliente no sabía por dónde empezar. Ahora se abren de uno en uno, como el
  // tutorial de un juego: lo que toca late, lo que no toca está apagado, y solo
  // cuando termina se suelta todo para que pueda repasar y corregir.
  //

  // Cuándo se enciende el "Siguiente".
  //
  // La regla es una sola: la luz aparece en el instante en que el cliente
  // TERMINA lo que este paso le pedía. No es decoración del botón — es el
  // acuse de que la decisión quedó tomada, y por eso se muda: mientras se
  // captura el lote late "Usar estas medidas", y al confirmarlo esa se apaga
  // y se enciende ésta. En cada pantalla hay a lo sumo un control encendido, y
  // siempre es el que toca.
  //
  // El resumen (paso 5) queda fuera: solo se lee, no hay nada que terminar, y
  // además ni siquiera dibuja un "Siguiente". El brief SÍ enciende la luz, pero
  // no al entrar —ahí no habría nada logrado todavía— sino cuando el cliente
  // acaba sus dos preguntas: el comentario y, después, la dirección del lote.
  // Prenderla antes de la dirección la convierte en un adorno que invita a
  // saltarse el último campo del recorrido.
  /**
   * El paso del brief tiene DOS momentos en el mismo lienzo: primero el
   * comentario, y al confirmarlo el mismo hueco pasa a pedir la dirección del
   * lote. No van apilados a propósito — así obligaban a bajar la pantalla para
   * ver el segundo, y este paso cabe entero sin scrollear.
   *
   * El comentario es opcional, así que el botón está siempre y solo cambia de
   * texto: quien no quiera escribir nada dice "no tengo comentarios" y llega
   * igual a la dirección.
   */
  const [briefConfirmado, setBriefConfirmado] = useState(false);
  const pideDireccion = paso === 4 && briefConfirmado;

  const pasoResuelto = esPrevia
    // No basta con que exista un lote: tiene que ser el que confirmó la
    // tarjeta que el cliente tiene abierta. Si viene de la otra —trazó su
    // terreno y ahora está mirando "Lote regular" con los campos en blanco,
    // o al revés— este paso no se siente terminado aunque técnicamente ya
    // haya un lote, y "Siguiente" no debe brillar invitando a saltárselo.
    ? Boolean(lote) && loteConfirmadoModo === loteModo
    : paso === 1
      ? Boolean(plan)
      : paso === FACHADA_PASO
        ? Boolean(fachada)
        // El paso 3 no termina con una elección sino con el tutorial completo:
        // paleta puesta, cuartos revisados y zonas revisadas.
        : paso === 3
          ? guiaLibre
          // El brief se cierra en dos tiempos: primero el comentario (el botón
          // "Confirmar" / "No tengo comentarios"), y después la dirección del
          // lote. La luz de "Siguiente" no llega hasta que la dirección está
          // ESCRITA —o ya la trajo el trazador desde la foto—, no solo a la
          // vista: es el último dato que este paso pide, y encender la guía en
          // cuanto aparece el campo invitaba a saltárselo.
          //
          // Nada de esto bloquea el botón: quien de verdad no tiene la
          // dirección todavía avanza igual —`siguienteBloqueado` no la mira, y
          // el propio campo dice "déjala en blanco y la vemos en la cita"—,
          // solo que sin el empujón de la luz.
          : paso === 4
            ? pideDireccion && Boolean(direccionLote.trim() || loteUbicacion?.direccion)
            : false;

  /**
   * QUIÉN TRAE LA LUZ. Uno solo, siempre, en toda la pantalla.
   *
   * La animación del botón no es decoración: es el dedo que señala dónde toca
   * apretar. Dos dedos señalando a la vez no guían, confunden — y eso pasaba en
   * la previa, donde "Usar estas medidas" y "Siguiente" se encendían juntos
   * porque cada uno decidía por su cuenta.
   *
   * Por eso ya no hay condiciones sueltas: hay UNA secuencia, en el orden en
   * que el cliente tiene que hacer las cosas, y gana el primer eslabón que
   * siga pendiente. Confirmar el lote va antes que avanzar; el tutorial del
   * paso 3 va en su propio orden; avanzar es siempre el último. Quien agregue
   * un control guiado nuevo lo mete en esta lista y no en un `className`, y el
   * invariante se sostiene solo.
   */
  const guiaActiva: 'usarMedidas' | 'gama' | 'cuartos' | 'zonas' | 'confirmarBrief' | 'siguiente' | null = (() => {
    // 1. Medidas escritas y sin confirmar: primero se cierra el lote. La ciudad
    //    cuenta como campo: es la que decide los retiros, y sin ella el botón
    //    todavía no es el paso siguiente. "No estoy seguro" también vale — lo
    //    que no vale es no haber contestado.
    // "Sin confirmar POR ESTE CAMINO": si el lote de hoy salió del trazador,
    // llenar el formulario de medidas sigue siendo una acción pendiente —
    // aplicarla es lo que reemplaza ese lote por el rectángulo escrito a
    // mano. Antes bastaba con `!lotePropio`, y una vez confirmado cualquier
    // lote esta luz no volvía a encenderse aunque el cliente reescribiera
    // otras medidas.
    if (esPrevia && loteModo === 'medidas' && ciudadId && loteFrente.trim() && loteFondo.trim() && loteConfirmadoModo !== 'medidas') return 'usarMedidas';
    // 2. El tutorial del paso 3, con su propia secuencia interna.
    if (paso === 3 && !guiaLibre) return etapaGuia as 'gama' | 'cuartos' | 'zonas';
    // 3. En el brief, confirmar el comentario va antes que avanzar: hasta que
    //    no esté dicho, el paso que toca es ese botón y no "Siguiente".
    if (paso === 4 && !pideDireccion) return 'confirmarBrief';
    // 4. Y hasta el final, avanzar.
    if (pasoResuelto && !siguienteBloqueado) return 'siguiente';
    return null;
  })();
  // La luz del tutorial solo después de un segundo y medio sin tocar nada.
  // Encendida desde el primer instante acompaña al cliente mientras lee y
  // decide —ahí no falta ayuda— y compite con lo que está comparando. Apuntar
  // es para quien se quedó parado. Scroll y cursor NO cuentan: ver `useOcioso`.
  const ocioso = useOcioso(1500);

  // El sitio en español o en inglés. `t` traduce una frase; lo que todavía no
  // está en el diccionario sale en español, así que la traducción puede
  // avanzar por etapas sin dejar ninguna pantalla rota. Ver `lib/idioma.ts`.
  const [idioma, setIdioma] = useIdioma();
  /** La clase de la luz, solo si ESTE es el botón que toca y el cliente se detuvo. */
  const claseLuz = (mio: typeof guiaActiva) => (guiaActiva === mio && ocioso ? ' lgp-guia-luz' : '');
  const siguienteEsElPaso = guiaActiva === 'siguiente' && ocioso;
  const claseGuia = (mia: 'gama' | 'cuartos' | 'zonas') => {
    if (guiaLibre) return '';
    if (etapaGuia === mia) return 'lgp-guia-activa lgp-guia-entra';
    const orden = { gama: 0, cuartos: 1, zonas: 2 };
    return orden[mia] > orden[etapaGuia as 'gama' | 'cuartos' | 'zonas'] ? 'lgp-guia-bloqueada' : '';
  };
  // El foco no se le pide al cliente, se le lleva: al abrirse una etapa la
  // pantalla se mueve sola hasta ella y le deja el cursor puesto en el primer
  // control. Al terminar la última, se suelta y ya navega él.
  const refGama = useRef<HTMLDivElement | null>(null);
  const refCuartos = useRef<HTMLDivElement | null>(null);
  const refZonas = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!esPaso3 || etapaGuia === 'libre') return;
    const destino = etapaGuia === 'gama' ? refGama.current : etapaGuia === 'cuartos' ? refCuartos.current : refZonas.current;
    if (!destino) return;
    // 'start' y no 'center': centrar una etapa más alta que la ventana le corta
    // la cabeza, y el cliente empieza a leerla por la mitad. Desde arriba ve el
    // bloque completo y baja él si necesita más.
    destino.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const t = window.setTimeout(() => {
      const primero = destino.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled])');
      primero?.focus({ preventScroll: true });
    }, 420);
    return () => window.clearTimeout(t);
  }, [etapaGuia, paso]);

  // Las seis maquetas se bajan al entrar al paso, no al pasar el cursor por su
  // fila. Son 343 KB entre las seis —la versión de panel, no el maestro— y sin
  // esto la primera pasada por cada fila enseña el panel vacío mientras la
  // imagen viaja, que es justo el gesto al que el panel existe para responder.
  useEffect(() => {
    if (!esPaso3) return;
    for (const src of Object.values(RENDER_PALETA)) {
      const img = new window.Image();
      img.src = src;
    }
  }, [esPaso3]);

  const pistaGuia = ((): string | null => {
    const es =
    etapaGuia === 'gama' ? 'Empieza por la paleta de interior — de ahí salen pisos, muros y carpintería.'
    : etapaGuia === 'cuartos' ? 'Aquí armas la casa: cuántas recámaras y cuántos baños quieres. El arquitecto los acomoda dentro del plano que elegiste.'
    : etapaGuia === 'zonas' ? 'Por último, agrega las áreas que quepan en lo que te queda.'
    : null;
    return es === null ? null : t(es);
  })();

  /**
   * POR QUÉ está apagado "Siguiente". Son dos motivos distintos y antes solo
   * se contaba uno:
   *
   * - `faltantes` es lo que se elige en OTRO paso, y ya traía su atajo.
   * - La guía del paso de interior es lo que falta EN ESTE, y no lo decía
   *   nadie: al elegir la paleta el botón seguía apagado con el título
   *   "Antes elige " —la lista vacía— y el aviso de abajo salía con su
   *   encabezado y ni una línea adentro. El cliente veía un botón muerto sin
   *   una sola pista de qué hacer, que es justo lo que este proyecto no hace.
   */
  const razonBloqueo: string | null = loteSinConfirmar
    ? t('Primero confirma tu lote aquí arriba')
    : faltantes.length
      ? `${t('Antes elige')} ${faltantes.map((f) => t(f.que)).join(', ')}`
      // La pista de la guía solo vale EN su paso. Fuera de él hablaba de
      // recámaras y baños a alguien parado en el brief, dos pasos después
      // de haberlos elegido — un aviso que señala a otra pantalla no
      // ayuda, confunde.
      : esPaso3 ? pistaGuia : null;

  const briefLen = brief.length;
  const onBrief = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setBrief(e.target.value);

  const ft2Rest = ft2Restantes();
  // El análisis del brief RECOMIENDA zonas, no recorta el catálogo: se marcan
  // y se suben al principio de la lista, pero el usuario sigue viendo todo.
  const modsBase = MODULOS.map((m) => {
    const sug = sugeridos?.find((s) => s.key === m.key) ?? null;
    return { key: m.key, razon: sug ? sug.razon : null, sugerida: Boolean(sug) };
  });
  const modsOrdenados = sugeridos
    ? [...modsBase].sort((a, b) => Number(b.sugerida) - Number(a.sugerida))
    : modsBase;

  // ---------- el acuse de "no cabe" ----------
  //
  // Qué control acaba de rechazar un clic por presupuesto, y un contador para
  // poder relanzar la animación si el cliente le vuelve a picar al mismo botón
  // (sin el contador, el segundo clic no cambia el estado y no pasa nada, que
  // se siente como si el botón se hubiera trabado).
  const [noCabe, setNoCabe] = useState<{ donde: string; n: number } | null>(null);
  const avisaNoCabe = (donde: string) => setNoCabe((p) => ({ donde, n: (p?.n ?? 0) + 1 }));
  useEffect(() => {
    if (!noCabe) return;
    const t = setTimeout(() => setNoCabe(null), 2000);
    return () => clearTimeout(t);
  }, [noCabe]);

  const mods = modsOrdenados.map((sg) => {
    const m = MODULOS.find((x) => x.key === sg.key)!;
    const incluida = esIncluida(m.key);
    const on = incluida || modulos.indexOf(m.key) >= 0;
    // El reglamento de la subdivisión manda sobre todo lo demás.
    const bloqueadaPorReglamento = Boolean(reglas?.zonasBloqueadas.includes(m.key));
    // Incompatibilidades con el floorplan elegido: un balcón necesita planta
    // alta; un master abierto al patio necesita que el plano tenga patio.
    const pisosPlan = plan ? PLANES[plan].pisos : 0;
    const faltanPisos = Boolean(plan && m.minPisos && pisosPlan < m.minPisos);
    const planIncompatible = Boolean(plan && m.soloEnPlanes && !m.soloEnPlanes.includes(plan));
    const incompatible = faltanPisos || planIncompatible;
    const costoLiving = costoZona(m);
    const requiereFaltante = m.requiere && !modulos.includes(m.requiere);
    const sinPresupuesto = !on && costoLiving > ft2Rest;
    // En zonas, la que no cabe se apaga y ya: sin timbre, sin burbuja y sin la
    // franja que se desliza en hover — esa franja promete un "+" que no va a
    // pasar. Aquí el camino no es insistir sino QUITAR algo puesto y volver a
    // elegir, y para eso está el atajo de "quitar una recámara" al pie de la
    // lista. El acuse de "no cabe" se queda solo en los contadores de cuartos y
    // baños, donde no hay nada que quitar de una lista.
    const disabled = bloqueadaPorReglamento || incompatible || (!on && (Boolean(requiereFaltante) || sinPresupuesto));
    const requeridoNombre = m.requiere ? (MODULOS.find((x) => x.key === m.requiere)?.corto ?? m.requiere) : null;
    const disabledReason = bloqueadaPorReglamento
      ? reglas!.motivo
      : faltanPisos
        ? `${PLANES[plan!].nombre} es de un piso: un balcón necesita planta alta.`
        : planIncompatible
          ? `${PLANES[plan!].nombre} no tiene patio al que abrir el master.`
          : requiereFaltante
            ? `Primero agrega: ${requeridoNombre}`
            : sinPresupuesto
              ? t('No cabe en tu presupuesto restante (quedan {libres} ft² habitables, esta zona necesita mínimo {pide} ft²)').replace('{libres}', String(ft2Rest)).replace('{pide}', String(costoLiving))
              : null;
    // Una zona que sustituye a otra incluida solo cobra la diferencia.
    const sustituyeA = !incluida && m.grupo
      ? MODULOS.find((x) => x.grupo === m.grupo && (plan ? (PLANES[plan].incluidas as readonly string[]).includes(x.key) : false))
      : undefined;
    return {
      iconKey: m.key, nombre: t(m.corto), nombreLargo: t(m.nombre), nota: t(m.nota),
      rango: m.rango, area: m.area, prop: m.prop, min: m.min, razon: sg.razon,
      on, disabled, disabledReason, requiereFaltante: Boolean(requiereFaltante), bloqueadaPorReglamento,
      // La misma cuenta que hace `ft2Exteriores()` para la barra, zona por
      // zona: la exterior entera, o la parte no techada de una mixta.
      incluida, costoLiving, costoExterior: m.exterior ? m.min : (m.living !== undefined ? m.min - m.living : 0),
      sustituyeA: sustituyeA ? sustituyeA.corto : null, sugerida: sg.sugerida,
      box: on ? '#F2004B' : '#fff',
      cardStyle: cardStyle(on),
      onToggle: () => {
        // Las zonas que el plano ya trae no se quitan desde aquí: se cambian
        // eligiendo la alternativa de su mismo grupo.
        if (disabled || incluida) return;
        setModulos((prev) => {
          if (prev.indexOf(m.key) >= 0) return prev.filter((k) => k !== m.key);
          const sinGrupo = m.grupo ? prev.filter((k) => MODULOS.find((x) => x.key === k)?.grupo !== m.grupo) : prev;
          return sinGrupo.concat([m.key]);
        });
      },
    };
  });

  // El tragaluz es un atributo de una zona ya puesta: se prende desde la propia
  // zona, con tope de MAX_TRAGALUCES en la misma casa.
  const orientacionHint = lote ? ((lote.orient as string) === 'Oeste' ? 'Esta área da al poniente — no ideal para tragaluz.' : `Orientación al ${lote.orient} — buena para tragaluz.`) : '';
  const toggleTragaluz = (key: string) => {
    const m = mods.find((x) => x.iconKey === key);
    if (!m || !m.on) return;
    setTragaluces((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_TRAGALUCES) return prev;
      return prev.concat([key]);
    });
  };

  const leadNombre = lead.nombre, leadCorreo = lead.correo, leadTel = lead.tel;
  const leadPrimerNombre = (lead.nombre || 'gracias').split(' ')[0];
  const onNombre = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, nombre: e.target.value }));
  const onCorreo = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, correo: e.target.value }));
  const onTel = (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setLead((prev) => ({ ...prev, tel: e.target.value }));


  // Cuartos y baños. Se pueden sumar si hay presupuesto libre, y se pueden
  // quitar hasta el mínimo del plano — quitar uno devuelve sus ft² para
  // gastarlos en otra zona (cambiar una recámara por un game room, etc.).
  function motivoTope(extra: number, def: { key: string; nombre: string; living: number; max: number }) {
    if (!lote) return t('Primero captura tu lote.');
    if (!plan) return t('Primero elige un floorplan en el paso 1.');
    // Las frases con número se arman desde una plantilla con huecos, no
    // pegando pedazos traducidos: en inglés el orden de las piezas no es el
    // mismo que en español, y una frase cosida a mano sale torcida.
    if (extra >= def.max) {
      return t('Máximo {n} {zona}s extra.').replace('{n}', String(def.max)).replace('{zona}', t(def.nombre).toLowerCase());
    }
    // OJO: se pregunta por lo que de verdad se va a DESCONTAR, no por el cuarto
    // pelón. `EXTRAS.recamara.living` son 132 ft² —la recámara sola— pero el
    // presupuesto cobra 198, porque el cuarto arrastra su clóset, su parte de
    // la entrada y su parte de los muros. Con los 132 el candado dejaba entrar
    // recámaras que no cabían y el presupuesto terminaba en rojo: exactamente
    // el caso que se ve como "No cabe" con la casa ya armada.
    const cuesta = costoReal(def);
    if (cuesta > ft2Rest) {
      return t('No cabe: quedan {libres} ft² habitables y {zona} necesita {pide} ft².')
        .replace('{libres}', String(ft2Rest))
        .replace('{zona}', t(def.nombre).toLowerCase())
        .replace('{pide}', String(cuesta));
    }
    return null;
  }

  // ¿Lo que frena es el presupuesto, y no otra regla? Solo ese caso se deja
  // tocar, para poder contestarle "no cabe"; el máximo del catálogo y la falta
  // de plano siguen apagados porque no se resuelven insistiendo.
  function noCabePorPresupuesto(extra: number, def: { key: string; living: number; max: number }) {
    return Boolean(lote) && Boolean(plan) && extra < def.max && costoReal(def) > ft2Rest;
  }

  /** Lo que ese extra le cuesta al presupuesto, ya con clóset, entrada y muros. */
  function costoReal(def: { key: string }) {
    return def.key === 'recamara' ? ft2PorRecamara(medida) : ft2PorBano(medida);
  }

  /**
   * Lo que de verdad se recupera al quitar una recámara: el cuarto con su
   * clóset y su parte del pasillo, MÁS la estancia que esa recámara arrastraba
   * si al bajar de número la casa deja de necesitarla (la segunda sala al caer
   * de cinco, el comedor de diario al caer de seis). Se calcula restando los
   * dos programas en vez de suponer cuál se va: así sigue siendo correcto si
   * mañana se agrega otra estancia a la tabla.
   */
  function liberaUnaRecamara() {
    const suma = (r: number) => estanciasDeProgramaGrande(r).reduce((a, x) => a + x.ft2, 0);
    return ft2PorRecamara(medida) + Math.round((suma(totalRec) - suma(totalRec - 1)) / (1 - CIRCULACION));
  }

  function motivoQuitar(total: number, min: number, etiqueta: string) {
    if (!plan) return 'Primero elige un floorplan en el paso 1.';
    if (total <= min) return `El plano no puede quedar con menos de ${min} ${etiqueta}.`;
    return null;
  }

  // El piso ya no lo pone el plano sino la casa: una recámara y un baño. En el
  // townhouse sí manda el plano, porque esa casa viene diseñada y aprobada.
  const recMin = planFijo && plan ? PLANES[plan].recMin : REC_BASE;
  const banosMin = planFijo && plan ? PLANES[plan].banosMin : BANOS_BASE;

  const contadores = [
    {
      key: 'recamara',
      nombre: t('Recámaras'),
      Icono: CamaIcon,
      base: plan ? PLANES[plan].rec : 0,
      total: totalRec,
      // Lo que cuesta CONTRA EL PRESUPUESTO, no el cuarto pelón: 132 ft² de
      // recámara más su clóset y su parte de la circulación. Enseñar 132 aquí
      // y descontar 170 sería enseñar una cuenta que no cuadra.
      living: ft2PorRecamara(medida),
      extra: recamarasExtra,
      masMotivo: motivoTope(recamarasExtra, EXTRAS.recamara),
      masNoCabe: noCabePorPresupuesto(recamarasExtra, EXTRAS.recamara),
      masDisabled: Boolean(motivoTope(recamarasExtra, EXTRAS.recamara)) && !noCabePorPresupuesto(recamarasExtra, EXTRAS.recamara),
      menosMotivo: motivoQuitar(totalRec, recMin, 'recámara'),
      menosDisabled: Boolean(motivoQuitar(totalRec, recMin, 'recámara')),
      // El tope se revalida aquí y no solo con `disabled`: si llegaran varios
      // clics antes de que React repinte, todos parten del mismo valor y el
      // presupuesto nunca se rebasa.
      onMas: () => {
        if (noCabePorPresupuesto(recamarasExtra, EXTRAS.recamara)) { avisaNoCabe('recamara'); return; }
        if (motivoTope(recamarasExtra, EXTRAS.recamara)) return;
        setRecamarasExtra(recamarasExtra + 1);
      },
      onMenos: () => {
        if (motivoQuitar(totalRec, recMin, 'recámara')) return;
        setRecamarasExtra(recamarasExtra - 1);
      },
    },
    {
      key: 'bano',
      nombre: t('Baños'),
      Icono: BanoIcon,
      base: plan ? PLANES[plan].banos : 0,
      total: totalBanos,
      living: ft2PorBano(medida),
      extra: banosExtra,
      // "Un baño por recámara y uno de visitas" era un TOPE y dejó de serlo.
      // Bloqueaba un baño que el presupuesto sí podía pagar —109 ft² libres
      // contra 62 que cuesta— por una idea nuestra de cómo debe ser una casa.
      // El único límite es el espacio: si cabe, se puede pedir. La regla sigue
      // viva donde sí corresponde, en `recorteQueQuepa`, que la usa para elegir
      // un programa parejo cuando tiene que recortar solo — ahí es un default,
      // no un candado.
      masMotivo: motivoTope(banosExtra, EXTRAS.bano),
      masNoCabe: noCabePorPresupuesto(banosExtra, EXTRAS.bano),
      masDisabled: Boolean(motivoTope(banosExtra, EXTRAS.bano)) && !noCabePorPresupuesto(banosExtra, EXTRAS.bano),
      menosMotivo: motivoQuitar(totalBanos, banosMin, 'baño'),
      menosDisabled: Boolean(motivoQuitar(totalBanos, banosMin, 'baño')),
      onMas: () => {
        if (noCabePorPresupuesto(banosExtra, EXTRAS.bano)) { avisaNoCabe('bano'); return; }
        if (motivoTope(banosExtra, EXTRAS.bano)) return;
        setBanosExtra(banosExtra + 1);
      },
      onMenos: () => {
        if (motivoQuitar(totalBanos, banosMin, 'baño')) return;
        setBanosExtra(banosExtra - 1);
      },
    },
  ];

  // De dónde puede salir el espacio que falta, dicho en la lista de lo que no
  // cabe: el caso real más común es el townhouse del catálogo, que usa los
  // 1,635 ft² completos y deja el paso de áreas en cero. Una recámara de menos
  // devuelve lo que cuesta ponerla, que alcanza para casi cualquier área del
  // catálogo.
  //
  // Antes esto traía además un botón que la quitaba de un golpe. Se fue por
  // decisión del cliente y el camino sigue abierto donde corresponde: el "−"
  // del contador de recámaras, unos centímetros más arriba en la misma
  // pantalla.
  const liberarEspacio = plan && !motivoQuitar(totalRec, recMin, 'recámara')
    ? { etiqueta: 'Quitar una recámara', ft2: liberaUnaRecamara() }
    : null;

  // Cómo se nombra la fachada fuera del paso 2. Cuando el lote la trae puesta
  // no es "sin elegir" —no había nada que elegir— y tampoco se le inventa un
  // estilo del catálogo: se dice de dónde viene.
  const FACHADA_DE_SUBDIVISION = 'Definida por la subdivisión';
  const fachadaTexto = fachada
    ? (FACHADAS.find((f) => f.key === fachada)?.nombre ?? '—')
    : fachadaFija
      ? FACHADA_DE_SUBDIVISION
      : 'Sin elegir';

  // ---- Totales de la casa configurada -----------------------------------
  // Living = plano + zonas habitables + cuartos extra.
  // Total  = living + lo construido no habitable (garage, pórtico, patio,
  //          balcón) + las zonas exteriores que el usuario agregó.
  const ft2LivingTotal = livingDelPlan() + livingDeZonas() + livingDeCuartos();
  // Lo que se construye y no es habitable: cochera, pórtico y patio cubierto.
  // Antes salía de `PLANES[plan].total - living`, que era el desglose del plano
  // de fábrica; con la casa armada por programa ya no hay tal plano, así que se
  // suma con las medianas reales de los sets. En el lote del catálogo sigue
  // mandando el desglose aprobado del townhouse.
  const planNoHabitable = lote?.huella
    ? garageFt + PORCHE + patioDeLaCasa(plan)
    : (plan ? PLANES[plan].total - PLANES[plan].living : 0);
  const ft2ConstruidoTotal = ft2LivingTotal + planNoHabitable + ft2Exteriores();
  // En lote propio manda lo que eligió el usuario; en un lote del catálogo
  // manda el garage real del plano aprobado, no el estándar.
  const garageTexto = lote?.huella
    ? (conGarage
        ? `${cajones} auto${cajones === 1 ? '' : 's'} · ${garageFt.toLocaleString('es-MX')} ft²${cajones === 2 ? '' : ' (medida estimada)'}`
        : 'Sin cochera')
    : `2 autos · ${GARAGE_2_TOWNHOUSE.toLocaleString('es-MX')} ft² (del plano aprobado)`;
  /**
   * El área del TERRENO, que no siempre es `maxft`.
   *
   * En el lote del cliente `maxft` sí es el área del lote — la escribe
   * `crearLotePropio` con `Math.round(data.areaLote)`. En los del catálogo
   * significa otra cosa: es el total CONSTRUIDO del plano aprobado (2,249 ft²
   * del Lote 17). Imprimir ese número como "área del lote" decía que un
   * townhouse de 32.5 × 80 se para en 2,249 ft² de terreno cuando son 2,600.
   * Con frente y fondo a la mano se multiplica; si no, se calla el número en
   * vez de dar el equivocado.
   */
  function areaDelLote(): number | null {
    if (!lote) return null;
    if (lote.origen === 'usuario' || lote.huella) return lote.maxft;
    const f = parseFloat(String(lote.frente)), d = parseFloat(String(lote.fondo));
    return Number.isFinite(f) && Number.isFinite(d) ? Math.round(f * d) : null;
  }

  const loteMedida = lote
    ? (lote.medida
        // Un lote trazado no tiene frente × fondo: "— × — · 5,571 ft²" se lee
        // como un dato que se perdió, cuando en realidad es más preciso que
        // cualquier rectángulo.
        ?? (() => {
          const a = areaDelLote();
          const par = lote.frenteFt && lote.fondoFt
            ? `${lote.frenteFt} × ${lote.fondoFt} ft`
            : `${lote.frente} × ${lote.fondo}`;
          return a ? `${par} · ${a.toLocaleString('es-MX')} ft²` : par;
        })())
    : 'Sin elegir';
  // Aquí vivía `resumen`: la tabla de renglones que enseñaba el paso "Tu
  // casa". Ese paso salió del recorrido y la tabla se fue con él — el correo
  // nunca la usó, se arma por su cuenta en `armarFicha()`.

  const interiorSeleccionado = interior ? INTERIORES.find((i) => i.key === interior) ?? null : null;
  const modulosSeleccionados = mods.filter((m) => m.on).map((m) => ({ iconKey: m.iconKey, nombre: m.nombre, razon: m.razon }));
  const planNombreSel = plan ? PLANES[plan].nombre : 'Sin floorplan elegido';

  const noEnviado = !enviado;

  // La ficha que recibe el arquitecto: todo lo que el cliente decidió, con el
  // desglose del presupuesto y el croquis del lote. Vive solo en el correo —
  // en el sitio el cliente ve el resumen corto de arriba.
  function armarFicha(): Ficha {
    const zonas = mods
      .filter((m) => m.on)
      .map((m) => {
        const def = MODULOS.find((x) => x.key === m.iconKey);
        return {
          nombre: m.nombreLargo,
          rango: def?.rango ?? '',
          ft2: m.costoLiving,
          exterior: Boolean(def?.exterior),
          incluida: m.incluida,
        };
      });
    return {
      cliente: { nombre: lead.nombre.trim(), correo: lead.correo.trim(), tel: lead.tel.trim() },
      lote: {
        id: lote?.id ?? '—',
        origen: lote?.origen === 'usuario' ? 'usuario' : 'catalogo',
        medida: loteMedida,
        maxft: lote?.maxft ?? 0,
        orientacion: lote?.orient ?? '—',
        tipo: lote?.tipo ?? '—',
        retiros: lote?.retiros ?? null,
        huella: lote?.huella ?? null,
        adjunto: loteFile ? `${loteFile.nombre} · ${pesoLegible(loteFile.peso)}` : null,
        ubicacion: [
          direccionLote.trim() || loteUbicacion?.direccion,
          loteUbicacion?.coordenadas,
        ].filter(Boolean).join(' · ') || null,
      },
      plan: {
        nombre: plan ? PLANES[plan].nombre : '—',
        pisos: plan ? PLANES[plan].pisos : 0,
        livingBase: plan ? PLANES[plan].living : 0,
        livingElegido: livingDelPlan(),
      },
      cuartos: {
        recamaras: totalRec,
        banos: totalBanos,
        recBase: plan ? PLANES[plan].rec : 0,
        banosBase: plan ? PLANES[plan].banos : 0,
      },
      // Al arquitecto le sirve saber que no la eligió el cliente, no un guion.
      fachada: fachada ? (FACHADAS.find((f) => f.key === fachada)?.nombre ?? '—') : fachadaFija ? FACHADA_DE_SUBDIVISION : '—',
      interior: {
        nombre: interiorSeleccionado?.nombre ?? '—',
        colores: interiorSeleccionado ? [interiorSeleccionado.c1, interiorSeleccionado.c2, interiorSeleccionado.c3] : [],
      },
      // Las claves van aparte de los nombres: la lámina adjunta las necesita
      // para elegir qué render carga. En lote de subdivisión la fachada no se
      // elige, así que va nula y la lámina lo dice con palabras.
      claves: { plan, fachada, interior },
      zonas,
      tragaluces: tragaluces.map((k) => MODULOS.find((m) => m.key === k)?.corto ?? k),
      presupuesto: {
        maxLiving: maxLivingLote(),
        plan: livingDelPlan(),
        cuartos: livingDeCuartos(),
        zonas: livingDeZonas(),
        libre: ft2Rest,
      },
      garage: garageTexto,
      totales: { living: ft2LivingTotal, construido: ft2ConstruidoTotal },
      brief,
    };
  }

  const enviar = async () => {
    if (enviando) return;
    if (!lead.nombre.trim()) {
      setEnvioError('Escribe tu nombre en el paso 6 para saber a quién buscamos.');
      return;
    }
    if (!lead.correo.trim() && !lead.tel.trim()) {
      setEnvioError('Déjanos un correo o un teléfono en el paso 6, el que prefieras.');
      return;
    }
    setEnviando(true);
    setEnvioError(null);
    try {
      const res = await fetch('/api/enviar-resumen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(armarFicha()),
      });
      if (res.ok) {
        setEnviado(true);
        return;
      }
      // Nunca se confirma un envío que no salió: si el correo no está
      // configurado o falló, el cliente se entera y se le da otra vía.
      setEnvioError(
        res.status === 501
          ? 'El envío automático todavía no está activo. Escríbenos o agenda tu cita aquí abajo y llevamos tu configuración a la cita.'
          : 'No pudimos mandarla en este momento. Vuelve a intentar, o agenda tu cita aquí abajo.',
      );
    } catch {
      setEnvioError('No pudimos mandarla: revisa tu conexión y vuelve a intentar.');
    } finally {
      setEnviando(false);
    }
  };

  // El CTA del header lleva al formulario de cita y deja el cursor puesto en el
  // primer campo. El scroll es suave, así que el foco espera a que termine:
  // enfocar a media animación la cancela en iOS.
  const irACita = () => {
    const el = document.getElementById('contacto');
    if (el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' });
    window.setTimeout(() => citaNombreRef.current?.focus({ preventScroll: true }), 520);
  };
  // Pedimos nombre y una sola vía de contacto: exigir las dos sobra para una
  // primera llamada y cuesta conversiones.
  //
  // Va a su propia ruta, `/api/agendar-cita`, y no a la de la ficha: esta cita
  // casi siempre se pide sin haber abierto el configurador, y mandar la ficha
  // completa con lote y plano en blanco llenaba el correo de huecos. El equipo
  // recibe solo los datos de contacto y "Me gustaría agendar una cita con
  // ustedes" (`lib/cita.ts`). Mismo buzón, misma llave y las mismas reglas de
  // validación y de 501 que el envío del paso 7.
  const agendarCita = async () => {
    if (citaEnviando) return;
    if (!lead.nombre.trim()) {
      setCitaError('Escribe tu nombre para saber a quién buscamos.');
      return;
    }
    if (!lead.correo.trim() && !lead.tel.trim()) {
      setCitaError('Déjanos un correo o un teléfono, el que prefieras.');
      return;
    }
    setCitaError(null);
    setCitaEnviando(true);
    try {
      const res = await fetch('/api/agendar-cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: lead.nombre, correo: lead.correo, tel: lead.tel }),
      });
      if (res.ok) {
        setCitaEnviada(true);
        return;
      }
      // Mismo trato que en el paso 7: nunca se confirma un envío que no salió.
      setCitaError(
        res.status === 501
          ? 'El envío automático todavía no está activo y tu solicitud no nos llegó. Escríbenos a contact@lagranpiedrallc.com y te contestamos directo.'
          : 'No pudimos mandarlo en este momento. Vuelve a intentar, o escríbenos a contact@lagranpiedrallc.com.',
      );
    } catch {
      setCitaError('No pudimos mandarlo: revisa tu conexión y vuelve a intentar.');
    } finally {
      setCitaEnviando(false);
    }
  };

  // Varias preguntas abiertas a la vez: quien compara financiamiento contra
  // tiempo de obra necesita las dos en pantalla, y cerrar la anterior en
  // silencio se siente como si la página le quitara algo.
  const faqs = FAQS.map((f, i) => ({
    q: f.q, a: f.a,
    open: faqOpen.includes(i),
    icon: faqOpen.includes(i) ? '−' : '+',
    onToggle: () => setFaqOpen((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : prev.concat([i]))),
  }));

  const nav = NAV.map((n) => ({
    label: n.label, href: '#' + n.id,
    color: '#5C6163', dot: n.id === 'index' ? '#F2004B' : 'transparent',
  }));

  // --- Entrada y salida de la ventana enfocada -----------------------------
  // Entrar con un lote del catálogo: se fija el lote y se arranca en el paso 1,
  // el floorplan.
  const abrirDesdeLote = (l: Lote) => {
    setLote(l);
    setPaso(1);
    setEntradaPropia(false);
    setVentanaAbierta(true);
  };
  // Entrar a diseñar. Los ocho lotes del catálogo son el mismo townhouse
  // —mismo tipo, mismo plan fijo y los mismos 1,635 ft² habitables— así que se
  // entra con el primero disponible y el combo sale idéntico. Nada de las
  // reglas ni del presupuesto cambia con cuál de los ocho sea.
  const abrirDiseno = () => {
    const lista = LOTES as unknown as Lote[];
    const primero = lista.find((l) => l.status === 'disponible') ?? lista[0];
    if (primero) abrirDesdeLote(primero);
  };
  // Entrar con lote propio: primero la pantalla previa, que es donde se sube la
  // foto o se capturan las medidas. De ahí sigue al paso 1 como todos.
  const abrirPropioLote = () => {
    setPaso(PREVIA);
    setEntradaPropia(true);
    setVentanaAbierta(true);
  };
  const cerrarVentana = () => setVentanaAbierta(false);

  // Cierre desde la pantalla de éxito: no es "voy a seguir después", ya se
  // mandó. Si solo cerráramos la ventana, dos cosas quedarían mal — el fondo
  // seguiría donde se abrió (a media página de "Lugares disponibles", no en
  // el inicio) y el guardado local seguiría ofreciendo "retomar" un combo que
  // ya está en el correo del arquitecto. Por eso este cierre reinicia todo el
  // configurador y sube a la portada, como si el cliente llegara de nuevo.
  const cerrarTrasEnviar = () => {
    borrarGuardado();
    setRetomable(null);
    setVentanaAbierta(false);
    setPaso(1);
    setLote(null);
    setLotePropio(null);
    setPlan(null);
    setFachada(null);
    setInterior(null);
    setBrief('');
    setModulos([]);
    setSugeridos(null);
    setLead({ nombre: '', correo: '', tel: '' });
    setEnviado(false);
    setEnvioError(null);
    setEntradaPropia(false);
    setTragaluces([]);
    setRecamarasExtra(REC_INICIAL - REC_BASE);
    setBanosExtra(BANOS_INICIAL - BANOS_BASE);
    setPlanLivingSel(null);
    setVerTodasZonas(false);
    setLoteFile(null);
    setLoteError(null);
    setLoteErrorTipo('error');
    setLoteAnalisis(null);
    setLoteModo('trazar');
    setLoteTrazado(null);
    setLoteFrente('');
    setLoteFondo('');
    setCiudadId(null);
    setCajones(2);
    setConGarage(true);
    setDireccionLote('');
    setLoteUbicacion(null);
    setTocadoCuartos(false);
    setTocadoZonas(false);
    // Después de que la ventana termine su transición de salida, no antes —
    // moverlo a la vez se siente como un salto brusco.
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  };

  return (
    <div style={{position: "relative", overflowX: "hidden", background: "#FBFBFA", paddingBottom: "74px"}}>

      {/* Con 57 elementos enfocables en una sola página, quien navega con
          teclado tenía que tabular por todo para llegar al configurador. */}
      <a href="#personaliza" className="lgp-skip">{t('Saltar al configurador')}</a>

      <div ref={bgRef} style={{position: "fixed", inset: "0", zIndex: "0", pointerEvents: "none", overflow: "hidden"}}></div>


      {/* La sombra se fue del estilo en línea a `.lgp-header`: un `box-shadow`
          aquí le ganaría a la regla que la hace aparecer solo al separarse del
          borde superior. Pegada al borde, la cabecera no flota sobre nada. */}
      <div data-nofx="1" className="lgp-header" style={{position: "fixed", top: "0", left: "0", right: "0", zIndex: "60", display: "flex", alignItems: "stretch", background: "linear-gradient(178deg,#FFFFFF 0 54%,#F5F2EE 54% 80%,#E7E3DE 80%)", pointerEvents: "auto"}}>

        <a href="#index" className="lgp-header-logo" style={{display: "flex", alignItems: "center", gap: "13px", padding: "11px 22px"}}>
          <img src="/logo-full.svg" alt="La Gran Piedra" style={{height: "38px", width: "auto", display: "block"}} />
          <img src="/logo-wordmark.svg" alt="La Gran Piedra" className="lgp-header-wordmark" style={{height: "11px", width: "auto", display: "block"}} />
        </a>

        <div style={{flex: "1"}}></div>

        <div className="lgp-header-social" style={{display: "flex", alignItems: "center", gap: "14px", padding: "0 20px"}}>
          <a href="https://www.instagram.com/lagranpiedrallc/" target="_blank" rel="noopener noreferrer" title="Instagram" style={{display: "flex", alignItems: "center"}}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#505759" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.4" cy="6.6" r="1.15" fill="#505759" stroke="none"></circle></svg></a>
          {/* El TikTok se retiró a pedido del cliente: la cuenta todavía
              no existe y un icono que lleva a la portada de TikTok no es un
              enlace, es un callejón. Vuelve en cuanto haya cuenta. */}
        </div>

        {/* Tinta y no carmín a propósito: la cabecera está en pantalla el 100%
            del tiempo, y un bloque carmín permanente convierte el acento en
            constante — justo lo que el manual evita al pedir que el blanco o el
            negro prevalezcan. El carmín se reserva para el momento de convertir
            dentro de la página. Lo que sí le faltaba era reaccionar: no tenía
            ningún feedback. */}
        {/* El idioma va aquí, pegado al CTA: es lo primero que busca quien
            no lee español, y escondido en un menú no lo encontraría. */}
        <SelectorIdioma idioma={idioma} onCambiar={setIdioma} />

        <a href="#contacto" onClick={(e) => { e.preventDefault(); irACita(); }} className="lgp-hover-zoom lgp-header-cta lgp-btn lgp-btn-tinta" style={{alignSelf: "stretch", padding: "0 24px", letterSpacing: "0.16em"}}>{t('Agenda una cita')}</a>
      </div>

      <section id="index" data-screen-label="Inicio" className="lgp-hero-height" style={{position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "110px 22px 24px", overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0}}>
          <HeroLoopVideo src="/video/casa-4701-dron-hero.mp4" poster="/hero-house.jpg" crossfadeDuration={1} />
        </div>
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(100deg, rgba(18,19,20,0.85) 0%, rgba(18,19,20,0.55) 40%, rgba(18,19,20,0.15) 68%, rgba(18,19,20,0.05) 100%)", zIndex: 1}}></div>
        <div style={{position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,19,20,0) 0%, rgba(18,19,20,0.5) 100%)", zIndex: 1}}></div>

        <div className="lgp-contenedor" style={{position: "relative", zIndex: 2}}>
          <div data-nofx="1" style={{maxWidth: "780px", marginInline: "auto", textAlign: "center", animation: "lgpUp .9s ease both"}}>
            {/* Blanco y no carmín: esto va sobre el vídeo del hero, y el carmín
                de marca a 10px sobre imagen en movimiento era prácticamente
                invisible. La regla del sistema solo contempla fondos claros;
                sobre foto, el único color que se sostiene es el blanco. */}
            <p style={{margin: "0 0 16px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "10px", letterSpacing: "0.2em", color: "#FFFFFF", textShadow: "0 1px 12px rgba(0,0,0,0.55)", textTransform: "uppercase"}}>{t('Casas custom · Rio Grande Valley')}</p>
            {/* La promesa, y el único texto del hero además del rótulo.
                Debajo iba "Aquí el cliente firma el plano" como línea de
                apoyo; se quitó por decisión del cliente, y con ella la frase
                que nombraba el diferenciador. El <h1> —el título que leen
                buscadores y lectores de pantalla— es esta línea.

                El `textShadow` es un halo suave, no una sombra: centrado y a
                este tamaño el título se sale de la parte oscura del degradado
                y sus últimas líneas caen sobre cielo del vídeo, donde el
                blanco solo se sostiene con este contorno difuso. Es el mismo
                recurso que ya usa el rótulo de arriba, más ancho porque el
                texto es más grande. */}
            <h1 style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "clamp(33px,6.4vw,66px)", lineHeight: "1.08", letterSpacing: "0.015em", textWrap: "balance", color: "#fff", textShadow: "0 2px 22px rgba(0,0,0,0.55)"}}>{t('Nunca fue tan fácil y satisfactorio diseñar tu casa.')}</h1>
            <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "34px"}}>
              {/* Los dos CTA son los dos caminos reales: la subdivisión o el
                  terreno propio. El primero lleva a "Lugares disponibles",
                  donde está el botón que abre el configurador, así que dice
                  "Lote disponible" — es lo que hay ahí, no lo que se abre
                  después. El segundo abre el configurador directo y dice
                  "Diseñar mi casa", la acción real de ese clic. */}
              <a href="#lugares" className="lgp-hover-zoom lgp-btn lgp-btn-carmin" style={{letterSpacing: "0.16em"}}>{t('Lugares disponibles')}</a>
              <a href="#personaliza" className="lgp-hover-zoom lgp-btn lgp-btn-sobre-foto" style={{letterSpacing: "0.16em"}}>{t('Diseñar mi casa')}</a>
            </div>
          </div>
        </div>

        {/* La tarjeta de cifras comparte el ancho del titular: antes iba a
            1000px dentro de un contenedor de 1240 y su borde izquierdo caía
            120px adentro del de la <h1>, sin ninguna razón. */}
        <div data-nofx="1" className="lgp-contenedor" style={{position: "relative", zIndex: "2", marginTop: "34px", background: "#FBFBFA", border: "1px solid #EAE7E3"}}>
          <div style={{display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))"}}>
            <div style={{padding: "26px 24px", borderRight: "1px solid #EAE7E3"}}>
              <div className="lgp-cifra" style={{['--i' as string]: 0, fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>8</div>
              <div className="lgp-cifra-pie" style={{['--i' as string]: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase", marginTop: "5px"}}>{t('Lotes en McAllen')}</div>
            </div>
            <div style={{padding: "26px 24px", borderRight: "1px solid #EAE7E3"}}>
              {/* Decía "7" y no era cierto: el recorrido real es de 6 con lote
                  propio y 5 en Enclave, donde la subdivisión trae la fachada
                  puesta. Publicar un número que la propia ventana desmiente en
                  su cabecera es la clase de detalle que un comprador nota. */}
              <div className="lgp-cifra" style={{['--i' as string]: 1, fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>5–6</div>
              <div className="lgp-cifra-pie" style={{['--i' as string]: 1, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase", marginTop: "5px"}}>{t('Pasos, según tu lote')}</div>
            </div>
            <div style={{padding: "26px 24px"}}>
              <div className="lgp-cifra" style={{['--i' as string]: 2, fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "26px", letterSpacing: "-0.02em"}}>100%</div>
              <div className="lgp-cifra-pie" style={{['--i' as string]: 2, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase", marginTop: "5px"}}>{t('Smart home integrado')}</div>
            </div>
          </div>
        </div>
      </section>

      <section id="nosotros" data-screen-label="Por qué nosotros" style={{position: "relative", padding: "var(--lgp-y-tema) var(--lgp-canal) var(--lgp-y-bloque)"}}>
        <div data-nofx="1" className="lgp-contenedor">
          <h2 style={{margin: "0 0 34px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>{t('Por qué nosotros')}</h2>
          <p style={{margin: "0 0 44px", maxWidth: "660px", fontSize: "clamp(19px,2.3vw,28px)", lineHeight: "1.36", letterSpacing: "-0.012em", textWrap: "pretty"}}>{idioma === 'en'
            ? (<Fragment>Nobody knows what you want better than you do. That is why <em style={{fontStyle: "italic"}}>you</em> design your home here: simple, with none of the back and forth that wears you down.</Fragment>)
            : (<Fragment>Nadie mejor que tú sabe cómo quiere las cosas, por eso aquí diseñas tu casa <em style={{fontStyle: "italic"}}>tú mismo</em>: fácil y sin procesos que te fastidien.</Fragment>)}</p>
          {/* Tres razones paralelas, no una secuencia: por eso se fueron los
              rótulos 01/02/03 y la caja que las envolvía. Quedan columnas
              divididas por un filete vertical — la misma división que usa un
              cuadro de rotulación de plano. Sin `marginBottom`: el aire de
              cierre lo pone el padding de la sección y nada más, que es lo que
              antes sumaba 156px de vacío al apilarse. */}
          <div className="lgp-razones">
            {[
              ['Proceso a la vista', 'Cada semana recibes fotos, avance y el costo real acumulado. Sin cambios de orden sorpresa.'],
              ['Diseño modular', 'Combinas módulos reales con proporciones probadas. Libertad, pero dentro de lo que sí funciona.'],
              ['Smart home de fábrica', 'Clima, accesos, riego e iluminación cableados desde obra gris. No parches después.'],
            ].map(([titulo, cuerpo], i) => (
              <div
                key={titulo}
                className="lgp-razon"
                ref={observarRazon}
                style={{['--i' as string]: i}}
              >
                <h3 style={{margin: "0", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase"}}>{t(titulo)}</h3>
                <p style={{margin: "12px 0 0", maxWidth: "34ch", fontSize: "14px", lineHeight: "1.6", color: "#5C6163"}}>{t(cuerpo)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Justo debajo de "Por que nosotros", antes de "La obra": es la
          entrada natural de quien ya se convencio y quiere ver donde
          construir. Titulo de seccion normal (como el resto de la pagina) +
          tarjeta foto-hero de la subdivision. */}
      <section id="lugares" data-screen-label="Lugares disponibles" style={{position: "relative", padding: "0 var(--lgp-canal) var(--lgp-y-cierre)"}}>
        <div data-nofx="1" className="lgp-contenedor">
          <h2 style={{margin: "0 0 26px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>{t('Lugares disponibles')}</h2>

          <div style={{position: "relative", border: "1px solid #EAE7E3", background: "#fff", marginBottom: "26px"}}>
            <div style={{position: "relative", height: "clamp(240px,32vw,360px)", overflow: "hidden", background: "repeating-linear-gradient(135deg,#F3F1EE 0 8px,#FCFBFA 8px 16px)"}}>
              {/* Foto de acceso y render del townhouse, turnándose solos. Los
                  controles y el rótulo del render van arriba, no abajo: el
                  título y su degradado ya ocupan la franja inferior. */}
              <CarruselSubdivision
                imagenes={subdivisionActiva.imagenes}
                style={{position: "absolute", inset: 0}}
              />
              {/* Capa de opacidad ligera sobre toda la foto: la aplana un
                  poco para que no compita con el título y quede a tono con el
                  resto del sitio, que nunca usa fotos a color puro. Aparte,
                  independiente, del degradado inferior — ese sigue existiendo
                  solo para que el texto se lea. */}
              {/* `pointerEvents: none` en las tres capas: son decorado y texto,
                  y sin esto se tragaban el clic que abre la imagen a pantalla
                  completa, que es lo que hay debajo. */}
              <div style={{position: "absolute", inset: 0, pointerEvents: "none", background: "rgba(18,19,20,0.16)"}}></div>
              <div style={{position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(18,19,20,0) 45%, rgba(18,19,20,0.62) 100%)"}}></div>
              <div style={{position: "absolute", left: "22px", right: "22px", bottom: "18px", pointerEvents: "none"}}>
                <p style={{margin: "0 0 6px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "clamp(24px,3.4vw,36px)", letterSpacing: "-0.02em", textTransform: "uppercase", color: "#fff"}}>{subdivisionActiva.nombre}</p>
                <p style={{margin: "0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.82)", textTransform: "uppercase"}}>{subdivisionActiva.zona} · {subdivisionActiva.direccion}</p>
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", padding: "22px"}}>
              {/* La disponibilidad como cifra, con el mismo tratamiento que
                  los stats del hero (numero grande + etiqueta chica) — antes
                  era una linea de texto plano, perdida entre el resto. */}
              {/* Mismo observador que las tres razones —el que escribe
                  `data-visible`— porque esta cifra está a media página y
                  animarla al cargar sería animarla fuera de la vista. */}
              <div ref={observarRazon} className="lgp-cifra-observada" style={{display: "flex", alignItems: "baseline", gap: "10px"}}>
                <span className="lgp-cifra" style={{fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "34px", letterSpacing: "-0.02em", color: "#1C1E1F"}}>{lotesDisponibles}</span>
                <span className="lgp-cifra-pie" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>Lotes disponibles</span>
              </div>
              {/* Un solo camino. Al lado vivía "Ver mapa completo", que abría
                  el plat de los 119 lotes para escoger uno de los ocho — pero
                  los ocho son el mismo townhouse, con el mismo plan fijo y los
                  mismos 1,635 ft² habitables, así que escoger no cambiaba nada
                  de lo que sigue. Era una decisión que se le pedía al cliente
                  sin que tuviera consecuencia. */}
              <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"}}>
                <button onClick={abrirDiseno} className="lgp-hover-zoom lgp-btn lgp-btn-carmin">{t('Diseñar mi casa →')}</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* La obra, en grande y arriba: es lo unico de esta pagina que no es
          promesa. Va antes de pedirle nada al cliente. Cinco casas nuestras,
          fotografiadas, sin rotulo: la seccion promete "sin render que prometa
          lo que no se entrega" y ahora lo cumple. Los marcadores rayados que
          vivian aqui anunciaban fotos que faltaban justo debajo de esa frase, y
          la foto que encabezaba la tira no era una casa nuestra. */}
      <section data-screen-label="La obra" style={{position: "relative", padding: "var(--lgp-y-tema) 0 var(--lgp-y-cierre)"}}>
        <div className="lgp-sangria" style={{marginBottom: "26px"}}>
          <h2 style={{margin: "0 0 12px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>{t('La obra')}</h2>
          <p style={{margin: "0", maxWidth: "620px", fontSize: "clamp(19px,2.3vw,27px)", lineHeight: "1.35", letterSpacing: "-0.012em", textWrap: "pretty"}}>{t('Casas nuestras, terminadas y en obra. Sin render que prometa lo que no se entrega.')}</p>
        </div>
        {/* La tira sigue siendo de borde a borde —así se entiende que hay que
            deslizar— pero su primera pieza arranca alineada con el título de
            la sección, no a 22px de la pantalla. En un monitor ancho esos dos
            bordes se separaban más de 100px.

            El contenido y el comportamiento viven en <TiraObra>: flechas que se
            retiran en cada extremo, y visor a pantalla completa al tocar una
            foto. La lista está en lib/obra.ts. */}
        <TiraObra />
      </section>

      {/* ============== INICIO: la otra puerta al configurador ==============
          Quien va por un lote de la subdivision entra con "Disenar mi casa",
          arriba. Aqui solo queda el camino de quien ya trae terreno propio. */}
      <section id="personaliza" data-screen-label="Personaliza tu casa" style={{position: "relative", padding: "var(--lgp-y-tema) var(--lgp-canal) var(--lgp-y-cierre)", background: "rgba(255,255,255,0.68)", borderTop: "1px solid #F0EDE9", borderBottom: "1px solid #F0EDE9"}}>
        <div data-nofx="1" className="lgp-contenedor">
          <h2 style={{margin: "0 0 12px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>{t('Personaliza tu casa')}</h2>

          {/* Volvió y tenía algo a medias. Se le ofrece, no se le impone. */}
          {retomable ? (
    <Fragment>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", marginBottom: "30px", padding: "18px 20px", background: "#FFF7F9", border: "1px solid #F8C9D6"}}>
            <div style={{flex: "1 1 300px", minWidth: 0}}>
              <p style={{margin: "0 0 4px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#8A2249", textTransform: "uppercase"}}>{t('Dejaste una casa a medias')}</p>
              <p style={{margin: "0", fontSize: "15px", lineHeight: "1.5", color: "#1C1E1F"}}>
                {(retomable.lotePropio?.id ?? retomable.loteId ?? t('Tu lote'))} · {t('paso {n} de {total}. La guardamos en este navegador.').replace('{n}', String(recorridoGuardado?.n ?? retomable.paso)).replace('{total}', String(recorridoGuardado?.total ?? PASO_NOMBRES.length))}
              </p>
            </div>
            <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
              <button onClick={retomar} className="lgp-hover-zoom" style={{minHeight: "44px", padding: "0 18px", background: "#EB004B", border: "0", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>{t('Continuar')}</button>
              <button onClick={descartarGuardado} style={{minHeight: "44px", padding: "0 16px", background: "transparent", border: "1px solid #F8C9D6", color: "#8A2249", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>{t('Empezar de cero')}</button>
            </div>
          </div>
    </Fragment>
    ) : null}

          {/* Tu propio lote: el otro camino de entrada a la misma ventana */}
          <div style={{border: "1px solid #EAE7E3", background: "#fff", padding: "clamp(22px,3vw,34px)"}}>
            <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "26px", flexWrap: "wrap"}}>
              <div style={{flex: "1 1 320px", minWidth: 0}}>
                <p style={{margin: "0 0 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#8A2249", textTransform: "uppercase"}}>{t('¿Ya tienes tu propio lote?')}</p>
                <p style={{margin: "0 0 10px", fontSize: "clamp(18px,2.1vw,24px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>{t('Empecemos a calcular tu lote.')}</p>
                <p style={{margin: "0", maxWidth: "52ch", fontSize: "15px", lineHeight: "1.6", color: "#5C6163"}}>
                  {t('Con una imagen o simplemente colocando medidas es suficiente.')}
                </p>
              </div>
              {/* Pasa de tinta a carmín. Abre el configurador igual que
                  "Diseñar mi casa", así que era la misma acción pintada de otro
                  color. La ley es: el carmín marca la acción que avanza, una
                  sola por región — y en esta sección esta es la única. */}
              <button onClick={abrirPropioLote} className="lgp-hover-zoom lgp-btn lgp-btn-carmin" style={{flex: "none", minHeight: "48px", padding: "0 22px", letterSpacing: "0.16em"}}>{t('Subir mi lote →')}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PERSONALIZA TU CASA: la ventana enfocada ============
          Fuera del flujo de la pagina a proposito: mientras arma su casa no
          hay hero, ni FAQ, ni barra de navegacion compitiendo. */}
      <VentanaEnfocada
        abierto={ventanaAbierta}
        onCerrar={cerrarVentana}
        etiqueta={t('Personaliza tu casa')}
        cabecera={
          <div style={{maxWidth: "1080px", margin: "0 auto", padding: "12px 20px 0"}}>
            {/* El "Cerrar ✕" que vivía aquí se fue al canto doblado de la hoja,
                arriba a la derecha: la esquina levantada lleva la ✕ y cierra la
                ventana. Queda un solo camino de salida en pantalla en vez de
                dos que hacen lo mismo. Escape y el gesto de "atrás" del
                teléfono siguen cerrando igual, como siempre. */}
            <div style={{display: "flex", alignItems: "center", gap: "16px", marginBottom: "10px"}}>
              {/* La previa no lleva número: numerarla la volvería un paso, y
                  entonces el cliente del catálogo empezaría en el 2 otra vez. */}
              <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase"}}>{esPrevia ? <>{t('Antes de empezar')} — {t(pasoNombre)}</> : <>{t('Paso')} {pasoNum} {t('de')} {totalPasos} — {t(pasoNombre)}</>}</span>
            </div>
            {/* Los pasos son un INDICADOR, no un mando.
                Eran botones y por ahí se colaba el salto de pasos: aunque la
                regla ya no dejaba adelantarse, seguían invitando a apretarlos y
                a saltar entre los que sí estaban abiertos. El recorrido es un
                tutorial y se avanza con "Siguiente" y "Atrás", uno por uno.
                Por eso van como lista y no como controles: nada que enfocar con
                el tabulador, nada que anunciar como pulsable, y el lector de
                pantalla lee en cuál va con `aria-current`. */}
            <PasosBarra pasos={pasos} />
            {mostrarPresupuesto ? (
    <Fragment>
            <div style={{marginTop: "12px", marginBottom: "12px"}}>
              <PresupuestoBar max={techoBarra + noHabitableBarra} exteriores={lote ? ft2Exteriores() : 0} segmentos={presupuestoSegmentos} sinLote={!lote} recamaras={lote ? recBarra : null} banos={lote ? banBarra : null} cajones={lote ? (lote.huella ? (conGarage ? cajones : 0) : 2) : null} />
              {/* Aquí vivía la franja de "tu lote es chico · medidas compactas",
                  con la explicación y cuatro palancas. Se quitó por decisión del
                  cliente. La lógica no cambió: debajo de UMBRAL_COMPACTO el
                  programa se sigue dimensionando con las cotas del 4-plex, solo
                  que sin anunciarlo.

                  Las palancas que enumeraba tampoco se pierden — todas son
                  controles que ya existen y se ven: el plano "Patio techado
                  atrás" abre el carrusel, la cochera se sube y se baja en la
                  previa del lote, y el plano de dos plantas está en la misma
                  fila. El texto solo las repetía. */}
              {/* Aquí vivía el plegable "Qué lleva cualquier casa, y qué ya
                  descontamos de tu lote": la tabla del núcleo pieza por pieza y
                  la cadena del terreno a la casa. Se quitó por decisión del
                  cliente — al comprador no le sirve auditar de dónde sale cada
                  ft², le sirve saber cuánta casa tiene. La aritmética completa
                  sigue viva en `habitableDelPrograma()` y en `maxLivingPara()`,
                  y el arquitecto la recorre en la cita. */}
            </div>
    </Fragment>
    ) : <div style={{height: "12px"}}></div>}
          </div>
        }
      >
        <div
          className="lgp-paso-anim"
          style={{maxWidth: "1080px", margin: "0 auto", padding: "26px 20px 40px", animation: pasoAnim ? pasoAnim + ' 380ms cubic-bezier(.22,1,.36,1) both' : undefined}}
        >

          {/* La previa: solo la ve quien trae su propio terreno. Aquí no hay
              catálogo que enseñar — quien viene por un lote de la subdivisión
              entra directo al paso 1 con el suyo ya puesto. */}
          {esPrevia ? (
    <Fragment>

            <div style={{display: "flex", flexDirection: "column"}}>
              {/* Aquí había tres textos diciendo lo mismo: este párrafo, el de
                  la tarjeta, y las tres tarjetas de modo que ya explican cada
                  camino con su propia descripción. Queda solo el dato que no
                  está en ningún otro lado. */}
              <div style={{order: 1, marginTop: "0", marginBottom: "34px", padding: "clamp(20px,3vw,30px)", background: "#fff", border: "1px solid #F2004B", boxShadow: "0 2px 12px rgba(28,30,31,0.07)"}}>
                <p style={{margin: "0 0 6px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.16em", textTransform: "uppercase"}}>{t('Tu lote')}</p>
                <p style={{margin: "0 0 18px", maxWidth: "540px", fontSize: "13px", lineHeight: 1.6, color: "#5C6163"}}>
                  {t('Al ser un lote fuera de la subdivisión, se te abren los tres floorplans.')}
                </p>

                {lotePropio ? (
    <Fragment>
                <div style={{padding: "18px", background: "#F7F5F2", border: "1px solid #EAE7E3"}}>
                  <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"}}>
                    <div>
                      <p style={{margin: "0 0 4px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "15px"}}>{t('Tu lote')}</p>
                      <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#5C6163", textTransform: "uppercase"}}>{loteFile ? loteFile.nombre : ''}</p>
                    </div>
                    <div style={{display: "flex", gap: "8px", flex: "none"}}>
                      {lotePropioActivo ? (
    <Fragment>
                      <span style={{padding: "8px 13px", background: "#EB004B", color: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase"}}>{t('✓ En uso')}</span>
    </Fragment>
    ) : (
    <Fragment>
                      <button onClick={usarLotePropio} className="lgp-hover-zoom" style={{padding: "8px 13px", background: "#1C1E1F", border: "0", color: "#FBFBFA", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>{t('Usar este lote')}</button>
    </Fragment>
    )}
                      <button onClick={quitarLotePropio} style={{padding: "8px 13px", background: "transparent", border: "1px solid #DDD9D4", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer"}}>Quitar</button>
                    </div>
                  </div>
                  {!lotePropioActivo ? (
    <Fragment>
                  <p style={{margin: "14px 0 0", padding: "10px 12px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40", fontSize: "12px", lineHeight: 1.5, color: "#6B6E70"}}>
                    Ahorita estás configurando sobre <strong style={{fontWeight: 600}}>{loteId}</strong> del catálogo. Toca “Usar este lote” para volver al tuyo.
                  </p>
    </Fragment>
    ) : null}
                  {loteAnalisis ? (
    <Fragment>
                  <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "12px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E4E1DD"}}>
                    {(loteTrazado
                      // Un lote trazado no se describe con frente × fondo: se
                      // describe con sus lados y su ciudad, que es de donde
                      // salieron los dos números que sí importan.
                      ? [
                          { k: 'Lados', v: String(loteTrazado.lados.length) + (loteTrazado.esquina ? ' · esquina' : '') },
                          { k: 'Ciudad', v: loteTrazado.ciudad ?? 'Por confirmar' },
                          { k: t('Área del lote'), v: loteTrazado.areaLote.toLocaleString('es-MX') + ' ft²' },
                          { k: 'Zona construible', v: loteTrazado.zonaConstruible.toLocaleString('es-MX') + ' ft²' },
                        ]
                      : [
                          { k: 'Frente', v: loteAnalisis.frente ? loteAnalisis.frente + ' ft' : '—' },
                          { k: 'Fondo', v: loteAnalisis.fondo ? loteAnalisis.fondo + ' ft' : '—' },
                          { k: t('Área del lote'), v: loteAnalisis.areaLote.toLocaleString('es-MX') + ' ft²' },
                          loteAnalisis.huella
                            ? { k: 'Zona construible', v: loteAnalisis.huella.toLocaleString('es-MX') + ' ft²', t: notaLote() }
                            : { k: 'Máx habitable', v: (loteAnalisis.maxLiving ?? 0).toLocaleString('es-MX') + ' ft²', t: notaLote() },
                        ]
                    ).map((d: { k: string; v: string; t?: string }) => (
    <Fragment key={d.k}>
                    <div title={d.t} style={{cursor: d.t ? 'help' : undefined}}>
                      <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{d.k}</p>
                      <p style={{margin: 0, fontFamily: "Archivo, sans-serif", fontWeight: "700", fontSize: "14px"}}>{d.v}</p>
                    </div>
    </Fragment>
    ))}
                  </div>
                  {loteAnalisis.direccion || loteAnalisis.coordenadas ? (
    <Fragment>
                  <div style={{marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #E4E1DD"}}>
                    <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{t('Ubicación')}</p>
                    <p style={{margin: 0, fontSize: "13px", lineHeight: 1.5, color: "#505759"}}>{[loteAnalisis.direccion, loteAnalisis.coordenadas].filter(Boolean).join(' · ')}</p>
                  </div>
    </Fragment>
    ) : null}
                  {/* Los lados capturados, uno por uno. Es la prueba de dónde
                      salió el área — sin esto la cifra hay que creérsela — y
                      es lo primero que va a querer ver el arquitecto. */}
                  {loteTrazado ? (
    <Fragment>
                  <div style={{display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #E4E1DD"}}>
                    {loteTrazado.lados.map((l) => (
    <Fragment key={l.n}>
                    <span style={{padding: "4px 9px", background: "#fff", border: "1px solid #E4E1DD", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.04em", color: "#505759"}}>
                      {l.nombre}: <strong style={{fontWeight: 700, color: "#1C1E1F"}}>{l.ft ? l.ft + '′' : '—'}</strong>{l.curvo ? ' ↝' : ''}
                    </span>
    </Fragment>
    ))}
                  </div>
    </Fragment>
    ) : null}
    </Fragment>
    ) : null}
                </div>

                {/* La cochera, aquí y no en el paso 1: es la resta que
                    decide con cuánta casa arranca el cliente, y preguntarla
                    después obligaría a mover el número grande a media
                    configuración. Hasta ahora el resumen decía "2 autos" como
                    si fuera una elección sin que existiera dónde cambiarlo.

                    Una fila, no tres tarjetas: es una sola cifra que sube y
                    baja, y ocupar media pantalla para eso le robaba peso al
                    tablero del lote, que es lo que el cliente vino a ver. */}
                {lotePropioActivo && loteAnalisis?.huella ? (
    <Fragment>
                <div style={{display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "18px", paddingTop: "16px", borderTop: "1px solid #E4E1DD"}}>
                  {/* La casilla manda: sin marcar, la casa no lleva cochera
                      y esos ft² vuelven al presupuesto. Va primero porque es la
                      pregunta de arriba — cuántos lugares solo tiene sentido si
                      la respuesta ya fue que sí. */}
                  <label style={{display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: "none"}}>
                    <input
                      type="checkbox"
                      checked={conGarage}
                      onChange={(e) => setConGarage(e.target.checked)}
                      style={{width: "17px", height: "17px", flex: "none", accentColor: "#F2004B", cursor: "pointer"}}
                    />
                    {/* El mismo coche que lleva la barra de presupuesto y la
                        lámina. Se apaga con la casilla, igual que todo lo
                        demás. */}
                    <CarroIcon size={32} color={conGarage ? "#1C1E1F" : "#B7BABB"} />
                    <span style={{minWidth: "126px"}}>
                      <span style={{display: "block", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: conGarage ? "#1C1E1F" : "#8B8F91"}}>Garage</span>
                      <span style={{display: "block", margin: "2px 0 0", fontSize: "13px", color: "#5C6163"}}>
                        {conGarage ? (
                          <Fragment>
                            <strong style={{fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "15px", color: "#1C1E1F"}}>{cajones}</strong> auto{cajones === 1 ? '' : 's'} · <span title={notaCochera()} style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", cursor: "help"}}>{garageFt.toLocaleString('es-MX')} ft²</span>{cajones === 2 ? null : <span title={notaCochera()} style={{marginLeft: "5px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8B8F91", cursor: "help"}}>estimado</span>}
                          </Fragment>
                        ) : 'Sin cochera'}
                      </span>
                    </span>
                  </label>
                  {/* Las flechas apiladas: arriba suma, abajo quita. En el tope
                      —y con la casilla apagada— se deshabilitan, y el `title`
                      dice por qué: nada apagado sin explicación. */}
                  <div style={{display: "flex", flexDirection: "column", flex: "none", opacity: conGarage ? 1 : 0.45}}>
                    <button
                      onClick={() => setCajones((c) => Math.min(cajonesMax, c + 1))}
                      disabled={!conGarage || cajones >= cajonesMax}
                      aria-label={t('Un lugar más de garage')}
                      title={!conGarage ? 'Marca la casilla para ponerle cochera' : (cajones >= cajonesMax ? 'Tres lugares es el máximo' : 'Un lugar más')}
                      style={{width: "34px", height: "24px", display: "grid", placeItems: "center", padding: 0, background: "#fff", border: "1px solid #DDD9D4", borderBottom: "0", color: (!conGarage || cajones >= cajonesMax) ? "#C3C0BC" : "#1C1E1F", cursor: (!conGarage || cajones >= cajonesMax) ? "not-allowed" : "pointer"}}
                    >
                      <svg viewBox="0 0 12 8" width="11" height="7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 6.2 6 1.6l5 4.6" /></svg>
                    </button>
                    <button
                      onClick={() => setCajones((c) => Math.max(cajonesMin, c - 1))}
                      disabled={!conGarage || cajones <= cajonesMin}
                      aria-label={t('Un lugar menos de garage')}
                      title={!conGarage ? 'Marca la casilla para ponerle cochera' : (cajones <= cajonesMin ? 'Quita la casilla si no quieres cochera' : 'Un lugar menos')}
                      style={{width: "34px", height: "24px", display: "grid", placeItems: "center", padding: 0, background: "#fff", border: "1px solid #DDD9D4", color: (!conGarage || cajones <= cajonesMin) ? "#C3C0BC" : "#1C1E1F", cursor: (!conGarage || cajones <= cajonesMin) ? "not-allowed" : "pointer"}}
                    >
                      <svg viewBox="0 0 12 8" width="11" height="7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 1.8 6 6.4l5-4.6" /></svg>
                    </button>
                  </div>
                </div>
    </Fragment>
    ) : null}
    </Fragment>
    ) : (
    <Fragment>
                {/* Tarjetas, no pestañas: cada camino dice qué pide y qué da,
                    y el que sirve mejor lleva sello. */}
                <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "10px", marginBottom: "20px"}}>
                  {loteModos.map((m) => (
    <Fragment key={m.key}>
                  {/* Las dos tarjetas viven en blanco con filo negro, elegida o no.
                      Quien dice cuál está tomada es el punto carmín, no el fondo: el
                      fondo negro quedó reservado para el gesto —al pasar el cursor o
                      apretar, la tarjeta se llena de tinta en 200 ms—. La animación
                      vive en `.lgp-tarjeta-tinta` (globals.css) y los colores de
                      adentro la siguen con `currentColor`, para que texto y punto se
                      inviertan en el mismo golpe y no en dos tiempos. */}
                  <button onClick={m.onClick} aria-pressed={m.on} className="lgp-tarjeta-tinta" style={{textAlign: "left", padding: "15px 16px 16px", cursor: "pointer"}}>
                    <span style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px"}}>
                      <span data-punto={m.on ? '1' : '0'} style={{width: "13px", height: "13px", flex: "none", borderRadius: "50%", border: "2px solid " + (m.on ? "#F2004B" : "#DDD9D4"), background: m.on ? "#F2004B" : "transparent"}}></span>
                      <span style={{fontFamily: "Archivo, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "inherit"}}>{t(m.label)}</span>
                      {/* 9px y no 8: el piso del sistema para la etiqueta mono es
                          9–10px y este sello se había quedado por debajo de su
                          propia regla. El relleno pasa al carmín de botón porque
                          lleva texto blanco encima. */}
                      {m.sello ? (
                        <span style={{marginLeft: "auto", flex: "none", padding: "3px 6px", background: "#FFF7F9", color: "#8A2249", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase"}}>{m.sello}</span>
                      ) : null}
                    </span>
                    {/* El gris tenue de papel da 2.6:1 sobre tinta, así que la
                        descripción no puede llevar un color fijo: se apoya en
                        `currentColor` y la baja de intensidad la pone el CSS, con un
                        gris para cada fondo. */}
                    <span data-desc="" style={{display: "block", fontSize: "12.5px", lineHeight: 1.55}}>{t(m.desc)}</span>
                  </button>
    </Fragment>
    ))}
                </div>

                {/* El aviso va antes de los campos: si manda a capturar algo,
                    tiene que verse antes de lo que hay que capturar. */}
                {loteError ? (
    <Fragment>
                <p style={{margin: "0 0 16px", padding: "12px 14px", borderLeft: "1px solid " + (loteErrorTipo === 'info' ? "#B7BABB" : "#F4DA40"), background: loteErrorTipo === 'info' ? "#F7F5F2" : "#FEFCEC", fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>{loteError}</p>
    </Fragment>
    ) : null}

                {loteModo === 'trazar' ? (
    <Fragment>
                {/* El trazador, empotrado. Sin caja, sin título propio y sin
                    marco visible: dentro de esta tarjeta no es "otra
                    herramienta", es lo que hay que hacer en este paso. */}
                <TrazadorLote onListo={aplicarLoteTrazado} onCambio={subirVentana} />
    </Fragment>
    ) : null}

                {loteModo === 'medidas' ? (
    <Fragment>
                {/* La ciudad va PRIMERO, antes que las medidas: es la que
                    decide los retiros, y con ellos el número grande del
                    tablero de abajo. Preguntarla después haría que ese número
                    se moviera solo después de haberlo enseñado.
                    Es la misma pregunta y la misma tabla que usa el trazador —
                    antes este camino aplicaba una mediana fija y los dos
                    caminos daban áreas distintas para el mismo terreno. */}
                <p style={{margin: "0 0 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{t('¿En qué ciudad está tu lote?')}</p>
                {/* Menú y no la fila de chips de antes: con cuatro ciudades
                    cabían en un renglón, con seis se envuelven en dos y la
                    pregunta deja de leerse de un vistazo. La lista es la misma
                    `OPCIONES_CIUDAD` de siempre — no se toca ni el dato ni a
                    quién se le avisa, solo cómo se ve. */}
                <SelectorCiudad opciones={OPCIONES_CIUDAD} valor={ciudadId} onElegir={setCiudadId} />

                <div style={{display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end"}}>
                  <label style={{flex: "1 1 120px"}}>
                    <span style={{display: "block", marginBottom: "6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{t('Frente (ft)')}</span>
                    <input value={loteFrente} onChange={(e) => setLoteFrente(e.target.value)} inputMode="decimal" placeholder="60" style={{width: "100%", padding: "11px 12px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "15px", color: "#1C1E1F"}} />
                  </label>
                  <label style={{flex: "1 1 120px"}}>
                    <span style={{display: "block", marginBottom: "6px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{t('Fondo (ft)')}</span>
                    <input value={loteFondo} onChange={(e) => setLoteFondo(e.target.value)} inputMode="decimal" placeholder="120" style={{width: "100%", padding: "11px 12px", border: "1px solid #E4E1DD", background: "#fff", fontFamily: "Archivo, sans-serif", fontSize: "15px", color: "#1C1E1F"}} />
                  </label>
                </div>

                {/* El tablero: todo lo que hay de aquí para abajo es lectura,
                    no captura. Los retiros dejaron de ser campos —eran tres
                    cajas de texto que parecían pedir algo y que casi nadie
                    tiene a la mano— y pasaron a ser parte del indicador: se
                    muestran como el supuesto con el que están hechas las
                    cuentas. Los únicos dos campos escribibles del bloque son
                    frente y fondo, arriba. */}
                {previaMedidas ? (
    <Fragment>
                {/* 680px y no 560: con el dibujo al doble (400px) el tope
                    viejo se quedó chico — 400 + su hueco + las dos cifras ya
                    no cabían adentro por más ancha que estuviera la pantalla,
                    así que la fila se caía a dos renglones SIEMPRE, sin
                    importar la ventana. El tablero necesitaba más aire, no la
                    ventana: por eso ensancharla a 1000px en la prueba no
                    cambiaba nada. */}
                <div style={{maxWidth: "800px", marginTop: "18px", background: "#FBFBFA", border: "1px solid #EAE7E3"}}>
                  <div style={{display: "flex", gap: "18px", alignItems: "center", flexWrap: "wrap", padding: "16px"}}>
                    {/* Las cifras van a la IZQUIERDA y el dibujo a la derecha.
                        Van primero también en el orden del documento, así que
                        un lector de pantalla las oye antes que el dibujo, que
                        es lo que corresponde: el número es la respuesta y el
                        dibujo la explica.

                        Piden 120px y no crecen (`0 1 120px`): apretadas contra
                        el margen para que todo el sobrante se lo quede el
                        dibujo. Si esta columna creciera se repartirían el ancho
                        a medias y el plano nunca llegaría a su tamaño. */}
                    <div style={{flex: "0 1 120px", display: "grid", gap: "12px"}}>
                      {/* Dos cifras, no tres. El envolvente que dejan los
                          retiros ("hasta aquí te deja el municipio") es un
                          paso intermedio de la cuenta, no una respuesta: el
                          cliente quiere saber cuánto terreno tiene y cuánta
                          casa le cabe. Se fue adentro de "Cómo salen estos
                          números", que es justo donde vive la cuenta.

                          Ojo con el `sub` de la tercera: decía "82 % de lo
                          anterior" y "lo anterior" era la cifra que se acaba
                          de quitar — se habría quedado apuntando al área del
                          lote, y 2,296 NO es el 82 % de 4,750. Ahora se
                          nombra a sí mismo. */}
                      {/* Rótulos cortos, a propósito. En una columna de 120px
                          "Lo que de verdad se desplanta" se partía en tres
                          renglones y empujaba la cifra hacia abajo; el subtítulo
                          largo hacía lo mismo. Dicen lo mismo en menos: el
                          espacio que sueltan se lo lleva el plano. */}
                      {([
                        { k: t('Lote'), ft2: previaMedidas.areaLote, sub: `${previaMedidas.frente}′ × ${previaMedidas.fondo}′`, color: '#1C1E1F' },
                        { k: t('Zona construible'), ft2: previaMedidas.desplantado, sub: `${Math.round(OCUPACION.tipica * 100)} ${t('% de lo permitido')}`, color: '#8A2249' },
                      ]).map((d) => (
    <Fragment key={d.k}>
                      <div>
                        <p style={{margin: "0 0 3px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>{d.k}</p>
                        <p style={{margin: "0 0 2px", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: "22px", letterSpacing: "-0.01em", color: d.color}}>
                          {d.ft2.toLocaleString('es-MX')} <span style={{fontSize: "13px", fontWeight: 400, color: "#5C6163"}}>ft²</span>
                        </p>
                        <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", color: "#5C6163"}}>{d.sub}</p>
                      </div>
    </Fragment>
    ))}
                    </div>
                    <RetirosDiagrama frente={previaMedidas.frente} fondo={previaMedidas.fondo} retiros={retiros} coberturaMax={coberturaMax} />
                  </div>
                  {/* Aquí vivía el plegable "Cómo salen estos números" — el
                      vínculo entre los retiros y la cifra final, la fuente de
                      la ordenanza con su salvedad, la nota de que el plat
                      manda sobre ella, el tope de cobertura cuando aplica, y
                      por qué se cuenta con 82 % y no con 100 %. Se quitó por
                      decisión del cliente. Los pies de retiro siguen rotulados
                      sobre el dibujo de al lado — lo único que se pierde es la
                      fuente de la ordenanza y esas salvedades, que ya no
                      quedan escritas en ningún otro lugar de esta pantalla. */}
                </div>
    </Fragment>
    ) : null}

                {/* El botón va después de la previa: primero ve lo que le va a
                    quedar, y entonces lo confirma. */}
                {/* Cierra el paso del lote igual que "Siguiente" cierra los demás, así
                    que va en el mismo registro carmín que el resto del
                    recorrido — era el último botón del tutorial que seguía en
                    tinta escrita a mano. */}
                <button onClick={aplicarMedidasManuales} className={'lgp-hover-zoom lgp-btn lgp-btn-carmin' + claseLuz('usarMedidas')} style={{marginTop: "18px", minHeight: "44px", padding: "0 22px", letterSpacing: "0.16em"}}>{t('Usar estas medidas')}</button>
    </Fragment>
    ) : null}

                {/* Acuses de recibo. Van fuera de las pestañas para que sigan
                    visibles aunque el usuario cambie de modo o falle el análisis. */}
                {loteFile ? (
    <Fragment>
                <div style={{display: "flex", alignItems: "center", gap: "13px", marginTop: "16px", padding: "12px 14px", background: "#F4FBF6", border: "1px solid #CFE8D8"}}>
                  <span style={{flex: "none", width: "44px", height: "44px", overflow: "hidden", background: "#fff", border: "1px solid #EAE7E3", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    {loteFile.mime.startsWith('image/') ? (
    <Fragment>
    <img src={loteFile.dataUrl} alt={loteFile.nombre} style={{width: "100%", height: "100%", objectFit: "cover", display: "block"}} />
    </Fragment>
    ) : (
    <Fragment>
    <span style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", fontWeight: 700, color: "#5C6163"}}>PDF</span>
    </Fragment>
    )}
                  </span>
                  <span style={{flex: 1, minWidth: 0}}>
                    <span style={{display: "block", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: "13px", color: "#1C1E1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>✓ {loteFile.nombre}</span>
                    <span style={{display: "block", marginTop: "2px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#6B8F79", textTransform: "uppercase"}}>Archivo cargado · {pesoLegible(loteFile.peso)}</span>
                  </span>
                  <button onClick={() => { setLoteFile(null); setLoteError(null); }} style={{flex: "none", padding: "7px 11px", background: "transparent", border: "1px solid #CFE8D8", color: "#6B8F79", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer"}}>Quitar</button>
                </div>
    </Fragment>
    ) : null}

                {loteUbicacion ? (
    <Fragment>
                <div style={{marginTop: "12px", padding: "12px 14px", background: "#F4FBF6", border: "1px solid #CFE8D8"}}>
                  <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px"}}>
                    <span style={{flex: 1, minWidth: 0}}>
                      <span style={{display: "block", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#6B8F79", textTransform: "uppercase"}}>✓ Ubicación capturada</span>
                      <span style={{display: "block", marginTop: "4px", fontSize: "13px", lineHeight: 1.5, color: "#1C1E1F"}}>
                        {[loteUbicacion.direccion, loteUbicacion.coordenadas].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <button onClick={() => setLoteUbicacion(null)} style={{flex: "none", padding: "7px 11px", background: "transparent", border: "1px solid #CFE8D8", color: "#6B8F79", fontFamily: "Archivo, sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer"}}>Quitar</button>
                  </div>
                </div>
    </Fragment>
    ) : null}
    </Fragment>
    )}
              </div>
            </div>
          
    </Fragment>
    ) : null}

          {esPaso1 ? (
    <Fragment>

            <div>
              {planFijo ? (
    <Fragment>
              <p
                title={`El lote ${loteId} se entrega con la casa ya diseñada y aprobada por la subdivisión, así que ni el floorplan ni la fachada se cambian. Lo que sí personalizas es el interior y las áreas que quepan en el presupuesto — por eso tu recorrido son ${totalPasos} pasos y no ${PASO_NOMBRES.length}.`}
                style={{margin: "0 0 18px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E7375", cursor: "help"}}
              >
                {loteId} · {t('plano y fachada los fija la subdivisión')}
              </p>
    </Fragment>
    ) : null}

              {/* Ningún plano entra. Es el único callejón real del paso 1, y
                  tiene una sola salida honesta: otro terreno. Se dice con el
                  número de frente que haría falta —dato que el cliente puede
                  usar hoy mismo— y con el atajo para volver a capturar el lote,
                  porque muchas veces el terreno es más grande de lo que se
                  escribió. */}
              {ningunPlanoCabe ? (
    <Fragment>
              <div style={{marginBottom: "22px", padding: "15px 17px", background: "#FFF7F9", borderLeft: "2px solid #F2004B", maxWidth: "620px"}}>
                <p style={{margin: "0 0 7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#8A2249", textTransform: "uppercase"}}>{t('Ninguno de los planos cabe')}</p>
                {/* Cada tipo contra SU propio techo. Enseñar los dos máximos y
                    luego "el más chico pide 1,575" invita a concluir que ese
                    cabría en las dos plantas — y no, ese plano es de una. */}
                <ul style={{margin: "0 0 12px", paddingLeft: "17px"}}>
                  {[1, 2].map((pisos) => {
                    const delTipo = planesVista.filter((p) => p.pisos === pisos);
                    if (!delTipo.length) return null;
                    // Lo que pide cada tipo es la casa más chica que puede
                    // producir —una recámara y un baño más su idea—, no el
                    // tamaño de un plano de fábrica que ya no existe.
                    const pide = (k: string) => minimoDelPlan(k);
                    const menor = delTipo.reduce((a, b) => (pide(a.key) <= pide(b.key) ? a : b));
                    return (
                      <li key={pisos} style={{fontSize: "13px", lineHeight: 1.6, color: "#5C6163"}}>
                        De <strong style={{fontWeight: 700, color: "#1C1E1F"}}>{pisos === 1 ? 'una planta' : 'dos plantas'}</strong> tu lote da hasta{' '}
                        {maxLivingPara(pisos, menor.key).toLocaleString('es-MX')} ft² habitables, y la casa más chica ({menor.nombre}) pide{' '}
                        {pide(menor.key).toLocaleString('es-MX')}.
                      </li>
                    );
                  })}
                </ul>
                <p style={{margin: "0 0 12px", fontSize: "13px", lineHeight: 1.6, color: "#5C6163"}}>
                  No se pueden encoger: son planos ya construidos. Revisa las medidas de tu terreno —o platícalo con el
                  arquitecto, que puede dibujarte uno a la medida.
                </p>
                <button onClick={() => setPaso(PREVIA)} className="lgp-hover-zoom lgp-btn lgp-btn-fantasma" style={{padding: "0 16px"}}>{t('Revisar mi lote')}</button>
              </div>
    </Fragment>
              ) : null}

              <PasoDecision
                opciones={planesDecision}
                onVista={setPlanEnVista}
                carrusel
                acuseEscuadras
                etiquetaOtras={planFijo ? t('Plano de este lote') : t('Planos disponibles')}
                accionPrimaria={t('Elegir este plano')}
              />

            </div>

    </Fragment>
    ) : null}

          {esPaso2 ? (
    <Fragment>

            <div>
              <p style={{margin: "0 0 26px", maxWidth: "560px", fontSize: "16px", lineHeight: "1.6", color: "#505759"}}>{t('Fachada de la casa')}</p>
              {/* En carrusel y no en lista, por lo mismo que el floorplan: lo
                  que decide una fachada es verla grande, no leer su nombre en
                  un renglón. En lista, la maqueta cabía en 380px y a su derecha
                  quedaba media pantalla vacía — el peor reparto posible para el
                  paso donde el cliente está eligiendo cómo se va a ver su casa
                  desde la calle.

                  Se va `exclusivo` con la lista: sin filas no hay nada que
                  bloquear, y el "solo puedes llevar una" ahora lo dice el propio
                  carrusel, que enseña una a la vez y trae su botón de quitar. */}
              <PasoDecision
                opciones={fachadasDecision}
                carrusel
                acuseEscuadras
                etiquetaOtras={t('Fachadas disponibles')}
                accionPrimaria={t('Elegir esta fachada')}
                pieza="fachada"
                etiquetaElegido="Fachada elegida"
              />
            </div>
          
    </Fragment>
    ) : null}

          {esPaso3 ? (
    <Fragment>

            <div className={guiaLibre ? '' : 'lgp-paso4-guiado'}>
              {/* Aquí vivían la pista rosa de la guía ("Empieza por la paleta de
                  interior…", con su contador "1 de 3") y el encabezado "Paleta
                  de interior" con su línea de apoyo. Se quitaron por decisión
                  del cliente: tres textos antes de la primera fila empujaban las
                  paletas fuera de la pantalla, y la decisión se explica sola.

                  La pista NO se borró del código: `pistaGuia` sigue siendo lo
                  que dice el aviso de por qué "Siguiente" está apagado. Esa
                  explicación es obligatoria en este proyecto, y ahí es donde se
                  lee ahora, en el momento en que estorba — no antes.

                  En su lugar queda una sola línea, la salvedad de la maqueta: es
                  la misma cocina en las seis paletas y a ese tamaño se lee como
                  el diseño de SU cocina. No lo es — lo único que enseña es cómo
                  se ven juntos los acabados —, y sin este aviso el cliente llega
                  a la cita esperando esa cocina. Va arriba porque ahora es lo
                  único que se dice antes de elegir: el malentendido se evita
                  ANTES de ver las imágenes, no después de haberlas creído. */}
              {/* En negritas y en tinta, no en gris: ahora es lo único que se
                  dice antes de elegir, y en gris claro se leía como pie de
                  página — justo lo que nadie lee. Sigue en mono y a 10px para
                  no competir con los nombres de las paletas. */}
              <p style={{margin: "0 0 12px", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: "10px", lineHeight: 1.6, letterSpacing: "0.1em", color: "#1C1E1F", textTransform: "uppercase"}}>{t('Las cocinas son solo ejemplo para ver los colores')}</p>
              <div ref={refGama} className={claseGuia('gama')} style={{marginBottom: "34px"}}>
                <PasoDecision
                  opciones={gamasDecision}
                  etiquetaOtras={t('Paletas disponibles')}
                  exclusivo
                  lateral
                  acuseEscuadras
                />
              </div>

              <div ref={refCuartos} className={claseGuia('cuartos')} style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1px", background: "#EAE7E3", border: "1px solid #EAE7E3", marginBottom: "22px"}}>
                {contadores.map((c) => (
    <Fragment key={c.key}>
                <div style={{background: "#fff", padding: "16px 18px"}}>
                  <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px"}}>
                    <div>
                      {/* Cada contador con su glifo: la cama y el inodoro. */}
                      <p style={{margin: "0 0 3px", display: "flex", alignItems: "center", gap: "6px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase"}}>
                        {c.Icono ? <c.Icono size={20} color="#1C1E1F" /> : null}
                        {c.nombre}
                      </p>
                      {/* Un solo número: lo que de verdad le cuesta al
                          presupuesto agregar uno. El desglose —121 el cuarto,
                          18 el clóset, 46 de pasillos y muros— se probó aquí y
                          era ruido: quien va a apretar "+" solo necesita saber
                          cuánto se le va. */}
                      <p style={{margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.08em", color: "#6E7375", textTransform: "uppercase"}}>{c.living} ft² c/u</p>
                    </div>
                    <div style={{display: "flex", alignItems: "center", gap: "2px", flex: "none", position: "relative"}}>
                      {/* La burbuja cuelga del grupo de controles y no del "+"
                          para poder centrarse sobre él sin que un botón de
                          30px le recorte el rótulo. `key` con el contador es lo
                          que hace que la animación se relance si le pica otra
                          vez al mismo botón. */}
                      {noCabe && noCabe.donde === c.key ? (
                        <span key={noCabe.n} className="lgp-burbuja-no-cabe" role="status">{t('No cabe')}</span>
                      ) : null}
                      <button onClick={c.onMenos} disabled={c.menosDisabled} title={c.menosMotivo ?? undefined} style={{width: "30px", height: "30px", border: "1px solid #E4E1DD", background: "transparent", color: c.menosDisabled ? "#DDD9D4" : "#505759", fontSize: "15px", lineHeight: 1, cursor: c.menosDisabled ? "not-allowed" : "pointer"}}>−</button>
                      <span style={{minWidth: "38px", textAlign: "center", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "17px"}}>{c.total}</span>
                      <button onClick={c.onMas} disabled={c.masDisabled} aria-disabled={c.masDisabled || c.masNoCabe} title={c.masMotivo ?? undefined} key={noCabe && noCabe.donde === c.key ? 'x' + noCabe.n : 'ok'} className={noCabe && noCabe.donde === c.key ? 'lgp-no-cabe' : undefined} style={{width: "30px", height: "30px", border: "0", background: c.masDisabled ? "#F4F1ED" : "#F2004B", color: c.masDisabled ? "#B7BABB" : "#fff", fontSize: "15px", lineHeight: 1, cursor: c.masDisabled ? "not-allowed" : "pointer"}}>+</button>
                    </div>
                  </div>
                  {c.masMotivo ? (
    <Fragment>
                  <p style={{margin: "10px 0 0", fontSize: "11px", lineHeight: 1.5, color: "#6E7375"}}>{c.masMotivo}</p>
    </Fragment>
    ) : null}
                </div>
    </Fragment>
    ))}
              </div>

              {/* El plano ya trae recámaras y baños, así que sin un "listo" la
                  etapa se saltaría sola y el cliente nunca vería el contador. */}
              {etapaGuia === 'cuartos' ? (
    <Fragment>
              <button onClick={() => setTocadoCuartos(true)} className={BOTON_LISTO_CLASE + claseLuz('cuartos')} style={{...BOTON_LISTO, marginBottom: "26px"}}>
                {/* Un solo rótulo, y corto. Antes decía una cosa si el cliente
                    no había tocado nada ("Así están bien...") y otra si sí
                    ("Listo: 2 recámaras y 3 baños"): dos textos largos para un
                    botón que siempre hace lo mismo, y que además repetía la
                    cuenta que el contador de arriba ya trae en grande. */}
                {t('Listo')}
              </button>
    </Fragment>
    ) : null}

              <div ref={refZonas} className={claseGuia('zonas')}>
              <div style={{display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", marginBottom: "14px"}}>
                <div style={{display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap"}}>
                  <p style={{margin: "0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase"}}>{t('Áreas adicionales')}</p>
                  <span title={t('Área habitable disponible dentro del límite de tu lote, ya restando el floorplan, los cuartos extra y las zonas que llevas')} style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: ft2Rest > 0 ? "#8A2249" : "#6E7375", textTransform: "uppercase"}}>{ft2Rest} ft² habitables disponibles</span>
                </div>
                {/* El análisis del brief vive en el paso 5, después de que el
                    usuario ya armó sus zonas. Aquí no hay brief que analizar. */}
              </div>

              {/* Por defecto, el panel de zonas del prototipo: detalle a la
                  izquierda, lo que llevas a la derecha y la lista abajo. Quien
                  prefiera que le pregunten una por una tiene el otro modo. */}
              {verTodasZonas ? (
    <Fragment>
              <ZonasGuiadas mods={mods} ft2Rest={ft2Rest} verTodas={verTodasZonas} onVerTodas={setVerTodasZonas} liberar={liberarEspacio} />
    </Fragment>
    ) : (
    <Fragment>
              <ZonasPanel
                mods={mods}
                ft2Rest={ft2Rest}
                tragaluces={tragaluces}
                maxTragaluces={MAX_TRAGALUCES}
                orientacionHint={orientacionHint}
                onToggleTragaluz={toggleTragaluz}
                onVerGuiado={() => setVerTodasZonas(true)}
              />
    </Fragment>
    )}
              {/* Salida explícita de la última etapa: agregar zona no es
                  obligatorio, y sin este botón quien no quiere ninguna se
                  quedaba encerrado con el resto del paso apagado. */}
              {etapaGuia === 'zonas' ? (
    <Fragment>
              <button onClick={() => setTocadoZonas(true)} className={BOTON_LISTO_CLASE + claseLuz('zonas')} style={{...BOTON_LISTO, marginTop: "16px"}}>
                {/* El mismo rótulo corto que cierra la etapa de cuartos: los
                    dos botones hacen lo mismo —dar por vista una etapa de la
                    guía— y decirlo con dos frases distintas los hacía parecer
                    dos gestos distintos. */}
                {t('Listo')}
              </button>
    </Fragment>
    ) : null}
              </div>

            </div>

    </Fragment>
    ) : null}

          {esPaso4 ? (
    <Fragment>

            <div style={{maxWidth: "700px"}}>
              {/* LA CARPETA, en el cruce del paso 3 al 4: el cliente acaba de
                  armar la casa y lo PRIMERO que ve aquí es lo que armó, antes
                  de que se le pida nada. Vivía al final del paso 3, donde
                  competía con las decisiones que estaba tomando, y luego al
                  final de este paso, donde ya nadie la veía porque el brief se
                  lleva la atención. Desde que la lámina salió del recorrido es
                  el único resumen en pantalla; la lámina completa viaja por
                  correo (ver `/api/enviar-resumen`). */}
              <div style={{marginBottom: "34px"}}>
                <p style={{margin: "0 0 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#6E7375", textTransform: "uppercase"}}>{t('Tu casa, por ahora')}</p>
                <CarpetaHistorial
                  planKey={plan}
                  planNombre={planNombreSel}
                  loteForma={loteTrazado ? t('Lote irregular') : (lotePropio ? t('Lote regular') : t('Lote de la subdivisión'))}
                  loteArea={loteMedida}
                  direccion={direccionLote || loteUbicacion?.direccion || ''}
                  ft2Living={ft2LivingTotal}
                  ft2Total={ft2ConstruidoTotal}
                  recamaras={totalRec}
                  banos={totalBanos}
                  cajones={lote?.huella ? (conGarage ? cajones : 0) : 2}
                  fachadaKey={fachada}
                  fachadaNombre={fachadaTexto}
                  fachadaFija={fachadaFija}
                  fachadaImagen={fachadaFija ? (subdivisionActiva.imagenes.find((i) => i.tipo === 'render')?.src ?? null) : null}
                  interiorKey={interior}
                  interiorNombre={interiorSeleccionado ? interiorSeleccionado.nombre : 'Sin elegir'}
                  zonas={modulosSeleccionados}
                  tragaluces={tragaluces}
                />
              </div>

              {/* EL MISMO HUECO, DOS PREGUNTAS. El titular y el campo cambian
                  juntos al confirmar: primero el comentario, después la
                  dirección. Ver `briefConfirmado`.

                  Ninguna de las dos lleva ya texto de apoyo: el del comentario
                  ("tu combinación ya está completa…") y el de la dirección
                  ("es lo que le dice al arquitecto a dónde ir a verificar los
                  retiros…") se quitaron por decisión del cliente. Por eso el
                  titular carga él mismo la separación con el campo. */}
              <p style={{margin: "0 0 20px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em", textWrap: "pretty"}}>
                {pideDireccion ? t('Agrega la dirección de tu lote') : t('¿Algo en especial que gustes agregar o aclarar?')}
              </p>

              {pideDireccion ? (
    <Fragment>
              {/* LA DIRECCIÓN, en el lugar que dejó el comentario. Debajo queda
                  lo que escribió, con su atajo para volver: confirmar no es
                  cerrar con llave. */}
              <div className="lgp-guia-entra">
                <input
                  id="lgp-direccion"
                  className="lgp-campo"
                  value={direccionLote}
                  onChange={(e) => setDireccionLote(e.target.value)}
                  placeholder={t('Calle y número, o el cruce más cercano')}
                  style={{width: "100%", minHeight: "52px", padding: "14px 16px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px", color: "#1C1E1F"}}
                />
                <div style={{display: "flex", gap: "12px", justifyContent: "space-between", alignItems: "flex-start", marginTop: "14px", padding: "13px 15px", background: "#F7F5F2", borderLeft: "1px solid #E4E1DD"}}>
                  <span style={{fontSize: "13px", lineHeight: 1.6, color: "#505759"}}>
                    {brief.trim()
                      ? <Fragment><strong style={{fontWeight: 700}}>{t('Tu comentario:')}</strong> {brief.trim().length > 120 ? brief.trim().slice(0, 120) + '…' : brief.trim()}</Fragment>
                      : 'No dejaste comentarios para el arquitecto.'}
                  </span>
                  <button onClick={() => setBriefConfirmado(false)} style={{flex: "none", padding: "0", background: "transparent", border: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A2249", cursor: "pointer", textDecoration: "underline"}}>{t('Cambiar')}</button>
                </div>
              </div>
    </Fragment>
    ) : (
    <Fragment>
              {/* Si pidió el comodín room, aquí es donde dice para qué lo quiere. */}
              {modulos.includes('comodin') ? (
    <Fragment>
              <div style={{marginBottom: "18px", padding: "14px 16px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40"}}>
                <p style={{margin: "0 0 4px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#8A7A2A", textTransform: "uppercase"}}>{t('Elegiste un comodín room')}</p>
                <p style={{margin: 0, fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>
                  Es el cuarto que dejaste sin uso asignado. Cuéntanos aquí para qué lo quieres —gym, visitas, taller, estudio— y el arquitecto llega a la cita con esa idea ya leída.
                </p>
              </div>
    </Fragment>
    ) : null}

              <textarea className="lgp-campo" value={brief} onChange={onBrief} placeholder={t('El comodín room lo quiero como gym, con espejo de pared a pared. Y quisiera ver si la pérgola del patio se puede alargar hasta la cocina exterior…')} rows={5} style={{width: "100%", padding: "18px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "15px", lineHeight: "1.65", color: "#1C1E1F"}}></textarea>
              <div style={{display: "flex", justifyContent: "space-between", marginTop: "10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#6E7375", textTransform: "uppercase"}}>
                <span>{t('Opcional, pero cambia todo')}</span><span>{briefLen} {t('caracteres')}</span>
              </div>

              {/* El botón dice lo que hace en cada caso: confirmar lo escrito, o
                  seguir sin comentarios. Pedirle "confirmar" a un cuadro vacío
                  se siente como un trámite; así es una respuesta.

                  Va en el mismo registro que el resto del recorrido: magenta en
                  reposo y blanco al tocarlo. Conserva su ancho —hasta 320px, no
                  el de su texto— porque cierra el paso entero y no una etapa de
                  la guía dentro de él. `display: flex` en vez del `inline-flex`
                  de `.lgp-btn`, que es lo único que hace falta para que el
                  `width` siga mandando. */}
              <button onClick={() => setBriefConfirmado(true)} className={'lgp-hover-zoom lgp-btn lgp-btn-carmin' + claseLuz('confirmarBrief')} style={{display: "flex", width: "100%", maxWidth: "320px", minHeight: "48px", marginTop: "18px", letterSpacing: "0.16em"}}>
                {brief.trim() ? 'Confirmar' : 'No tengo comentarios'}
              </button>

              {/* Sin análisis por IA: el brief son comentarios para el
                  arquitecto, no una lista de compras que haya que interpretar.
                  Viaja tal cual en la ficha. */}
              <p style={{margin: "12px 0 0", fontSize: "12.5px", lineHeight: 1.6, color: "#6E7375"}}>
                {t('Lo que escribas viaja tal cual al arquitecto, con tus palabras. No lo resumimos ni lo interpretamos.')}
              </p>
    </Fragment>
    )}

              {!lote || !plan ? (
    <Fragment>
              <p style={{margin: "16px 0 0", padding: "12px 14px", background: "#F7F5F2", borderLeft: "1px solid #B7BABB", fontSize: "13px", lineHeight: 1.6, color: "#6B6E70"}}>
                Para analizar tu brief contra el espacio disponible necesitamos primero el lote y el floorplan.
              </p>
    </Fragment>
    ) : null}

            </div>

    </Fragment>
    ) : null}

          {/* TUS DATOS, el último paso. La lámina ya no se enseña aquí —
              el cliente acaba de verse la casa en la carpeta del brief— así
              que este paso es solo el trámite de dar el contacto y mandar. */}
          {esPaso5 ? (
    <Fragment>

            <div>
              {enviado ? (
    <Fragment>

                {/* Antes esta pantalla explicaba el seguimiento a 24h/72h/7
                    días — de más en el momento en que alguien solo quiere
                    saber que sí se mandó. Ese detalle vive en el correo real
                    que le llega al arquitecto, no hace falta repetirlo aquí. */}
                <div className="lgp-acuse" style={{maxWidth: "420px", padding: "40px 34px", border: "1px solid #EAE7E3", background: "#FBFBFA", textAlign: "center"}}>
                  {/* El check se dibuja: era el carácter "✓" de la tipografía,
                      que ni es un icono del sistema ni se puede trazar. Ahora
                      es SVG y el trazo se traza — que es lo que hace que se
                      lea como "acaba de pasar" y no como "siempre estuvo". */}
                  <span style={{display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", margin: "0 auto 18px", borderRadius: "50%", background: "#F2004B"}}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
                      <path
                        className="lgp-acuse-trazo"
                        style={{['--largo' as string]: 21}}
                        d="M5 12.5 L10 17.5 L19 7.5"
                        stroke="#fff"
                        strokeWidth="2.4"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                  </span>
                  <p style={{margin: "0 0 26px", fontSize: "clamp(18px,2.1vw,22px)", lineHeight: "1.4", letterSpacing: "-0.01em"}}>{t('Se ha enviado con éxito.')}</p>
                  {/* Cerrar no convierte: es tinta, no carmín. */}
                  <button onClick={cerrarTrasEnviar} className="lgp-hover-zoom lgp-btn lgp-btn-tinta" style={{padding: "0 26px", letterSpacing: "0.16em"}}>{t('Cerrar')}</button>
                </div>

    </Fragment>
    ) : null}
              {noEnviado ? (
    <Fragment>

                <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "30px", maxWidth: "820px"}}>
                  <div>
                    {/* El titular carga solo: la línea de apoyo ("tus datos van
                        directo al arquitecto… nada de call centers") se quitó
                        por decisión del cliente, y el margen que llevaba pasa
                        aquí para que los campos no queden pegados. */}
                    <p style={{margin: "0 0 26px", fontSize: "clamp(19px,2.2vw,25px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>{t('Envíanos tu propuesta')}</p>
                    <div style={{display: "grid", gap: "14px"}}>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>{t('Nombre completo')}</span>
                        <input className="lgp-campo" value={leadNombre} onChange={onNombre} autoComplete="name" placeholder="María Elena Cavazos" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px"}} />
                      </label>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>{t('Correo')}</span>
                        <input className="lgp-campo" value={leadCorreo} onChange={onCorreo} type="email" inputMode="email" autoComplete="email" placeholder={t('maria@correo.com')} style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px"}} />
                      </label>
                      <label style={{display: "block"}}>
                        <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>{t('Teléfono')}</span>
                        <input className="lgp-campo" value={leadTel} onChange={onTel} type="tel" inputMode="tel" autoComplete="tel" placeholder={t('Tu número')} style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#FBFBFA", fontSize: "16px"}} />
                      </label>
                    </div>
                  </div>

                  <div>
                    {/* Aquí iba el párrafo de qué recibe el arquitecto al enviar
                        (la ficha completa, el croquis, las zonas, la petición).
                        Se quitó por decisión del cliente. */}
                    <button onClick={enviar} disabled={enviando} className="lgp-hover-zoom" style={{padding: "14px 20px", background: enviando ? "#F4F1ED" : "#F2004B", color: enviando ? "#B7BABB" : "#fff", border: "0", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "700", letterSpacing: "0.16em", textTransform: "uppercase", cursor: enviando ? "wait" : "pointer"}}>
                      {enviando ? t('Enviando...') : t('Enviar')}
                    </button>
                    {envioError ? (
    <Fragment>
                    <div style={{marginTop: "14px", padding: "13px 15px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40"}}>
                      <p style={{margin: "0 0 10px", fontSize: "13px", lineHeight: "1.6", color: "#505759"}}>{envioError}</p>
                      <button onClick={irACita} style={{padding: "8px 13px", background: "#fff", border: "1px solid #E4E1DD", color: "#505759", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer"}}>{t('Agendar mi cita')}</button>
                    </div>
    </Fragment>
    ) : null}
                  </div>
                </div>

    </Fragment>
    ) : null}
            </div>

    </Fragment>
    ) : null}

          <div className="lgp-step-actions" style={{display: "flex", alignItems: "center", gap: "10px", marginTop: "40px", paddingTop: "22px", borderTop: "1px solid #F0EDE9"}}>
            <button onClick={atras} className="lgp-hover-zoom lgp-btn lgp-btn-carmin" style={{minHeight: "44px", padding: "0 17px", letterSpacing: "0.16em"}}>{t('← Atrás')}</button>
            {/* En el último paso este botón se veía activo pero tocarlo no
                llevaba a ningún lado — `siguiente()` recalculaba el mismo
                paso en el que ya estabas.

                Bloqueado no va en carmín: el magenta dice "apriétame" y este
                botón hoy no se puede apretar. Se queda en el gris apagado de
                siempre, que es lo único que sabe decir "todavía no".
                Habilitado va como sus dos hermanos del tutorial. */}
            {esPaso5 ? null : (
            <button onClick={siguiente} disabled={siguienteBloqueado} title={siguienteBloqueado ? razonBloqueo ?? undefined : undefined} className={'lgp-hover-zoom lgp-btn' + (siguienteBloqueado ? '' : ' lgp-btn-carmin') + (siguienteEsElPaso ? ' lgp-guia-luz' : '')} style={{minHeight: "44px", padding: "0 17px", letterSpacing: "0.16em", ...(siguienteBloqueado ? {background: "#F4F1ED", borderColor: "#F4F1ED", color: "#6E7375", cursor: "not-allowed"} : {})}}>{t('Siguiente →')}</button>
            )}
            {/* La misma esquina dice dos cosas según el momento: con el paso
                resuelto, la pista de siempre; con "Siguiente" apagado, qué
                falta para encenderlo. Sin esto —y sin el recuadro amarillo que
                vivía abajo— el botón se quedaba apagado sin decir por qué, que
                es lo único que este proyecto no hace. En carmín para que se
                lea como un aviso y no como la nota de pie. */}
            <span style={{marginLeft: "auto", maxWidth: "46ch", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", lineHeight: 1.5, letterSpacing: "0.1em", color: siguienteBloqueado && razonBloqueo ? "#8A2249" : "#6E7375", textTransform: "uppercase"}}>{siguienteBloqueado && razonBloqueo ? razonBloqueo : pasoHint}</span>
          </div>

          {/* Aquí vivía el recuadro amarillo "Falta por definir", con un botón
              de atajo por cada cosa pendiente. Se quitó por decisión del
              cliente: relleno.

              La regla de "nada bloqueado sin explicación" se sigue cumpliendo
              en la línea de al lado del botón, que mientras "Siguiente" está
              apagado dice qué falta (ver `pasoHint` abajo), y en el globo del
              propio botón. Lo que se pierde es el atajo de un clic al paso
              donde se resuelve; el riel de pasos de arriba lleva al mismo
              sitio. */}
        </div>
      </VentanaEnfocada>



      {/* El FAQ conserva su columna angosta —760px es medida de lectura, no
          capricho— pero deja de ir centrado en la página: ahora arranca en el
          mismo borde izquierdo que todo lo de arriba. Centrado, era el único
          bloque de la página cuyo margen izquierdo no coincidía con ninguno. */}
      <section id="faq" data-screen-label="FAQ" style={{position: "relative", padding: "var(--lgp-y-tema) var(--lgp-canal) var(--lgp-y-cierre)", background: "rgba(255,255,255,0.68)", borderTop: "1px solid #F0EDE9"}}>
        <div data-nofx="1" className="lgp-contenedor">
          <div style={{maxWidth: "760px"}}>
          <h2 style={{margin: "0 0 30px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase"}}>{t('Preguntas frecuentes')}</h2>
          <div style={{borderTop: "1px solid #EFECE8"}}>
            {faqs.map((f, _i) => (
    <Fragment key={_i}>

              <div style={{borderBottom: "1px solid #EFECE8"}}>
                {/* Sale `.lgp-hover-zoom` y entra el cambio de fondo: escalar
                    una fila de ancho completo mueve el texto de la pregunta
                    justo mientras se está leyendo. Es regla del sistema. */}
                <button onClick={f.onToggle} aria-expanded={f.open} className="lgp-faq-fila" style={{display: "flex", alignItems: "center", gap: "14px", width: "100%", padding: "17px 4px", background: "transparent", border: "0", textAlign: "left", cursor: "pointer"}}>
                  <span className="lgp-faq-glifo" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: "#F2004B", flex: "none", width: "12px"}}>{f.icon}</span>
                  <span style={{fontSize: "15px", lineHeight: "1.5", color: "#1C1E1F"}}>{t(f.q)}</span>
                </button>
                {f.open ? (
    <Fragment>

                  <p className="lgp-faq-respuesta" style={{margin: "0", padding: "0 4px 22px 30px", maxWidth: "600px", fontSize: "14px", lineHeight: "1.7", color: "#5C6163"}}>{t(f.a)}</p>
                
    </Fragment>
    ) : null}
              </div>
            
    </Fragment>
    ))}
          </div>
          </div>
        </div>
      </section>

      {/* Contacto sí va centrado a propósito: es el cierre de la página, y un
          bloque centrado la remata en vez de dejarla colgando a la izquierda.
          Al estar centrado dentro del mismo eje, no rompe la retícula. */}
      <section id="contacto" data-screen-label="Contacto" style={{position: "relative", padding: "var(--lgp-y-tema) var(--lgp-canal) 0", overflow: "hidden"}}>
        <div data-nofx="1" style={{maxWidth: "660px", margin: "0 auto", textAlign: "center"}}>
          <p style={{margin: "0 0 26px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.16em", color: "#6E7375", textTransform: "uppercase"}}>{t('Contacto')}</p>
          <p style={{margin: "0 0 40px", fontSize: "clamp(20px,2.5vw,30px)", lineHeight: "1.34", letterSpacing: "-0.014em", textWrap: "pretty"}}>{t('Trae tus ideas y nos encargamos de materializarlas.')}</p>
          {citaEnviada ? (
    <Fragment>

          <div style={{maxWidth: "460px", margin: "0 auto", padding: "30px 28px", border: "1px solid #EAE7E3", background: "#fff", textAlign: "left"}}>
            <p style={{margin: "0 0 10px", fontFamily: "Archivo, sans-serif", fontWeight: "800", fontSize: "11px", letterSpacing: "0.18em", color: "#8A2249", textTransform: "uppercase"}}>{t('Cita solicitada')}</p>
            <p style={{margin: "0 0 14px", fontSize: "clamp(18px,2.1vw,23px)", lineHeight: "1.35", letterSpacing: "-0.01em"}}>Listo, {leadPrimerNombre}. Te buscamos en menos de 24 horas.</p>
            <p style={{margin: "0", fontSize: "15px", lineHeight: "1.65", color: "#505759"}}>{configCompleta ? 'El arquitecto llega a la llamada con tu configuración ya revisada.' : 'Si mientras tanto quieres adelantar, arma tu casa en el configurador y llegamos con algo concreto que enseñarte.'}</p>
            {configCompleta ? null : (
    <Fragment>
            <p style={{margin: "16px 0 0"}}><a href="#personaliza" style={{fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.1em", color: "#5C6163", textTransform: "uppercase", borderBottom: "1px solid #E4E1DD"}}>{t('Personalizar mi casa ↗')}</a></p>
    </Fragment>
    )}
          </div>

    </Fragment>
    ) : (
    <Fragment>

          <div style={{maxWidth: "460px", margin: "0 auto", textAlign: "left"}}>
            <div style={{display: "grid", gap: "14px"}}>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>{t('Nombre completo')}</span>
                <input className="lgp-campo" ref={citaNombreRef} value={leadNombre} onChange={onNombre} placeholder="María Elena Cavazos" style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px"}} />
              </label>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>{t('Correo')}</span>
                <input className="lgp-campo" type="email" inputMode="email" autoComplete="email" value={leadCorreo} onChange={onCorreo} placeholder={t('maria@correo.com')} style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px"}} />
              </label>
              <label style={{display: "block"}}>
                <span style={{display: "block", marginBottom: "7px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#5C6163", textTransform: "uppercase"}}>{t('Teléfono')}</span>
                <input className="lgp-campo" type="tel" inputMode="tel" autoComplete="tel" value={leadTel} onChange={onTel} placeholder={t('Tu número')} style={{width: "100%", padding: "13px 14px", border: "1px solid #DDD9D4", background: "#fff", fontSize: "16px"}} />
              </label>
            </div>
            {citaError ? (
    <Fragment>
            <p style={{margin: "14px 0 0", padding: "11px 13px", background: "#FEFCEC", borderLeft: "1px solid #F4DA40", fontSize: "13px", lineHeight: "1.5", color: "#505759"}}>{citaError}</p>
    </Fragment>
    ) : null}
            {/* El botón que convierte. Era el único de la página sin ninguna
                reacción al cursor — justo el más importante. Mientras envía no
                invierte: un botón en espera no debe ofrecer feedback de que se
                puede volver a pulsar. */}
            <button
              onClick={agendarCita}
              disabled={citaEnviando}
              className={`lgp-hover-zoom lgp-btn${citaEnviando ? '' : ' lgp-btn-carmin'}`}
              style={{width: "100%", marginTop: "18px", minHeight: "50px", letterSpacing: "0.16em", ...(citaEnviando ? {background: "#F4F1ED", borderColor: "#EAE7E3", color: "#6E7375", cursor: "wait"} : null)}}
            >
              {citaEnviando ? t('Enviando…') : t('Agendar mi cita →')}
            </button>
            <p style={{margin: "12px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", lineHeight: "1.6", letterSpacing: "0.08em", color: "#6E7375", textTransform: "uppercase"}}>{t('Con el correo o el teléfono basta')}</p>
          </div>

    </Fragment>
    )}
          {/* WhatsApp es la vía alterna, no la principal. Antes era una barra
              a todo lo ancho en fantasma, del mismo tamaño que "Agendar mi
              cita": dos bloques iguales uno encima del otro, y el ojo tenía que
              leer los dos para saber cuál era el que convertía. Ahora es una
              burbuja — el logo solo, sin texto, porque este es de los pocos
              iconos que el mundo entero ya sabe leer.

              El verde de marca no compite con el carmín: la jerarquía la carga
              el tamaño, y 54px contra una barra de 460 no dejan lugar a dudas
              de cuál es el camino principal. Un logo de WhatsApp en gris, en
              cambio, deja de leerse como WhatsApp y se vuelve un icono
              cualquiera — justo lo que no puede pasar cuando el texto se fue.

              Se dibuja también cuando la cita ya salió — quien quiere preguntar
              algo más no tiene por qué volver al formulario. */}
          {WA_HREF || WA_PENDIENTE ? (
    <Fragment>

          <div style={{display: "flex", flexDirection: "column", alignItems: "center", margin: "26px auto 0"}}>
            {/* Sin texto visible, el nombre lo cargan `aria-label` y `title`:
                para un lector de pantalla el enlace tiene que seguir diciendo a
                dónde va, y para quien duda, el cursor lo resuelve sin clic. */}
            <a
              href={WA_HREF ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={WA_HREF ? undefined : true}
              aria-label={t('Escríbenos por WhatsApp')}
              title={WA_HREF ? t('Escríbenos por WhatsApp') : t('Sin número configurado')}
              className={`lgp-wa-burbuja${WA_HREF ? ' lgp-hover-zoom' : ' lgp-wa-burbuja-pendiente'}`}
            >
              <WhatsappGlifo tam={26} />
            </a>
            <p style={{margin: "11px 0 0", maxWidth: "300px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", lineHeight: "1.6", letterSpacing: "0.08em", color: "#6E7375", textTransform: "uppercase", textAlign: "center"}}>
              {WA_HREF ? t('Respuesta directa, sin formulario') : 'Sin número: define NEXT_PUBLIC_LGP_WHATSAPP. Solo se ve en desarrollo'}
            </p>
          </div>

    </Fragment>
    ) : null}
          {/* Los 16px de alto de estos enlaces eran el objetivo más chico de la
              página. Con el correo —y el WhatsApp, cuando haya número— siendo
              las vías de contacto reales, tienen que poderse tocar. */}
          <div style={{display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "10px 26px", marginTop: "46px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.08em", color: "#5C6163"}}>
            <a href="mailto:contact@lagranpiedrallc.com" style={{display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 4px"}}>CONTACT@LAGRANPIEDRALLC.COM</a>
            {/* El teléfono va marcable: en un teléfono, un número que no se
                puede tocar obliga a copiarlo a mano, y esa es la vía de
                contacto más directa que tiene el negocio. */}
            <a href={`tel:+${TELEFONO_E164}`} style={{display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 4px"}}>{TELEFONO}</a>
            <span style={{display: "inline-flex", alignItems: "center", minHeight: "44px"}}>EDINBURG, TX</span>
          </div>
          <p style={{margin: "30px 0 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#6E7375"}}>{t('LA GRAN PIEDRA LLC · TX BUILDER · © 2026')}</p>
        </div>
        {/* La máscara que hunde el nombre en el papel ya estaba aquí; lo que
            faltaba era usarla. Al llegar al pie, las dos líneas suben desde
            dentro de ella: el nombre sale del papel en vez de encenderse
            encima. Es el cierre del recorrido que abre el telón. */}
        <div ref={observarRazon} className="lgp-firma" style={{marginTop: "70px", lineHeight: "0.78", textAlign: "center", maskImage: "linear-gradient(#000 34%, transparent 92%)", WebkitMaskImage: "linear-gradient(#000 34%, transparent 92%)"}}>
          <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "900", fontSize: "clamp(56px,13.4vw,220px)", letterSpacing: "-0.045em", color: "#F2004B", whiteSpace: "nowrap"}}>LA GRAN</div>
          <div style={{fontFamily: "Archivo, sans-serif", fontWeight: "900", fontSize: "clamp(56px,13.4vw,220px)", letterSpacing: "-0.045em", color: "#F2004B", whiteSpace: "nowrap"}}>PIEDRA</div>
        </div>
      </section>

      <div data-nofx="1" className="lgp-bottom-nav-wrap" style={{position: "fixed", bottom: "0", left: "0", right: "0", zIndex: "60", display: "flex", justifyContent: "center", padding: "14px 22px calc(18px + env(safe-area-inset-bottom))", pointerEvents: "none"}}>
        {/* El relleno vertical se fue del contenedor a cada enlace: la barra
            medía 15px de alto y era la navegación principal en móvil, a un
            tercio del objetivo táctil de 44px que el sistema exige. */}
        <div className="lgp-bottom-nav" style={{display: "flex", gap: "4px", padding: "0 8px", background: "#FBFBFA", boxShadow: "0 1px 0 rgba(28,30,31,0.06) inset, 0 6px 22px rgba(28,30,31,0.14)", pointerEvents: "auto"}}>
          {nav.map((n, _i) => (
    <Fragment key={_i}>

            <a href={n.href} className="lgp-hover-zoom" style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", minHeight: "44px", padding: "0 12px", fontFamily: "Archivo, sans-serif", fontSize: "10px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: n.color}}>
              <span style={{width: "5px", height: "5px", display: "block", flex: "none", background: n.dot}}></span>{t(n.label)}
            </a>

    </Fragment>
    ))}
        </div>
      </div>

    </div>
  );
}
