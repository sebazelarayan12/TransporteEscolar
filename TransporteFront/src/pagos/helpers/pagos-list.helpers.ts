import { getPagoEstado } from './periodo.helpers';
import type { EstadisticasMes, PagoMensual, PagosEstadoFiltro } from '../types/pago.types';

export const PAGOS_PAGE_SIZE = 20;

export const ESTADO_FILTRO_LABELS: Record<PagosEstadoFiltro, string> = {
  todos: 'todos los estados',
  pendiente: 'pendientes',
  pagado: 'pagados',
  vencido: 'vencidos',
};

export const filterPagosByEstado = (pagos: PagoMensual[], estadoFiltro: PagosEstadoFiltro): PagoMensual[] =>
  estadoFiltro === 'todos' ? pagos : pagos.filter((pago) => getPagoEstado(pago) === estadoFiltro);

export const buildFilterCounts = (
  estadisticas: EstadisticasMes | undefined,
  totalCount: number,
): Record<PagosEstadoFiltro, number> => ({
  todos: estadisticas?.totalPagos ?? totalCount,
  pendiente: estadisticas?.cantidadPendientes ?? 0,
  pagado: estadisticas?.cantidadPagados ?? 0,
  vencido: estadisticas?.cantidadVencidos ?? 0,
});
