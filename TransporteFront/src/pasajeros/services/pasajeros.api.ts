import { apiClient } from '../../api/client';
import type {
  PasajeroResponse,
  PasajeroRequest,
  PasajeroUpdateRequest,
  PasajeroFilterRequest,
  PasajeroPaginationResponse,
  PasajeroHorarioAsignacionPayload,
  PasajeroSinHorarioResponse,
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
   * GET /pasajeros/sin-horarios - Obtiene pasajeros sin horarios asignados
   */
  getSinHorarios: async (): Promise<PasajeroSinHorarioResponse[]> => {
    return apiClient.get<PasajeroSinHorarioResponse[]>('/pasajeros/sin-horarios');
  },

  /**
   * GET /pasajeros/activos-disponibles?anio=YYYY - Pasajeros activos sin reinscripción confirmada en el año
   */
  getActivosDisponibles: async (anio: number): Promise<PasajeroResponse[]> => {
    return apiClient.get<PasajeroResponse[]>(`/pasajeros/activos-disponibles?anio=${anio}`);
  },

  /**
   * GET /pasajeros/paginados - Obtiene pasajeros activos con paginación
   */
  getPaginados: async (filter: PasajeroFilterRequest): Promise<PasajeroPaginationResponse> => {
    const params = new URLSearchParams();
    if (filter.search) params.append('search', filter.search);
    if (filter.pageNumber) params.append('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params.append('pageSize', filter.pageSize.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/pasajeros/paginados?${queryString}` : '/pasajeros/paginados';
    
    return apiClient.get<PasajeroPaginationResponse>(url);
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

  /**
   * POST /pasajeros/{id}/horarios - Asigna un horario al pasajero
   */
  addHorario: async (id: number, data: PasajeroHorarioAsignacionPayload): Promise<void> => {
    return apiClient.post<void>(`/pasajeros/${id}/horarios`, data);
  },

  /**
   * DELETE /pasajeros/{id}/horarios/{horarioId} - Quita un horario específico
   */
  deleteHorario: async (id: number, horarioId: number): Promise<void> => {
    return apiClient.delete<void>(`/pasajeros/${id}/horarios/${horarioId}`);
  },
};
