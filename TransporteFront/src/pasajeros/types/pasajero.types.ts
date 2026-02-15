/**
 * Tipos de Pasajeros - Mapeados desde DTOs del backend
 */

import type { PasajeroTurno } from '../constants/turnos.constants';

export interface PasajeroHorarioResumen {
  id: number;
  etiqueta: string;
}

export interface PasajeroResponse {
  id: number;
  titularId: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  colegio: string;
  gradoCurso: string;
  turno: PasajeroTurno;
  observaciones: string | null;
  horarioId: number | null;
  horarioDescripcion: string | null;
  fechaAlta: string;
  fechaBaja: string | null;
  activo: boolean;
  titularApellido: string | null;
  horario?: PasajeroHorarioResumen | null;
}

export interface PasajeroRequest {
  titularId: number;
  nombre: string;
  colegio: string;
  gradoCurso: string;
  turno: PasajeroTurno;
  observaciones?: string;
  horarioId?: number | null;
  fechaAlta?: string;
}

export interface PasajeroUpdateRequest {
  nombre: string;
  colegio: string;
  gradoCurso: string;
  turno: PasajeroTurno;
  observaciones?: string;
  horarioId?: number | null;
}

// Paginación
export interface PasajeroFilterRequest {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PasajeroPaginationResponse {
  data: PasajeroResponse[];
  totalCount: number;
}
