import { formatearDistancia } from '../../shared/utils/geo.helpers';
import type { FilaRecorrido } from '../helpers/recorrido-viaje.helpers';

interface RecorridoViajeTablaProps {
  filas: FilaRecorrido[];
}

/**
 * Una fila por parada (más la fila del colegio, en el lugar que le toca según el sentido).
 * Las últimas dos columnas van una al lado de la otra a propósito: el punto de la pantalla es que
 * la posición en el recorrido no predice el costo.
 */
export const RecorridoViajeTabla = ({ filas }: RecorridoViajeTablaProps) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
    <table className="w-full text-sm">
      <caption className="sr-only">
        Paradas del recorrido en orden de visita, con los kilómetros de cada tramo y los asignados a cada
        familia
      </caption>
      <thead>
        <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-white/10 dark:text-gray-400">
          <th scope="col" className="px-3 py-2 font-semibold">
            Orden
          </th>
          <th scope="col" className="px-3 py-2 font-semibold">
            Parada
          </th>
          <th scope="col" className="px-3 py-2 font-semibold">
            Tramo anterior
          </th>
          <th scope="col" className="px-3 py-2 font-semibold">
            Asignado (viaje)
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-white/10">
        {filas.map((fila) => (
          <tr key={fila.key} className={fila.esColegio ? 'bg-gray-50 dark:bg-white/5' : undefined}>
            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{fila.ordenLabel}</td>
            <td className="px-3 py-2">
              <span className="font-medium text-gray-900 dark:text-white">{fila.nombre}</span>
              {fila.etiquetaParadaFija ? (
                <span className="ml-2 rounded-full bg-[#007a8a]/10 px-2 py-0.5 text-xs font-semibold text-[#007a8a] dark:bg-cyan-200/10 dark:text-cyan-200">
                  {fila.etiquetaParadaFija}
                </span>
              ) : null}
            </td>
            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
              {formatearDistancia(fila.metrosTramoAnterior)}
            </td>
            <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">
              {formatearDistancia(fila.metrosAsignados)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
