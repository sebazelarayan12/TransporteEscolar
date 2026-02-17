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
      <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white dark:border-white/10 dark:bg-[#1f1f24]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Spinner />
          <p className="text-sm text-gray-500">Cargando ingresos externos...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-teal-50 p-5 shadow-sm dark:border-white/5 dark:from-[#1f1f24] dark:to-slate-900">
      <header className="flex flex-col gap-4 border-b border-gray-100 pb-4 dark:border-white/5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">Ingresos externos</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Apoyos fuera de las cuotas</h3>
          <p className="text-sm text-gray-500">
            Registrá convenios, subsidios o acciones especiales que mejoran la caja del mes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2 shadow-sm backdrop-blur dark:bg-white/5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Total externo</p>
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
          <Button type="button" variant="secondary" className="inline-flex w-full items-center justify-center gap-2 rounded-full sm:w-auto" onClick={onRegistrarIngreso}>
            <span className="material-symbols-outlined text-[20px]">add_chart</span>
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
                className={`flex w-full flex-col rounded-2xl border px-4 py-3 text-left transition dark:border-white/10 sm:w-auto ${
                  isActive
                    ? 'border-teal-500 bg-white shadow-sm dark:bg-[#222832]'
                    : 'border-gray-200 bg-white/80 hover:border-gray-300 dark:bg-[#11161c]'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">{tab.label}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{tab.description}</span>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(tab.total)}</p>
                <p className="text-xs text-gray-400">{tab.count} registros</p>
              </button>
            );
          })}
        </div>
        {isRefreshing ? (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-600">
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            Actualizando ingresos
          </div>
        ) : null}
      </div>

      {activeItems.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center dark:border-white/10">
          <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">volunteer_activism</span>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeItems.map((ingreso) => (
            <IngresoCard key={ingreso.id} ingreso={ingreso} />
          ))}
        </div>
      )}
    </section>
  );
};
