import { apiClient } from '../../api/client';
import type { ReinscripcionDetallada, CrearReinscripcionRequest } from '../types/reinscripcion.types';

const BASE_PATH = '/reinscripciones';

export const reinscripcionesApi = {
  /**
   * GET /reinscripciones?anio=2024 - Obtiene todas las reinscripciones de un año
   */
  getAll: async (anio: number): Promise<ReinscripcionDetallada[]> => {
    return apiClient.get<ReinscripcionDetallada[]>(`${BASE_PATH}?anio=${anio}`);
  },

  /**
   * GET /reinscripciones/{id} - Obtiene una reinscripción por ID
   */
  getById: async (id: number): Promise<ReinscripcionDetallada> => {
    return apiClient.get<ReinscripcionDetallada>(`${BASE_PATH}/${id}`);
  },

  /**
   * POST /reinscripciones - Crea una nueva reinscripción
   */
  create: async (data: CrearReinscripcionRequest): Promise<ReinscripcionDetallada> => {
    return apiClient.post<ReinscripcionDetallada>(BASE_PATH, data);
  },

  /**
   * PATCH /reinscripciones/{id}/confirmar - Confirma una reinscripción
   */
  confirmar: async (id: number): Promise<void> => {
    return apiClient.patch<void>(`${BASE_PATH}/${id}/confirmar`);
  },

  /**
   * PATCH /reinscripciones/{id}/no-continua - Marca como "No Continúa"
   */
  marcarComoNoContinua: async (id: number): Promise<void> => {
    return apiClient.patch<void>(`${BASE_PATH}/${id}/no-continua`);
  },
};
