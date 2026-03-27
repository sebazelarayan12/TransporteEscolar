/**
 * Tipos de Titulares - Mapeados desde DTOs del backend
 */

export interface TitularResponse {
  id: number;
  apellido: string;
  nombreContacto: string;
  direccion: string;
  montoMensualPactado: number;
  fechaAlta: string;
  fechaBaja: string | null;
  activo: boolean;
}

export interface TitularSinTelefono {
  id: number;
  apellido: string;
  nombreContacto: string;
  direccion: string;
}

export interface TitularTelefonoResponse {
  id: number;
  numeroE164: string;
  esPrincipal: boolean;
  fechaAlta: string;
  fechaBaja: string | null;
  activo: boolean;
}

export interface TitularTelefonoRequest {
  numeroE164: string;
  esPrincipal: boolean;
}

export interface TitularRequest {
  apellido: string;
  nombreContacto: string;
  direccion: string;
  montoMensualPactado: number;
  fechaAlta?: string;
}

export interface TitularUpdateRequest {
  apellido: string;
  nombreContacto: string;
  direccion: string;
  montoMensualPactado: number;
}

export interface TitularSelectorItem {
  id: number;
  label: string;
}

// Paginación
export interface TitularFilterRequest {
  search?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface TitularPaginationResponse {
  data: TitularResponse[];
  totalCount: number;
}
