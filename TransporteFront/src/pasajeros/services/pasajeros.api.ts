import { apiClient } from '../../api/client';
import type {
  PasajeroResponse,
  PasajeroRequest,
  PasajeroUpdateRequest,
} from '../types/pasajero.types';

/**
 * API de Pasajeros - Mapeo de endpoints del backend
 * Base: /pasajeros
 */

export const pasajerosApi = {
  /**
   * GET /pasajeros - Obtiene todos los pasajeros
   */
  getAll: async (): Promise<PasajeroResponse[]> => {
    return apiClient.get<PasajeroResponse[]>('/pasajeros');
  },

  /**
   * GET /pasajeros/activos - Obtiene solo pasajeros activos
   */
  getActivos: async (): Promise<PasajeroResponse[]> => {
    return apiClient.get<PasajeroResponse[]>('/pasajeros/activos');
  },

  /**
   * GET /pasajeros/titular/{titularId} - Obtiene pasajeros por titular
   */
  getByTitular: async (titularId: number): Promise<PasajeroResponse[]> => {
    return apiClient.get<PasajeroResponse[]>(`/pasajeros/titular/${titularId}`);
  },

  /**
   * GET /pasajeros/{id} - Obtiene un pasajero por ID
   */
  getById: async (id: number): Promise<PasajeroResponse> => {
    return apiClient.get<PasajeroResponse>(`/pasajeros/${id}`);
  },

  /**
   * POST /pasajeros - Crea un nuevo pasajero
   */
  create: async (data: PasajeroRequest): Promise<PasajeroResponse> => {
    return apiClient.post<PasajeroResponse>('/pasajeros', data);
  },

  /**
   * PUT /pasajeros/{id} - Actualiza un pasajero existente
   */
  update: async (id: number, data: PasajeroUpdateRequest): Promise<void> => {
    return apiClient.put<void>(`/pasajeros/${id}`, data);
  },

  /**
   * DELETE /pasajeros/{id} - Baja lógica de un pasajero
   */
  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/pasajeros/${id}`);
  },
};
