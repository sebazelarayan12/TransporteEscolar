import { useState } from 'react';
import { useTitularesActivos } from '../services/titulares.queries';
import { LoadingScreen, ErrorState, EmptyState, SearchInput } from '../../shared/ui';
import { TitularTableHeader, TitularTableRow, TitularDetailPanel } from '../components';
import { filterTitulares } from '../helpers/search.helpers';
import type { TitularResponse } from '../types/titular.types';

export const TitularesListPage = () => {
  const { data: titulares, isLoading, error } = useTitularesActivos();
  const [selectedTitular, setSelectedTitular] = useState<TitularResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const handleSelectTitular = (titular: TitularResponse) => {
    setSelectedTitular(titular);
    setShowMobileDrawer(true);
  };

  const handleCloseMobileDrawer = () => {
    setShowMobileDrawer(false);
  };

  const filteredTitulares = titulares ? filterTitulares(titulares, searchQuery) : [];

  if (isLoading) return <LoadingScreen message="Cargando titulares..." />;
  if (error) return <ErrorState message="Error al cargar los titulares" />;
  if (!titulares || titulares.length === 0) return <EmptyState message="No hay titulares activos" />;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-6 overflow-hidden">
      {/* Main Area - Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Titulares</h1>
            <p className="text-sm text-gray-500 mt-1">
              {filteredTitulares.length > 0
                ? `${filteredTitulares.length} titular${filteredTitulares.length !== 1 ? 'es' : ''} ${searchQuery ? 'encontrado' + (filteredTitulares.length !== 1 ? 's' : '') : 'activo' + (filteredTitulares.length !== 1 ? 's' : '')}`
                : 'No hay titulares activos'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por nombre, dirección o ID..."
            />
            <button 
              onClick={() => window.location.href = '/titulares/nuevo'}
              className="shrink-0 flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg bg-[#007a8a] text-white font-bold text-sm shadow-md hover:bg-[#00626e] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Nuevo Titular
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white dark:bg-[#27272a] rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] shadow-sm overflow-hidden flex flex-col">
          <TitularTableHeader />
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredTitulares.length > 0 ? (
              filteredTitulares.map((titular, rowIndex) => (
                <TitularTableRow
                  key={titular.id}
                  titular={titular}
                  isSelected={selectedTitular?.id === titular.id}
                  onClick={() => handleSelectTitular(titular)}
                  rowIndex={rowIndex}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No se encontraron titulares</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Side Panel - Always Visible */}
      <div className="hidden lg:flex flex-col w-[400px] bg-white dark:bg-[#27272a] rounded-xl border border-[#e4e4e7] dark:border-[#3f3f46] shadow-sm overflow-hidden">
        <TitularDetailPanel titular={selectedTitular} />
      </div>

      {/* Mobile Drawer - From Bottom */}
      {showMobileDrawer && selectedTitular && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseMobileDrawer}
          />
          <div className="relative w-full bg-white dark:bg-[#27272a] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <TitularDetailPanel titular={selectedTitular} onClose={handleCloseMobileDrawer} />
          </div>
        </div>
      )}
    </div>
  );
};
