import { useState } from 'react';
import { useTitulares } from '../services/titulares.queries';
import { LoadingScreen, ErrorState, EmptyState, SearchInput } from '../../shared/ui';
import { TitularTableHeader, TitularTableRow, TitularDetailPanel } from '../components';
import { filterTitulares } from '../helpers/search.helpers';
import type { TitularResponse } from '../types/titular.types';

const STATUS_FILTERS = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

type StatusFilter = (typeof STATUS_FILTERS)[keyof typeof STATUS_FILTERS];

export const TitularesListPage = () => {
  const { data: titulares, isLoading, error } = useTitulares();
  const [selectedTitular, setSelectedTitular] = useState<TitularResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTERS.ACTIVE);

  const handleSelectTitular = (titular: TitularResponse) => {
    setSelectedTitular(titular);
    setShowMobileDrawer(true);
    setIsPanelExpanded(true);
  };

  const handleCloseMobileDrawer = () => {
    setShowMobileDrawer(false);
  };

  const handleCloseSidePanel = () => {
    setIsPanelExpanded(false);
  };

  const titularesList = titulares ?? [];
  const totalTitulares = titularesList.length;
  const activeTitularesCount = titularesList.filter((titular) => titular.activo).length;
  const inactiveTitularesCount = totalTitulares - activeTitularesCount;
  const filteredBySearch = filterTitulares(titularesList, searchQuery);
  const filteredTitulares = filteredBySearch.filter((titular) => {
    if (statusFilter === STATUS_FILTERS.ACTIVE) return titular.activo;
    if (statusFilter === STATUS_FILTERS.INACTIVE) return !titular.activo;
    return true;
  });
  const filteredCount = filteredTitulares.length;

  if (isLoading) return <LoadingScreen message="Cargando titulares..." />;
  if (error) return <ErrorState message="Error al cargar los titulares" />;
  if (!titulares || titulares.length === 0) return <EmptyState message="No hay titulares registrados" />;

  return (
    <div className="w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
          {/* Main Area */}
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Titulares</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredCount === 0
                    ? '0 titulares'
                    : `${filteredCount} titular${filteredCount !== 1 ? 'es' : ''} encontrado${filteredCount !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex w-full flex-col gap-2">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar por nombre, dirección o ID..."
                  />
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Todos', value: STATUS_FILTERS.ALL, count: totalTitulares },
                      { label: 'Activos', value: STATUS_FILTERS.ACTIVE, count: activeTitularesCount },
                      { label: 'Inactivos', value: STATUS_FILTERS.INACTIVE, count: inactiveTitularesCount },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setStatusFilter(filter.value)}
                        className={`inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                          statusFilter === filter.value
                            ? 'border-[#007a8a] bg-[#007a8a] text-white shadow'
                            : 'border-gray-200 text-gray-600 hover:border-[#007a8a] hover:text-[#007a8a] dark:border-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {filter.label}
                        <span className="text-xs font-semibold">({filter.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = '/titulares/nuevo'}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#007a8a] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#00626e]"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Nuevo Titular
                </button>
              </div>
            </div>

            {/* Table Card con Scroll Interno - Altura fija */}
            <div className="flex h-[600px] flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]">
              <TitularTableHeader />
              <div className="custom-scrollbar flex-1 overflow-y-auto">
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
                  <div className="flex h-32 items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">No se encontraron titulares para este filtro</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Side Panel - Sticky con altura fija y scroll */}
          <div
            className={`
              hidden lg:block
              ${isPanelExpanded ? '' : 'lg:hidden xl:block'}
            `}
          >
            <div
              className={`
                flex h-[600px] flex-col overflow-hidden rounded-xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]
                lg:fixed lg:right-0 lg:top-0 lg:z-50 lg:h-screen lg:w-[400px] lg:rounded-none lg:shadow-2xl
                xl:sticky xl:top-6 xl:h-[600px] xl:w-full xl:rounded-xl xl:shadow-sm
              `}
            >
              <div className="flex-1 overflow-y-auto">
                <TitularDetailPanel titular={selectedTitular} onClose={handleCloseSidePanel} />
              </div>
            </div>
          </div>

          {/* Overlay para LG cuando el panel está expandido */}
          {isPanelExpanded && selectedTitular && (
            <div 
              className="fixed inset-0 z-40 hidden bg-black/50 transition-opacity duration-300 lg:block xl:hidden"
              onClick={handleCloseSidePanel}
            />
          )}

          {/* Botón flotante para abrir panel en LG */}
          {selectedTitular && !isPanelExpanded && (
            <button
              onClick={() => setIsPanelExpanded(true)}
              className="fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full bg-[#007a8a] px-6 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-[#00626e] lg:flex xl:hidden"
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
              <span className="text-sm font-bold">Ver Detalles</span>
            </button>
          )}

          {/* Mobile Drawer - From Bottom */}
          {showMobileDrawer && selectedTitular && (
            <div className="fixed inset-0 z-50 flex items-end lg:hidden">
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCloseMobileDrawer}
              />
              <div className="relative flex max-h-[85vh] w-full animate-slide-up flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-[#27272a]">
                <div className="flex justify-center pb-2 pt-3">
                  <div className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
                <TitularDetailPanel titular={selectedTitular} onClose={handleCloseMobileDrawer} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
