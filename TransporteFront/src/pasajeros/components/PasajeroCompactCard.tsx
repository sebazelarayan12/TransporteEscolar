import type { PasajeroResponse } from '../types/pasajero.types';
import { PasajeroHorarioBadges } from './PasajeroHorarioBadges';
import { formatPasajeroHorariosListado } from '../helpers/horario.helpers';

interface PasajeroCompactCardProps {
  pasajero: PasajeroResponse;
  isSelected: boolean;
  onClick: () => void;
}

export const PasajeroCompactCard = ({ pasajero, isSelected, onClick }: PasajeroCompactCardProps) => {
  const horariosListado = formatPasajeroHorariosListado(pasajero.horariosAsignados) || 'Sin horarios asignados';

  return (
    <div
      onClick={onClick}
      className={`px-5 py-4 border-b border-[#e4e4e7] dark:border-[#3f3f46] cursor-pointer transition-colors active:scale-[0.98] ${
        isSelected
          ? 'bg-[#007a8a]/5'
          : 'hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10'
      }`}
    >
      {/* Nombre del Pasajero */}
      <div className="font-bold text-gray-900 dark:text-white text-base truncate mb-1.5">
        {pasajero.nombreCompleto}
      </div>
      
      {/* Titular y Colegio */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <span className="truncate">
          {pasajero.titularApellido || 'Sin titular'}
        </span>
        <span>•</span>
        <span className="truncate">
          {pasajero.colegio}
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-white/5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Horarios</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{horariosListado}</p>
        <div className="mt-1">
          <PasajeroHorarioBadges horarios={pasajero.horariosAsignados} size="sm" />
        </div>
      </div>
    </div>
  );
};
