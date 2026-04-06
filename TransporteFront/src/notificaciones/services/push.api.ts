import { apiClient } from '../../api/client';

interface PushVapidResponse {
  publicKey: string;
}

interface PushSubscribeRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}

interface PushUnsubscribeRequest {
  endpoint: string;
}

const BASE_PATH = '/push-subscriptions';

export const pushApi = {
  /**
   * GET /push-subscriptions/vapid-public-key
   * Obtiene la clave publica VAPID del servidor
   */
  getVapidPublicKey: async (): Promise<PushVapidResponse> => {
    return apiClient.get<PushVapidResponse>(`${BASE_PATH}/vapid-public-key`);
  },

  /**
   * POST /push-subscriptions/subscribe
   * Envia la suscripcion del navegador al backend
   */
  subscribe: async (data: PushSubscribeRequest): Promise<void> => {
    return apiClient.post<void, PushSubscribeRequest>(`${BASE_PATH}/subscribe`, data);
  },

  /**
   * POST /push-subscriptions/unsubscribe
   * Elimina la suscripcion del navegador en el backend
   */
  unsubscribe: async (data: PushUnsubscribeRequest): Promise<void> => {
    return apiClient.post<void, PushUnsubscribeRequest>(`${BASE_PATH}/unsubscribe`, data);
  },
};
