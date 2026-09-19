import { AnalisisKpis } from '../components/AnalisisKpis';
import { AnalisisTable } from '../components/AnalisisTable';
import {
  useAnalisisKilometros,
  useRecalcularMarginal,
  useRecalcularRecorridos,
} from '../services/recorridos.queries';
import { useToast } from '../../shared/hooks/useToast';
import { ErrorState, EmptyState } from '../../shared/ui/Alert';
import { Skeleton } from '../../shared/ui/Skeleton';

/** Pantalla de análisis: cuánto se cobra por kilómetro recorrido, familia por familia. */
export const AnalisisKilometrosPage = () => {
  const { data: analisis, isLoading, error } = useAnalisisKilometros();
  const { mutateAsync: recalcular, isPending: recalculando } = useRecalcularRecorridos();
  const { mutateAsync: recalcularMarginal, isPending: recalculandoMarginal } = useRecalcularMarginal();
  const { showSuccess, showError } = useToast();
  // Los dos recálculos pisan los mismos datos en el servidor: nunca deben correr a la vez.
  const hayRecalculoEnCurso = recalculando || recalculandoMarginal;

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

  const ejecutarRecalculoMarginal = async () => {
    try {
      const resultado = await recalcularMarginal();
      showSuccess(
        `Marginal recalculado: ${resultado.horariosProcesados} viajes, ${resultado.consultasRealizadas} consultas`,
      );
    } catch (errorMarginal) {
      console.error('Error al recalcular la métrica marginal', errorMarginal);
      showError('No se pudo recalcular la métrica marginal');
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

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={ejecutarRecalculo}
              disabled={hayRecalculoEnCurso}
              aria-busy={recalculando}
              className="rounded-lg bg-[#007a8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00626e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {recalculando ? 'Recalculando…' : 'Recalcular todo'}
            </button>

            <button
              type="button"
              onClick={ejecutarRecalculoMarginal}
              disabled={hayRecalculoEnCurso}
              aria-busy={recalculandoMarginal}
              className="rounded-lg border border-[#007a8a] px-4 py-2 text-sm font-semibold text-[#007a8a] hover:bg-[#007a8a]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-200 dark:text-cyan-200 dark:hover:bg-cyan-200/10"
            >
              {recalculandoMarginal ? 'Calculando marginal…' : 'Recalcular marginal'}
            </button>
          </div>
        </header>

        {hayRecalculoEnCurso ? (
          <p
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
          >
            Recalculando en el servidor. Puede tardar varios minutos con el motor de ruteo público; no
            cierres la página. Si la conexión se corta, el cálculo continúa igual: refrescá el análisis
            en unos minutos.
          </p>
        ) : null}

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

            <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <p>
                <strong>Directo:</strong> distancia casa → colegio por calles, multiplicada por los
                viajes diarios y por 20 días hábiles. Sirve para comparar familias entre sí.
              </p>
              <p>
                <strong>Marginal:</strong> cuánto crece el recorrido real del viaje por pasar a
                buscar a esa familia. Es el número que conviene usar para decidir precios: una
                familia que vive lejos pero sobre el camino cuesta mucho menos de lo que sugiere la
                distancia directa.
              </p>
              <p>
                El botón de recálculo marginal hace muchas consultas al motor de ruteo y puede
                tardar varios minutos.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
