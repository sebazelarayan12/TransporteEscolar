import { Link } from 'react-router-dom';
import { SearchInput } from '../../shared/ui/SearchInput';
import type { PasajeroPaginationResponse } from '../types/pasajero.types';

interface PasajerosListHeaderProps {
  data?: PasajeroPaginationResponse;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const formatSummary = (data?: PasajeroPaginationResponse) => {
  if (!data || data.totalCount === 0) {
    return 'No hay pasajeros que coincidan con la búsqueda';
  }
  const plural = data.data.length !== 1 ? 's' : '';
  return `${data.data.length} estudiante${plural} en esta página de ${data.totalCount} activos`;
};

export const PasajerosListHeader = ({ data, searchQuery, onSearchChange }: PasajerosListHeaderProps) => (
  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pasajeros</h1>
      <p className="text-sm text-gray-500">{formatSummary(data)}</p>
    </div>
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <SearchInput value={searchQuery} onChange={onSearchChange} placeholder="Buscar por nombre, titular o colegio..." />
      <Link
        to="/pasajeros/nuevo"
        className="shrink-0 rounded-lg bg-[#007a8a] px-4 py-2 text-center text-sm font-bold text-white shadow-sm hover:bg-[#00626e]"
      >
        <span className="material-symbols-outlined mr-1 align-middle text-[18px]">add</span>
        Nuevo pasajero
      </Link>
    </div>
  </div>
);
