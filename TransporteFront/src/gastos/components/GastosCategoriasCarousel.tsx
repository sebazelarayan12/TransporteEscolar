import { formatCurrency } from '../../shared/utils/currency.helpers';

export type GastosCategoriasCarouselItem = {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  icon: string;
  gradient: string;
  chipClass: string;
};

type GastosCategoriasCarouselProps = {
  items: GastosCategoriasCarouselItem[];
};

export const GastosCategoriasCarousel = ({ items }: GastosCategoriasCarouselProps) => {
  const hasItems = items.length > 0;

  return (
    <section className="rounded-[32px] border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/40">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
            Resumen por categoría
          </p>
          <p className="text-base font-semibold text-slate-900 dark:text-white">¿Dónde se va el presupuesto?</p>
        </div>
        {hasItems ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Arrastrá para ver más categorías</p>
        ) : null}
      </header>

      {hasItems ? (
        <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
          {items.map((item) => {
            const safePercentage = Math.min(100, Math.max(5, Number.isFinite(item.percentage) ? item.percentage : 0));
            return (
              <article
                key={item.id}
                className="min-w-[220px] flex-1 snap-start rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow dark:border-white/10 dark:bg-slate-900/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient}`}>
                    <span className="material-symbols-rounded text-2xl text-white" aria-hidden>
                      {item.icon}
                    </span>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${item.chipClass}`}>
                    {item.label}
                  </span>
                </div>
                <p className="mt-5 text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{safePercentage.toFixed(0)}% del total</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`}
                    style={{ width: `${safePercentage}%` }}
                    aria-hidden
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
          <span className="material-symbols-rounded text-4xl text-slate-400 dark:text-slate-500" aria-hidden>
            donut_small
          </span>
          <p>No hay movimientos suficientes para segmentar por categoría.</p>
        </div>
      )}
    </section>
  );
};
