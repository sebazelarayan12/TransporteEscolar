/** Origen de la ubicación tal como lo devuelve el backend. */
export const FUENTES_UBICACION = {
  MANUAL: 'Manual',
  GEOCODER: 'Geocoder',
} as const;

export type FuenteUbicacion = (typeof FUENTES_UBICACION)[keyof typeof FUENTES_UBICACION];

export interface UbicacionResponse {
  titularId: number;
  latitud: number;
  longitud: number;
  direccionNormalizada: string | null;
  fuente: FuenteUbicacion;
  fechaActualizacion: string;
}

export interface UbicacionRequest {
  latitud: number;
  longitud: number;
  direccionNormalizada: string | null;
  esManual: boolean;
}

export interface RecorridoResponse {
  colegioId: number;
  colegioNombre: string;
  distanciaMetros: number;
  duracionSegundos: number;
  viajesDiarios: number;
  kilometrosMensuales: number;
  geometriaPolyline: string | null;
  fechaCalculo: string;
}

export interface RecalculoResponse {
  calculados: number;
  omitidos: number;
  fallidos: number;
  titularesSinUbicacion: number[];
}

export interface ColegioResponse {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
}

export interface AnalisisFila {
  titularId: number;
  apellido: string;
  montoMensual: number;
  colegios: string[];
  kilometrosMensuales: number;
  precioPorKilometro: number | null;
  tieneUbicacion: boolean;
}

export interface AnalisisResponse {
  filas: AnalisisFila[];
  kilometrosTotales: number;
  recaudacionTotal: number;
  precioPromedioPorKilometro: number | null;
  titularesSinUbicacion: number;
}

/** Resultado del buscador de direcciones. */
export interface SugerenciaDireccion {
  id: string;
  etiqueta: string;
  latitud: number;
  longitud: number;
}
