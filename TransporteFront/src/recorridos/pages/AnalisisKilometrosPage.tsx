import { AnalisisKpis } from '../components/AnalisisKpis';
import { AnalisisTable } from '../components/AnalisisTable';
import { useAnalisisKilometros, useRecalcularRecorridos } from '../services/recorridos.queries';
import { useToast } from '../../shared/hooks/useToast';
import { ErrorState, EmptyState } from '../../shared/ui/Alert';
import { Skeleton } from '../../shared/ui/Skeleton';

/** Pantalla de análisis: cuánto se cobra por kilómetro recorrido, familia por familia. */
export const AnalisisKilometrosPage = () => {
  const { data: analisis, isLoading, error } = useAnalisisKilometros();
  const { mutateAsync: recalcular, isPending: recalculando } = useRecalcularRecorridos();
  const { showSuccess, showError } = useToast();

  const ejecutarRecalculo = async () => {
    try {
      const resultado = await recalcular();
      showSuccess(
        `Recálculo terminado: ${resultado.calculados} calculados, ${resultado.omitidos} ya vigentes, ${resultado.fallidos} fallidos`,
      );
    } catch (errorRecalculo) {
      console.error('Error al recalcular recorridos', errorRecalculo);
      showError('No se pudo completar el recálculo');
    }
  };

  return (
    <div className="w-full bg-[#fafafa] dark:bg-[#18181b]">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Kilómetros y precio por kilómetro
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Distancia directa entre la casa y el colegio, multiplicada por los viajes diarios y
              por 20 días hábiles.
            </p>
          </div>

          <button
            type="button"
            onClick={ejecutarRecalculo}
            disabled={recalculando}
            aria-busy={recalculando}
            className="rounded-lg bg-[#007a8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00626e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {recalculando ? 'Recalculando…' : 'Recalcular todo'}
          </button>
        </header>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {['kpi-1', 'kpi-2', 'kpi-3', 'kpi-4'].map((clave) => (
                <Skeleton key={clave} className="h-24 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        ) : null}

        {!isLoading && error ? (
          <ErrorState message="No se pudo cargar el análisis de kilómetros" />
        ) : null}

        {!isLoading && !error && analisis ? (
          <>
            <AnalisisKpis analisis={analisis} />

            {analisis.filas.length === 0 ? (
              <EmptyState message="No hay titulares activos para analizar" />
            ) : (
              <AnalisisTable filas={analisis.filas} />
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Este número usa la distancia directa entre la casa y el colegio. No es lo que la combi
              recorre de más por pasar a buscar a esa familia: para eso está la distancia marginal.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
};
