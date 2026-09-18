import { useState } from 'react';
import { useToast } from '../../shared/hooks/useToast';
import { useDeleteTitular, useReactivarTitular } from '../services/titulares.queries';
import type { TitularReactivarRequest, TitularResponse } from '../types/titular.types';

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return fallback;
};

/**
 * Inactivar / reactivar un titular: estado de los modales de confirmación y las
 * mutaciones con su feedback.
 */
export const useTitularStatusActions = (titular: TitularResponse | null, onDone?: () => void) => {
  const [isDeactivateOpen, setDeactivateOpen] = useState(false);
  const [isReactivateOpen, setReactivateOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const { mutateAsync: deleteTitular, isPending: isDeactivating } = useDeleteTitular();
  const { mutateAsync: reactivateTitular, isPending: isReactivating } = useReactivarTitular();

  const confirmDeactivate = async () => {
    if (!titular) return;

    try {
      await deleteTitular(titular.id);
      showSuccess('Titular inactivado correctamente');
      setDeactivateOpen(false);
      onDone?.();
    } catch (error) {
      console.error('Error al inactivar titular', error);
      showError(resolveErrorMessage(error, 'No se pudo inactivar al titular'));
    }
  };

  const confirmReactivate = async (data?: TitularReactivarRequest) => {
    if (!titular) return;

    try {
      await reactivateTitular({ id: titular.id, data });
      showSuccess('Titular reactivado correctamente');
      setReactivateOpen(false);
      onDone?.();
    } catch (error) {
      console.error('Error al reactivar titular', error);
      showError(resolveErrorMessage(error, 'No se pudo reactivar al titular'));
    }
  };

  return {
    isDeactivateOpen,
    isReactivateOpen,
    isDeactivating,
    isReactivating,
    isPending: isDeactivating || isReactivating,
    openDeactivate: () => setDeactivateOpen(true),
    closeDeactivate: () => setDeactivateOpen(false),
    openReactivate: () => setReactivateOpen(true),
    closeReactivate: () => setReactivateOpen(false),
    confirmDeactivate,
    confirmReactivate,
  };
};
