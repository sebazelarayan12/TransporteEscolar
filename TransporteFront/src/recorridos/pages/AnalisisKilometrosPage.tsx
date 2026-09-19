import { AnalisisKpis } from '../components/AnalisisKpis';
import { AnalisisTable } from '../components/AnalisisTable';
import {
  useAnalisisKilometros,
  useRecalcularReparto,
  useRecalcularRecorridos,
} from '../services/recorridos.queries';
import { useToast } from '../../shared/hooks/useToast';
import { ErrorState, EmptyState } from '../../shared/ui/Alert';
import { Skeleton } from '../../shared/ui/Skeleton';

/** Pantalla de análisis: cuánto se cobra por kilómetro recorrido, familia por familia. */
export const AnalisisKilometrosPage = () => {
  const { data: analisis, isLoading, error } = useAnalisisKilometros();
  const { mutateAsync: recalcular, isPending: recalculando } = useRecalcularRecorridos();
  const { mutateAsync: recalcularReparto, isPending: recalculandoReparto } = useRecalcularReparto();
  const { showSuccess, showError } = useToast();
  // Los dos recálculos pisan los mismos datos en el servidor: nunca deben correr a la vez.
  const hayRecalculoEnCurso = recalculando || recalculandoReparto;

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

  const ejecutarRecalculoReparto = async () => {
    try {
      const resultado = await recalcularReparto();
      const aproximados =
        resultado.viajesAproximados > 0 ? `, ${resultado.viajesAproximados} aproximados` : '';
      showSuccess(
        `Reparto recalculado: ${resultado.viajesProcesados} viajes, ${resultado.consultasRealizadas} consultas${aproximados}`,
      );
    } catch (errorReparto) {
      console.error('Error al recalcular el reparto', errorReparto);
      showError('No se pudo recalcular el reparto');
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
              onClick={ejecutarRecalculoReparto}
              disabled={hayRecalculoEnCurso}
              aria-busy={recalculandoReparto}
              className="rounded-lg border border-[#007a8a] px-4 py-2 text-sm font-semibold text-[#007a8a] hover:bg-[#007a8a]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-200 dark:text-cyan-200 dark:hover:bg-cyan-200/10"
            >
              {recalculandoReparto ? 'Calculando reparto…' : 'Recalcular reparto'}
            </button>
          </div>
        </header>

        {hayRecalculoEnCurso ? (
          <p
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
          >
            {recalculando
              ? 'Recalculando los recorridos en el servidor. Puede tardar varios minutos; no cierres la página. Si la conexión se corta, el cálculo continúa igual: refrescá el análisis en unos minutos.'
              : 'Recalculando el reparto en el servidor. Puede tardar unos segundos; no cierres la página.'}
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
                <strong>Directo:</strong> distancia de la casa al colegio por calles, multiplicada
                por los viajes diarios y por 20 días hábiles. Sirve para comparar familias entre sí.
              </p>
              <p>
                <strong>Asignado:</strong> la parte que le toca a cada familia de los kilómetros que
                la combi realmente recorre, repartidos con el valor de Shapley. La suma de todas las
                familias da exactamente el recorrido real, así que es el número que conviene usar
                para decidir precios: una familia que queda de paso recibe menos que su distancia
                directa, y una que obliga a desviarse recibe más.
              </p>
              <p>
                El recálculo del reparto consulta el motor de ruteo una vez por viaje y puede tardar
                algunos segundos.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
