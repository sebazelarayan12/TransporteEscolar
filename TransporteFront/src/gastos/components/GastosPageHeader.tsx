import { Button } from '../../shared/ui';

type GastosPageHeaderProps = {
  onRegistrarIngreso: () => void;
  onRegistrarGasto: () => void;
};

export const GastosPageHeader = ({ onRegistrarIngreso, onRegistrarGasto }: GastosPageHeaderProps) => (
  <header className="rounded-[32px] border border-slate-200/80 bg-white/90 px-5 py-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-teal-600 dark:text-teal-300">Finanzas operativas</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Control de Gastos</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Analizá el mes corriente, identifica desbalances y accioná sin salir de esta vista.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="ghost"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-teal-500 px-6 text-teal-700 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-100 dark:hover:bg-white/10 sm:w-auto"
          onClick={onRegistrarIngreso}
        >
          <span className="material-symbols-rounded text-xl" aria-hidden>
            add_card
          </span>
          Registrar ingreso externo
        </Button>
        <Button
          type="button"
          variant="brand"
          className="hidden items-center justify-center gap-2 rounded-full px-6 lg:inline-flex"
          onClick={onRegistrarGasto}
        >
          <span className="material-symbols-rounded text-xl" aria-hidden>
            add_circle
          </span>
          Registrar nuevo gasto
        </Button>
      </div>
    </div>
  </header>
);
