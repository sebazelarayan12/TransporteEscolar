import { apiClient } from '../../api/client';
import type {
  ConfirmarDiciembreRequest,
  DiciembreResponse,
  DiciembreTitularItem,
} from '../types/diciembre.types';

const BASE_PATH = '/diciembre';

export const diciembreApi = {
  /**
   * GET /diciembre?anio=YYYY - Titulares activos con su decisión de diciembre
   */
  getList: async (anio: number): Promise<DiciembreResponse> => {
    return apiClient.get<DiciembreResponse>(BASE_PATH, { anio });
  },

  /**
   * PUT /diciembre/titulares/{titularId} - Registra si el titular va en diciembre y su monto
   */
  confirmar: async (titularId: number, body: ConfirmarDiciembreRequest): Promise<DiciembreTitularItem> => {
    return apiClient.put<DiciembreTitularItem, ConfirmarDiciembreRequest>(
      `${BASE_PATH}/titulares/${titularId}`,
      body,
    );
  },
};
