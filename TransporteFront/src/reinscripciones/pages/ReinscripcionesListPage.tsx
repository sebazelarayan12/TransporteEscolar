import { useState } from 'react';
import { useConfirmarReinscripcion, useMarcarComoNoContinua, useMarcarComoPendiente } from '../services/reinscripciones.queries';
import { useReinscripcionesPaginadas } from '../hooks/useReinscripcionesPaginadas';
import {
  ReinscripcionStats,
  ReinscripcionFilters,
  ReinscripcionList,
  ReinscripcionCreateModal,
  LastPendingConfirmationModal,
} from '../components';
import { Button, LoadingScreen, ErrorState, EmptyState, Pagination, MonthYearFilter } from '../../shared/ui';
import type { ReinscripcionDetallada } from '../types/reinscripcion.types';
import { isLastPendingForTitular } from '../helpers/last-pending.helper';

export const ReinscripcionesListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [criticalAction, setCriticalAction] = useState<{
    variant: 'confirmado' | 'noContinua';
    registro: ReinscripcionDetallada;
    isUltimoPendiente: boolean;
  } | null>(null);
  const {
    mes,
    anio,
    estadoSeleccionado,
    selectEstado,
    handlePeriodoChange,
    reinscripciones,
    totalCount,
    enabled,
    isLoading,
    isFetching,
    isError,
    error,
    pageNumber,
    pageSize,
    setPageNumber,
    refetch,
  } = useReinscripcionesPaginadas();
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredReinscripciones = normalizedSearch
    ? reinscripciones.filter((registro: ReinscripcionDetallada) => {
        const target = `${registro.pasajeroNombre} ${registro.titularNombre} ${registro.colegio} ${registro.curso}`.toLowerCase();
        return target.includes(normalizedSearch);
      })
    : reinscripciones;

  const confirmados = reinscripciones.filter((registro: ReinscripcionDetallada) => registro.estado === 'Confirmado').length;
  const pendientes = reinscripciones.filter((registro: ReinscripcionDetallada) => registro.estado === 'Pendiente').length;
  const noContinua = reinscripciones.filter((registro: ReinscripcionDetallada) => registro.estado === 'NoContinua').length;

  const resumenStats = [
    {
      label: 'Confirmados',
      value: confirmados,
      trend: `${confirmados} en esta página`,
      color: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Pendientes',
      value: pendientes,
      trend: `${pendientes} en esta página`,
      color: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'No continúa',
      value: noContinua,
      trend: `${noContinua} en esta página`,
      color: 'text-slate-600',
      badge: 'bg-slate-200 text-slate-700',
    },
  ];

  // Mutaciones
  const confirmarReinscripcionMutation = useConfirmarReinscripcion();
  const marcarNoContinuaMutation = useMarcarComoNoContinua();
  const marcarPendienteMutation = useMarcarComoPendiente();
  const errorMessage = error ? 'Error al cargar las reinscripciones' : '';

  const shouldShowCriticalConfirmation = (registro: ReinscripcionDetallada) => {
    if (registro.estado !== 'Pendiente') {
      return false;
    }

    return isLastPendingForTitular({
      collection: reinscripciones,
      titularKey: registro.titularNombre,
      getTitularKey: (item) => item.titularNombre,
      isPending: (item) => item.estado === 'Pendiente',
    });
  };

  const handleConfirmReinscripcion = (registro: ReinscripcionDetallada) => {
    const isUltimoPendiente = shouldShowCriticalConfirmation(registro);
    setCriticalAction({ variant: 'confirmado', registro, isUltimoPendiente });
  };

  const handleMarcarNoContinua = (registro: ReinscripcionDetallada) => {
    const isUltimoPendiente = shouldShowCriticalConfirmation(registro);
    if (isUltimoPendiente) {
      setCriticalAction({ variant: 'noContinua', registro, isUltimoPendiente });
      return;
    }

    marcarNoContinuaMutation.mutate(registro.id);
  };

  const handleMarcarPendiente = (registro: ReinscripcionDetallada) => {
    marcarPendienteMutation.mutate(registro.id);
  };

  const closeCriticalAction = () => setCriticalAction(null);

  const handleCriticalConfirm = () => {
    if (!criticalAction) {
      return;
    }

    const reinscripcionId = criticalAction.registro.id;

    if (criticalAction.variant === 'confirmado') {
      void confirmarReinscripcionMutation
        .mutateAsync(reinscripcionId)
        .then(() => {
          closeCriticalAction();
        })
        .catch(() => {
          // El modal permanece abierto para permitir reintentar
        });
      return;
    }

    closeCriticalAction();
    marcarNoContinuaMutation.mutate(reinscripcionId);
  };

  const isCriticalProcessing = criticalAction?.variant === 'confirmado'
    ? confirmarReinscripcionMutation.isPending
    : criticalAction?.variant === 'noContinua' && marcarNoContinuaMutation.isPending;
  const criticalActionLabel =
    criticalAction?.variant === 'confirmado' ? 'Confirmar reinscripción' : 'Marcar como no continúa';
  const criticalPasajeroNombre = criticalAction?.registro.pasajeroNombre ?? '';
  const criticalTitularNombre = criticalAction?.registro.titularNombre;
  const criticalReinscripcionId = criticalAction?.registro.id ?? null;
  const criticalModalVariant = criticalAction?.variant === 'confirmado' ? 'confirmar' : 'noContinua';
  const criticalUltimoPendiente = criticalAction?.isUltimoPendiente ?? false;

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

        {/* Month/Year Filter */}
        <MonthYearFilter selectedMes={mes} selectedAnio={anio} onFilterChange={handlePeriodoChange} />

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
        {estadoSeleccionado && !isLoading && !isError && <ReinscripcionStats stats={resumenStats} />}

        {/* List + Paginación */}
        {estadoSeleccionado && (
          <section className="rounded-3xl border border-[#e1e8ec] bg-white shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
            {isError ? (
              <div className="space-y-4 p-6">
                <ErrorState message={errorMessage} />
                <div className="flex justify-center">
                  <Button variant="ghost" onClick={() => refetch()}>
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="p-6">
                <LoadingScreen message="Cargando reinscripciones..." />
              </div>
            ) : (
              <div className="flex flex-col gap-4 p-6">
                {isFetching && (
                  <p className="text-xs font-medium uppercase tracking-wide text-[#1d8ca5]">Actualizando datos...</p>
                )}

                {filteredReinscripciones.length === 0 ? (
                  <EmptyState message="No hay registros que coincidan con la búsqueda actual." />
                ) : (
                  <>
                    <ReinscripcionList
                      reinscripciones={filteredReinscripciones}
                      onConfirm={handleConfirmReinscripcion}
                      onMarkAsNotContinuing={handleMarcarNoContinua}
                      onMarkAsPending={handleMarcarPendiente}
                    />
                    <Pagination
                      currentPage={pageNumber}
                      totalCount={totalCount}
                      pageSize={pageSize}
                      onPageChange={setPageNumber}
                    />
                  </>
                )}
              </div>
            )}
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
        isOpen={Boolean(criticalAction)}
        reinscripcionId={criticalReinscripcionId}
        onCancel={closeCriticalAction}
        onConfirm={handleCriticalConfirm}
        pasajeroNombre={criticalPasajeroNombre}
        titularNombre={criticalTitularNombre}
        actionLabel={criticalActionLabel}
        isProcessing={Boolean(isCriticalProcessing)}
        variant={criticalModalVariant}
        isUltimoPendiente={criticalUltimoPendiente}
      />
    </div>
  );
};
