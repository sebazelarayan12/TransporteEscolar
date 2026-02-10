import { apiClient } from '../../api/client';
import type {
  TitularResponse,
  TitularRequest,
  TitularUpdateRequest,
  TitularSelectorItem,
  TitularTelefonoResponse,
  TitularTelefonoRequest,
  TitularFilterRequest,
  TitularPaginationResponse,
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
   * GET /titulares/paginados - Obtiene titulares activos con paginación
   */
  getPaginados: async (filter: TitularFilterRequest): Promise<TitularPaginationResponse> => {
    const params = new URLSearchParams();
    if (filter.search) params.append('search', filter.search);
    if (filter.pageNumber) params.append('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/titulares/paginados?${queryString}` : '/titulares/paginados';
    
    return apiClient.get<TitularPaginationResponse>(url);
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

  /**
   * POST /titulares/{id}/reactivar - Reactiva un titular dado de baja
   */
  reactivate: async (id: number): Promise<void> => {
    return apiClient.post<void>(`/titulares/${id}/reactivar`);
  },

  /**
   * GET /titulares/{id}/telefonos - Obtiene teléfonos del titular
   */
  getTelefonos: async (id: number): Promise<TitularTelefonoResponse[]> => {
    return apiClient.get<TitularTelefonoResponse[]>(`/titulares/${id}/telefonos`);
  },

  /**
   * POST /titulares/{id}/telefonos - Agrega un teléfono al titular
   */
  addTelefono: async (id: number, data: TitularTelefonoRequest): Promise<TitularTelefonoResponse> => {
    return apiClient.post<TitularTelefonoResponse, TitularTelefonoRequest>(
      `/titulares/${id}/telefonos`,
      data
    );
  },

  /**
   * PUT /titulares/{id}/telefonos/{telefonoId}/marcar-principal - Marca un teléfono como principal
   */
  markTelefonoPrincipal: async (titularId: number, telefonoId: number): Promise<void> => {
    return apiClient.put<void>(`/titulares/${titularId}/telefonos/${telefonoId}/marcar-principal`);
  },

  /**
   * PUT /titulares/{id}/telefonos/{telefonoId} - Actualiza un teléfono existente
   */
  updateTelefono: async (
    titularId: number,
    telefonoId: number,
    numeroE164: string
  ): Promise<void> => {
    return apiClient.put<void>(
      `/titulares/${titularId}/telefonos/${telefonoId}`,
      { numeroE164 }
    );
  },
};
