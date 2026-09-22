import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState } from '../../shared/ui/Alert';
import { Skeleton } from '../../shared/ui/Skeleton';
import { useParadasFijas, useRecorridoViaje } from '../services/recorridos.queries';
import { construirFilasRecorrido } from '../helpers/recorrido-viaje.helpers';
import { RecorridoViajeEncabezado } from './RecorridoViajeEncabezado';
import { RecorridoViajeTabla } from './RecorridoViajeTabla';
import type { TransporteTipo } from '../../shared/types/transporte.types';

interface RecorridoViajePanelProps {
  horarioId: number | null;
  transporte: TransporteTipo;
}

const RecorridoViajeShell = ({ children }: { children: ReactNode }) => (
  <section className="space-y-4 rounded-2xl border border-gray-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#007a8a] dark:text-cyan-200">
        Recorrido del viaje
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        El orden real en que se maneja este viaje y los kilómetros que le tocan a cada familia.
      </p>
    </div>
    {children}
  </section>
);

/**
 * Muestra el recorrido ya calculado de un viaje (horario + vehículo): encabezado con los totales y
 * una fila por parada, con el colegio intercalado en el lugar que le toca según el sentido.
 *
 * Sin casa fija marcada no hay recorrido que mostrar; esa acción ya la cubre `ParadaFijaSelector`,
 * así que acá solo se explica el motivo, sin duplicar el botón.
 */
export const RecorridoViajePanel = ({ horarioId, transporte }: RecorridoViajePanelProps) => {
  const { data: paradasFijas, isLoading: isLoadingParadas, isError: isErrorParadas } = useParadasFijas();
  const {
    data: recorrido,
    isLoading: isLoadingRecorrido,
    isError: isErrorRecorrido,
  } = useRecorridoViaje(horarioId, transporte);

  if (!horarioId) {
    return null;
  }

  if (isLoadingParadas || isLoadingRecorrido) {
    return (
      <RecorridoViajeShell>
        <Skeleton className="h-28 w-full" />
      </RecorridoViajeShell>
    );
  }

  if (isErrorParadas || isErrorRecorrido) {
    return <ErrorState message="No se pudo cargar el recorrido de este viaje" />;
  }

  const paradaFijaDelViaje = paradasFijas?.find(
    (parada) => parada.horarioId === horarioId && parada.transporte === transporte,
  );

  // Una parada huérfana no cuenta como válida: el recálculo tampoco la usa, así que no hay
  // recorrido posible hasta que se reasigne.
  if (!paradaFijaDelViaje || !paradaFijaDelViaje.sigueViajando) {
    return (
      <RecorridoViajeShell>
        <p className="rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300">
          {paradaFijaDelViaje
            ? 'La casa fija de este viaje ya no viaja en este horario, así que no se puede calcular el recorrido. Reasignala desde Horarios.'
            : 'Este viaje todavía no tiene casa fija marcada, así que no se puede calcular el recorrido.'}
        </p>
      </RecorridoViajeShell>
    );
  }

  if (!recorrido) {
    return (
      <RecorridoViajeShell>
        <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          Este viaje ya tiene casa fija, pero el recorrido todavía no se calculó. Calculalo desde{' '}
          <Link to="/recorridos" className="font-semibold underline underline-offset-2">
            Kilómetros
          </Link>
          .
        </p>
      </RecorridoViajeShell>
    );
  }

  return (
    <RecorridoViajeShell>
      <RecorridoViajeEncabezado recorrido={recorrido} />
      <RecorridoViajeTabla filas={construirFilasRecorrido(recorrido)} />
    </RecorridoViajeShell>
  );
};
