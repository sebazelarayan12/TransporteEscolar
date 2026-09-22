import { TRANSPORTE_LABELS } from '../../shared/types/transporte.types';
import { formatearDistancia, formatearDuracion } from '../../shared/utils/geo.helpers';
import type { RecorridoViajeResponse } from '../types/recorrido.types';

interface RecorridoViajeEncabezadoProps {
  recorrido: RecorridoViajeResponse;
}

/** Datos generales del viaje: horario, vehículo, sentido, total del recorrido y duración. */
export const RecorridoViajeEncabezado = ({ recorrido }: RecorridoViajeEncabezadoProps) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Horario</dt>
      <dd className="font-semibold text-gray-900 dark:text-white">{recorrido.horarioEtiqueta}</dd>
    </div>
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Vehículo</dt>
      <dd className="font-semibold text-gray-900 dark:text-white">{TRANSPORTE_LABELS[recorrido.transporte]}</dd>
    </div>
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sentido</dt>
      <dd className="font-semibold text-gray-900 dark:text-white">{recorrido.sentido}</dd>
    </div>
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total del recorrido</dt>
      <dd className="font-semibold text-gray-900 dark:text-white">
        {formatearDistancia(recorrido.distanciaTotalMetros)} · {formatearDuracion(recorrido.duracionTotalSegundos)}
      </dd>
    </div>
  </dl>
);
