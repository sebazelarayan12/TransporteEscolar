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
    {isRefreshing ? (
      <div className="flex w-full items-center justify-start gap-2 text-xs font-semibold uppercase tracking-widest text-teal-600 sm:w-auto sm:justify-center lg:justify-end">
        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
        Actualizando datos
      </div>
    ) : null}
  </div>
);
