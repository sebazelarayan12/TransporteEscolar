import type { ResumenTotales } from '../types/gastos.types';
import { formatCurrency } from '../../shared/utils/currency.helpers';

interface GastosHeroCardProps {
  totales: ResumenTotales;
  periodLabel: string;
}

const heroMetrics: Array<{ key: keyof ResumenTotales; label: string; icon: string }> = [
  { key: 'totalCuotas', label: 'Ingresos estimados', icon: 'savings' },
  { key: 'totalGastosFijos', label: 'Gastos fijos', icon: 'deployed_code' },
  { key: 'totalGastosVariables', label: 'Gastos variables', icon: 'local_gas_station' },
  { key: 'gananciaNeta', label: 'Ganancia neta', icon: 'trending_up' },
];

export const GastosHeroCard = ({ totales, periodLabel }: GastosHeroCardProps) => {
  const netPositive = totales.gananciaNeta >= 0;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#005a73] via-[#007f96] to-[#00a9a0] text-white shadow-xl">
      <div className="absolute -right-16 -top-16 size-48 rounded-full bg-white/20 blur-3xl" aria-hidden />
      <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" aria-hidden />

      <div className="relative z-10 flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/80">Control de gastos</p>
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">{periodLabel}</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
            Visualizá la salud financiera del mes y detectá desvíos antes de que impacten en la rentabilidad.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Resultado neto</span>
          <p className={`text-2xl font-bold ${netPositive ? 'text-emerald-200' : 'text-rose-100'}`}>
            {formatCurrency(totales.gananciaNeta)}
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">
              {netPositive ? 'north_east' : 'south_west'}
            </span>
            {netPositive ? 'Por encima del equilibrio' : 'Por debajo del equilibrio'}
          </span>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/20 px-6 py-5 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroMetrics.map((metric) => (
            <article
              key={metric.key}
              className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-inner backdrop-blur"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/70">
                <span>{metric.label}</span>
                <span className="material-symbols-outlined text-base text-white">{metric.icon}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(totales[metric.key])}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
