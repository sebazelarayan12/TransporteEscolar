import type { PasajeroHorarioAsignado } from '../types/pasajero.types';

interface PasajeroHorarioBadgesProps {
  horarios?: PasajeroHorarioAsignado[];
  emptyLabel?: string;
  size?: 'sm' | 'md';
}

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
};

const iconClasses: Record<'sm' | 'md', string> = {
  sm: 'text-[12px]',
  md: 'text-[14px]',
};

export const PasajeroHorarioBadges = ({
  horarios,
  emptyLabel = 'Sin horario',
  size = 'md',
}: PasajeroHorarioBadgesProps) => {
  const items = horarios ?? [];

  if (!items.length) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((horario) => (
        <span
          key={`${horario.horarioId}-${horario.prioridad ?? 'default'}`}
          className={`inline-flex items-center rounded-full bg-gray-100 font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200 ${sizeClasses[size]}`}
        >
          <span className={`material-symbols-outlined text-[#007a8a] dark:text-white ${iconClasses[size]}`}>
            schedule
          </span>
          {horario.nombreHorario}
        </span>
      ))}
    </div>
  );
};
