import type { PaymentStatus } from '../types/pago.types';

type FilterOption = 'all' | PaymentStatus;

interface FilterCount {
  all: number;
  pagado: number;
  vencido: number;
  parcial: number;
}

interface PaymentFiltersProps {
  selectedFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  filterCounts: FilterCount;
}

const filterOptions: Array<{ id: FilterOption; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'vencido', label: 'Vencidos' },
  { id: 'parcial', label: 'Pendientes' },
  { id: 'pagado', label: 'Pagados' },
];

export const PaymentFilters = ({ selectedFilter, onFilterChange, filterCounts }: PaymentFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      {filterOptions.map((filter) => {
        const isActive = selectedFilter === filter.id;
        const count = filterCounts[filter.id];
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'bg-[#1d8ca5] text-white shadow-lg shadow-[#1d8ca5]/20'
                : 'bg-white text-gray-600 ring-1 ring-[#e1e8ec] hover:text-[#1d8ca5] dark:bg-[#1f1f24]'
            }`}
          >
            {filter.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white'}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
