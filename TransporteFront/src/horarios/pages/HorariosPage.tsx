import { useState } from 'react';
import { LoadingScreen, MobileDrawer, Modal } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { useAgregarHorarioPasajero, useEliminarHorarioPasajero, usePasajerosActivos } from '../../pasajeros/services/pasajeros.queries';
import { useHorarioPasajeros, useHorarios, sortHorariosByOrden } from '../services/horarios.queries';
import {
  HorarioAsignacionPanel,
  HorariosGrid,
  HorariosResumen,
  HorariosHeader,
  HorariosError,
  HorariosEmptyState,
} from '../components';
import type { HorarioPasajerosResponse } from '../types/horario.types';
import { formatPasajeroHorariosListado } from '../../pasajeros/helpers/horario.helpers';

export const HorariosPage = () => {
  const { data: horarios, isLoading, isError, refetch } = useHorarios();
  const ordenados = sortHorariosByOrden(horarios);
  const totalPasajeros = ordenados.reduce((acc, horario) => acc + horario.pasajerosActivos, 0);

  const [selectedHorarioId, setSelectedHorarioId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPasajeros, setSelectedPasajeros] = useState<Set<number>>(new Set());
  const [snapshot, setSnapshot] = useState<Set<number>>(new Set());
  const [isGestionMode, setIsGestionMode] = useState(false);
  const { showSuccess, showError } = useToast();

  const syncSelection = (data: HorarioPasajerosResponse) => {
    const ids = new Set(data.pasajeros.map((pasajero) => pasajero.id));
    setSelectedPasajeros(ids);
    setSnapshot(ids);
  };

  const { data: pasajerosActivos, isLoading: isLoadingPasajeros } = usePasajerosActivos();
  const { data: detalleHorario, isLoading: isLoadingDetalle } = useHorarioPasajeros(selectedHorarioId, {
    enabled: drawerOpen && Boolean(selectedHorarioId),
    onSuccess: syncSelection,
  });
  const agregarHorarioPasajero = useAgregarHorarioPasajero();
  const eliminarHorarioPasajero = useEliminarHorarioPasajero();
  const [isPersisting, setIsPersisting] = useState(false);

  const filteredPasajeros = (() => {
    if (!pasajerosActivos) return [];
    const query = search.trim().toLowerCase();
    if (!query) return pasajerosActivos;
    return pasajerosActivos.filter((pasajero) =>
      `${pasajero.nombreCompleto} ${pasajero.titularApellido ?? ''} ${pasajero.colegio} ${pasajero.gradoCurso} ${formatPasajeroHorariosListado(pasajero.horariosAsignados)}`
        .toLowerCase()
        .includes(query)
    );
  })();

  const handleToggle = (pasajeroId: number) => {
    if (!isGestionMode) return;
    setSelectedPasajeros((prev) => {
      const next = new Set(prev);
      if (next.has(pasajeroId)) {
        next.delete(pasajeroId);
      } else {
        next.add(pasajeroId);
      }
      return next;
    });
  };

  const handleOpenHorario = (horarioId: number) => {
    setSelectedHorarioId(horarioId);
    setDrawerOpen(true);
    setSearch('');
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedHorarioId(null);
    setSelectedPasajeros(new Set());
    setSnapshot(new Set());
    setSearch('');
  };

  const selectionChanged = (() => {
    if (snapshot.size !== selectedPasajeros.size) return true;
    for (const id of snapshot) {
      if (!selectedPasajeros.has(id)) return true;
    }
    return false;
  })();
  const hasChanges = isGestionMode && selectionChanged;

  const handleGestionModeToggle = () => {
    if (isGestionMode) {
      setSelectedPasajeros(new Set(snapshot));
    }
    setIsGestionMode((prev) => !prev);
  };

  const handleSave = async () => {
    if (!selectedHorarioId || !isGestionMode || !selectionChanged) return;
    const selectionOrder = Array.from(selectedPasajeros);
    const toAdd = selectionOrder.filter((id) => !snapshot.has(id));
    const toRemove = Array.from(snapshot).filter((id) => !selectedPasajeros.has(id));

    try {
      setIsPersisting(true);
      for (const pasajeroId of toAdd) {
        await agregarHorarioPasajero.mutateAsync({
          pasajeroId,
          horarioId: selectedHorarioId,
          prioridad: selectionOrder.indexOf(pasajeroId) + 1,
        });
      }
      for (const pasajeroId of toRemove) {
        await eliminarHorarioPasajero.mutateAsync({ pasajeroId, horarioId: selectedHorarioId });
      }
      showSuccess('Asignaciones actualizadas');
      handleCloseDrawer();
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Error al guardar los cambios';
      showError(message);
    } finally {
      setIsPersisting(false);
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

  const selectedHorario = ordenados.find((horario) => horario.id === selectedHorarioId);

  const panelContent = (
    <HorarioAsignacionPanel
      selectedHorario={selectedHorario}
      detalleHorario={detalleHorario}
      search={search}
      onSearchChange={setSearch}
      filteredPasajeros={filteredPasajeros}
      selectedPasajeros={selectedPasajeros}
      onTogglePasajero={handleToggle}
      isLoadingDetalle={isLoadingDetalle}
      isLoadingPasajeros={isLoadingPasajeros}
      hasChanges={hasChanges}
      onCancel={handleCloseDrawer}
      onSave={handleSave}
      isSaving={isPersisting || agregarHorarioPasajero.isPending || eliminarHorarioPasajero.isPending}
      targetHorarioId={selectedHorarioId}
      isGestionMode={isGestionMode}
    />
  );

  return (
    <div className="min-h-screen bg-[#fafafa] py-8 dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <HorariosHeader isGestionMode={isGestionMode} onGestionModeToggle={handleGestionModeToggle} />

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <HorariosGrid horarios={ordenados} onSelectHorario={handleOpenHorario} />

          <HorariosResumen horarios={ordenados} totalPasajeros={totalPasajeros} />
        </div>
      </div>

      <div className="hidden lg:block">
        <Modal isOpen={drawerOpen && Boolean(selectedHorarioId)} onClose={handleCloseDrawer} title="Asignar pasajeros" maxWidth="2xl">
          {panelContent}
        </Modal>
      </div>
      <MobileDrawer isOpen={drawerOpen && Boolean(selectedHorarioId)} onClose={handleCloseDrawer}>
        <div className="space-y-4 px-4 py-4">{panelContent}</div>
      </MobileDrawer>
    </div>
  );
};
