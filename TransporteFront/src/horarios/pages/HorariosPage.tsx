import { useState } from 'react';
import { LoadingScreen, MobileDrawer, Modal } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { useAgregarHorarioPasajero, useEliminarHorarioPasajero, usePasajerosActivos } from '../../pasajeros/services/pasajeros.queries';
import { useHorarioPasajeros, useHorarios, sortHorariosByOrden } from '../services/horarios.queries';
import { HorarioAsignacionPanel, HorariosGrid, HorariosHeader, HorariosError, HorariosEmptyState } from '../components';
import type { HorarioPasajerosResponse } from '../types/horario.types';
import { formatPasajeroHorariosListado, getPasajeroHorarioAsignado } from '../../pasajeros/helpers/horario.helpers';
import { TRANSPORTE_LIST, TRANSPORTE_TIPOS } from '../../shared/types/transporte.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';

type TransporteSelectionState = Record<TransporteTipo, Set<number>>;

const createEmptySelectionState = (): TransporteSelectionState => ({
  [TRANSPORTE_TIPOS.UNO]: new Set<number>(),
  [TRANSPORTE_TIPOS.DOS]: new Set<number>(),
});

const cloneSelectionState = (state: TransporteSelectionState): TransporteSelectionState => ({
  [TRANSPORTE_TIPOS.UNO]: new Set(state[TRANSPORTE_TIPOS.UNO]),
  [TRANSPORTE_TIPOS.DOS]: new Set(state[TRANSPORTE_TIPOS.DOS]),
});

const normalizeTransporte = (value?: number | null): TransporteTipo =>
  value === TRANSPORTE_TIPOS.DOS ? TRANSPORTE_TIPOS.DOS : TRANSPORTE_TIPOS.UNO;

const hasSelectionDifferences = (current: TransporteSelectionState, baseline: TransporteSelectionState) =>
  TRANSPORTE_LIST.some((transporte) => {
    const currentSet = current[transporte];
    const baselineSet = baseline[transporte];
    if (currentSet.size !== baselineSet.size) return true;
    for (const id of baselineSet) {
      if (!currentSet.has(id)) return true;
    }
    return false;
  });

export const HorariosPage = () => {
  const { data: horarios, isLoading, isError, refetch } = useHorarios();
  const ordenados = sortHorariosByOrden(horarios);

  const [selectedHorarioId, setSelectedHorarioId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTransporte, setSelectedTransporte] = useState<TransporteTipo>(TRANSPORTE_TIPOS.UNO);
  const [selectedPasajerosPorTransporte, setSelectedPasajerosPorTransporte] = useState<TransporteSelectionState>(() => createEmptySelectionState());
  const [snapshotPorTransporte, setSnapshotPorTransporte] = useState<TransporteSelectionState>(() => createEmptySelectionState());
  const [isGestionMode, setIsGestionMode] = useState(false);
  const { showSuccess, showError } = useToast();

  const syncSelection = (data: HorarioPasajerosResponse) => {
    const next = createEmptySelectionState();
    if (data.pasajerosAsignados?.pasajeros?.length) {
      for (const asignacion of data.pasajerosAsignados.pasajeros) {
        next[normalizeTransporte(asignacion.transporte)].add(asignacion.pasajeroId);
      }
    } else {
      for (const pasajero of data.pasajeros) {
        const asignacion = getPasajeroHorarioAsignado(pasajero, data.horario.id);
        if (asignacion) {
          next[normalizeTransporte(asignacion.transporte)].add(pasajero.id);
        }
      }
    }
    setSelectedPasajerosPorTransporte(next);
    setSnapshotPorTransporte(cloneSelectionState(next));
  };

  const { data: pasajerosActivos, isLoading: isLoadingPasajeros } = usePasajerosActivos();
  const { data: detalleHorario, isLoading: isLoadingDetalle } = useHorarioPasajeros(selectedHorarioId, {
    enabled: drawerOpen && Boolean(selectedHorarioId),
    onSuccess: syncSelection,
  });
  const agregarHorarioPasajero = useAgregarHorarioPasajero();
  const eliminarHorarioPasajero = useEliminarHorarioPasajero();
  const [isPersisting, setIsPersisting] = useState(false);

  const filteredPasajeros = (() => {
    if (!pasajerosActivos) return [];
    const query = search.trim().toLowerCase();
    if (!query) return pasajerosActivos;
    return pasajerosActivos.filter((pasajero) =>
      `${pasajero.nombreCompleto} ${pasajero.titularApellido ?? ''} ${pasajero.colegio} ${pasajero.gradoCurso} ${formatPasajeroHorariosListado(pasajero.horariosAsignados)}`
        .toLowerCase()
        .includes(query)
    );
  })();

  const handleToggle = (pasajeroId: number) => {
    if (!isGestionMode) return;
    setSelectedPasajerosPorTransporte((prev) => {
      const next = cloneSelectionState(prev);
      const targetSet = next[selectedTransporte];
      if (targetSet.has(pasajeroId)) {
        targetSet.delete(pasajeroId);
      } else {
        targetSet.add(pasajeroId);
      }
      return next;
    });
  };

  const resetSelectionState = () => {
    setSelectedPasajerosPorTransporte(createEmptySelectionState());
    setSnapshotPorTransporte(createEmptySelectionState());
  };

  const handleOpenHorario = (horarioId: number, transporte: TransporteTipo) => {
    setSelectedHorarioId(horarioId);
    setSelectedTransporte(transporte);
    resetSelectionState();
    setDrawerOpen(true);
    setSearch('');
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedHorarioId(null);
    setSelectedTransporte(TRANSPORTE_TIPOS.UNO);
    resetSelectionState();
    setSearch('');
  };

  const selectionChanged = hasSelectionDifferences(selectedPasajerosPorTransporte, snapshotPorTransporte);
  const hasChanges = isGestionMode && selectionChanged;

  const handleGestionModeToggle = () => {
    if (isGestionMode) {
      setSelectedPasajerosPorTransporte(cloneSelectionState(snapshotPorTransporte));
    }
    setIsGestionMode((prev) => !prev);
  };

  const handleSave = async () => {
    if (!selectedHorarioId || !isGestionMode || !selectionChanged) return;
    const diffs = TRANSPORTE_LIST.map((transporte) => {
      const currentSet = selectedPasajerosPorTransporte[transporte];
      const baselineSet = snapshotPorTransporte[transporte];
      const additions = Array.from(currentSet).filter((id) => !baselineSet.has(id));
      const removals = Array.from(baselineSet).filter((id) => !currentSet.has(id));
      return {
        transporte,
        additions,
        removals,
        order: Array.from(currentSet),
      };
    });

    const hasAnyChange = diffs.some((diff) => diff.additions.length || diff.removals.length);
    if (!hasAnyChange) return;

    try {
      setIsPersisting(true);
      for (const diff of diffs) {
        for (const pasajeroId of diff.additions) {
          const priorityIndex = diff.order.indexOf(pasajeroId);
          await agregarHorarioPasajero.mutateAsync({
            pasajeroId,
            horarioId: selectedHorarioId,
            prioridad: priorityIndex >= 0 ? priorityIndex + 1 : undefined,
            transporte: diff.transporte,
          });
        }
      }
      for (const diff of diffs) {
        for (const pasajeroId of diff.removals) {
          await eliminarHorarioPasajero.mutateAsync({ pasajeroId, horarioId: selectedHorarioId });
        }
      }
      showSuccess('Asignaciones actualizadas');
      handleCloseDrawer();
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Error al guardar los cambios';
      showError(message);
    } finally {
      setIsPersisting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando horarios..." />;
  }

  if (isError) {
    return <HorariosError onRetry={refetch} />;
  }

  if (!ordenados.length) {
    return <HorariosEmptyState />;
  }

  const selectedHorario = ordenados.find((horario) => horario.id === selectedHorarioId);
  const activeSelectedPasajeros = selectedPasajerosPorTransporte[selectedTransporte];
  const selectedCounts: Record<TransporteTipo, number> = {
    [TRANSPORTE_TIPOS.UNO]: selectedPasajerosPorTransporte[TRANSPORTE_TIPOS.UNO].size,
    [TRANSPORTE_TIPOS.DOS]: selectedPasajerosPorTransporte[TRANSPORTE_TIPOS.DOS].size,
  };
  const conteosDetalle = detalleHorario?.pasajerosAsignados?.conteosPorTransporte ?? selectedHorario?.conteosPorTransporte;

  const panelContent = (
    <HorarioAsignacionPanel
      selectedHorario={selectedHorario}
      detalleHorario={detalleHorario}
      search={search}
      onSearchChange={setSearch}
      filteredPasajeros={filteredPasajeros}
      selectedPasajeros={activeSelectedPasajeros}
      onTogglePasajero={handleToggle}
      isLoadingDetalle={isLoadingDetalle}
      isLoadingPasajeros={isLoadingPasajeros}
      hasChanges={hasChanges}
      onCancel={handleCloseDrawer}
      onSave={handleSave}
      isSaving={isPersisting || agregarHorarioPasajero.isPending || eliminarHorarioPasajero.isPending}
      targetHorarioId={selectedHorarioId}
      isGestionMode={isGestionMode}
      activeTransporte={selectedTransporte}
      onTransporteChange={setSelectedTransporte}
      selectedCounts={selectedCounts}
      conteosPorTransporte={conteosDetalle}
    />
  );

  return (
    <div className="min-h-screen bg-[#fafafa] py-8 dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <HorariosHeader isGestionMode={isGestionMode} onGestionModeToggle={handleGestionModeToggle} />

        <HorariosGrid horarios={ordenados} onSelectHorario={handleOpenHorario} />
      </div>

      <div className="hidden lg:block">
        <Modal isOpen={drawerOpen && Boolean(selectedHorarioId)} onClose={handleCloseDrawer} title="Asignar pasajeros" maxWidth="2xl">
          {panelContent}
        </Modal>
      </div>
      <MobileDrawer isOpen={drawerOpen && Boolean(selectedHorarioId)} onClose={handleCloseDrawer}>
        <div className="space-y-4 px-4 py-4">{panelContent}</div>
      </MobileDrawer>
    </div>
  );
};
