import { useReducer } from 'react';
import type { PagosEstadoFiltro } from '../types/pago.types';

interface PagosViewState {
  selectedMes: number;
  selectedAnio: number;
  search: string;
  pageNumber: number;
  isRegisterModalOpen: boolean;
  estadoFiltro: PagosEstadoFiltro;
  selectedPagoId: number | null;
}

type PagosViewAction =
  | { type: 'setPeriodo'; mes: number; anio: number }
  | { type: 'setSearch'; value: string }
  | { type: 'setPage'; page: number }
  | { type: 'toggleRegisterModal'; isOpen: boolean }
  | { type: 'setEstadoFiltro'; value: PagosEstadoFiltro }
  | { type: 'openDetalle'; pagoId: number }
  | { type: 'closeDetalle' };

const createInitialPagosState = (): PagosViewState => {
  const now = new Date();
  return {
    selectedMes: now.getMonth() + 1,
    selectedAnio: now.getFullYear(),
    search: '',
    pageNumber: 1,
    isRegisterModalOpen: false,
    estadoFiltro: 'todos',
    selectedPagoId: null,
  };
};

const pagosViewReducer = (state: PagosViewState, action: PagosViewAction): PagosViewState => {
  switch (action.type) {
    case 'setPeriodo':
      return { ...state, selectedMes: action.mes, selectedAnio: action.anio, pageNumber: 1, search: '' };
    case 'setSearch':
      return { ...state, search: action.value, pageNumber: 1 };
    case 'setPage':
      return { ...state, pageNumber: action.page };
    case 'toggleRegisterModal':
      return { ...state, isRegisterModalOpen: action.isOpen };
    case 'setEstadoFiltro':
      return { ...state, estadoFiltro: action.value };
    case 'openDetalle':
      return { ...state, selectedPagoId: action.pagoId };
    case 'closeDetalle':
      return { ...state, selectedPagoId: null };
    default:
      return state;
  }
};

export const usePagosListState = () => {
  const [state, dispatch] = useReducer(pagosViewReducer, undefined, createInitialPagosState);

  return {
    ...state,
    setPeriodo: (mes: number, anio: number) => dispatch({ type: 'setPeriodo', mes, anio }),
    setSearch: (value: string) => dispatch({ type: 'setSearch', value }),
    setPage: (page: number) => dispatch({ type: 'setPage', page }),
    setRegisterModalOpen: (isOpen: boolean) => dispatch({ type: 'toggleRegisterModal', isOpen }),
    setEstadoFiltro: (value: PagosEstadoFiltro) => dispatch({ type: 'setEstadoFiltro', value }),
    openDetalle: (pagoId: number) => dispatch({ type: 'openDetalle', pagoId }),
    closeDetalle: () => dispatch({ type: 'closeDetalle' }),
  };
};
