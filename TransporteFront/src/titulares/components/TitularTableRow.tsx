import type { TitularResponse } from '../types/titular.types';
import { Avatar, Badge } from '../../shared/ui';
import { getInitials, getAvatarColor } from '../helpers/avatar.helpers';

interface TitularTableRowProps {
  titular: TitularResponse;
  isSelected: boolean;
  onClick: () => void;
  rowIndex: number;
}

export const TitularTableRow = ({ titular, isSelected, onClick, rowIndex }: TitularTableRowProps) => {
  return (
    <div
      onClick={onClick}
      className={`group grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-[#e4e4e7] dark:border-[#3f3f46] cursor-pointer relative transition-colors ${
        isSelected
          ? 'bg-[#007a8a]/5 hover:bg-[#007a8a]/10'
          : rowIndex % 2 === 0
          ? 'hover:bg-gray-50 dark:hover:bg-white/5'
          : 'bg-gray-50/30 dark:bg-white/[0.01] hover:bg-gray-50 dark:hover:bg-white/5'
      }`}
    >
      {/* Active Indicator Strip */}
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#007a8a]" />}

      {/* Titular Info */}
      <div className="col-span-4 flex items-center gap-3">
        <Avatar
          initials={getInitials(titular.nombreContacto, titular.apellido)}
          colorClass={getAvatarColor(titular.id)}
        />
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
            {titular.apellido}
          </span>
          <span className={`text-xs truncate ${
            isSelected ? 'text-[#007a8a] dark:text-cyan-400 font-medium' : 'text-gray-400'
          }`}>
            ID: #{titular.id}
          </span>
        </div>
      </div>

      {/* Dirección */}
      <div className="col-span-3 text-sm text-gray-600 dark:text-gray-400 truncate pr-2" title={titular.direccion}>
        {titular.direccion}
      </div>

      {/* Monto */}
      <div className="col-span-2 text-right pr-4 text-sm font-medium text-gray-900 dark:text-gray-200 tabular-nums">
        ${titular.montoMensualPactado.toLocaleString()}
      </div>

      {/* Estado */}
      <div className="col-span-2">
        <Badge variant={titular.activo ? 'active' : 'inactive'} animated={isSelected && titular.activo} />
      </div>

      {/* Acciones */}
      <div className="col-span-1 flex justify-center">
        <button className={`size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#007a8a] hover:bg-[#007a8a]/10 transition-colors ${
          isSelected ? '' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>
    </div>
  );
};
