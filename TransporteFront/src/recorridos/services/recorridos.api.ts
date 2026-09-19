import { apiClient } from '../../api/client';
import type {
  ColegioResponse,
  RecalculoResponse,
  RecorridoResponse,
  UbicacionRequest,
  UbicacionResponse,
} from '../types/recorrido.types';

export const recorridosApi = {
  /** Devuelve el pin del titular, o null si el backend respondió 204. */
  getUbicacion: async (titularId: number): Promise<UbicacionResponse | null> => {
    const respuesta = await apiClient.get<UbicacionResponse | ''>(`/titulares/${titularId}/ubicacion`);
    return respuesta === '' || respuesta === null ? null : respuesta;
  },

  /** Guarda el pin y dispara el recálculo de recorridos en el backend. */
  putUbicacion: async (titularId: number, data: UbicacionRequest): Promise<UbicacionResponse> => {
    return apiClient.put<UbicacionResponse>(`/titulares/${titularId}/ubicacion`, data);
  },

  deleteUbicacion: async (titularId: number): Promise<void> => {
    return apiClient.delete<void>(`/titulares/${titularId}/ubicacion`);
  },

  getRecorridos: async (titularId: number): Promise<RecorridoResponse[]> => {
    return apiClient.get<RecorridoResponse[]>(`/titulares/${titularId}/recorridos`);
  },

  getColegios: async (): Promise<ColegioResponse[]> => {
    return apiClient.get<ColegioResponse[]>('/recorridos/colegios');
  },

  recalcularTodos: async (): Promise<RecalculoResponse> => {
    return apiClient.post<RecalculoResponse>('/recorridos/recalcular');
  },
};
