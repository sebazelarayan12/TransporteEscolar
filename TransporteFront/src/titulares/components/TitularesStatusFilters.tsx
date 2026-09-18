import { STATUS_FILTERS, type StatusCounts, type StatusFilter } from '../helpers/status-filter.helpers';

interface TitularesStatusFiltersProps {
  value: StatusFilter;
  counts: StatusCounts;
  onChange: (value: StatusFilter) => void;
}

export const TitularesStatusFilters = ({ value, counts, onChange }: TitularesStatusFiltersProps) => {
  const filters = [
    { label: 'Todos', value: STATUS_FILTERS.ALL, count: counts.total },
    { label: 'Activos', value: STATUS_FILTERS.ACTIVE, count: counts.active },
    { label: 'Inactivos', value: STATUS_FILTERS.INACTIVE, count: counts.inactive },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            value === filter.value
              ? 'border-[#007a8a] bg-[#007a8a] text-white shadow'
              : 'border-gray-200 text-gray-600 hover:border-[#007a8a] hover:text-[#007a8a] dark:border-gray-700 dark:text-gray-300'
          }`}
        >
          {filter.label}
          <span className="text-xs font-semibold">({filter.count})</span>
        </button>
      ))}
    </div>
  );
};
