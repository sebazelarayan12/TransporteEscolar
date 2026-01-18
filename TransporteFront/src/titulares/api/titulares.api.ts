import { apiClient } from '../../api/client';
import type {
  TitularResponse,
  TitularRequest,
  TitularUpdateRequest,
  TitularSelectorItem,
} from '../types/titular.types';

/**
 * API de Titulares - Mapeo de endpoints del backend
 * Base: /titulares
 */

export const titularesApi = {
  /**
   * GET /titulares - Obtiene todos los titulares
   */
  getAll: async (): Promise<TitularResponse[]> => {
    return apiClient.get<TitularResponse[]>('/titulares');
  },

  /**
   * GET /titulares/activos - Obtiene solo titulares activos
   */
  getActivos: async (): Promise<TitularResponse[]> => {
    return apiClient.get<TitularResponse[]>('/titulares/activos');
  },

  /**
   * GET /titulares/selector - Para dropdowns
   */
  getSelector: async (): Promise<TitularSelectorItem[]> => {
    return apiClient.get<TitularSelectorItem[]>('/titulares/selector');
  },

  /**
   * GET /titulares/{id} - Obtiene un titular por ID
   */
  getById: async (id: number): Promise<TitularResponse> => {
    return apiClient.get<TitularResponse>(`/titulares/${id}`);
  },

  /**
   * POST /titulares - Crea un nuevo titular
   */
  create: async (data: TitularRequest): Promise<TitularResponse> => {
    return apiClient.post<TitularResponse>('/titulares', data);
  },

  /**
   * PUT /titulares/{id} - Actualiza un titular existente
   */
  update: async (id: number, data: TitularUpdateRequest): Promise<void> => {
    return apiClient.put<void>(`/titulares/${id}`, data);
  },

  /**
   * DELETE /titulares/{id} - Baja lógica de un titular
   */
  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/titulares/${id}`);
  },
};
