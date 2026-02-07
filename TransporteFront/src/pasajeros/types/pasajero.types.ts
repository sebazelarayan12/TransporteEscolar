/**
 * Tipos de Pasajeros - Mapeados desde DTOs del backend
 */

export interface PasajeroResponse {
  id: number;
  titularId: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  colegio: string;
  gradoCurso: string;
  turno: string;
  observaciones: string | null;
  fechaAlta: string;
  fechaBaja: string | null;
  activo: boolean;
  titularApellido: string | null;
}

export interface PasajeroRequest {
  titularId: number;
  nombre: string;
  colegio: string;
  gradoCurso: string;
  turno: string;
  observaciones?: string;
  fechaAlta?: string;
}

export interface PasajeroUpdateRequest {
  colegio: string;
  gradoCurso: string;
  turno: string;
  observaciones?: string;
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

