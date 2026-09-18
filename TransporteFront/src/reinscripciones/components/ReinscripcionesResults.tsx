import { Button } from '../../shared/ui/Button';
import { LoadingScreen } from '../../shared/ui/Spinner';
import { ErrorState, EmptyState } from '../../shared/ui/Alert';
import { Pagination } from '../../shared/ui/Pagination';
import type { ReinscripcionDetallada } from '../types/reinscripcion.types';
import { ReinscripcionList } from './ReinscripcionList';

interface ReinscripcionesResultsProps {
  reinscripciones: ReinscripcionDetallada[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onConfirm: (registro: ReinscripcionDetallada) => void;
  onMarkAsNotContinuing: (registro: ReinscripcionDetallada) => void;
  onMarkAsPending: (registro: ReinscripcionDetallada) => void;
}

const ResultsError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="space-y-4 p-6">
    <ErrorState message="Error al cargar las reinscripciones" />
    <div className="flex justify-center">
      <Button variant="ghost" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  </div>
);

export const ReinscripcionesResults = ({
  reinscripciones,
  isLoading,
  isFetching,
  isError,
  pageNumber,
  pageSize,
  totalCount,
  onRetry,
  onPageChange,
  onConfirm,
  onMarkAsNotContinuing,
  onMarkAsPending,
}: ReinscripcionesResultsProps) => {
  if (isError) return <ResultsError onRetry={onRetry} />;

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingScreen message="Cargando reinscripciones..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {isFetching && (
        <p className="text-xs font-medium uppercase tracking-wide text-[#1d8ca5]">Actualizando datos...</p>
      )}

      {reinscripciones.length === 0 ? (
        <EmptyState message="No hay registros que coincidan con la búsqueda actual." />
      ) : (
        <>
          <ReinscripcionList
            reinscripciones={reinscripciones}
            onConfirm={onConfirm}
            onMarkAsNotContinuing={onMarkAsNotContinuing}
            onMarkAsPending={onMarkAsPending}
          />
          <Pagination currentPage={pageNumber} totalCount={totalCount} pageSize={pageSize} onPageChange={onPageChange} />
        </>
      )}
    </div>
  );
};
