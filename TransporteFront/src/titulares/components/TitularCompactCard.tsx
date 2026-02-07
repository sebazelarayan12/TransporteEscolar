import { useQuery } from '@tanstack/react-query';
import type { TitularResponse } from '../types/titular.types';
import { pasajerosApi } from '../../pasajeros/services/pasajeros.api';

interface TitularCompactCardProps {
  titular: TitularResponse;
  isSelected: boolean;
  onClick: () => void;
}

export const TitularCompactCard = ({ titular, isSelected, onClick }: TitularCompactCardProps) => {
  // Obtener pasajeros del titular para mostrar colegios
  const { data: pasajeros } = useQuery({
    queryKey: ['pasajeros', 'titular', titular.id],
    queryFn: () => pasajerosApi.getByTitular(titular.id),
  });

  // Extraer colegios únicos de los pasajeros
  const colegios = pasajeros
    ? [...new Set(pasajeros.map(p => p.colegio))].filter(Boolean)
    : [];

  const colegioTexto = colegios.length > 0 
    ? colegios.length === 1 
      ? colegios[0] 
      : `${colegios.length} colegios`
    : 'Sin pasajeros';

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between gap-4 px-5 py-4 border-b border-[#e4e4e7] dark:border-[#3f3f46] cursor-pointer transition-colors active:scale-[0.98] ${
        isSelected
          ? 'bg-[#007a8a]/5'
          : 'hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10'
      }`}
    >
      {/* Info Principal */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 dark:text-white text-base truncate mb-1.5">
          {titular.apellido}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {colegioTexto}
        </p>
      </div>

      {/* Monto */}
      <span className="text-base font-bold text-gray-900 dark:text-white tabular-nums shrink-0">
        ${titular.montoMensualPactado.toLocaleString()}
      </span>
    </div>
  );
};
