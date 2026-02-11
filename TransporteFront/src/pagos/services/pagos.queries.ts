import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagosApi } from './pagos.api';
import type { RegistrarPagoRequest } from '../types/pago.types';

export const QUERY_KEYS = {
  pagos: ['pagos'] as const,
  pagoById: (id: number) => ['pagos', id] as const,
  pagosPaginados: (mes: number, anio: number, search: string, page: number) => 
    ['pagos', 'paginados', mes, anio, search, page] as const,
  estadisticas: (mes: number, anio: number) => 
    ['pagos', 'estadisticas', mes, anio] as const,
  pagosPorTitular: (titularId: number) => ['pagos', 'titular', titularId] as const,
  vencidos: ['pagos', 'vencidos'] as const,
  pendientes: ['pagos', 'pendientes'] as const,
  titularesConPagos: (search: string, pageNumber: number, pageSize: number) =>
    ['pagos', 'titulares-con-pagos', search, pageNumber, pageSize] as const,
};

/**
 * Hook para obtener todos los pagos mensuales
 */
export function usePagosMensuales() {
  return useQuery({
    queryKey: QUERY_KEYS.pagos,
    queryFn: async () => {
      return await pagosApi.getAll();
    },
  });
}

/**
 * Hook para obtener pagos vencidos
 */
export function usePagosVencidos() {
  return useQuery({
    queryKey: QUERY_KEYS.vencidos,
    queryFn: async () => {
      return await pagosApi.getVencidos();
    },
  });
}

/**
 * Hook para obtener pagos pendientes
 */
export function usePagosPendientes() {
  return useQuery({
    queryKey: QUERY_KEYS.pendientes,
    queryFn: async () => {
      return await pagosApi.getPendientes();
    },
  });
}

/**
 * Hook para obtener un pago mensual por ID
 */
export function usePagoMensualById(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.pagoById(id!),
    queryFn: async () => {
      return await pagosApi.getById(id!);
    },
    enabled: !!id,
  });
}

/**
 * Hook para obtener el detalle completo de un pago mensual (con movimientos)
 * Alias de usePagoMensualById para mayor claridad semántica
 */
export function usePagoDetalle(id: number | null) {
  return usePagoMensualById(id);
}

/**
 * Hook para obtener pagos mensuales paginados filtrados por mes/año
 */
export function usePagosPaginados(
  mes: number | null,
  anio: number | null,
  search: string,
  pageNumber: number,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: QUERY_KEYS.pagosPaginados(mes!, anio!, search, pageNumber),
    queryFn: async () => {
      return await pagosApi.getPaginados({
        mes: mes!,
        anio: anio!,
        search,
        pageNumber,
        pageSize,
      });
    },
    enabled: mes !== null && anio !== null,
    placeholderData: (previousData) => previousData,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook para obtener estadísticas del mes seleccionado
 */
export function useEstadisticasMes(mes: number | null, anio: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.estadisticas(mes!, anio!),
    queryFn: async () => {
      return await pagosApi.getEstadisticas(mes!, anio!);
    },
    enabled: mes !== null && anio !== null,
    staleTime: 30000,
  });
}

/**
 * Hook para obtener los pagos de un titular específico
 */
export function usePagosPorTitular(titularId: number | null) {
  return useQuery({
    queryKey: titularId ? QUERY_KEYS.pagosPorTitular(titularId) : ['pagos', 'titular', 'idle'],
    queryFn: async () => {
      return await pagosApi.getByTitular(titularId!);
    },
    enabled: typeof titularId === 'number',
    staleTime: 0,
  });
}

/**
 * Hook para obtener titulares con cuotas generadas
 */
export function useTitularesConPagos(search: string, pageNumber: number, pageSize: number = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.titularesConPagos(search, pageNumber, pageSize),
    queryFn: async () => {
      return await pagosApi.getTitularesConPagos({
        search,
        pageNumber,
        pageSize,
      });
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });
}

/**
 * Hook para registrar un nuevo pago
 */
export function useRegistrarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RegistrarPagoRequest }) =>
      pagosApi.registrarPago(id, data),
    onSuccess: () => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['pagos'] });
    },
  });
}
