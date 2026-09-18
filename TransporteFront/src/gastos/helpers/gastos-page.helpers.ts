import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { GASTO_ESTADOS, type GastoEstadoPago, type GastoItem, type ResumenMensualResponse } from '../types/gastos.types';
import type { IngresosResumenMensualResponse } from '../types/ingresos.types';

export const getErrorMessage = (error: unknown, fallback: string): string =>
  error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message) : fallback;

const sumMontoByEstado = (items: GastoItem[], estado: GastoEstadoPago) =>
  items.filter((item) => item.estadoPago === estado).reduce((acc, item) => acc + item.monto, 0);

/** Listas del resumen, tolerando que el backend omita alguna. */
export const getResumenLists = (gastos: ResumenMensualResponse, ingresos: IngresosResumenMensualResponse) => ({
  gastosFijos: gastos.gastosFijos ?? [],
  gastosVariables: gastos.gastosVariables ?? [],
  ingresosFijos: ingresos.ingresosFijos ?? [],
  ingresosVariables: ingresos.ingresosVariables ?? [],
});

export const buildHeroTotals = (gastos: ResumenMensualResponse, ingresos: IngresosResumenMensualResponse) => ({
  totalCuotas: gastos.totales.totalCuotas,
  totalGastosFijos: gastos.totales.totalGastosFijos,
  totalGastosVariables: gastos.totales.totalGastosVariables,
  totalIngresosExternos: ingresos.totales.totalIngresosExternos,
  totalIngresosFijos: ingresos.totales.totalIngresosFijos,
  totalIngresosVariables: ingresos.totales.totalIngresosVariables,
  gastosVariablesPendientes: sumMontoByEstado(gastos.gastosVariables ?? [], GASTO_ESTADOS.PENDIENTE),
  gastosVariablesPagados: sumMontoByEstado(gastos.gastosVariables ?? [], GASTO_ESTADOS.PAGADO),
});

export const buildMarkPaidMessage = (target: GastoItem | null): string => {
  if (!target) return '';
  const fecha = formatDateOnly(target.fechaCuota, { day: '2-digit', month: 'long' });
  return `Confirmá que "${target.descripcion}" del ${fecha} por ${formatCurrency(target.monto)} ya fue pagado.`;
};
