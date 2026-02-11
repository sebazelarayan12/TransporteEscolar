import { apiClient } from '../../api/client';
import type { TitularFilterRequest, TitularPaginationResponse } from '../../titulares/types/titular.types';
import type {
  PagoMensual,
  RegistrarPagoRequest,
  PagoFilterRequest,
  PagoPaginationResponse,
  EstadisticasMes,
} from '../types/pago.types';
import type { MovimientosFilterRequest, MovimientosPaginationResponse } from '../types/movimientos.types';

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
   * GET /pagosmensuales/titular/{titularId} - Obtiene todos los pagos de un titular
   */
  getByTitular: async (titularId: number): Promise<PagoMensual[]> => {
    return apiClient.get<PagoMensual[]>(`${BASE_PATH}/titular/${titularId}`);
  },

  /**
   * GET /pagosmensuales/titulares-con-pagos - Lista titulares con cuotas generadas (paginado)
   */
  getTitularesConPagos: async (filter: TitularFilterRequest): Promise<TitularPaginationResponse> => {
    const params = new URLSearchParams();
    const trimmedSearch = filter.search?.trim();

    if (trimmedSearch) {
      params.append('search', trimmedSearch);
    }

    if (typeof filter.pageNumber === 'number') {
      params.append('pageNumber', filter.pageNumber.toString());
    }

    if (typeof filter.pageSize === 'number') {
      params.append('pageSize', filter.pageSize.toString());
    }

    const queryString = params.toString();
    const url = queryString
      ? `${BASE_PATH}/titulares-con-pagos?${queryString}`
      : `${BASE_PATH}/titulares-con-pagos`;

    return apiClient.get<TitularPaginationResponse>(url);
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

  /**
   * GET /pagosmensuales/movimientos - Obtiene el historial paginado de movimientos registrados
   */
  getMovimientos: async (filter: MovimientosFilterRequest): Promise<MovimientosPaginationResponse> => {
    const params = new URLSearchParams();

    params.append('fechaDesde', filter.fechaDesde);
    params.append('fechaHasta', filter.fechaHasta);
    params.append('pageNumber', filter.pageNumber.toString());
    params.append('pageSize', filter.pageSize.toString());

    if (typeof filter.titularId === 'number') {
      params.append('titularId', filter.titularId.toString());
    }

    if (filter.medioPago) {
      params.append('medioPago', filter.medioPago);
    }

    return apiClient.get<MovimientosPaginationResponse>(`${BASE_PATH}/movimientos?${params}`);
  },
};
