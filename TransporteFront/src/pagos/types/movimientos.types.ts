export interface MovimientosFilterRequest {
  fechaDesde: string;
  fechaHasta: string;
  titularId?: number;
  medioPago?: string;
  pageNumber: number;
  pageSize: number;
}

export interface MovimientoHistorial {
  id: number;
  pagoMensualId: number;
  titularId: number;
  titularApellido: string;
  titularNombre: string;
  titularNombreCompleto: string;
  mes: number;
  anio: number;
  periodo: string;
  fechaPago: string;
  monto: number;
  medioPago: string;
  observaciones: string | null;
}

export interface MovimientosPaginationResponse {
  data: MovimientoHistorial[];
  totalCount: number;
}
