import { useState } from 'react';
import { Modal, SearchInput } from '../../shared/ui';
import { useToast } from '../../shared/hooks/useToast';
import { usePasajerosDisponibles } from '../../pasajeros/services/pasajeros.queries';
import type { PasajeroResponse } from '../../pasajeros/types/pasajero.types';
import { formatPasajeroHorariosListado } from '../../pasajeros/helpers/horario.helpers';
import {
  useConfirmarReinscripcion,
  useCrearReinscripcion,
  useMarcarComoNoContinua,
} from '../services/reinscripciones.queries';
import { LastPendingConfirmationModal } from './LastPendingConfirmationModal';
import { isLastPendingForTitular } from '../helpers/last-pending.helper';
import { PasajeroSelectionList } from './PasajeroSelectionList';
import { SelectedPasajeroSummary } from './SelectedPasajeroSummary';
import { ReinscripcionActionCards } from './ReinscripcionActionCards';
import type {
  ReinscripcionActionDefinition,
  ReinscripcionActionVariant,
  ReinscripcionImmediateActionVariant,
} from '../types/reinscripcion-actions.types';

type CriticalActionState =
  | {
      variant: 'confirmado';
      reinscripcionId: number;
      pasajeroNombre: string;
      titularNombre?: string;
      isUltimoPendiente: boolean;
    }
  | {
      variant: 'noContinua';
      pasajero: PasajeroResponse;
      pasajeroNombre: string;
      titularNombre?: string;
      isUltimoPendiente: boolean;
    };

interface ReinscripcionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  anio: number;
  onCreated?: () => void;
}

const ACTIONS: ReinscripcionActionDefinition[] = [
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

const successMessages: Record<ReinscripcionActionVariant, string> = {
  pendiente: 'Reinscripción creada en estado pendiente.',
  confirmado: 'Reinscripción creada y confirmada correctamente.',
  noContinua: 'Reinscripción registrada como no continúa.',
};

export const ReinscripcionCreateModal = ({ isOpen, onClose, anio, onCreated }: ReinscripcionCreateModalProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedPasajeroId, setSelectedPasajeroId] = useState<number | null>(null);
  const [actionInProgress, setActionInProgress] = useState<ReinscripcionActionVariant | null>(null);
  const [criticalAction, setCriticalAction] = useState<CriticalActionState | null>(null);

  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const {
    data: pasajerosDisponibles = [],
    isLoading,
    isError,
    error,
    refetch,
  } = usePasajerosDisponibles(anio);

  const crearReinscripcionMutation = useCrearReinscripcion();
  const confirmarReinscripcionMutation = useConfirmarReinscripcion();
  const marcarComoNoContinuaMutation = useMarcarComoNoContinua();

  const modalStateKey = `${anio}-${isOpen ? 'open' : 'closed'}`;

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

  const executeAction = async (variant: ReinscripcionImmediateActionVariant, pasajeroId: number) => {
    setActionInProgress(variant);

    try {
      const nuevaReinscripcion = await crearReinscripcionMutation.mutateAsync({ pasajeroId, anio });

      if (variant === 'noContinua') {
        await marcarComoNoContinuaMutation.mutateAsync(nuevaReinscripcion.id);
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

  const iniciarConfirmacion = async (pasajero: PasajeroResponse, esUltimoPendiente: boolean) => {
    setActionInProgress('confirmado');

    try {
      const nuevaReinscripcion = await crearReinscripcionMutation.mutateAsync({ pasajeroId: pasajero.id, anio });
      const titularDescripcion = nuevaReinscripcion.titularNombre || (pasajero.titularApellido ? `Familia ${pasajero.titularApellido}` : undefined);

      setCriticalAction({
        variant: 'confirmado',
        reinscripcionId: nuevaReinscripcion.id,
        pasajeroNombre: nuevaReinscripcion.pasajeroNombre,
        titularNombre: titularDescripcion,
        isUltimoPendiente: esUltimoPendiente,
      });
      onCreated?.();
      showInfo('Revisá el precio calculado antes de confirmar.');
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : 'No pudimos crear la reinscripción. Intentalo nuevamente.';
      showError(message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAction = (variant: ReinscripcionActionVariant) => {
    if (!selectedPasajero) {
      showWarning('Seleccioná un pasajero antes de continuar.');
      return;
    }

    if (variant === 'pendiente') {
      void executeAction('pendiente', selectedPasajero.id);
      return;
    }

    const esUltimoPendiente = isLastPendingForTitular({
      collection: pasajerosDisponibles,
      titularKey: selectedPasajero.titularId,
      getTitularKey: (pasajero) => pasajero.titularId,
    });

    if (variant === 'confirmado') {
      void iniciarConfirmacion(selectedPasajero, esUltimoPendiente);
      return;
    }

    if (esUltimoPendiente) {
      setCriticalAction({
        variant: 'noContinua',
        pasajero: selectedPasajero,
        pasajeroNombre: selectedPasajero.nombreCompleto,
        titularNombre: selectedPasajero.titularApellido ? `Familia ${selectedPasajero.titularApellido}` : undefined,
        isUltimoPendiente: true,
      });
      return;
    }

    void executeAction('noContinua', selectedPasajero.id);
  };

  const closeCriticalConfirmation = () => setCriticalAction(null);

  const confirmarDesdeModal = async (reinscripcionId: number) => {
    try {
      await confirmarReinscripcionMutation.mutateAsync(reinscripcionId);
      showSuccess(successMessages.confirmado);
      onCreated?.();
      closeCriticalConfirmation();
      onClose();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : 'No pudimos confirmar la reinscripción. Intentalo nuevamente.';
      showError(message);
    }
  };

  const handleCriticalConfirm = () => {
    if (!criticalAction) {
      return;
    }

    if (criticalAction.variant === 'confirmado') {
      void confirmarDesdeModal(criticalAction.reinscripcionId);
      return;
    }

    closeCriticalConfirmation();
    void executeAction('noContinua', criticalAction.pasajero.id);
  };

  const isActionDisabled = !selectedPasajeroId || actionInProgress !== null;
  const isCriticalModalOpen = Boolean(criticalAction);
  const criticalActionLabel =
    criticalAction?.variant === 'confirmado' ? 'Confirmar reinscripción' : 'Marcar como no continúa';
  const criticalPasajeroNombre =
    criticalAction?.variant === 'confirmado'
      ? criticalAction.pasajeroNombre
      : criticalAction?.pasajero.nombreCompleto ?? '';
  const criticalTitularNombre = criticalAction?.titularNombre;
  const criticalReinscripcionId = criticalAction?.variant === 'confirmado' ? criticalAction.reinscripcionId : null;
  const criticalModalVariant = criticalAction?.variant === 'confirmado' ? 'confirmar' : 'noContinua';
  const criticalUltimoPendiente = criticalAction?.isUltimoPendiente ?? false;
  const isCriticalProcessing = criticalAction?.variant === 'confirmado'
    ? confirmarReinscripcionMutation.isPending
    : actionInProgress === 'noContinua';

  return (
    <>
      <Modal key={modalStateKey} isOpen={isOpen} onClose={onClose} title={`Nueva reinscripción ${anio}`} maxWidth="lg">
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
            <PasajeroSelectionList
              pasajeros={filteredPasajeros}
              selectedPasajeroId={selectedPasajeroId}
              onSelect={(id) => setSelectedPasajeroId(id)}
              isLoading={isLoading}
              isError={isError}
              errorMessage={fetchErrorMessage}
              emptyMessage={listStateMessage}
              onRetry={refetch}
            />
          </div>

          <SelectedPasajeroSummary pasajero={selectedPasajero ?? null} />

          <ReinscripcionActionCards
            actions={ACTIONS}
            disabled={isActionDisabled}
            currentActionId={actionInProgress}
            onAction={handleAction}
          />
        </div>
      </Modal>
      <LastPendingConfirmationModal
        isOpen={isCriticalModalOpen}
        reinscripcionId={criticalReinscripcionId}
        onCancel={closeCriticalConfirmation}
        onConfirm={handleCriticalConfirm}
        pasajeroNombre={criticalPasajeroNombre}
        titularNombre={criticalTitularNombre}
        actionLabel={criticalActionLabel}
        isProcessing={isCriticalProcessing}
        variant={criticalModalVariant}
        isUltimoPendiente={criticalUltimoPendiente}
      />
    </>
  );
};
