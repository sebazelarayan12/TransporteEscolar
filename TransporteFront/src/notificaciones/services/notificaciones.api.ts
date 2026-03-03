import { apiClient } from '../../api/client';
import type {
  NotificacionCountResponse,
  NotificacionResponse,
  NotificacionesFilterRequest,
  NotificacionesPaginatedResponse,
  UltimaActualizacionPayload,
} from '../types/notificacion.types';

const BASE_PATH = '/notificaciones';
const ACTUALIZACION_PAGE_SIZE = 50;
const MAX_ACTUALIZACION_LOOKUP_PAGES = 5;

const buildListQuery = (params: NotificacionesFilterRequest = {}) => {
  const searchParams = new URLSearchParams();

  searchParams.append('pageNumber', (params.pageNumber ?? 1).toString());
  searchParams.append('pageSize', (params.pageSize ?? 20).toString());

  if (params.soloNoLeidas) {
    searchParams.append('soloNoLeidas', 'true');
  }

  return searchParams.toString();
};

export const notificacionesApi = {
  /**
   * GET /notificaciones - Obtiene notificaciones paginadas
   */
  getPaginadas: async (params: NotificacionesFilterRequest = {}): Promise<NotificacionesPaginatedResponse> => {
    const query = buildListQuery(params);
    return apiClient.get<NotificacionesPaginatedResponse>(`${BASE_PATH}?${query}`);
  },

  /**
   * GET /notificaciones/no-leidas/count - Obtiene el contador de notificaciones no leídas
   */
  getCountNoLeidas: async (): Promise<NotificacionCountResponse> => {
    return apiClient.get<NotificacionCountResponse>(`${BASE_PATH}/no-leidas/count`);
  },

  /**
   * PUT /notificaciones/{id}/marcar-leida - Marca una notificación como leída
   */
  marcarComoLeida: async (id: number): Promise<void> => {
    return apiClient.put<void>(`${BASE_PATH}/${id}/marcar-leida`);
  },

  /**
   * PUT /notificaciones/marcar-todas-leidas - Marca todas las notificaciones como leídas
   */
  marcarTodasComoLeidas: async (): Promise<void> => {
    return apiClient.put<void>(`${BASE_PATH}/marcar-todas-leidas`);
  },

  /**
   * DELETE /notificaciones/{id} - Elimina una notificación
   */
  eliminar: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`);
  },

  /**
   * PUT /notificaciones/ultima-actualizacion - Publica la última actualización del sistema
   */
  putUltimaActualizacion: async (payload: UltimaActualizacionPayload): Promise<NotificacionResponse> => {
    return apiClient.put<NotificacionResponse, UltimaActualizacionPayload>(`${BASE_PATH}/ultima-actualizacion`, payload);
  },

  /**
   * Busca la última actualización recorriendo páginas de la API de notificaciones
   */
  getUltimaActualizacion: async (): Promise<NotificacionResponse | null> => {
    for (let pageNumber = 1; pageNumber <= MAX_ACTUALIZACION_LOOKUP_PAGES; pageNumber += 1) {
      const query = buildListQuery({ pageNumber, pageSize: ACTUALIZACION_PAGE_SIZE });
      const response = await apiClient.get<NotificacionesPaginatedResponse>(`${BASE_PATH}?${query}`);
      const actualizacion = response.data.find((notificacion) => notificacion.esActualizacionProducto);

      if (actualizacion) {
        return actualizacion;
      }

      if (response.data.length < ACTUALIZACION_PAGE_SIZE) {
        break;
      }
    }

    return null;
  },
};
