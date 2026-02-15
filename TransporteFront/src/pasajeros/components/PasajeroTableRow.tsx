import type { PasajeroResponse } from '../types/pasajero.types';
import { PasajeroHorarioBadges } from './PasajeroHorarioBadges';

interface PasajeroTableRowProps {
  pasajero: PasajeroResponse;
  isSelected: boolean;
  onSelect: (pasajero: PasajeroResponse) => void;
}

export const PasajeroTableRow = ({ pasajero, isSelected, onSelect }: PasajeroTableRowProps) => {
  const statusStyles = pasajero.activo
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
    : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300';

  return (
    <button
      type="button"
      onClick={() => onSelect(pasajero)}
      className={`grid w-full grid-cols-8 items-center gap-3 px-5 py-4 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-white/5 ${
        isSelected ? 'bg-[#007a8a]/5 ring-1 ring-[#007a8a]/30' : ''
      }`}
    >
      <div className="col-span-3 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-base font-bold text-gray-600 dark:bg-white/10 dark:text-white">
          {pasajero.nombreCompleto.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{pasajero.nombreCompleto}</p>
          <p className="text-xs text-gray-500">ID #{pasajero.id}</p>
        </div>
      </div>
      <span className="truncate text-sm text-gray-600 dark:text-gray-300">{pasajero.titularApellido || '—'}</span>
      <span className="truncate text-sm text-gray-600 dark:text-gray-300">{pasajero.colegio}</span>
      <span className="text-sm text-gray-600 dark:text-gray-300">{pasajero.gradoCurso}</span>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
        <PasajeroHorarioBadges horarios={pasajero.horariosAsignados} maxVisible={2} />
      </div>
      <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-bold ${statusStyles}`}>
        {pasajero.activo ? 'Activo' : 'Inactivo'}
      </span>
    </button>
  );
};
