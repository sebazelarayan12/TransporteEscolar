import type { TitularResponse } from '../types/titular.types';
import { Avatar } from '../../shared/ui/Avatar';
import { getInitials, getAvatarColor } from '../helpers/avatar.helpers';

interface TitularDetailHeaderProps {
  titular: TitularResponse;
  onClose?: () => void;
  compact?: boolean;
}

// Clases completas por variante (Tailwind no detecta clases armadas con interpolación)
const VARIANT_STYLES = {
  compact: {
    container: 'px-6 py-4',
    column: 'gap-3 w-full',
    row: 'gap-3',
    closeButton: 'p-2 -mr-2',
    closeIcon: 'text-[24px]',
    avatarSize: 'lg',
    avatarClass: '',
    info: 'flex-1 min-w-0',
    name: 'text-lg truncate',
    contact: 'mt-0 truncate',
    location: 'mt-0.5',
    locationIcon: 'text-[12px]',
    locationText: 'truncate',
  },
  regular: {
    container: 'p-6 rounded-t-xl',
    column: 'gap-4 w-full',
    row: 'gap-4',
    closeButton: 'p-1',
    closeIcon: 'text-[20px]',
    avatarSize: 'xl',
    avatarClass: 'shadow-md ring-2 ring-white dark:ring-gray-700 rounded-2xl',
    info: '',
    name: 'text-xl',
    contact: 'mt-0.5',
    location: 'mt-1',
    locationIcon: 'text-[14px]',
    locationText: '',
  },
} as const;

export const TitularDetailHeader = ({ titular, onClose, compact = false }: TitularDetailHeaderProps) => {
  const styles = VARIANT_STYLES[compact ? 'compact' : 'regular'];

  return (
    <div
      className={`${styles.container} border-b border-[#e4e4e7] dark:border-[#3f3f46] flex items-start justify-between bg-linear-to-r from-gray-50 to-white dark:from-white/5 dark:to-transparent`}
    >
      <div className={`flex flex-col ${styles.column}`}>
        <div className="flex justify-between items-start w-full">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Cuenta {titular.activo ? 'Activa' : 'Inactiva'}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle del titular"
              className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ${styles.closeButton} hover:bg-black/5 dark:hover:bg-white/10 rounded-lg`}
            >
              <span className={`material-symbols-outlined ${styles.closeIcon}`}>close</span>
            </button>
          )}
        </div>
        <div className={`flex items-center ${styles.row}`}>
          <Avatar
            initials={getInitials(titular.nombreContacto, titular.apellido)}
            colorClass={getAvatarColor(titular.id)}
            size={styles.avatarSize}
            className={styles.avatarClass}
          />
          <div className={styles.info}>
            <h3 className={`${styles.name} font-bold text-gray-900 dark:text-white leading-tight`}>
              {titular.apellido}
            </h3>
            <p className={`text-sm text-gray-500 dark:text-gray-400 ${styles.contact}`}>{titular.nombreContacto}</p>
            <div className={`flex items-center gap-1 ${styles.location} text-xs text-gray-400`}>
              <span className={`material-symbols-outlined ${styles.locationIcon}`}>location_on</span>
              <span className={styles.locationText}>{titular.direccion}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
