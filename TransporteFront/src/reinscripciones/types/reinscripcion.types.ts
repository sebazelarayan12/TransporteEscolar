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

export interface CrearReinscripcionRequest {
  pasajeroId: number;
  anio: number;
}
