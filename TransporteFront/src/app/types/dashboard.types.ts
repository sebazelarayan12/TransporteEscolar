export interface DashboardSummary {
  totalPendiente: number;
  cantidadPendiente: number;
  totalVencido: number;
  cantidadVencido: number;
  titularesActivos: number;
  pasajerosActivos: number;
}

export interface DashboardRevenuePoint {
  anio: number;
  mes: number;
  totalGenerado: number;
  totalPagado: number;
  totalPendiente: number;
}

export interface DashboardActivityItem {
  movimientoId: number;
  titularId: number;
  titularNombre: string;
  titularApellido: string;
  periodo: string;
  monto: number;
  fechaPago: string;
  medioPago: string;
  saldoPendiente: number;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  recaudacion: DashboardRevenuePoint[];
  actividadReciente: DashboardActivityItem[];
}
