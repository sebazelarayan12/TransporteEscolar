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

export interface TitularRequest {
  apellido: string;
  nombreContacto: string;
  direccion: string;
  montoMensualPactado: number;
  fechaAlta?: string;
}

export interface TitularUpdateRequest {
  nombreContacto: string;
  direccion: string;
  montoMensualPactado: number;
}

export interface TitularSelectorItem {
  id: number;
  label: string;
}
