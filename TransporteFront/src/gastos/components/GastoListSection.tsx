import { formatCurrency } from '../../shared/utils/currency.helpers';
import { Spinner } from '../../shared/ui';
import { GastoCard } from './GastoCard';
import { GASTO_TIPOS, type GastoItem } from '../types/gastos.types';

interface GastoListSectionProps {
  title: string;
  subtitle: string;
  gastos: GastoItem[];
  totalAmount: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  emptyMessage: string;
  onEditGasto?: (gasto: GastoItem) => void;
  onDeleteGasto?: (gasto: GastoItem) => void;
  actionsDisabled?: boolean;
  onMarkVariablePaid?: (gasto: GastoItem) => void;
  markPaidDisabled?: boolean;
}

export const GastoListSection = ({
  title,
  subtitle,
  gastos,
  totalAmount,
  isLoading = false,
  isRefreshing = false,
  emptyMessage,
  onEditGasto,
  onDeleteGasto,
  actionsDisabled = false,
  onMarkVariablePaid,
  markPaidDisabled = false,
}: GastoListSectionProps) => {
  const hasGastos = gastos.length > 0;
  const isVariableSection = hasGastos && gastos.every((gasto) => gasto.tipo === GASTO_TIPOS.VARIABLE);
  const sortedGastos = hasGastos
    ? [...gastos].sort((a, b) => {
        if (isVariableSection) {
          return new Date(b.fechaCuota).getTime() - new Date(a.fechaCuota).getTime();
        }
        return a.descripcion.localeCompare(b.descripcion, 'es');
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-900/60">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
          <p className="text-sm text-slate-500 dark:text-slate-300">Cargando gastos...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full rounded-[36px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <header className="flex flex-col gap-4 border-b border-slate-200/70 pb-4 dark:border-white/5 md:flex-row md:flex-wrap md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal-600 dark:text-teal-300">{subtitle}</p>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="w-full text-left md:w-auto md:text-right">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Total</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</p>
          {isRefreshing ? (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-300">
              <span className="material-symbols-rounded text-sm animate-spin" aria-hidden>
                progress_activity
              </span>
              Actualizando
            </p>
          ) : null}
        </div>
      </header>

      {!hasGastos ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <span className="material-symbols-rounded text-5xl text-slate-300 dark:text-slate-500" aria-hidden>
            inventory_2
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {sortedGastos.map((gasto) => (
            <GastoCard
              key={gasto.id}
              gasto={gasto}
              onEdit={onEditGasto}
              onDelete={onDeleteGasto}
              actionsDisabled={actionsDisabled}
              onMarkVariablePaid={onMarkVariablePaid}
              markPaidDisabled={markPaidDisabled}
            />
          ))}
        </div>
      )}
    </section>
  );
};
