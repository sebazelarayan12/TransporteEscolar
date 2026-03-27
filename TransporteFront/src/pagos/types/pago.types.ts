// Espejo de PagoMensualModel.cs del backend
export interface PagoMensual {
  id: number;
  titularId: number;
  titularApellido: string;
  titularNombre: string;
  titularDireccion: string;
  mes: number;
  anio: number;
  periodo: string; // "Octubre 2023"
  montoGenerado: number;
  totalPagado: number;
  saldoPendiente: number;
  fechaVencimiento: string;
  estaPagado: boolean;
  estaVencido: boolean;
  observaciones: string | null;
  movimientos: PagoMovimiento[];
}

export interface PagoMovimiento {
  id: number;
  monto: number;
  fechaPago: string; // ISO DateTime from backend
  medioPago: string; // "Efectivo" | "Transferencia" | "Tarjeta"
  observaciones: string | null;
}

// Backend DTOs (mapeo directo desde PagoMensualModel)
export interface PagoMensualDetalle extends PagoMensual {
  movimientos: PagoMovimiento[];
}

export interface RegistrarPagoRequest {
  monto: number;
  fechaPago: string;
  medioPago: string;
  observaciones?: string;
}

export type PaymentStatus = 'vencido' | 'parcial' | 'pagado';

export type PagoEstado = 'pendiente' | 'vencido' | 'pagado';

export type PagosEstadoFiltro = 'todos' | PagoEstado;

export interface PagoFilterRequest {
  mes: number;
  anio: number;
  search?: string;
  pageNumber: number;
  pageSize: number;
}

export interface PagoPaginationResponse {
  data: PagoMensual[];
  totalCount: number;
}

export interface EstadisticasMes {
  totalPagos: number;
  cantidadPagados: number;
  cantidadPendientes: number;
  cantidadVencidos: number;
  totalRecaudado: number;
  totalPendiente: number;
}

export interface AjusteTitularRequest {
  nuevoMonto: number;
  aplicarSoloPendientes?: boolean;
  motivo?: string;
}

export interface AjusteTitularResponse {
  titularId: number;
  montoAnterior: number;
  montoNuevo: number;
  cantidadCuotasActualizadas: number;
  periodosActualizados: string[];
}
