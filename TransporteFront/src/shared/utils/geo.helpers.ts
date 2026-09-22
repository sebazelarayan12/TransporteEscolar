/** Centro del mapa cuando un titular todavía no tiene pin: Yerba Buena, Tucumán. */
export const TUCUMAN_CENTRO = {
  lat: -26.82,
  lng: -65.29,
} as const;

/** Zoom inicial cuando no hay pin: se ve toda la zona de cobertura. */
export const ZOOM_POR_DEFECTO = 13;

/** Zoom cuando ya hay un pin: se ve la manzana. */
export const ZOOM_DETALLE = 17;

/**
 * Tiles de CARTO. Gratis hasta 5 millones de pedidos por mes, uso comercial permitido,
 * sin cuenta ni API key. La atribución es obligatoria.
 */
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

/** Atribución legalmente obligatoria de OpenStreetMap y CARTO. No quitarla. */
export const TILE_ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const SIN_DATO = '—';
const METROS_POR_KILOMETRO = 1000;
const SEGUNDOS_POR_MINUTO = 60;
const MINUTOS_POR_HORA = 60;

/** Formatea una coordenada con seis decimales fijos (~11 cm de precisión). */
export const formatearCoordenada = (valor: number): string => valor.toFixed(6);

/**
 * Trunca hacia cero con la cantidad de decimales indicada.
 * El proyecto trunca en vez de redondear para los valores numéricos no porcentuales.
 */
const truncar = (valor: number, decimales: number): number => {
  const factor = 10 ** decimales;
  return Math.trunc(valor * factor) / factor;
};

/**
 * Formatea una distancia en metros.
 * Por debajo de un kilómetro muestra metros enteros; por encima, kilómetros con dos decimales.
 */
export const formatearDistancia = (metros: number): string => {
  if (!Number.isFinite(metros) || metros <= 0) {
    return SIN_DATO;
  }

  if (metros < METROS_POR_KILOMETRO) {
    return `${Math.trunc(metros)} m`;
  }

  const kilometros = truncar(metros / METROS_POR_KILOMETRO, 2);
  return `${kilometros.toFixed(2).replace('.', ',')} km`;
};

/**
 * Formatea kilómetros (no metros) truncando a dos decimales, con coma decimal.
 * Es la única fuente de este formato: lo usan la ficha del titular y la pantalla de análisis.
 */
export const formatearKilometros = (kilometros: number): string => {
  if (!Number.isFinite(kilometros) || kilometros <= 0) {
    return SIN_DATO;
  }

  return `${truncar(kilometros, 2).toFixed(2).replace('.', ',')} km`;
};

/** Formatea una duración en segundos como minutos, o como horas y minutos. */
export const formatearDuracion = (segundos: number): string => {
  if (!Number.isFinite(segundos) || segundos <= 0) {
    return SIN_DATO;
  }

  const minutosTotales = Math.trunc(segundos / SEGUNDOS_POR_MINUTO);

  if (minutosTotales < MINUTOS_POR_HORA) {
    return `${minutosTotales} min`;
  }

  const horas = Math.trunc(minutosTotales / MINUTOS_POR_HORA);
  const minutos = minutosTotales % MINUTOS_POR_HORA;

  return minutos === 0 ? `${horas} h` : `${horas} h ${minutos} min`;
};
