import { LoadingScreen, ErrorState, EmptyState, ConfirmDialog } from '../../shared/ui';
import { GastosControlLayout } from '../components';
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
import { GASTO_ESTADOS, GASTO_TIPOS, type GastoItem } from '../types/gastos.types';
import { INGRESO_TIPOS, type IngresoItem } from '../types/ingresos.types';
import {
  useGastosControlState,
  buildCategoriasResumen,
  buildSections,
  sumByMonto,
} from '../hooks/useGastosControlState';
import { createGastosDeleteDialogHandlers } from '../helpers/deleteDialog.helpers';

export const GastosControlPage = () => {
  const {
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
  } = useGastosControlState();
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

  const handleGastoModalSuccess = () => {
    refetch();
    refetchIngresos();
    if (gastoModalMode === 'create') {
      setActiveTab('fijos');
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
  const categoriaResumen = buildCategoriasResumen([...gastosFijos, ...gastosVariables]);

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
        categoriaResumen={categoriaResumen}
        headerActions={{ onRegistrarGasto: openGastoModal }}
        onFilterChange={setPeriodo}
        onTabChange={setActiveTab}
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
           onRegistrarIngreso: openIngresoModal,
          onEditIngreso: handleEditIngreso,
          onDeleteIngreso: handleDeleteIngreso,
        }}
        gastoModalProps={{
          isOpen: isModalOpen,
          mes: selectedMes,
          anio: selectedAnio,
           onClose: closeGastoModal,
          onSuccess: handleGastoModalSuccess,
          modo: gastoModalMode,
          initialData: selectedGasto,
          templateId: selectedGasto?.templateId ?? null,
        }}
        ingresoModalProps={{
          isOpen: isIngresoModalOpen,
          mes: selectedMes,
          anio: selectedAnio,
           onClose: closeIngresoModal,
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
