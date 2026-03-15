import type { Dispatch } from 'react';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import type { DeleteDialogCopy } from '../components';
import type { DeleteDialogState, GastosControlAction } from '../hooks/useGastosControlState';
import { useEliminarGastoFijo, useEliminarGastoVariable } from '../services/gastos.queries';
import { useEliminarIngresoFijo, useEliminarIngresoVariable } from '../services/ingresos.queries';

export type DeleteMutationsBundle = {
  gastoFijo: ReturnType<typeof useEliminarGastoFijo>;
  gastoVariable: ReturnType<typeof useEliminarGastoVariable>;
  ingresoFijo: ReturnType<typeof useEliminarIngresoFijo>;
  ingresoVariable: ReturnType<typeof useEliminarIngresoVariable>;
};

type GastosDeleteDialogHandlersOptions = {
  deleteDialog: DeleteDialogState;
  dispatch: Dispatch<GastosControlAction>;
  mutations: DeleteMutationsBundle;
  refetchGastos: () => void;
  refetchIngresos: () => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

export const buildDeleteDialogCopy = (deleteDialog: DeleteDialogState): DeleteDialogCopy | null => {
  if (!deleteDialog) {
    return null;
  }

  const montoLabel = formatCurrency(deleteDialog.item.monto);
  const periodoLabel = `${deleteDialog.item.mes}/${deleteDialog.item.anio}`;
  const descripcion = deleteDialog.item.descripcion?.trim();
  const deleteLabel = descripcion ? `Eliminar "${descripcion}"` : 'Eliminar';
  const confirmLabelByScope: Record<DeleteDialogState['scope'], string> = {
    'gasto-fijo': 'Eliminar gasto fijo',
    'gasto-variable': 'Eliminar gasto variable',
    'ingreso-fijo': 'Eliminar ingreso fijo',
    'ingreso-variable': 'Eliminar ingreso variable',
  };

  switch (deleteDialog.scope) {
    case 'gasto-fijo':
      return {
        title: deleteLabel,
        message: `Se eliminará la plantilla "${deleteDialog.item.descripcion}" y se recalcularán los totales de ${periodoLabel}.`,
        confirmLabel: confirmLabelByScope['gasto-fijo'],
      };
    case 'gasto-variable': {
      const fechaLabel = formatDateOnly(deleteDialog.item.fechaCuota, { day: '2-digit', month: 'long' });
      return {
        title: deleteLabel,
        message: `Vas a eliminar el gasto del ${fechaLabel} por ${montoLabel}. Esta acción no se puede deshacer.`,
        confirmLabel: confirmLabelByScope['gasto-variable'],
      };
    }
    case 'ingreso-fijo':
      return {
        title: deleteLabel,
        message: `Se desactivará la plantilla "${deleteDialog.item.descripcion}" y se quitará del periodo ${periodoLabel}.`,
        confirmLabel: confirmLabelByScope['ingreso-fijo'],
      };
    case 'ingreso-variable': {
      const fechaLabel = formatDateOnly(deleteDialog.item.fecha, { day: '2-digit', month: 'long' });
      return {
        title: deleteLabel,
        message: `¿Eliminar el ingreso del ${fechaLabel} por ${montoLabel}?`,
        confirmLabel: confirmLabelByScope['ingreso-variable'],
      };
    }
    default:
      return null;
  }
};

const getDeleteProcessingState = (deleteDialog: DeleteDialogState, mutations: DeleteMutationsBundle) => {
  if (!deleteDialog) {
    return false;
  }

  switch (deleteDialog.scope) {
    case 'gasto-fijo':
      return mutations.gastoFijo.isPending;
    case 'gasto-variable':
      return mutations.gastoVariable.isPending;
    case 'ingreso-fijo':
      return mutations.ingresoFijo.isPending;
    case 'ingreso-variable':
      return mutations.ingresoVariable.isPending;
    default:
      return false;
  }
};

export const createGastosDeleteDialogHandlers = ({
  deleteDialog,
  dispatch,
  mutations,
  refetchGastos,
  refetchIngresos,
  showSuccess,
  showError,
}: GastosDeleteDialogHandlersOptions) => {
  const isProcessing = getDeleteProcessingState(deleteDialog, mutations);
  const copy = buildDeleteDialogCopy(deleteDialog);

  const handleConfirmDelete = async () => {
    if (!deleteDialog) {
      return;
    }

    try {
      switch (deleteDialog.scope) {
        case 'gasto-fijo': {
          const template = deleteDialog.item.templateId;
          if (!template) {
            showError('No encontramos la plantilla del gasto fijo.');
            dispatch({ type: 'clearDeleteDialog' });
            return;
          }
          await mutations.gastoFijo.mutateAsync({
            templateId: template,
            mes: deleteDialog.item.mes,
            anio: deleteDialog.item.anio,
          });
          showSuccess('Gasto fijo eliminado');
          break;
        }
        case 'gasto-variable': {
          await mutations.gastoVariable.mutateAsync({
            id: deleteDialog.item.id,
            mes: deleteDialog.item.mes,
            anio: deleteDialog.item.anio,
          });
          showSuccess('Gasto variable eliminado');
          break;
        }
        case 'ingreso-fijo': {
          const template = deleteDialog.item.templateId;
          if (!template) {
            showError('No encontramos la plantilla del ingreso fijo.');
            dispatch({ type: 'clearDeleteDialog' });
            return;
          }
          await mutations.ingresoFijo.mutateAsync({
            templateId: template,
            mes: deleteDialog.item.mes,
            anio: deleteDialog.item.anio,
          });
          showSuccess('Ingreso fijo eliminado');
          break;
        }
        case 'ingreso-variable': {
          await mutations.ingresoVariable.mutateAsync({
            id: deleteDialog.item.id,
            mes: deleteDialog.item.mes,
            anio: deleteDialog.item.anio,
          });
          showSuccess('Ingreso variable eliminado');
          break;
        }
      }
      dispatch({ type: 'clearDeleteDialog' });
      refetchGastos();
      refetchIngresos();
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'No pudimos completar la operación.';
      showError(message);
    }
  };

  const handleCancelDelete = () => {
    if (isProcessing) {
      return;
    }
    dispatch({ type: 'clearDeleteDialog' });
  };

  return {
    copy,
    isProcessing,
    handleConfirmDelete,
    handleCancelDelete,
  };
};
