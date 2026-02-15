/**
 * Tipos de Pasajeros - Mapeados desde DTOs del backend
 */

import type { PasajeroTurno } from '../constants/turnos.constants';

export interface PasajeroHorarioAsignado {
  horarioId: number;
  nombreHorario: string;
  colegio: string;
  esPrincipal: boolean;
  prioridad: number | null;
  fechaAsignacion: string;
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
  fechaAlta: string;
  fechaBaja: string | null;
  activo: boolean;
  titularApellido: string | null;
  horariosAsignados: PasajeroHorarioAsignado[];
}

export interface PasajeroRequest {
  titularId: number;
  nombre: string;
  colegio: string;
  gradoCurso: string;
  turno: PasajeroTurno;
  observaciones?: string;
  fechaAlta?: string;
}

export interface PasajeroUpdateRequest {
  nombre: string;
  colegio: string;
  gradoCurso: string;
  turno: PasajeroTurno;
  observaciones?: string;
}

export interface PasajeroHorarioAsignacionPayload {
  horarioId: number;
  esPrincipal?: boolean;
  prioridad?: number | null;
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
