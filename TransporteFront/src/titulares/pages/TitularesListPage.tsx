import { useState } from 'react';
import { useTitulares, useTitularesSinTelefonos } from '../services/titulares.queries';
import { ErrorState, EmptyState } from '../../shared/ui/Alert';
import { Skeleton } from '../../shared/ui/Skeleton';
import { TitularesDetailPanels } from '../components/TitularesDetailPanels';
import { TitularesListHeader } from '../components/TitularesListHeader';
import { TitularesSinTelefonoAlert } from '../components/TitularesSinTelefonoAlert';
import { TitularesTable } from '../components/TitularesTable';
import { filterTitulares } from '../helpers/search.helpers';
import { STATUS_FILTERS, countByStatus, filterByStatus, type StatusFilter } from '../helpers/status-filter.helpers';
import { useTitularesPanel } from '../hooks/useTitularesPanel';

const TitularesListSkeleton = () => (
  <div className="w-full bg-zinc-50 dark:bg-zinc-900">
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-full md:w-72 rounded-lg" />
      </div>
      <div className="flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="border-b border-zinc-200 px-6 py-3 dark:border-zinc-700">
          <div className="grid grid-cols-4 gap-4">
            {['Apellido', 'Contacto', 'Dirección', 'Estado'].map((col) => (
              <Skeleton key={col} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-700/50">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4 px-6 py-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const TitularesListPage = () => {
  const { data: titulares = [], isLoading, error } = useTitulares();
  const { data: titularesSinTelefonos = [] } = useTitularesSinTelefonos();
  const panel = useTitularesPanel();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(STATUS_FILTERS.ACTIVE);

  if (isLoading) return <TitularesListSkeleton />;
  if (error) return <ErrorState message="Error al cargar los titulares" />;
  if (titulares.length === 0) return <EmptyState message="No hay titulares registrados" />;

  const filteredTitulares = filterByStatus(filterTitulares(titulares, searchQuery), statusFilter);

  return (
    <div className="w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]">
          {/* Main Area */}
          <div className="space-y-6">
            <TitularesListHeader
              titulares={titulares}
              filteredCount={filteredTitulares.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              statusCounts={countByStatus(titulares)}
              onStatusFilterChange={setStatusFilter}
            />
            <TitularesSinTelefonoAlert titulares={titularesSinTelefonos} />
            <TitularesTable
              titulares={filteredTitulares}
              selectedTitularId={panel.selectedTitular?.id}
              onSelect={panel.selectTitular}
            />
          </div>

          <TitularesDetailPanels
            selectedTitular={panel.selectedTitular}
            isPanelExpanded={panel.isPanelExpanded}
            showMobileDrawer={panel.showMobileDrawer}
            onClosePanel={panel.closePanel}
            onCloseMobileDrawer={panel.closeMobileDrawer}
            onExpandPanel={panel.expandPanel}
          />
        </div>
      </div>
    </div>
  );
};
