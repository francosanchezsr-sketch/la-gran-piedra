import type { ReactElement, ReactNode } from 'react';

type IconProps = {
  size?: number | string;
  color?: string;
};

const base = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// Badge sólido (squircle negro + glifo blanco) — usado por los iconos de
// zona "rellenos" que reemplazan a los de línea para ciertos módulos.
function Squircle({ size = 26, color = '#1C1E1F', children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect x="1" y="1" width="22" height="22" rx="6" fill={color} />
      {children}
    </svg>
  );
}

function Bed({ size = 26, color = '#505759' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
      <path d="M3 15h18" />
      <path d="M5 11V8a1.5 1.5 0 0 1 1.5-1.5H10A1.5 1.5 0 0 1 11.5 8v3" />
      <path d="M3 18v2M21 18v2" />
    </svg>
  );
}

const MODULE_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  office: ({ size = 26, color = '#505759' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} strokeWidth={1.6} {...base}>
      <rect x="4" y="4.5" width="16" height="11" rx="1.4" />
      <path d="M9 20h6" />
      <path d="M12 15.5V20" />
    </svg>
  ),
  bonus: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M8 10.5h2M9 9.5v2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15" cy="9.7" r="0.95" fill="#fff" />
      <circle cx="16.6" cy="11.6" r="0.95" fill="#fff" />
      <path d="M6.8 8.5h10.4a2.3 2.3 0 0 1 2.28 2.62l-.5 3.5a2 2 0 0 1-3.6.98L14 14h-4l-1.38 1.6a2 2 0 0 1-3.6-.98l-.5-3.5A2.3 2.3 0 0 1 6.8 8.5z" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </Squircle>
  ),
  scullery: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M6 5.5v13M18 5.5v13" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 10.5h12M6 15h12" stroke="#fff" strokeWidth="1.4" />
      <rect x="7.6" y="6.3" width="2.6" height="3.4" rx="0.6" fill="#fff" />
      <rect x="11.2" y="6.3" width="2.6" height="3.4" rx="0.6" fill="#fff" />
      <rect x="9.4" y="10.9" width="2.6" height="3.4" rx="0.6" fill="#fff" />
      <rect x="13" y="10.9" width="2.6" height="3.4" rx="0.6" fill="#fff" />
    </Squircle>
  ),
  mudroom: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <rect x="5" y="6" width="14" height="2.2" rx="1.1" fill="#fff" />
      <path d="M8 8.2v1.3M12 8.2v1.3M16 8.2v1.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="5.5" y="14.5" width="13" height="2.2" rx="0.6" fill="#fff" />
      <path d="M6.5 16.7v2M17.5 16.7v2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </Squircle>
  ),
  rec2: Bed,
  // Cuarto sin uso asignado: un recuadro vacío con un signo de interrogación,
  // que es justamente lo que el cliente todavía no define.
  comodin: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <rect x="5.5" y="6" width="13" height="12" rx="1" fill="none" stroke="#fff" strokeWidth="1.4" strokeDasharray="2.6 2" />
      <path d="M10.1 10.4a1.95 1.95 0 1 1 2.4 1.9v1.2" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12.5" cy="15.6" r="0.85" fill="#fff" />
    </Squircle>
  ),
  masterpatio: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M5 15v-2.5a1.6 1.6 0 0 1 1.6-1.6H12a1.6 1.6 0 0 1 1.6 1.6V15" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.3 15h9.4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4.3 15v3.3M13.7 15v3.3" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="16" y="9" width="4.2" height="9.3" rx="0.5" fill="none" stroke="#fff" strokeWidth="1.3" />
      <path d="M16 12.3h4.2" stroke="#fff" strokeWidth="1" />
      <path d="M14.5 18.8h3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </Squircle>
  ),
  // Master + balcón. Es EL icono que entregó el cliente, calcado de su archivo
  // y no redibujado: el trazo de abajo salió de seguir el borde entre píxel
  // negro y píxel blanco de esa imagen, así que es el mismo dibujo — se
  // comprobó rasterizándolo contra el original a 285×282 y da 0 píxeles de
  // diferencia, con los mismos 27,354 píxeles de tinta.
  //
  // Por eso NO usa `Squircle` como sus vecinos: el icono trae su propio marco
  // redondeado y su glifo en negro. Meterlo en el badge habría sido cambiarlo.
  // `viewBox` en el tamaño original del archivo, que es lo que mantiene las
  // proporciones intactas al escalar; `color` pinta el trazo, como en el resto.
  masterbalcon: ({ size = 26, color = '#1C1E1F' }) => (
    <svg width={size} height={size} viewBox="0 0 285 282" aria-hidden="true">
      <path d="M48 8 239 8 239 9 243 9 243 10 246 10 246 11 249 11 249 12 251 12 251 13 253 13 253 14 255 14 255 15 256 15 256 16 258 16 258 17 259 17 259 18 260 18 260 19 262 19 262 20 263 20 263 21 264 21 264 22 265 22 265 23 266 23 266 24 267 24 267 26 268 26 268 27 269 27 269 29 270 29 270 30 271 30 271 32 272 32 272 34 273 34 273 36 274 36 274 39 275 39 275 42 276 42 276 47 277 47 277 235 276 235 276 240 275 240 275 243 274 243 274 246 273 246 273 248 272 248 272 250 271 250 271 251 270 251 270 253 269 253 269 255 268 255 268 256 267 256 267 257 266 257 266 258 265 258 265 259 264 259 264 260 263 260 263 261 262 261 262 262 261 262 261 263 260 263 260 264 259 264 259 265 257 265 257 266 256 266 256 267 254 267 254 268 253 268 253 269 251 269 251 270 249 270 249 271 246 271 246 272 243 272 243 273 237 273 237 274 49 274 49 273 43 273 43 272 40 272 40 271 37 271 37 270 35 270 35 269 33 269 33 268 31 268 31 267 30 267 30 266 28 266 28 265 27 265 27 264 25 264 25 263 24 263 24 262 23 262 23 261 22 261 22 260 21 260 21 259 20 259 20 258 19 258 19 257 18 257 18 256 17 256 17 254 16 254 16 253 15 253 15 251 14 251 14 249 13 249 13 247 12 247 12 245 11 245 11 243 10 243 10 240 9 240 9 235 8 235 8 46 9 46 9 41 10 41 10 38 11 38 11 36 12 36 12 34 13 34 13 32 14 32 14 30 15 30 15 29 16 29 16 27 17 27 17 26 18 26 18 25 19 25 19 23 20 23 20 22 21 22 21 21 22 21 22 20 23 20 23 19 25 19 25 18 26 18 26 17 27 17 27 16 29 16 29 15 31 15 31 14 32 14 32 13 34 13 34 12 36 12 36 11 39 11 39 10 42 10 42 9 48 9 48 8ZM50 24 49 24 49 25 45 25 45 26 42 26 42 27 40 27 40 28 38 28 38 29 37 29 37 30 35 30 35 31 34 31 34 32 33 32 33 33 32 33 32 34 31 34 31 35 30 35 30 37 29 37 29 38 28 38 28 40 27 40 27 42 26 42 26 44 25 44 25 48 24 48 24 233 25 233 25 237 26 237 26 239 27 239 27 241 28 241 28 243 29 243 29 245 30 245 30 246 31 246 31 247 32 247 32 248 33 248 33 249 34 249 34 250 35 250 35 251 36 251 36 252 37 252 37 253 39 253 39 254 41 254 41 255 43 255 43 256 46 256 46 257 50 257 50 258 235 258 235 257 240 257 240 256 242 256 242 255 244 255 244 254 246 254 246 253 248 253 248 252 249 252 249 251 250 251 250 250 251 250 251 249 252 249 252 248 253 248 253 247 254 247 254 246 255 246 255 245 256 245 256 243 257 243 257 241 258 241 258 239 259 239 259 236 260 236 260 231 261 231 261 51 260 51 260 46 259 46 259 43 258 43 258 41 257 41 257 39 256 39 256 37 255 37 255 36 254 36 254 35 253 35 253 33 252 33 252 32 250 32 250 31 249 31 249 30 248 30 248 29 247 29 247 28 245 28 245 27 243 27 243 26 240 26 240 25 236 25 236 24 50 24ZM104 67 189 67 189 68 190 68 190 98 189 98 189 99 185 99 185 125 184 125 184 134 185 134 185 135 184 135 184 137 185 137 185 138 246 138 246 139 247 139 247 143 246 143 246 144 244 144 244 145 242 145 242 190 241 190 241 191 245 191 245 192 246 192 246 194 247 194 247 201 246 201 246 203 245 203 245 204 244 204 244 205 243 205 243 206 241 206 241 207 240 207 240 208 239 208 239 209 237 209 237 210 236 210 236 211 234 211 234 212 232 212 232 213 230 213 230 214 228 214 228 215 40 215 40 214 38 214 38 196 39 196 39 195 170 195 170 192 171 192 171 191 177 191 177 99 171 99 171 98 170 98 170 80 105 80 105 79 104 79 104 78 103 78 103 68 104 68 104 67ZM43 117 45 117 45 118 48 118 48 119 49 119 49 121 50 121 50 169 158 169 158 170 159 170 159 188 158 188 158 191 157 191 157 192 149 192 149 191 147 191 147 189 146 189 146 181 50 181 50 190 49 190 49 191 48 191 48 192 40 192 40 191 39 191 39 190 38 190 38 121 39 121 39 119 40 119 40 118 43 118 43 117ZM59 134 75 134 75 135 77 135 77 136 78 136 78 137 79 137 79 139 80 139 80 142 79 142 79 144 78 144 78 145 77 145 77 146 75 146 75 147 58 147 58 146 56 146 56 145 55 145 55 144 54 144 54 143 53 143 53 139 54 139 54 137 55 137 55 136 56 136 56 135 59 135 59 134ZM186 145 185 145 185 191 193 191 193 145 186 145ZM199 145 198 145 198 191 208 191 208 145 199 145ZM214 145 213 145 213 191 222 191 222 145 214 145ZM228 145 227 145 227 191 237 191 237 145 228 145ZM56 149 145 149 145 150 148 150 148 151 150 151 150 152 151 152 151 153 152 153 152 154 153 154 153 155 154 155 154 157 155 157 155 160 156 160 156 166 53 166 53 152 54 152 54 150 56 150 56 149ZM175 189 176 189 176 190 175 190 175 189ZM186 189 187 189 187 190 186 190 186 189Z" fill={color} fillRule="evenodd" />
    </svg>
  ),
  walkingcloset: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M5.5 7h13" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M15 7h3.4a1 1 0 0 1 1 1v0" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 7v1.6" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 8.6c1.6-1.4 2.4-1.4 4 0" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.4 8.6h7.2l1.6 8.8H6.8z" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
    </Squircle>
  ),
  alberca: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <rect x="4" y="6.5" width="16" height="9" rx="1" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M6 10.7c1 0 1 1.1 2 1.1s1-1.1 2-1.1 1 1.1 2 1.1 1-1.1 2-1.1 1 1.1 2 1.1 1-1.1 2-1.1" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M17 15.5v3.2M19.3 15.5v3.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M17 17h2.3M17 18.7h2.3" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
    </Squircle>
  ),
  bbq: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M8.5 8.5c1-2.2 6-2.2 7 0" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6.3 12.3a5.7 5.7 0 0 1 11.4 0z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.5 12.3h12.9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 14.3v3.2M12 14.3v3.2M16 14.3v3.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8.5 19.3h7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </Squircle>
  ),
  sunkenlounge: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <path d="M5 9.5 12 5l7 4.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5 9.5v6.5L12 20l7-4V9.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8.3 11 12 13.3 15.7 11" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M12 13.3V17" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </Squircle>
  ),
  // El mismo inodoro que llevan la barra de presupuesto y la lámina, SIN la
  // pastilla: el cliente ya lo asocia con "baño" antes de llegar aquí, y
  // enmarcarlo lo separaba del resto de la lista. Es de mancha, así que `color`
  // es el relleno y no el trazo.
  // Negro tinta por defecto, no el gris de los iconos de línea: en la lista de
  // zonas los vecinos son pastillas rellenas de `#1C1E1F` y a `#505759` este se
  // veía más claro que todos.
  mediobano: ({ size = 26, color = '#1C1E1F' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path fillRule="evenodd" d="M6.9 3.2H17.1A1.5 1.5 0 0 1 18.6 4.7V9.8H5.4V4.7A1.5 1.5 0 0 1 6.9 3.2ZM7.6 5.2H11.2A0.8 0.8 0 0 1 11.2 6.8H7.6A0.8 0.8 0 0 1 7.6 5.2Z" />
      <ellipse cx="12" cy="12.3" rx="8.2" ry="2.7" />
      <path d="M3.9 13.3A8.1 2.9 0 0 0 20.1 13.3C20.1 17.3 16.5 20 12 20C7.5 20 3.9 17.3 3.9 13.3Z" />
      <path d="M9.3 19.4H14.7L15.2 22.2A1 1 0 0 1 14.2 23.4H9.8A1 1 0 0 1 8.8 22.2Z" />
    </svg>
  ),
  storage: ({ size, color }) => (
    <Squircle size={size} color={color}>
      <rect x="6" y="12.3" width="12" height="5.7" rx="0.8" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M9.6 14.2h4.8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="6.8" y="6.3" width="10.4" height="4.7" rx="0.8" fill="none" stroke="#fff" strokeWidth="1.4" />
      <path d="M9.9 8.1h4.2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </Squircle>
  ),
};

// Icono del toggle "+ Tragaluz" en el detalle de módulo — no es una zona del
// catálogo (MODULOS), es un atributo que se puede agregar a la zona activa.
/**
 * LOS DOS GLIFOS DEL PROGRAMA: la cama y el coche.
 *
 * Son de MANCHA, no de línea, y esa es la diferencia con el resto de los
 * iconos de este archivo: no son una zona que el cliente agrega, son las dos
 * cuentas que lleva toda la configuración —cuántos cuartos y cuántos lugares
 * de cochera—, y tienen que leerse a 14 px al lado de un número. Un trazo de
 * 1.6 a ese tamaño se cierra y deja una mancha sucia; sólido se lee.
 *
 * Van dibujados con `fillRule="evenodd"`: la almohada de la cama y las
 * ventanas y los pasos de rueda del coche son huecos del mismo trazo, así que
 * el icono es UNA sola figura y toma el color de donde se pare.
 */
type GlifoProps = { size?: number | string; color?: string };

export function CamaIcon({ size = 18, color = '#1C1E1F' }: GlifoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ flex: 'none' }}>
      <path
        fillRule="evenodd"
        d="M6.6 4.6H17.4A1.7 1.7 0 0 1 19.1 6.3V11.6H4.9V6.3A1.7 1.7 0 0 1 6.6 4.6ZM8.3 11.6V10.0A1.7 1.7 0 0 1 10.0 8.3H14.0A1.7 1.7 0 0 1 15.7 10.0V11.6Z"
      />
      <rect x="4.6" y="12.2" width="14.8" height="3.4" rx="1.4" />
      <rect x="3.2" y="14.4" width="17.6" height="3.0" rx="1.0" />
      <rect x="3.2" y="16.2" width="2.4" height="3.2" rx="1.0" />
      <rect x="18.4" y="16.2" width="2.4" height="3.2" rx="1.0" />
    </svg>
  );
}

export function CarroIcon({ size = 18, color = '#1C1E1F' }: GlifoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ flex: 'none' }}>
      <path
        fillRule="evenodd"
        d="M4.2 11.2H5.6L7.7 8.4A3 3 0 0 1 10.1 7.2H13.9A3 3 0 0 1 16.3 8.4L18.4 11.2H19.8A2.4 2.4 0 0 1 22.2 13.6V15.8A1.4 1.4 0 0 1 20.8 17.2H3.2A1.4 1.4 0 0 1 1.8 15.8V13.6A2.4 2.4 0 0 1 4.2 11.2ZM8.5 10.95L10.55 8.35H12.05V10.95ZM13.05 8.35H14.45L16.5 10.95H13.05ZM5.8 17.2A2.6 2.6 0 0 1 11.0 17.2ZM13.0 17.2A2.6 2.6 0 0 1 18.2 17.2Z"
      />
      <circle cx="8.4" cy="17.2" r="2.0" />
      <circle cx="15.6" cy="17.2" r="2.0" />
    </svg>
  );
}

/**
 * El inodoro: el tercer glifo del programa, junto con la cama y el coche.
 * Sirve para baños completos y para medios baños — el dibujo es el mismo, lo
 * que cambia es lo que dice el texto al lado.
 */
export function BanoIcon({ size = 18, color = '#1C1E1F' }: GlifoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ flex: 'none' }}>
      {/* El tanque y su botón, de una pieza: el botón es hueco del mismo
          trazo, como la almohada de la cama. */}
      <path fillRule="evenodd" d="M6.9 3.2H17.1A1.5 1.5 0 0 1 18.6 4.7V9.8H5.4V4.7A1.5 1.5 0 0 1 6.9 3.2ZM7.6 5.2H11.2A0.8 0.8 0 0 1 11.2 6.8H7.6A0.8 0.8 0 0 1 7.6 5.2Z" />
      <ellipse cx="12" cy="12.3" rx="8.2" ry="2.7" />
      <path d="M3.9 13.3A8.1 2.9 0 0 0 20.1 13.3C20.1 17.3 16.5 20 12 20C7.5 20 3.9 17.3 3.9 13.3Z" />
      <path d="M9.3 19.4H14.7L15.2 22.2A1 1 0 0 1 14.2 23.4H9.8A1 1 0 0 1 8.8 22.2Z" />
    </svg>
  );
}

/**
 * La escalera y la casa de dos plantas: los dos iconos que entregó el cliente,
 * calcados de sus archivos y no redibujados. El trazo salió de seguir el borde
 * entre píxel negro y píxel blanco de cada imagen; se comprobó rellenando el
 * path y comparándolo contra su propio bitmap — 0 píxeles de diferencia en los
 * dos. Por eso el `viewBox` es el tamaño del archivo y no una retícula de 24:
 * reencuadrarlos habría sido cambiarlos.
 *
 * Van en `fill` y de una sola pieza, como la cama o el coche, así que toman el
 * color de donde se paren.
 */
export function EscaleraIcon({ size = 18, color = '#1C1E1F' }: GlifoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 320 280" fill={color} aria-hidden="true" style={{ flex: 'none' }}>
      <path fillRule="evenodd" d="M269 1 291 1 291 2 293 2 293 3 294 3 294 4 295 4 295 6 296 6 296 8 297 8 297 14 296 14 296 16 295 16 295 18 294 18 294 19 292 19 292 20 290 20 290 21 270 21 270 22 268 22 268 23 266 23 266 24 264 24 264 25 262 25 262 26 261 26 261 27 259 27 259 89 314 89 314 90 316 90 316 91 317 91 317 92 318 92 318 94 319 94 319 104 318 104 318 106 317 106 317 107 315 107 315 108 308 108 308 166 307 166 307 169 306 169 306 170 305 170 305 171 303 171 303 172 301 172 301 173 300 173 300 174 298 174 298 175 296 175 296 176 295 176 295 177 293 177 293 178 291 178 291 179 289 179 289 180 288 180 288 181 286 181 286 182 284 182 284 183 283 183 283 184 281 184 281 185 279 185 279 186 277 186 277 187 276 187 276 188 274 188 274 189 272 189 272 190 271 190 271 191 269 191 269 192 267 192 267 193 265 193 265 194 264 194 264 195 262 195 262 196 260 196 260 197 258 197 258 198 257 198 257 199 255 199 255 200 253 200 253 201 251 201 251 202 250 202 250 203 248 203 248 204 246 204 246 205 244 205 244 206 243 206 243 207 241 207 241 208 239 208 239 209 237 209 237 210 236 210 236 211 234 211 234 212 232 212 232 213 230 213 230 214 228 214 228 215 227 215 227 216 225 216 225 217 223 217 223 218 221 218 221 219 219 219 219 220 218 220 218 221 216 221 216 222 214 222 214 223 212 223 212 224 211 224 211 225 209 225 209 226 207 226 207 227 206 227 206 228 204 228 204 229 202 229 202 230 200 230 200 231 198 231 198 232 197 232 197 233 195 233 195 234 193 234 193 235 191 235 191 236 189 236 189 237 187 237 187 238 186 238 186 239 184 239 184 240 182 240 182 241 181 241 181 242 179 242 179 243 177 243 177 244 175 244 175 245 173 245 173 246 171 246 171 247 170 247 170 248 168 248 168 249 166 249 166 250 164 250 164 251 162 251 162 252 161 252 161 253 159 253 159 254 157 254 157 255 155 255 155 256 153 256 153 257 152 257 152 258 150 258 150 259 148 259 148 260 146 260 146 261 144 261 144 262 143 262 143 263 141 263 141 264 139 264 139 265 137 265 137 266 135 266 135 267 134 267 134 268 132 268 132 269 130 269 130 270 128 270 128 271 126 271 126 272 124 272 124 273 122 273 122 274 120 274 120 275 118 275 118 276 116 276 116 277 115 277 115 278 113 278 113 279 110 279 110 280 3 280 3 279 2 279 2 278 1 278 1 277 0 277 0 258 1 258 1 256 2 256 2 255 3 255 3 254 4 254 4 253 7 253 7 252 10 252 10 160 8 160 8 159 7 159 7 158 6 158 6 156 5 156 5 147 6 147 6 145 7 145 7 144 8 144 8 143 10 143 10 142 37 142 37 143 39 143 39 144 40 144 40 145 41 145 41 146 42 146 42 149 43 149 43 154 42 154 42 157 41 157 41 158 40 158 40 159 39 159 39 160 37 160 37 252 62 252 62 251 63 251 63 237 62 237 62 236 55 236 55 235 54 235 54 234 53 234 53 233 52 233 52 221 53 221 53 219 54 219 54 218 56 218 56 217 117 217 117 204 110 204 110 203 108 203 108 202 107 202 107 201 106 201 106 198 105 198 105 190 106 190 106 187 107 187 107 186 108 186 108 185 110 185 110 184 170 184 170 171 164 171 164 170 162 170 162 169 161 169 161 168 160 168 160 155 161 155 161 154 162 154 162 153 163 153 163 152 165 152 165 151 222 151 222 139 218 139 218 138 215 138 215 137 214 137 214 136 213 136 213 123 214 123 214 121 215 121 215 120 217 120 217 119 267 119 267 118 268 118 268 110 249 110 249 109 248 109 248 108 247 108 247 106 246 106 246 35 244 35 244 36 242 36 242 37 240 37 240 38 238 38 238 39 237 39 237 40 235 40 235 41 233 41 233 42 231 42 231 43 229 43 229 44 228 44 228 45 226 45 226 46 224 46 224 47 222 47 222 48 220 48 220 49 219 49 219 50 217 50 217 51 215 51 215 52 213 52 213 53 211 53 211 54 209 54 209 55 208 55 208 56 206 56 206 57 204 57 204 141 203 141 203 143 201 143 201 144 193 144 193 143 192 143 192 142 191 142 191 65 189 65 189 66 187 66 187 67 185 67 185 68 183 68 183 69 182 69 182 70 180 70 180 71 178 71 178 72 176 72 176 73 174 73 174 74 173 74 173 75 171 75 171 76 169 76 169 77 167 77 167 78 166 78 166 79 164 79 164 80 162 80 162 81 160 81 160 82 158 82 158 83 157 83 157 84 155 84 155 85 153 85 153 86 151 86 151 87 149 87 149 88 148 88 148 89 146 89 146 175 145 175 145 176 144 176 144 177 136 177 136 176 135 176 135 175 134 175 134 97 131 97 131 98 129 98 129 99 127 99 127 100 125 100 125 101 124 101 124 102 122 102 122 103 120 103 120 104 118 104 118 105 117 105 117 106 115 106 115 107 113 107 113 108 111 108 111 109 109 109 109 110 108 110 108 111 106 111 106 112 104 112 104 113 102 113 102 114 100 114 100 115 99 115 99 116 97 116 97 117 95 117 95 118 93 118 93 119 92 119 92 120 91 120 91 207 90 207 90 208 89 208 89 209 86 209 86 210 83 210 83 209 80 209 80 208 79 208 79 206 78 206 78 127 77 127 77 128 75 128 75 129 73 129 73 130 71 130 71 131 70 131 70 132 68 132 68 133 66 133 66 134 64 134 64 135 63 135 63 136 61 136 61 137 59 137 59 138 57 138 57 139 56 139 56 140 54 140 54 141 52 141 52 142 47 142 47 141 45 141 45 140 44 140 44 139 43 139 43 138 42 138 42 136 41 136 41 132 42 132 42 129 43 129 43 128 44 128 44 127 45 127 45 126 47 126 47 125 49 125 49 124 50 124 50 123 52 123 52 122 54 122 54 121 56 121 56 120 58 120 58 119 59 119 59 118 61 118 61 117 63 117 63 116 65 116 65 115 66 115 66 114 68 114 68 113 70 113 70 112 72 112 72 111 74 111 74 110 75 110 75 109 77 109 77 108 79 108 79 107 81 107 81 106 83 106 83 105 84 105 84 104 86 104 86 103 88 103 88 102 90 102 90 101 91 101 91 100 93 100 93 99 95 99 95 98 97 98 97 97 99 97 99 96 100 96 100 95 102 95 102 94 104 94 104 93 106 93 106 92 108 92 108 91 109 91 109 90 111 90 111 89 113 89 113 88 115 88 115 87 117 87 117 86 118 86 118 85 120 85 120 84 122 84 122 83 124 83 124 82 125 82 125 81 127 81 127 80 129 80 129 79 131 79 131 78 133 78 133 77 134 77 134 76 136 76 136 75 138 75 138 74 140 74 140 73 142 73 142 72 143 72 143 71 145 71 145 70 147 70 147 69 149 69 149 68 151 68 151 67 152 67 152 66 154 66 154 65 156 65 156 64 158 64 158 63 159 63 159 62 161 62 161 61 163 61 163 60 165 60 165 59 167 59 167 58 168 58 168 57 170 57 170 56 172 56 172 55 174 55 174 54 176 54 176 53 177 53 177 52 179 52 179 51 181 51 181 50 183 50 183 49 185 49 185 48 186 48 186 47 188 47 188 46 190 46 190 45 192 45 192 44 194 44 194 43 196 43 196 42 197 42 197 41 199 41 199 40 201 40 201 39 203 39 203 38 205 38 205 37 206 37 206 36 208 36 208 35 210 35 210 34 212 34 212 33 214 33 214 32 215 32 215 31 217 31 217 30 219 30 219 29 221 29 221 28 222 28 222 27 224 27 224 26 226 26 226 25 228 25 228 24 230 24 230 23 231 23 231 22 233 22 233 21 235 21 235 20 237 20 237 19 239 19 239 18 240 18 240 17 242 17 242 16 244 16 244 15 246 15 246 14 247 14 247 13 249 13 249 12 251 12 251 11 253 11 253 10 255 10 255 9 256 9 256 8 258 8 258 7 260 7 260 6 262 6 262 5 263 5 263 4 265 4 265 3 267 3 267 2 269 2 269 1ZM24 112 25 112 25 113 30 113 30 114 32 114 32 115 33 115 33 116 35 116 35 118 36 118 36 119 37 119 37 121 38 121 38 132 37 132 37 134 36 134 36 135 35 135 35 136 34 136 34 137 33 137 33 138 32 138 32 139 30 139 30 140 26 140 26 141 21 141 21 140 17 140 17 139 15 139 15 138 14 138 14 137 12 137 12 136 11 136 11 134 10 134 10 132 9 132 9 123 10 123 10 121 11 121 11 119 12 119 12 118 13 118 13 117 14 117 14 116 15 116 15 115 17 115 17 114 19 114 19 113 24 113 24 112Z" />
    </svg>
  );
}

export function PlantasIcon({ size = 18, color = '#1C1E1F' }: GlifoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 460 492" fill={color} aria-hidden="true" style={{ flex: 'none' }}>
      <path fillRule="evenodd" d="M223 11 233 11 233 12 236 12 236 13 238 13 238 14 239 14 239 15 241 15 241 16 243 16 243 17 244 17 244 18 246 18 246 19 248 19 248 20 249 20 249 21 251 21 251 22 253 22 253 23 254 23 254 24 256 24 256 25 258 25 258 26 259 26 259 27 261 27 261 28 263 28 263 29 264 29 264 30 266 30 266 31 268 31 268 32 269 32 269 33 271 33 271 34 273 34 273 35 274 35 274 36 276 36 276 37 278 37 278 38 279 38 279 39 281 39 281 40 283 40 283 41 284 41 284 42 286 42 286 43 288 43 288 44 289 44 289 45 291 45 291 46 293 46 293 47 295 47 295 48 296 48 296 49 298 49 298 50 300 50 300 51 301 51 301 52 303 52 303 53 305 53 305 54 306 54 306 55 308 55 308 56 310 56 310 57 311 57 311 58 313 58 313 59 315 59 315 60 316 60 316 61 318 61 318 62 320 62 320 63 321 63 321 64 323 64 323 65 325 65 325 66 326 66 326 67 328 67 328 68 330 68 330 69 331 69 331 70 333 70 333 71 335 71 335 72 336 72 336 73 338 73 338 74 340 74 340 75 341 75 341 76 343 76 343 77 345 77 345 78 346 78 346 79 348 79 348 80 350 80 350 81 351 81 351 82 353 82 353 83 355 83 355 84 356 84 356 85 358 85 358 86 360 86 360 87 361 87 361 88 363 88 363 89 365 89 365 90 366 90 366 91 368 91 368 92 370 92 370 93 371 93 371 94 373 94 373 95 375 95 375 96 376 96 376 97 378 97 378 98 380 98 380 99 381 99 381 100 383 100 383 101 385 101 385 102 386 102 386 103 388 103 388 104 390 104 390 105 391 105 391 106 393 106 393 107 395 107 395 108 396 108 396 109 398 109 398 110 400 110 400 111 401 111 401 112 403 112 403 113 405 113 405 114 406 114 406 115 408 115 408 116 410 116 410 117 411 117 411 118 413 118 413 119 415 119 415 120 416 120 416 121 418 121 418 122 420 122 420 123 421 123 421 124 423 124 423 125 425 125 425 126 426 126 426 127 428 127 428 128 430 128 430 129 431 129 431 130 433 130 433 131 435 131 435 132 436 132 436 133 438 133 438 134 440 134 440 135 441 135 441 136 443 136 443 137 445 137 445 138 446 138 446 139 447 139 447 140 448 140 448 141 449 141 449 142 450 142 450 144 451 144 451 146 452 146 452 154 451 154 451 156 450 156 450 158 449 158 449 159 447 159 447 160 445 160 445 161 442 161 442 162 439 162 439 161 435 161 435 160 432 160 432 159 430 159 430 158 427 158 427 157 425 157 425 156 422 156 422 155 420 155 420 154 418 154 418 153 415 153 415 152 413 152 413 151 410 151 410 150 408 150 408 149 405 149 405 148 404 148 404 276 58 276 58 146 57 146 57 147 55 147 55 148 52 148 52 149 50 149 50 150 48 150 48 151 46 151 46 152 43 152 43 153 41 153 41 154 39 154 39 155 36 155 36 156 34 156 34 157 32 157 32 158 30 158 30 159 27 159 27 160 25 160 25 161 21 161 21 162 18 162 18 161 15 161 15 160 13 160 13 159 11 159 11 158 10 158 10 156 9 156 9 154 8 154 8 146 9 146 9 144 10 144 10 142 11 142 11 141 12 141 12 140 13 140 13 139 14 139 14 138 15 138 15 137 17 137 17 136 18 136 18 135 20 135 20 134 22 134 22 133 23 133 23 132 25 132 25 131 27 131 27 130 28 130 28 129 30 129 30 128 32 128 32 127 33 127 33 126 35 126 35 125 36 125 36 124 38 124 38 123 40 123 40 122 41 122 41 121 43 121 43 120 45 120 45 119 46 119 46 118 48 118 48 117 50 117 50 116 51 116 51 115 53 115 53 114 55 114 55 113 56 113 56 112 58 112 58 111 59 111 59 110 61 110 61 109 63 109 63 108 64 108 64 107 66 107 66 106 68 106 68 105 69 105 69 104 71 104 71 103 73 103 73 102 74 102 74 101 76 101 76 100 77 100 77 99 79 99 79 98 81 98 81 97 82 97 82 96 84 96 84 95 86 95 86 94 87 94 87 93 89 93 89 92 91 92 91 91 92 91 92 90 94 90 94 89 96 89 96 88 97 88 97 87 99 87 99 86 100 86 100 85 102 85 102 84 104 84 104 83 105 83 105 82 107 82 107 81 109 81 109 80 110 80 110 79 112 79 112 78 114 78 114 77 115 77 115 76 117 76 117 75 118 75 118 74 120 74 120 73 122 73 122 72 123 72 123 71 125 71 125 70 127 70 127 69 128 69 128 68 130 68 130 67 132 67 132 66 133 66 133 65 135 65 135 64 136 64 136 63 138 63 138 62 140 62 140 61 141 61 141 60 143 60 143 59 145 59 145 58 146 58 146 57 148 57 148 56 150 56 150 55 151 55 151 54 153 54 153 53 155 53 155 52 156 52 156 51 158 51 158 50 159 50 159 49 161 49 161 48 163 48 163 47 164 47 164 46 166 46 166 45 168 45 168 44 169 44 169 43 171 43 171 42 173 42 173 41 174 41 174 40 176 40 176 39 177 39 177 38 179 38 179 37 181 37 181 36 182 36 182 35 184 35 184 34 186 34 186 33 187 33 187 32 189 32 189 31 191 31 191 30 192 30 192 29 194 29 194 28 196 28 196 27 197 27 197 26 199 26 199 25 200 25 200 24 202 24 202 23 204 23 204 22 205 22 205 21 207 21 207 20 209 20 209 19 210 19 210 18 212 18 212 17 214 17 214 16 215 16 215 15 217 15 217 14 218 14 218 13 220 13 220 12 223 12 223 11ZM107 162 106 162 106 163 104 163 104 164 103 164 103 165 102 165 102 241 103 241 103 242 104 242 104 243 105 243 105 244 187 244 187 243 188 243 188 242 189 242 189 241 190 241 190 165 189 165 189 164 188 164 188 163 186 163 186 162 107 162ZM275 162 274 162 274 163 272 163 272 164 271 164 271 165 270 165 270 241 271 241 271 242 272 242 272 243 273 243 273 244 355 244 355 243 356 243 356 242 357 242 357 241 358 241 358 165 357 165 357 164 356 164 356 163 354 163 354 162 275 162ZM58 294 404 294 404 482 403 482 403 483 402 483 402 484 401 484 401 485 399 485 399 486 63 486 63 485 61 485 61 484 60 484 60 483 59 483 59 482 58 482 58 294ZM107 334 106 334 106 335 104 335 104 336 103 336 103 337 102 337 102 413 103 413 103 414 104 414 104 415 105 415 105 416 187 416 187 415 188 415 188 414 189 414 189 413 190 413 190 337 189 337 189 336 188 336 188 335 186 335 186 334 107 334ZM261 334 260 334 260 335 258 335 258 336 257 336 257 337 256 337 256 477 257 477 257 478 258 478 258 479 259 479 259 480 341 480 341 479 342 479 342 478 343 478 343 477 344 477 344 337 343 337 343 336 342 336 342 335 340 335 340 334 261 334ZM319 396 325 396 325 397 327 397 327 398 328 398 328 399 329 399 329 400 330 400 330 401 331 401 331 404 332 404 332 409 331 409 331 411 330 411 330 412 329 412 329 413 328 413 328 414 327 414 327 415 324 415 324 416 320 416 320 415 317 415 317 414 316 414 316 413 315 413 315 412 314 412 314 411 313 411 313 409 312 409 312 404 313 404 313 401 314 401 314 400 315 400 315 399 316 399 316 398 317 398 317 397 319 397 319 396Z" />
    </svg>
  );
}

export function TragaluzIcon({ size, color = '#fff' }: IconProps) {
  return (
    <svg width={size ?? 14} height={size ?? 14} viewBox="0 0 24 24" stroke={color} strokeWidth={1.5} {...base}>
      <path d="M3 9.5 9.5 6l3.6 2v5.4l-3.6 2L3 13.4z" strokeLinejoin="round" />
      <path d="M13.1 8 20 4.8v5.4l-3.5 2" strokeLinejoin="round" />
      <path d="M13.1 13.4 20 10.2" />
    </svg>
  );
}

/**
 * Los módulos cuyo icono es un BADGE (squircle relleno) y no un trazo.
 *
 * La diferencia importa cuando el icono va sobre fondo oscuro: en los de línea
 * `color` es el trazo y hay que pedir blanco, pero en estos `color` es la
 * PASTILLA y el glifo de adentro ya viene en blanco fijo. Pedirles blanco los
 * deja en blanco sobre blanco — una pastilla vacía. Sobre oscuro se les pasa el
 * color del fondo y el glifo aparece solo.
 */
export const ICONOS_DE_PASTILLA = new Set([
  'bonus', 'scullery', 'mudroom', 'comodin', 'masterpatio', 'masterbalcon',
  'walkingcloset', 'alberca', 'bbq', 'sunkenlounge', 'storage',
]);

export function ModuloIcon({ moduleKey, size, color }: { moduleKey: string; size?: number | string; color?: string }) {
  const Icon = MODULE_ICONS[moduleKey];
  if (!Icon) return null;
  return <Icon size={size} color={color} />;
}

/* Aquí vivían los cuatro pictogramas de fachada (`FachadaIcon`). Se quitaron:
   dibujados a línea, los cuatro estilos salían casi idénticos —un rectángulo
   con techo— y no dejaban ver lo que de verdad los distingue, que es el
   volumen. En su lugar van las maquetas isométricas de `RENDER_FACHADA`
   (`lib/assets.ts`). */
