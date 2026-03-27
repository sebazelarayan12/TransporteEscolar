import { useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePasajerosPaginados, usePasajerosSinHorarios } from '../services/pasajeros.queries';
import { LoadingScreen, ErrorState, SearchInput, MobileDrawer, Pagination, Alert } from '../../shared/ui';
import { PasajeroDetailPanel, PasajeroTableHeader, PasajeroTableRow, PasajeroCompactCard } from '../components';
import type { PasajeroResponse } from '../types/pasajero.types';
import { useDebounce } from '../../shared/hooks/useDebounce';

type PanelState = {
  selectedPasajero: PasajeroResponse | null;
  showMobileDrawer: boolean;
  isPanelExpanded: boolean;
};

type PanelAction =
  | { type: 'select'; payload: PasajeroResponse }
  | { type: 'closeDrawer' }
  | { type: 'closePanel' }
  | { type: 'expandPanel' }
  | { type: 'clearSelection' };

const PANEL_INITIAL_STATE: PanelState = {
  selectedPasajero: null,
  showMobileDrawer: false,
  isPanelExpanded: false,
};

const panelReducer = (state: PanelState, action: PanelAction): PanelState => {
  switch (action.type) {
    case 'select':
      return {
        selectedPasajero: action.payload,
        showMobileDrawer: true,
        isPanelExpanded: true,
      };
    case 'closeDrawer':
      return {
        ...state,
        showMobileDrawer: false,
      };
    case 'closePanel':
      return {
        selectedPasajero: null,
        showMobileDrawer: false,
        isPanelExpanded: false,
      };
    case 'expandPanel':
      if (!state.selectedPasajero) {
        return state;
      }
      return {
        ...state,
        isPanelExpanded: true,
      };
    case 'clearSelection':
      return { ...PANEL_INITIAL_STATE };
    default:
      return state;
  }
};

export const PasajerosListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [panelState, dispatchPanel] = useReducer(panelReducer, PANEL_INITIAL_STATE);
  const { selectedPasajero, showMobileDrawer, isPanelExpanded } = panelState;
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  const pageSize = 20;

  const { data, isLoading, isFetching, error } = usePasajerosPaginados({
    search: debouncedSearch,
    pageNumber: currentPage,
    pageSize,
  });
  const { data: pasajerosSinHorarios } = usePasajerosSinHorarios();

  const handleSelectPasajero = (pasajero: PasajeroResponse) => {
    dispatchPanel({ type: 'select', payload: pasajero });
  };

  const handleCloseDrawer = () => dispatchPanel({ type: 'closeDrawer' });

  const handleCloseSidePanel = () => {
    dispatchPanel({ type: 'closePanel' });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    dispatchPanel({ type: 'clearSelection' });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const isInitialLoading = isLoading && !data;
  const pasajerosSinHorarioList = pasajerosSinHorarios ?? [];
  const pasajerosSinHorarioPreview = pasajerosSinHorarioList.slice(0, 5);
  const pasajerosSinHorarioRestantes = pasajerosSinHorarioList.length - pasajerosSinHorarioPreview.length;
  
  if (isInitialLoading) return <LoadingScreen message="Cargando pasajeros..." />;
  if (error) return <ErrorState message="Error al cargar los pasajeros" />;

  return (
    <div className="w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
          {/* Main Area */}
          <div className="space-y-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pasajeros</h1>
                <p className="text-sm text-gray-500">
                  {data && data.totalCount > 0
                    ? `${data.data.length} estudiante${data.data.length !== 1 ? 's' : ''} en esta página de ${data.totalCount} activos`
                    : 'No hay pasajeros que coincidan con la búsqueda'}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <SearchInput value={searchQuery} onChange={handleSearchChange} placeholder="Buscar por nombre, titular o colegio..." />
                <Link
                  to="/pasajeros/nuevo"
                  className="shrink-0 rounded-lg bg-[#007a8a] px-4 py-2 text-center text-sm font-bold text-white shadow-sm hover:bg-[#00626e]"
                >
                  <span className="material-symbols-outlined mr-1 align-middle text-[18px]">add</span>
                  Nuevo pasajero
                </Link>
              </div>
            </div>

            {pasajerosSinHorarioList.length > 0 && (
              <Alert variant="warning" className="space-y-2 rounded-2xl border-yellow-200 bg-yellow-50 text-yellow-900">
                <div>
                  <p className="text-sm font-semibold">
                    {pasajerosSinHorarioList.length} pasajero{pasajerosSinHorarioList.length !== 1 ? 's' : ''} sin horario asignado
                  </p>
                </div>
                <ul className="list-disc space-y-1 pl-4 text-xs text-yellow-900 sm:text-sm">
                  {pasajerosSinHorarioPreview.map((pasajero) => (
                    <li key={pasajero.id}>
                      {pasajero.nombre} {pasajero.apellido}
                    </li>
                  ))}
                </ul>
                {pasajerosSinHorarioRestantes > 0 && (
                  <p className="text-xs font-medium text-yellow-900">
                    y {pasajerosSinHorarioRestantes} pasajero{pasajerosSinHorarioRestantes !== 1 ? 's' : ''} más sin horarios configurados.
                  </p>
                )}
              </Alert>
            )}

            {/* Desktop Table View - Altura fija con scroll */}
            <div className="hidden overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a] md:flex md:h-[600px] md:flex-col">
              <PasajeroTableHeader />
              <div className="custom-scrollbar relative flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-white/5">
                {isFetching && data && (
                  <div className="absolute right-2 top-2 z-10">
                    <div className="rounded-full border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-[#27272a]">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#007a8a]"></div>
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3 py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#007a8a]"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
                    </div>
                  </div>
                ) : data && data.data.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron pasajeros para ese criterio.
                  </div>
                ) : (
                  data && data.data.map((pasajero) => (
                    <PasajeroTableRow
                      key={pasajero.id}
                      pasajero={pasajero}
                      isSelected={selectedPasajero?.id === pasajero.id}
                      onSelect={handleSelectPasajero}
                    />
                  ))
                )}
              </div>
              {data && data.totalCount > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalCount={data.totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Mobile Compact List View */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a] md:hidden">
              <div className="custom-scrollbar relative max-h-[70vh] overflow-y-auto">
                {isFetching && data && (
                  <div className="absolute right-2 top-2 z-10">
                    <div className="rounded-full border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-[#27272a]">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#007a8a]"></div>
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <div className="flex items-center justify-center p-8 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#007a8a]"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
                    </div>
                  </div>
                ) : data && data.data.length === 0 ? (
                  <div className="flex items-center justify-center p-8 text-sm text-gray-500 dark:text-gray-400">
                    No se encontraron pasajeros para ese criterio.
                  </div>
                ) : (
                  data && data.data.map((pasajero) => (
                    <PasajeroCompactCard
                      key={pasajero.id}
                      pasajero={pasajero}
                      isSelected={selectedPasajero?.id === pasajero.id}
                      onClick={() => handleSelectPasajero(pasajero)}
                    />
                  ))
                )}
              </div>
              {data && data.totalCount > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalCount={data.totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>

          {/* Desktop Side Panel - Sticky con altura fija y scroll */}
          <div className={`
            hidden lg:block
            ${isPanelExpanded ? '' : 'lg:hidden xl:block'}
          `}>
            <div className={`
              flex h-[600px] flex-col overflow-hidden rounded-2xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]
              lg:fixed lg:right-0 lg:top-0 lg:z-50 lg:h-screen lg:w-80 lg:rounded-none lg:shadow-2xl xl:w-96
              xl:sticky xl:top-6 xl:h-[600px] xl:w-full xl:rounded-2xl xl:shadow-sm
            `}>
              <div className="flex-1 overflow-y-auto">
                <PasajeroDetailPanel pasajero={selectedPasajero} onClose={handleCloseSidePanel} />
              </div>
            </div>
          </div>

          {/* Overlay para LG cuando el panel está expandido */}
          {isPanelExpanded && selectedPasajero && (
            <div
              className="fixed inset-0 z-40 hidden bg-black/50 transition-opacity duration-300 lg:block xl:hidden"
              role="button"
              tabIndex={0}
              aria-label="Cerrar panel de detalle de pasajero"
              onClick={handleCloseSidePanel}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleCloseSidePanel();
                }
              }}
            />
          )}

          {/* Botón flotante para abrir panel en LG */}
          {selectedPasajero && !isPanelExpanded && (
            <button
              onClick={() => dispatchPanel({ type: 'expandPanel' })}
              className="fixed bottom-6 right-6 z-30 hidden items-center gap-2 rounded-full bg-[#007a8a] px-6 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-[#00626e] lg:flex xl:hidden"
            >
              <span className="material-symbols-outlined text-[20px]">info</span>
              <span className="text-sm font-bold">Ver Detalles</span>
            </button>
          )}

          {/* Mobile Drawer - From Bottom */}
          <MobileDrawer isOpen={showMobileDrawer && !!selectedPasajero} onClose={handleCloseDrawer}>
            {selectedPasajero && <PasajeroDetailPanel pasajero={selectedPasajero} onClose={handleCloseDrawer} />}
          </MobileDrawer>
        </div>
      </div>
    </div>
  );
};
