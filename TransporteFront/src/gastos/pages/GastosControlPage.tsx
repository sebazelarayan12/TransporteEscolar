import type { ReactNode } from 'react';
import { LoadingScreen } from '../../shared/ui/Spinner';
import { ErrorState, EmptyState } from '../../shared/ui/Alert';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { GastosControlLayout } from '../components/GastosControlLayout';
import { buildCategoriasResumen, buildSections, sumByMonto, useGastosControlState } from '../hooks/useGastosControlState';
import { useGastosControlData } from '../hooks/useGastosControlData';
import { useGastosItemActions } from '../hooks/useGastosItemActions';
import { useGastosMarkPaid } from '../hooks/useGastosMarkPaid';
import { createGastosDeleteDialogHandlers } from '../helpers/deleteDialog.helpers';
import { buildHeroTotals, getResumenLists } from '../helpers/gastos-page.helpers';
import { useToast } from '../../shared/hooks/useToast';

const PageMessage = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto max-w-5xl px-4 py-10">{children}</div>
);

export const GastosControlPage = () => {
  const controlState = useGastosControlState();
  const { state, dispatch } = controlState;
  const data = useGastosControlData(state.selectedMes, state.selectedAnio);
  const actions = useGastosItemActions(dispatch);
  const markPaid = useGastosMarkPaid({
    target: controlState.markPaidTarget,
    setTarget: controlState.setMarkPaidTarget,
    onMarked: data.refetchGastos,
  });
  const { showSuccess, showError } = useToast();

  if (data.isInitialLoading) {
    return <LoadingScreen message="Cargando resumen financiero..." />;
  }

  if (data.errorMessage) {
    return (
      <PageMessage>
        <ErrorState message={data.errorMessage} />
      </PageMessage>
    );
  }

  if (!data.gastos || !data.ingresos) {
    return (
      <PageMessage>
        <EmptyState message="Aún no hay datos financieros para este mes." />
      </PageMessage>
    );
  }

  const { gastosFijos, gastosVariables, ingresosFijos, ingresosVariables } = getResumenLists(data.gastos, data.ingresos);
  const heroTotals = buildHeroTotals(data.gastos, data.ingresos);
  const activeSection = buildSections(gastosFijos, gastosVariables)[state.activeTab];

  const deleteDialog = createGastosDeleteDialogHandlers({
    deleteDialog: state.deleteDialog,
    dispatch,
    mutations: actions.deleteMutations,
    refetchGastos: data.refetchGastos,
    refetchIngresos: data.refetchIngresos,
    showSuccess,
    showError,
  });

  const handleGastoModalSuccess = () => {
    data.refetchGastos();
    data.refetchIngresos();
    if (state.gastoModalMode === 'create') {
      controlState.setActiveTab('fijos');
    }
  };

  const handleIngresoModalSuccess = () => {
    data.refetchGastos();
    data.refetchIngresos();
  };

  return (
    <>
      <GastosControlLayout
        periodLabel={controlState.periodLabel}
        selectedMes={state.selectedMes}
        selectedAnio={state.selectedAnio}
        activeTab={state.activeTab}
        heroTotals={heroTotals}
        categoriaResumen={buildCategoriasResumen([...gastosFijos, ...gastosVariables])}
        headerActions={{ onRegistrarGasto: controlState.openGastoModal }}
        onFilterChange={controlState.setPeriodo}
        onTabChange={controlState.setActiveTab}
        toolbarCounts={{ variables: gastosVariables.length, fijos: gastosFijos.length }}
        isToolbarRefreshing={data.isFetching}
        gastoModalKey={controlState.gastoModalKey}
        gastoSection={{
          title: activeSection.title,
          subtitle: activeSection.subtitle,
          gastos: activeSection.gastos,
          totalAmount: sumByMonto(activeSection.gastos),
          emptyMessage: activeSection.emptyMessage,
          isRefreshing: data.isFetching,
          actionsDisabled: actions.gastoActionsDisabled || markPaid.isPending,
          onEditGasto: actions.editGasto,
          onDeleteGasto: actions.deleteGasto,
          onMarkVariablePaid: markPaid.request,
          markPaidDisabled: markPaid.isPending,
        }}
        ingresoModalKey={controlState.ingresoModalKey}
        ingresosSection={{
          ingresosFijos,
          ingresosVariables,
          totalGeneral: heroTotals.totalIngresosExternos,
          totalFijos: heroTotals.totalIngresosFijos,
          totalVariables: heroTotals.totalIngresosVariables,
          isLoading: false,
          isRefreshing: data.isIngresosFetching,
          actionsDisabled: actions.ingresoActionsDisabled,
          onRegistrarIngreso: controlState.openIngresoModal,
          onEditIngreso: actions.editIngreso,
          onDeleteIngreso: actions.deleteIngreso,
        }}
        gastoModalProps={{
          isOpen: state.isModalOpen,
          mes: state.selectedMes,
          anio: state.selectedAnio,
          onClose: controlState.closeGastoModal,
          onSuccess: handleGastoModalSuccess,
          modo: state.gastoModalMode,
          initialData: state.selectedGasto,
          templateId: state.selectedGasto?.templateId ?? null,
        }}
        ingresoModalProps={{
          isOpen: state.isIngresoModalOpen,
          mes: state.selectedMes,
          anio: state.selectedAnio,
          onClose: controlState.closeIngresoModal,
          modo: state.ingresoModalMode,
          initialData: state.selectedIngreso,
          templateId: state.selectedIngreso?.templateId ?? null,
          onSuccess: handleIngresoModalSuccess,
        }}
        deleteDialogProps={{
          isOpen: Boolean(state.deleteDialog),
          copy: deleteDialog.copy,
          isProcessing: deleteDialog.isProcessing,
          onConfirm: deleteDialog.handleConfirmDelete,
          onCancel: deleteDialog.handleCancelDelete,
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(controlState.markPaidTarget)}
        title="Marcar gasto como pagado"
        message={markPaid.message}
        confirmLabel="Marcar pagado"
        onConfirm={markPaid.confirm}
        onCancel={markPaid.cancel}
        isProcessing={markPaid.isPending}
      />
    </>
  );
};
