import type { PagosEstadoFiltro } from '../types/pago.types';
import { formatNumber } from '../../shared/utils/number.helpers';

interface PagosStatusFiltersProps {
  totalPeriodo: number;
  matchingCount: number;
  estadoSeleccionado: PagosEstadoFiltro;
  onEstadoSelect: (estado: PagosEstadoFiltro) => void;
  counts: Record<PagosEstadoFiltro, number>;
}

type FilterDescriptor = {
  value: PagosEstadoFiltro;
  label: string;
  description: string;
  accentClass: string;
  countClass: string;
  iconClass: string;
  icon: string;
};

const FILTERS: FilterDescriptor[] = [
  {
    value: 'todos',
    label: 'Todos',
    description: 'Todos los movimientos del período',
    accentClass:
      'border-gray-200 bg-gray-50 text-gray-800 shadow-lg shadow-gray-200/70 dark:border-white/10 dark:bg-white/5 dark:text-white',
    countClass: 'text-gray-900 dark:text-white',
    iconClass: 'text-gray-500 dark:text-gray-300',
    icon: 'select_all',
  },
  {
    value: 'pendiente',
    label: 'Pendientes',
    description: 'Saldo por cobrar',
    accentClass:
      'border-amber-200 bg-amber-50 text-amber-800 shadow-lg shadow-amber-100/70 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
    countClass: 'text-amber-600 dark:text-amber-200',
    iconClass: 'text-amber-500 dark:text-amber-200',
    icon: 'pending',
  },
  {
    value: 'pagado',
    label: 'Pagados',
    description: 'Cuotas canceladas',
    accentClass:
      'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-lg shadow-emerald-100/70 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100',
    countClass: 'text-emerald-600 dark:text-emerald-200',
    iconClass: 'text-emerald-500 dark:text-emerald-200',
    icon: 'task_alt',
  },
  {
    value: 'vencido',
    label: 'Vencidos',
    description: 'Con fecha límite superada',
    accentClass:
      'border-rose-200 bg-rose-50 text-rose-800 shadow-lg shadow-rose-100/70 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100',
    countClass: 'text-rose-600 dark:text-rose-200',
    iconClass: 'text-rose-500 dark:text-rose-200',
    icon: 'error',
  },
];

const baseButtonClass =
  'flex min-w-[160px] flex-1 items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-200 lg:min-w-[200px]';

const inactiveClass =
  'border-gray-200 bg-white text-gray-600 hover:border-[#1d8ca5]/70 dark:border-white/10 dark:bg-[#1f1f24] dark:text-gray-200';

export const PagosStatusFilters = ({
  totalPeriodo,
  matchingCount,
  estadoSeleccionado,
  onEstadoSelect,
  counts,
}: PagosStatusFiltersProps) => {
  return (
    <section className="rounded-3xl border border-[#e1e8ec] bg-white px-5 py-6 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">Estados</p>
          <h2 className="text-xl font-semibold text-[#0f181a] dark:text-white">Segmentá las cuotas por estado</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Identificá rápidamente qué movimientos necesitan seguimiento y cuáles ya fueron resueltos.
          </p>
        </div>
        <div className="rounded-2xl bg-[#f6f8f8] p-4 text-sm dark:bg-white/5">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span>Total del período</span>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1d8ca5]">Pagos</span>
          </div>
          <p className="mt-2 text-4xl font-extrabold text-[#0f181a] dark:text-white">
            {formatNumber(totalPeriodo)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Coincidencias actuales: {formatNumber(matchingCount)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        {FILTERS.map((filter) => {
          const isActive = estadoSeleccionado === filter.value;
          const count = counts[filter.value] ?? 0;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onEstadoSelect(filter.value)}
              className={`${baseButtonClass} ${isActive ? filter.accentClass : inactiveClass}`}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold">{filter.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{filter.description}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Registros</p>
                <p className={`text-2xl font-bold ${isActive ? filter.countClass : 'text-gray-800 dark:text-gray-100'}`}>
                  {formatNumber(count)}
                </p>
                <span className={`material-symbols-outlined text-xl ${isActive ? filter.iconClass : 'text-gray-400 dark:text-gray-500'}`}>
                  {filter.icon}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
