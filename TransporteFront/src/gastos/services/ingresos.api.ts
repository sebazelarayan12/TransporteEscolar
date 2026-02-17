import { apiClient } from '../../api/client';
import type {
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
};
