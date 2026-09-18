import { Link } from 'react-router-dom';
import { SearchInput } from '../../shared/ui/SearchInput';
import type { StatusCounts, StatusFilter } from '../helpers/status-filter.helpers';
import type { TitularResponse } from '../types/titular.types';
import { ExportarContactosButton } from './ExportarContactosButton';
import { TitularesStatusFilters } from './TitularesStatusFilters';

interface TitularesListHeaderProps {
  titulares: TitularResponse[];
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  statusCounts: StatusCounts;
  onStatusFilterChange: (value: StatusFilter) => void;
}

const formatFoundLabel = (count: number) => {
  if (count === 0) return '0 titulares';
  const plural = count !== 1 ? 's' : '';
  return `${count} titular${count !== 1 ? 'es' : ''} encontrado${plural}`;
};

export const TitularesListHeader = ({
  titulares,
  filteredCount,
  searchQuery,
  onSearchChange,
  statusFilter,
  statusCounts,
  onStatusFilterChange,
}: TitularesListHeaderProps) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Titulares</h1>
      <p className="mt-1 text-sm text-gray-500">{formatFoundLabel(filteredCount)}</p>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex w-full flex-col gap-2">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Buscar por nombre, dirección o ID..."
        />
        <TitularesStatusFilters value={statusFilter} counts={statusCounts} onChange={onStatusFilterChange} />
      </div>
      <div className="flex shrink-0 gap-2">
        <ExportarContactosButton titulares={titulares} />
        <Link
          to="/titulares/nuevo"
          className="flex items-center justify-center gap-2 rounded-lg bg-[#007a8a] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#00626e]"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nuevo Titular
        </Link>
      </div>
    </div>
  </div>
);
