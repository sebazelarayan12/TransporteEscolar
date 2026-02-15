import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';

export interface HorarioResponse {
  id: number;
  etiqueta: string;
  orden: number;
  pasajerosActivos: number;
}

export interface HorarioResumen {
  id: number;
  etiqueta: string;
}

export interface HorarioPasajerosResponse {
  horario: HorarioResumen;
  pasajeros: PasajeroResponse[];
}

export interface HorarioAsignacionRequest {
  pasajeroIds: number[];
}
