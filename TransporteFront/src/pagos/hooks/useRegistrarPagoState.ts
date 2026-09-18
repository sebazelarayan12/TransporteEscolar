import { useReducer } from 'react';
import type { TitularResponse } from '../../titulares/types/titular.types';
import { MEDIOS_PAGO, type MedioPago } from '../constants/medios-pago.constants';
import type { PagoConfirmacionData } from '../components/registrar-pago/ConfirmacionPagoModal';

interface RegistrarPagoState {
  search: string;
  pageNumber: number;
  selectedTitular: TitularResponse | null;
  monto: string;
  medioPago: MedioPago;
  observaciones: string;
  isAdjustModalOpen: boolean;
  isConfirmOpen: boolean;
  confirmacionPago: PagoConfirmacionData | null;
}

type RegistrarPagoAction =
  | { type: 'setSearch'; payload: string }
  | { type: 'setPageNumber'; payload: number }
  | { type: 'selectTitular'; payload: TitularResponse | null }
  | { type: 'setMonto'; payload: string }
  | { type: 'setMedioPago'; payload: MedioPago }
  | { type: 'setObservaciones'; payload: string }
  | { type: 'setAdjustModalOpen'; payload: boolean }
  | { type: 'openConfirmacion'; payload: PagoConfirmacionData }
  | { type: 'closeConfirmacion' }
  | { type: 'reset' };

const INITIAL_STATE: RegistrarPagoState = {
  search: '',
  pageNumber: 1,
  selectedTitular: null,
  monto: '',
  medioPago: MEDIOS_PAGO.EFECTIVO,
  observaciones: '',
  isAdjustModalOpen: false,
  isConfirmOpen: false,
  confirmacionPago: null,
};

const reducer = (state: RegistrarPagoState, action: RegistrarPagoAction): RegistrarPagoState => {
  switch (action.type) {
    case 'setSearch':
      return { ...state, search: action.payload, pageNumber: 1 };
    case 'setPageNumber':
      return { ...state, pageNumber: action.payload };
    case 'selectTitular':
      return { ...state, selectedTitular: action.payload, isAdjustModalOpen: false };
    case 'setMonto':
      return { ...state, monto: action.payload };
    case 'setMedioPago':
      return { ...state, medioPago: action.payload };
    case 'setObservaciones':
      return { ...state, observaciones: action.payload };
    case 'setAdjustModalOpen':
      return { ...state, isAdjustModalOpen: action.payload };
    case 'openConfirmacion':
      return { ...state, confirmacionPago: action.payload, isConfirmOpen: true };
    case 'closeConfirmacion':
      return { ...state, confirmacionPago: null, isConfirmOpen: false };
    case 'reset':
      return { ...INITIAL_STATE };
    default:
      return state;
  }
};

export const useRegistrarPagoState = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  return {
    ...state,
    setSearch: (payload: string) => dispatch({ type: 'setSearch', payload }),
    setPageNumber: (payload: number) => dispatch({ type: 'setPageNumber', payload }),
    selectTitular: (payload: TitularResponse | null) => dispatch({ type: 'selectTitular', payload }),
    setMonto: (payload: string) => dispatch({ type: 'setMonto', payload }),
    setMedioPago: (payload: MedioPago) => dispatch({ type: 'setMedioPago', payload }),
    setObservaciones: (payload: string) => dispatch({ type: 'setObservaciones', payload }),
    setAdjustModalOpen: (payload: boolean) => dispatch({ type: 'setAdjustModalOpen', payload }),
    openConfirmacion: (payload: PagoConfirmacionData) => dispatch({ type: 'openConfirmacion', payload }),
    closeConfirmacion: () => dispatch({ type: 'closeConfirmacion' }),
    reset: () => dispatch({ type: 'reset' }),
  };
};
