import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import { formatPasajeroHorariosListado } from '../../pasajeros/helpers/horario.helpers';

interface SelectedPasajeroSummaryProps {
  pasajero: PasajeroResponse | null;
}

export const SelectedPasajeroSummary = ({ pasajero }: SelectedPasajeroSummaryProps) => {
  const horariosTexto = pasajero ? formatPasajeroHorariosListado(pasajero.horariosAsignados) : null;

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">
      {pasajero ? (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-[#1d8ca5]">{pasajero.nombreCompleto}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {pasajero.colegio} • {pasajero.gradoCurso} • {horariosTexto || 'Sin horarios'}
          </p>
        </div>
      ) : (
        <p>Seleccioná un pasajero para habilitar las acciones de registro.</p>
      )}
    </div>
  );
};
