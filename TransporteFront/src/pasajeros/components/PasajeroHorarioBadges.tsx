import type { PasajeroHorarioAsignado } from '../types/pasajero.types';
import { getPasajeroHorariosResumen } from '../helpers/horario.helpers';

interface PasajeroHorarioBadgesProps {
  horarios?: PasajeroHorarioAsignado[];
  emptyLabel?: string;
  size?: 'sm' | 'md';
  maxVisible?: number;
}

const textSizeClasses: Record<'sm' | 'md', string> = {
  sm: 'text-[11px] leading-4',
  md: 'text-xs leading-[18px]',
};

const stackGapClasses: Record<'sm' | 'md', string> = {
  sm: 'gap-1',
  md: 'gap-1.5',
};

export const PasajeroHorarioBadges = ({
  horarios,
  emptyLabel = 'Sin horarios asignados',
  size = 'md',
  maxVisible,
}: PasajeroHorarioBadgesProps) => {
  const items = horarios ?? [];

  if (!items.length) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">{emptyLabel}</span>;
  }

  const { visible, remaining } = getPasajeroHorariosResumen(items, maxVisible);

  return (
    <div className={`flex flex-col ${stackGapClasses[size]}`}>
      {visible.map((entry) => (
        <span
          key={entry.key}
          className={`truncate font-medium text-gray-700 dark:text-gray-200 ${textSizeClasses[size]}`}
          title={entry.label}
        >
          {entry.label}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          +{remaining} más
        </span>
      ) : null}
    </div>
  );
};
