import { formatCurrency } from '../../shared/utils/currency.helpers';
import type { DashboardSummary } from '../types/dashboard.types';

interface DashboardSummaryKpisProps {
  summary?: DashboardSummary;
  isLoading: boolean;
}

const renderSkeleton = (className: string) => (
  <span className={`inline-block animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`} />
);

export const DashboardSummaryKpis = ({ summary, isLoading }: DashboardSummaryKpisProps) => {
  const showSummarySkeleton = isLoading && !summary;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="relative overflow-hidden rounded-2xl border border-[#d9e3e8] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
        <div className="absolute -right-10 -top-6 h-28 w-28 rounded-full bg-[#1d8ca5]/10" />
        <div className="relative space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1d8ca5]/10 text-[#1d8ca5]">
            <span className="material-symbols-outlined text-[24px]">pending_actions</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pagos pendientes</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-[#0f181a] dark:text-white">
              {showSummarySkeleton ? renderSkeleton('h-8 w-24') : summary ? formatCurrency(summary.totalPendiente) : '--'}
            </span>
            <span className="text-xs font-bold text-[#1d8ca5]">
              {showSummarySkeleton
                ? renderSkeleton('h-4 w-16')
                : summary
                  ? `${summary.cantidadPendiente} cuentas`
                  : '--'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#d9e3e8] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
        <div className="absolute -right-10 -top-6 h-28 w-28 rounded-full bg-rose-500/10" />
        <div className="relative space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pagos vencidos</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-[#0f181a] dark:text-white">
              {showSummarySkeleton ? renderSkeleton('h-8 w-24') : summary ? formatCurrency(summary.totalVencido) : '--'}
            </span>
            <span className="text-xs font-bold text-rose-500">
              {showSummarySkeleton
                ? renderSkeleton('h-4 w-16')
                : summary
                  ? `${summary.cantidadVencido} cuentas`
                  : '--'}
            </span>
          </div>
        </div>
      </div>

      <div className="md:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-[#d9e3e8] bg-white px-5 py-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
            <span className="material-symbols-outlined text-[22px]">supervisor_account</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0f181a] dark:text-white">
              {showSummarySkeleton ? renderSkeleton('h-7 w-16') : summary ? summary.titularesActivos : '--'}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Titulares activos</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-[#d9e3e8] bg-white px-5 py-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0f181a] dark:text-white">
              {showSummarySkeleton ? renderSkeleton('h-7 w-16') : summary ? summary.pasajerosActivos : '--'}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Pasajeros</p>
          </div>
        </div>
      </div>
    </section>
  );
};
