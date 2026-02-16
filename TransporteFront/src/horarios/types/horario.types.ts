import type { PasajeroHorarioAsignado, PasajeroResponse } from '../../pasajeros/types/pasajero.types';

export interface HorarioResponse {
  id: number;
  etiqueta: string;
  orden: number;
  pasajerosActivos: number;
  pasajerosAsignados?: PasajeroHorarioAsignado[];
}

export interface HorarioResumen {
  id: number;
  etiqueta: string;
}

export interface HorarioPasajerosResponse {
  horario: HorarioResumen;
  pasajeros: PasajeroResponse[];
}

export interface HorarioAsignacionDetalle {
  pasajeroId: number;
  esPrincipal?: boolean;
  prioridad?: number | null;
}

export interface HorarioAsignacionRequest {
  pasajeros: HorarioAsignacionDetalle[];
  pasajeroIds?: number[];
}
