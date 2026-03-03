import { useReducer, useState, type Dispatch } from 'react';
import { LoadingScreen, ErrorState, EmptyState, ConfirmDialog } from '../../shared/ui';
import { GastosControlLayout } from '../components';
import type { DeleteDialogCopy } from '../components';
import {
  useGastosResumen,
  useEliminarGastoFijo,
  useEliminarGastoVariable,
  useMarcarGastoVariablePagado,
} from '../services/gastos.queries';
import {
  useIngresosResumen,
  useEliminarIngresoFijo,
  useEliminarIngresoVariable,
} from '../services/ingresos.queries';
import { useToast } from '../../shared/hooks';
import { formatCurrency } from '../../shared/utils/currency.helpers';
import { formatDateOnly } from '../../shared/utils/date.helpers';
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoItem, type GastosTabValue } from '../types/gastos.types';
import { INGRESO_TIPOS, type IngresoItem } from '../types/ingresos.types';

const monthFormatter = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
});

const sumByMonto = (items: { monto: number }[]) => items.reduce((acc, item) => acc + item.monto, 0);

type GastoSectionDefinition = {
  title: string;
  subtitle: string;
  gastos: GastoItem[];
  emptyMessage: string;
};

type GastoSectionsMap = Record<GastosTabValue, GastoSectionDefinition>;

type DeleteMutationsBundle = {
  gastoFijo: ReturnType<typeof useEliminarGastoFijo>;
  gastoVariable: ReturnType<typeof useEliminarGastoVariable>;
  ingresoFijo: ReturnType<typeof useEliminarIngresoFijo>;
  ingresoVariable: ReturnType<typeof useEliminarIngresoVariable>;
};

type DeleteDialogState =
  | { scope: 'gasto-fijo'; item: GastoItem }
  | { scope: 'gasto-variable'; item: GastoItem }
  | { scope: 'ingreso-fijo'; item: IngresoItem }
  | { scope: 'ingreso-variable'; item: IngresoItem }
  | null;

type GastosControlState = {
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

type GastosControlAction =
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

const createInitialState = (): GastosControlState => {
  const now = new Date();
  return {
    selectedMes: now.getMonth() + 1,
    selectedAnio: now.getFullYear(),
    activeTab: 'fijos',
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
        activeTab: 'fijos',
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

const buildSections = (gastosFijos: GastoItem[], gastosVariables: GastoItem[]): GastoSectionsMap => ({
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

const buildDeleteDialogCopy = (deleteDialog: DeleteDialogState): DeleteDialogCopy | null => {
  if (!deleteDialog) {
    return null;
  }

  const montoLabel = formatCurrency(deleteDialog.item.monto);
  const periodoLabel = `${deleteDialog.item.mes}/${deleteDialog.item.anio}`;

  switch (deleteDialog.scope) {
    case 'gasto-fijo':
      return {
        title: 'Eliminar gasto fijo',
        message: `Se eliminará la plantilla "${deleteDialog.item.descripcion}" y se recalcularán los totales de ${periodoLabel}.`,
        confirmLabel: 'Eliminar gasto fijo',
      };
    case 'gasto-variable': {
      const fechaLabel = formatDateOnly(deleteDialog.item.fechaCuota, { day: '2-digit', month: 'long' });
      return {
        title: 'Eliminar gasto variable',
        message: `Vas a eliminar el gasto del ${fechaLabel} por ${montoLabel}. Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar gasto variable',
      };
    }
    case 'ingreso-fijo':
      return {
        title: 'Eliminar ingreso fijo',
        message: `Se desactivará la plantilla "${deleteDialog.item.descripcion}" y se quitará del periodo ${periodoLabel}.`,
        confirmLabel: 'Eliminar ingreso fijo',
      };
    case 'ingreso-variable': {
      const fechaLabel = formatDateOnly(deleteDialog.item.fecha, { day: '2-digit', month: 'long' });
      return {
        title: 'Eliminar ingreso variable',
        message: `¿Eliminar el ingreso del ${fechaLabel} por ${montoLabel}?`,
        confirmLabel: 'Eliminar ingreso variable',
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

type GastosDeleteDialogHandlersOptions = {
  deleteDialog: DeleteDialogState;
  dispatch: Dispatch<GastosControlAction>;
  mutations: DeleteMutationsBundle;
  refetchGastos: () => void;
  refetchIngresos: () => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const createGastosDeleteDialogHandlers = ({
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

export const GastosControlPage = () => {
  const [state, dispatch] = useReducer(gastosControlReducer, undefined, createInitialState);
  const [markPaidTarget, setMarkPaidTarget] = useState<GastoItem | null>(null);
  const {
    selectedMes,
    selectedAnio,
    activeTab,
    isModalOpen,
    isIngresoModalOpen,
    gastoModalMode,
    ingresoModalMode,
    selectedGasto,
    selectedIngreso,
    deleteDialog,
  } = state;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGastosResumen(selectedMes, selectedAnio);
  const {
    data: ingresosData,
    isLoading: isIngresosLoading,
    isError: isIngresosError,
    error: ingresosError,
    isFetching: isIngresosFetching,
    refetch: refetchIngresos,
  } = useIngresosResumen(selectedMes, selectedAnio);
  const eliminarGastoFijo = useEliminarGastoFijo();
  const eliminarGastoVariable = useEliminarGastoVariable();
  const marcarGastoVariable = useMarcarGastoVariablePagado();
  const eliminarIngresoFijo = useEliminarIngresoFijo();
  const eliminarIngresoVariable = useEliminarIngresoVariable();
  const { showSuccess, showError } = useToast();

  const gastosFijos = data?.gastosFijos ?? [];
  const gastosVariables = data?.gastosVariables ?? [];
  const gastosVariablesPendientes = gastosVariables
    .filter((item) => item.estadoPago === GASTO_ESTADOS.PENDIENTE)
    .reduce((acc, item) => acc + item.monto, 0);
  const gastosVariablesPagados = gastosVariables
    .filter((item) => item.estadoPago === GASTO_ESTADOS.PAGADO)
    .reduce((acc, item) => acc + item.monto, 0);
  const periodLabel = monthFormatter.format(new Date(selectedAnio, selectedMes - 1, 1));

  const handleFilterChange = (mes: number, anio: number) => {
    dispatch({ type: 'setPeriodo', payload: { mes, anio } });
  };

  const openRegistrarGasto = () => {
    dispatch({ type: 'openGastoModal' });
  };

  const openRegistrarIngreso = () => {
    dispatch({ type: 'openIngresoModal' });
  };

  const handleCloseGastoModal = () => {
    dispatch({ type: 'closeGastoModal' });
  };

  const handleCloseIngresoModal = () => {
    dispatch({ type: 'closeIngresoModal' });
  };

  const handleGastoModalSuccess = () => {
    refetch();
    refetchIngresos();
    if (gastoModalMode === 'create') {
      dispatch({ type: 'setActiveTab', payload: 'fijos' });
    }
  };

  const handleIngresoModalSuccess = () => {
    refetch();
    refetchIngresos();
  };

  const handleEditGasto = (gasto: GastoItem) => {
    if (!gasto.templateId) {
      showError('No encontramos la plantilla del gasto fijo para editar.');
      return;
    }
    dispatch({ type: 'editGasto', payload: gasto });
  };

  const handleEditIngreso = (ingreso: IngresoItem) => {
    if (!ingreso.templateId) {
      showError('No encontramos la plantilla del ingreso fijo para editar.');
      return;
    }
    dispatch({ type: 'editIngreso', payload: ingreso });
  };

  const handleDeleteGasto = (gasto: GastoItem) => {
    const scope = gasto.tipo === GASTO_TIPOS.FIJO ? 'gasto-fijo' : 'gasto-variable';
    dispatch({ type: 'setDeleteDialog', payload: { scope, item: gasto } });
  };

  const handleMarkGastoVariablePagado = (gasto: GastoItem) => {
    setMarkPaidTarget(gasto);
  };

  const handleDeleteIngreso = (ingreso: IngresoItem) => {
    const scope = ingreso.tipo === INGRESO_TIPOS.FIJO ? 'ingreso-fijo' : 'ingreso-variable';
    dispatch({ type: 'setDeleteDialog', payload: { scope, item: ingreso } });
  };

  const isInitialLoading = (isLoading && !data) || (isIngresosLoading && !ingresosData);

  if (isInitialLoading) {
    return <LoadingScreen message="Cargando resumen financiero..." />;
  }

  if (isError || isIngresosError) {
    const sourceError = isError ? error : ingresosError;
    const fallbackMessage = isError
      ? 'No pudimos obtener el resumen de gastos.'
      : 'No pudimos obtener los ingresos externos.';
    const message =
      sourceError && typeof sourceError === 'object' && 'message' in sourceError
        ? String((sourceError as { message?: string }).message)
        : fallbackMessage;
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <ErrorState message={message} />
      </div>
    );
  }

  if (!data || !ingresosData) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <EmptyState message="Aún no hay datos financieros para este mes." />
      </div>
    );
  }

  const sections = buildSections(gastosFijos, gastosVariables);
  const activeSection = sections[activeTab];
  const ingresosFijos = ingresosData.ingresosFijos ?? [];
  const ingresosVariables = ingresosData.ingresosVariables ?? [];
  const heroTotals = {
    totalCuotas: data.totales.totalCuotas,
    totalGastosFijos: data.totales.totalGastosFijos,
    totalGastosVariables: data.totales.totalGastosVariables,
    totalIngresosExternos: ingresosData.totales.totalIngresosExternos,
    totalIngresosFijos: ingresosData.totales.totalIngresosFijos,
    totalIngresosVariables: ingresosData.totales.totalIngresosVariables,
    gastosVariablesPendientes,
    gastosVariablesPagados,
  };

  const gastoActionsDisabled = eliminarGastoFijo.isPending || eliminarGastoVariable.isPending || marcarGastoVariable.isPending;
  const ingresoActionsDisabled = eliminarIngresoFijo.isPending || eliminarIngresoVariable.isPending;

  const { copy: deleteDialogCopy, isProcessing: deleteIsProcessing, handleConfirmDelete, handleCancelDelete } =
    createGastosDeleteDialogHandlers({
      deleteDialog,
      dispatch,
      mutations: {
        gastoFijo: eliminarGastoFijo,
        gastoVariable: eliminarGastoVariable,
        ingresoFijo: eliminarIngresoFijo,
        ingresoVariable: eliminarIngresoVariable,
      },
      refetchGastos: refetch,
      refetchIngresos,
      showSuccess,
      showError,
    });

  const handleTabChange = (tab: GastosTabValue) => {
    dispatch({ type: 'setActiveTab', payload: tab });
  };

  const gastoModalKey = `${selectedMes}-${selectedAnio}`;
  const ingresoModalKey = `ingresos-${selectedMes}-${selectedAnio}`;
  const markPaidMessage = markPaidTarget
    ? `Confirmá que "${markPaidTarget.descripcion}" del ${formatDateOnly(markPaidTarget.fechaCuota, {
        day: '2-digit',
        month: 'long',
      })} por ${formatCurrency(markPaidTarget.monto)} ya fue pagado.`
    : '';

  const handleConfirmMarkPaid = async () => {
    if (!markPaidTarget) {
      return;
    }
    try {
      await marcarGastoVariable.mutateAsync({
        id: markPaidTarget.id,
        mes: markPaidTarget.mes,
        anio: markPaidTarget.anio,
      });
      showSuccess('Gasto variable marcado como pagado');
      setMarkPaidTarget(null);
      refetch();
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'No pudimos marcar el gasto como pagado.';
      showError(message);
    }
  };

  const handleCancelMarkPaid = () => {
    if (marcarGastoVariable.isPending) {
      return;
    }
    setMarkPaidTarget(null);
  };

  return (
    <>
      <GastosControlLayout
        periodLabel={periodLabel}
        selectedMes={selectedMes}
        selectedAnio={selectedAnio}
        activeTab={activeTab}
        heroTotals={heroTotals}
        headerActions={{ onRegistrarIngreso: openRegistrarIngreso, onRegistrarGasto: openRegistrarGasto }}
        onFilterChange={handleFilterChange}
        onTabChange={handleTabChange}
        toolbarCounts={{ variables: gastosVariables.length, fijos: gastosFijos.length }}
        isToolbarRefreshing={isFetching}
        gastoModalKey={gastoModalKey}
        gastoSection={{
          title: activeSection.title,
          subtitle: activeSection.subtitle,
          gastos: activeSection.gastos,
          totalAmount: sumByMonto(activeSection.gastos),
          emptyMessage: activeSection.emptyMessage,
          isRefreshing: isFetching,
          actionsDisabled: gastoActionsDisabled,
          onEditGasto: handleEditGasto,
          onDeleteGasto: handleDeleteGasto,
          onMarkVariablePaid: handleMarkGastoVariablePagado,
          markPaidDisabled: marcarGastoVariable.isPending,
        }}
        ingresoModalKey={ingresoModalKey}
        ingresosSection={{
          ingresosFijos,
          ingresosVariables,
          totalGeneral: heroTotals.totalIngresosExternos,
          totalFijos: heroTotals.totalIngresosFijos,
          totalVariables: heroTotals.totalIngresosVariables,
          isLoading: !ingresosData && isIngresosLoading,
          isRefreshing: isIngresosFetching,
          actionsDisabled: ingresoActionsDisabled,
          onRegistrarIngreso: openRegistrarIngreso,
          onEditIngreso: handleEditIngreso,
          onDeleteIngreso: handleDeleteIngreso,
        }}
        gastoModalProps={{
          isOpen: isModalOpen,
          mes: selectedMes,
          anio: selectedAnio,
          onClose: handleCloseGastoModal,
          onSuccess: handleGastoModalSuccess,
          modo: gastoModalMode,
          initialData: selectedGasto,
          templateId: selectedGasto?.templateId ?? null,
        }}
        ingresoModalProps={{
          isOpen: isIngresoModalOpen,
          mes: selectedMes,
          anio: selectedAnio,
          onClose: handleCloseIngresoModal,
          modo: ingresoModalMode,
          initialData: selectedIngreso,
          templateId: selectedIngreso?.templateId ?? null,
          onSuccess: handleIngresoModalSuccess,
        }}
        deleteDialogProps={{
          isOpen: Boolean(deleteDialog),
          copy: deleteDialogCopy,
          isProcessing: deleteIsProcessing,
          onConfirm: handleConfirmDelete,
          onCancel: handleCancelDelete,
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(markPaidTarget)}
        title="Marcar gasto como pagado"
        message={markPaidMessage}
        confirmLabel="Marcar pagado"
        onConfirm={handleConfirmMarkPaid}
        onCancel={handleCancelMarkPaid}
        isProcessing={marcarGastoVariable.isPending}
      />
    </>
  );
};
