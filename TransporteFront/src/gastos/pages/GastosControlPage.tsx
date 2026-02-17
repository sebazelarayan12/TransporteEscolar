import { useState } from 'react';
import { Button, LoadingScreen, ErrorState, MonthYearFilter, EmptyState } from '../../shared/ui';
import {
  GastosHeroCard,
  GastosTabs,
  GastoListSection,
  RegistrarGastoModal,
  IngresosExternosSection,
  RegistrarIngresoModal,
} from '../components';
import { useGastosResumen } from '../services/gastos.queries';
import { useIngresosResumen } from '../services/ingresos.queries';
import type { GastosTabValue } from '../types/gastos.types';

const monthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

const sumByMonto = (items: { monto: number }[]) => items.reduce((acc, item) => acc + item.monto, 0);

export const GastosControlPage = () => {
  const currentDate = new Date();
  const [selectedMes, setSelectedMes] = useState(currentDate.getMonth() + 1);
  const [selectedAnio, setSelectedAnio] = useState(currentDate.getFullYear());
  const [activeTab, setActiveTab] = useState<GastosTabValue>('fijos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGastosResumen(selectedMes, selectedAnio);
  const {
    data: ingresosData,
    isLoading: isIngresosLoading,
    isError: isIngresosError,
    error: ingresosError,
    isFetching: isIngresosFetching,
  } = useIngresosResumen(selectedMes, selectedAnio);

  const gastosFijos = data?.gastosFijos ?? [];
  const gastosVariables = data?.gastosVariables ?? [];
  const periodLabel = monthFormatter.format(new Date(selectedAnio, selectedMes - 1, 1));

  const handleFilterChange = (mes: number, anio: number) => {
    setSelectedMes(mes);
    setSelectedAnio(anio);
    setActiveTab('fijos');
  };

  const isInitialLoading = (isLoading && !data) || (isIngresosLoading && !ingresosData);

  if (isInitialLoading) {
    return <LoadingScreen message="Cargando resumen financiero..." />;
  }

  if (isError || isIngresosError) {
    const sourceError = isError ? error : ingresosError;
    const fallbackMessage = isError
      ? 'No pudimos obtener el resumen de gastos.'
      : 'No pudimos obtener los ingresos externos.';
    const message =
      sourceError && typeof sourceError === 'object' && 'message' in sourceError
        ? String((sourceError as { message?: string }).message)
        : fallbackMessage;
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <ErrorState message={message} />
      </div>
    );
  }

  if (!data || !ingresosData) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <EmptyState message="Aún no hay datos financieros para este mes." />
      </div>
    );
  }

  const sections: Record<GastosTabValue, {
    title: string;
    subtitle: string;
    gastos: typeof gastosFijos;
    emptyMessage: string;
  }> = {
    variables: {
      title: 'Gastos Variables',
      subtitle: 'Operativa del día a día',
      gastos: gastosVariables,
      emptyMessage: 'No registraste gastos variables este mes. Usá el botón para agregar el primero.',
    },
    fijos: {
      title: 'Gastos Fijos',
      subtitle: 'Compromisos recurrentes',
      gastos: gastosFijos,
      emptyMessage: 'Todavía no hay plantillas aplicadas para este periodo.',
    },
  };

  const activeSection = sections[activeTab];
  const ingresosFijos = ingresosData.ingresosFijos ?? [];
  const ingresosVariables = ingresosData.ingresosVariables ?? [];
  const heroTotals = {
    totalCuotas: data.totales.totalCuotas,
    totalGastosFijos: data.totales.totalGastosFijos,
    totalGastosVariables: data.totales.totalGastosVariables,
    totalIngresosExternos: ingresosData.totales.totalIngresosExternos,
    totalIngresosFijos: ingresosData.totales.totalIngresosFijos,
    totalIngresosVariables: ingresosData.totales.totalIngresosVariables,
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#fafafa] pb-10 dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="w-full rounded-3xl border border-[#e1e8ec] bg-white px-4 py-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24] sm:px-6 lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">
              Finanzas operativas
            </p>
            <h1 className="text-2xl font-bold text-[#0f181a] dark:text-white">Control de Gastos</h1>
            <p className="text-sm text-gray-500">
              Compará ingresos vs. gastos y accioná rápido sobre variaciones inesperadas.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-teal-600 px-6 text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-200 dark:hover:bg-white/5 sm:w-auto"
              onClick={() => setIsIngresoModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[20px]">add_card</span>
              Registrar ingreso externo
            </Button>
            <Button
              type="button"
              variant="brand"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 sm:w-auto"
              onClick={() => setIsModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Registrar nuevo gasto
            </Button>
          </div>
        </header>

        <MonthYearFilter selectedMes={selectedMes} selectedAnio={selectedAnio} onFilterChange={handleFilterChange} />

        <GastosHeroCard totales={heroTotals} periodLabel={periodLabel} />

        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <GastosTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            counts={{ variables: gastosVariables.length, fijos: gastosFijos.length }}
          />
          {isFetching ? (
            <div className="flex w-full items-center justify-start gap-2 text-xs font-semibold uppercase tracking-widest text-teal-600 sm:w-auto sm:justify-center lg:justify-end">
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              Actualizando datos
            </div>
          ) : null}
        </div>

        <GastoListSection
          title={activeSection.title}
          subtitle={activeSection.subtitle}
          gastos={activeSection.gastos}
          totalAmount={sumByMonto(activeSection.gastos)}
          isLoading={false}
          isRefreshing={isFetching}
          emptyMessage={activeSection.emptyMessage}
        />

        <IngresosExternosSection
          ingresosFijos={ingresosFijos}
          ingresosVariables={ingresosVariables}
          totalGeneral={heroTotals.totalIngresosExternos}
          totalFijos={heroTotals.totalIngresosFijos}
          totalVariables={heroTotals.totalIngresosVariables}
          isLoading={!ingresosData && isIngresosLoading}
          isRefreshing={isIngresosFetching}
          onRegistrarIngreso={() => setIsIngresoModalOpen(true)}
        />

        <RegistrarGastoModal
          key={`${selectedMes}-${selectedAnio}`}
          isOpen={isModalOpen}
          mes={selectedMes}
          anio={selectedAnio}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            refetch();
            setActiveTab('fijos');
          }}
        />

        <RegistrarIngresoModal
          key={`ingresos-${selectedMes}-${selectedAnio}`}
          isOpen={isIngresoModalOpen}
          mes={selectedMes}
          anio={selectedAnio}
          onClose={() => setIsIngresoModalOpen(false)}
        />
      </div>
    </div>
  );
};
