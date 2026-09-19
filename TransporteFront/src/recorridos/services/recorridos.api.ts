import { apiClient } from '../../api/client';
import type { TransporteTipo } from '../../shared/types/transporte.types';
import type {
  AnalisisResponse,
  ColegioResponse,
  ParadaFijaRequest,
  ParadaFijaResponse,
  RecalculoRepartoResponse,
  RecalculoResponse,
  RecorridoResponse,
  UbicacionRequest,
  UbicacionResponse,
} from '../types/recorrido.types';

/**
 * Los recálculos masivos hacen decenas de consultas al motor de ruteo (con pausa entre cada una), así
 * que pueden tardar varios minutos. El timeout global de `apiClient` es de 30 s, por eso solo estos dos
 * pedidos usan uno más largo.
 */
const RECALCULO_TIMEOUT_MS = 10 * 60 * 1000;

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

  getAnalisis: async (): Promise<AnalisisResponse> => {
    return apiClient.get<AnalisisResponse>('/recorridos/analisis');
  },

  recalcularTodos: async (): Promise<RecalculoResponse> => {
    // Se usa la instancia de axios para poder pasar un timeout propio; mantiene baseURL e interceptores.
    const respuesta = await apiClient
      .getAxiosInstance()
      .post<RecalculoResponse>('/recorridos/recalcular', undefined, { timeout: RECALCULO_TIMEOUT_MS });
    return respuesta.data;
  },

  recalcularReparto: async (): Promise<RecalculoRepartoResponse> => {
    const respuesta = await apiClient
      .getAxiosInstance()
      .post<RecalculoRepartoResponse>('/recorridos/recalcular-reparto', undefined, {
        timeout: RECALCULO_TIMEOUT_MS,
      });
    return respuesta.data;
  },

  getParadasFijas: async (): Promise<ParadaFijaResponse[]> => {
    return apiClient.get<ParadaFijaResponse[]>('/recorridos/paradas-fijas');
  },

  putParadaFija: async (
    horarioId: number,
    transporte: TransporteTipo,
    data: ParadaFijaRequest,
  ): Promise<ParadaFijaResponse> => {
    return apiClient.put<ParadaFijaResponse>(
      `/recorridos/horarios/${horarioId}/transportes/${transporte}/parada-fija`,
      data,
    );
  },

  deleteParadaFija: async (horarioId: number, transporte: TransporteTipo): Promise<void> => {
    return apiClient.delete<void>(`/recorridos/horarios/${horarioId}/transportes/${transporte}/parada-fija`);
  },
};
