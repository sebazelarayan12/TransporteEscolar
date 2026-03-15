import type { ReactNode } from 'react';
import { formatCurrency } from '../../shared/utils/currency.helpers';

interface GastosHeroTotals {
  totalCuotas: number;
  totalGastosFijos: number;
  totalGastosVariables: number;
  totalIngresosExternos: number;
  totalIngresosFijos: number;
  totalIngresosVariables: number;
  gastosVariablesPendientes: number;
  gastosVariablesPagados: number;
}

interface GastosHeroCardProps {
  totales: GastosHeroTotals;
  periodLabel: string;
  periodFilter?: ReactNode;
}

export const GastosHeroCard = ({ totales, periodLabel, periodFilter }: GastosHeroCardProps) => {
  const totalGastos = totales.totalGastosFijos + totales.totalGastosVariables;
  const netResult = totales.totalCuotas + totales.totalIngresosExternos - totalGastos;
  const netPositive = netResult >= 0;
  const heroMetrics = [
    { key: 'totalCuotas', label: 'Ingresos por cuotas', icon: 'savings', value: totales.totalCuotas },
    {
      key: 'totalIngresosExternos',
      label: 'Ingresos externos',
      icon: 'volunteer_activism',
      value: totales.totalIngresosExternos,
    },
    { key: 'totalGastosFijos', label: 'Gastos fijos', icon: 'deployed_code', value: totales.totalGastosFijos },
    { key: 'totalGastosVariables', label: 'Gastos variables', icon: 'local_gas_station', value: totales.totalGastosVariables },
  ];

  return (
    <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-800 text-white shadow-2xl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-8 -top-8 size-48 rounded-full bg-emerald-400/30 blur-3xl" aria-hidden />
        <div className="absolute -right-20 top-10 size-64 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/3 h-40 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal-200">Control de gastos</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">{periodLabel}</h2>
            <p className="mt-1 text-sm text-white/80 sm:text-base">
              Estado de caja vs. obligaciones. Ajustá rápido cuando la curva se desbalancea.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/20 bg-black/20 p-5 shadow-inner">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">Resultado neto</p>
                <p className={`mt-3 text-4xl font-semibold ${netPositive ? 'text-emerald-200' : 'text-rose-200'}`}>
                  {formatCurrency(netResult)}
                </p>
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90">
                  <span className="material-symbols-rounded text-base" aria-hidden>
                    {netPositive ? 'trending_up' : 'trending_down'}
                  </span>
                  {netPositive ? 'Por encima del equilibrio' : 'Requiere atención inmediata'}
                </span>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-inner">
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">Ingresos vs. gastos</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {formatCurrency(totales.totalCuotas + totales.totalIngresosExternos)}
                </p>
                <p className="text-xs text-white/80">Total de ingresos</p>
                <p className="mt-3 text-xl font-semibold text-white/90">{formatCurrency(totalGastos)}</p>
                <p className="text-xs text-white/70">Total de gastos</p>
              </div>
            </div>
          </div>
          {periodFilter ? <div className="w-full max-w-sm lg:self-stretch">{periodFilter}</div> : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {heroMetrics.map((metric) => (
            <article
              key={metric.key}
              className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-inner backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
                <span>{metric.label}</span>
                <span className="material-symbols-rounded text-lg text-white" aria-hidden>
                  {metric.icon}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{formatCurrency(metric.value)}</p>
              {metric.key === 'totalIngresosExternos' ? (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-white/90">
                    <span className="material-symbols-rounded text-sm" aria-hidden>
                      task_alt
                    </span>
                    Fijo {formatCurrency(totales.totalIngresosFijos)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-white/80">
                    <span className="material-symbols-rounded text-sm" aria-hidden>
                      contrast
                    </span>
                    Variable {formatCurrency(totales.totalIngresosVariables)}
                  </span>
                </div>
              ) : metric.key === 'totalGastosVariables' ? (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-amber-100">
                    <span className="material-symbols-rounded text-sm" aria-hidden>
                      pending_actions
                    </span>
                    Pendiente {formatCurrency(totales.gastosVariablesPendientes)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-100">
                    <span className="material-symbols-rounded text-sm" aria-hidden>
                      task_alt
                    </span>
                    Pagado {formatCurrency(totales.gastosVariablesPagados)}
                  </span>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
