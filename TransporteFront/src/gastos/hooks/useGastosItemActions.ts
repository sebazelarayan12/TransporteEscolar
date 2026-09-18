import type { Dispatch } from 'react';
import { useToast } from '../../shared/hooks/useToast';
import { useEliminarGastoFijo, useEliminarGastoVariable } from '../services/gastos.queries';
import { useEliminarIngresoFijo, useEliminarIngresoVariable } from '../services/ingresos.queries';
import { GASTO_TIPOS, type GastoItem } from '../types/gastos.types';
import { INGRESO_TIPOS, type IngresoItem } from '../types/ingresos.types';
import type { GastosControlAction } from './useGastosControlState';

/**
 * Acciones de edición y borrado sobre gastos e ingresos, y las mutaciones
 * de borrado que las respaldan.
 */
export const useGastosItemActions = (dispatch: Dispatch<GastosControlAction>) => {
  const { showError } = useToast();
  const gastoFijo = useEliminarGastoFijo();
  const gastoVariable = useEliminarGastoVariable();
  const ingresoFijo = useEliminarIngresoFijo();
  const ingresoVariable = useEliminarIngresoVariable();

  const editGasto = (gasto: GastoItem) => {
    if (!gasto.templateId) {
      showError('No encontramos la plantilla del gasto fijo para editar.');
      return;
    }
    dispatch({ type: 'editGasto', payload: gasto });
  };

  const editIngreso = (ingreso: IngresoItem) => {
    if (!ingreso.templateId) {
      showError('No encontramos la plantilla del ingreso fijo para editar.');
      return;
    }
    dispatch({ type: 'editIngreso', payload: ingreso });
  };

  const deleteGasto = (gasto: GastoItem) => {
    const scope = gasto.tipo === GASTO_TIPOS.FIJO ? 'gasto-fijo' : 'gasto-variable';
    dispatch({ type: 'setDeleteDialog', payload: { scope, item: gasto } });
  };

  const deleteIngreso = (ingreso: IngresoItem) => {
    const scope = ingreso.tipo === INGRESO_TIPOS.FIJO ? 'ingreso-fijo' : 'ingreso-variable';
    dispatch({ type: 'setDeleteDialog', payload: { scope, item: ingreso } });
  };

  return {
    deleteMutations: { gastoFijo, gastoVariable, ingresoFijo, ingresoVariable },
    gastoActionsDisabled: gastoFijo.isPending || gastoVariable.isPending,
    ingresoActionsDisabled: ingresoFijo.isPending || ingresoVariable.isPending,
    editGasto,
    editIngreso,
    deleteGasto,
    deleteIngreso,
  };
};
