/**
 * Tipos de notificación soportados por el sistema
 */
export const NOTIFICACION_TIPOS = {
  PAGO_REGISTRADO: 'PAGO_REGISTRADO',
  AJUSTE_MONTO: 'AJUSTE_MONTO',
  REINSCRIPCION: 'REINSCRIPCION',
  TITULAR_CREADO: 'TITULAR_CREADO',
  PASAJERO_CREADO: 'PASAJERO_CREADO',
} as const;

export type NotificacionTipo = (typeof NOTIFICACION_TIPOS)[keyof typeof NOTIFICACION_TIPOS];

/**
 * Respuesta de una notificación individual del backend
 */
export interface NotificacionResponse {
  id: number;
  tipo: NotificacionTipo;
  titulo: string;
  mensaje: string;
  fechaCreacion: string;
  leida: boolean;
  fechaLectura: string | null;
  entidadTipo: string | null;
  entidadId: number | null;
}

/**
 * Respuesta del contador de notificaciones no leídas
 */
export interface NotificacionCountResponse {
  count: number;
}

/**
 * Parámetros de filtrado para obtener notificaciones paginadas
 */
export interface NotificacionesFilterRequest {
  pageNumber?: number;
  pageSize?: number;
  soloNoLeidas?: boolean;
}

/**
 * Respuesta paginada de notificaciones
 */
export interface NotificacionesPaginatedResponse {
  data: NotificacionResponse[];
  totalCount: number;
}
