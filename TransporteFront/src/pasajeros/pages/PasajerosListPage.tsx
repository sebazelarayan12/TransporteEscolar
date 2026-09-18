import { useState } from 'react';
import { usePasajerosPaginados, usePasajerosSinHorarios } from '../services/pasajeros.queries';
import { ErrorState } from '../../shared/ui/Alert';
import { Skeleton } from '../../shared/ui/Skeleton';
import { PasajeroTableHeader } from '../components/PasajeroTableHeader';
import { PasajeroTableRow } from '../components/PasajeroTableRow';
import { PasajeroCompactCard } from '../components/PasajeroCompactCard';
import { PasajerosDetailPanels } from '../components/PasajerosDetailPanels';
import { PasajerosListHeader } from '../components/PasajerosListHeader';
import { PasajerosDesktopResults, PasajerosMobileResults } from '../components/PasajerosResults';
import { PasajerosSinHorarioAlert } from '../components/PasajerosSinHorarioAlert';
import { usePasajerosPanel } from '../hooks/usePasajerosPanel';
import { useDebounce } from '../../shared/hooks/useDebounce';

const PAGE_SIZE = 20;

const PasajerosListSkeleton = () => (
  <div className="w-full bg-zinc-50 dark:bg-zinc-900">
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full md:w-72 rounded-lg" />
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="hidden border-b border-zinc-200 bg-zinc-50 px-6 py-3 dark:border-zinc-700 dark:bg-zinc-800 md:block">
          <div className="grid grid-cols-5 gap-4">
            {['Nombre', 'Titular', 'Colegio', 'Horario', 'Estado'].map((col) => (
              <Skeleton key={col} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 px-6 py-4 md:grid-cols-5 md:gap-4">
              <Skeleton className="h-5 w-40 md:w-full" />
              <Skeleton className="h-4 w-32 md:w-full" />
              <Skeleton className="h-4 w-24 md:w-full" />
              <Skeleton className="h-4 w-20 md:w-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const PasajerosListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const panel = usePasajerosPanel();

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, isFetching, error } = usePasajerosPaginados({
    search: debouncedSearch,
    pageNumber: currentPage,
    pageSize: PAGE_SIZE,
  });
  const { data: pasajerosSinHorarios = [] } = usePasajerosSinHorarios();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    panel.clearSelection();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  if (isLoading && !data) return <PasajerosListSkeleton />;
  if (error) return <ErrorState message="Error al cargar los pasajeros" />;

  const resultsProps = {
    data,
    isLoading,
    isFetching,
    currentPage,
    pageSize: PAGE_SIZE,
    onPageChange: handlePageChange,
  };

  return (
    <div className="w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
          {/* Main Area */}
          <div className="space-y-6">
            <PasajerosListHeader data={data} searchQuery={searchQuery} onSearchChange={handleSearchChange} />
            <PasajerosSinHorarioAlert pasajeros={pasajerosSinHorarios} />

            <PasajerosDesktopResults
              {...resultsProps}
              header={<PasajeroTableHeader />}
              renderItem={(pasajero) => (
                <PasajeroTableRow
                  key={pasajero.id}
                  pasajero={pasajero}
                  isSelected={panel.selectedPasajero?.id === pasajero.id}
                  onSelect={panel.select}
                />
              )}
            />

            <PasajerosMobileResults
              {...resultsProps}
              renderItem={(pasajero) => (
                <PasajeroCompactCard
                  key={pasajero.id}
                  pasajero={pasajero}
                  isSelected={panel.selectedPasajero?.id === pasajero.id}
                  onClick={() => panel.select(pasajero)}
                />
              )}
            />
          </div>

          <PasajerosDetailPanels
            selectedPasajero={panel.selectedPasajero}
            isPanelExpanded={panel.isPanelExpanded}
            showMobileDrawer={panel.showMobileDrawer}
            onClosePanel={panel.closePanel}
            onCloseDrawer={panel.closeDrawer}
            onExpandPanel={panel.expandPanel}
          />
        </div>
      </div>
    </div>
  );
};
