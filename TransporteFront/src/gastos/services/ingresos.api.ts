import { apiClient } from '../../api/client';
import type {
  ActualizarIngresoFijoRequest,
  CrearIngresoFijoRequest,
  CrearIngresoVariableRequest,
  IngresoItem,
  IngresosResumenMensualResponse,
} from '../types/ingresos.types';

const BASE_PATH = '/ingresos';

export const ingresosApi = {
  async getResumen(mes: number, anio: number): Promise<IngresosResumenMensualResponse> {
    const params = new URLSearchParams({
      mes: mes.toString(),
      anio: anio.toString(),
    });

    return apiClient.get<IngresosResumenMensualResponse>(`${BASE_PATH}/resumen?${params.toString()}`);
  },

  async crearIngresoFijo(payload: CrearIngresoFijoRequest): Promise<IngresoItem> {
    return apiClient.post<IngresoItem, CrearIngresoFijoRequest>(`${BASE_PATH}/fijos`, payload);
  },

  async crearIngresoVariable(payload: CrearIngresoVariableRequest): Promise<IngresoItem> {
    return apiClient.post<IngresoItem, CrearIngresoVariableRequest>(`${BASE_PATH}/variables`, payload);
  },

  async updateIngresoFijo(templateId: number, payload: ActualizarIngresoFijoRequest): Promise<IngresoItem> {
    return apiClient.put<IngresoItem, ActualizarIngresoFijoRequest>(`${BASE_PATH}/fijos/${templateId}`, payload);
  },

  async deleteIngresoFijo(templateId: number): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/fijos/${templateId}`);
  },

  async deleteIngresoVariable(id: number): Promise<void> {
    return apiClient.delete<void>(`${BASE_PATH}/variables/${id}`);
  },
};
