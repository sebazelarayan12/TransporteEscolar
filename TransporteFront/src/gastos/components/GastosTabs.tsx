import type { GastosTabValue } from '../types/gastos.types';

interface GastosTabsProps {
  activeTab: GastosTabValue;
  onChange: (value: GastosTabValue) => void;
  counts: {
    variables: number;
    fijos: number;
  };
}

const tabs: Array<{ value: GastosTabValue; label: string; icon: string; description: string }> = [
  {
    value: 'variables',
    label: 'Gastos Variables',
    icon: 'compare_arrows',
    description: 'Movimientos operativos del mes',
  },
  {
    value: 'fijos',
    label: 'Gastos Fijos',
    icon: 'schedule',
    description: 'Compromisos recurrentes y plantillas',
  },
];

export const GastosTabs = ({ activeTab, onChange, counts }: GastosTabsProps) => {
  return (
    <div className="inline-flex w-full flex-col gap-2 rounded-full bg-white/90 p-1 shadow ring-1 ring-slate-200 dark:bg-slate-900/70 dark:ring-white/10 sm:flex-row sm:items-stretch">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const totalByTab = tab.value === 'variables' ? counts.variables : counts.fijos;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            aria-pressed={isActive}
            className={`flex w-full min-w-0 flex-col rounded-full px-4 py-3 text-left transition sm:flex-1 ${
              isActive
                ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="material-symbols-rounded text-base" aria-hidden>
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/80'
                }`}
              >
                {totalByTab}
              </span>
            </div>
            <span className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
};
