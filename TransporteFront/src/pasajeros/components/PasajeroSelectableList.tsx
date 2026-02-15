import type { PasajeroResponse } from '../types/pasajero.types';

interface PasajeroSelectableListProps {
  pasajeros: PasajeroResponse[];
  selectedIds: Set<number>;
  onToggle: (pasajeroId: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  targetHorarioId?: number | null;
}

const getHorarioLabel = (pasajero: PasajeroResponse) => {
  if (pasajero.horarioDescripcion) {
    return pasajero.horarioDescripcion;
  }
  if (pasajero.horario?.etiqueta) {
    return pasajero.horario.etiqueta;
  }
  return 'Sin horario asignado';
};

export const PasajeroSelectableList = ({
  pasajeros,
  selectedIds,
  onToggle,
  isLoading = false,
  emptyMessage = 'No hay pasajeros para mostrar',
  targetHorarioId = null,
}: PasajeroSelectableListProps) => {
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#007a8a]" />
          Cargando pasajeros...
        </div>
      </div>
    );
  }

  if (pasajeros.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]">
      <div className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 lg:grid lg:grid-cols-[auto_1.5fr_1fr_1fr] lg:gap-3">
        <span className="pl-6">Pasajero</span>
        <span>Colegio / Curso</span>
        <span>Horario</span>
        <span>Turno legado</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {pasajeros.map((pasajero) => {
          const isSelected = selectedIds.has(pasajero.id);
          const isAssignedToTarget = targetHorarioId !== null && pasajero.horarioId === targetHorarioId;
          const horarioLabel = getHorarioLabel(pasajero);
          const assignedToOther = typeof pasajero.horarioId === 'number' && pasajero.horarioId !== targetHorarioId;

          return (
            <label
              key={pasajero.id}
              className={`flex flex-col gap-2 px-4 py-3 transition lg:grid lg:grid-cols-[auto_1.5fr_1fr_1fr] lg:items-center lg:gap-3 ${
                isSelected ? 'bg-[#007a8a]/5 ring-1 ring-[#007a8a]/20 dark:bg-[#0f343a]' : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(pasajero.id)}
                  className="size-4 accent-[#007a8a]"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{pasajero.nombreCompleto}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Titular: {pasajero.titularApellido ?? 'Sin titular'}
                  </p>
                </div>
              </div>
              <div className="pl-7 text-sm text-gray-600 dark:text-gray-300 lg:pl-0">
                <p className="font-medium text-gray-800 dark:text-gray-200">{pasajero.colegio}</p>
                <p className="text-xs text-gray-500">{pasajero.gradoCurso}</p>
              </div>
              <div className="pl-7 lg:pl-0">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isAssignedToTarget
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : assignedToOther
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200'
                  }`}
                >
                  {horarioLabel}
                </span>
              </div>
              <div className="pl-7 text-xs text-gray-500 lg:pl-0">
                {pasajero.horarioDescripcion ? (
                  <span className="text-gray-500 dark:text-gray-400">Turno: {pasajero.turno}</span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">{pasajero.turno || '—'}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
