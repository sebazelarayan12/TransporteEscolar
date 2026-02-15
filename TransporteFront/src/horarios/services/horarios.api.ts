import { apiClient } from '../../api/client';
import type {
  HorarioResponse,
  HorarioPasajerosResponse,
  HorarioAsignacionRequest,
} from '../types/horario.types';

export const horariosApi = {
  /** Obtiene todos los horarios disponibles */
  getHorarios: async (): Promise<HorarioResponse[]> => {
    return apiClient.get<HorarioResponse[]>('/horarios');
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
