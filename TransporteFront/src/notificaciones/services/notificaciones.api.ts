import { apiClient } from '../../api/client';
import type {
  NotificacionCountResponse,
  NotificacionesFilterRequest,
  NotificacionesPaginatedResponse,
} from '../types/notificacion.types';

const BASE_PATH = '/notificaciones';

export const notificacionesApi = {
  /**
   * GET /notificaciones - Obtiene notificaciones paginadas
   */
  getPaginadas: async (params: NotificacionesFilterRequest = {}): Promise<NotificacionesPaginatedResponse> => {
    const searchParams = new URLSearchParams();

    searchParams.append('pageNumber', (params.pageNumber ?? 1).toString());
    searchParams.append('pageSize', (params.pageSize ?? 20).toString());

    if (params.soloNoLeidas) {
      searchParams.append('soloNoLeidas', 'true');
    }

    return apiClient.get<NotificacionesPaginatedResponse>(`${BASE_PATH}?${searchParams}`);
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
};
