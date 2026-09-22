import { LoadingScreen } from '../../shared/ui/Spinner';
import { MobileDrawer } from '../../shared/ui/MobileDrawer';
import { Modal } from '../../shared/ui/Modal';
import { useToast } from '../../shared/hooks/useToast';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import { useAgregarHorarioPasajero, useEliminarHorarioPasajero, usePasajerosActivos } from '../../pasajeros/services/pasajeros.queries';
import { useHorarioPasajeros, useHorarios, sortHorariosByOrden } from '../services/horarios.queries';
import { HorarioAsignacionPanel } from '../components/HorarioAsignacionPanel';
import { ParadaFijaSelector } from '../components/ParadaFijaSelector';
import { RecorridoViajePanel } from '../../recorridos/components/RecorridoViajePanel';
import { HorariosGrid } from '../components/HorariosGrid';
import { HorariosHeader } from '../components/HorariosHeader';
import { HorariosError } from '../components/HorariosError';
import { HorariosEmptyState } from '../components/HorariosEmptyState';
import { formatPasajeroHorariosListado } from '../../pasajeros/helpers/horario.helpers';
import { TRANSPORTE_TIPOS } from '../../shared/types/transporte.types';
import type { TransporteTipo } from '../../shared/types/transporte.types';
import { runInSequence } from '../../shared/utils/async.helpers';
import { useHorarioDrawerState, useHorarioSelectionSync } from '../hooks/useHorarioDrawerState';
import { buildAssignmentPlan, groupAdditionsByPasajero } from '../helpers/selection.helpers';

const DESKTOP_QUERY = '(min-width: 1024px)';

const getErrorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Error al guardar los cambios';

export const HorariosPage = () => {
  const drawer = useHorarioDrawerState();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const { data: horarios, isLoading, isError, refetch } = useHorarios();
  const ordenados = sortHorariosByOrden(horarios);
  const { showSuccess, showError } = useToast();

  const { data: pasajerosActivos = [], isLoading: isLoadingPasajeros } = usePasajerosActivos();
  const { data: detalleHorario, isLoading: isLoadingDetalle } = useHorarioPasajeros(drawer.selectedHorarioId, {
    enabled: drawer.drawerOpen && Boolean(drawer.selectedHorarioId),
  });
  useHorarioSelectionSync(detalleHorario, drawer.syncSelection);
  const agregarHorarioPasajero = useAgregarHorarioPasajero();
  const eliminarHorarioPasajero = useEliminarHorarioPasajero();

  const query = drawer.search.trim().toLowerCase();
  const filteredPasajeros = query
    ? pasajerosActivos.filter((pasajero) =>
        `${pasajero.nombreCompleto} ${pasajero.titularApellido ?? ''} ${pasajero.colegio} ${pasajero.gradoCurso} ${formatPasajeroHorariosListado(pasajero.horariosAsignados)}`
          .toLowerCase()
          .includes(query),
      )
    : pasajerosActivos;

  const hasChanges = drawer.isGestionMode && drawer.selectionChanged;

  const handleSave = async () => {
    const horarioId = drawer.selectedHorarioId;
    if (!horarioId || !drawer.isGestionMode || !drawer.selectionChanged) return;

    const plan = buildAssignmentPlan(drawer.selectedPasajerosPorTransporte, drawer.snapshotPorTransporte);
    if (plan.additions.length === 0 && plan.removals.length === 0) return;

    try {
      drawer.startPersist();
      // Pasajeros distintos en paralelo; las altas de un mismo pasajero, en orden.
      await Promise.all(
        groupAdditionsByPasajero(plan.additions).map((group) =>
          runInSequence(group, (addition) =>
            agregarHorarioPasajero.mutateAsync({
              pasajeroId: addition.pasajeroId,
              horarioId,
              prioridad: addition.prioridad,
              transporte: addition.transporte,
            }),
          ),
        ),
      );
      await Promise.all(
        plan.removals.map((pasajeroId) => eliminarHorarioPasajero.mutateAsync({ pasajeroId, horarioId })),
      );
      showSuccess('Asignaciones actualizadas');
      drawer.closeDrawer();
    } catch (error: unknown) {
      showError(getErrorMessage(error));
    } finally {
      drawer.finishPersist();
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando horarios..." />;
  }

  if (isError) {
    return <HorariosError onRetry={refetch} />;
  }

  if (!ordenados.length) {
    return <HorariosEmptyState />;
  }

  const selectedHorario = ordenados.find((horario) => horario.id === drawer.selectedHorarioId);
  const selectedCounts: Record<TransporteTipo, number> = {
    [TRANSPORTE_TIPOS.UNO]: drawer.selectedPasajerosPorTransporte[TRANSPORTE_TIPOS.UNO].size,
    [TRANSPORTE_TIPOS.DOS]: drawer.selectedPasajerosPorTransporte[TRANSPORTE_TIPOS.DOS].size,
  };
  const isDrawerVisible = drawer.drawerOpen && Boolean(drawer.selectedHorarioId);

  const panelContent = (
    <div className="flex h-full flex-col gap-6">
      <ParadaFijaSelector
        horarioId={drawer.selectedHorarioId}
        transporte={drawer.selectedTransporte}
        pasajerosDelHorario={detalleHorario?.pasajeros ?? []}
        isLoadingPasajeros={isLoadingDetalle}
      />
      <RecorridoViajePanel horarioId={drawer.selectedHorarioId} transporte={drawer.selectedTransporte} />
      <HorarioAsignacionPanel
        selectedHorario={selectedHorario}
        detalleHorario={detalleHorario}
        search={drawer.search}
        onSearchChange={drawer.setSearch}
        filteredPasajeros={filteredPasajeros}
        selectedPasajeros={drawer.selectedPasajerosPorTransporte[drawer.selectedTransporte]}
        onTogglePasajero={drawer.togglePasajero}
        isLoadingDetalle={isLoadingDetalle}
        isLoadingPasajeros={isLoadingPasajeros}
        hasChanges={hasChanges}
        onCancel={drawer.closeDrawer}
        onSave={handleSave}
        isSaving={drawer.isPersisting || agregarHorarioPasajero.isPending || eliminarHorarioPasajero.isPending}
        targetHorarioId={drawer.selectedHorarioId}
        isGestionMode={drawer.isGestionMode}
        activeTransporte={drawer.selectedTransporte}
        onTransporteChange={drawer.setTransporte}
        selectedCounts={selectedCounts}
        conteosPorTransporte={
          detalleHorario?.pasajerosAsignados?.conteosPorTransporte ?? selectedHorario?.conteosPorTransporte
        }
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] py-8 dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <HorariosHeader isGestionMode={drawer.isGestionMode} onGestionModeToggle={drawer.toggleGestionMode} />

        <HorariosGrid horarios={ordenados} onSelectHorario={drawer.openHorario} />
      </div>

      {/* Solo se monta uno: un <dialog> modal oculto por CSS igual bloquearía el resto de la página */}
      {isDesktop ? (
        <Modal isOpen={isDrawerVisible} onClose={drawer.closeDrawer} title="Asignar pasajeros" maxWidth="2xl">
          {panelContent}
        </Modal>
      ) : (
        <MobileDrawer isOpen={isDrawerVisible} onClose={drawer.closeDrawer}>
          <div className="space-y-4 px-4 py-4">{panelContent}</div>
        </MobileDrawer>
      )}
    </div>
  );
};
