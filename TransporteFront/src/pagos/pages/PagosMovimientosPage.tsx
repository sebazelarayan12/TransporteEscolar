import { useState } from 'react';
import { LoadingScreen } from '../../shared/ui/Spinner';
import { ErrorState } from '../../shared/ui/Alert';
import { Pagination } from '../../shared/ui/Pagination';
import { RegistrarPagoModal } from '../components/RegistrarPagoModal';
import { usePagosMovimientos } from '../services/pagos.queries';
import { EliminarMovimientoDialog } from '../components/EliminarMovimientoDialog';
import { MovimientosFiltersCard } from '../components/movimientos/MovimientosFiltersCard';
import { PagosMovimientosHeader } from '../components/movimientos/PagosMovimientosHeader';
import { MovimientosResumenCards } from '../components/movimientos/MovimientosResumenCards';
import { MovimientosTableSection } from '../components/movimientos/MovimientosTableSection';
import { MOVIMIENTOS_PAGE_SIZE, useMovimientosFilters } from '../hooks/useMovimientosFilters';
import { useEliminarMovimientoFlow } from '../hooks/useEliminarMovimientoFlow';
import { summarizeMovimientos } from '../helpers/movimientos-summary.helpers';

const getErrorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'No pudimos cargar los movimientos.';

export const PagosMovimientosPage = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const filters = useMovimientosFilters();
  const eliminar = useEliminarMovimientoFlow();

  const { data, isLoading, isFetching, isError, error, refetch } = usePagosMovimientos(filters.queryFilter);

  if (isLoading) {
    return <LoadingScreen message="Cargando historial de movimientos..." />;
  }

  if (isError) {
    return <ErrorState message={getErrorMessage(error)} />;
  }

  const movimientos = data?.data ?? [];
  const { totalMonto, breakdown } = summarizeMovimientos(movimientos);

  return (
    <div className="min-h-full w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PagosMovimientosHeader onRegistrarPago={() => setIsRegisterModalOpen(true)} />

        <MovimientosFiltersCard
          key={filters.filtersKey}
          initialFilters={filters.appliedFilters}
          defaultFilters={filters.defaultFilters}
          onApply={filters.applyFilters}
          onReset={filters.clearFilters}
          isFetching={isFetching}
        />

        <MovimientosResumenCards totalMonto={totalMonto} totalMovimientos={movimientos.length} breakdown={breakdown} />

        <MovimientosTableSection
          movimientos={movimientos}
          isEmpty={movimientos.length === 0}
          onDelete={eliminar.open}
          isProcessingDelete={eliminar.isProcessing}
          selectedMovimientoId={eliminar.seleccionadoId}
        />

        <Pagination
          currentPage={filters.pageNumber}
          totalCount={data?.totalCount ?? 0}
          pageSize={MOVIMIENTOS_PAGE_SIZE}
          onPageChange={filters.changePage}
        />

        <RegistrarPagoModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false);
            refetch();
          }}
        />
        <EliminarMovimientoDialog
          isOpen={eliminar.resumen !== null}
          resumen={eliminar.resumen}
          onCancel={eliminar.cancel}
          onConfirm={eliminar.confirm}
          isProcessing={eliminar.isProcessing}
        />
      </div>
    </div>
  );
};
