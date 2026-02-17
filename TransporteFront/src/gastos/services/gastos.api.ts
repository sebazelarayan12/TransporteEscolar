import { apiClient } from '../../api/client';
import type {
  CrearGastoFijoRequest,
  CrearGastoVariableRequest,
  GastoItem,
  ResumenMensualResponse,
} from '../types/gastos.types';

const BASE_PATH = '/gastos';

export const gastosApi = {
  async getResumen(mes: number, anio: number): Promise<ResumenMensualResponse> {
    const params = new URLSearchParams({
      mes: mes.toString(),
      anio: anio.toString(),
    });

    return apiClient.get<ResumenMensualResponse>(`${BASE_PATH}/resumen?${params.toString()}`);
  },

  async crearGastoFijo(payload: CrearGastoFijoRequest): Promise<GastoItem> {
    return apiClient.post<GastoItem, CrearGastoFijoRequest>(`${BASE_PATH}/fijos`, payload);
  },

  async crearGastoVariable(payload: CrearGastoVariableRequest): Promise<GastoItem> {
    return apiClient.post<GastoItem, CrearGastoVariableRequest>(`${BASE_PATH}/variables`, payload);
  },
};
