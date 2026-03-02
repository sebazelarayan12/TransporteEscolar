import type { PasajeroResponse } from '../types/pasajero.types';
import { TRANSPORTE_LABELS, TRANSPORTE_TIPOS } from '../../shared/types/transporte.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';
import { getPasajeroHorarioAsignado, getPasajeroHorariosResumen } from '../helpers/horario.helpers';

interface PasajeroSelectableListProps {
  pasajeros: PasajeroResponse[];
  selectedIds: Set<number>;
  onToggle: (pasajeroId: number) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  targetHorarioId?: number | null;
  readOnly?: boolean;
}

type PasajeroSelectableSection = 'assigned' | 'available';

const transporteBadgeClasses: Record<TransporteTipo, string> = {
  [TRANSPORTE_TIPOS.UNO]: 'bg-[#007a8a]/10 text-[#007a8a] dark:bg-[#007a8a]/20 dark:text-cyan-200',
  [TRANSPORTE_TIPOS.DOS]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100',
};

const splitPasajerosBySeleccion = (pasajeros: PasajeroResponse[], selectedIds: Set<number>) => {
  const assigned: PasajeroResponse[] = [];
  const available: PasajeroResponse[] = [];

  for (const pasajero of pasajeros) {
    if (selectedIds.has(pasajero.id)) {
      assigned.push(pasajero);
    } else {
      available.push(pasajero);
    }
  }

  return { assigned, available };
};

interface PasajeroSelectableSectionHeaderProps {
  label: string;
  count: number;
}

const PasajeroSelectableSectionHeader = ({ label, count }: PasajeroSelectableSectionHeaderProps) => {
  const countLabel = count === 1 ? '1 pasajero' : `${count} pasajeros`;
  return (
    <div className="flex items-center justify-between bg-gray-50/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/[0.04] dark:text-gray-300">
      <span>{label}</span>
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-400">{countLabel}</span>
    </div>
  );
};

interface PasajeroSelectableRowProps {
  pasajero: PasajeroResponse;
  section: PasajeroSelectableSection;
  isSelected: boolean;
  targetHorarioId: number | null;
  readOnly: boolean;
  onToggle: (pasajeroId: number) => void;
}

const PasajeroSelectableRow = ({
  pasajero,
  section,
  isSelected,
  targetHorarioId,
  readOnly,
  onToggle,
}: PasajeroSelectableRowProps) => {
  const asignacionActual = getPasajeroHorarioAsignado(pasajero, targetHorarioId);
  const isAssignedToTarget = Boolean(asignacionActual);
  const assignedToOther = pasajero.horariosAsignados.some((horario) => horario.horarioId !== targetHorarioId);
  const willBeAssigned = section === 'assigned' && !isAssignedToTarget;
  const willBeRemoved = section === 'available' && isAssignedToTarget;
  const { visible: horariosVisibles, remaining: horariosRestantes } = getPasajeroHorariosResumen(
    pasajero.horariosAsignados,
    2,
  );
  const tieneHorarios = horariosVisibles.length > 0;

  const checkboxId = `pasajero-${pasajero.id}-${section}`;
  const pasajeroNameId = `${checkboxId}-nombre`;

  return (
    <label
      htmlFor={checkboxId}
      className={`flex flex-col gap-2 px-4 py-3 transition lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1.6fr)] lg:items-center lg:gap-3 ${
        isSelected ? 'bg-[#007a8a]/5 ring-1 ring-[#007a8a]/20 dark:bg-[#0f343a]' : 'hover:bg-gray-50 dark:hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id={checkboxId}
          checked={isSelected}
          onChange={() => {
            if (readOnly) return;
            onToggle(pasajero.id);
          }}
          disabled={readOnly}
          aria-readonly={readOnly}
          aria-labelledby={pasajeroNameId}
          className="size-4 accent-[#007a8a] disabled:cursor-not-allowed"
        />
        <div>
          <p id={pasajeroNameId} className="font-semibold text-gray-900 dark:text-white">
            {pasajero.nombreCompleto}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Titular: {pasajero.titularApellido ?? 'Sin titular'}</p>
        </div>
      </div>
      <div className="pl-7 text-sm text-gray-600 dark:text-gray-300 lg:pl-0">
        <p className="font-medium text-gray-800 dark:text-gray-200">{pasajero.colegio}</p>
        <p className="text-xs text-gray-500">{pasajero.gradoCurso}</p>
      </div>
      <div className="pl-7 lg:pl-0">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Horarios</p>
          {tieneHorarios ? (
            <ul className="mt-1 space-y-1 text-xs text-gray-700 dark:text-gray-200">
              {horariosVisibles.map((horario) => (
                <li key={horario.key} className="truncate" title={horario.label}>
                  {horario.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Sin horarios asignados</p>
          )}
          {horariosRestantes > 0 ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              +{horariosRestantes} más
            </p>
          ) : null}
          {isAssignedToTarget && asignacionActual?.transporte ? (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${transporteBadgeClasses[asignacionActual.transporte]}`}
            >
              {TRANSPORTE_LABELS[asignacionActual.transporte]}
            </span>
          ) : null}
          {assignedToOther && !isAssignedToTarget ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Tiene otros horarios
            </span>
          ) : null}
          {willBeAssigned ? (
            <span className="inline-flex rounded-full bg-[#007a8a]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#007a8a]">
              Se asignará
            </span>
          ) : null}
          {willBeRemoved ? (
            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Se quitará
            </span>
          ) : null}
        </div>
      </div>
    </label>
  );
};

interface PasajeroSelectableSectionProps {
  items: PasajeroResponse[];
  section: PasajeroSelectableSection;
  selectedIds: Set<number>;
  onToggle: (pasajeroId: number) => void;
  emptyMessage: string;
  targetHorarioId: number | null;
  readOnly: boolean;
}

const PasajeroSelectableSection = ({
  items,
  section,
  selectedIds,
  onToggle,
  emptyMessage,
  targetHorarioId,
  readOnly,
}: PasajeroSelectableSectionProps) => {
  if (!items.length) {
    return <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
  }

  return (
    <>
      {items.map((pasajero) => (
        <PasajeroSelectableRow
          key={`${pasajero.id}-${section}`}
          pasajero={pasajero}
          section={section}
          isSelected={selectedIds.has(pasajero.id)}
          targetHorarioId={targetHorarioId}
          readOnly={readOnly}
          onToggle={onToggle}
        />
      ))}
    </>
  );
};

export const PasajeroSelectableList = ({
  pasajeros,
  selectedIds,
  onToggle,
  isLoading = false,
  emptyMessage = 'No hay pasajeros para mostrar',
  targetHorarioId = null,
  readOnly = false,
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

  const { assigned, available } = splitPasajerosBySeleccion(pasajeros, selectedIds);
  const assignedEmptyMessage = selectedIds.size
    ? 'Ningún pasajero asignado coincide con la búsqueda'
    : targetHorarioId
      ? 'Aún no hay pasajeros asignados a este horario'
      : 'Seleccioná un horario para ver asignados';
  const availableEmptyMessage = emptyMessage;

  return (
    <div className="rounded-xl border border-[#e4e4e7] bg-white shadow-sm dark:border-[#3f3f46] dark:bg-[#27272a]">
      <div className="hidden px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1.6fr)] lg:gap-3">
        <span className="pl-6">Pasajero</span>
        <span>Colegio / Curso</span>
        <span>Horarios</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        <PasajeroSelectableSectionHeader label="Asignados a este horario" count={assigned.length} />
        <PasajeroSelectableSection
          items={assigned}
          section="assigned"
          selectedIds={selectedIds}
          onToggle={onToggle}
          emptyMessage={assignedEmptyMessage}
          targetHorarioId={targetHorarioId}
          readOnly={readOnly}
        />
        <PasajeroSelectableSectionHeader label="Disponibles para agregar" count={available.length} />
        <PasajeroSelectableSection
          items={available}
          section="available"
          selectedIds={selectedIds}
          onToggle={onToggle}
          emptyMessage={availableEmptyMessage}
          targetHorarioId={targetHorarioId}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};
