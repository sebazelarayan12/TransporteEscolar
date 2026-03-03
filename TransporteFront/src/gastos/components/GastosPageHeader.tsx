import { Button } from '../../shared/ui';

type GastosPageHeaderProps = {
  onRegistrarIngreso: () => void;
  onRegistrarGasto: () => void;
};

export const GastosPageHeader = ({ onRegistrarIngreso, onRegistrarGasto }: GastosPageHeaderProps) => (
  <header className="w-full rounded-3xl border border-[#e1e8ec] bg-white px-4 py-5 shadow-sm dark:border-white/5 dark:bg-[#1f1f24] sm:px-6 lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-6">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#1d8ca5]">Finanzas operativas</p>
      <h1 className="text-2xl font-bold text-[#0f181a] dark:text-white">Control de Gastos</h1>
      <p className="text-sm text-gray-500">Compará ingresos vs. gastos y accioná rápido sobre variaciones inesperadas.</p>
    </div>
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <Button
        type="button"
        variant="ghost"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-teal-600 px-6 text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-200 dark:hover:bg-white/5 sm:w-auto"
        onClick={onRegistrarIngreso}
      >
        <span className="material-symbols-outlined text-[20px]">add_card</span>
        Registrar ingreso externo
      </Button>
      <Button
        type="button"
        variant="brand"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 sm:w-auto"
        onClick={onRegistrarGasto}
      >
        <span className="material-symbols-outlined text-[20px]">add_circle</span>
        Registrar nuevo gasto
      </Button>
    </div>
  </header>
);
