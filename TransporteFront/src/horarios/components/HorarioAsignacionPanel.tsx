import { PasajeroSelectableList } from '../../pasajeros/components';
import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import { Button, SearchInput } from '../../shared/ui';
import type { HorarioConteosPorTransporte, HorarioPasajerosResponse, HorarioResponse } from '../types/horario.types';
import { TRANSPORTE_LABELS, TRANSPORTE_TIPOS } from '../../shared/types/transporte.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

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
  isGestionMode: boolean;
  activeTransporte: TransporteTipo;
  onTransporteChange: (transporte: TransporteTipo) => void;
  selectedCounts: Record<TransporteTipo, number>;
  conteosPorTransporte?: HorarioConteosPorTransporte;
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
  isGestionMode,
  activeTransporte,
  onTransporteChange,
  selectedCounts,
  conteosPorTransporte,
}: HorarioAsignacionPanelProps) => {
  const emptyMessage = search ? 'No hay coincidencias con ese criterio' : 'No hay pasajeros activos para asignar';
  const isListLoading = isLoadingDetalle || isLoadingPasajeros;
  const assignedVisibleCount = filteredPasajeros.reduce(
    (acc, pasajero) => (selectedPasajeros.has(pasajero.id) ? acc + 1 : acc),
    0,
  );
  const availableVisibleCount = filteredPasajeros.length - assignedVisibleCount;
  const isReadOnly = !isGestionMode;
  const transporteCounts = {
    [TRANSPORTE_TIPOS.UNO]: selectedCounts[TRANSPORTE_TIPOS.UNO] ?? 0,
    [TRANSPORTE_TIPOS.DOS]: selectedCounts[TRANSPORTE_TIPOS.DOS] ?? 0,
  };
  const transporteAccentClasses: Record<TransporteTipo, string> = {
    [TRANSPORTE_TIPOS.UNO]: 'text-[#007a8a] dark:text-cyan-200',
    [TRANSPORTE_TIPOS.DOS]: 'text-emerald-600 dark:text-emerald-200',
  };
  const transporteBadgeClasses: Record<TransporteTipo, string> = {
    [TRANSPORTE_TIPOS.UNO]: 'bg-[#007a8a]/10 text-[#007a8a] dark:bg-[#007a8a]/20 dark:text-cyan-200',
    [TRANSPORTE_TIPOS.DOS]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100',
  };

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

      {!isGestionMode ? (
        <div className="flex items-start gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <span className="material-symbols-outlined text-base">visibility</span>
          <span>
            Estás en modo vista. Presioná <strong>Gestionar</strong> en la parte superior para habilitar la edición de asignaciones.
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 border-b border-gray-100 pb-4 dark:border-white/10 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">Seleccioná transporte</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[TRANSPORTE_TIPOS.UNO, TRANSPORTE_TIPOS.DOS].map((transporte) => {
              const isActive = transporte === activeTransporte;
              const backendCount = conteosPorTransporte
                ? transporte === TRANSPORTE_TIPOS.UNO
                  ? conteosPorTransporte.transporteUno
                  : conteosPorTransporte.transporteDos
                : transporteCounts[transporte];
              return (
                <button
                  key={transporte}
                  type="button"
                  onClick={() => onTransporteChange(transporte)}
                  className={`rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isActive
                      ? `border-transparent ${transporteAccentClasses[transporte]} bg-gray-50 shadow-lg dark:bg-white/10`
                      : 'border-gray-100 bg-white dark:border-white/10 dark:bg-transparent'
                  }`}
                >
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${transporteAccentClasses[transporte]}`}>
                    {TRANSPORTE_LABELS[transporte]}
                  </p>
                  <p className={`text-2xl font-black ${transporteAccentClasses[transporte]}`}>
                    {isGestionMode ? transporteCounts[transporte] : backendCount}
                  </p>
                  <p className="text-[11px] text-gray-500">Pasajeros actuales</p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Estás editando {TRANSPORTE_LABELS[activeTransporte]}. Los cambios se guardarán en ese transporte.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-end">
          <Button variant="ghost" className="sm:w-auto" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            disabled={isReadOnly || !hasChanges || isSaving || !targetHorarioId}
            className="bg-[#007a8a] text-white hover:bg-[#00626e] disabled:bg-gray-300"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <SearchInput value={search} onChange={onSearchChange} placeholder="Buscar por nombre, colegio o titular" />

      <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 px-4 py-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300">
        <p>
          Los pasajeros ya asignados aparecen primero en la lista y mantienen el badge verde. Debajo encontrarás el resto disponible
          para agregarlos con el mismo selector. Podés alternar entre transportes sin perder los cambios.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
          <span className="material-symbols-outlined text-[16px]">groups</span>
          {selectedPasajeros.size} pasajeros asignados ({assignedVisibleCount} visibles)
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${transporteBadgeClasses[activeTransporte]}`}
        >
          <span className="material-symbols-outlined text-[16px]">directions_bus</span>
          {TRANSPORTE_LABELS[activeTransporte]}
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
        readOnly={isReadOnly}
      />
    </div>
  );
};
