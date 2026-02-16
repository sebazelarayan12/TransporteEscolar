import { useEffect, useState } from 'react';
import { Modal, SearchInput, Spinner, Button } from '../../shared/ui';
import { useToast } from '../../shared/hooks/useToast';
import { usePasajerosDisponibles } from '../../pasajeros/services/pasajeros.queries';
import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import {
  useConfirmarReinscripcion,
  useCrearReinscripcion,
  useMarcarComoNoContinua,
} from '../services/reinscripciones.queries';
import { LastPendingConfirmationModal } from './LastPendingConfirmationModal';
import { isLastPendingForTitular } from '../helpers/last-pending.helper';
import { formatPasajeroHorariosListado } from '../../pasajeros/helpers/horario.helpers';

type ActionVariant = 'pendiente' | 'confirmado' | 'noContinua';
type CriticalActionVariant = Exclude<ActionVariant, 'pendiente'>;

interface ReinscripcionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  anio: number;
  onCreated?: () => void;
}

const ACTIONS: Array<{
  id: ActionVariant;
  label: string;
  description: string;
  icon: string;
  classes: string;
  iconColor: string;
}> = [
  {
    id: 'pendiente',
    label: 'Solo registrar (Pendiente)',
    description: 'Guarda el registro para completarlo y confirmarlo más adelante.',
    icon: 'schedule',
    classes:
      'border border-amber-200 bg-amber-50/80 text-amber-900 hover:border-amber-300 hover:bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/40 dark:hover:border-amber-700/60 dark:text-amber-100',
    iconColor: 'text-amber-500 dark:text-amber-300',
  },
  {
    id: 'confirmado',
    label: 'Agregar y confirmar',
    description: 'Crea la reinscripción y deja al pasajero confirmado al instante.',
    icon: 'task_alt',
    classes:
      'border border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800/40 dark:hover:border-emerald-700/60 dark:text-emerald-100',
    iconColor: 'text-emerald-500 dark:text-emerald-300',
  },
  {
    id: 'noContinua',
    label: 'No continúa',
    description: 'Registra que la familia no seguirá en el próximo ciclo lectivo.',
    icon: 'block',
    classes:
      'border border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100 dark:bg-white/5 dark:border-white/10 dark:hover:border-slate-500/60 dark:text-slate-100',
    iconColor: 'text-slate-500 dark:text-slate-300',
  },
];

const successMessages: Record<ActionVariant, string> = {
  pendiente: 'Reinscripción creada en estado pendiente.',
  confirmado: 'Reinscripción creada y confirmada correctamente.',
  noContinua: 'Reinscripción registrada como no continúa.',
};

export const ReinscripcionCreateModal = ({ isOpen, onClose, anio, onCreated }: ReinscripcionCreateModalProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPasajeroId, setSelectedPasajeroId] = useState<number | null>(null);
  const [actionInProgress, setActionInProgress] = useState<ActionVariant | null>(null);
  const [criticalAction, setCriticalAction] = useState<{
    variant: CriticalActionVariant;
    pasajero: PasajeroResponse;
  } | null>(null);

  const { showSuccess, showError, showWarning } = useToast();
  const {
    data: pasajerosDisponibles = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePasajerosDisponibles(anio);

  const { mutateAsync: crearReinscripcion } = useCrearReinscripcion();
  const { mutateAsync: confirmarReinscripcion } = useConfirmarReinscripcion();
  const { mutateAsync: marcarComoNoContinua } = useMarcarComoNoContinua();

  useEffect(() => {
    if (!isOpen) {
      setSearchValue('');
      setSelectedPasajeroId(null);
      setActionInProgress(null);
      setCriticalAction(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedPasajeroId(null);
  }, [anio]);

  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredPasajeros = normalizedSearch
    ? pasajerosDisponibles.filter((pasajero: PasajeroResponse) => {
        const horariosTexto = formatPasajeroHorariosListado(pasajero.horariosAsignados);
        const hayCoincidencia = `${pasajero.nombreCompleto} ${pasajero.colegio} ${pasajero.gradoCurso} ${horariosTexto}`
          .toLowerCase()
          .includes(normalizedSearch);
        return hayCoincidencia;
      })
    : pasajerosDisponibles;

  const selectedPasajero = selectedPasajeroId
    ? pasajerosDisponibles.find((pasajero) => pasajero.id === selectedPasajeroId)
    : null;

  const listStateMessage = normalizedSearch
    ? 'No hay pasajeros que coincidan con la búsqueda aplicada.'
    : 'Todos los pasajeros activos ya tienen una reinscripción en curso. Gestioná las pendientes desde la pestaña "Pendientes".';

  const fetchErrorMessage = error instanceof Error ? error.message : 'No pudimos cargar los pasajeros disponibles.';

  const executeAction = async (variant: ActionVariant, pasajeroId: number) => {
    setActionInProgress(variant);

    try {
      const nuevaReinscripcion = await crearReinscripcion({ pasajeroId, anio });

      if (variant === 'confirmado') {
        await confirmarReinscripcion(nuevaReinscripcion.id);
      }

      if (variant === 'noContinua') {
        await marcarComoNoContinua(nuevaReinscripcion.id);
      }

      showSuccess(successMessages[variant]);
      onCreated?.();
      onClose();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : 'No pudimos registrar la reinscripción. Intentalo nuevamente.';
      showError(message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAction = (variant: ActionVariant) => {
    if (!selectedPasajero) {
      showWarning('Seleccioná un pasajero antes de continuar.');
      return;
    }

    if (variant === 'pendiente') {
      void executeAction(variant, selectedPasajero.id);
      return;
    }

    const requiereConfirmacionCritica = isLastPendingForTitular({
      collection: pasajerosDisponibles,
      titularKey: selectedPasajero.titularId,
      getTitularKey: (pasajero) => pasajero.titularId,
    });

    if (requiereConfirmacionCritica) {
      setCriticalAction({ variant, pasajero: selectedPasajero });
      return;
    }

    void executeAction(variant, selectedPasajero.id);
  };

  const closeCriticalConfirmation = () => setCriticalAction(null);

  const handleCriticalConfirm = () => {
    if (!criticalAction) {
      return;
    }

    closeCriticalConfirmation();
    void executeAction(criticalAction.variant, criticalAction.pasajero.id);
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <Spinner />
          <p className="text-sm text-gray-500">Buscando pasajeros disponibles...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm font-medium text-red-600">{fetchErrorMessage}</p>
          <Button variant="ghost" onClick={() => refetch()} className="border border-gray-200 text-[#1d8ca5]">
            Reintentar
          </Button>
        </div>
      );
    }

    if (filteredPasajeros.length === 0) {
      return (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">{listStateMessage}</div>
      );
    }

    return (
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {filteredPasajeros.map((pasajero) => {
          const isSelected = selectedPasajeroId === pasajero.id;
          const horariosTexto = formatPasajeroHorariosListado(pasajero.horariosAsignados) || 'Sin horarios';

          return (
            <button
              type="button"
              key={pasajero.id}
              onClick={() => setSelectedPasajeroId(pasajero.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d8ca5] focus-visible:ring-offset-2 dark:bg-[#1f1f24] ${
                isSelected
                  ? 'border-[#1d8ca5] bg-[#1d8ca5]/10 shadow-sm'
                  : 'border-gray-200 hover:border-[#1d8ca5]/40 hover:bg-slate-50 dark:border-white/10 dark:hover:border-[#1d8ca5]/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{pasajero.nombreCompleto}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{pasajero.colegio}</p>
                </div>
                {isSelected ? (
                  <span className="material-symbols-outlined text-[22px] text-[#1d8ca5]">check_circle</span>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">#{pasajero.id}</span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {pasajero.gradoCurso} • {horariosTexto}
              </p>
            </button>
          );
        })}
      </div>
    );
  };

  const isActionDisabled = !selectedPasajeroId || actionInProgress !== null;
  const isCriticalModalOpen = Boolean(criticalAction);
  const criticalActionLabel =
    criticalAction?.variant === 'confirmado' ? 'Confirmar reinscripción' : 'Marcar como no continúa';
  const criticalPasajeroNombre = criticalAction?.pasajero.nombreCompleto ?? '';
  const criticalTitularNombre = criticalAction?.pasajero.titularApellido
    ? `Familia ${criticalAction.pasajero.titularApellido}`
    : undefined;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Nueva reinscripción ${anio}`} maxWidth="lg">
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Seleccioná un pasajero activo sin reinscripción confirmada para el ciclo {anio}.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pasajeros disponibles: {pasajerosDisponibles.length}
            </p>
          </div>

          <SearchInput
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Buscar por nombre, colegio u horario"
          className="w-full"
        />

        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#1f1f24]">
          {renderList()}
        </div>

        <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-600 dark:border-white/10 dark:text-gray-300">
          {selectedPasajero ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-[#1d8ca5]">
                {selectedPasajero.nombreCompleto}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedPasajero.colegio} • {selectedPasajero.gradoCurso} • {formatPasajeroHorariosListado(selectedPasajero.horariosAsignados) || 'Sin horarios'}
              </p>
            </div>
          ) : (
            <p>Selecciona un pasajero para habilitar las acciones de registro.</p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {ACTIONS.map((action) => {
            const isCurrentAction = actionInProgress === action.id;

            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleAction(action.id)}
                disabled={isActionDisabled}
                className={`rounded-2xl px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  action.classes
                } ${
                  isActionDisabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 focus-visible:ring-[#1d8ca5]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{action.label}</p>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{action.description}</p>
                  </div>
                  {isCurrentAction ? (
                    <Spinner size="sm" />
                  ) : (
                    <span className={`material-symbols-outlined text-2xl ${action.iconColor}`}>
                      {action.icon}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </Modal>
      <LastPendingConfirmationModal
        isOpen={isCriticalModalOpen}
        onCancel={closeCriticalConfirmation}
        onConfirm={handleCriticalConfirm}
        pasajeroNombre={criticalPasajeroNombre}
        titularNombre={criticalTitularNombre}
        actionLabel={criticalActionLabel}
        isProcessing={actionInProgress !== null}
      />
    </>
  );
};
