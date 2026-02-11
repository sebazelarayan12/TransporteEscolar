import { apiClient } from '../../api/client';
import type {
  ReinscripcionDetallada,
  CrearReinscripcionRequest,
  ReinscripcionListParams,
  ReinscripcionListResponse,
} from '../types/reinscripcion.types';

const BASE_PATH = '/reinscripciones';

export const reinscripcionesApi = {
  /**
   * GET /reinscripciones - Obtiene las reinscripciones filtradas/paginadas por año + estado
   */
  getAll: async (params: ReinscripcionListParams): Promise<ReinscripcionListResponse> => {
    const searchParams = new URLSearchParams({
      anio: params.anio.toString(),
      mes: params.mes.toString(),
      estado: params.estado,
      pageNumber: params.pageNumber.toString(),
      pageSize: params.pageSize.toString(),
    });

    return apiClient.get<ReinscripcionListResponse>(`${BASE_PATH}?${searchParams.toString()}`);
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

  /**
   * PATCH /reinscripciones/{id}/pendiente - Marca como "Pendiente"
   */
  marcarComoPendiente: async (id: number): Promise<void> => {
    return apiClient.patch<void>(`${BASE_PATH}/${id}/pendiente`);
  },
};
