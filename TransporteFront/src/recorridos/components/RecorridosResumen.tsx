import { formatearDistancia, formatearDuracion } from '../../shared/utils/geo.helpers';
import { Skeleton } from '../../shared/ui/Skeleton';
import type { RecorridoResponse } from '../types/recorrido.types';

export interface RecorridosResumenProps {
  recorridos: RecorridoResponse[];
  isLoading: boolean;
}

/** Formatea kilómetros mensuales truncando a dos decimales, como el resto del sistema. */
const formatearKilometros = (kilometros: number): string => {
  const truncado = Math.trunc(kilometros * 100) / 100;
  return `${truncado.toFixed(2).replace('.', ',')} km`;
};

/** Tabla de recorridos calculados del titular: uno por colegio de destino. */
export const RecorridosResumen = ({ recorridos, isLoading }: RecorridosResumenProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (recorridos.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Todavía no hay recorridos calculados. Marcá la ubicación de la casa y asegurate de que los
        pasajeros tengan horarios asignados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Recorridos calculados del titular</caption>
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <th scope="col" className="py-2 pr-4 font-semibold">Colegio</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Distancia</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Tiempo</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Viajes/día</th>
            <th scope="col" className="py-2 font-semibold">Km/mes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
          {recorridos.map((recorrido) => (
            <tr key={recorrido.colegioId}>
              <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-100">
                {recorrido.colegioNombre}
              </td>
              <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                {formatearDistancia(recorrido.distanciaMetros)}
              </td>
              <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">
                {formatearDuracion(recorrido.duracionSegundos)}
              </td>
              <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{recorrido.viajesDiarios}</td>
              <td className="py-2 font-semibold text-zinc-900 dark:text-zinc-100">
                {formatearKilometros(recorrido.kilometrosMensuales)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
