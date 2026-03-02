import { useReducer } from 'react';
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

type HorarioDrawerState = {
  selectedHorarioId: number | null;
  drawerOpen: boolean;
  search: string;
  selectedTransporte: TransporteTipo;
  selectedPasajerosPorTransporte: TransporteSelectionState;
  snapshotPorTransporte: TransporteSelectionState;
  isGestionMode: boolean;
  isPersisting: boolean;
};

type HorarioDrawerAction =
  | { type: 'openHorario'; horarioId: number; transporte: TransporteTipo }
  | { type: 'closeDrawer' }
  | { type: 'setSearch'; value: string }
  | { type: 'setTransporte'; transporte: TransporteTipo }
  | { type: 'toggleGestionMode' }
  | { type: 'togglePasajero'; pasajeroId: number }
  | { type: 'syncSelection'; selection: TransporteSelectionState }
  | { type: 'startPersist' }
  | { type: 'finishPersist' };

const createInitialDrawerState = (): HorarioDrawerState => ({
  selectedHorarioId: null,
  drawerOpen: false,
  search: '',
  selectedTransporte: TRANSPORTE_TIPOS.UNO,
  selectedPasajerosPorTransporte: createEmptySelectionState(),
  snapshotPorTransporte: createEmptySelectionState(),
  isGestionMode: false,
  isPersisting: false,
});

const horariosReducer = (state: HorarioDrawerState, action: HorarioDrawerAction): HorarioDrawerState => {
  switch (action.type) {
    case 'openHorario':
      return {
        ...state,
        selectedHorarioId: action.horarioId,
        selectedTransporte: action.transporte,
        drawerOpen: true,
        search: '',
        selectedPasajerosPorTransporte: createEmptySelectionState(),
        snapshotPorTransporte: createEmptySelectionState(),
      };
    case 'closeDrawer':
      return {
        ...state,
        drawerOpen: false,
        selectedHorarioId: null,
        selectedTransporte: TRANSPORTE_TIPOS.UNO,
        selectedPasajerosPorTransporte: createEmptySelectionState(),
        snapshotPorTransporte: createEmptySelectionState(),
        search: '',
      };
    case 'setSearch':
      return { ...state, search: action.value };
    case 'setTransporte':
      return { ...state, selectedTransporte: action.transporte };
    case 'toggleGestionMode':
      if (state.isGestionMode) {
        return {
          ...state,
          isGestionMode: false,
          selectedPasajerosPorTransporte: cloneSelectionState(state.snapshotPorTransporte),
        };
      }
      return { ...state, isGestionMode: true };
    case 'togglePasajero': {
      if (!state.isGestionMode) {
        return state;
      }
      const nextSelection = cloneSelectionState(state.selectedPasajerosPorTransporte);
      const targetSet = nextSelection[state.selectedTransporte];
      if (targetSet.has(action.pasajeroId)) {
        targetSet.delete(action.pasajeroId);
      } else {
        targetSet.add(action.pasajeroId);
      }
      return { ...state, selectedPasajerosPorTransporte: nextSelection };
    }
    case 'syncSelection':
      return {
        ...state,
        selectedPasajerosPorTransporte: action.selection,
        snapshotPorTransporte: cloneSelectionState(action.selection),
      };
    case 'startPersist':
      return { ...state, isPersisting: true };
    case 'finishPersist':
      return { ...state, isPersisting: false };
    default:
      return state;
  }
};

export const HorariosPage = () => {
  const [drawerState, dispatch] = useReducer(horariosReducer, undefined, createInitialDrawerState);
  const {
    selectedHorarioId,
    drawerOpen,
    search,
    selectedTransporte,
    selectedPasajerosPorTransporte,
    snapshotPorTransporte,
    isGestionMode,
    isPersisting,
  } = drawerState;

  const { data: horarios, isLoading, isError, refetch } = useHorarios();
  const ordenados = sortHorariosByOrden(horarios);

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
    dispatch({ type: 'syncSelection', selection: next });
  };

  const { data: pasajerosActivos, isLoading: isLoadingPasajeros } = usePasajerosActivos();
  const { data: detalleHorario, isLoading: isLoadingDetalle } = useHorarioPasajeros(selectedHorarioId, {
    enabled: drawerOpen && Boolean(selectedHorarioId),
    onSuccess: syncSelection,
  });
  const agregarHorarioPasajero = useAgregarHorarioPasajero();
  const eliminarHorarioPasajero = useEliminarHorarioPasajero();

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
    dispatch({ type: 'togglePasajero', pasajeroId });
  };

  const handleOpenHorario = (horarioId: number, transporte: TransporteTipo) => {
    dispatch({ type: 'openHorario', horarioId, transporte });
  };

  const handleCloseDrawer = () => {
    dispatch({ type: 'closeDrawer' });
  };

  const selectionChanged = hasSelectionDifferences(selectedPasajerosPorTransporte, snapshotPorTransporte);
  const hasChanges = isGestionMode && selectionChanged;

  const handleGestionModeToggle = () => {
    dispatch({ type: 'toggleGestionMode' });
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
      dispatch({ type: 'startPersist' });
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
      dispatch({ type: 'finishPersist' });
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
      onSearchChange={(value) => dispatch({ type: 'setSearch', value })}
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
      onTransporteChange={(transporte) => dispatch({ type: 'setTransporte', transporte })}
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
