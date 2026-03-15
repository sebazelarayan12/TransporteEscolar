import type { GastosTabValue } from '../types/gastos.types';
import { GastosTabs } from './GastosTabs';

type GastosToolbarProps = {
  activeTab: GastosTabValue;
  onChange: (tab: GastosTabValue) => void;
  counts: { variables: number; fijos: number };
  isRefreshing: boolean;
};

export const GastosToolbar = ({ activeTab, onChange, counts, isRefreshing }: GastosToolbarProps) => (
  <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <GastosTabs activeTab={activeTab} onChange={onChange} counts={counts} />
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
      {isRefreshing ? (
        <>
          <span className="material-symbols-rounded text-base text-teal-200" aria-hidden>
            progress_activity
          </span>
          Refrescando datos
        </>
      ) : (
        <>
          <span className="material-symbols-rounded text-base text-emerald-400" aria-hidden>
            workspace_premium
          </span>
          Al día
        </>
      )}
    </div>
  </div>
);
