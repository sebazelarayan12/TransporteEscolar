import { Link } from 'react-router-dom';
import { TRANSPORTE_LABELS } from '../../shared/types/transporte.types';
import type { ViajePendiente } from '../types/recorrido.types';

interface PendientesRepartoAvisoProps {
  pendientes: ViajePendiente[];
}

/** Lista los viajes que el último recálculo de reparto no pudo repartir por falta de casa fija. */
export const PendientesRepartoAviso = ({ pendientes }: PendientesRepartoAvisoProps) => {
  if (pendientes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
      <p className="font-semibold">
        {pendientes.length === 1
          ? 'Quedó 1 viaje sin repartir porque le falta la casa fija'
          : `Quedaron ${pendientes.length} viajes sin repartir porque les falta la casa fija`}
      </p>
      <p>
        Sus kilómetros asignados quedan en blanco hasta que se marque. Marcala desde{' '}
        <Link to="/horarios" className="font-semibold underline underline-offset-2">
          Horarios
        </Link>
        .
      </p>
      <ul className="space-y-1">
        {pendientes.map((viaje) => (
          <li key={`${viaje.horarioId}-${viaje.transporte}`} className="rounded-md bg-white/60 px-3 py-2 dark:bg-black/10">
            <span className="font-semibold">{viaje.horarioEtiqueta}</span>{' '}
            <span>({TRANSPORTE_LABELS[viaje.transporte]})</span> — {viaje.motivo}
          </li>
        ))}
      </ul>
    </div>
  );
};
