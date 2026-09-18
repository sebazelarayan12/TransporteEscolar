import type { FormEvent } from 'react';
import { usePagosPorTitular, useRegistrarPago, useTitularesConPagos } from '../services/pagos.queries';
import { useToast } from '../../shared/hooks/useToast';
import { useDebounce } from '../../shared/hooks/useDebounce';
import { ordenarPagosPorPeriodo } from '../helpers/saldo.helpers';
import {
  buildConfirmacion,
  getRegistrarPagoErrorMessage,
  parseMonto,
  resolveTitularActivo,
} from '../helpers/registrar-pago.helpers';
import { useRegistrarPagoState } from './useRegistrarPagoState';

export const TITULARES_PAGE_SIZE = 10;

interface UseRegistrarPagoModalOptions {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Lógica del modal de registro manual de pago: selección de titular, formulario,
 * confirmación y registro del pago.
 */
export const useRegistrarPagoModal = ({ isOpen, onClose, onSuccess }: UseRegistrarPagoModalOptions) => {
  const state = useRegistrarPagoState();
  const { showSuccess, showError } = useToast();
  const registrarPago = useRegistrarPago();
  const debouncedSearch = useDebounce(state.search, 300);

  const titularesQuery = useTitularesConPagos(debouncedSearch.trim(), state.pageNumber, TITULARES_PAGE_SIZE, {
    enabled: isOpen,
  });
  const pagosQuery = usePagosPorTitular(state.selectedTitular?.id ?? null);

  const titulares = titularesQuery.data?.data ?? [];
  const pagosOrdenados = ordenarPagosPorPeriodo(pagosQuery.data ?? []);
  const monto = parseMonto(state.monto);
  const titularActivo = resolveTitularActivo(state.selectedTitular, titulares);
  const canSubmit =
    Boolean(titularActivo) && pagosOrdenados.length > 0 && monto.isValid && !registrarPago.isPending;

  const close = () => {
    state.closeConfirmacion();
    state.reset();
    onClose();
  };

  const closeConfirmacion = () => {
    if (!registrarPago.isPending) state.closeConfirmacion();
  };

  const openAdjustMonto = () => {
    if (titularActivo) state.setAdjustModalOpen(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const pago = pagosOrdenados[0];
    if (!titularActivo || !pago || !monto.isValid) return;

    state.openConfirmacion(
      buildConfirmacion({
        pago,
        titular: titularActivo,
        monto: monto.value,
        medioPago: state.medioPago,
        observaciones: state.observaciones,
      }),
    );
  };

  const confirmarPago = async () => {
    const { confirmacionPago } = state;
    if (!confirmacionPago) return;

    try {
      await registrarPago.mutateAsync({
        id: confirmacionPago.pagoId,
        data: {
          monto: confirmacionPago.monto,
          fechaPago: confirmacionPago.fechaPagoIso,
          medioPago: confirmacionPago.medioPago,
          observaciones: confirmacionPago.observaciones,
        },
      });
      showSuccess('Pago registrado correctamente');
      state.closeConfirmacion();
      state.reset();
      onClose();
      onSuccess();
    } catch (error) {
      showError(getRegistrarPagoErrorMessage(error));
    }
  };

  return {
    state,
    titulares,
    totalCount: titularesQuery.data?.totalCount ?? 0,
    titularesQuery,
    pagosQuery,
    titularActivo,
    canSubmit,
    isRegistrando: registrarPago.isPending,
    close,
    closeConfirmacion,
    openAdjustMonto,
    submit,
    confirmarPago,
  };
};
