import { useReducer, useState } from 'react';
import { TRANSPORTE_TIPOS, type TransporteTipo } from '../../shared/types/transporte.types';
import {
  buildSelectionFromDetalle,
  cloneSelectionState,
  createEmptySelectionState,
  hasSelectionDifferences,
  type TransporteSelectionState,
} from '../helpers/selection.helpers';
import type { HorarioPasajerosResponse } from '../types/horario.types';

interface HorarioDrawerState {
  selectedHorarioId: number | null;
  drawerOpen: boolean;
  search: string;
  selectedTransporte: TransporteTipo;
  selectedPasajerosPorTransporte: TransporteSelectionState;
  snapshotPorTransporte: TransporteSelectionState;
  isGestionMode: boolean;
  isPersisting: boolean;
}

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

const toggleInSelection = (state: HorarioDrawerState, pasajeroId: number): HorarioDrawerState => {
  if (!state.isGestionMode) {
    return state;
  }

  const nextSelection = cloneSelectionState(state.selectedPasajerosPorTransporte);
  const targetSet = nextSelection[state.selectedTransporte];
  if (targetSet.has(pasajeroId)) {
    targetSet.delete(pasajeroId);
  } else {
    targetSet.add(pasajeroId);
  }
  return { ...state, selectedPasajerosPorTransporte: nextSelection };
};

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
      return state.isGestionMode
        ? { ...state, isGestionMode: false, selectedPasajerosPorTransporte: cloneSelectionState(state.snapshotPorTransporte) }
        : { ...state, isGestionMode: true };
    case 'togglePasajero':
      return toggleInSelection(state, action.pasajeroId);
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

/**
 * Estado del panel de asignación de pasajeros a un horario (selección por transporte,
 * modo gestión y persistencia). La selección se sincroniza con el detalle del servidor
 * mediante `useHorarioSelectionSync`.
 */
export const useHorarioDrawerState = () => {
  const [state, dispatch] = useReducer(horariosReducer, undefined, createInitialDrawerState);

  return {
    ...state,
    selectionChanged: hasSelectionDifferences(state.selectedPasajerosPorTransporte, state.snapshotPorTransporte),
    openHorario: (horarioId: number, transporte: TransporteTipo) =>
      dispatch({ type: 'openHorario', horarioId, transporte }),
    closeDrawer: () => dispatch({ type: 'closeDrawer' }),
    setSearch: (value: string) => dispatch({ type: 'setSearch', value }),
    setTransporte: (transporte: TransporteTipo) => dispatch({ type: 'setTransporte', transporte }),
    toggleGestionMode: () => dispatch({ type: 'toggleGestionMode' }),
    togglePasajero: (pasajeroId: number) => dispatch({ type: 'togglePasajero', pasajeroId }),
    syncSelection: (selection: TransporteSelectionState) => dispatch({ type: 'syncSelection', selection }),
    startPersist: () => dispatch({ type: 'startPersist' }),
    finishPersist: () => dispatch({ type: 'finishPersist' }),
  };
};

/**
 * Sincroniza la selección con el detalle del horario cuando este cambia.
 * Se ajusta durante el render (patrón oficial de React para derivar estado de props/datos)
 * en lugar de empujar el dato hacia el padre desde un efecto.
 */
export const useHorarioSelectionSync = (
  detalle: HorarioPasajerosResponse | undefined,
  syncSelection: (selection: TransporteSelectionState) => void,
) => {
  const [syncedDetalle, setSyncedDetalle] = useState<HorarioPasajerosResponse | undefined>(undefined);

  if (detalle !== syncedDetalle) {
    setSyncedDetalle(detalle);
    if (detalle) {
      syncSelection(buildSelectionFromDetalle(detalle));
    }
  }
};
