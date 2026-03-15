import { useState } from 'react';
import { Button, Spinner } from '../../shared/ui';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import type { IngresoItem, IngresosTabValue } from '../types/ingresos.types';
import { IngresoCard } from './IngresoCard';

interface IngresosExternosSectionProps {
  ingresosFijos: IngresoItem[];
  ingresosVariables: IngresoItem[];
  totalGeneral: number;
  totalFijos: number;
  totalVariables: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRegistrarIngreso: () => void;
  onEditIngreso?: (ingreso: IngresoItem) => void;
  onDeleteIngreso?: (ingreso: IngresoItem) => void;
  actionsDisabled?: boolean;
}

export const IngresosExternosSection = ({
  ingresosFijos,
  ingresosVariables,
  totalGeneral,
  totalFijos,
  totalVariables,
  isLoading = false,
  isRefreshing = false,
  onRegistrarIngreso,
  onEditIngreso,
  onDeleteIngreso,
  actionsDisabled = false,
}: IngresosExternosSectionProps) => {
  const [activeTab, setActiveTab] = useState<IngresosTabValue>('fijos');
  const tabs: Array<{ key: IngresosTabValue; label: string; total: number; count: number }> = [
    { key: 'fijos', label: 'Fijos programados', total: totalFijos, count: ingresosFijos.length },
    { key: 'variables', label: 'Variables', total: totalVariables, count: ingresosVariables.length },
  ];

  const activeItems = activeTab === 'fijos' ? ingresosFijos : ingresosVariables;
  const emptyMessage =
    activeTab === 'fijos'
      ? 'Aún no configuraste ingresos fijos para este periodo.'
      : 'No hay ingresos variables registrados este mes.';

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-white/80 dark:border-white/10 dark:bg-slate-900/60">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
          <p className="text-sm text-slate-500 dark:text-slate-300">Cargando ingresos externos...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full rounded-[36px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <header className="space-y-6 border-b border-slate-200/70 pb-5 dark:border-white/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal-600 dark:text-teal-300">Ingresos externos</p>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Apoyos fuera de las cuotas</h3>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full sm:w-auto"
            onClick={onRegistrarIngreso}
          >
            <span className="material-symbols-rounded text-xl" aria-hidden>
              add_chart
            </span>
            Registrar ingreso
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-stretch">
          <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/60 bg-white/85 px-5 py-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Total externo</p>
              <p className="mt-1 text-3xl font-bold leading-tight text-slate-900 dark:text-white">{formatCurrency(totalGeneral)}</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{ingresosFijos.length + ingresosVariables.length} registros</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-slate-200/60 bg-slate-50/80 px-4 py-3 text-right shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-200">Fijo</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalFijos)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{ingresosFijos.length} registros</p>
            </div>
            <div className="rounded-3xl border border-slate-200/60 bg-emerald-50/80 px-4 py-3 text-right shadow-sm dark:border-white/10 dark:bg-emerald-400/5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-200">Variable</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalVariables)}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{ingresosVariables.length} registros</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex flex-1 flex-wrap gap-3">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex w-full flex-col rounded-3xl border px-4 py-3 text-left transition sm:w-auto ${
                  isActive
                    ? 'border-teal-500 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 shadow'
                    : 'border-slate-200 bg-white/80 hover:border-slate-300 dark:border-white/10 dark:bg-white/5'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                  {tab.label}
                </span>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(tab.total)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{tab.count} registros</p>
              </button>
            );
          })}
        </div>
        {isRefreshing ? (
          <div className="flex items-center gap-2 rounded-full border border-slate-200/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:border-white/10 dark:text-slate-400 lg:ml-auto">
            <span className="material-symbols-rounded text-base animate-spin text-teal-500" aria-hidden>
              progress_activity
            </span>
            Actualizando ingresos
          </div>
        ) : null}
      </div>

      {activeItems.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 px-4 py-12 text-center dark:border-white/10">
          <span className="material-symbols-rounded text-5xl text-slate-300 dark:text-slate-500" aria-hidden>
            volunteer_activism
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {activeItems.map((ingreso) => (
            <IngresoCard
              key={ingreso.id}
              ingreso={ingreso}
              onEdit={onEditIngreso}
              onDelete={onDeleteIngreso}
              actionsDisabled={actionsDisabled}
            />
          ))}
        </div>
      )}
    </section>
  );
};
