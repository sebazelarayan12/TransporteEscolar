import { Link } from 'react-router-dom';
import { Amount } from '../../shared/ui/Amount';
import { formatearKilometros } from '../../shared/utils/geo.helpers';
import { getTitularApellidoDisplay } from '../../shared/utils/titulares.helpers';
import type { AnalisisFila } from '../types/recorrido.types';

export interface AnalisisTableProps {
  filas: AnalisisFila[];
}

/** Celda sin dato: se ve un guion, pero un lector de pantalla anuncia "sin dato". */
const SinDato = () => (
  <>
    <span aria-hidden="true">—</span>
    <span className="sr-only">sin dato</span>
  </>
);

/**
 * Tabla del análisis, ordenada de menor a mayor precio por kilómetro.
 * Las filas sin ubicación quedan al final porque no tienen dato, no porque sean baratas.
 */
export const AnalisisTable = ({ filas }: AnalisisTableProps) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <table className="w-full text-sm">
        <caption className="sr-only">
          Titulares ordenados por precio cobrado por kilómetro recorrido
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <th scope="col" className="px-4 py-3 font-semibold">Titular</th>
            <th scope="col" className="px-4 py-3 font-semibold">Colegios</th>
            <th scope="col" className="px-4 py-3 font-semibold">Km directos/mes</th>
            <th scope="col" className="px-4 py-3 font-semibold">Cuota</th>
            <th scope="col" className="px-4 py-3 font-semibold">$/km directo</th>
            <th scope="col" className="px-4 py-3 font-semibold">Km asignados/mes</th>
            <th scope="col" className="px-4 py-3 font-semibold">$/km asignado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
          {filas.map((fila) => (
            <tr key={fila.titularId} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/40">
              <td className="px-4 py-3">
                <Link
                  to={`/titulares/${fila.titularId}`}
                  className="font-medium text-[#007a8a] hover:underline dark:text-cyan-200"
                >
                  {getTitularApellidoDisplay(fila.apellido)}
                </Link>
                {!fila.tieneUbicacion ? (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
                    sin ubicación
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                {fila.colegios.length > 0 ? fila.colegios.join(', ') : <SinDato />}
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                {fila.kilometrosMensuales > 0 ? formatearKilometros(fila.kilometrosMensuales) : <SinDato />}
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                <Amount value={fila.montoMensual} />
              </td>
              <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                {fila.precioPorKilometro === null ? <SinDato /> : <Amount value={fila.precioPorKilometro} />}
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                {fila.kilometrosAsignadosMensuales > 0 ? (
                  formatearKilometros(fila.kilometrosAsignadosMensuales)
                ) : (
                  <SinDato />
                )}
              </td>
              <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                {fila.precioPorKilometroAsignado === null ? (
                  <SinDato />
                ) : (
                  <Amount value={fila.precioPorKilometroAsignado} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
