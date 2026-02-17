import type { GastoItem } from '../types/gastos.types';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { GastoCard } from './GastoCard';
import { Spinner } from '../../shared/ui';

interface GastoListSectionProps {
  title: string;
  subtitle: string;
  gastos: GastoItem[];
  totalAmount: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  emptyMessage: string;
}

export const GastoListSection = ({
  title,
  subtitle,
  gastos,
  totalAmount,
  isLoading = false,
  isRefreshing = false,
  emptyMessage,
}: GastoListSectionProps) => {
  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white dark:border-white/10 dark:bg-[#1f1f24]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
          <p className="text-sm text-gray-500">Cargando gastos...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full overflow-hidden rounded-3xl border border-[#e1e8ec] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <header className="flex flex-col gap-4 border-b border-gray-100 pb-4 dark:border-white/5 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-600">{subtitle}</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="w-full text-left md:w-auto md:text-right">
          <p className="text-xs uppercase tracking-widest text-gray-500">Total</p>
          <p className="text-2xl font-bold text-[#0b2e33] dark:text-white">{formatCurrency(totalAmount)}</p>
          {isRefreshing ? (
            <p className="flex items-center justify-end gap-1 text-[11px] font-semibold uppercase tracking-wider text-teal-600">
              <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
              Actualizando
            </p>
          ) : null}
        </div>
      </header>

      {gastos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">inventory_2</span>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {gastos.map((gasto) => (
            <GastoCard key={gasto.id} gasto={gasto} />
          ))}
        </div>
      )}
    </section>
  );
};
