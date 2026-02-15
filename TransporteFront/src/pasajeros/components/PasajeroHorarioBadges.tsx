import type { PasajeroHorarioAsignado } from '../types/pasajero.types';

interface PasajeroHorarioBadgesProps {
  horarios?: PasajeroHorarioAsignado[];
  emptyLabel?: string;
  size?: 'sm' | 'md';
  highlightPrincipal?: boolean;
}

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export const PasajeroHorarioBadges = ({
  horarios,
  emptyLabel = 'Sin horario',
  size = 'md',
  highlightPrincipal = true,
}: PasajeroHorarioBadgesProps) => {
  const items = horarios ?? [];

  if (!items.length) {
    return <span className="text-xs text-gray-500 dark:text-gray-400">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((horario) => {
        const baseClasses = horario.esPrincipal && highlightPrincipal
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100'
          : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200';

        return (
          <span
            key={`${horario.horarioId}-${horario.prioridad ?? 'default'}`}
            className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]} ${baseClasses}`}
          >
            {horario.esPrincipal && highlightPrincipal ? (
              <span className="material-symbols-outlined text-[14px]">star</span>
            ) : null}
            {horario.nombreHorario}
          </span>
        );
      })}
    </div>
  );
};
