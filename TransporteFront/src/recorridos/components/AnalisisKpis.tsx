import { Amount } from '../../shared/ui/Amount';
import { formatearKilometros } from '../../shared/utils/geo.helpers';
import type { AnalisisResponse } from '../types/recorrido.types';

export interface AnalisisKpisProps {
  analisis: AnalisisResponse;
}

/** Cuatro números de cabecera del análisis. */
export const AnalisisKpis = ({ analisis }: AnalisisKpisProps) => {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Kilómetros por mes
        </dt>
        <dd className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {formatearKilometros(analisis.kilometrosTotales)}
        </dd>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Recaudación mensual
        </dt>
        <dd className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          <Amount value={analisis.recaudacionTotal} />
        </dd>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Promedio por kilómetro
        </dt>
        <dd className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {analisis.precioPromedioPorKilometro === null ? (
            '—'
          ) : (
            <Amount value={analisis.precioPromedioPorKilometro} />
          )}
        </dd>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
        <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Sin ubicación marcada
        </dt>
        <dd className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {analisis.titularesSinUbicacion}
        </dd>
      </div>
    </dl>
  );
};
