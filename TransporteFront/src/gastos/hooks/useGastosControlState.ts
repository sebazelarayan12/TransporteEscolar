import { useReducer, useState } from 'react';
import type { GastosCategoriasCarouselItem } from '../components/GastosCategoriasCarousel';
import { getCategoriaConfig, normalizeCategoriaKey } from '../constants/categorias.config';
import type { GastoItem, GastosTabValue } from '../types/gastos.types';
import type { IngresoItem } from '../types/ingresos.types';

const monthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

export type DeleteDialogState =
  | { scope: 'gasto-fijo'; item: GastoItem }
  | { scope: 'gasto-variable'; item: GastoItem }
  | { scope: 'ingreso-fijo'; item: IngresoItem }
  | { scope: 'ingreso-variable'; item: IngresoItem }
  | null;

export type GastosControlState = {
  selectedMes: number;
  selectedAnio: number;
  activeTab: GastosTabValue;
  isModalOpen: boolean;
  isIngresoModalOpen: boolean;
  gastoModalMode: 'create' | 'edit';
  ingresoModalMode: 'create' | 'edit';
  selectedGasto: GastoItem | null;
  selectedIngreso: IngresoItem | null;
  deleteDialog: DeleteDialogState;
};

export type GastosControlAction =
  | { type: 'setPeriodo'; payload: { mes: number; anio: number } }
  | { type: 'setActiveTab'; payload: GastosTabValue }
  | { type: 'openGastoModal' }
  | { type: 'closeGastoModal' }
  | { type: 'openIngresoModal' }
  | { type: 'closeIngresoModal' }
  | { type: 'editGasto'; payload: GastoItem }
  | { type: 'editIngreso'; payload: IngresoItem }
  | { type: 'setDeleteDialog'; payload: NonNullable<DeleteDialogState> }
  | { type: 'clearDeleteDialog' };

export type GastoSectionDefinition = {
  title: string;
  subtitle: string;
  gastos: GastoItem[];
  emptyMessage: string;
};

export type GastoSectionsMap = Record<GastosTabValue, GastoSectionDefinition>;

const createInitialState = (): GastosControlState => {
  const now = new Date();
  return {
    selectedMes: now.getMonth() + 1,
    selectedAnio: now.getFullYear(),
    activeTab: 'variables',
    isModalOpen: false,
    isIngresoModalOpen: false,
    gastoModalMode: 'create',
    ingresoModalMode: 'create',
    selectedGasto: null,
    selectedIngreso: null,
    deleteDialog: null,
  };
};

const gastosControlReducer = (state: GastosControlState, action: GastosControlAction): GastosControlState => {
  switch (action.type) {
    case 'setPeriodo':
      return {
        ...state,
        selectedMes: action.payload.mes,
        selectedAnio: action.payload.anio,
        activeTab: 'variables',
      };
    case 'setActiveTab':
      return { ...state, activeTab: action.payload };
    case 'openGastoModal':
      return {
        ...state,
        isModalOpen: true,
        gastoModalMode: 'create',
        selectedGasto: null,
      };
    case 'closeGastoModal':
      return {
        ...state,
        isModalOpen: false,
        selectedGasto: null,
        gastoModalMode: 'create',
      };
    case 'openIngresoModal':
      return {
        ...state,
        isIngresoModalOpen: true,
        ingresoModalMode: 'create',
        selectedIngreso: null,
      };
    case 'closeIngresoModal':
      return {
        ...state,
        isIngresoModalOpen: false,
        selectedIngreso: null,
        ingresoModalMode: 'create',
      };
    case 'editGasto':
      return {
        ...state,
        selectedGasto: action.payload,
        gastoModalMode: 'edit',
        isModalOpen: true,
      };
    case 'editIngreso':
      return {
        ...state,
        selectedIngreso: action.payload,
        ingresoModalMode: 'edit',
        isIngresoModalOpen: true,
      };
    case 'setDeleteDialog':
      return { ...state, deleteDialog: action.payload };
    case 'clearDeleteDialog':
      return { ...state, deleteDialog: null };
    default:
      return state;
  }
};

export const useGastosControlState = () => {
  const [state, dispatch] = useReducer(gastosControlReducer, undefined, createInitialState);
  const [markPaidTarget, setMarkPaidTarget] = useState<GastoItem | null>(null);

  const periodLabel = monthFormatter.format(new Date(state.selectedAnio, state.selectedMes - 1, 1));
  const gastoModalKey = buildGastoModalKey(state.selectedMes, state.selectedAnio);
  const ingresoModalKey = buildIngresoModalKey(state.selectedMes, state.selectedAnio);
  const setPeriodo = (mes: number, anio: number) => {
    dispatch({ type: 'setPeriodo', payload: { mes, anio } });
  };
  const openGastoModal = () => {
    dispatch({ type: 'openGastoModal' });
  };
  const closeGastoModal = () => {
    dispatch({ type: 'closeGastoModal' });
  };
  const openIngresoModal = () => {
    dispatch({ type: 'openIngresoModal' });
  };
  const closeIngresoModal = () => {
    dispatch({ type: 'closeIngresoModal' });
  };
  const setActiveTab = (tab: GastosTabValue) => {
    dispatch({ type: 'setActiveTab', payload: tab });
  };

  return {
    state,
    dispatch,
    periodLabel,
    gastoModalKey,
    ingresoModalKey,
    markPaidTarget,
    setMarkPaidTarget,
    setPeriodo,
    openGastoModal,
    closeGastoModal,
    openIngresoModal,
    closeIngresoModal,
    setActiveTab,
  };
};

export const buildGastoModalKey = (mes: number, anio: number) => `${mes}-${anio}`;

export const buildIngresoModalKey = (mes: number, anio: number) => `ingresos-${mes}-${anio}`;

export const sumByMonto = (items: { monto: number }[]) => items.reduce((acc, item) => acc + item.monto, 0);

export const buildSections = (gastosFijos: GastoItem[], gastosVariables: GastoItem[]): GastoSectionsMap => ({
  variables: {
    title: 'Gastos Variables',
    subtitle: 'Operativa del día a día',
    gastos: gastosVariables,
    emptyMessage: 'No registraste gastos variables este mes. Usá el botón para agregar el primero.',
  },
  fijos: {
    title: 'Gastos Fijos',
    subtitle: 'Compromisos recurrentes',
    gastos: gastosFijos,
    emptyMessage: 'Todavía no hay plantillas aplicadas para este periodo.',
  },
});

export const buildCategoriasResumen = (gastos: GastoItem[]): GastosCategoriasCarouselItem[] => {
  if (!gastos.length) {
    return [];
  }

  const totals = gastos.reduce<Map<string, number>>((acc, gasto) => {
    const key = normalizeCategoriaKey(gasto.categoria);
    const current = acc.get(key) ?? 0;
    acc.set(key, current + gasto.monto);
    return acc;
  }, new Map());

  const totalMonto = Array.from(totals.values()).reduce((acc, value) => acc + value, 0);

  if (totalMonto <= 0) {
    return [];
  }

  return Array.from(totals.entries())
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => {
      const config = getCategoriaConfig(key);
      const percentage = (amount / totalMonto) * 100;
      return {
        id: key,
        label: config.label,
        amount,
        percentage,
        icon: config.icon,
        gradient: config.gradient,
        chipClass: config.chipClass,
      } satisfies GastosCategoriasCarouselItem;
    })
    .sort((a, b) => b.amount - a.amount);
};
