import { useToast } from '../../shared/hooks/useToast';
import { useMarcarGastoVariablePagado } from '../services/gastos.queries';
import { buildMarkPaidMessage, getErrorMessage } from '../helpers/gastos-page.helpers';
import type { GastoItem } from '../types/gastos.types';

interface UseGastosMarkPaidOptions {
  target: GastoItem | null;
  setTarget: (gasto: GastoItem | null) => void;
  onMarked: () => void;
}

/**
 * Flujo de confirmación para marcar un gasto variable como pagado.
 */
export const useGastosMarkPaid = ({ target, setTarget, onMarked }: UseGastosMarkPaidOptions) => {
  const mutation = useMarcarGastoVariablePagado();
  const { showSuccess, showError } = useToast();

  const confirm = async () => {
    if (!target) return;

    try {
      await mutation.mutateAsync({ id: target.id, mes: target.mes, anio: target.anio });
      showSuccess('Gasto variable marcado como pagado');
      setTarget(null);
      onMarked();
    } catch (error) {
      showError(getErrorMessage(error, 'No pudimos marcar el gasto como pagado.'));
    }
  };

  const cancel = () => {
    if (!mutation.isPending) setTarget(null);
  };

  return {
    message: buildMarkPaidMessage(target),
    isPending: mutation.isPending,
    request: setTarget,
    confirm,
    cancel,
  };
};
