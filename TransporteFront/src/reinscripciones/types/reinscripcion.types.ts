// Espejo de ReinscripcionModel.ResponseDetallada del backend
export interface ReinscripcionDetallada {
  id: number;
  pasajeroId: number;
  pasajeroNombre: string;
  titularNombre: string;
  colegio: string;
  curso: string;
  turno: string;
  anio: number;
  estado: ReinscripcionEstado;
  fechaCreacion: string;
  fechaConfirmacion: string | null;
}

export type ReinscripcionEstado = 'Pendiente' | 'Confirmado' | 'NoContinua';

export interface ReinscripcionListParams {
  anio: number;
  mes: number;
  estado: ReinscripcionEstado;
  pageNumber: number;
  pageSize: number;
}

export interface ReinscripcionListResponse {
  data: ReinscripcionDetallada[];
  totalCount: number;
}

export interface CrearReinscripcionRequest {
  pasajeroId: number;
  anio: number;
}
