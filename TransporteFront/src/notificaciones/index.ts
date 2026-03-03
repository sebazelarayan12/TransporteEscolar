// Components
export { ActualizacionProductoCard, NotificacionItem, NotificacionesDropdown } from './components';

// Services
export { notificacionesApi } from './services/notificaciones.api';
export {
  notificacionesKeys,
  useNotificaciones,
  useNotificacionesCountNoLeidas,
  useMarcarNotificacionLeida,
  useMarcarTodasNotificacionesLeidas,
  useEliminarNotificacion,
  useUltimaActualizacionNotificacion,
  useGuardarUltimaActualizacion,
} from './services/notificaciones.queries';

// Types
export type {
  NotificacionTipo,
  NotificacionResponse,
  NotificacionCountResponse,
  NotificacionesFilterRequest,
  NotificacionesPaginatedResponse,
  UltimaActualizacionPayload,
} from './types/notificacion.types';

// Constants
export { NOTIFICACION_CONFIG, POLLING_INTERVAL_MS } from './constants/notificacion.constants';
