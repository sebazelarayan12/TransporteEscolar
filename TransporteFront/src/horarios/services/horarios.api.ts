import { apiClient } from '../../api/client';
import type {
  HorarioResponse,
  HorarioPasajerosResponse,
  HorarioAsignacionRequest,
  HorarioActualizarRequest,
  HorarioCrearRequest,
} from '../types/horario.types';

export const horariosApi = {
  /** Obtiene los horarios. Por defecto solo los activos. */
  getHorarios: async (incluirInactivos = false): Promise<HorarioResponse[]> => {
    return apiClient.get<HorarioResponse[]>(incluirInactivos ? '/horarios?incluirInactivos=true' : '/horarios');
  },

  /** Crea un horario nuevo. Si no se indica el orden, el backend usa el siguiente disponible. */
  crear: async (data: HorarioCrearRequest): Promise<HorarioResponse> => {
    return apiClient.post<HorarioResponse, HorarioCrearRequest>('/horarios', data);
  },

  /** Edita un horario. El backend rechaza cambiar colegio o sentido si tiene pasajeros activos. */
  actualizar: async (id: number, data: HorarioActualizarRequest): Promise<HorarioResponse> => {
    return apiClient.put<HorarioResponse, HorarioActualizarRequest>(`/horarios/${id}`, data);
  },

  /** Baja lógica: el horario se desactiva, no se borra. */
  desactivar: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/horarios/${id}`);
  },

  reactivar: async (id: number): Promise<void> => {
    return apiClient.post<void>(`/horarios/${id}/reactivar`);
  },

  /** Obtiene el detalle de pasajeros asignados a un horario */
  getPasajeros: async (horarioId: number): Promise<HorarioPasajerosResponse> => {
    return apiClient.get<HorarioPasajerosResponse>(`/horarios/${horarioId}/pasajeros`);
  },

  /** Asigna pasajeros a un horario */
  asignarPasajeros: async (horarioId: number, data: HorarioAsignacionRequest): Promise<void> => {
    return apiClient.put<void>(`/horarios/${horarioId}/asignaciones`, data);
  },
};
