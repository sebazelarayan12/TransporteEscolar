import type { TransporteTipo } from '../../shared/types/transporte.types';

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

/** Viaje que no se pudo repartir porque le falta la casa fija (o dejó de corresponder a un participante). */
export interface ViajePendiente {
  horarioId: number;
  horarioEtiqueta: string;
  transporte: TransporteTipo;
  /** Texto listo para mostrar tal cual: por qué quedó pendiente. */
  motivo: string;
}

export interface RecalculoRepartoResponse {
  viajesProcesados: number;
  consultasRealizadas: number;
  fallidos: number;
  viajesAproximados: number;
  pendientes: ViajePendiente[];
}

/** Parada fija marcada para un viaje: la casa que arranca (ida) o cierra (vuelta) el recorrido. */
export interface ParadaFijaResponse {
  horarioId: number;
  horarioEtiqueta: string;
  transporte: TransporteTipo;
  titularId: number;
  titularApellido: string;
  fechaAsignacion: string;
}

export interface ParadaFijaRequest {
  titularId: number;
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
  /** Km/mes que le corresponden a esta familia según el reparto por valor de Shapley. 0 si no hay datos. */
  kilometrosAsignadosMensuales: number;
  precioPorKilometroAsignado: number | null;
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

/** Sentido del horario tal como lo devuelve el backend (`ToString()` del enum). */
export const SENTIDOS_HORARIO = {
  IDA: 'Ida',
  VUELTA: 'Vuelta',
} as const;

export type SentidoHorario = (typeof SENTIDOS_HORARIO)[keyof typeof SENTIDOS_HORARIO];

/** Una parada del recorrido de un viaje, en orden de visita. */
export interface ParadaRecorrido {
  orden: number;
  titularId: number;
  apellido: string;
  /** Metros desde el punto anterior del recorrido (0 si es el punto de partida). */
  metrosTramoAnterior: number;
  /** Metros del viaje que le tocan a esa familia por el reparto (no son mensuales). */
  metrosAsignados: number;
  /** Si es la casa elegida a mano para anclar el recorrido. */
  esParadaFija: boolean;
}

/** Recorrido calculado de un viaje concreto (horario + vehículo), listo para mostrar en pantalla. */
export interface RecorridoViajeResponse {
  horarioId: number;
  horarioEtiqueta: string;
  sentido: SentidoHorario;
  transporte: TransporteTipo;
  colegioNombre: string;
  distanciaTotalMetros: number;
  duracionTotalSegundos: number;
  /** Metros de la última casa al colegio. Cero en los viajes de vuelta. */
  metrosTramoFinal: number;
  fechaCalculo: string;
  paradas: ParadaRecorrido[];
}
