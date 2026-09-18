import { useState } from 'react';
import { useReinscripcionesPaginadas } from '../hooks/useReinscripcionesPaginadas';
import { useReinscripcionCriticalAction } from '../hooks/useReinscripcionCriticalAction';
import { ReinscripcionStats } from '../components/ReinscripcionStats';
import { ReinscripcionFilters } from '../components/ReinscripcionFilters';
import { ReinscripcionCreateModal } from '../components/ReinscripcionCreateModal';
import { LastPendingConfirmationModal } from '../components/LastPendingConfirmationModal';
import { ReinscripcionesResults } from '../components/ReinscripcionesResults';
import { Button } from '../../shared/ui/Button';
import { buildResumenStats, filterReinscripciones } from '../helpers/reinscripcion-list.helpers';

export const ReinscripcionesListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    anio,
    estadoSeleccionado,
    selectEstado,
    reinscripciones,
    totalCount,
    enabled,
    isLoading,
    isFetching,
    isError,
    pageNumber,
    pageSize,
    setPageNumber,
    refetch,
  } = useReinscripcionesPaginadas();
  const critical = useReinscripcionCriticalAction(reinscripciones);

  const filteredReinscripciones = filterReinscripciones(reinscripciones, searchQuery);

  return (
    <div className="min-h-full w-full bg-[#f6f8f8] dark:bg-[#0f1416] text-[#0f181a] dark:text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {/* Header */}
        <header className="rounded-3xl border border-[#e1e8ec] bg-white px-6 py-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">Ciclo lectivo {anio}</p>
              <h1 className="text-2xl font-bold text-[#0f181a] dark:text-white">Reinscripciones</h1>
              <p className="text-sm text-gray-500">Gestiona el estado de las familias que renovarán el servicio para el próximo ciclo.</p>
            </div>
          </div>
        </header>

        <div className="flex justify-end">
          <Button
            variant="brand"
            className="flex items-center gap-2 rounded-full bg-[#1d8ca5] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#1d8ca5]/30 hover:bg-[#187286]"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nueva Reinscripción
          </Button>
        </div>

        {/* Filters & Search */}
        <ReinscripcionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={enabled ? totalCount : 0}
          matchingCount={enabled ? filteredReinscripciones.length : 0}
          estadoSeleccionado={estadoSeleccionado}
          onEstadoSelect={selectEstado}
        />

        {/* Placeholder hasta seleccionar estado */}
        {!estadoSeleccionado && (
          <section className="rounded-3xl border border-dashed border-[#d9e2e7] bg-white p-8 text-center text-sm shadow-sm dark:border-white/10 dark:bg-[#1f1f24]">
            <p className="text-base font-semibold text-[#0f181a] dark:text-white">
               Selecciona un estado para ver las reinscripciones del {anio}.
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Puedes cambiar de estado en cualquier momento para comparar cómo avanza cada grupo.
            </p>
          </section>
        )}

        {/* Stats */}
        {estadoSeleccionado && !isLoading && !isError && <ReinscripcionStats stats={buildResumenStats(reinscripciones)} />}

        {/* List + Paginación */}
        {estadoSeleccionado && (
          <section className="rounded-3xl border border-[#e1e8ec] bg-white shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
            <ReinscripcionesResults
              reinscripciones={filteredReinscripciones}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalCount={totalCount}
              onRetry={() => refetch()}
              onPageChange={setPageNumber}
              onConfirm={critical.requestConfirm}
              onMarkAsNotContinuing={critical.requestNoContinua}
              onMarkAsPending={critical.markPendiente}
            />
          </section>
        )}
      </div>
      <ReinscripcionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        anio={anio}
        onCreated={() => refetch()}
      />
      <LastPendingConfirmationModal
        isOpen={critical.isOpen}
        onCancel={critical.close}
        onConfirm={critical.confirmCritical}
        {...critical.modalProps}
      />
    </div>
  );
};
