import { Button } from '../../shared/ui';

type GastosPageHeaderProps = {
  onRegistrarGasto: () => void;
};

export const GastosPageHeader = ({ onRegistrarGasto }: GastosPageHeaderProps) => (
  <header className="rounded-[32px] border border-slate-200/80 bg-white/90 px-5 py-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal-600 dark:text-teal-300">Finanzas operativas</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Control de Gastos</h1>
      </div>
      <Button
        type="button"
        variant="brand"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold sm:w-auto"
        onClick={onRegistrarGasto}
      >
        <span className="material-symbols-rounded text-xl" aria-hidden>
          add_circle
        </span>
        Nuevo gasto
      </Button>
    </div>
  </header>
);
