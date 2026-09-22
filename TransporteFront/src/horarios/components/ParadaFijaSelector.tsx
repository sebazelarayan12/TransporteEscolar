import type { ReactNode } from 'react';
import { ErrorState, Skeleton } from '../../shared/ui';
import { useAnalisisKilometros, useParadasFijas } from '../../recorridos/services/recorridos.queries';
import { getTitularesDelViaje } from '../helpers/parada-fija.helpers';
import { ParadaFijaCuerpo } from './ParadaFijaCuerpo';
import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

interface ParadaFijaSelectorProps {
  horarioId: number | null;
  transporte: TransporteTipo;
  pasajerosDelHorario: PasajeroResponse[];
  isLoadingPasajeros: boolean;
}

const ParadaFijaShell = ({ children }: { children: ReactNode }) => (
  <section className="space-y-3 rounded-2xl border border-gray-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#007a8a] dark:text-cyan-200">
        Casa fija del recorrido
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        La casa que arranca el recorrido en los horarios de ida, o la que lo cierra en los de vuelta. Sin
        marcarla, este viaje no se puede repartir.
      </p>
    </div>
    {children}
  </section>
);

/**
 * Marca (o cambia) la casa fija de un viaje: la parada que arranca el recorrido en los
 * horarios de ida, o la que lo cierra en los de vuelta. Es obligatoria para que el reparto
 * de kilómetros de ese viaje se pueda calcular.
 */
export const ParadaFijaSelector = ({
  horarioId,
  transporte,
  pasajerosDelHorario,
  isLoadingPasajeros,
}: ParadaFijaSelectorProps) => {
  const { data: paradasFijas, isLoading: isLoadingParadas, isError: isErrorParadas } = useParadasFijas();
  const { data: analisis, isLoading: isLoadingAnalisis, isError: isErrorAnalisis } = useAnalisisKilometros();

  if (!horarioId) {
    return null;
  }

  if (isLoadingPasajeros || isLoadingParadas || isLoadingAnalisis) {
    return (
      <ParadaFijaShell>
        <Skeleton className="h-16 w-full" />
      </ParadaFijaShell>
    );
  }

  if (isErrorParadas || isErrorAnalisis) {
    return <ErrorState message="No se pudo cargar la casa fija de este viaje" />;
  }

  const ubicacionPorTitular = new Map(analisis?.filas.map((fila) => [fila.titularId, fila.tieneUbicacion]) ?? []);
  const titularesDelViaje = getTitularesDelViaje(pasajerosDelHorario, horarioId, transporte, ubicacionPorTitular);
  const paradaFijaActual = paradasFijas?.find(
    (parada) => parada.horarioId === horarioId && parada.transporte === transporte,
  );

  return (
    <ParadaFijaShell>
      <ParadaFijaCuerpo
        horarioId={horarioId}
        transporte={transporte}
        titularesDelViaje={titularesDelViaje}
        paradaFijaActual={paradaFijaActual}
      />
    </ParadaFijaShell>
  );
};
