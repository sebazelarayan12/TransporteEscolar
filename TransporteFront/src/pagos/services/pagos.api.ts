import { apiClient } from '../../api/client';
import type { PagoMensual, RegistrarPagoRequest, PagoFilterRequest, PagoPaginationResponse, EstadisticasMes } from '../types/pago.types';

const BASE_PATH = '/pagosmensuales';

export const pagosApi = {
  /**
   * GET /pagosmensuales - Obtiene todos los pagos mensuales
   */
  getAll: async (): Promise<PagoMensual[]> => {
    return apiClient.get<PagoMensual[]>(BASE_PATH);
  },

  /**
   * GET /pagosmensuales/vencidos - Obtiene solo pagos vencidos
   */
  getVencidos: async (): Promise<PagoMensual[]> => {
    return apiClient.get<PagoMensual[]>(`${BASE_PATH}/vencidos`);
  },

  /**
   * GET /pagosmensuales/pendientes - Obtiene solo pagos pendientes
   */
  getPendientes: async (): Promise<PagoMensual[]> => {
    return apiClient.get<PagoMensual[]>(`${BASE_PATH}/pendientes`);
  },

  /**
   * GET /pagosmensuales/{id} - Obtiene un pago mensual por ID con sus movimientos
   */
  getById: async (id: number): Promise<PagoMensual> => {
    return apiClient.get<PagoMensual>(`${BASE_PATH}/${id}`);
  },

  /**
   * POST /pagosmensuales/{id}/registrar-pago - Registra un nuevo pago/movimiento
   */
  registrarPago: async (id: number, data: RegistrarPagoRequest): Promise<void> => {
    return apiClient.post<void>(`${BASE_PATH}/${id}/registrar-pago`, data);
  },

  /**
   * GET /pagosmensuales/paginados - Obtiene pagos mensuales paginados filtrados por mes/año
   */
  getPaginados: async (params: PagoFilterRequest): Promise<PagoPaginationResponse> => {
    const searchParams = new URLSearchParams({
      mes: params.mes.toString(),
      anio: params.anio.toString(),
      pageNumber: params.pageNumber.toString(),
      pageSize: params.pageSize.toString(),
    });
    
    if (params.search && params.search.trim()) {
      searchParams.append('search', params.search.trim());
    }
    
    return apiClient.get<PagoPaginationResponse>(`${BASE_PATH}/paginados?${searchParams}`);
  },

  /**
   * GET /pagosmensuales/estadisticas - Obtiene estadísticas del mes seleccionado
   */
  getEstadisticas: async (mes: number, anio: number): Promise<EstadisticasMes> => {
    const searchParams = new URLSearchParams({
      mes: mes.toString(),
      anio: anio.toString(),
    });
    
    return apiClient.get<EstadisticasMes>(`${BASE_PATH}/estadisticas?${searchParams}`);
  },
};
