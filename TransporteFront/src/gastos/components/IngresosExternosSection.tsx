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
  const [activeTab, setActiveTab] = useState<IngresosTabValue>('variables');
  const tabs: Array<{ key: IngresosTabValue; label: string; description: string; total: number; count: number }> = [
    { key: 'fijos', label: 'Fijos programados', description: 'Plantillas consolidadas', total: totalFijos, count: ingresosFijos.length },
    { key: 'variables', label: 'Variables', description: 'Movimientos puntuales', total: totalVariables, count: ingresosVariables.length },
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
      <header className="flex flex-col gap-4 border-b border-slate-200/70 pb-4 dark:border-white/5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal-600 dark:text-teal-300">Ingresos externos</p>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Apoyos fuera de las cuotas</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Convenios, subsidios y actividades especiales que impactan la caja del mes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Total externo</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalGeneral)}</p>
            </div>
            <div className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-widest">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-100">
                Fijo {formatCurrency(totalFijos)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100">
                Variable {formatCurrency(totalVariables)}
              </span>
            </div>
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
      </header>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
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
                <span className="text-sm text-slate-600 dark:text-slate-300">{tab.description}</span>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(tab.total)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{tab.count} registros</p>
              </button>
            );
          })}
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {isRefreshing ? (
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-rounded text-base animate-spin text-teal-500" aria-hidden>
                progress_activity
              </span>
              Actualizando ingresos
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-rounded text-base text-emerald-400" aria-hidden>
                check_circle
              </span>
              Información al día
            </span>
          )}
        </div>
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
