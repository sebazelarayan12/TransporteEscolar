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
    <div className="flex w-full flex-col gap-2 rounded-3xl border border-gray-200 bg-white p-2 shadow-sm dark:border-[#3f3f46] dark:bg-[#1f1f24] sm:flex-row sm:items-stretch">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const totalByTab = tab.value === 'variables' ? counts.variables : counts.fijos;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`flex w-full min-w-0 flex-col gap-1 rounded-2xl px-4 py-3 text-left transition sm:flex-1 sm:flex-row sm:items-center sm:gap-2 ${
              isActive
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 dark:bg-white/10'
                }`}
              >
                {totalByTab}
              </span>
            </div>
            <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'} sm:flex-1 sm:text-left`}>
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
};
