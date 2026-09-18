import { usePagosPaginados, useEstadisticasMes } from '../services/pagos.queries';
import { usePagosListState } from '../hooks/usePagosListState';
import { SearchInput } from '../../shared/ui/SearchInput';
import { MonthYearFilter } from '../../shared/ui/MonthYearFilter';
import { EstadisticasMesCard } from '../../shared/ui/EstadisticasMesCard';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { RegistrarPagoModal } from '../components/RegistrarPagoModal';
import { PagoDetalleModal } from '../components/PagoDetalleModal';
import { PagosAlertasPendientes } from '../components/PagosAlertasPendientes';
import { PagosListHeader } from '../components/PagosListHeader';
import { PagosListSkeleton } from '../components/PagosListSkeleton';
import { PagosListado } from '../components/PagosListado';
import { PAGOS_PAGE_SIZE, buildFilterCounts } from '../helpers/pagos-list.helpers';
import { useReinscripcionesAlertasPagos } from '../../reinscripciones/services/reinscripciones.queries';

export const PagosListPage = () => {
  const view = usePagosListState();
  const debouncedSearch = useDebounce(view.search, 300);

  const { data: paginatedData, isLoading, isFetching, refetch: refetchPagos } = usePagosPaginados(
    view.selectedMes,
    view.selectedAnio,
    debouncedSearch,
    view.pageNumber,
    PAGOS_PAGE_SIZE,
  );
  const { data: estadisticas, refetch: refetchEstadisticas } = useEstadisticasMes(view.selectedMes, view.selectedAnio);
  const { data: alertasPagos } = useReinscripcionesAlertasPagos(view.selectedAnio);

  if (isLoading) {
    return <PagosListSkeleton />;
  }

  const totalCount = paginatedData?.totalCount ?? 0;

  return (
    <div className="min-h-full w-full bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PagosListHeader onRegisterPago={() => view.setRegisterModalOpen(true)} />

        <PagosAlertasPendientes pendientes={alertasPagos?.pendientes ?? []} anio={view.selectedAnio} />

        <MonthYearFilter
          selectedMes={view.selectedMes}
          selectedAnio={view.selectedAnio}
          onFilterChange={view.setPeriodo}
        />

        {estadisticas && <EstadisticasMesCard estadisticas={estadisticas} />}

        <div className="relative">
          <SearchInput
            value={view.search}
            onChange={view.setSearch}
            placeholder="Buscar por apellido del titular..."
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
            </div>
          )}
        </div>

        <div aria-live="polite" aria-atomic="false">
          <PagosListado
            pagos={paginatedData?.data ?? []}
            totalCount={totalCount}
            hasSearch={Boolean(view.search)}
            estadoFiltro={view.estadoFiltro}
            filterCounts={buildFilterCounts(estadisticas, totalCount)}
            pageNumber={view.pageNumber}
            onPageChange={view.setPage}
            onSelectPago={view.openDetalle}
            onEstadoSelect={view.setEstadoFiltro}
          />
        </div>

        <RegistrarPagoModal
          isOpen={view.isRegisterModalOpen}
          onClose={() => view.setRegisterModalOpen(false)}
          onSuccess={() => {
            view.setRegisterModalOpen(false);
            refetchPagos();
            refetchEstadisticas();
          }}
        />
        <PagoDetalleModal
          isOpen={view.selectedPagoId !== null}
          onClose={view.closeDetalle}
          pagoId={view.selectedPagoId}
        />
      </div>
    </div>
  );
};
