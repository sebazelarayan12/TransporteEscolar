import { useState } from 'react';
import {
  useConfirmarReinscripcion,
  useMarcarComoNoContinua,
  useMarcarComoPendiente,
} from '../services/reinscripciones.queries';
import { isLastPendingForTitular } from '../helpers/last-pending.helper';
import type { LastPendingVariant } from '../helpers/last-pending-modal.helpers';
import type { ReinscripcionDetallada } from '../types/reinscripcion.types';

interface CriticalAction {
  variant: 'confirmado' | 'noContinua';
  registro: ReinscripcionDetallada;
  isUltimoPendiente: boolean;
}

/**
 * Acciones sobre una reinscripción. Cuando es el último pendiente del titular,
 * pide confirmación previa (LastPendingConfirmationModal).
 */
export const useReinscripcionCriticalAction = (reinscripciones: ReinscripcionDetallada[]) => {
  const [criticalAction, setCriticalAction] = useState<CriticalAction | null>(null);
  const confirmarMutation = useConfirmarReinscripcion();
  const noContinuaMutation = useMarcarComoNoContinua();
  const pendienteMutation = useMarcarComoPendiente();

  const isUltimoPendiente = (registro: ReinscripcionDetallada) =>
    registro.estado === 'Pendiente' &&
    isLastPendingForTitular({
      collection: reinscripciones,
      titularKey: registro.titularNombre,
      getTitularKey: (item) => item.titularNombre,
      isPending: (item) => item.estado === 'Pendiente',
    });

  const close = () => setCriticalAction(null);

  const requestConfirm = (registro: ReinscripcionDetallada) => {
    setCriticalAction({ variant: 'confirmado', registro, isUltimoPendiente: isUltimoPendiente(registro) });
  };

  const requestNoContinua = (registro: ReinscripcionDetallada) => {
    const ultimoPendiente = isUltimoPendiente(registro);
    if (ultimoPendiente) {
      setCriticalAction({ variant: 'noContinua', registro, isUltimoPendiente: ultimoPendiente });
      return;
    }
    noContinuaMutation.mutate(registro.id);
  };

  const markPendiente = (registro: ReinscripcionDetallada) => {
    pendienteMutation.mutate(registro.id);
  };

  const confirmCritical = () => {
    if (!criticalAction) return;

    const reinscripcionId = criticalAction.registro.id;

    if (criticalAction.variant === 'confirmado') {
      // Si falla, el modal permanece abierto para permitir reintentar
      confirmarMutation.mutateAsync(reinscripcionId).then(close, () => undefined);
      return;
    }

    close();
    noContinuaMutation.mutate(reinscripcionId);
  };

  const isConfirmar = criticalAction?.variant === 'confirmado';
  const modalVariant: LastPendingVariant = isConfirmar ? 'confirmar' : 'noContinua';
  const isProcessing = isConfirmar ? confirmarMutation.isPending : noContinuaMutation.isPending;

  return {
    isOpen: criticalAction !== null,
    modalProps: {
      reinscripcionId: criticalAction?.registro.id ?? null,
      pasajeroNombre: criticalAction?.registro.pasajeroNombre ?? '',
      titularNombre: criticalAction?.registro.titularNombre,
      actionLabel: isConfirmar ? 'Confirmar reinscripción' : 'Marcar como no continúa',
      isProcessing: Boolean(criticalAction) && isProcessing,
      variant: modalVariant,
      isUltimoPendiente: criticalAction?.isUltimoPendiente ?? false,
    },
    requestConfirm,
    requestNoContinua,
    markPendiente,
    confirmCritical,
    close,
  };
};
