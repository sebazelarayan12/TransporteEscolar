import type { TitularResponse } from '../types/titular.types';
import { Avatar } from '../../shared/ui';
import { getInitials, getAvatarColor } from '../utils/avatar.utils';

interface TitularDetailHeaderProps {
  titular: TitularResponse;
  onClose?: () => void;
  compact?: boolean;
}

export const TitularDetailHeader = ({ titular, onClose, compact = false }: TitularDetailHeaderProps) => {
  return (
    <div className={`${compact ? 'px-6 py-4' : 'p-6'} border-b border-[#e4e4e7] dark:border-[#3f3f46] flex items-start justify-between bg-gradient-to-r from-gray-50 to-white dark:from-white/5 dark:to-transparent ${compact ? '' : 'rounded-t-xl'}`}>
      <div className={`flex flex-col gap-${compact ? '3' : '4'} w-full`}>
        <div className="flex justify-between items-start w-full">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Cuenta {titular.activo ? 'Activa' : 'Inactiva'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ${compact ? 'p-2 -mr-2' : 'p-1'} hover:bg-black/5 dark:hover:bg-white/10 rounded-lg`}
            >
              <span className={`material-symbols-outlined ${compact ? 'text-[24px]' : 'text-[20px]'}`}>close</span>
            </button>
          )}
        </div>
        <div className={`flex items-center gap-${compact ? '3' : '4'}`}>
          <Avatar
            initials={getInitials(titular.nombreContacto, titular.apellido)}
            colorClass={getAvatarColor(titular.id)}
            size={compact ? 'lg' : 'xl'}
            className={compact ? '' : 'shadow-md ring-2 ring-white dark:ring-gray-700 rounded-2xl'}
          />
          <div className={compact ? 'flex-1 min-w-0' : ''}>
            <h3 className={`${compact ? 'text-lg truncate' : 'text-xl'} font-bold text-gray-900 dark:text-white leading-tight`}>
              {titular.apellido}
            </h3>
            <p className={`text-sm text-gray-500 dark:text-gray-400 ${compact ? 'mt-0 truncate' : 'mt-0.5'}`}>
              {titular.nombreContacto}
            </p>
            <div className={`flex items-center gap-1 ${compact ? 'mt-0.5' : 'mt-1'} text-xs text-gray-400`}>
              <span className={`material-symbols-outlined ${compact ? 'text-[12px]' : 'text-[14px]'}`}>location_on</span>
              <span className={compact ? 'truncate' : ''}>{titular.direccion}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
