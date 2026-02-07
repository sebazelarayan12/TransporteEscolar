import type { PasajeroResponse } from '../types/pasajero.types';

interface PasajeroCompactCardProps {
  pasajero: PasajeroResponse;
  isSelected: boolean;
  onClick: () => void;
}

export const PasajeroCompactCard = ({ pasajero, isSelected, onClick }: PasajeroCompactCardProps) => {
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
    </div>
  );
};
