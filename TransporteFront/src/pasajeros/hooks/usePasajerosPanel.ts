import { useReducer } from 'react';
import type { PasajeroResponse } from '../types/pasajero.types';

interface PanelState {
  selectedPasajero: PasajeroResponse | null;
  showMobileDrawer: boolean;
  isPanelExpanded: boolean;
}

type PanelAction =
  | { type: 'select'; payload: PasajeroResponse }
  | { type: 'closeDrawer' }
  | { type: 'closePanel' }
  | { type: 'expandPanel' }
  | { type: 'clearSelection' };

const PANEL_INITIAL_STATE: PanelState = {
  selectedPasajero: null,
  showMobileDrawer: false,
  isPanelExpanded: false,
};

const panelReducer = (state: PanelState, action: PanelAction): PanelState => {
  switch (action.type) {
    case 'select':
      return {
        selectedPasajero: action.payload,
        showMobileDrawer: true,
        isPanelExpanded: true,
      };
    case 'closeDrawer':
      return { ...state, showMobileDrawer: false };
    case 'closePanel':
    case 'clearSelection':
      return { ...PANEL_INITIAL_STATE };
    case 'expandPanel':
      if (!state.selectedPasajero) {
        return state;
      }
      return { ...state, isPanelExpanded: true };
    default:
      return state;
  }
};

export const usePasajerosPanel = () => {
  const [panelState, dispatchPanel] = useReducer(panelReducer, PANEL_INITIAL_STATE);

  return {
    ...panelState,
    select: (pasajero: PasajeroResponse) => dispatchPanel({ type: 'select', payload: pasajero }),
    closeDrawer: () => dispatchPanel({ type: 'closeDrawer' }),
    closePanel: () => dispatchPanel({ type: 'closePanel' }),
    expandPanel: () => dispatchPanel({ type: 'expandPanel' }),
    clearSelection: () => dispatchPanel({ type: 'clearSelection' }),
  };
};
