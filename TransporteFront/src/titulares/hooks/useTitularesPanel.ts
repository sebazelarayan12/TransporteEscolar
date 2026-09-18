import { useReducer } from 'react';
import type { TitularResponse } from '../types/titular.types';

interface PanelState {
  selectedTitular: TitularResponse | null;
  showMobileDrawer: boolean;
  isPanelExpanded: boolean;
}

type PanelAction =
  | { type: 'selectTitular'; payload: TitularResponse }
  | { type: 'closeMobileDrawer' }
  | { type: 'closePanel' }
  | { type: 'expandPanel' };

const PANEL_INITIAL_STATE: PanelState = {
  selectedTitular: null,
  showMobileDrawer: false,
  isPanelExpanded: false,
};

const panelReducer = (state: PanelState, action: PanelAction): PanelState => {
  switch (action.type) {
    case 'selectTitular':
      return {
        ...state,
        selectedTitular: action.payload,
        showMobileDrawer: true,
        isPanelExpanded: true,
      };
    case 'closeMobileDrawer':
      return { ...state, showMobileDrawer: false };
    case 'closePanel':
      return { ...state, isPanelExpanded: false };
    case 'expandPanel':
      if (!state.selectedTitular) {
        return state;
      }
      return { ...state, isPanelExpanded: true };
    default:
      return state;
  }
};

export const useTitularesPanel = () => {
  const [panelState, dispatchPanel] = useReducer(panelReducer, PANEL_INITIAL_STATE);

  return {
    ...panelState,
    selectTitular: (titular: TitularResponse) => dispatchPanel({ type: 'selectTitular', payload: titular }),
    closeMobileDrawer: () => dispatchPanel({ type: 'closeMobileDrawer' }),
    closePanel: () => dispatchPanel({ type: 'closePanel' }),
    expandPanel: () => dispatchPanel({ type: 'expandPanel' }),
  };
};
