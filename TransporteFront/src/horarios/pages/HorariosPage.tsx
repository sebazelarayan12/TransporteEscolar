import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button, SearchInput, LoadingScreen, ErrorState, MobileDrawer, Modal } from '../../shared/ui';
import { useToast } from '../../shared/hooks';
import { PasajeroSelectableList } from '../../pasajeros/components';
import { usePasajerosActivos } from '../../pasajeros/services/pasajeros.queries';
import { useAsignarPasajerosAHorario, useHorarioPasajeros, useHorarios, sortHorariosByOrden } from '../services/horarios.queries';
import type { HorarioPasajerosResponse } from '../types/horario.types';

export const HorariosPage = () => {
  const { data: horarios, isLoading, isError, refetch } = useHorarios();
  const ordenados = sortHorariosByOrden(horarios);
  const totalPasajeros = ordenados.reduce((acc, horario) => acc + horario.pasajerosActivos, 0);

  const [selectedHorarioId, setSelectedHorarioId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPasajeros, setSelectedPasajeros] = useState<Set<number>>(new Set());
  const [snapshot, setSnapshot] = useState<Set<number>>(new Set());
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
  const asignarPasajeros = useAsignarPasajerosAHorario();

  const filteredPasajeros = (() => {
    if (!pasajerosActivos) return [];
    const query = search.trim().toLowerCase();
    if (!query) return pasajerosActivos;
    return pasajerosActivos.filter((pasajero) =>
      `${pasajero.nombreCompleto} ${pasajero.titularApellido ?? ''} ${pasajero.colegio} ${pasajero.gradoCurso} ${pasajero.horarioDescripcion ?? ''}`
        .toLowerCase()
        .includes(query)
    );
  })();

  const handleToggle = (pasajeroId: number) => {
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

  const hasChanges = (() => {
    if (snapshot.size !== selectedPasajeros.size) return true;
    for (const id of snapshot) {
      if (!selectedPasajeros.has(id)) return true;
    }
    return false;
  })();

  const handleSave = async () => {
    if (!selectedHorarioId) return;
    try {
      await asignarPasajeros.mutateAsync({
        horarioId: selectedHorarioId,
        pasajeroIds: Array.from(selectedPasajeros),
      });
      showSuccess('Horario actualizado');
      handleCloseDrawer();
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Error al guardar los cambios';
      showError(message);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Cargando horarios..." />;
  }

  if (isError) {
    return (
      <div className="px-4 py-8">
        <ErrorState message="No pudimos obtener los horarios. Intenta nuevamente." />
        <div className="mt-4">
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (!ordenados.length) {
    return (
      <div className="px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Aún no hay horarios configurados. Crea los horarios en el backend para comenzar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedHorario = ordenados.find((horario) => horario.id === selectedHorarioId);

  const panelContent = (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#007a8a]">Horario seleccionado</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedHorario?.etiqueta}</h2>
        <p className="text-sm text-gray-500">Seleccioná los pasajeros que deben viajar en este horario.</p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, colegio o titular" />

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-gray-200">
          <span className="material-symbols-outlined text-[16px]">groups</span>
          {selectedPasajeros.size} pasajeros asignados
        </span>
        {detalleHorario ? (
          <span className="text-xs text-gray-500">
            Asignados originalmente: {detalleHorario.pasajeros.length}
          </span>
        ) : null}
        {hasChanges && (
          <span className="text-xs font-semibold text-amber-700">Hay cambios sin guardar</span>
        )}
      </div>

      <PasajeroSelectableList
        pasajeros={filteredPasajeros}
        selectedIds={selectedPasajeros}
        onToggle={handleToggle}
        isLoading={isLoadingDetalle || isLoadingPasajeros}
        emptyMessage={search ? 'No hay coincidencias con ese criterio' : 'No hay pasajeros activos para asignar'}
        targetHorarioId={selectedHorarioId}
      />

      <div className="mt-auto flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-white/10 sm:flex-row sm:justify-end">
        <Button variant="ghost" className="sm:w-auto" onClick={handleCloseDrawer}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || asignarPasajeros.isPending || !selectedHorarioId}
          className="bg-[#007a8a] text-white hover:bg-[#00626e] disabled:bg-gray-300"
        >
          {asignarPasajeros.isPending ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafa] py-8 dark:bg-[#18181b]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#007a8a]">Operación diaria</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Horarios</h1>
            <p className="text-sm text-gray-500">
              Visualiza la ocupación por horario y asigna pasajeros de forma masiva para equilibrar los recorridos.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Horarios disponibles</h2>
              <span className="text-sm text-gray-500">{ordenados.length} horarios activos</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ordenados.map((horario) => (
                <Card
                  key={horario.id}
                  className="cursor-pointer border border-transparent bg-gradient-to-br from-white to-gray-50 transition hover:-translate-y-0.5 hover:border-[#007a8a]/30 dark:from-[#1e1e23] dark:to-[#27272f]"
                  onClick={() => handleOpenHorario(horario.id)}
                >
                  <CardHeader className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Horario #{horario.orden}</p>
                    <CardTitle className="text-2xl">{horario.etiqueta}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-baseline justify-between">
                    <div>
                      <p className="text-4xl font-black text-[#007a8a] dark:text-cyan-300">{horario.pasajerosActivos}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-400">Pasajeros</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-[#007a8a]/10 px-3 py-1 text-xs font-semibold text-[#007a8a] dark:bg-cyan-400/10 dark:text-cyan-200">
                      <span className="material-symbols-outlined text-[16px]">edit_square</span>
                      Gestionar
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-r from-[#007a8a] to-cyan-400 p-4 text-white shadow-lg">
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80">Total pasajeros</p>
                  <p className="mt-2 text-3xl font-black">{totalPasajeros}</p>
                </div>
                <div className="space-y-3">
                  {ordenados.slice(0, 5).map((horario) => (
                    <div key={horario.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{horario.etiqueta}</p>
                        <p className="text-xs text-gray-500">Orden {horario.orden}</p>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{horario.pasajerosActivos}</span>
                    </div>
                  ))}
                </div>
                <Link to="/pasajeros" className="inline-flex items-center gap-2 text-sm font-semibold text-[#007a8a] hover:text-[#005c69]">
                  Ver listado de pasajeros
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </Link>
              </CardContent>
            </Card>
          </aside>
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
