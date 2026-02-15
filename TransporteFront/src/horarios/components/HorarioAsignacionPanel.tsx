import { PasajeroSelectableList } from '../../pasajeros/components';
import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import { Button, SearchInput } from '../../shared/ui';
import type { HorarioPasajerosResponse, HorarioResponse } from '../types/horario.types';

interface HorarioAsignacionPanelProps {
  selectedHorario?: HorarioResponse;
  detalleHorario?: HorarioPasajerosResponse;
  search: string;
  onSearchChange: (value: string) => void;
  filteredPasajeros: PasajeroResponse[];
  selectedPasajeros: Set<number>;
  onTogglePasajero: (pasajeroId: number) => void;
  isLoadingDetalle: boolean;
  isLoadingPasajeros: boolean;
  hasChanges: boolean;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  targetHorarioId: number | null;
}

export const HorarioAsignacionPanel = ({
  selectedHorario,
  detalleHorario,
  search,
  onSearchChange,
  filteredPasajeros,
  selectedPasajeros,
  onTogglePasajero,
  isLoadingDetalle,
  isLoadingPasajeros,
  hasChanges,
  onCancel,
  onSave,
  isSaving,
  targetHorarioId,
}: HorarioAsignacionPanelProps) => {
  const emptyMessage = search ? 'No hay coincidencias con ese criterio' : 'No hay pasajeros activos para asignar';
  const isListLoading = isLoadingDetalle || isLoadingPasajeros;
  const assignedVisibleCount = filteredPasajeros.reduce(
    (acc, pasajero) => (selectedPasajeros.has(pasajero.id) ? acc + 1 : acc),
    0,
  );
  const availableVisibleCount = filteredPasajeros.length - assignedVisibleCount;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#007a8a]">Horario seleccionado</p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedHorario?.etiqueta ?? 'Seleccioná un horario'}</h2>
          <p className="text-sm text-gray-500">Seleccioná los pasajeros que deben viajar en este horario.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar panel"
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-lg font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007a8a] dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          ×
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 dark:border-white/10 sm:flex-row sm:justify-end">
        <Button variant="ghost" className="sm:w-auto" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          disabled={!hasChanges || isSaving || !targetHorarioId}
          className="bg-[#007a8a] text-white hover:bg-[#00626e] disabled:bg-gray-300"
        >
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      <SearchInput value={search} onChange={onSearchChange} placeholder="Buscar por nombre, colegio o titular" />

      <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300">
        <p>
          Los pasajeros ya asignados aparecen primero en la lista y mantienen el badge verde. Debajo encontrarás el resto disponible
          para agregarlos con el mismo selector.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
          <span className="material-symbols-outlined text-[16px]">groups</span>
          {selectedPasajeros.size} pasajeros asignados ({assignedVisibleCount} visibles)
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
          <span className="material-symbols-outlined text-[16px]">filter_alt</span>
          {availableVisibleCount} disponibles en esta vista
        </span>
        {detalleHorario ? (
          <span className="text-xs text-gray-500">Asignados originalmente: {detalleHorario.pasajeros.length}</span>
        ) : null}
        {hasChanges ? <span className="text-xs font-semibold text-amber-700">Hay cambios sin guardar</span> : null}
      </div>

      <PasajeroSelectableList
        pasajeros={filteredPasajeros}
        selectedIds={selectedPasajeros}
        onToggle={onTogglePasajero}
        isLoading={isListLoading}
        emptyMessage={emptyMessage}
        targetHorarioId={targetHorarioId}
      />
    </div>
  );
};
