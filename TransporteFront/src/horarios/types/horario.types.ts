import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

export interface HorarioConteosPorTransporte {
  transporteUno: number;
  transporteDos: number;
}

export interface HorarioPasajeroAsignado {
  pasajeroId: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  esPrincipal: boolean;
  prioridad: number;
  fechaAsignacion: string;
  transporte: TransporteTipo;
}

export interface HorarioPasajerosAsignados {
  horarioId: number;
  horarioEtiqueta: string;
  pasajeros: HorarioPasajeroAsignado[];
  conteosPorTransporte: HorarioConteosPorTransporte;
}

export interface HorarioResponse {
  id: number;
  etiqueta: string;
  orden: number;
  pasajerosActivos: number;
  conteosPorTransporte: HorarioConteosPorTransporte;
  pasajerosAsignados?: HorarioPasajeroAsignado[];
}

export interface HorarioResumen {
  id: number;
  etiqueta: string;
}

export interface HorarioPasajerosResponse {
  horario: HorarioResumen;
  pasajeros: PasajeroResponse[];
  pasajerosAsignados: HorarioPasajerosAsignados;
}

export interface HorarioAsignacionDetalle {
  pasajeroId: number;
  esPrincipal?: boolean;
  prioridad?: number | null;
  transporte?: TransporteTipo;
}

export interface HorarioAsignacionRequest {
  pasajeros: HorarioAsignacionDetalle[];
  pasajeroIds?: number[];
  transporte?: TransporteTipo;
}
