import { formatCurrency } from '../../shared/utils/currency.helpers';
import type { DashboardRevenuePoint } from '../types/dashboard.types';

interface DashboardRecaudacionChartProps {
  chartData: DashboardRevenuePoint[];
  isLoading: boolean;
}

const formatMonth = (anio: number, mes: number) =>
  new Date(anio, mes - 1)
    .toLocaleString('es-AR', { month: 'short' })
    .replace('.', '');

export const DashboardRecaudacionChart = ({ chartData, isLoading }: DashboardRecaudacionChartProps) => {
  const showChartSkeleton = isLoading && chartData.length === 0;
  const chartTotals = chartData.map((point) => point.totalGenerado || point.totalPagado || 0);
  const maxValue = Math.max(0, ...chartTotals) || 1;

  return (
    <section className="rounded-3xl border border-[#e1e8ec] bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#0f181a] dark:text-white">Recaudación</h3>
          <p className="text-xs text-gray-500">Ciclo lectivo (Mar-Dic)</p>
        </div>
        <div className="ml-auto flex rounded-2xl border border-[#e1e8ec] bg-[#f6f8f8] p-1 dark:border-white/5 dark:bg-[#0f1416] w-full sm:w-auto">
          <button
            type="button"
            className="flex-1 rounded-xl bg-white px-4 py-1.5 text-xs font-semibold text-[#0f181a] shadow-sm dark:bg-[#0f1416] dark:text-white sm:flex-none"
          >
            Mensual
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl px-4 py-1.5 text-xs font-semibold text-gray-500 transition hover:text-[#0f181a] dark:text-gray-400 sm:flex-none"
          >
            Anual
          </button>
        </div>
      </div>
      <div className="flex h-48 items-end gap-2 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar sm:gap-3 sm:overflow-x-visible sm:mx-0 sm:px-0">
        {showChartSkeleton &&
          Array.from({ length: 10 }).map((_, index) => (
            <div key={`chart-skeleton-${index}`} className="flex min-w-[40px] flex-1 flex-col items-center gap-2 sm:min-w-0">
              <div className="relative w-full rounded-2xl bg-[#e9eff2] dark:bg-white/5" style={{ height: '160px' }}>
                <div
                  className="absolute inset-x-0 bottom-0 rounded-2xl bg-[#8ed2df] dark:bg-white/10 animate-pulse"
                  style={{ height: `${40 + index * 5}%` }}
                />
              </div>
              <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-600 animate-pulse">---</span>
            </div>
          ))}
        {!showChartSkeleton &&
          chartData.map((point, index) => {
            const percent = Math.min(((point.totalPagado ?? 0) / maxValue) * 100, 100);
            const isLatest = index === chartData.length - 1;
            return (
              <div key={`${point.anio}-${point.mes}`} className="flex min-w-[40px] flex-1 flex-col items-center gap-2 sm:min-w-0">
                <div className="relative w-full rounded-2xl bg-[#e9eff2] dark:bg-white/5" style={{ height: '160px' }}>
                  {isLatest && point.totalPagado > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-[#0f181a] px-2 py-1 text-[10px] font-semibold text-white shadow-sm dark:bg-white/10 dark:text-white">
                      {formatCurrency(point.totalPagado)}
                    </div>
                  )}
                  <div
                    className={`absolute inset-x-0 bottom-0 rounded-2xl ${
                      isLatest
                        ? 'bg-[#1d8ca5] shadow-[0_8px_20px_rgba(29,140,165,0.35)]'
                        : 'bg-[#8ed2df] dark:bg-[#38bdf8]'
                    }`}
                    style={{ height: `${percent}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    isLatest ? 'text-[#1d8ca5]' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {formatMonth(point.anio, point.mes)}
                </span>
              </div>
            );
          })}
        {!showChartSkeleton && chartData.length === 0 && (
          <div className="flex w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No hay datos de recaudación disponibles
          </div>
        )}
      </div>
    </section>
  );
};
