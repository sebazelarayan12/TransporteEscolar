import { apiClient } from '../../api/client';
import type { DashboardResponse } from '../types/dashboard.types';

export interface DashboardResumenParams {
  mesesHistorico?: number;
  limiteActividad?: number;
}

export const dashboardApi = {
  getResumen: async (params?: DashboardResumenParams): Promise<DashboardResponse> => {
    const mesesHistorico = params?.mesesHistorico ?? 6;
    const limiteActividad = params?.limiteActividad ?? 6;

    const queryParams = new URLSearchParams();
    queryParams.set('mesesHistorico', mesesHistorico.toString());
    queryParams.set('limiteActividad', limiteActividad.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/dashboard/resumen?${queryString}` : '/dashboard/resumen';

    return apiClient.get<DashboardResponse>(url);
  },
};
