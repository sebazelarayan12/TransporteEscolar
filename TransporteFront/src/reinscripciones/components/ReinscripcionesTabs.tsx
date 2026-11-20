import { REINSCRIPCIONES_TABS, type ReinscripcionesTab } from '../types/reinscripciones-tabs.types';

interface ReinscripcionesTabsProps {
  activeTab: ReinscripcionesTab;
  onChange: (tab: ReinscripcionesTab) => void;
}

const tabs: Array<{ value: ReinscripcionesTab; label: string; icon: string }> = [
  { value: REINSCRIPCIONES_TABS.REINSCRIPCIONES, label: 'Reinscripciones', icon: 'how_to_reg' },
  { value: REINSCRIPCIONES_TABS.DICIEMBRE, label: 'Diciembre', icon: 'calendar_month' },
];

export const ReinscripcionesTabs = ({ activeTab, onChange }: ReinscripcionesTabsProps) => (
  <div
    role="tablist"
    aria-label="Secciones de reinscripciones"
    className="inline-flex w-full flex-col gap-2 rounded-full bg-white p-1 shadow-sm ring-1 ring-[#e1e8ec] dark:bg-[#1f1f24] dark:ring-white/5 sm:flex-row"
  >
    {tabs.map((tab) => {
      const isActive = activeTab === tab.value;

      return (
        <button
          key={tab.value}
          id={`reinscripciones-tab-${tab.value}`}
          type="button"
          role="tab"
          aria-selected={isActive}
          aria-controls={`reinscripciones-panel-${tab.value}`}
          tabIndex={isActive ? 0 : -1}
          onClick={() => onChange(tab.value)}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition sm:flex-1 ${
            isActive
              ? 'bg-[#1d8ca5] text-white shadow-lg shadow-[#1d8ca5]/30'
              : 'text-gray-500 hover:text-[#0f181a] dark:text-gray-300 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden>
            {tab.icon}
          </span>
          <span className="truncate">{tab.label}</span>
        </button>
      );
    })}
  </div>
);
