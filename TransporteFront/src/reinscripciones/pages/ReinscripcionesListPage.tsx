import { useMemo } from 'react';
import { useReinscripciones, useConfirmarReinscripcion, useMarcarComoNoContinua } from '../services/reinscripciones.queries';
import { useReinscripcionesList } from '../hooks/useReinscripcionesList';
import { ReinscripcionStats, ReinscripcionFilters, ReinscripcionList } from '../components';
import { Button, LoadingScreen, ErrorState } from '../../shared/ui';

export const ReinscripcionesListPage = () => {
  const currentYear = new Date().getFullYear();

  // Cargar reinscripciones del año actual
  const { data: reinscripciones = [], isLoading, error } = useReinscripciones(currentYear);

  // Hook personalizado para filtros y búsqueda
  const { filteredReinscripciones, stats, searchQuery, setSearchQuery } = useReinscripcionesList(reinscripciones);

  // Mutaciones
  const { mutate: confirmar } = useConfirmarReinscripcion();
  const { mutate: marcarNoContinua } = useMarcarComoNoContinua();

  // Calcular estadísticas para el resumen
  const resumenStats = useMemo(
    () => [
      {
        label: 'Confirmados',
        value: stats.confirmados,
        trend: `${stats.confirmados} familias confirmadas`,
        color: 'text-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700',
      },
      {
        label: 'Pendientes',
        value: stats.pendientes,
        trend: `${stats.pendientes} esperando confirmación`,
        color: 'text-amber-600',
        badge: 'bg-amber-100 text-amber-700',
      },
      {
        label: 'Sin continuar',
        value: stats.noContinua,
        trend: `${stats.noContinua} no renovarán`,
        color: 'text-slate-600',
        badge: 'bg-slate-200 text-slate-700',
      },
    ],
    [stats]
  );

  // Estados de carga y error
  if (isLoading) return <LoadingScreen message="Cargando reinscripciones..." />;
  if (error) return <ErrorState message="Error al cargar las reinscripciones" />;

  return (
    <div className="min-h-full w-full bg-[#f6f8f8] dark:bg-[#0f1416] text-[#0f181a] dark:text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {/* Header */}
        <header className="rounded-3xl border border-[#e1e8ec] bg-white px-6 py-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">Ciclo lectivo {currentYear}</p>
              <h1 className="text-2xl font-bold text-[#0f181a] dark:text-white">Reinscripciones</h1>
              <p className="text-sm text-gray-500">Gestiona el estado de las familias que renovarán el servicio para el próximo ciclo.</p>
            </div>
            <Button
              variant="ghost"
              className="flex items-center justify-center gap-2 rounded-full border border-[#1d8ca5] px-5 py-2 text-[#1d8ca5] hover:bg-[#1d8ca5]/10"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Exportar Reporte
            </Button>
          </div>
        </header>

        {/* Filters & Search */}
        <ReinscripcionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={stats.total}
          matchingCount={stats.matching}
        />

        {/* Stats */}
        <ReinscripcionStats stats={resumenStats} />

        {/* List */}
        <ReinscripcionList
          reinscripciones={filteredReinscripciones}
          onConfirm={confirmar}
          onMarkAsNotContinuing={marcarNoContinua}
        />

        {/* Floating Action Button */}
        <div className="sticky bottom-6 mt-4 flex justify-end">
          <Button
            variant="ghost"
            className="flex items-center gap-2 rounded-full bg-[#1d8ca5] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[#1d8ca5]/30 hover:bg-[#187286]"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nueva Reinscripción
          </Button>
        </div>
      </div>
    </div>
  );
};
